import os
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Complaint, Notification

client = TestClient(app)

@pytest.fixture
def tokens():
    roles = {
        "admin": ("admin", "Admin@123"),
        "reviewer_pgrc": ("reviewer_pgrc", "Reviewer@123"),
        "student": ("student", "Student@123"),
        "parent": ("parent", "Parent@123"),
    }
    toks = {}
    for r, (u, p) in roles.items():
        res = client.post("/api/auth/login", json={"username": u, "password": p})
        assert res.status_code == 200
        toks[r] = res.json()["access_token"]
    return toks


def test_portal_role_boundary_enforcement():
    """
    Test server-side portal separation:
    - Complainants cannot login through official/admin portal.
    - Administrators and Reviewers cannot login through complainant portal.
    """
    # 1. Student attempts login via admin portal -> 403 Forbidden
    res = client.post("/api/auth/login", json={
        "username": "student",
        "password": "Student@123",
        "portal_type": "admin"
    })
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

    # 2. Admin attempts login via student portal -> 403 Forbidden
    res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Admin@123",
        "portal_type": "student"
    })
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

    # 3. Reviewer attempts login via parent portal -> 403 Forbidden
    res = client.post("/api/auth/login", json={
        "username": "reviewer_pgrc",
        "password": "Reviewer@123",
        "portal_type": "parent"
    })
    assert res.status_code == 403

    # 4. Valid logins with matching portals succeed
    res_admin = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Admin@123",
        "portal_type": "admin"
    })
    assert res_admin.status_code == 200

    res_student = client.post("/api/auth/login", json={
        "username": "student",
        "password": "Student@123",
        "portal_type": "student"
    })
    assert res_student.status_code == 200


def test_unread_notification_count_endpoint(tokens):
    """
    Verify GET /api/notifications/unread-count returns accurate count for each role.
    """
    for role, token in tokens.items():
        headers = {"Authorization": f"Bearer {token}"}
        res = client.get("/api/notifications/unread-count", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        assert data["unread_count"] >= 0


def test_overlap_notifications_restricted_to_admin(tokens):
    """
    Verify non-admin roles never receive overlap notifications in list or count.
    """
    student_headers = {"Authorization": f"Bearer {tokens['student']}"}
    pgrc_headers = {"Authorization": f"Bearer {tokens['reviewer_pgrc']}"}
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}

    # Student requesting overlaps category returns empty list
    res_student = client.get("/api/notifications?category=overlaps", headers=student_headers)
    assert res_student.status_code == 200
    assert len(res_student.json()) == 0

    # Reviewer requesting overlaps category returns empty list
    res_pgrc = client.get("/api/notifications?category=overlaps", headers=pgrc_headers)
    assert res_pgrc.status_code == 200
    assert len(res_pgrc.json()) == 0

    # Reviewer general feed has no overlap notifications
    res_pgrc_all = client.get("/api/notifications", headers=pgrc_headers)
    assert res_pgrc_all.status_code == 200
    for notif in res_pgrc_all.json():
        assert notif["type"] not in ["OVERLAP_DETECTED", "OVERLAP_DECIDED"]

    # Admin CAN access overlaps category
    res_admin = client.get("/api/notifications?category=overlaps", headers=admin_headers)
    assert res_admin.status_code == 200


def test_evidence_magic_byte_validation(tokens):
    """
    Verify file upload enforces .pdf, .doc, .docx only with valid magic bytes.
    """
    student_headers = {"Authorization": f"Bearer {tokens['student']}"}

    # 1. Valid PDF with %PDF- header succeeds
    valid_pdf = b"%PDF-1.5 Valid PDF document content for testing."
    files = {"file": ("proof.pdf", io.BytesIO(valid_pdf), "application/pdf")}
    res = client.post("/api/complaints/upload-evidence", files=files, headers=student_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "proof.pdf"

    # 2. Fake PDF with text header fails magic byte check
    fake_pdf = b"This is not a real PDF file content."
    files = {"file": ("fake.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    res = client.post("/api/complaints/upload-evidence", files=files, headers=student_headers)
    assert res.status_code == 400
    assert "Invalid file content" in res.json()["detail"]

    # 3. Disallowed extension (.png, .txt) rejected
    files = {"file": ("photo.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")}
    res = client.post("/api/complaints/upload-evidence", files=files, headers=student_headers)
    assert res.status_code == 400
    assert "Unsupported file format" in res.json()["detail"]


def test_description_minimum_150_chars(tokens):
    """
    Verify complaint registration enforces >= 150 characters on description.
    """
    student_headers = {"Authorization": f"Bearer {tokens['student']}"}

    # Short description (< 150 chars) rejected
    short_payload = {
        "institution_id": 1,
        "complainant_name": "Priya Nair",
        "category": "Fee Overcharging / Capitation",
        "subject": "Tuition overcharge test",
        "description": "Short description under 150 characters.",
        "complainant_affiliation": "Student"
    }
    res = client.post("/api/complaints", json=short_payload, headers=student_headers)
    assert res.status_code == 400
    assert "at least 150 characters" in res.json()["detail"]

    # Valid description (>= 150 chars) succeeds
    valid_desc = (
        "The institution demanded an unauthorized caution deposit and laboratory maintenance charge "
        "amounting to Rs. 45,000 without issuance of a formal stamped fee receipt or council approval. "
        "When questioned, the administration threatened to withhold hall tickets for the upcoming semester examinations."
    )
    assert len(valid_desc) >= 150

    valid_payload = {
        "institution_id": 1,
        "complainant_name": "Priya Nair",
        "category": "Fee Overcharging / Capitation",
        "subject": "Unauthorized Laboratory Charge Assessment 2026",
        "description": valid_desc,
        "complainant_affiliation": "Student"
    }
    res = client.post("/api/complaints", json=valid_payload, headers=student_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] is not None
    assert "overlap_similarity_score" in data
