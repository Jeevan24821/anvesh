from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.auth import get_current_user, require_role
from app.crud import get_dashboard_stats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def fetch_dashboard_stats(
    bureau: Optional[str] = Query(None, description="Optional bureau filter"),
    current_user: User = Depends(require_role(["Administrator", "Admin", "Reviewer", "Viewer", "Complainant"])),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated real-time metrics, workload distribution, and overdue tallies.
    For Complainants, returns their personal grievance monitoring metrics and recent cases.
    For Reviewers, returns metrics scoped to their assigned bureau.
    For Administrators and Viewers, returns global or filtered inter-bureau intelligence.
    """
    if current_user.role == "Complainant":
        c_id = current_user.complainant_id or current_user.username
        return get_dashboard_stats(db, complainant_id=c_id)

    effective_bureau = bureau
    if current_user.role == "Reviewer" and current_user.bureau and current_user.bureau != "All":
        # Reviewer scoped to their bureau
        effective_bureau = current_user.bureau

    return get_dashboard_stats(db, bureau=effective_bureau)
