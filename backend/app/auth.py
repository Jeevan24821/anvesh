import os
import hmac
import hashlib
import secrets
import json
import base64
import time
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User

# Secret key for signing tokens
SECRET_KEY = os.getenv("SENTRIX_SECRET_KEY", "sentrix-aicte-sih2026-super-secure-secret-token-key-gov-portal")
TOKEN_EXPIRY_SECONDS = 86400 * 7  # 7 days

security_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a unique salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return key.hex(), salt


def verify_password(password: str, salt: str, password_hash: str) -> bool:
    """Verifies a password against its stored salt and hash."""
    expected_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(expected_hash, password_hash)


def create_access_token(payload: Dict[str, Any]) -> str:
    """Creates a base64url-encoded HMAC-SHA256 signed token."""
    header = {"alg": "HS256", "typ": "JWT"}
    body = payload.copy()
    body["exp"] = int(time.time()) + TOKEN_EXPIRY_SECONDS
    body["iat"] = int(time.time())

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode("utf-8")).decode("utf-8").rstrip("=")
    body_b64 = base64.urlsafe_b64encode(json.dumps(body).encode("utf-8")).decode("utf-8").rstrip("=")
    signing_input = f"{header_b64}.{body_b64}"

    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")

    return f"{signing_input}.{sig_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and verifies signature and expiration of access token."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        header_b64, body_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{body_b64}"

        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            signing_input.encode("utf-8"),
            hashlib.sha256
        ).digest()
        actual_sig = base64.urlsafe_b64decode(sig_b64 + "=="[:(4 - len(sig_b64) % 4) % 4])

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        body_json = base64.urlsafe_b64decode(body_b64 + "=="[:(4 - len(body_b64) % 4) % 4]).decode("utf-8")
        payload = json.loads(body_json)

        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Dependency that requires a valid Bearer token and returns the authenticated User."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated."
        )

    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency for endpoints that can adapt output when authenticated vs unauthenticated."""
    if not credentials or not credentials.credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    return db.query(User).filter(User.id == user_id).first()


def require_role(allowed_roles: list[str]):
    """Decorator / dependency factory for server-side role-based access control."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role
        # Normalize Admin / Administrator
        normalized_allowed = [r.lower() for r in allowed_roles]
        if user_role.lower() in normalized_allowed or ("admin" in normalized_allowed and user_role in ["Admin", "Administrator"]):
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Requires one of roles {allowed_roles}. Your role is '{user_role}'."
        )
    return role_checker
