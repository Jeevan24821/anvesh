import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base
from app.models import User
from app.auth import verify_password, hash_password
from app.init_db import init_admin_user


@pytest.fixture
def test_db_session():
    """Provides a clean in-memory SQLite database session for unit testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_health_endpoint():
    """Verify backend health endpoint returns healthy status and service name."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "anvesh-backend"


def test_root_endpoint_branding():
    """Verify root endpoint contains ANVESH branding and operational status."""
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "ANVESH"
    assert "Analytics-Driven Network" in data["expansion"]
    assert data["status"] == "Operational"


def test_cors_preflight_vercel_production():
    """Verify CORS preflight allows the production Vercel frontend."""
    client = TestClient(app)
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://anvesh-phi.vercel.app",
            "Access-Control-Request-Method": "POST",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://anvesh-phi.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_preflight_vercel_preview_regex():
    """Verify CORS preflight allows dynamic Vercel branch preview URLs."""
    client = TestClient(app)
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://anvesh-deploy-preview-98.vercel.app",
            "Access-Control-Request-Method": "POST",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://anvesh-deploy-preview-98.vercel.app"


def test_admin_initialization_idempotency(test_db_session):
    """Verify admin initialization creates admin once and preserves credentials on repeat runs."""
    # First run: user is created
    result1 = init_admin_user(test_db_session)
    assert result1["status"] == "success"
    assert result1["action"] == "created"
    assert result1["role"] == "Administrator"

    admin_in_db = test_db_session.query(User).filter(User.username == result1["username"]).first()
    assert admin_in_db is not None
    initial_hash = admin_in_db.password_hash
    initial_salt = admin_in_db.salt

    # Verify password verification works
    from app.config import ADMIN_PASSWORD
    assert verify_password(ADMIN_PASSWORD, initial_salt, initial_hash) is True

    # Second run: user already exists, credentials must be preserved (not overwritten)
    result2 = init_admin_user(test_db_session)
    assert result2["status"] == "success"
    assert result2["action"] == "preserved"

    admin_after = test_db_session.query(User).filter(User.username == result1["username"]).first()
    assert admin_after.password_hash == initial_hash
    assert admin_after.salt == initial_salt


def test_admin_login_success():
    """Verify POST /api/auth/login succeeds for administrator credentials."""
    client = TestClient(app)
    from app.config import ADMIN_USERNAME, ADMIN_PASSWORD
    response = client.post(
        "/api/auth/login",
        json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD,
            "portal_type": "admin"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] in ["Administrator", "Admin"]
    assert data["user"]["username"] == ADMIN_USERNAME


def test_admin_login_invalid_password_returns_401():
    """Verify invalid password returns 401 Unauthorized."""
    client = TestClient(app)
    from app.config import ADMIN_USERNAME
    response = client.post(
        "/api/auth/login",
        json={
            "username": ADMIN_USERNAME,
            "password": "CompletelyWrongPassword!123",
            "portal_type": "admin"
        }
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


def test_portal_boundary_enforcement():
    """Verify strict portal separation between Complainant and Administrative portals."""
    client = TestClient(app)
    # Complainant trying to log into Admin Portal
    res_comp = client.post(
        "/api/auth/login",
        json={
            "username": "student",
            "password": "Student@123",
            "portal_type": "admin"
        }
    )
    assert res_comp.status_code == 403
    assert "Complainant accounts cannot log in through the Bureau Officer / Admin portal" in res_comp.json()["detail"]

    # Admin trying to log into Student Portal
    from app.config import ADMIN_USERNAME, ADMIN_PASSWORD
    res_admin = client.post(
        "/api/auth/login",
        json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD,
            "portal_type": "student"
        }
    )
    assert res_admin.status_code == 403
    assert "Administrative and Reviewer staff accounts cannot log in through the Complainant portal" in res_admin.json()["detail"]
