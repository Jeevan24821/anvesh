import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def admin_headers():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def student_headers():
    res = client.post("/api/auth/login", json={"username": "student", "password": "Student@123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] in ["ANVESH", "SENTRIX"]

def test_unauthenticated_access_denied():
    # Direct access without token must return 401 Unauthorized
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 401

    res = client.get("/api/complaints")
    assert res.status_code == 401

def test_api_dashboard_stats(admin_headers):
    response = client.get("/api/dashboard/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_cases" in data
    assert "bureau_workload" in data
    assert data["total_cases"] > 0
    assert data["under_process_cases"] >= 0
    assert data["active_cases"] >= 0

def test_api_institutions_list(admin_headers):
    response = client.get("/api/institutions?limit=10", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 10
    assert data["total"] >= 40

def test_api_complaints_list_and_filter(admin_headers):
    response = client.get("/api/complaints?is_overdue=true", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] > 0
    for item in data["items"]:
        assert item["is_overdue"] is True

def test_api_overlaps_list(admin_headers):
    response = client.get("/api/overlaps?limit=5", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) <= 5
    if len(data["items"]) > 0:
        alert = data["items"][0]
        assert "confidence_score" in alert
        assert "match_reasons" in alert

def test_api_reports_csv_export(admin_headers):
    response = client.get("/api/reports/export-csv", headers=admin_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "Case ID,AICTE Institution ID" in response.text

def test_complainant_cannot_access_internal_endpoints(student_headers):
    # Complainant must NOT access overlaps or reports
    res = client.get("/api/overlaps", headers=student_headers)
    assert res.status_code == 403

    res = client.get("/api/reports/summary", headers=student_headers)
    assert res.status_code == 403

    res = client.get("/api/reports/export-csv", headers=student_headers)
    assert res.status_code == 403
