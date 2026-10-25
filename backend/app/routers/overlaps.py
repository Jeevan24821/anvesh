from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, OverlapAlert, Complaint
from app.auth import get_current_user, require_role
from app.schemas import OverlapReviewRequest
from app.crud import get_overlap_alerts, review_overlap_alert
from app.matcher import run_full_overlap_scan

router = APIRouter(prefix="/api/overlaps", tags=["Overlap Detection"])


@router.get("")
def list_overlap_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    confidence: Optional[str] = Query(None),
    overlap_type: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer", "Viewer"])),
    db: Session = Depends(get_db)
):
    """
    Lists transparently detected cross-bureau overlaps and potential duplicates.
    Reviewers are scoped to alerts involving their assigned bureau.
    Complainants are strictly forbidden from viewing internal overlap intelligence.
    """
    bureau_filter = None
    if current_user.role == "Reviewer" and current_user.bureau and current_user.bureau != "All":
        bureau_filter = current_user.bureau

    items, total = get_overlap_alerts(
        db,
        skip=skip,
        limit=limit,
        status=status,
        confidence=confidence,
        overlap_type=overlap_type,
        bureau=bureau_filter
    )
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/{alert_id}/review")
def submit_review(
    alert_id: int,
    review_in: OverlapReviewRequest,
    current_user: User = Depends(require_role(["Administrator", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Administrator-authorized overlap decision workflow:
    1. Keep cases separate (Dismiss / Separate Investigation)
    2. Link for cross-bureau coordination (Confirm Link / Joint Investigation)
    3. Transfer / merge handling under lead bureau (Transfer Bureau / Confirm Duplicate)
    Requires confirmation remarks and logs complete audit trail.
    """
    result = review_overlap_alert(
        db,
        alert_id=alert_id,
        decision=review_in.decision,
        reviewed_by=current_user.full_name or review_in.reviewed_by,
        remarks=review_in.remarks,
        target_bureau=review_in.target_bureau,
        primary_case_id=review_in.primary_case_id,
        decision_type=getattr(review_in, "decision_type", None),
        lead_bureau=getattr(review_in, "lead_bureau", None),
        affected_bureaus=getattr(review_in, "affected_bureaus", None),
        assigned_officer=getattr(review_in, "assigned_officer", None),
        justification=getattr(review_in, "justification", None) or review_in.remarks
    )
    if not result:
        raise HTTPException(status_code=404, detail="Overlap alert not found")
    return result


@router.post("/scan")
def trigger_manual_scan(
    current_user: User = Depends(require_role(["Administrator", "Admin"])),
    db: Session = Depends(get_db)
):
    """Triggers an on-demand scan across all active complaints using local matching algorithms."""
    new_alerts = run_full_overlap_scan(db)
    return {"message": "Scan completed", "new_alerts_detected": new_alerts}
