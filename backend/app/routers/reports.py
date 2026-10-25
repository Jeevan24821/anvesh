import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.auth import get_current_user, require_role
from app.crud import get_reports_summary, get_complaints

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])


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

    # Standardized Official AICTE Header
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
        "Received Date",
        "Due Date",
        "Disposed Date"
    ])

    for c in items:
        writer.writerow([
            c["case_id"],
            c["institution_aicte_id"],
            c["institution_name"],
            c["institution_region"],
            c["institution_state"],
            c["source_bureau"],
            c["category"],
            c["subject"],
            c["priority"],
            c["status"],
            "YES" if c["is_overdue"] else "NO",
            c["days_overdue"],
            c["days_remaining"],
            c["assigned_officer"],
            c["received_date"],
            c["due_date"],
            c["disposed_date"] or "N/A"
        ])

    csv_data = output.getvalue()
    filename = f"SENTRIX_AICTE_Complaints_Report_{date.today().isoformat()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
