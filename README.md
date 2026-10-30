# SENTRIX: Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells

**Smart India Hackathon 2026** | **Problem Statement ID: SIH26264**  
**Organization:** All India Council for Technical Education (AICTE), Ministry of Education, Govt. of India  
**System Name:** SENTRIX (Secure Enterprise Network for Tracking, Redressal, and Inter-bureau eXchange)

---

## 🏛️ 1. Executive Summary & Objective

In technical higher education, complaints regarding colleges and institutes often span multiple administrative jurisdictions simultaneously:
- A student may lodge a grievance regarding **excess capitation fees** with the **Public Grievance Redressal Cell (PGRC)**.
- Concurrently, a parent or vigilance unit may submit a complaint regarding **unapproved tuition fee hikes** to the **Regulation Bureau (RB)**.
- Concurrently, complaints concerning **unapproved seat intake** or **laboratory deficits** are submitted to the **Approval Bureau (AB)**.

Operating in isolated administrative silos causes duplicate investigative efforts, conflicting regulatory directives, missed statutory SLA deadlines, and lack of systemic oversight.

**SENTRIX** solves this by establishing a unified intelligence mesh across all AICTE bureaus and cells:
1. **Login-First Secure Authentication:** Direct URL access to dashboards or cases is prohibited; role-based access control enforces strict isolation.
2. **Strictly Separated Portals:** Distinct interfaces and server-enforced permissions for Complainants, Bureau Reviewers, and Central Administrators.
3. **Genuine Database-Backed Calculations:** Every dashboard metric reconciles directly from the database; negative counters and arbitrary mock numbers are completely eliminated.
4. **Transparent Overlap Detection Engine:** Flags cross-bureau overlaps and probable duplicates based on multi-signal matching (AICTE permanent ID, normalized name, grievance category, narrative keywords, and timeline).
5. **Real Evidence Handling:** Safe server-side evidence file upload, metadata tracking, and role-authorized file retrieval.
6. **Statutory SLA & Overdue Tracking:** Monitors statutory timelines and triggers automated alerts before or when SLA targets are breached.
7. **Immutable Audit History:** Chronologically traces status changes, bureau transfers, committee escalations, and officer assignments.
8. **Acknowledgement Printing & CSV Export:** Printable PDF-style grievance receipt and live filtered CSV export.

---

## 💻 2. Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS | Official Indian government service style (Navy `#0845A8`, slate-50, clean typography) |
| **Icons & Visuals** | Lucide-React, Recharts | Dynamic status donut charts, workload bars, SLA alerts, responsive layout |
| **Backend** | Python 3.12+, FastAPI, Uvicorn | High-performance REST endpoints, CORS restricted, Pydantic validation |
| **Database** | SQLite, SQLAlchemy 2.0 | Persistent relational database (`sentrix.db`) with foreign key constraints enabled |
| **Authentication** | PBKDF2-HMAC-SHA256 & JWT Tokens | Server-side password hashing (100,000 iterations), signed bearer tokens, role dependencies |
| **Matching Engine** | Pure Python Algorithms | Exact AICTE ID matching, token normalization, Levenshtein distance, Jaccard keyword similarity |
| **Automated Testing**| Pytest, Starlette TestClient, Node.js | 30 comprehensive backend security/workflow tests + frontend integrity verification |

---

## 🚀 3. Windows Installation & Startup Guide

### Prerequisites
- Windows 10 or 11
- Python 3.12+ installed
- Node.js 20+ installed (or bundled in `tools/node-v20.18.0-win-x64`)

### Option A: One-Click Startup (Recommended)
Double-click or run from PowerShell:
```cmd
run_sentrix.bat
```

### Option B: Individual Terminal Startup

**Terminal 1 — Backend (FastAPI on Port 8000):**
```powershell
Set-Location "backend"
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend (Vite on Port 5173):**
```powershell
Set-Location "frontend"
npm run dev -- --host 127.0.0.1 --port 5173

---

## 🧪 5. Automated Test Suites

### Running All Tests in One Command
Double-click or execute from PowerShell:
```cmd
run_tests.bat
```

### Running Backend Pytest Suite (30 Passed Tests)
```powershell
$env:PYTHONPATH = "e:\sih\backend"
python -m pytest backend/tests -v
```

**Verified Test Coverage:**
1. `test_login_flow`: Verifies password hashing and JWT token issuance for Admin, Reviewer, and Student.
2. `test_login_failure`: Verifies rejection (401) on invalid credentials.
3. `test_demo_otp_verification`: Verifies deterministic demo OTP handling and failure on bad OTP.
4. `test_unauthenticated_access_denied`: Confirms direct API requests without Bearer tokens return 401 Unauthorized.
5. `test_reviewer_bureau_isolation`: Confirms PGRC reviewers cannot access Regulation Bureau cases (403 Forbidden).
6. `test_complainant_case_isolation`: Confirms complainants cannot view other users' cases (403/404).
7. `test_complainant_cannot_access_internal_endpoints`: Confirms complainants cannot access `/api/overlaps` or `/api/reports`.
8. `test_dashboard_metrics_never_negative`: Confirms `under_process_cases >= 0` and mathematical consistency.
9. `test_evidence_upload_and_download_security`: Uploads test file to safe storage, validates metadata, and tests role-authorized download.
10. `test_complaint_creation_and_audit_log`: Verifies automatic Case ID generation and immutable audit log entry.
11. `test_complaint_status_transition_and_immutability`: Verifies status transitions and audit history.
12. `test_complaint_cross_bureau_transfer`: Verifies jurisdiction re-assignment between bureaus.
13. `test_officer_assignment`: Verifies officer assignment and history logs.
14. `test_overdue_case_detection`: Verifies SLA calculations from target due dates.
15. `test_dashboard_statistics_aggregation`: Verifies dynamic DB aggregation.
16. `test_reports_and_csv_generation`: Verifies CSV formatting and headers.
17. `test_institution_name_normalization`: Verifies token invariant matching.
18. `test_exact_institution_id_cross_bureau_detection`: Verifies AICTE ID matching and reason generation.
19. `test_probable_duplicate_detection`: Verifies duplicate identification.
20. `test_false_positive_review_and_dismissal`: Verifies official review decisions.

### Running End-to-End Journey Verification
Runs a full live integration test simulating the entire user journey:
```powershell
$env:PYTHONPATH = "e:\sih\backend"
$env:PYTHONIOENCODING = "utf-8"
python backend/tests/verify_full_journey.py
```

### Running Frontend Tests & Production Build
```powershell
Set-Location "frontend"
node tests/app.test.js
npm run build
```

---

## 🔍 4. Mathematical Definitions of Dashboard Metrics

All metrics are dynamically calculated directly from the database through SQL queries:

- **Total Complaints:** Total unique complaint records in `complaints`.
- **Active Under Inquiry:** Complaints currently in active progress (`Under Process`, `Under Review`, `Hearing Scheduled`, `Action Taken Report Awaited`, `Joint Investigation`). *Never calculated by blind subtraction; always $\ge 0$.*
- **Pending Initial Scrutiny:** Complaints awaiting first scrutiny (`Submitted`, `New`, `Pending Bureau Review`, `Pending Verification`).
- **Resolved / Disposed:** Closed complaints (`Disposed`, `Resolved`, `Closed`).
- **Overdue Cases:** Unresolved complaints whose target SLA date is earlier than today (`due_date < current_date`).
- **Deadlines Approaching:** Unresolved complaints due within the next 7 days.
- **Pairwise Match Alerts (`potential_match_pairs`):** Count of unique unordered candidate pairs flagged by the matching engine.
- **Cases Flagged for Overlap (`cases_flagged_for_overlap`):** Count of unique complaint cases involved in active non-dismissed overlap alerts ($\le \text{Total Complaints}$).

---

## 📂 5. Project File Structure

```
e:\sih\
├── backend\
│   ├── app\
│   │   ├── auth.py              # PBKDF2 password hashing & signed token authorization
│   │   ├── config.py            # CORS origins and configuration
│   │   ├── crud.py              # Database queries, metric aggregations & state transitions
│   │   ├── database.py          # SQLAlchemy engine, session & safe migrations
│   │   ├── main.py              # FastAPI application instance & router registry
│   │   ├── matcher.py           # Multi-signal explainable overlap detection algorithms
│   │   ├── models.py            # Relational models (Institutions, Complaints, Actions, Users)
│   │   ├── schemas.py           # Pydantic validation schemas
│   │   ├── seed_data.py         # 40 institutions, synthetic complaints & demo credentials
│   │   └── routers\
│   │       ├── auth.py          # /api/auth/login, /api/auth/verify-otp, /api/auth/me
│   │       ├── complaints.py    # /api/complaints CRUD, upload-evidence, verify, actions
│   │       ├── dashboard.py     # /api/dashboard/stats
│   │       ├── institutions.py  # /api/institutions directory
│   │       ├── notifications.py # /api/notifications & SLA alerts
│   │       ├── overlaps.py      # /api/overlaps & 3-way administrative review
│   │       └── reports.py       # /api/reports/summary & export-csv
│   ├── tests\
│   │   ├── test_api.py
│   │   ├── test_auth_and_security.py
│   │   ├── test_complaints.py
│   │   ├── test_dashboard_reports.py
│   │   ├── test_database.py
│   │   ├── test_matcher.py
│   │   └── verify_full_journey.py
│   ├── uploads\
│   │   └── evidence\            # Secure server-side evidence file storage
│   ├── sentrix.db               # Preserved relational SQLite database
│   ├── sentrix.db.original_unmodified # Untouched pristine backup copy
│   └── requirements.txt
├── frontend\
│   ├── src\
│   │   ├── components\
│   │   │   ├── AcknowledgementModal.jsx # Printable official grievance receipt
│   │   │   ├── Header.jsx               # Government header with authenticated user pill & logout
│   │   │   ├── Sidebar.jsx              # Role-filtered portal navigation
│   │   │   ├── MetricCard.jsx           # Clean KPI card
│   │   │   ├── StatusBadge.jsx
│   │   │   └── BureauBadge.jsx
│   │   ├── context\
│   │   │   └── AuthContext.jsx          # Live session management & token verification
│   │   ├── pages\
│   │   │   ├── LoginPage.jsx            # FIRST SCREEN: Official & Complainant OTP login
│   │   │   ├── Dashboard.jsx            # Real-time metrics, trend chart, workload, donut breakdown
│   │   │   ├── Complaints.jsx           # My Grievances (Complainant) & Queue (Reviewer/Admin)
│   │   │   ├── CaseDetails.jsx          # Case timeline, evidence, verification, internal notes
│   │   │   ├── Institutions.jsx         # Institution directory with contact info
│   │   │   ├── Overlaps.jsx             # 3-way overlap decision engine
│   │   │   ├── Reports.jsx              # Ageing histograms, regional trends, authenticated CSV export
│   │   │   └── Notifications.jsx        # SLA alerts & clarification notifications
│   │   ├── services\
│   │   │   └── api.js                   # Authenticated HTTP client with Bearer token header
│   │   ├── App.jsx                      # Protected route gating & root application component
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── run_backend.bat                      # Starts FastAPI backend on port 8000
├── run_frontend.bat                     # Starts Vite frontend on port 5173
├── run_sentrix.bat                      # Starts both services and opens browser to login
└── run_tests.bat                        # Runs full automated test suites
```

---
*Developed for Smart India Hackathon 2026 • AICTE Problem Statement SIH26264*
