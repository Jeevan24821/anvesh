import pytest
from app.database import SessionLocal
from app.models import Complaint, Institution, OverlapAlert
from app.matcher import (
    normalize_institution_name, string_similarity_ratio, jaccard_similarity,
    evaluate_complaint_pair
)
from app.crud import review_overlap_alert

def test_institution_name_normalization():
    """Tests normalization and fuzzy variant matching logic."""
    name1 = "Sahyadri College of Advanced Engineering"
    name2 = "Sahyadri Institute of Engineering & Technology"
    norm1 = normalize_institution_name(name1)
    norm2 = normalize_institution_name(name2)

    # Both contain 'sahyadri'
    assert "sahyadri" in norm1
    assert "sahyadri" in norm2

    # String similarity tests
    sim_exact = string_similarity_ratio("Aryavart Institute", "Aryavart Institute")
    assert sim_exact == 1.0

    sim_typo = string_similarity_ratio("Aryavart Institute", "Aryawart Institute")
    assert sim_typo > 0.85

def test_exact_institution_id_cross_bureau_detection():
    """Tests that complaints from the same institution across different bureaus are flagged with explainable reasons."""
    db = SessionLocal()
    try:
        # Fetch the two explicitly seeded demo overlap complaints for Aryavart (ID: 1)
        c1 = db.query(Complaint).filter(Complaint.case_id == "AICTE-2026-PGRC-0482").first()
        c2 = db.query(Complaint).filter(Complaint.case_id == "AICTE-2026-RB-1193").first()

        assert c1 is not None
        assert c2 is not None
        assert c1.institution_id == c2.institution_id
        assert c1.source_bureau != c2.source_bureau

        match_result = evaluate_complaint_pair(c1, c2)
        assert match_result is not None
        assert match_result["overlap_type"] in ["Cross-Bureau Institution Overlap", "Probable Duplicate Complaint"]
        assert match_result["confidence_score"] >= 0.70
        assert match_result["confidence_label"] == "High"

        # Check explainability reasons
        reasons_text = " ".join(match_result["match_reasons"])
        assert "Exact AICTE Permanent Institution ID verified" in reasons_text
        assert "Cross-Bureau involvement detected" in reasons_text
    finally:
        db.close()

def test_probable_duplicate_detection():
    """Tests duplicate detection for complaints with high narrative and category similarity."""
    db = SessionLocal()
    try:
        c1 = db.query(Complaint).filter(Complaint.case_id == "AICTE-2026-PGRC-0511").first()
        c2 = db.query(Complaint).filter(Complaint.case_id == "AICTE-2026-PGRC-0519").first()

        assert c1 is not None
        assert c2 is not None

        match_result = evaluate_complaint_pair(c1, c2)
        assert match_result is not None
        assert match_result["overlap_type"] == "Probable Duplicate Complaint"
        assert match_result["confidence_label"] == "High"
    finally:
        db.close()

def test_false_positive_review_and_dismissal():
    """Tests reviewing an overlap alert: Confirming link vs Dismissing false positive."""
    db = SessionLocal()
    try:
        alert = db.query(OverlapAlert).filter(OverlapAlert.status == "Pending Review").first()
        assert alert is not None
        alert_id = alert.id

        # 1. Dismiss as false positive
        dismiss_result = review_overlap_alert(
            db,
            alert_id=alert_id,
            decision="DISMISS_FALSE_POSITIVE",
            reviewed_by="Dr. Sunita Sharma",
            remarks="Investigated by committee; cases concern two distinct individual matters with no systemic overlap."
        )
        assert dismiss_result["status"] == "Dismissed False Positive"
        assert "Dismissed" in dismiss_result["review_decision"]

        # 2. Re-confirm or test another alert confirmation
        another_alert = db.query(OverlapAlert).filter(OverlapAlert.status == "Pending Review").first()
        if another_alert:
            confirm_result = review_overlap_alert(
                db,
                alert_id=another_alert.id,
                decision="CONFIRM_LINK",
                reviewed_by="Member Secretary",
                remarks="Confirmed common systemic grievance across bureaus. Linked for joint inquiry."
            )
            assert confirm_result["status"] == "Confirmed Linked"
    finally:
        db.close()
