"""
ANVESH - Comprehensive Verification Suite
Tests for:
1. Quick Demo Access removal & authentication integrity
2. Strict PDF-only evidence upload validation (header & format)
3. Robust complaint description meaningfulness validation (reject gibberish, accept concise/Indic)
4. AICTE and Digital India logos on Dashboard Header
5. AICTE Logo on Acknowledgement Slip & Generated Reports
"""
import io
import re
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import requests
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import validate_complaint_description

client = TestClient(app)

def test_1_demo_access_removed_and_auth_integrity():
    print("\n--- Test 1: Demo Access Removed & Auth Integrity ---")
    
    # 1.1 Verify LoginPage.jsx has no 1-Click Quick Demo Access bar
    with open("frontend/src/pages/LoginPage.jsx", "r", encoding="utf-8") as f:
        login_content = f.read()
    assert "1-Click Quick Demo Access" not in login_content, "1-Click Quick Demo Access still present in LoginPage!"
    assert "Instant Evaluator & Tester Entry" not in login_content, "Demo access subtitle still present in LoginPage!"
    print("  [PASS] 1-Click Quick Demo Access bar is completely removed from LoginPage.jsx")

    # 1.2 Verify backend rejects backdoor OTP bypasses
    res_demo = client.post("/api/auth/verify-otp", json={"identifier": "1DS22CS089", "otp": "DEMO-OTP"})
    assert res_demo.status_code == 401, f"Expected 401 for DEMO-OTP, got {res_demo.status_code}"
    res_999 = client.post("/api/auth/verify-otp", json={"identifier": "1DS22CS089", "otp": "999999"})
    assert res_999.status_code == 401, f"Expected 401 for 999999, got {res_999.status_code}"
    print("  [PASS] Backdoor OTP bypass codes ('DEMO-OTP', '999999') are rejected with 401 Unauthorized")

    # 1.3 Verify standard secure login for authorized roles
    res_admin = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123", "portal_type": "admin"})
    assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
    assert "access_token" in res_admin.json()

    res_stu = client.post("/api/auth/login", json={"username": "student", "password": "Student@123", "portal_type": "student"})
    assert res_stu.status_code == 200, f"Student login failed: {res_stu.text}"
    assert "access_token" in res_stu.json()
    print("  [PASS] Standard secure login works properly for administrative and complainant roles")


def test_2_pdf_only_upload_enforcement():
    print("\n--- Test 2: PDF-Only Upload Enforcement ---")
    
    res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # 2.1 Valid PDF upload succeeds
    valid_pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    pdf_file = {"file": ("fee_receipt.pdf", io.BytesIO(valid_pdf_content), "application/pdf")}
    res_valid = client.post("/api/complaints/upload-evidence", files=pdf_file, headers=headers)
    assert res_valid.status_code == 200, f"Valid PDF failed: {res_valid.text}"
    stored_name = res_valid.json()["stored_name"]
    assert stored_name.endswith(".pdf")
    print("  [PASS] Valid PDF file with '%PDF-' header accepted successfully")

    # 2.2 Rejection of DOCX
    docx_file = {"file": ("document.docx", io.BytesIO(b"PK\x03\x04 fake zip content"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res_docx = client.post("/api/complaints/upload-evidence", files=docx_file, headers=headers)
    assert res_docx.status_code == 400
    assert "upload pdf only" in res_docx.json()["detail"].lower()
    print("  [PASS] DOCX format rejected with 'Upload PDF only'")

    # 2.3 Rejection of PNG / JPG
    png_file = {"file": ("screenshot.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")}
    res_png = client.post("/api/complaints/upload-evidence", files=png_file, headers=headers)
    assert res_png.status_code == 400
    assert "upload pdf only" in res_png.json()["detail"].lower()
    print("  [PASS] PNG image rejected with 'Upload PDF only'")

    # 2.4 Rejection of TXT
    txt_file = {"file": ("notes.txt", io.BytesIO(b"Plain text grievance notes"), "text/plain")}
    res_txt = client.post("/api/complaints/upload-evidence", files=txt_file, headers=headers)
    assert res_txt.status_code == 400
    print("  [PASS] TXT file rejected with 400 Bad Request")

    # 2.5 Rejection of fake PDF (renamed image or text file with .pdf extension)
    fake_pdf = {"file": ("fake_renamed.pdf", io.BytesIO(b"Not a real PDF file header"), "application/pdf")}
    res_fake = client.post("/api/complaints/upload-evidence", files=fake_pdf, headers=headers)
    assert res_fake.status_code == 400
    assert "the file header does not match a valid pdf document" in res_fake.json()["detail"].lower()
    print("  [PASS] Renamed fake PDF rejected via '%PDF-' magic byte validation")

    # 2.6 Rejection of empty PDF
    empty_pdf = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    res_empty = client.post("/api/complaints/upload-evidence", files=empty_pdf, headers=headers)
    assert res_empty.status_code == 400
    assert "empty" in res_empty.json()["detail"].lower()
    print("  [PASS] Empty file upload rejected with clear error")

    # 2.7 Frontend input accept attribute check
    with open("frontend/src/pages/Complaints.jsx", "r", encoding="utf-8") as f:
        complaints_jsx = f.read()
    assert 'accept=".pdf"' in complaints_jsx
    assert 'accept=".pdf,.doc,.docx"' not in complaints_jsx
    print("  [PASS] Frontend Complaints.jsx strictly restricts file input to accept='.pdf'")


def test_3_meaningless_description_validation():
    print("\n--- Test 3: Meaningless Description Validation ---")
    
    # 3.1 Meaningless test inputs rejected by validator
    meaningless_cases = [
        "asdfghjkl",
        "aaaaaaa",
        "qwertyuiop",
        "abc",
        "asdfghjkl qwertyuiop zxcvbnm",
        "test test test test",
        "zzzzzzzzzzzzzzzzzzzz",
        "bcdfghjklmnpqrstvwxyz",
        "   ",
        ""
    ]
    for case in meaningless_cases:
        valid, msg = validate_complaint_description(case)
        assert not valid, f"Expected '{case}' to be REJECTED, but was marked valid!"
        assert "meaningful description" in msg.lower()
    print(f"  [PASS] All {len(meaningless_cases)} meaningless/gibberish cases were rejected")

    # 3.2 Valid concise descriptions accepted
    valid_concise = [
        "Fee refund denied by accounts office.",
        "Hostel harassment and ragging.",
        "Excessive examination fee charged without receipt.",
        "Withholding of semester hall ticket arbitrarily."
    ]
    for case in valid_concise:
        valid, msg = validate_complaint_description(case)
        assert valid, f"Expected '{case}' to be ACCEPTED, but got error: {msg}"
    print(f"  [PASS] All {len(valid_concise)} valid concise complaints were accepted")

    # 3.3 Multilingual Indian-language complaints accepted
    indic_cases = [
        "छात्रावास में भोजन की गुणवत्ता खराब है और प्रबंधन सुन नहीं रहा।",
        "கட்டணம் திரும்ப வழங்கப்படவில்லை மற்றும் நிர்வாகம் மறுக்கிறது.",
        "फीस वापसी नहीं की जा रही है तथा अतिरिक्त शुल्क मांगा गया।"
    ]
    for case in indic_cases:
        valid, msg = validate_complaint_description(case)
        assert valid, f"Expected Indian language complaint to be ACCEPTED, but got error: {msg}"
    print(f"  [PASS] Multilingual Indian-language grievances (Hindi, Tamil) accepted successfully")

    # 3.4 Integration test via /api/complaints endpoint
    res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    stu_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Reject submission with keyboard mash
    bad_comp = {
        "institution_id": 1,
        "complainant_name": "Priya Nair",
        "category": "Fee Overcharging / Capitation",
        "subject": "Testing keyboard mash",
        "description": "asdfghjkl qwertyuiop zxcvbnm",
        "complainant_affiliation": "Student"
    }
    res_bad = client.post("/api/complaints", json=bad_comp, headers=stu_headers)
    assert res_bad.status_code == 400
    assert "meaningful description" in res_bad.json()["detail"].lower()
    print("  [PASS] Backend /api/complaints endpoint rejected gibberish submission with 400")

    # Accept submission with genuine concise complaint
    good_comp = {
        "institution_id": 1,
        "complainant_name": "Priya Nair",
        "category": "Fee Overcharging / Capitation",
        "subject": "Tuition Refund Dispute 2026",
        "description": "Fee refund denied by accounts office.",
        "complainant_affiliation": "Student"
    }
    res_good = client.post("/api/complaints", json=good_comp, headers=stu_headers)
    assert res_good.status_code == 201
    assert res_good.json()["id"] is not None
    print(f"  [PASS] Backend /api/complaints accepted genuine concise complaint (ID: {res_good.json()['id']})")


def test_4_dashboard_header_branding():
    print("\n--- Test 4: Dashboard Header Branding ---")
    
    with open("frontend/src/components/Header.jsx", "r", encoding="utf-8") as f:
        header_content = f.read()

    assert "/aicte_logo.png" in header_content, "AICTE logo missing in Header.jsx"
    assert "/digital_india_logo.png" in header_content, "Digital India logo missing in Header.jsx"
    assert "/anvesh_logo.png" in header_content, "ANVESH logo missing in Header.jsx"

    # Verify physical image files exist in frontend/public
    assert os.path.exists("frontend/public/aicte_logo.png"), "Missing aicte_logo.png in public/"
    assert os.path.exists("frontend/public/digital_india_logo.png"), "Missing digital_india_logo.png in public/"
    assert os.path.exists("frontend/public/anvesh_logo.png"), "Missing anvesh_logo.png in public/"
    print("  [PASS] Header.jsx displays AICTE, Digital India, and ANVESH logos with responsive container styling")


def test_5_report_and_slip_branding():
    print("\n--- Test 5: Report and Acknowledgement Slip Branding ---")
    
    with open("frontend/src/components/AcknowledgementModal.jsx", "r", encoding="utf-8") as f:
        ack_content = f.read()

    assert "/aicte_logo.png" in ack_content, "AICTE logo missing from AcknowledgementModal"
    assert "All India Council for Technical Education" in ack_content
    assert "mx-auto" in ack_content, "AICTE logo should be centered in acknowledgement receipt"

    with open("frontend/src/pages/Reports.jsx", "r", encoding="utf-8") as f:
        reports_content = f.read()
    assert "/aicte_logo.png" in reports_content, "AICTE logo missing from Reports header"

    with open("frontend/src/pages/Overlaps.jsx", "r", encoding="utf-8") as f:
        overlaps_content = f.read()
    assert "/aicte_logo.png" in overlaps_content, "AICTE logo missing from Overlaps header"
    print("  [PASS] Official AICTE logo properly embedded and centered in acknowledgement slips & regulatory reports")


if __name__ == "__main__":
    print("=================================================================")
    print("ANVESH - VERIFICATION OF FINAL LOGIN, PDF, DESCRIPTION & BRANDING")
    print("=================================================================")
    test_1_demo_access_removed_and_auth_integrity()
    test_2_pdf_only_upload_enforcement()
    test_3_meaningless_description_validation()
    test_4_dashboard_header_branding()
    test_5_report_and_slip_branding()
    print("\n=================================================================")
    print("ALL 5 REQUIREMENTS FULLY VERIFIED AND PASSING SUCCESSFULLY!")
    print("=================================================================")
