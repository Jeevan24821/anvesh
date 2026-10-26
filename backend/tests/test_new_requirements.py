import os
import sys
import io
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import SessionLocal
from app.models import Complaint, Notification, User, CaseAction

client = TestClient(app)

@pytest.fixture
def tokens():
    """Retrieve auth tokens for test users across roles."""
    roles = {
        "admin": ("admin", "Admin@123"),
        "reviewer_pgrc": ("reviewer_pgrc", "Reviewer@123"),
        "reviewer_rb": ("reviewer_rb", "Reviewer@123"),
        "student": ("student", "Student@123"),
        "parent": ("parent", "Parent@123"),
    }
    toks = {}
    for r, (u, p) in roles.items():
        res = client.post("/api/auth/login", json={"username": u, "password": p})
        assert res.status_code == 200, f"Login failed for {u}: {res.text}"
        toks[r] = res.json()["access_token"]
    return toks


def test_admin_cannot_register_complaints(tokens):
    """
    Requirement 4: The administrator must not have an option to register complaints.
    Backend must enforce 403 Forbidden for Admin role.
    """
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    payload = {
        "institution_id": 1,
        "complainant_name": "Dr. Administrator",
        "category": "Fee Overcharging / Capitation",
        "subject": "Admin should not be able to file grievances",
        "description": "Attempting grievance filing as central administrator.",
        "complainant_affiliation": "Student"
    }

    res = client.post("/api/complaints", json=payload, headers=admin_headers)
    assert res.status_code == 403
    assert "administrators cannot register complaints" in res.json()["detail"].lower()


def test_complainant_can_register_complaint_and_generates_notifications(tokens):
    """
    Requirement 2 & 4: Complainant can lodge grievances; generates intake & evidence notifications.
    """
    student_headers = {"Authorization": f"Bearer {tokens['student']}"}
    
    # Upload test evidence first
    fake_pdf = b"%PDF-1.4 Mock receipt content for notification and intake verification."
    files = {"file": ("tuition_proof.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    up_res = client.post("/api/complaints/upload-evidence", files=files, headers=student_headers)
    assert up_res.status_code == 200
    ev_meta = up_res.json()

    payload = {
        "institution_id": 1,
        "complainant_name": "Priya Nair",
        "category": "Fee Overcharging / Capitation",
        "subject": "Arbitrary Infrastructure Fee Demand 2026",
        "description": "College demanded Rs 45,000 extra laboratory surcharge without AICTE approval. Students were threatened with debarment from semester exams if the amount was not deposited immediately.",
        "complainant_affiliation": "Student",
        "evidence_files": [ev_meta]
    }

    create_res = client.post("/api/complaints", json=payload, headers=student_headers)
    assert create_res.status_code == 201
    comp = create_res.json()
    assert comp["id"] is not None
    assert comp["case_id"] is not None
    comp_id = comp["id"]

    # Verify notifications created: NEW_COMPLAINT and EVIDENCE_SUBMITTED
    db = SessionLocal()
    notifs = db.query(Notification).filter(Notification.complaint_id == comp_id).all()
    types = [n.type for n in notifs]
    assert "NEW_COMPLAINT" in types
    assert "EVIDENCE_SUBMITTED" in types
    db.close()


def test_proof_file_access_role_based_permissions(tokens):
    """
    Requirement 1:
    - Admin can view proof for any complaint across departments.
    - Department Reviewer can view proof for complaints in their department.
    - Department Reviewer is denied (403) for complaints in another department.
    - Complainant can view proof for their own complaint.
    - Complainant is denied (403) for another complainant's complaint.
    - Unauthenticated request is rejected (401).
    - Missing file returns 404.
    """
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    pgrc_headers = {"Authorization": f"Bearer {tokens['reviewer_pgrc']}"}
    rb_headers = {"Authorization": f"Bearer {tokens['reviewer_rb']}"}
    student_headers = {"Authorization": f"Bearer {tokens['student']}"}
    parent_headers = {"Authorization": f"Bearer {tokens['parent']}"}

    db = SessionLocal()
    # Case 256 is PGRC, Complainant 1DS22CS089 (student)
    comp_pgrc = db.query(Complaint).filter(Complaint.id == 256).first()
    # Case 258 is Regulation Bureau, Complainant PAR-984501 (parent)
    comp_rb = db.query(Complaint).filter(Complaint.id == 258).first()
    db.close()

    assert comp_pgrc is not None and comp_rb is not None
    pgrc_filename = comp_pgrc.evidence_list[0]["stored_name"]
    rb_filename = comp_rb.evidence_list[0]["stored_name"]

    # 1. Admin access: Admin can view both PGRC and RB evidence
    res_admin_pgrc = client.get(f"/api/complaints/evidence/{pgrc_filename}", headers=admin_headers)
    assert res_admin_pgrc.status_code == 200

    res_admin_rb = client.get(f"/api/complaints/evidence/{rb_filename}", headers=admin_headers)
    assert res_admin_rb.status_code == 200

    # 2. Assigned Department access:
    # PGRC reviewer CAN access PGRC complaint evidence
    res_pgrc_allowed = client.get(f"/api/complaints/evidence/{pgrc_filename}", headers=pgrc_headers)
    assert res_pgrc_allowed.status_code == 200

    # PGRC reviewer CANNOT access Regulation Bureau complaint evidence (403 Forbidden)
    res_pgrc_denied = client.get(f"/api/complaints/evidence/{rb_filename}", headers=pgrc_headers)
    assert res_pgrc_denied.status_code == 403
    assert "access denied" in res_pgrc_denied.json()["detail"].lower()

    # RB reviewer CAN access Regulation Bureau evidence
    res_rb_allowed = client.get(f"/api/complaints/evidence/{rb_filename}", headers=rb_headers)
    assert res_rb_allowed.status_code == 200

    # RB reviewer CANNOT access PGRC evidence (403 Forbidden)
    res_rb_denied = client.get(f"/api/complaints/evidence/{pgrc_filename}", headers=rb_headers)
    assert res_rb_denied.status_code == 403

    # 3. Complainant access:
    # Student (1DS22CS089) CAN access their own evidence (Case 256)
    res_student_own = client.get(f"/api/complaints/evidence/{pgrc_filename}", headers=student_headers)
    assert res_student_own.status_code == 200

    # Student (1DS22CS089) CANNOT access Parent's evidence (Case 258)
    res_student_denied = client.get(f"/api/complaints/evidence/{rb_filename}", headers=student_headers)
    assert res_student_denied.status_code == 403
    assert "access denied" in res_student_denied.json()["detail"].lower()

    # Parent (PAR-984501) CAN access their own evidence (Case 258)
    res_parent_own = client.get(f"/api/complaints/evidence/{rb_filename}", headers=parent_headers)
    assert res_parent_own.status_code == 200

    # 4. Unauthenticated access denied (401 Unauthorized)
    res_unauth = client.get(f"/api/complaints/evidence/{pgrc_filename}")
    assert res_unauth.status_code == 401

    # 5. Missing file returns 404 Not Found
    res_missing = client.get("/api/complaints/evidence/completely_nonexistent_file.pdf", headers=admin_headers)
    assert res_missing.status_code == 404


def test_admin_global_notifications(tokens):
    """
    Requirement 2: Administrator receives GLOBAL notifications across all departments and complaints.
    Reviewers are isolated to their department.
    """
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    pgrc_headers = {"Authorization": f"Bearer {tokens['reviewer_pgrc']}"}

    # Admin querying notifications sees global feed (no bureau restriction)
    res_admin = client.get("/api/notifications?limit=300", headers=admin_headers)
    assert res_admin.status_code == 200
    admin_notifs = res_admin.json()
    assert len(admin_notifs) > 0

    # Verify admin sees notifications across multiple different bureaus
    bureaus_seen = {n["bureau"] for n in admin_notifs if n.get("bureau")}
    assert len(bureaus_seen) >= 2, f"Expected multiple bureaus in admin feed, saw {bureaus_seen}"

    # Reviewer querying notifications is filtered to their bureau
    res_pgrc = client.get("/api/notifications?limit=100", headers=pgrc_headers)
    assert res_pgrc.status_code == 200
    pgrc_notifs = res_pgrc.json()
    for n in pgrc_notifs:
        if n.get("bureau"):
            assert "PGRC" in n["bureau"] or n["bureau"] is None


def test_data_synchronization_across_actions(tokens):
    """
    Requirement 3: Changes made by administrator or reviewer are persisted and generate notifications:
    - Officer assignment generates OFFICER_ASSIGNED notification and updates status.
    - Evidence uploaded directly to complaint updates evidence_files and generates notification.
    """
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}

    # 1. Assign officer to Case 256
    assign_payload = {
        "officer_name": "Er. Rajesh Verma",
        "bureau": "PGRC (Public Grievance Redressal)",
        "assigned_by": "Dr. Ramesh Sharma",
        "remarks": "Assigned for detailed inspection"
    }
    assign_res = client.post("/api/complaints/256/assign", json=assign_payload, headers=admin_headers)
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_officer"] == "Er. Rajesh Verma"

    # Verify notification created
    db = SessionLocal()
    notif = db.query(Notification).filter(
        Notification.complaint_id == 256,
        Notification.type == "OFFICER_ASSIGNED"
    ).order_by(Notification.id.desc()).first()
    assert notif is not None
    assert "Er. Rajesh Verma" in notif.message
    db.close()

    # 2. Attach new evidence directly to Case 256
    test_pdf = b"%PDF-1.4 Supporting enquiry notice document."
    files = {"file": ("enquiry_notice.pdf", io.BytesIO(test_pdf), "application/pdf")}
    up_res = client.post("/api/complaints/upload-evidence?complaint_id=256", files=files, headers=admin_headers)
    assert up_res.status_code == 200

    # Verify complaint now includes this evidence
    comp_res = client.get("/api/complaints/256", headers=admin_headers)
    assert comp_res.status_code == 200
    ev_files = comp_res.json()["evidence_files"]
    names = [f["name"] for f in ev_files]
    assert "enquiry_notice.pdf" in names
