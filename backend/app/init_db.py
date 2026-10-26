import os
import sys
import logging
from sqlalchemy.orm import Session
from app.config import (
    ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL, ADMIN_FULL_NAME, RESET_ADMIN_PASSWORD
)
from app.database import engine, SessionLocal, Base, apply_safe_migrations
from app.models import User, Institution
from app.auth import hash_password

logger = logging.getLogger("anvesh.init_db")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def init_admin_user(db: Session) -> dict:
    """
    Idempotently initializes the system Administrator account from environment variables.
    
    Security rules:
    - Never logs plain-text passwords or secret keys.
    - If the admin user already exists, preserves their existing password unless RESET_ADMIN_PASSWORD=true.
    - Uses salted PBKDF2-HMAC-SHA256 password hashing.
    """
    admin_user = db.query(User).filter(User.username.ilike(ADMIN_USERNAME)).first()

    if admin_user:
        if RESET_ADMIN_PASSWORD:
            new_hash, new_salt = hash_password(ADMIN_PASSWORD)
            admin_user.password_hash = new_hash
            admin_user.salt = new_salt
            admin_user.full_name = ADMIN_FULL_NAME
            admin_user.email = ADMIN_EMAIL
            admin_user.is_active = True
            db.commit()
            logger.info("Administrator password explicitly reset from environment configuration for '%s'", ADMIN_USERNAME)
            return {"status": "success", "action": "updated", "username": admin_user.username, "role": admin_user.role}
        else:
            logger.info("Administrator account '%s' already exists (role: %s). Existing credentials preserved.", admin_user.username, admin_user.role)
            return {"status": "success", "action": "preserved", "username": admin_user.username, "role": admin_user.role}
    else:
        new_hash, new_salt = hash_password(ADMIN_PASSWORD)
        new_admin = User(
            username=ADMIN_USERNAME,
            full_name=ADMIN_FULL_NAME,
            email=ADMIN_EMAIL,
            role="Administrator",
            bureau="All",
            designation="AICTE Central Administrator & Member Secretary",
            password_hash=new_hash,
            salt=new_salt,
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        logger.info("Administrator account '%s' initialized successfully with role 'Administrator'.", ADMIN_USERNAME)
        return {"status": "success", "action": "created", "username": new_admin.username, "role": new_admin.role}


def init_database_on_startup() -> dict:
    """
    Runs during application boot:
    1. Ensures all SQLite tables are created.
    2. Runs schema migrations to guarantee all columns exist.
    3. Idempotently provisions the administrator account.
    4. Automatically seeds demo institutions, complaints, and roles if the database is fresh/empty.
    """
    Base.metadata.create_all(bind=engine)
    apply_safe_migrations()

    db = SessionLocal()
    try:
        admin_result = init_admin_user(db)

        # Check if database has any technical institutions
        inst_count = db.query(Institution).count()
        if inst_count == 0:
            logger.info("Fresh database detected (0 institutions). Auto-seeding initial ANVESH datasets and demo records...")
            try:
                from seed import seed_database
                seed_database(force_reset=False, users_only=False)
                logger.info("Initial ANVESH database seeding completed successfully.")
            except Exception as e:
                logger.error("Failed to run automatic seed: %s", str(e))
        else:
            # Sync / ensure demo accounts exist for testing
            try:
                from seed import seed_demo_users
                seed_demo_users(db)
            except Exception as e:
                logger.warning("Could not sync demo users: %s", str(e))

        return {
            "database": "ready",
            "admin": admin_result,
            "institutions": db.query(Institution).count()
        }
    finally:
        db.close()


if __name__ == "__main__":
    print("Running ANVESH database initialization and admin provisioner...")
    result = init_database_on_startup()
    print("Initialization result:", result)
