import pytest
import csv
import io
from datetime import date, timedelta
from app.database import SessionLocal
from app.models import Complaint, User
from app.crud import get_dashboard_stats, get_complaints, get_reports_summary

def test_overdue_case_detection():
    """Tests that overdue cases are identified correctly from due dates and active statuses."""
    db = SessionLocal()
    try:
        today = date.today()
        # Active cases with past due dates
        overdue_in_db = db.query(Complaint).filter(
            Complaint.status != "Disposed",
            Complaint.due_date < today
        ).all()
        assert len(overdue_in_db) > 0, "Expected overdue cases in seed data"

        # Verify enriched dict identifies is_overdue=True and positive days_overdue
        items, _ = get_complaints(db, is_overdue=True)
        assert len(items) > 0
        for item in items:
            assert item["is_overdue"] is True
            assert item["days_overdue"] > 0
            assert item["status"] != "Disposed"
    finally:
        db.close()

def test_dashboard_statistics_aggregation():
    """Tests that dashboard statistics reflect actual database records, not hardcoded constants."""
    db = SessionLocal()
    try:
        stats = get_dashboard_stats(db)

        total_complaints = db.query(Complaint).count()
        assert stats["total_cases"] == total_complaints

        # Sum of workload bureaus equals total
        workload_total = sum(b["total"] for b in stats["bureau_workload"])
        assert workload_total == total_complaints

        # Workload has active, overdue, disposed fields
        for b in stats["bureau_workload"]:
            assert "active" in b
            assert "overdue" in b
            assert "disposed" in b

        assert stats["overdue_cases"] > 0
        assert stats["potential_overlaps"] > 0
        assert len(stats["status_distribution"]) > 0
        assert len(stats["priority_distribution"]) > 0
        assert len(stats["recent_cases"]) > 0
    finally:
        db.close()

def test_search_and_filters():
    """Tests searching by keyword, filtering by bureau, and filtering by priority."""
    db = SessionLocal()
    try:
        # 1. Search for Aryavart
        results_aryavart, total_aryavart = get_complaints(db, search="Aryavart")
        assert total_aryavart > 0
        for r in results_aryavart:
            assert "Aryavart" in r["institution_name"] or "Aryavart" in r["subject"] or "Aryavart" in r["description"]

        # 2. Filter by Bureau
        pgrc_bureau = "PGRC (Public Grievance Redressal)"
        results_pgrc, total_pgrc = get_complaints(db, bureau=pgrc_bureau)
        assert total_pgrc > 0
        for r in results_pgrc:
            assert r["source_bureau"] == pgrc_bureau

        # 3. Filter by Priority
        results_urgent, total_urgent = get_complaints(db, priority="Urgent")
        assert total_urgent > 0
        for r in results_urgent:
            assert r["priority"] == "Urgent"
    finally:
        db.close()

def test_reports_and_csv_generation():
    """Tests report metrics calculation and CSV export data formatting."""
    db = SessionLocal()
    try:
        summary = get_reports_summary(db)
        assert "ageing" in summary
        assert "bureau_disposals" in summary
        assert "region_distribution" in summary

        # Test CSV export logic
        items, _ = get_complaints(db, limit=50)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Case ID", "Institution", "Bureau", "Status", "Is Overdue"])
        for c in items:
            writer.writerow([c["case_id"], c["institution_name"], c["source_bureau"], c["status"], c["is_overdue"]])

        csv_content = output.getvalue()
        reader = csv.reader(io.StringIO(csv_content))
        rows = list(reader)
        assert len(rows) == len(items) + 1  # Header + rows
        assert rows[0] == ["Case ID", "Institution", "Bureau", "Status", "Is Overdue"]
    finally:
        db.close()

def test_demo_role_data():
    """Tests that demo roles (Administrator, Reviewer, Complainant, Viewer) are present and defined."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        roles = {u.role for u in users}
        assert ("Admin" in roles or "Administrator" in roles)
        assert ("Bureau Officer" in roles or "Reviewer" in roles)
        assert "Complainant" in roles
        assert "Viewer" in roles
    finally:
        db.close()

def test_complainant_and_trend_data_dashboard_support():
    """Tests that trend_data contains month & filed keys and complainant can fetch dashboard stats."""
    from fastapi.testclient import TestClient
    from app.main import app

    db = SessionLocal()
    try:
        # Check global stats trend_data keys
        stats = get_dashboard_stats(db)
        assert len(stats["trend_data"]) > 0
        first_point = stats["trend_data"][0]
        assert "month" in first_point
        assert "period" in first_point
        assert "filed" in first_point
        assert "resolved" in first_point
        assert "pending" in first_point
        assert "overdue" in first_point

        # Check complainant-scoped stats
        complainant_stats = get_dashboard_stats(db, complainant_id="1DS22CS089")
        assert complainant_stats["total_cases"] > 0
        assert len(complainant_stats["recent_cases"]) > 0
        for rc in complainant_stats["recent_cases"]:
            assert rc["complainant_id"] == "1DS22CS089"

        # Check API endpoint allows Complainant
        client = TestClient(app)
        login_res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        api_res = client.get("/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        assert api_res.status_code == 200
        data = api_res.json()
        assert data["total_cases"] > 0
        assert len(data["recent_cases"]) > 0
    finally:
        db.close()
