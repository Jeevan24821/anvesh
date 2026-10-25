import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "sentrix.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

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
