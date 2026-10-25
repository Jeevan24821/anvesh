import os
import re
import uuid
import json
import shutil
import mimetypes
from fastapi import APIRouter, Depends, Query, Header, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import User, Complaint, CaseAction, Notification, Institution
from app.auth import get_current_user, require_role
from app.schemas import (
    ComplaintCreate, ComplaintStatusUpdate, ComplaintActionTakenRequest, ComplaintTransfer, ComplaintEscalate,
    ComplaintAssign, ComplaintVerifyRequest, ComplaintInfoRequest, ComplaintInfoResponse,
    ComplaintRejectRequest, ComplaintFeedbackRequest, PriorityAssessmentRequest, PriorityAssessmentResponse
)
from app.crud import (
    get_complaints, get_complaint_by_id, create_complaint, update_complaint_status,
    transfer_complaint, escalate_complaint, assign_complaint,
    verify_complaint, record_action_taken, request_more_information, respond_to_info_request,
    reject_complaint, submit_complainant_feedback
)
from app.matcher import calculate_suggested_priority, suggest_bureau_routing

EVIDENCE_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "evidence")
os.makedirs(EVIDENCE_UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


@router.get("")
def list_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    bureau: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    institution_id: Optional[int] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    verification_status: Optional[str] = Query(None),
    complainant_id: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search, filter, sort, and paginate complaints across AICTE bureaus.
    Strictly enforced role authorization:
    - Complainants: CAN ONLY query and see complaints matching their authenticated identity.
    - Reviewers: Automatically scoped to complaints assigned to their bureau.
    - Administrators: Full cross-bureau oversight.
    """
    effective_bureau = bureau
    effective_complainant_id = complainant_id

    if current_user.role == "Complainant":
        effective_complainant_id = current_user.complainant_id or current_user.username
        effective_bureau = None  # Complainants should not have their cases blocked by bureau filters
    elif current_user.role == "Reviewer":
        # Reviewer is restricted to their assigned bureau
        if current_user.bureau and current_user.bureau != "All":
            effective_bureau = current_user.bureau

    items, total = get_complaints(
        db,
        skip=skip,
        limit=limit,
        search=search,
        bureau=effective_bureau,
        status=status,
        priority=priority,
        category=category,
        institution_id=institution_id,
        is_overdue=is_overdue,
        complainant_id=effective_complainant_id,
        verification_status=verification_status,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/assess-priority", response_model=PriorityAssessmentResponse)
def assess_priority_and_routing(
    req: PriorityAssessmentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Live rules-based priority and category-to-bureau assessment.
    Returns explainable priority score, rationale, and designated intake bureau before submission.
    """
    priority, pri_reason = calculate_suggested_priority(
        req.category, req.subject, req.description, req.complainant_type or "Student"
    )
    bureau, rout_reason = suggest_bureau_routing(
        req.category, req.subject, req.description
    )
    sla_map = {"Urgent": 15, "High": 30, "Medium": 45, "Low": 60}
    return {
        "suggested_priority": priority,
        "priority_reason": pri_reason,
        "suggested_bureau": bureau,
        "routing_reason": rout_reason,
        "statutory_sla_days": sla_map.get(priority, 45)
    }


@router.post("/upload-evidence")
async def upload_evidence(
    file: UploadFile = File(...),
    complaint_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts evidence file upload, validates extension & size, stores safely on server.
    If complaint_id is provided, attaches evidence to the case, logs CaseAction,
    and creates an EVIDENCE_SUBMITTED notification.
    Enforces role authorization:
    - Administrator: can attach evidence to any complaint.
    - Reviewer: can attach evidence to complaints in their assigned bureau.
    - Complainant: can attach evidence to their own complaint.
    """
    allowed_extensions = {".pdf", ".doc", ".docx"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, DOC, DOCX only."
        )

    # Magic byte validation signatures:
    # PDF: %PDF-
    # DOC: \xd0\xcf\x11\xe0 (Compound File Binary)
    # DOCX: PK\x03\x04 (ZIP container)
    magic_signatures = {
        ".pdf": b"%PDF-",
        ".doc": b"\xd0\xcf\x11\xe0",
        ".docx": b"PK\x03\x04"
    }

    complaint = None
    if complaint_id is not None:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found.")

        if current_user.role == "Complainant":
            if complaint.complainant_id != current_user.complainant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You can only attach evidence to your own complaints."
                )
        elif current_user.role == "Reviewer":
            if current_user.bureau and current_user.bureau != "All" and complaint.source_bureau != current_user.bureau:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied: Complaint is assigned to '{complaint.source_bureau}'. Your authorized jurisdiction is '{current_user.bureau}'."
                )

    # Generate unique safe filename
    safe_basename = re.sub(r"[^a-zA-Z0-9_.-]", "_", os.path.basename(file.filename))
    safe_filename = f"{uuid.uuid4().hex[:16]}_{safe_basename}"
    destination = os.path.join(EVIDENCE_UPLOAD_DIR, safe_filename)

    file_size = 0
    header_checked = False
    with open(destination, "wb") as buffer:
        while content := await file.read(1024 * 1024):  # 1MB chunks
            if not header_checked:
                expected_sig = magic_signatures.get(ext)
                if expected_sig and not content.startswith(expected_sig):
                    buffer.close()
                    if os.path.exists(destination):
                        os.remove(destination)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid file content for format '{ext}'. The file header does not match a valid {ext.upper()} document."
                    )
                header_checked = True

            file_size += len(content)
            if file_size > 10 * 1024 * 1024:  # 10MB limit as per Master Specification
                buffer.close()
                if os.path.exists(destination):
                    os.remove(destination)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File exceeds maximum allowable size (10 MB)."
                )
            buffer.write(content)

    # Format human-readable size
    if file_size < 1024:
        size_str = f"{file_size} B"
    elif file_size < 1024 * 1024:
        size_str = f"{round(file_size / 1024, 1)} KB"
    else:
        size_str = f"{round(file_size / (1024 * 1024), 2)} MB"

    # Write metadata sidecar for ownership validation before/after complaint binding
    meta_path = destination + ".meta"
    try:
        with open(meta_path, "w", encoding="utf-8") as meta_f:
            json.dump({
                "uploader": current_user.username,
                "role": current_user.role,
                "bureau": current_user.bureau,
                "complainant_id": current_user.complainant_id or current_user.username
            }, meta_f)
    except Exception:
        pass

    file_metadata = {
        "name": file.filename,
        "stored_name": safe_filename,
        "size": size_str,
        "type": file.content_type or ext.lstrip("."),
        "download_url": f"/api/complaints/evidence/{safe_filename}"
    }

    if complaint is not None:
        try:
            ev_list = json.loads(complaint.evidence_files) if complaint.evidence_files else []
        except Exception:
            ev_list = []
        ev_list.append(file_metadata)
        complaint.evidence_files = json.dumps(ev_list)

        actor_name = current_user.full_name or current_user.username
        action = CaseAction(
            complaint_id=complaint.id,
            action_type="Evidence Submitted",
            from_value=None,
            to_value=file.filename,
            actor_name=actor_name,
            actor_role=current_user.role,
            actor_bureau=complaint.source_bureau,
            remarks=f"Supporting proof file '{file.filename}' ({size_str}) uploaded.",
            is_internal=False
        )
        db.add(action)

        notif = Notification(
            type="EVIDENCE_SUBMITTED",
            title=f"Supporting Document Uploaded: Case {complaint.case_id}",
            message=f"New proof file '{file.filename}' submitted for Case {complaint.case_id} by {actor_name} ({current_user.role}).",
            severity="info",
            complaint_id=complaint.id,
            bureau=complaint.source_bureau
        )
        db.add(notif)
        db.commit()
        db.refresh(complaint)

    return file_metadata


@router.get("/evidence/{filename}")
def download_evidence(
    filename: str,
    download: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authorized evidence file download / browser inline preview.
    Enforces role-based authorization:
    - Administrator: can access evidence across all departments and complaints.
    - Department Reviewer: can only access evidence for complaints assigned to their department/bureau.
    - Complainant: can only access evidence for their own submitted complaints.
    - All others: 403 Forbidden.
    """
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(EVIDENCE_UPLOAD_DIR, safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence file '{safe_filename}' not found on server."
        )

    # Locate complaint associated with this evidence file
    complaint = db.query(Complaint).filter(Complaint.evidence_files.contains(safe_filename)).first()
    if not complaint:
        all_comps = db.query(Complaint).filter(Complaint.evidence_files != "[]", Complaint.evidence_files.isnot(None)).all()
        for c in all_comps:
            try:
                ev_list = json.loads(c.evidence_files) if c.evidence_files else []
                for item in ev_list:
                    if isinstance(item, dict):
                        if item.get("stored_name") == safe_filename or item.get("name") == safe_filename or item.get("name") == filename:
                            complaint = c
                            break
                    elif isinstance(item, str) and (item == safe_filename or item == filename):
                        complaint = c
                        break
                if complaint:
                    break
            except Exception:
                continue

    # Enforce Role-Based Access Control
    if current_user.role in ["Administrator", "Admin"]:
        # Universal cross-bureau oversight for administrator
        pass
    elif current_user.role == "Reviewer":
        if not complaint:
            meta_path = filepath + ".meta"
            is_authorized = False
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    if current_user.bureau == "All" or meta.get("bureau") == current_user.bureau or meta.get("uploader") == current_user.username:
                        is_authorized = True
                except Exception:
                    pass
            if not is_authorized:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Department users can only access evidence for complaints assigned to their bureau."
                )
        else:
            is_assigned_officer = (complaint.assigned_officer and complaint.assigned_officer == current_user.username)
            has_bureau_access = (current_user.bureau == "All" or complaint.source_bureau == current_user.bureau or is_assigned_officer)
            if not has_bureau_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied: This evidence belongs to complaint {complaint.case_id} under '{complaint.source_bureau}'. Your authorized jurisdiction is '{current_user.bureau}'."
                )
    elif current_user.role == "Complainant":
        if not complaint:
            meta_path = filepath + ".meta"
            is_owner = False
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    if (meta.get("uploader") == current_user.username or
                        (current_user.complainant_id and meta.get("complainant_id") == current_user.complainant_id)):
                        is_owner = True
                except Exception:
                    pass
            if not is_owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Complainants can only access evidence submitted for their own complaints."
                )
        else:
            is_owner = (
                complaint.complainant_id == current_user.complainant_id or
                complaint.complainant_id == current_user.username or
                (current_user.email and complaint.complainant_email == current_user.email)
            )
            if not is_owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You are not authorized to view evidence submitted by another complainant."
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to access this evidence document."
        )

    # Determine MIME type and Content-Disposition
    media_type, _ = mimetypes.guess_type(filepath)
    if not media_type:
        media_type = "application/octet-stream"

    previewable = media_type.startswith("image/") or media_type in ["application/pdf", "text/plain"]
    disposition_type = "attachment" if (download or not previewable) else "inline"

    return FileResponse(
        filepath,
        media_type=media_type,
        headers={
            "Content-Disposition": f'{disposition_type}; filename="{safe_filename}"',
            "Cache-Control": "private, no-cache, no-store, must-revalidate"
        }
    )


@router.get("/target-institutions")
def get_target_institutions_for_intake(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Provides a streamlined, non-sensitive list of approved institutions (id, name, aicte_id, state)
    strictly for selecting a target institution when filing a complaint.
    Does NOT expose any complaint statistics, overdue metrics, or overlap intelligence.
    """
    institutions = db.query(Institution).order_by(Institution.name).all()
    return [
        {
            "id": inst.id,
            "name": inst.name,
            "aicte_id": inst.aicte_id,
            "state": inst.state
        }
        for inst in institutions
    ]


@router.get("/{complaint_id}")
def get_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns complete complaint details, action timeline, and linked overlaps.
    Strictly filters confidential reviewer notes and blocks unauthorized cross-user access.
    """
    comp = get_complaint_by_id(
        db,
        complaint_id,
        user_role=current_user.role,
        caller_complainant_id=current_user.complainant_id
    )
    if not comp:
        raise HTTPException(
            status_code=404,
            detail="Complaint case not found or you are not authorized to view this record."
        )

    # Reviewer isolation: reviewer cannot inspect other bureau's complaints unless assigned
    if current_user.role == "Reviewer" and current_user.bureau and current_user.bureau != "All":
        if comp.get("source_bureau") != current_user.bureau:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: This complaint is assigned to '{comp.get('source_bureau')}'. Your authorized jurisdiction is '{current_user.bureau}'."
            )

    return comp


@router.post("", status_code=status.HTTP_201_CREATED)
def register_complaint(
    comp_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registers a new complaint and triggers transparent overlap detection."""
    # Administrators are strictly restricted from registering complaints
    if current_user.role in ["Administrator", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot register complaints. Complaint registration is strictly reserved for Complainants."
        )

    # Validate minimum 150-character narrative description as per Master Mandate
    desc_clean = (comp_in.description or "").strip()
    if len(desc_clean) < 150:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Complaint description must be at least 150 characters for comprehensive investigation (currently {len(desc_clean)} characters)."
        )

    # Ensure complainant cannot impersonate another identity
    if current_user.role == "Complainant":
        comp_in.complainant_id = current_user.complainant_id or current_user.username
        comp_in.complainant_name = current_user.full_name
        if current_user.email:
            comp_in.complainant_email = current_user.email
        if current_user.phone:
            comp_in.complainant_phone = current_user.phone

    actor_name = current_user.full_name or "AICTE Portal"
    return create_complaint(db, comp_in, actor_name=actor_name)


@router.post("/{complaint_id}/verify")
def verify_case(
    complaint_id: int,
    req: ComplaintVerifyRequest,
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer"])),
    db: Session = Depends(get_db)
):
    """Reviewer workspace action: Verifies and accepts complaint with confirmed priority & reason."""
    # Reviewer jurisdiction check
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "Reviewer" and current_user.bureau != "All" and comp.source_bureau != current_user.bureau:
        raise HTTPException(status_code=403, detail="Forbidden: You can only verify complaints in your assigned bureau.")

    verified = verify_complaint(
        db,
        complaint_id=complaint_id,
        confirmed_priority=req.confirmed_priority,
        priority_override_reason=req.priority_override_reason,
        verified_by=current_user.full_name or req.verified_by,
        remarks=req.remarks
    )
    return verified


@router.post("/{complaint_id}/request-info")
def request_info(
    complaint_id: int,
    req: ComplaintInfoRequest,
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer"])),
    db: Session = Depends(get_db)
):
    """Reviewer workspace action: Flags case as Needs More Information and sends query to complainant."""
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "Reviewer" and current_user.bureau != "All" and comp.source_bureau != current_user.bureau:
        raise HTTPException(status_code=403, detail="Forbidden: Jurisdiction mismatch.")

    updated = request_more_information(
        db,
        complaint_id=complaint_id,
        request_notes=req.request_notes,
        requested_by=current_user.full_name or req.requested_by
    )
    return updated


@router.post("/{complaint_id}/respond-info")
def respond_info(
    complaint_id: int,
    req: ComplaintInfoResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complainant action: Submits clarification and resumes case verification."""
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "Complainant" and comp.complainant_id != current_user.complainant_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot respond to inquiries on another user's complaint.")

    updated = respond_to_info_request(
        db,
        complaint_id=complaint_id,
        response_notes=req.response_notes,
        complainant_id=current_user.complainant_id or req.complainant_id
    )
    return updated


@router.post("/{complaint_id}/reject")
def reject_case(
    complaint_id: int,
    req: ComplaintRejectRequest,
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer"])),
    db: Session = Depends(get_db)
):
    """Reviewer workspace action: Rejects complaint with mandatory justification."""
    if not req.rejection_reason or not req.rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Mandatory rejection reason must be provided.")

    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "Reviewer" and current_user.bureau != "All" and comp.source_bureau != current_user.bureau:
        raise HTTPException(status_code=403, detail="Forbidden: Jurisdiction mismatch.")

    rejected = reject_complaint(
        db,
        complaint_id=complaint_id,
        rejection_reason=req.rejection_reason.strip(),
        rejected_by=current_user.full_name or req.rejected_by
    )
    return rejected


@router.post("/{complaint_id}/action-taken")
def record_action(
    complaint_id: int,
    req: ComplaintActionTakenRequest,
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer"])),
    db: Session = Depends(get_db)
):
    """
    Subsequent department/admin action process after reviewer acceptance.
    Allows authorized officials to record inquiry progress, directives, or final resolution.
    """
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "Reviewer" and current_user.bureau != "All" and comp.source_bureau != current_user.bureau:
        raise HTTPException(status_code=403, detail="Forbidden: You can only record actions for complaints in your assigned bureau.")

    actor_name = current_user.full_name or current_user.username
    actor_role = current_user.role
    actor_bureau = current_user.bureau if current_user.bureau and current_user.bureau != "All" else comp.source_bureau

    updated = record_action_taken(
        db,
        complaint_id=complaint_id,
        action_data=req,
        actor_name=actor_name,
        actor_role=actor_role,
        actor_bureau=actor_bureau
    )
    return updated


@router.post("/{complaint_id}/feedback")
def submit_feedback(
    complaint_id: int,
    req: ComplaintFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complainant action: Submits optional post-closure satisfaction feedback."""
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "Complainant" and comp.complainant_id != current_user.complainant_id and comp.complainant_id != current_user.username:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied.")

    fb_text = req.feedback or req.feedback_text or ""
    updated = submit_complainant_feedback(
        db,
        complaint_id=complaint_id,
        rating=req.rating,
        feedback=fb_text
    )
    return updated


@router.post("/{complaint_id}/status")
def change_status(
    complaint_id: int,
    status_update: ComplaintStatusUpdate,
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer"])),
    db: Session = Depends(get_db)
):
    """Updates complaint status and appends an immutable action history entry."""
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "Reviewer" and current_user.bureau != "All" and comp.source_bureau != current_user.bureau:
        raise HTTPException(status_code=403, detail="Forbidden: Jurisdiction mismatch.")

    status_update.actor_name = current_user.full_name or status_update.actor_name
    status_update.actor_role = current_user.role
    updated = update_complaint_status(db, complaint_id, status_update)
    return updated


@router.post("/{complaint_id}/transfer")
def transfer_bureau(
    complaint_id: int,
    transfer_data: ComplaintTransfer,
    current_user: User = Depends(require_role(["Administrator", "Admin"])),
    db: Session = Depends(get_db)
):
    """Transfers jurisdiction to another AICTE bureau and triggers re-matching (Admin only)."""
    transfer_data.transferred_by = current_user.full_name or transfer_data.transferred_by
    transferred = transfer_complaint(db, complaint_id, transfer_data)
    if not transferred:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return transferred


@router.post("/{complaint_id}/escalate")
def escalate_case(
    complaint_id: int,
    escalate_data: ComplaintEscalate,
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer"])),
    db: Session = Depends(get_db)
):
    """Escalates case to an Apex Committee / Higher Authority."""
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    escalate_data.escalated_by = current_user.full_name or escalate_data.escalated_by
    escalated = escalate_complaint(db, complaint_id, escalate_data)
    return escalated


@router.post("/{complaint_id}/assign")
def assign_officer(
    complaint_id: int,
    assign_data: ComplaintAssign,
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer"])),
    db: Session = Depends(get_db)
):
    """Assigns an officer to lead investigation and resolution."""
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    assign_data.assigned_by = current_user.full_name or assign_data.assigned_by
    assigned = assign_complaint(db, complaint_id, assign_data)
    return assigned
