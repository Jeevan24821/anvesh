from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.crud import (
    get_notifications, 
    get_unread_notification_count,
    mark_notification_read, 
    mark_all_notifications_read
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the true unread notification count tailored to role and bureau."""
    effective_bureau = None
    if current_user.role == "Reviewer" and current_user.bureau and current_user.bureau != "All":
        effective_bureau = current_user.bureau

    count = get_unread_notification_count(
        db,
        bureau=effective_bureau,
        user_role=current_user.role,
        complainant_id=current_user.complainant_id
    )
    return {"unread_count": count}


@router.get("")
def list_notifications(
    bureau: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns notifications and statutory SLA alerts.
    Role-tailored:
    - Administrators receive GLOBAL notifications across all bureaus and complaints (or filter by specific bureau if selected).
    - Reviewers receive alerts for their assigned bureau.
    - Complainants receive updates on their complaints.
    """
    effective_bureau = bureau
    if current_user.role in ["Administrator", "Admin"]:
        effective_bureau = bureau if (bureau and bureau != "All") else None
    elif current_user.role == "Reviewer" and current_user.bureau and current_user.bureau != "All":
        effective_bureau = current_user.bureau

    return get_notifications(
        db,
        bureau=effective_bureau,
        unread_only=unread_only,
        category=category,
        limit=limit,
        user_role=current_user.role,
        complainant_id=current_user.complainant_id
    )


@router.post("/{notification_id}/read")
def set_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a single notification as read."""
    success = mark_notification_read(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.post("/read-all")
def set_all_read(
    bureau: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks all notifications as read for current official or bureau."""
    effective_bureau = bureau
    if current_user.role in ["Administrator", "Admin"]:
        effective_bureau = None
    elif current_user.role == "Reviewer":
        effective_bureau = current_user.bureau

    count = mark_all_notifications_read(db, bureau=effective_bureau)
    return {"message": f"Marked {count} notifications as read"}
