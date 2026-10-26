import csv
import io
import re
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.auth import get_current_user, require_role
from app.crud import get_reports_summary, get_complaints, get_overlap_alerts

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])


def format_date_str(val) -> str:
    """Format dates safely as standard YYYY-MM-DD text so spreadsheets avoid ### hash marks."""
    if not val:
        return "N/A"
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    return s[:10] if len(s) >= 10 else s


def format_datetime_str(val) -> str:
    """Format timestamps safely as standard YYYY-MM-DD HH:MM:SS text so spreadsheets avoid ### hash marks."""
    if not val:
        return "N/A"
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    s = str(val).replace("T", " ").strip()
    return s[:19] if len(s) >= 19 else s


@router.get("/summary")
def fetch_reports_summary(
    bureau: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer", "Viewer"])),
    db: Session = Depends(get_db)
):
    """
    Returns analytics for bureau disposal rates, ageing buckets, and regional trends.
    Authorized for administrators, bureau reviewers, and external auditors.
    """
    effective_bureau = bureau
    if current_user.role == "Reviewer" and current_user.bureau and current_user.bureau != "All":
        effective_bureau = current_user.bureau

    return get_reports_summary(db, bureau=effective_bureau)


@router.get("/export-csv")
def export_complaints_csv(
    bureau: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer", "Viewer"])),
    db: Session = Depends(get_db)
):
    """
    Exports filtered complaint records directly as a downloadable standard CSV.
    Enforces role-based data hygiene: Reviewers can only export within their jurisdiction.
    Ensures submission, creation, resolution, and review timestamps are exported from the correct stored fields.
    """
    effective_bureau = bureau
    if current_user.role == "Reviewer" and current_user.bureau and current_user.bureau != "All":
        effective_bureau = current_user.bureau

    items, _ = get_complaints(
        db,
        skip=0,
        limit=10000,
        bureau=effective_bureau,
        status=status_filter,
        priority=priority,
        is_overdue=is_overdue,
        sort_by="received_date",
        sort_order="desc"
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Standardized Official AICTE Header (Case ID, AICTE Institution ID first for compatibility)
    writer.writerow([
        "Case ID",
        "AICTE Institution ID",
        "Institution Name",
        "Region",
        "State",
        "Assigned Bureau",
        "Category",
        "Subject",
        "Priority",
        "Status",
        "Is Overdue",
        "Days Overdue",
        "Days Remaining",
        "Assigned Officer",
        "Submission Timestamp",
        "Received Date",
        "Target Due Date",
        "Last Review Date",
        "Resolution Date"
    ])

    for c in items:
        writer.writerow([
            c.get("case_id", ""),
            c.get("institution_aicte_id", ""),
            c.get("institution_name", ""),
            c.get("institution_region", ""),
            c.get("institution_state", ""),
            c.get("source_bureau", ""),
            c.get("category", ""),
            c.get("subject", ""),
            c.get("priority", ""),
            c.get("status", ""),
            "YES" if c.get("is_overdue") else "NO",
            c.get("days_overdue", 0),
            c.get("days_remaining", 0),
            c.get("assigned_officer", "Unassigned"),
            format_datetime_str(c.get("created_at")),
            format_date_str(c.get("received_date")),
            format_date_str(c.get("due_date")),
            format_date_str(c.get("last_action_date")),
            format_date_str(c.get("disposed_date")) if c.get("disposed_date") else "Under Investigation"
        ])

    csv_data = output.getvalue()
    filename = f"ANVESH_AICTE_Complaints_Report_{date.today().isoformat()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export-overlaps-csv")
def export_overlaps_csv(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer", "Viewer"])),
    db: Session = Depends(get_db)
):
    """
    Exports overlap intelligence alerts to CSV with cleanly formatted dates,
    actual component similarity scores, and review audit history.
    """
    alerts, _ = get_overlap_alerts(
        db,
        skip=0,
        limit=10000,
        status=status_filter if status_filter != "All" else None
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Alert ID",
        "Institution Name",
        "AICTE Permanent ID",
        "Case 1 ID",
        "Case 1 Bureau",
        "Case 1 Status",
        "Case 1 Received Date",
        "Case 2 ID",
        "Case 2 Bureau",
        "Case 2 Status",
        "Case 2 Received Date",
        "Overlap Classification",
        "Overall Similarity Score",
        "Institution Match Score",
        "Narrative Match Score",
        "Category Match Score",
        "Alert Status",
        "Review Decision",
        "Reviewed By",
        "Review Timestamp",
        "Review Remarks",
        "Detection Timestamp"
    ])

    for a in alerts:
        score = a.get("confidence_score", 0)
        score_pct = f"{int(round(score * 100))}%" if score <= 1.0 else f"{int(round(score))}%"

        reasons = a.get("match_reasons") or []
        inst_sim = "N/A"
        narrative_sim = "N/A"
        cat_sim = "N/A"

        for r in reasons:
            if not isinstance(r, str):
                continue
            if "Exact AICTE Permanent Institution ID verified" in r:
                inst_sim = "100%"
            elif "institution name variant match" in r:
                m = re.search(r"(\d+)%", r)
                if m:
                    inst_sim = f"{m.group(1)}%"
            if "Identical grievance category" in r:
                cat_sim = "100%"
            if "High narrative overlap" in r:
                m = re.search(r"(\d+)%", r)
                if m:
                    narrative_sim = f"{m.group(1)}%"

        writer.writerow([
            a.get("id", ""),
            a.get("institution_1_name", ""),
            a.get("institution_1_aicte_id", ""),
            a.get("case_1_id", ""),
            a.get("case_1_bureau", ""),
            a.get("case_1_status", ""),
            format_date_str(a.get("case_1_received_date")),
            a.get("case_2_id", ""),
            a.get("case_2_bureau", ""),
            a.get("case_2_status", ""),
            format_date_str(a.get("case_2_received_date")),
            a.get("overlap_type", ""),
            score_pct,
            inst_sim,
            narrative_sim,
            cat_sim,
            a.get("status", ""),
            a.get("review_decision") or "Pending Review",
            a.get("reviewed_by") or "Unassigned",
            format_datetime_str(a.get("reviewed_at")),
            a.get("review_remarks") or "Awaiting administrative review",
            format_datetime_str(a.get("created_at"))
        ])

    csv_data = output.getvalue()
    filename = f"ANVESH_AICTE_Overlaps_Report_{date.today().isoformat()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
