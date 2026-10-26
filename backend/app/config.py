import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv("DB_PATH", BASE_DIR / "sentrix.db"))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Allowed CORS origins with support for cloud Vercel deployments and Render configuration
DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://anvesh-phi.vercel.app",
    "https://anvesh.vercel.app",
]

_custom_cors = os.getenv("CORS_ORIGINS", "")
if _custom_cors:
    _extra = [orig.strip() for orig in _custom_cors.split(",") if orig.strip()]
    for _o in _extra:
        if _o not in DEFAULT_CORS_ORIGINS:
            DEFAULT_CORS_ORIGINS.append(_o)

CORS_ORIGINS = DEFAULT_CORS_ORIGINS

# Administrator Initialization Defaults (overridable via Render / system environment variables)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@aicte-india.org").strip()
ADMIN_FULL_NAME = os.getenv("ADMIN_FULL_NAME", "Dr. K. N. Satyanarayana").strip()
RESET_ADMIN_PASSWORD = os.getenv("RESET_ADMIN_PASSWORD", "").lower() in ("true", "1", "yes")

BUREAUS = [
    "PGRC (Public Grievance Redressal)",
    "Regulation Bureau (RB)",
    "Approval Bureau (AB)",
    "Policy & Academic Planning Bureau (PAPB)",
    "Anti-Ragging Cell (ARC)",
    "Skill Development Cell (SDC)"
]

BUREAU_CODES = {
    "PGRC": "PGRC (Public Grievance Redressal)",
    "RB": "Regulation Bureau (RB)",
    "AB": "Approval Bureau (AB)",
    "PAPB": "Policy & Academic Planning Bureau (PAPB)",
    "ARC": "Anti-Ragging Cell (ARC)",
    "SDC": "Skill Development Cell (SDC)"
}

STATUSES = [
    "New",
    "Pending Bureau Review",
    "Under Process",
    "Hearing Scheduled",
    "Action Taken Report Awaited",
    "Escalated to Committee",
    "Disposed",
    "Transferred"
]

PRIORITIES = ["Urgent", "High", "Medium", "Low"]

COMPLAINT_CATEGORIES = [
    "Fee Overcharging / Capitation",
    "Withholding Original Certificates",
    "Faculty Non-Payment & Understaffing",
    "Infrastructure & Laboratory Deficit",
    "Unapproved Courses & Excess Intake",
    "Ragging & Student Harassment",
    "Misappropriation of Grant Funds",
    "Admissions & Affiliation Irregularities",
    "Governance Malpractice & Retaliation"
]
