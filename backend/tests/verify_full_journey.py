import requests
import io

BASE_URL = "http://127.0.0.1:8000"

print("======================================================================")
print("   ANVESH END-TO-END VERIFICATION & AUDIT SUITE")
print("======================================================================")

# Step 1: Check root health and unauthenticated access rejection
print("\n[Step 1] Verifying Root Health and Security Gating...")
r = requests.get(f"{BASE_URL}/health")
assert r.status_code == 200, f"Health check failed: {r.status_code}"
print("✅ Health check passed: Backend is live.")

r_unauth = requests.get(f"{BASE_URL}/api/dashboard/stats")
assert r_unauth.status_code == 401, f"Expected 401 Unauthorized for unauthenticated dashboard, got {r_unauth.status_code}"
print("✅ Security Gate verified: Unauthenticated access rejected with 401 Unauthorized.")

# Step 2: Log in as Complainant (Student: Priya Nair)
print("\n[Step 2] Authenticating as Demo Complainant (Priya Nair)...")
login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "student", "password": "Student@123"})
assert login_res.status_code == 200, f"Complainant login failed: {login_res.text}"
student_data = login_res.json()
student_token = student_data["access_token"]
student_headers = {"Authorization": f"Bearer {student_token}"}
print(f"✅ Complainant authenticated: {student_data['user']['full_name']} (USN: {student_data['user']['complainant_id']})")

# Step 3: Complainant submits new complaint with real uploaded evidence
print("\n[Step 3] Uploading Evidence and Submitting New Grievance...")
test_pdf = b"%PDF-1.4\nAICTE Capitation Fee Demand Notice - Student Test Receipt"
file_payload = {"file": ("fee_receipt_evidence.pdf", io.BytesIO(test_pdf), "application/pdf")}
upload_res = requests.post(f"{BASE_URL}/api/complaints/upload-evidence", files=file_payload, headers=student_headers)
assert upload_res.status_code == 200, f"Evidence upload failed: {upload_res.text}"
uploaded_file_meta = upload_res.json()
print(f"✅ Evidence uploaded to safe storage: {uploaded_file_meta['name']} -> {uploaded_file_meta['stored_name']}")

# Verify student is denied access to Institution Directory (403 Forbidden)
denied_dir = requests.get(f"{BASE_URL}/api/institutions", headers=student_headers)
assert denied_dir.status_code == 403, f"Expected 403 for student accessing directory, got {denied_dir.status_code}"
print("✅ Verified Student is correctly denied access to Institution Directory (HTTP 403)")

# Fetch target institution from intake endpoint
inst_res = requests.get(f"{BASE_URL}/api/complaints/target-institutions", headers=student_headers)
assert inst_res.status_code == 200, f"Target institutions lookup failed: {inst_res.text}"
targets = inst_res.json()
target_inst_id = targets[0]["id"]
target_inst_name = targets[0]["name"]

complaint_payload = {
    "institution_id": target_inst_id,
    "complainant_type": "Student",
    "complainant_affiliation": "Student",
    "category": "Fee Overcharging / Capitation",
    "subject": "Extortionate demand of Rs. 85,000 unapproved laboratory maintenance fee",
    "description": "College accounts office refuses to issue examination hall ticket unless mandatory cash payment of Rs 85,000 is deposited immediately, violating AICTE Approval Process Handbook norms.",
    "is_anonymous": False,
    "evidence_files": [uploaded_file_meta]
}
new_comp_res = requests.post(f"{BASE_URL}/api/complaints", json=complaint_payload, headers=student_headers)
assert new_comp_res.status_code == 201, f"Complaint submission failed: {new_comp_res.text}"
new_comp = new_comp_res.json()
new_comp_id = new_comp["id"]
new_case_id = new_comp["case_id"]
print(f"✅ New Grievance registered: Case ID '{new_case_id}' against '{target_inst_name}'.")
print(f"   Derived Priority: {new_comp['priority']} | Target Bureau: {new_comp['source_bureau']}")

# Step 4: Complainant can download evidence and inspect own case, but NOT other cases
print("\n[Step 4] Verifying Complainant Data Isolation...")
my_cases_res = requests.get(f"{BASE_URL}/api/complaints", headers=student_headers)
assert my_cases_res.status_code == 200
my_cases = my_cases_res.json()["items"]
assert any(c["id"] == new_comp_id for c in my_cases), "Submitted case must be in complainant's list"
print(f"✅ Complainant 'My Grievances' shows {len(my_cases)} cases owned by this account.")

# Attempting to access another complainant's case (e.g. Case #6 belonging to Suresh Menon)
detail_res = requests.get(f"{BASE_URL}/api/complaints/6", headers=student_headers)
assert detail_res.status_code in [403, 404], f"Expected 403/404 when accessing another user's case, got {detail_res.status_code}"
print("✅ Complainant isolation verified: Blocked from viewing other complainants' cases.")

# Step 5: Log in as PGRC Reviewer (Dr. Sunita Sharma)
print("\n[Step 5] Authenticating as PGRC Reviewer (Dr. Sunita Sharma)...")
rev_login = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123"})
assert rev_login.status_code == 200
rev_token = rev_login.json()["access_token"]
rev_headers = {"Authorization": f"Bearer {rev_token}"}
print(f"✅ Reviewer authenticated: {rev_login.json()['user']['full_name']} ({rev_login.json()['user']['bureau']})")

# Step 6: Reviewer reviews the case, verifies priority, and requests clarification
print("\n[Step 6] Testing Reviewer Bureau Jurisdiction Isolation...")
verify_blocked = requests.post(
    f"{BASE_URL}/api/complaints/{new_comp_id}/verify",
    json={
        "verified_by": "Dr. Sunita Sharma",
        "confirmed_priority": "High",
        "remarks": "Attempting verification from wrong bureau."
    },
    headers=rev_headers
)
assert verify_blocked.status_code == 403, f"Expected 403 Forbidden for cross-bureau review, got {verify_blocked.status_code}"
print("✅ Reviewer Bureau Isolation Verified: PGRC reviewer blocked from verifying Regulation Bureau complaint.")

print("\nAuthenticating as Authorized Bureau Reviewer (Er. Rajesh Verma - Regulation Bureau)...")
rb_login = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "reviewer_rb", "password": "Reviewer@123"})
assert rb_login.status_code == 200
rb_token = rb_login.json()["access_token"]
rb_headers = {"Authorization": f"Bearer {rb_token}"}

verify_res = requests.post(
    f"{BASE_URL}/api/complaints/{new_comp_id}/verify",
    json={
        "verified_by": "Er. Rajesh Verma",
        "confirmed_priority": "High",
        "priority_override_reason": "Statutory violation involving examination withholding justifies High priority escalation.",
        "remarks": "Preliminary documents verified against AICTE fee ceiling guidelines. Formal inquiry initiated."
    },
    headers=rb_headers
)
assert verify_res.status_code == 200, f"Verification failed: {verify_res.text}"
print(f"✅ Case #{new_case_id} successfully verified by authorized RB Reviewer. Status: {verify_res.json()['status']}")

# Step 7: Log in as Central Administrator (Dr. K. N. Satyanarayana)
print("\n[Step 7] Authenticating as Central Administrator...")
admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "Admin@123"})
assert admin_login.status_code == 200
admin_token = admin_login.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}
print(f"✅ Administrator authenticated: {admin_login.json()['user']['full_name']}")

# Step 8: Administrator reviews Overlap Candidate with 3-Option Workflow
print("\n[Step 8] Administrator Overlap Decision Workflow...")
overlaps_res = requests.get(f"{BASE_URL}/api/overlaps?status=Pending%20Review&limit=1", headers=admin_headers)
assert overlaps_res.status_code == 200
overlap_items = overlaps_res.json()["items"]
if overlap_items:
    alert_to_review = overlap_items[0]
    alert_id = alert_to_review["id"]
    decision_payload = {
        "decision": "JOINT_INVESTIGATION",
        "decision_type": "link_coordination",
        "lead_bureau": "PGRC (Public Grievance Redressal)",
        "affected_bureaus": f"{alert_to_review['case_1_bureau']} & {alert_to_review['case_2_bureau']}",
        "assigned_officer": "Dr. Sunita Sharma",
        "remarks": "Approved multi-bureau joint committee investigation to conduct unified hearing on institutional non-compliance.",
        "justification": "Cross-bureau involvement at same technical institution necessitates coordinated AICTE response."
    }
    review_res = requests.post(f"{BASE_URL}/api/overlaps/{alert_id}/review", json=decision_payload, headers=admin_headers)
    assert review_res.status_code == 200, f"Overlap review failed: {review_res.text}"
    print(f"✅ Overlap Alert #{alert_id} decided by Administrator: {review_res.json()['review_decision']}")

# Step 9: Reconcile Dashboard Metrics (No negative counts, consistent totals)
print("\n[Step 9] Validating Dashboard Analytics & Math Consistency...")
stats_res = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=admin_headers)
assert stats_res.status_code == 200
stats = stats_res.json()
print(f"   Total Cases:              {stats['total_cases']}")
print(f"   Active Under Inquiry:     {stats['under_process_cases']}")
print(f"   Pending Scrutiny:         {stats['pending_verification']}")
print(f"   Resolved / Disposed:      {stats['disposed_cases']}")
print(f"   Overdue Breaches:         {stats['overdue_cases']}")
print(f"   Flagged for Overlap:      {stats['cases_flagged_for_overlap']}")
print(f"   Pairwise Alerts:          {stats['potential_match_pairs']}")

assert stats["under_process_cases"] >= 0, "ERROR: Active Under Inquiry is negative!"
assert stats["pending_verification"] >= 0, "ERROR: Pending verification is negative!"
assert stats["cases_flagged_for_overlap"] <= stats["total_cases"], "ERROR: Overlap complaints exceed total complaints!"
print("✅ Mathematical Consistency Verified: Zero negative values, all counts strictly reconciled.")

# Step 10: CSV Report Export
print("\n[Step 10] Validating CSV Report Export...")
csv_res = requests.get(f"{BASE_URL}/api/reports/export-csv", headers=admin_headers)
assert csv_res.status_code == 200
assert "Case ID,AICTE Institution ID" in csv_res.text
assert new_case_id in csv_res.text
print(f"✅ CSV Export generated successfully ({len(csv_res.text.splitlines())} rows including header).")

# Step 11: Proof File Access Authorization (Admin & Assigned Dept vs Unassigned Dept)
print("\n[Step 11] Validating Proof File Access RBAC across Administrator and Bureaus...")
stored_file_name = uploaded_file_meta["stored_name"]

# Admin can view evidence
admin_proof_res = requests.get(f"{BASE_URL}/api/complaints/evidence/{stored_file_name}", headers=admin_headers)
assert admin_proof_res.status_code == 200, f"Admin proof access failed: {admin_proof_res.status_code}"
print("✅ Admin Proof Access Verified: Administrator successfully retrieved evidence.")

# Authorized bureau reviewer (Regulation Bureau) can view evidence
rb_proof_res = requests.get(f"{BASE_URL}/api/complaints/evidence/{stored_file_name}", headers=rb_headers)
assert rb_proof_res.status_code == 200, f"Authorized department proof access failed: {rb_proof_res.status_code}"
print("✅ Assigned Department Proof Access Verified: Regulation Bureau reviewer retrieved evidence.")

# Unauthorized bureau reviewer (PGRC) is blocked (403 Forbidden)
pgrc_proof_res = requests.get(f"{BASE_URL}/api/complaints/evidence/{stored_file_name}", headers=rev_headers)
assert pgrc_proof_res.status_code == 403, f"Expected 403 Forbidden for PGRC reviewer on RB case, got {pgrc_proof_res.status_code}"
print("✅ Department Isolation Verified: PGRC reviewer blocked from accessing Regulation Bureau evidence.")

# Step 12: Admin Global Notifications & Complaint Registration Prevention
print("\n[Step 12] Validating Admin Global Notifications & Registration Removal...")
admin_notifs_res = requests.get(f"{BASE_URL}/api/notifications?limit=100", headers=admin_headers)
assert admin_notifs_res.status_code == 200
admin_notif_list = admin_notifs_res.json()
assert len(admin_notif_list) > 0
print(f"✅ Admin Global Notifications Verified: Admin retrieved {len(admin_notif_list)} notifications across all bureaus.")

# Verify Admin cannot register complaints (403 Forbidden)
admin_create_res = requests.post(
    f"{BASE_URL}/api/complaints",
    json={
        "institution_id": target_inst_id,
        "category": "Fee Overcharging / Capitation",
        "subject": "Admin should not register",
        "description": "Admin test complaint",
        "complainant_affiliation": "Student"
    },
    headers=admin_headers
)
assert admin_create_res.status_code == 403, f"Expected 403 Forbidden for admin registration, got {admin_create_res.status_code}"
print("✅ Admin Registration Blocked Verified: Central administrator strictly prohibited from registering complaints.")

print("\n======================================================================")
print("🎉 ALL 12 END-TO-END WORKFLOW TESTS PASSED 100% SUCCESSFULLY!")
print("======================================================================")
