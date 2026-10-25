import pytest
from app.database import SessionLocal
from app.models import Institution, Complaint, OverlapAlert, Notification, User

def test_database_initialization_and_seed():
    """Verifies that SQLite initializes properly and sample data is populated."""
    db = SessionLocal()
    try:
        inst_count = db.query(Institution).count()
        complaint_count = db.query(Complaint).count()
        user_count = db.query(User).count()
        overlap_count = db.query(OverlapAlert).count()
        notif_count = db.query(Notification).count()

        assert inst_count >= 40, f"Expected at least 40 institutions, found {inst_count}"
        assert complaint_count >= 200, f"Expected at least 200 complaints, found {complaint_count}"
        assert user_count >= 4, f"Expected demo users, found {user_count}"
        assert overlap_count > 0, f"Expected detected overlaps, found {overlap_count}"
        assert notif_count > 0, f"Expected notifications, found {notif_count}"

        # Verify an institution record fields
        first_inst = db.query(Institution).first()
        assert first_inst.aicte_id.startswith("1-")
        assert len(first_inst.name) > 0
        assert first_inst.normalized_name is not None
        assert first_inst.region in ["Northern", "Southern", "Western", "Eastern", "Central", "South-West", "North-West", "South-Central"]

        # Verify relationship back-population
        assert len(first_inst.complaints) > 0
        assert first_inst.complaints[0].institution.id == first_inst.id
    finally:
        db.close()
