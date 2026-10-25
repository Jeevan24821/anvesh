import sys
import argparse
from datetime import datetime, date, timedelta
from app.database import engine, SessionLocal, Base
from app.models import Institution, Complaint, CaseAction, CaseAssignment, OverlapAlert, Notification, User
from app.seed_data import generate_sample_database_records
from app.matcher import normalize_institution_name, run_full_overlap_scan
from app.auth import hash_password

DEMO_ACCOUNTS = [
    {
        "username": "admin",
        "full_name": "Dr. K. N. Satyanarayana",
        "email": "admin@aicte-india.org",
        "role": "Administrator",
        "bureau": "All",
        "designation": "AICTE Central Administrator & Member Secretary",
        "password": "Admin@123",
        "complainant_id": None,
        "phone": "+91-11-29581000"
    },
    {
        "username": "reviewer_pgrc",
        "full_name": "Dr. Sunita Sharma",
        "email": "sunita.sharma@aicte-pgrc.gov.in",
        "role": "Reviewer",
        "bureau": "PGRC (Public Grievance Redressal)",
        "designation": "Chief Redressal Officer, PGRC",
        "password": "Reviewer@123",
        "complainant_id": None,
        "phone": "+91-11-29581011"
    },
    {
        "username": "reviewer_rb",
        "full_name": "Er. Rajesh Verma",
        "email": "rajesh.verma@aicte-rb.gov.in",
        "role": "Reviewer",
        "bureau": "Regulation Bureau (RB)",
        "designation": "Joint Director, Regulation Bureau",
        "password": "Reviewer@123",
        "complainant_id": None,
        "phone": "+91-11-29581022"
    },
    {
        "username": "officer_pgrc",
        "full_name": "Shri Arvind Swamy",
        "email": "arvind.swamy@aicte-pgrc.gov.in",
        "role": "Bureau Officer",
        "bureau": "PGRC (Public Grievance Redressal)",
        "designation": "Public Grievance Redressal Officer",
        "password": "Officer@123",
        "complainant_id": None,
        "phone": "+91-11-29581033"
    },
    {
        "username": "student",
        "full_name": "Priya Nair",
        "email": "priya.nair@dsce.edu.in",
        "role": "Complainant",
        "bureau": "Complainant Portal",
        "designation": "Student (USN: 1DS22CS089)",
        "password": "Student@123",
        "complainant_id": "1DS22CS089",
        "phone": "+91-9845012345"
    },
    {
        "username": "inst_user",
        "full_name": "Dr. Ramesh Chandra (Nodal Officer)",
        "email": "nodal.officer@aryavart.edu.in",
        "role": "Complainant",
        "bureau": "Complainant Portal",
        "designation": "Institution Representative (AICTE ID: 1-3349102801)",
        "password": "Institution@123",
        "complainant_id": "1-3349102801",
        "phone": "+91-9845077777"
    },
    {
        "username": "parent",
        "full_name": "Suresh Menon",
        "email": "suresh.menon@gmail.com",
        "role": "Complainant",
        "bureau": "Complainant Portal",
        "designation": "Parent / Guardian",
        "password": "Parent@123",
        "complainant_id": "PAR-984501",
        "phone": "+91-9845099999"
    },
    {
        "username": "viewer",
        "full_name": "Shri Rameshwar Gupta",
        "email": "rameshwar.gupta@gov.in",
        "role": "Viewer",
        "bureau": "All",
        "designation": "Ministry Scrutiny Auditor",
        "password": "Viewer@123",
        "complainant_id": None,
        "phone": "+91-11-29581099"
    }
]

def seed_demo_users(db):
    """Idempotently creates or updates predefined demo user accounts."""
    print(f"[SENTRIX Seed] Seeding / updating {len(DEMO_ACCOUNTS)} predefined demo users...")
    updated = 0
    created = 0
    for u in DEMO_ACCOUNTS:
        existing = db.query(User).filter(User.username == u["username"]).first()
        h, s = hash_password(u["password"])
        if existing:
            existing.full_name = u["full_name"]
            existing.email = u["email"]
            existing.role = u["role"]
            existing.bureau = u["bureau"]
            existing.designation = u["designation"]
            existing.password_hash = h
            existing.salt = s
            existing.complainant_id = u["complainant_id"]
            existing.phone = u["phone"]
            existing.is_active = True
            updated += 1
        else:
            new_user = User(
                username=u["username"],
                full_name=u["full_name"],
                email=u["email"],
                role=u["role"],
                bureau=u["bureau"],
                designation=u["designation"],
                password_hash=h,
                salt=s,
                complainant_id=u["complainant_id"],
                phone=u["phone"],
                is_active=True
            )
            db.add(new_user)
            created += 1
    db.commit()
    print(f"[SENTRIX Seed] Demo users sync complete: {created} created, {updated} updated.")

def seed_database(force_reset: bool = False, users_only: bool = False):
    """
    Safely seeds the SQLite database.
    Does NOT overwrite existing data unless force_reset is True.
    """
    if force_reset:
        print("[SENTRIX Seed] Reset flag specified. Dropping existing tables and rebuilding...")
        Base.metadata.drop_all(bind=engine)

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    print("[SENTRIX Seed] Database tables verified/created successfully.")

    db = SessionLocal()
    try:
        if users_only:
            seed_demo_users(db)
            return

        # Check if already populated
        existing_institutions = db.query(Institution).count()
        existing_complaints = db.query(Complaint).count()

        if existing_institutions > 0 and not force_reset:
            print(f"[SENTRIX Seed] Database already contains {existing_institutions} institutions and {existing_complaints} complaints.")
            print("[SENTRIX Seed] Safe mode: Updating demo users while preserving existing records...")
            seed_demo_users(db)
            return

        # Seed demo users
        seed_demo_users(db)

        data = generate_sample_database_records()

        # 2. Seed Institutions
        print(f"[SENTRIX Seed] Seeding {len(data['institutions'])} technical institutions across AICTE regions...")
        for inst in data["institutions"]:
            norm_name = normalize_institution_name(inst["name"])
            inst_obj = Institution(
                aicte_id=inst["aicte_id"],
                name=inst["name"],
                normalized_name=norm_name,
                institution_type=inst["type"],
                region=inst["region"],
                state=inst["state"],
                district=inst["district"],
                address=inst["address"],
                pincode=inst["pincode"],
                contact_email=inst["email"],
                contact_phone=inst["phone"],
                principal_name=inst["principal"],
                approval_status=inst["status"]
            )
            db.add(inst_obj)
        db.commit()

        # 3. Seed Complaints & Audit Actions
        print(f"[SENTRIX Seed] Seeding {len(data['complaints'])} complaint cases with audit history...")
        today = date.today()

        for c in data["complaints"]:
            complaint_obj = Complaint(
                case_id=c["case_id"],
                institution_id=c["institution_id"],
                source_bureau=c["source_bureau"],
                complainant_type=c["complainant_type"],
                complainant_name=c["complainant_name"],
                category=c["category"],
                subject=c["subject"],
                description=c["description"],
                priority=c["priority"],
                status=c["status"],
                assigned_officer=c["assigned_officer"],
                received_date=c["received_date"],
                due_date=c["due_date"],
                next_action_due=c["next_action_due"],
                resolution_summary=c["resolution_summary"],
                disposed_date=c["disposed_date"]
            )
            db.add(complaint_obj)
            db.flush()

            # Create initial filing action (Immutable Audit Log)
            filing_action = CaseAction(
                complaint_id=complaint_obj.id,
                action_type="Complaint Registered",
                from_value=None,
                to_value="New",
                actor_name="AICTE Central Grievance Portal Intake",
                actor_role="System Automator",
                actor_bureau=c["source_bureau"],
                remarks=f"Initial complaint submitted by {c['complainant_name']} ({c['complainant_type']}).",
                created_at=datetime.combine(c["received_date"], datetime.min.time()) + timedelta(hours=9)
            )
            db.add(filing_action)

            # If assigned or under process, record assignment & status actions
            if c["status"] != "New":
                assign_action = CaseAction(
                    complaint_id=complaint_obj.id,
                    action_type="Officer Assignment",
                    from_value="Unassigned",
                    to_value=c["assigned_officer"],
                    actor_name="Bureau Head / Nodal Officer",
                    actor_role="Bureau Head",
                    actor_bureau=c["source_bureau"],
                    remarks=f"Case assigned to {c['assigned_officer']} for investigation and preliminary scrutiny.",
                    created_at=datetime.combine(c["received_date"], datetime.min.time()) + timedelta(days=2, hours=11)
                )
                db.add(assign_action)

                status_action = CaseAction(
                    complaint_id=complaint_obj.id,
                    action_type="Status Change",
                    from_value="New",
                    to_value=c["status"],
                    actor_name=c["assigned_officer"],
                    actor_role="Bureau Officer",
                    actor_bureau=c["source_bureau"],
                    remarks=f"Case progressed to '{c['status']}' following verification of supporting documents.",
                    created_at=datetime.combine(c["received_date"], datetime.min.time()) + timedelta(days=5, hours=14)
                )
                db.add(status_action)

            # If disposed, record resolution action
            if c["status"] == "Disposed":
                disposal_action = CaseAction(
                    complaint_id=complaint_obj.id,
                    action_type="Disposal",
                    from_value="Hearing Scheduled",
                    to_value="Disposed",
                    actor_name=c["assigned_officer"],
                    actor_role="Bureau Officer",
                    actor_bureau=c["source_bureau"],
                    remarks=c["resolution_summary"] or "Case resolved and closed with official compliance order.",
                    created_at=datetime.combine(c["disposed_date"], datetime.min.time()) + timedelta(hours=16)
                )
                db.add(disposal_action)

            # Notifications for overdue / approaching deadlines
            if c["status"] != "Disposed":
                if c["due_date"] < today:
                    days_over = (today - c["due_date"]).days
                    notif = Notification(
                        type="OVERDUE_ALERT",
                        title=f"CRITICAL: Case {c['case_id']} Overdue by {days_over} Days",
                        message=f"Mandatory SLA target breached for {c['subject']} at assigned bureau {c['source_bureau']}.",
                        severity="urgent",
                        complaint_id=complaint_obj.id,
                        bureau=c["source_bureau"]
                    )
                    db.add(notif)
                elif (c["due_date"] - today).days <= 5:
                    days_left = (c["due_date"] - today).days
                    notif = Notification(
                        type="UPCOMING_DEADLINE",
                        title=f"Deadline Approaching: Case {c['case_id']}",
                        message=f"Resolution target due in {days_left} days for case under {c['source_bureau']}.",
                        severity="medium",
                        complaint_id=complaint_obj.id,
                        bureau=c["source_bureau"]
                    )
                    db.add(notif)

        db.commit()

        # 4. Run Overlap Matching Engine across all complaints
        print("[SENTRIX Seed] Running explainable Overlap Detection Engine across database...")
        overlap_count = run_full_overlap_scan(db)
        print(f"[SENTRIX Seed] Overlap scan completed! Generated {overlap_count} explainable overlap alerts.")

        total_institutions = db.query(Institution).count()
        total_complaints = db.query(Complaint).count()
        total_alerts = db.query(OverlapAlert).count()
        total_notifs = db.query(Notification).count()

        print("\n================ SENTRIX DATABASE READY ================")
        print(f" Institutions : {total_institutions}")
        print(f" Complaints   : {total_complaints}")
        print(f" Overlap Alerts: {total_alerts}")
        print(f" Notifications: {total_notifs}")
        print("========================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[SENTRIX Seed ERROR] Failed during seeding: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the SENTRIX AICTE SQLite Database.")
    parser.add_argument("--reset", "--force", dest="force", action="store_true", help="Drop and recreate all tables.")
    parser.add_argument("--users", dest="users_only", action="store_true", help="Idempotently seed or update predefined demo users only.")
    args = parser.parse_args()

    seed_database(force_reset=args.force, users_only=args.users_only)
