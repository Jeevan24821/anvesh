"""
Comprehensive SIH Readiness & Stability Verification Script.
Tests all 10 core demonstration workflows and security requirements against the running server.
"""
import sys
import os
import requests
import io
import re

BASE_URL = "http://127.0.0.1:8000"

results = {}

def run_test(name, test_fn):
    print(f"\n[Testing] {name}...")
    try:
        test_fn()
        results[name] = "PASSED"
        print(f"--> {name}: PASSED")
    except Exception as e:
        results[name] = f"FAILED: {e}"
        print(f"--> {name}: FAILED - {e}")

# Global storage across test steps
context = {}

def test_1_login_and_registration():
    # 1.1 Valid Admin Login
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "Admin@123", "portal_type": "admin"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    context["admin_token"] = res.json()["access_token"]
    context["admin_headers"] = {"Authorization": f"Bearer {context['admin_token']}"}

    # 1.2 Valid Reviewer Login
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123", "portal_type": "admin"})
    assert res.status_code == 200, f"Reviewer login failed: {res.text}"
    context["pgrc_token"] = res.json()["access_token"]
    context["pgrc_headers"] = {"Authorization": f"Bearer {context['pgrc_token']}"}

    # 1.3 Valid Complainant Login
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "student", "password": "Student@123", "portal_type": "student"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    context["student_token"] = res.json()["access_token"]
    context["student_headers"] = {"Authorization": f"Bearer {context['student_token']}"}

    # 1.4 Invalid password rejection
    res_bad = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert res_bad.status_code == 401, f"Expected 401 for bad password, got {res_bad.status_code}"

    # 1.5 Role boundary enforcement: Student cannot login through Admin portal
    res_boundary = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "student", "password": "Student@123", "portal_type": "admin"})
    assert res_boundary.status_code == 403, f"Expected 403 for student on admin portal, got {res_boundary.status_code}"

    # 1.6 OTP Verification Flow for Student
    otp_req = requests.post(f"{BASE_URL}/api/auth/request-otp", json={"identifier": "1DS22CS089", "role_type": "Student"})
    assert otp_req.status_code == 200, f"OTP request failed: {otp_req.text}"
    demo_otp = otp_req.json().get("demo_otp", "123456")
    otp_login = requests.post(f"{BASE_URL}/api/auth/login", json={"identifier": "1DS22CS089", "otp": demo_otp, "portal_type": "student"})
    assert otp_login.status_code == 200, f"OTP login failed: {otp_login.text}"

def test_2_complaint_submission_and_detail():
    # 2.1 Fetch target institutions
    inst_res = requests.get(f"{BASE_URL}/api/complaints/target-institutions", headers=context["student_headers"])
    assert inst_res.status_code == 200
    target_id = inst_res.json()[0]["id"]

    # 2.2 Submit new complaint
    payload = {
        "institution_id": target_id,
        "complainant_type": "Student",
        "complainant_affiliation": "Student",
        "category": "Withholding Original Certificates",
        "subject": "Refusal to return original 10th and 12th marksheets after course withdrawal",
        "description": "Student formally withdrew admission within permissible statutory window. College principal office refuses to return original academic credentials without illegal payment penalty.",
        "is_anonymous": False
    }
    create_res = requests.post(f"{BASE_URL}/api/complaints", json=payload, headers=context["student_headers"])
    assert create_res.status_code == 201, f"Complaint creation failed: {create_res.text}"
    new_comp = create_res.json()
    context["created_comp_id"] = new_comp["id"]
    context["created_case_id"] = new_comp["case_id"]

    # 2.3 View complaint details as owner
    detail_res = requests.get(f"{BASE_URL}/api/complaints/{context['created_comp_id']}", headers=context["student_headers"])
    assert detail_res.status_code == 200, f"Failed to retrieve complaint detail: {detail_res.text}"
    detail = detail_res.json()
    assert detail["case_id"] == context["created_case_id"]
    assert detail["status"] in ["Submitted", "Pending Verification"]

def test_3_bureau_switching_and_filtering():
    # 3.1 Admin filters by Regulation Bureau
    rb_res = requests.get(f"{BASE_URL}/api/complaints?bureau=Regulation%20Bureau%20(RB)", headers=context["admin_headers"])
    assert rb_res.status_code == 200
    rb_cases = rb_res.json()["items"]
    for c in rb_cases:
        assert c["source_bureau"] == "Regulation Bureau (RB)"

    # 3.2 Admin filters by PGRC
    pgrc_res = requests.get(f"{BASE_URL}/api/complaints?bureau=PGRC%20(Public%20Grievance%20Redressal)", headers=context["admin_headers"])
    assert pgrc_res.status_code == 200
    pgrc_cases = pgrc_res.json()["items"]
    for c in pgrc_cases:
        assert c["source_bureau"] == "PGRC (Public Grievance Redressal)"

    # 3.3 Status filter
    status_res = requests.get(f"{BASE_URL}/api/complaints?status=Under%20Review", headers=context["admin_headers"])
    assert status_res.status_code == 200
    for c in status_res.json()["items"]:
        assert c["status"] == "Under Review"

def test_4_reviewer_assignment_and_status_updates():
    # 4.1 Assign Officer to complaint (Admin action)
    assign_payload = {
        "officer_name": "Er. Rajesh Verma (Joint Director, Regulation)",
        "bureau": "Regulation Bureau (RB)",
        "remarks": "Assigned for regulatory examination under APH norms.",
        "assigned_by": "Dr. K. N. Satyanarayana"
    }
    assign_res = requests.post(f"{BASE_URL}/api/complaints/{context['created_comp_id']}/assign", json=assign_payload, headers=context["admin_headers"])
    assert assign_res.status_code == 200, f"Assignment failed: {assign_res.text}"
    assert assign_res.json()["assigned_officer"] == "Er. Rajesh Verma (Joint Director, Regulation)"

    # 4.2 Status change to 'Under Process'
    status_payload = {
        "status": "Under Process",
        "actor_name": "Dr. K. N. Satyanarayana",
        "actor_role": "Administrator",
        "remarks": "Formal investigation order issued to institution."
    }
    status_res = requests.post(f"{BASE_URL}/api/complaints/{context['created_comp_id']}/status", json=status_payload, headers=context["admin_headers"])
    assert status_res.status_code == 200, f"Status update failed: {status_res.text}"
    assert status_res.json()["status"] == "Under Process"

def test_5_overlap_intelligence_scores_and_rationale():
    overlaps_res = requests.get(f"{BASE_URL}/api/overlaps?limit=10", headers=context["admin_headers"])
    assert overlaps_res.status_code == 200, f"Overlaps query failed: {overlaps_res.text}"
    data = overlaps_res.json()
    assert data["total"] > 0
    items = data["items"]
    assert len(items) > 0

    first = items[0]
    assert "confidence_score" in first
    assert 0.0 <= first["confidence_score"] <= 100.0 or 0.0 <= first["confidence_score"] <= 1.0
    assert "match_reasons" in first
    assert isinstance(first["match_reasons"], list)
    assert len(first["match_reasons"]) > 0
    assert "case_1_id" in first and "case_2_id" in first

def test_6_human_confirmation_or_rejection_of_overlaps():
    # Query an alert pending review
    alerts_res = requests.get(f"{BASE_URL}/api/overlaps?status=Pending%20Review&limit=2", headers=context["admin_headers"])
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()["items"]
    if alerts:
        target_alert = alerts[0]
        alert_id = target_alert["id"]

        # Human decision: DISMISS_FALSE_POSITIVE
        dismiss_payload = {
            "decision": "DISMISS_FALSE_POSITIVE",
            "reviewed_by": "Dr. K. N. Satyanarayana",
            "remarks": "Reviewed and verified as distinct matters. False positive dismissed."
        }
        review_res = requests.post(f"{BASE_URL}/api/overlaps/{alert_id}/review", json=dismiss_payload, headers=context["admin_headers"])
        assert review_res.status_code == 200, f"Dismiss overlap review failed: {review_res.text}"
        res_data = review_res.json()
        assert res_data["status"] == "Dismissed False Positive"
        assert "False Positive" in res_data.get("review_decision", "") or res_data.get("status") == "Dismissed False Positive"

        # Verify underlying complaints were NOT deleted or closed
        c1 = requests.get(f"{BASE_URL}/api/complaints/{target_alert['complaint_id_1']}", headers=context["admin_headers"])
        c2 = requests.get(f"{BASE_URL}/api/complaints/{target_alert['complaint_id_2']}", headers=context["admin_headers"])
        assert c1.status_code == 200, "Complaint 1 must remain intact"
        assert c2.status_code == 200, "Complaint 2 must remain intact"

def test_7_aph_clause_tagging_verified_numbers():
    from app.config import APH_CLAUSE_MAP
    expected_clauses = {
        "Fee Overcharging / Capitation": "Clause 6.35",
        "Withholding Original Certificates": "Clause 6.38",
        "Faculty Non-Payment & Understaffing": "Clause 7.12",
        "Infrastructure & Laboratory Deficit": "Clause 4.5",
        "Unapproved Courses & Excess Intake": "Clause 2.14",
        "Ragging & Student Harassment": "Clause 6.1",
        "Misappropriation of Grant Funds": "Clause 8.4",
        "Admissions & Affiliation Irregularities": "Clause 3.7",
        "Governance Malpractice & Retaliation": "Clause 6.20"
    }
    for cat, clause in expected_clauses.items():
        assert cat in APH_CLAUSE_MAP, f"Category '{cat}' missing in APH_CLAUSE_MAP"
        assert APH_CLAUSE_MAP[cat] == clause, f"Clause mismatch for '{cat}': expected {clause}, got {APH_CLAUSE_MAP[cat]}"

def test_8_pdf_uploads_with_server_side_validation():
    # 8.1 Valid PDF upload succeeds
    valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF"
    pdf_payload = {"file": ("student_affidavit.pdf", io.BytesIO(valid_pdf_bytes), "application/pdf")}
    res_valid = requests.post(f"{BASE_URL}/api/complaints/upload-evidence", files=pdf_payload, headers=context["student_headers"])
    assert res_valid.status_code == 200, f"Valid PDF upload failed: {res_valid.text}"
    assert res_valid.json()["name"] == "student_affidavit.pdf"

    # 8.2 Fake PDF with invalid magic header is rejected (HTTP 400)
    fake_pdf_bytes = b"NOT_A_REAL_PDF_HEADER"
    fake_payload = {"file": ("fake_header.pdf", io.BytesIO(fake_pdf_bytes), "application/pdf")}
    res_fake = requests.post(f"{BASE_URL}/api/complaints/upload-evidence", files=fake_payload, headers=context["student_headers"])
    assert res_fake.status_code == 400, f"Expected 400 for fake PDF, got {res_fake.status_code}"
    assert "Invalid file content" in res_fake.json()["detail"]

    # 8.3 Executable or disallowed extension (.exe, .sh) is rejected (HTTP 400)
    bad_payload = {"file": ("malicious.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")}
    res_bad = requests.post(f"{BASE_URL}/api/complaints/upload-evidence", files=bad_payload, headers=context["student_headers"])
    assert res_bad.status_code == 400, f"Expected 400 for .exe file, got {res_bad.status_code}"
    assert "Unsupported file format" in res_bad.json()["detail"]

def test_9_exports_with_accurate_readable_dates():
    # 9.1 Complaints CSV Export
    csv_res = requests.get(f"{BASE_URL}/api/reports/export-csv", headers=context["admin_headers"])
    assert csv_res.status_code == 200, f"Complaints CSV export failed: {csv_res.text}"
    lines = csv_res.text.strip().splitlines()
    assert len(lines) > 1, "CSV must have header + data rows"
    header = lines[0]
    assert "Case ID" in header and "Received Date" in header and "Submission Timestamp" in header
    
    # Check date format in first data row
    first_data_row = lines[1]
    # Date pattern YYYY-MM-DD
    date_matches = re.findall(r"\d{4}-\d{2}-\d{2}", first_data_row)
    assert len(date_matches) >= 1, f"Expected standard YYYY-MM-DD date in CSV row, got: {first_data_row}"

    # 9.2 Overlaps CSV Export
    overlaps_csv_res = requests.get(f"{BASE_URL}/api/reports/export-overlaps-csv", headers=context["admin_headers"])
    assert overlaps_csv_res.status_code == 200, f"Overlaps CSV export failed: {overlaps_csv_res.text}"
    o_lines = overlaps_csv_res.text.strip().splitlines()
    assert len(o_lines) > 1, "Overlaps CSV must have header + data rows"
    o_header = o_lines[0]
    assert "Alert ID" in o_header and "Overall Similarity Score" in o_header and "Review Decision" in o_header

def test_10_acknowledgement_pdf_and_logo():
    # 10.1 Verify AICTE logo asset exists in public folder
    logo_path = os.path.join("frontend", "public", "aicte_logo.png")
    assert os.path.exists(logo_path), f"AICTE logo missing at {logo_path}"
    assert os.path.getsize(logo_path) > 0, "AICTE logo file is empty"

    # 10.2 Verify Acknowledgement slip template centers the logo
    modal_code = open("frontend/src/components/AcknowledgementModal.jsx", encoding="utf-8").read()
    assert "/aicte_logo.png" in modal_code, "AcknowledgementModal must reference /aicte_logo.png"
    assert "flex justify-center" in modal_code or "mx-auto" in modal_code, "AICTE logo must be centred at top"
    assert "Grievance Intake Acknowledgement Receipt" in modal_code
    assert "window.print()" in modal_code

if __name__ == "__main__":
    print("======================================================================")
    print("   SIH FINAL READINESS & STABILITY VERIFICATION TEST SUITE")
    print("======================================================================")
    
    run_test("1. Login & Registration for Authorized Roles", test_1_login_and_registration)
    run_test("2. Complaint Submission & Detail Retrieval", test_2_complaint_submission_and_detail)
    run_test("3. Bureau Switching & Queue Filtering", test_3_bureau_switching_and_filtering)
    run_test("4. Reviewer Assignment & Status Updates", test_4_reviewer_assignment_and_status_updates)
    run_test("5. Overlap Scores, Component % & Rationale", test_5_overlap_intelligence_scores_and_rationale)
    run_test("6. Human Confirmation/Rejection of Relationships", test_6_human_confirmation_or_rejection_of_overlaps)
    run_test("7. APH Clause Tagging with Verified Clauses", test_7_aph_clause_tagging_verified_numbers)
    run_test("8. PDF Uploads with Server-side Validation", test_8_pdf_uploads_with_server_side_validation)
    run_test("9. Complaint & Overlap CSV Exports with Dates", test_9_exports_with_accurate_readable_dates)
    run_test("10. Acknowledgement Slip with Centred AICTE Logo", test_10_acknowledgement_pdf_and_logo)

    print("\n======================================================================")
    print("   FINAL VERIFICATION SUMMARY")
    print("======================================================================")
    all_passed = True
    for test_name, status in results.items():
        print(f"[{status}] {test_name}")
        if status != "PASSED":
            all_passed = False
    
    if all_passed:
        print("\nAll 10 Core Workflows Verified Ready for Final SIH Evaluation!")
        sys.exit(0)
    else:
        print("\nSome tests failed. Please review output above.")
        sys.exit(1)
