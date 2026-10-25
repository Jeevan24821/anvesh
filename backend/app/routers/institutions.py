from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.crud import get_institutions, get_institution_by_id

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])

# Explicitly authorized administrative and review staff roles
AUTHORIZED_STAFF_ROLES = ["Administrator", "Admin", "Reviewer", "Bureau Officer", "Viewer"]


@router.get("")
def list_institutions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists technical institutions with search, filters, pagination, and aggregated complaint statistics.
    Strictly restricted to authorized administrative and reviewer staff roles.
    Denies all Complainant roles (Students, Parents/Guardians, Institution Representatives).
    """
    if current_user.role == "Complainant" or current_user.role not in AUTHORIZED_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: The Institution Directory, aggregated complaint statistics, overdue metrics, and overlap intelligence are restricted to authorized AICTE staff and reviewers."
        )

    items, total = get_institutions(db, skip=skip, limit=limit, search=search, region=region, state=state)
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{institution_id}")
def get_institution_details(
    institution_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns detailed institution profile along with consolidated multi-bureau complaint history.
    Strictly restricted to authorized administrative and reviewer staff roles.
    Denies all Complainant roles (Students, Parents/Guardians, Institution Representatives).
    """
    if current_user.role == "Complainant" or current_user.role not in AUTHORIZED_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Institutional complaint history, overdue metrics, and directory details are restricted to authorized AICTE staff and reviewers."
        )

    inst = get_institution_by_id(db, institution_id)
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    return inst
