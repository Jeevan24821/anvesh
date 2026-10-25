from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Enable SQLite foreign key constraints
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def apply_safe_migrations():
    """Ensures newly added columns exist in SQLite database without losing data."""
    with engine.connect() as conn:
        # Check complaints table
        cursor = conn.connection.cursor()
        cursor.execute("PRAGMA table_info(complaints)")
        columns = [row[1] for row in cursor.fetchall()]
        if columns:  # table exists
            new_complaint_cols = [
                ("complainant_id", "TEXT DEFAULT 'user_demo'"),
                ("complainant_affiliation", "TEXT DEFAULT 'Student'"),
                ("complainant_id_number", "TEXT"),
                ("is_anonymous", "INTEGER DEFAULT 0"),
                ("suggested_priority", "TEXT DEFAULT 'Medium'"),
                ("suggested_priority_reason", "TEXT"),
                ("routing_reason", "TEXT"),
                ("verification_status", "TEXT DEFAULT 'Submitted'"),
                ("evidence_files", "TEXT DEFAULT '[]'"),
                ("primary_case_id", "TEXT"),
                ("info_request_notes", "TEXT"),
                ("complainant_response", "TEXT"),
                ("complainant_feedback", "TEXT")
            ]
            for col_name, col_type in new_complaint_cols:
                if col_name not in columns:
                    cursor.execute(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type}")
        
        # Check case_actions table
        cursor.execute("PRAGMA table_info(case_actions)")
        action_columns = [row[1] for row in cursor.fetchall()]
        if action_columns:
            if "is_internal" not in action_columns:
                cursor.execute("ALTER TABLE case_actions ADD COLUMN is_internal INTEGER DEFAULT 0")

        # Check users table
        cursor.execute("PRAGMA table_info(users)")
        user_columns = [row[1] for row in cursor.fetchall()]
        if user_columns:
            new_user_cols = [
                ("password_hash", "TEXT"),
                ("salt", "TEXT"),
                ("complainant_id", "TEXT"),
                ("phone", "TEXT"),
                ("is_active", "INTEGER DEFAULT 1")
            ]
            for col_name, col_type in new_user_cols:
                if col_name not in user_columns:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")

        # Check notifications table
        cursor.execute("PRAGMA table_info(notifications)")
        notif_columns = [row[1] for row in cursor.fetchall()]
        if notif_columns:
            new_notif_cols = [
                ("user_id", "INTEGER"),
                ("complainant_id", "TEXT"),
                ("recipient_role", "TEXT")
            ]
            for col_name, col_type in new_notif_cols:
                if col_name not in notif_columns:
                    cursor.execute(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_type}")

        # Check overlap_alerts table
        cursor.execute("PRAGMA table_info(overlap_alerts)")
        alert_columns = [row[1] for row in cursor.fetchall()]
        if alert_columns:
            new_alert_cols = [
                ("decision_type", "TEXT"),
                ("lead_bureau", "TEXT"),
                ("affected_bureaus", "TEXT"),
                ("assigned_officer", "TEXT"),
                ("justification", "TEXT")
            ]
            for col_name, col_type in new_alert_cols:
                if col_name not in alert_columns:
                    cursor.execute(f"ALTER TABLE overlap_alerts ADD COLUMN {col_name} {col_type}")
        
        conn.connection.commit()
        cursor.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
