import pytest
from datetime import date, timedelta
from app.database import SessionLocal
from app.models import Complaint, CaseAction, Institution
from app.schemas import (
    ComplaintCreate, ComplaintStatusUpdate, ComplaintTransfer, ComplaintAssign
)
from app.crud import (
    create_complaint, update_complaint_status, transfer_complaint, assign_complaint,
    get_complaint_by_id
)

def test_complaint_creation_and_audit_log():
    """Tests complaint creation, auto case_id generation, and initial audit action logging."""
    db = SessionLocal()
    try:
        inst = db.query(Institution).first()
        due_d = date.today() + timedelta(days=20)

        comp_in = ComplaintCreate(
            institution_id=inst.id,
            source_bureau="PGRC (Public Grievance Redressal)",
            complainant_type="Student",
            complainant_name="Aarav Sharma",
            category="Fee Overcharging / Capitation",
            subject="Test unauthorized fee demand",
            description="Detailed grievance description for automated test suite.",
            priority="High",
            due_date=due_d
        )

        created = create_complaint(db, comp_in, actor_name="Test Automation Officer")
        assert created["id"] is not None
        assert created["case_id"].startswith("AICTE-2026-PGRC-")
        assert created["status"] in ["Submitted", "New"]
        assert created["verification_status"] in ["Submitted", "Pending Verification"]
        assert created["institution_name"] == inst.name

        # Verify audit history
        comp_details = get_complaint_by_id(db, created["id"])
        actions = comp_details["actions"]
        assert len(actions) >= 1
        initial_action = [a for a in actions if a["action_type"] in ["Complaint Registered", "Grievance Registered"]][0]
        assert initial_action["actor_name"] == "Test Automation Officer"
        assert "Aarav Sharma" in initial_action["remarks"] or "portal" in initial_action["remarks"].lower()
    finally:
        db.close()

def test_complaint_status_transition_and_immutability():
    """Tests updating complaint status and verifying immutable history trace."""
    db = SessionLocal()
    try:
        c = db.query(Complaint).filter(Complaint.status.in_(["Submitted", "New"])).first()
        assert c is not None
        initial_status = c.status

        update_payload = ComplaintStatusUpdate(
            status="Under Process",
            actor_name="Dr. Sunita Sharma",
            actor_role="Chief Redressal Officer",
            remarks="Scrutiny of bank transaction receipts initiated."
        )

        updated = update_complaint_status(db, c.id, update_payload)
        assert updated["status"] == "Under Process"

        # Check action trace
        recent_action = updated["actions"][0]
        assert recent_action["action_type"] == "Status Change"
        assert recent_action["from_value"] == initial_status
        assert recent_action["to_value"] == "Under Process"
        assert recent_action["actor_name"] == "Dr. Sunita Sharma"
        assert "bank transaction" in recent_action["remarks"]
    finally:
        db.close()

def test_complaint_cross_bureau_transfer():
    """Tests transferring a case between bureaus and recording jurisdiction history."""
    db = SessionLocal()
    try:
        # Create a dedicated case for transfer testing to preserve demo cases
        inst = db.query(Institution).first()
        comp_in = ComplaintCreate(
            institution_id=inst.id,
            source_bureau="PGRC (Public Grievance Redressal)",
            complainant_type="Student",
            complainant_name="Transfer Test Complainant",
            category="Withholding Original Certificates",
            subject="Case intended for cross-bureau transfer test",
            description="Testing jurisdictional transfer to Regulation Bureau.",
            priority="Medium",
            due_date=date.today() + timedelta(days=15)
        )
        created = create_complaint(db, comp_in, actor_name="Transfer Initiator")
        c_id = created["id"]

        target = "Regulation Bureau (RB)"
        transfer_payload = ComplaintTransfer(
            target_bureau=target,
            actor_name="Central Review Board",
            actor_role="Member Secretary",
            remarks="Grievance involves institutional trust norms violation requiring Regulation Bureau jurisdiction."
        )

        transferred = transfer_complaint(db, c_id, transfer_payload)
        assert transferred["source_bureau"] == target
        assert transferred["status"] == "Transferred"

        transfer_actions = [a for a in transferred["actions"] if a["action_type"] == "Bureau Transfer"]
        assert len(transfer_actions) > 0
        action = transfer_actions[0]
        assert action["to_value"] == target
        assert "Regulation Bureau jurisdiction" in action["remarks"]
    finally:
        db.close()

def test_officer_assignment():
    """Tests assigning an officer to a complaint."""
    db = SessionLocal()
    try:
        c = db.query(Complaint).first()
        assign_payload = ComplaintAssign(
            officer_name="Er. Rajesh Verma (Joint Director)",
            bureau="Regulation Bureau (RB)",
            assigned_by="Member Secretary",
            remarks="Assigned for direct hearing and inquiry."
        )

        assigned = assign_complaint(db, c.id, assign_payload)
        assert assigned["assigned_officer"] == "Er. Rajesh Verma (Joint Director)"
        assert len(assigned["assignments"]) > 0
    finally:
        db.close()

def test_reviewer_verification_and_complainant_isolation():
    """Tests verification workflow and strict isolation of internal notes from complainants."""
    from app.crud import verify_complaint, request_more_information, respond_to_info_request
    db = SessionLocal()
    try:
        inst = db.query(Institution).first()
        comp_in = ComplaintCreate(
            institution_id=inst.id,
            source_bureau="PGRC (Public Grievance Redressal)",
            complainant_type="Student",
            complainant_name="Isolation Test Student",
            complainant_id="1DS22CS999",
            category="Harassment / Ragging",
            subject="Urgent safety complaint for verification test",
            description="Testing verification and role-based privacy isolation.",
            priority="Urgent"
        )
        created = create_complaint(db, comp_in, actor_name="Student Portal")
        cid = created["id"]

        # Request more information
        req = request_more_information(db, cid, "Please upload official fee receipt", requested_by="Reviewer Dr. Sunita")
        assert req["status"] == "Needs More Information"
        assert req["verification_status"] == "Needs More Information"

        # Complainant responds
        resp = respond_to_info_request(db, cid, "Attached payment slip dated 12/04/2026")
        assert resp["verification_status"] == "Pending Verification"

        # Reviewer verifies and accepts
        verified = verify_complaint(db, cid, verified_by="Reviewer Dr. Sunita", remarks="Documents fully verified")
        assert verified["verification_status"] == "Verified"
        assert verified["status"] == "Under Review"

        # Check complainant view isolation
        comp_view = get_complaint_by_id(db, cid, user_role="Complainant", caller_complainant_id="1DS22CS999")
        assert comp_view is not None
        # Internal actions should not be visible to complainant
        assert all(not a.get("is_internal", False) for a in comp_view["actions"])

        # Another complainant should NOT be able to access this case
        unauth_view = get_complaint_by_id(db, cid, user_role="Complainant", caller_complainant_id="OTHER_STUDENT_ID")
        assert unauth_view is None
    finally:
        db.close()

def test_complaint_recency_sorting_and_pagination():
    """Tests that complaints are strictly sorted by submission recency (newest first) with stable tiebreaker."""
    from app.crud import get_complaints
    db = SessionLocal()
    try:
        # 1. Query page 1 (descending)
        items_p1, total = get_complaints(db, skip=0, limit=15, sort_by="created_at", sort_order="desc")
        assert total > 0
        assert len(items_p1) > 0

        # Verify items are in strictly non-ascending chronological order
        for i in range(len(items_p1) - 1):
            curr = items_p1[i]
            nxt = items_p1[i + 1]
            # Primary sort: received_date
            assert curr["received_date"] >= nxt["received_date"]
            if curr["received_date"] == nxt["received_date"]:
                # Secondary sort: created_at
                assert curr["created_at"] >= nxt["created_at"]
                if curr["created_at"] == nxt["created_at"]:
                    # Tertiary stable sort: id
                    assert curr["id"] > nxt["id"]

        # 2. Query page 2 (descending) and verify pagination continuity
        items_p2, _ = get_complaints(db, skip=15, limit=15, sort_by="created_at", sort_order="desc")
        if items_p2:
            last_p1 = items_p1[-1]
            first_p2 = items_p2[0]
            assert last_p1["received_date"] >= first_p2["received_date"]
            if last_p1["received_date"] == first_p2["received_date"]:
                assert last_p1["created_at"] >= first_p2["created_at"]
                if last_p1["created_at"] == first_p2["created_at"]:
                    assert last_p1["id"] > first_p2["id"]

        # 3. Query ascending (oldest first)
        items_asc, _ = get_complaints(db, skip=0, limit=15, sort_by="created_at", sort_order="asc")
        for i in range(len(items_asc) - 1):
            curr = items_asc[i]
            nxt = items_asc[i + 1]
            assert curr["received_date"] <= nxt["received_date"]
            if curr["received_date"] == nxt["received_date"]:
                assert curr["created_at"] <= nxt["created_at"]
                if curr["created_at"] == nxt["created_at"]:
                    assert curr["id"] < nxt["id"]

        # 4. Complainant query scoped sorting
        comp_items, comp_total = get_complaints(
            db, skip=0, limit=10, complainant_id="user_demo", sort_by="created_at", sort_order="desc"
        )
        assert comp_total > 0
        for i in range(len(comp_items) - 1):
            assert comp_items[i]["received_date"] >= comp_items[i + 1]["received_date"]
    finally:
        db.close()


