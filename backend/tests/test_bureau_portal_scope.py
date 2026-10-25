import os
import sys

# Ensure backend can be imported
sys.path.insert(0, os.path.join(r"e:\sih", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_bureau_portal_isolation_and_workflow():
    print("\n--- 1. Testing Individual Bureau Login ---")
    # Reviewer PGRC Login
    res = client.post("/api/auth/login", json={"username": "reviewer_pgrc", "password": "Reviewer@123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    pgrc_token = res.json()["access_token"]
    pgrc_user = res.json()["user"]
    assert "PGRC" in pgrc_user["bureau"]
    print(f"[OK] reviewer_pgrc logged in successfully: bureau='{pgrc_user['bureau']}'")

    # Reviewer RB Login
    res = client.post("/api/auth/login", json={"username": "reviewer_rb", "password": "Reviewer@123"})
    assert res.status_code == 200
    rb_token = res.json()["access_token"]
    rb_user = res.json()["user"]
    assert "Regulation" in rb_user["bureau"]
    print(f"[OK] reviewer_rb logged in successfully: bureau='{rb_user['bureau']}'")

    print("\n--- 2. Testing Bureau Data Isolation ---")
    # reviewer_pgrc queries complaints
    headers_pgrc = {"Authorization": f"Bearer {pgrc_token}"}
    res = client.get("/api/complaints", headers=headers_pgrc)
    assert res.status_code == 200
    pgrc_items = res.json()["items"]
    for c in pgrc_items:
        assert "PGRC" in c["source_bureau"] or "Public Grievance" in c["source_bureau"], f"Leak: found {c['source_bureau']}"
    print(f"[OK] reviewer_pgrc received {len(pgrc_items)} complaints, ALL strictly scoped to PGRC")

    # reviewer_rb queries complaints
    headers_rb = {"Authorization": f"Bearer {rb_token}"}
    res = client.get("/api/complaints", headers=headers_rb)
    assert res.status_code == 200
    rb_items = res.json()["items"]
    for c in rb_items:
        assert "Regulation" in c["source_bureau"], f"Leak: found {c['source_bureau']}"
    print(f"[OK] reviewer_rb received {len(rb_items)} complaints, ALL strictly scoped to RB")

    # reviewer_pgrc tries to access an RB complaint by ID -> must return 403 Forbidden
    rb_case_id = rb_items[0]["id"]
    res = client.get(f"/api/complaints/{rb_case_id}", headers=headers_pgrc)
    assert res.status_code == 403, f"Cross-bureau access violation: got {res.status_code}"
    print(f"[OK] Cross-bureau access blocked: reviewer_pgrc cannot inspect RB complaint {rb_case_id} (HTTP 403)")

    print("\n--- 3. Testing Reviewer Acceptance and Action Taken Workflow ---")
    # Case 1 belongs to student (1DS22CS089) and is in PGRC
    pgrc_id = 1

    # Reviewer accepts complaint
    res = client.post(
        f"/api/complaints/{pgrc_id}/verify",
        headers=headers_pgrc,
        json={
            "verified_by": "Dr. Ramesh Babu (PGRC Reviewer)",
            "remarks": "Verified and accepted for departmental inquiry."
        }
    )
    assert res.status_code == 200, f"Verify failed: {res.text}"
    verified_data = res.json()
    assert verified_data["verification_status"] == "Verified"
    print(f"[OK] Reviewer verified and accepted Case {verified_data['case_id']}. Status: '{verified_data['status']}'")

    # Important rule: Acceptance != Completion
    assert verified_data["status"] != "Disposed" and verified_data["status"] != "Completed", "Acceptance prematurely completed case!"
    print("[OK] Reviewer acceptance did NOT mark complaint Completed. Lifecycle separation verified.")

    # Record Action Taken (without completion)
    res = client.post(
        f"/api/complaints/{pgrc_id}/action-taken",
        headers=headers_pgrc,
        json={
            "action_type": "Show Cause Notice Issued",
            "action_details": "Issued 14-day statutory show-cause notice regarding capitation fee charges.",
            "is_completed": False,
            "next_follow_up_date": "2026-11-10",
            "officer_name": "Dr. Ramesh Babu"
        }
    )
    assert res.status_code == 200, f"Action-taken failed: {res.text}"
    action_result = res.json()
    # Case must still NOT be completed
    assert action_result["status"] != "Disposed", "Action prematurely marked case Disposed!"
    print("[OK] Action taken successfully logged and persisted in database. Complaint remains active.")

    # Verify action appears in CaseAction timeline
    timeline = action_result.get("actions", [])
    assert any(a["action_type"] == "Show Cause Notice Issued" for a in timeline), "Action missing from timeline"
    print("[OK] Case timeline contains logged 'Show Cause Notice Issued' action.")

    print("\n--- 4. Testing Rejection Workflow with Mandatory Rationale ---")
    if len(pgrc_items) > 1:
        pgrc_reject_case = [c for c in pgrc_items if c["id"] != pgrc_id][0]
        rej_id = pgrc_reject_case["id"]
        res = client.post(
            f"/api/complaints/{rej_id}/reject",
            headers=headers_pgrc,
            json={
                "rejection_reason": "Matter falls outside AICTE statutory purview (civil dispute).",
                "rejected_by": "Dr. Ramesh Babu"
            }
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Rejected"
        print(f"[OK] Rejection workflow verified: Case {pgrc_reject_case['case_id']} status set to 'Rejected' with reason.")

    print("\n--- 5. Testing Final Resolution and Complainant Satisfaction Tracking ---")
    # Complete Case 1 via Action Taken
    res = client.post(
        f"/api/complaints/{pgrc_id}/action-taken",
        headers=headers_pgrc,
        json={
            "action_type": "Disposed / Resolved",
            "action_details": "Full fee refund effected by institute and compliance verified by AICTE.",
            "is_completed": True,
            "officer_name": "Dr. Ramesh Babu"
        }
    )
    assert res.status_code == 200
    assert res.json()["status"] == "Disposed"
    print(f"[OK] Case {pgrc_id} officially completed and Disposed via final action.")

    # Student logs in to submit feedback
    res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    assert res.status_code == 200
    student_token = res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    res = client.post(
        f"/api/complaints/{pgrc_id}/feedback",
        headers=student_headers,
        json={
            "rating": 5,
            "feedback": "Extremely satisfied with the prompt resolution and refund."
        }
    )
    assert res.status_code == 200, f"Feedback failed: {res.text}"
    print("[OK] Student submitted 5-star satisfaction rating and feedback.")

    # Reviewer inspects case and sees complainant satisfaction details
    res = client.get(f"/api/complaints/{pgrc_id}", headers=headers_pgrc)
    assert res.status_code == 200
    case_with_fb = res.json()
    assert case_with_fb.get("complainant_feedback") == "Extremely satisfied with the prompt resolution and refund."
    assert case_with_fb.get("complainant_rating") == 5
    print(f"[OK] Reviewer sees complainant satisfaction details: Rating={case_with_fb['complainant_rating']}/5, Feedback='{case_with_fb['complainant_feedback']}'")

    print("\n--- 6. Verifying Non-Bureau Portals (Admin and Complainant) Intact ---")
    # Admin can view all complaints across bureaus
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert res.status_code == 200
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/complaints", headers=admin_headers)
    assert res.status_code == 200
    admin_items = res.json()["items"]
    bureaus_seen = set(c["source_bureau"] for c in admin_items)
    assert len(bureaus_seen) > 1, "Admin should see complaints across multiple bureaus"
    print(f"[OK] Admin portal oversight verified: Admin sees complaints across {len(bureaus_seen)} bureaus.")

    # Admin cannot register complaints (preserved rule)
    res = client.post(
        "/api/complaints",
        headers=admin_headers,
        json={
            "institution_id": 1,
            "category": "Fee Overcharging / Capitation",
            "subject": "Admin registration test",
            "description": "Admin test complaint"
        }
    )
    assert res.status_code == 403, "Admin should NOT be able to register complaints"
    print("[OK] Admin complaint registration option remained strictly removed.")

    print("\n[ALL BUREAU PORTAL & SYSTEM WORKFLOWS VERIFIED CLEANLY!]")

if __name__ == "__main__":
    test_bureau_portal_isolation_and_workflow()
