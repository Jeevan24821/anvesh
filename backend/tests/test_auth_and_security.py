import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Complaint, Institution

client = TestClient(app)


def test_login_flow():
    # Admin login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Administrator"

    # Reviewer login
    res = client.post("/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123"})
    assert res.status_code == 200
    assert res.json()["user"]["bureau"] == "PGRC (Public Grievance Redressal)"

    # Complainant student login
    res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    assert res.status_code == 200
    assert res.json()["user"]["complainant_id"] == "1DS22CS089"


def test_login_failure():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "IncorrectPassword"})
    assert res.status_code == 401


def test_demo_otp_verification():
    # Valid Demo OTP
    res = client.post("/api/auth/verify-otp", json={"identifier": "1DS22CS089", "otp": "123456"})
    assert res.status_code == 200
    assert res.json()["user"]["full_name"] == "Priya Nair"

    # Invalid OTP
    res = client.post("/api/auth/verify-otp", json={"identifier": "1DS22CS089", "otp": "000000"})
    assert res.status_code == 401


def test_reviewer_bureau_isolation():
    # Login as PGRC Reviewer
    res = client.post("/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Find a complaint belonging to Regulation Bureau (RB)
    db = SessionLocal()
    rb_comp = db.query(Complaint).filter(Complaint.source_bureau.contains("Regulation")).first()
    db.close()
    assert rb_comp is not None

    # PGRC reviewer attempting to access Regulation Bureau case must be rejected with 403 Forbidden
    res = client.get(f"/api/complaints/{rb_comp.id}", headers=headers)
    assert res.status_code == 403
    assert "jurisdiction" in res.json()["detail"].lower()


def test_complainant_case_isolation():
    # Login as student (Priya Nair, 1DS22CS089)
    res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Find a complaint not belonging to Priya Nair
    db = SessionLocal()
    other_comp = db.query(Complaint).filter(Complaint.complainant_id != "1DS22CS089").first()
    db.close()
    assert other_comp is not None

    # Student attempting to access another person's case must be denied
    res = client.get(f"/api/complaints/{other_comp.id}", headers=headers)
    assert res.status_code in [403, 404]


def test_dashboard_metrics_never_negative():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/dashboard/stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()

    assert stats["under_process_cases"] >= 0
    assert stats["active_cases"] >= 0
    assert stats["pending_cases"] >= 0
    assert stats["disposed_cases"] >= 0
    assert stats["overdue_cases"] >= 0
    assert stats["total_cases"] >= stats["active_cases"]
    assert stats["cases_flagged_for_overlap"] <= stats["total_cases"]


def test_evidence_upload_and_download_security():
    res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_file_content = b"%PDF-1.4 Fake PDF Header for AICTE Test Evidence Document"
    files = {"file": ("test_fee_receipt.pdf", io.BytesIO(test_file_content), "application/pdf")}

    upload_res = client.post("/api/complaints/upload-evidence", files=files, headers=headers)
    assert upload_res.status_code == 200
    file_data = upload_res.json()
    assert "stored_name" in file_data
    stored_name = file_data["stored_name"]

    # Authorized download
    dl_res = client.get(f"/api/complaints/evidence/{stored_name}", headers=headers)
    assert dl_res.status_code == 200
    assert dl_res.content == test_file_content

    # Unauthenticated download denied
    dl_unauth = client.get(f"/api/complaints/evidence/{stored_name}")
    assert dl_unauth.status_code == 401


def test_three_role_login_paths():
    """Verifies all 3 cards from the redesigned portal authenticate legitimately."""
    # Card 1: Bureau Officer / Admin
    res_admin = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert res_admin.status_code == 200
    assert res_admin.json()["user"]["role"] == "Administrator"

    res_reviewer = client.post("/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123"})
    assert res_reviewer.status_code == 200
    assert res_reviewer.json()["user"]["role"] == "Reviewer"

    res_officer = client.post("/api/auth/login", json={"username": "officer_pgrc", "password": "Officer@123"})
    assert res_officer.status_code == 200
    assert res_officer.json()["user"]["role"] == "Bureau Officer"

    # Card 2: Student / Institution (USN / ID + OTP)
    res_student = client.post("/api/auth/verify-otp", json={"identifier": "1DS22CS089", "otp": "123456", "complainant_type": "Student"})
    assert res_student.status_code == 200
    assert res_student.json()["user"]["role"] == "Complainant"
    assert res_student.json()["user"]["complainant_id"] == "1DS22CS089"

    # Card 3: Parent / Guardian (Parent ID + OTP)
    res_parent = client.post("/api/auth/verify-otp", json={"identifier": "PAR-984501", "otp": "123456", "complainant_type": "Parent"})
    assert res_parent.status_code == 200
    assert res_parent.json()["user"]["role"] == "Complainant"
    assert res_parent.json()["user"]["complainant_id"] == "PAR-984501"


def test_invalid_credentials_rejected_for_all_cards():
    """Verifies incorrect passwords and OTPs are rejected across all three login cards."""
    # Card 1: Incorrect password
    res_bad_pw = client.post("/api/auth/login", json={"username": "admin", "password": "WrongPassword!999"})
    assert res_bad_pw.status_code == 401

    # Card 2: Incorrect OTP for Student
    res_bad_student_otp = client.post("/api/auth/verify-otp", json={"identifier": "1DS22CS089", "otp": "000000"})
    assert res_bad_student_otp.status_code == 401

    # Card 2: Non-existent student USN
    res_fake_student = client.post("/api/auth/verify-otp", json={"identifier": "NONEXISTENT_USN_999", "otp": "123456"})
    assert res_fake_student.status_code == 404

    # Card 3: Incorrect OTP for Parent
    res_bad_parent_otp = client.post("/api/auth/verify-otp", json={"identifier": "PAR-984501", "otp": "999888"})
    assert res_bad_parent_otp.status_code == 401

    # Card 3: Non-existent parent ID
    res_fake_parent = client.post("/api/auth/verify-otp", json={"identifier": "PAR-000000", "otp": "123456"})
    assert res_fake_parent.status_code == 404


def test_forgot_password_and_reset_workflow():
    """Verifies official password recovery generates tokens without leaking account existence and updates PBKDF2 hash."""
    # 1. Non-existent account returns standard generic message (no enumeration)
    res_nobody = client.post("/api/auth/forgot-password", json={"username_or_email": "nobody_exists_here"})
    assert res_nobody.status_code == 200
    assert "token" not in res_nobody.json()
    assert "password reset instructions" in res_nobody.json()["message"]

    # 2. Existing admin account returns reset token
    res_admin = client.post("/api/auth/forgot-password", json={"username_or_email": "admin"})
    assert res_admin.status_code == 200
    assert "token" in res_admin.json()
    reset_tok = res_admin.json()["token"]

    # 3. Perform real password reset
    res_reset = client.post("/api/auth/reset-password", json={"token": reset_tok, "new_password": "NewSecretPass@2026"})
    assert res_reset.status_code == 200
    assert "successfully updated" in res_reset.json()["message"]

    # 4. Authenticate with new password
    res_new_login = client.post("/api/auth/login", json={"username": "admin", "password": "NewSecretPass@2026"})
    assert res_new_login.status_code == 200

    # 5. Token cannot be reused (one-time use)
    res_reuse = client.post("/api/auth/reset-password", json={"token": reset_tok, "new_password": "AnotherPassword@2026"})
    assert res_reuse.status_code == 400

    # 6. Reset back to original Admin@123
    res_restore_tok = client.post("/api/auth/forgot-password", json={"username_or_email": "admin"}).json()["token"]
    client.post("/api/auth/reset-password", json={"token": res_restore_tok, "new_password": "Admin@123"})

    # Verify original password works
    assert client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"}).status_code == 200


def test_otp_request_and_account_recovery_endpoints():
    """Verifies OTP dispatch and account recovery ticket generation."""
    # 1. Request OTP for student
    res_otp_student = client.post("/api/auth/request-otp", json={"identifier": "1DS22CS089", "role_type": "Student"})
    assert res_otp_student.status_code == 200
    assert "dispatched" in res_otp_student.json()["message"]

    # 2. Request OTP for parent
    res_otp_parent = client.post("/api/auth/request-otp", json={"identifier": "PAR-984501", "role_type": "Parent"})
    assert res_otp_parent.status_code == 200
    assert "dispatched" in res_otp_parent.json()["message"]

    # 3. Submit Account Recovery ticket
    res_recovery = client.post("/api/auth/account-recovery", json={
        "identifier": "1DS22CS089",
        "contact_info": "+91-9845012345",
        "role_type": "Student",
        "reason": "Changed mobile number and need verification update"
    })
    assert res_recovery.status_code == 200
    assert "registered" in res_recovery.json()["message"]


def test_registration_and_login_flow():
    """Verifies real user registration, duplicate prevention, and subsequent login via password and OTP."""
    import time
    unique_suffix = int(time.time())
    stu_email = f"ananya_{unique_suffix}@rvce.edu.in"
    stu_usn = f"1RV23CS{str(unique_suffix)[-3:]}"

    # 1. Register student
    reg_payload = {
        "role_type": "Student",
        "full_name": "Ananya Deshmukh",
        "email": stu_email,
        "phone": "+91-9876543210",
        "identifier": stu_usn,
        "password": "SecurePass@123",
        "institution_name": "R.V. College of Engineering"
    }
    res_reg = client.post("/api/auth/register", json=reg_payload)
    assert res_reg.status_code == 200
    reg_data = res_reg.json()
    assert reg_data["success"] is True
    assert reg_data["user"]["role"] == "Complainant"
    assert reg_data["user"]["complainant_id"] == stu_usn.upper()

    # 2. Login newly registered student via identifier + password
    res_login_pw = client.post("/api/auth/login", json={
        "identifier": stu_usn,
        "password": "SecurePass@123"
    })
    assert res_login_pw.status_code == 200
    assert res_login_pw.json()["user"]["full_name"] == "Ananya Deshmukh"

    # 3. Login newly registered student via email + password
    res_login_email = client.post("/api/auth/login", json={
        "username": stu_email,
        "password": "SecurePass@123"
    })
    assert res_login_email.status_code == 200

    # 4. Login newly registered student via USN + OTP
    res_login_otp = client.post("/api/auth/verify-otp", json={
        "identifier": stu_usn,
        "otp": "123456"
    })
    assert res_login_otp.status_code == 200

    # 5. Duplicate identifier rejected
    res_dup_id = client.post("/api/auth/register", json={
        "role_type": "Student",
        "full_name": "Another Student",
        "email": f"other_{unique_suffix}@rvce.edu.in",
        "identifier": stu_usn,
        "password": "AnotherPass@123"
    })
    assert res_dup_id.status_code == 400
    assert "already registered" in res_dup_id.json()["detail"].lower()

    # 6. Duplicate email rejected
    res_dup_email = client.post("/api/auth/register", json={
        "role_type": "Student",
        "full_name": "Another Student",
        "email": stu_email,
        "identifier": f"1RV23CS{str(unique_suffix+1)[-3:]}",
        "password": "AnotherPass@123"
    })
    assert res_dup_email.status_code == 400
    assert "already exists" in res_dup_email.json()["detail"].lower()


def test_registration_privilege_rejection():
    """Verifies privileged roles cannot be registered through public portal."""
    for role in ["Administrator", "Reviewer", "Bureau Officer", "Admin"]:
        res = client.post("/api/auth/register", json={
            "role_type": role,
            "full_name": "Privileged Hacker",
            "email": f"hacker_{role.lower()}@bad.com",
            "identifier": f"BAD_{role.upper()}",
            "password": "HackedPass@123"
        })
        assert res.status_code == 400
        assert "privileged" in res.json()["detail"].lower()


def test_all_predefined_demo_accounts():
    """Verifies all 6 predefined demo accounts authenticate properly with their documented credentials."""
    # 1. admin / Admin@123
    r_admin = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert r_admin.status_code == 200
    assert r_admin.json()["user"]["role"] == "Administrator"

    # 2. reviewer_pgrc / Reviewer@123
    r_pgrc = client.post("/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123"})
    assert r_pgrc.status_code == 200
    assert r_pgrc.json()["user"]["bureau"] == "PGRC (Public Grievance Redressal)"

    # 3. reviewer_rb / Reviewer@123
    r_rb = client.post("/api/auth/login", json={"username": "reviewer_rb", "password": "Reviewer@123"})
    assert r_rb.status_code == 200
    assert r_rb.json()["user"]["bureau"] == "Regulation Bureau (RB)"

    # 4. student / 1DS22CS089 / Student@123 / OTP: 123456
    r_stu_pw = client.post("/api/auth/login", json={"identifier": "1DS22CS089", "password": "Student@123"})
    assert r_stu_pw.status_code == 200
    assert r_stu_pw.json()["user"]["complainant_id"] == "1DS22CS089"

    r_stu_otp = client.post("/api/auth/verify-otp", json={"identifier": "1DS22CS089", "otp": "123456"})
    assert r_stu_otp.status_code == 200

    # 5. inst_user / 1-3349102801 / Institution@123 / OTP: 123456
    r_inst_pw = client.post("/api/auth/login", json={"identifier": "1-3349102801", "password": "Institution@123"})
    assert r_inst_pw.status_code == 200
    assert r_inst_pw.json()["user"]["complainant_id"] == "1-3349102801"

    r_inst_otp = client.post("/api/auth/verify-otp", json={"identifier": "1-3349102801", "otp": "123456"})
    assert r_inst_otp.status_code == 200

    # 6. parent / PAR-984501 / Parent@123 / OTP: 123456
    r_par_pw = client.post("/api/auth/login", json={"identifier": "PAR-984501", "password": "Parent@123"})
    assert r_par_pw.status_code == 200
    assert r_par_pw.json()["user"]["complainant_id"] == "PAR-984501"

    r_par_otp = client.post("/api/auth/verify-otp", json={"identifier": "PAR-984501", "otp": "123456"})
    assert r_par_otp.status_code == 200


def test_otp_rate_limiting():
    """Verifies 15-second rate limiting cooldown on OTP requests."""
    from app.routers.auth import ACTIVE_OTPS
    ACTIVE_OTPS.clear()

    # First request succeeds
    res1 = client.post("/api/auth/request-otp", json={"identifier": "1DS22CS089"})
    assert res1.status_code == 200

    # Immediate second request triggers 429
    res2 = client.post("/api/auth/request-otp", json={"identifier": "1DS22CS089"})
    assert res2.status_code == 429
    assert "wait" in res2.json()["detail"].lower()


def test_institution_directory_restriction_for_all_complainants():
    """
    Verifies that Institution Directory and aggregated institutional intelligence
    are strictly restricted from all Complainant roles (Student, Parent, Institution Representative),
    while preserving access for authorized staff and preserving complaint submission intake.
    """
    # 1. Student account (Priya Nair, 1DS22CS089)
    res_stu = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    stu_token = res_stu.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    stu_dir = client.get("/api/institutions", headers=stu_headers)
    assert stu_dir.status_code == 403
    assert "restricted" in stu_dir.json()["detail"].lower()

    stu_detail = client.get("/api/institutions/1", headers=stu_headers)
    assert stu_detail.status_code == 403
    assert "restricted" in stu_detail.json()["detail"].lower()

    # 2. Parent account (Suresh Menon, PAR-984501)
    res_par = client.post("/api/auth/login", json={"username": "parent", "password": "Parent@123"})
    par_token = res_par.json()["access_token"]
    par_headers = {"Authorization": f"Bearer {par_token}"}

    par_dir = client.get("/api/institutions", headers=par_headers)
    assert par_dir.status_code == 403
    assert "restricted" in par_dir.json()["detail"].lower()

    par_detail = client.get("/api/institutions/1", headers=par_headers)
    assert par_detail.status_code == 403
    assert "restricted" in par_detail.json()["detail"].lower()

    # 3. Institution Representative account (inst_user, 1-3349102801)
    res_inst = client.post("/api/auth/login", json={"username": "inst_user", "password": "Institution@123"})
    inst_token = res_inst.json()["access_token"]
    inst_headers = {"Authorization": f"Bearer {inst_token}"}

    inst_dir = client.get("/api/institutions", headers=inst_headers)
    assert inst_dir.status_code == 403
    assert "restricted" in inst_dir.json()["detail"].lower()

    inst_detail = client.get("/api/institutions/1", headers=inst_headers)
    assert inst_detail.status_code == 403
    assert "restricted" in inst_detail.json()["detail"].lower()

    # 4. Unauthenticated caller denied with 401
    unauth_dir = client.get("/api/institutions")
    assert unauth_dir.status_code == 401

    # 5. Authorized Staff Roles retain full access:
    # 5a. Central Administrator
    res_adm = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    adm_token = res_adm.json()["access_token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    adm_dir = client.get("/api/institutions", headers=adm_headers)
    assert adm_dir.status_code == 200
    assert "items" in adm_dir.json()
    assert adm_dir.json()["total"] > 0

    adm_detail = client.get("/api/institutions/1", headers=adm_headers)
    assert adm_detail.status_code == 200

    # 5b. PGRC Reviewer
    res_pgrc = client.post("/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123"})
    pgrc_token = res_pgrc.json()["access_token"]
    pgrc_headers = {"Authorization": f"Bearer {pgrc_token}"}

    pgrc_dir = client.get("/api/institutions", headers=pgrc_headers)
    assert pgrc_dir.status_code == 200

    # 5c. RB Reviewer
    res_rb = client.post("/api/auth/login", json={"username": "reviewer_rb", "password": "Reviewer@123"})
    rb_token = res_rb.json()["access_token"]
    rb_headers = {"Authorization": f"Bearer {rb_token}"}

    rb_dir = client.get("/api/institutions", headers=rb_headers)
    assert rb_dir.status_code == 200

    # 5d. Bureau Officer
    res_officer = client.post("/api/auth/login", json={"username": "officer_pgrc", "password": "Officer@123"})
    officer_token = res_officer.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    officer_dir = client.get("/api/institutions", headers=officer_headers)
    assert officer_dir.status_code == 200

    # 6. Preserved Complaint Submission Entry Point for Complainants:
    # Student accesses non-sensitive target institutions lookup
    target_res = client.get("/api/complaints/target-institutions", headers=stu_headers)
    assert target_res.status_code == 200
    targets = target_res.json()
    assert len(targets) > 0
    # Must NOT contain internal complaint aggregates, overdue counts, or overlaps
    first_target = targets[0]
    assert "id" in first_target
    assert "name" in first_target
    assert "complaints_count" not in first_target
    assert "overdue_complaints_count" not in first_target
    assert "overlaps" not in first_target

    # Student registers a new complaint successfully
    new_comp_payload = {
        "institution_id": first_target["id"],
        "complainant_type": "Student",
        "complainant_affiliation": "Student",
        "category": "Fee Overcharging / Capitation",
        "subject": "Unauthorized caution deposit forfeiture",
        "description": "College accounts office arbitrarily withheld refund of mandatory Rs. 25,000 security deposit after student graduated with degree completion certificate.",
        "is_anonymous": False
    }
    submit_res = client.post("/api/complaints", json=new_comp_payload, headers=stu_headers)
    assert submit_res.status_code == 201
    created_comp = submit_res.json()
    assert created_comp["case_id"].startswith("AICTE-2026-")

    # Student can view their own complaint details
    comp_view_res = client.get(f"/api/complaints/{created_comp['id']}", headers=stu_headers)
    assert comp_view_res.status_code == 200



