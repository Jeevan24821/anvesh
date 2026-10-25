import re
import json
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Complaint, Institution, OverlapAlert, Notification

COMMON_STOPWORDS = {
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "up", "about", "into", "over", "after", "is", "are", "was",
    "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "this", "that", "these", "those", "i", "we", "he", "she", "it", "they",
    "their", "his", "her", "its", "our", "my", "your", "college", "institute",
    "technology", "engineering", "management", "campus", "group", "institution",
    "student", "students", "faculty", "management", "administration"
}

def clean_text(text: str) -> str:
    """Lowercases, strips punctuation, and normalizes whitespace."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def tokenize(text: str) -> set:
    """Tokenizes text and removes common stopwords."""
    cleaned = clean_text(text)
    words = cleaned.split()
    return {w for w in words if len(w) > 2 and w not in COMMON_STOPWORDS}

def normalize_institution_name(name: str) -> str:
    """Creates a normalized signature of an institution name for robust comparison."""
    tokens = sorted(list(tokenize(name)))
    return " ".join(tokens)

def levenshtein_distance(s1: str, s2: str) -> int:
    """Computes basic Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def string_similarity_ratio(s1: str, s2: str) -> float:
    """Returns ratio between 0.0 and 1.0 based on Levenshtein distance."""
    s1_clean = clean_text(s1)
    s2_clean = clean_text(s2)
    if not s1_clean or not s2_clean:
        return 0.0
    if s1_clean == s2_clean:
        return 1.0
    max_len = max(len(s1_clean), len(s2_clean))
    if max_len == 0:
        return 1.0
    dist = levenshtein_distance(s1_clean, s2_clean)
    return max(0.0, 1.0 - (dist / max_len))

def jaccard_similarity(tokens1: set, tokens2: set) -> float:
    """Calculates Jaccard similarity between two sets of tokens."""
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    if not union:
        return 0.0
    return len(intersection) / len(union)

def evaluate_complaint_pair(c1: Complaint, c2: Complaint) -> Optional[Dict[str, Any]]:
    """
    Evaluates whether two complaints represent an institution-level cross-bureau overlap
    or a probable duplicate complaint.
    Returns matching metadata if threshold met, else None.
    """
    if c1.id == c2.id:
        return None

    # Institution Matching
    inst1 = c1.institution
    inst2 = c2.institution
    if not inst1 or not inst2:
        return None

    exact_aicte_match = (inst1.aicte_id and inst2.aicte_id and inst1.aicte_id.strip() == inst2.aicte_id.strip())
    
    # Institution name similarity
    name_sim = string_similarity_ratio(inst1.name, inst2.name)
    norm1 = normalize_institution_name(inst1.name)
    norm2 = normalize_institution_name(inst2.name)
    norm_sim = string_similarity_ratio(norm1, norm2)
    best_inst_sim = max(name_sim, norm_sim)

    # Institution must match strongly (either exact AICTE ID or >= 0.82 name similarity)
    if not exact_aicte_match and best_inst_sim < 0.82:
        return None

    reasons = []
    confidence_score = 0.0

    if exact_aicte_match:
        reasons.append(f"Exact AICTE Permanent Institution ID verified: {inst1.aicte_id}")
        confidence_score += 0.50
    else:
        reasons.append(
            f"Likely institution name variant match ({int(best_inst_sim * 100)}% similarity): "
            f"'{inst1.name}' vs '{inst2.name}'"
        )
        confidence_score += 0.40

    # Cross-Bureau vs Same Bureau
    is_cross_bureau = (c1.source_bureau != c2.source_bureau)
    if is_cross_bureau:
        reasons.append(
            f"Cross-Bureau involvement detected: '{c1.source_bureau}' (Case {c1.case_id}) "
            f"and '{c2.source_bureau}' (Case {c2.case_id})"
        )
        confidence_score += 0.20
    else:
        reasons.append(f"Same Bureau active case ({c1.source_bureau})")

    # Category matching
    cat_match = (c1.category == c2.category)
    if cat_match:
        reasons.append(f"Identical grievance category: '{c1.category}'")
        confidence_score += 0.15

    # Description text similarity
    tokens_c1 = tokenize(c1.description + " " + c1.subject)
    tokens_c2 = tokenize(c2.description + " " + c2.subject)
    text_sim = jaccard_similarity(tokens_c1, tokens_c2)
    shared_keywords = sorted(list(tokens_c1.intersection(tokens_c2)))[:5]

    if text_sim >= 0.35:
        reasons.append(
            f"High narrative overlap ({int(text_sim * 100)}% keyword match). "
            f"Common keywords: {', '.join(shared_keywords)}"
        )
        confidence_score += min(0.25, text_sim * 0.30)
    elif shared_keywords:
        reasons.append(f"Shared case keywords: {', '.join(shared_keywords)}")
        confidence_score += 0.05

    # Cap confidence score at 0.98
    confidence_score = min(0.98, round(confidence_score, 2))

    # Determine overlap type and confidence label
    # 1. Probable Duplicate: High narrative overlap and category match, or very high text similarity
    if (text_sim >= 0.35 and cat_match) or text_sim >= 0.50:
        overlap_type = "Probable Duplicate Complaint"
        if confidence_score >= 0.70:
            confidence_label = "High"
        else:
            confidence_label = "Medium"
    elif is_cross_bureau:
        # Cross-bureau: Same institution alone is NOT sufficient.
        # Must have shared grievance category, narrative similarity (>= 0.15), or shared keywords
        if not cat_match and text_sim < 0.15 and len(shared_keywords) < 2:
            # Separate, unrelated matters at the same institution
            return None
        overlap_type = "Cross-Bureau Institution Overlap"
        if confidence_score >= 0.70 and (cat_match or text_sim >= 0.25):
            confidence_label = "High"
        elif confidence_score >= 0.55:
            confidence_label = "Medium"
        else:
            confidence_label = "Low"
    else:
        # Same institution and same bureau
        if not cat_match and text_sim < 0.18:
            # Different unrelated complaints at the same institution
            return None
        overlap_type = "Potential Intra-Bureau Duplicate"
        confidence_label = "Medium" if confidence_score >= 0.60 else "Low"

    min_id = min(c1.id, c2.id)
    max_id = max(c1.id, c2.id)
    pair_key = f"{min_id}_{max_id}"

    return {
        "complaint_id_1": min_id,
        "complaint_id_2": max_id,
        "pair_key": pair_key,
        "overlap_type": overlap_type,
        "confidence_score": confidence_score,
        "confidence_label": confidence_label,
        "match_reasons": reasons
    }

def run_overlap_detection_for_complaint(db: Session, complaint: Complaint) -> List[OverlapAlert]:
    """
    Evaluates a specific complaint against other active complaints in the system.
    Inserts or updates non-dismissed overlap alerts.
    """
    active_complaints = db.query(Complaint).filter(
        Complaint.id != complaint.id,
        Complaint.status != "Disposed"
    ).all()

    created_alerts = []
    for other in active_complaints:
        result = evaluate_complaint_pair(complaint, other)
        if not result:
            continue

        pair_key = result["pair_key"]
        existing = db.query(OverlapAlert).filter(OverlapAlert.pair_key == pair_key).first()

        if existing:
            # If already confirmed or dismissed by official, preserve decision
            if existing.status in ["Confirmed Linked", "Dismissed False Positive"]:
                continue
            # Update reasons and score
            existing.confidence_score = result["confidence_score"]
            existing.confidence_label = result["confidence_label"]
            existing.match_reasons = json.dumps(result["match_reasons"])
            existing.overlap_type = result["overlap_type"]
            created_alerts.append(existing)
        else:
            alert = OverlapAlert(
                complaint_id_1=result["complaint_id_1"],
                complaint_id_2=result["complaint_id_2"],
                pair_key=pair_key,
                overlap_type=result["overlap_type"],
                confidence_score=result["confidence_score"],
                confidence_label=result["confidence_label"],
                match_reasons=json.dumps(result["match_reasons"]),
                status="Pending Review"
            )
            db.add(alert)
            db.flush()

            # Create notification for involved bureaus
            notif = Notification(
                type="OVERLAP_DETECTED",
                title=f"Potential Overlap Detected ({result['confidence_label']} Confidence)",
                message=(
                    f"Possible {result['overlap_type']} between Case #{complaint.case_id} "
                    f"and Case #{other.case_id} at {complaint.institution.name}."
                ),
                severity="high" if result["confidence_label"] == "High" else "medium",
                complaint_id=complaint.id,
                bureau=complaint.source_bureau
            )
            db.add(notif)
            created_alerts.append(alert)

    db.commit()
    return created_alerts

def run_full_overlap_scan(db: Session) -> int:
    """Scans all active complaints and populates overlap alerts."""
    active_cases = db.query(Complaint).filter(Complaint.status != "Disposed").all()
    count = 0
    for i in range(len(active_cases)):
        for j in range(i + 1, len(active_cases)):
            c1 = active_cases[i]
            c2 = active_cases[j]
            result = evaluate_complaint_pair(c1, c2)
            if not result:
                continue

            pair_key = result["pair_key"]
            existing = db.query(OverlapAlert).filter(OverlapAlert.pair_key == pair_key).first()

            if not existing:
                alert = OverlapAlert(
                    complaint_id_1=result["complaint_id_1"],
                    complaint_id_2=result["complaint_id_2"],
                    pair_key=pair_key,
                    overlap_type=result["overlap_type"],
                    confidence_score=result["confidence_score"],
                    confidence_label=result["confidence_label"],
                    match_reasons=json.dumps(result["match_reasons"]),
                    status="Pending Review"
                )
                db.add(alert)
                count += 1

    db.commit()
    return count


# --- Rules-Based Explainable Priority & Routing Assessment ---

def calculate_suggested_priority(
    category: str,
    subject: str,
    description: str,
    complainant_type: str = "Student"
) -> Tuple[str, str]:
    """
    Transparent rules-based priority engine.
    Calculates explainable priority based on safety risks, category severity, urgency signals, and deadlines.
    Returns (priority, explanation).
    """
    text = (subject + " " + description).lower()
    
    # 1. Critical safety / immediate peril (Urgent - 15 Days)
    urgent_keywords = [
        "ragging", "threat", "harassment", "physical abuse", "assault", "suicide",
        "safety", "police", "extortion", "severe danger", "caste discrimination", "violence",
        "emergency", "expulsion threat", "sexual harassment", "strike"
    ]
    matched_urgent = [w for w in urgent_keywords if w in text]
    
    if category == "Ragging & Student Harassment" or len(matched_urgent) >= 2:
        reason = (
            f"Safety & Student Welfare Trigger: Grievance category '{category}' "
            f"contains high-severity indicators ({', '.join(matched_urgent[:3]) if matched_urgent else 'statutory anti-ragging priority'}). "
            f"Statutory resolution SLA: 15 Calendar Days."
        )
        return "Urgent", reason
    
    if matched_urgent:
        reason = (
            f"Urgency Signal Detected: Narrative contains critical marker '{matched_urgent[0]}'. "
            f"Requires expedited scrutiny within 15 Calendar Days."
        )
        return "Urgent", reason

    # 2. Statutory / Legal / Academic Blockage (High - 30 Days)
    high_keywords = [
        "certificate", "degree", "original", "withholding", "capitation", "excess fee",
        "hall ticket", "exam barred", "admit card", "unapproved", "affiliation", "cancelled",
        "court", "legal notice", "penalty", "retaliation"
    ]
    matched_high = [w for w in high_keywords if w in text]
    
    high_categories = [
        "Fee Overcharging / Capitation",
        "Withholding Original Certificates",
        "Admissions & Affiliation Irregularities",
        "Governance Malpractice & Retaliation"
    ]
    if category in high_categories or len(matched_high) >= 2:
        reason = (
            f"Statutory Norm Breach: Grievance under '{category}' directly affects institutional compliance "
            f"or student credentials ({', '.join(matched_high[:3]) if matched_high else 'statutory mandate'}). "
            f"Standard investigation SLA: 30 Calendar Days."
        )
        return "High", reason

    # 3. Institutional Amenities & Operational (Medium - 45 Days)
    medium_categories = [
        "Faculty Non-Payment & Understaffing",
        "Infrastructure & Laboratory Deficit",
        "Unapproved Courses & Excess Intake",
        "Misappropriation of Grant Funds"
    ]
    if category in medium_categories:
        reason = (
            f"Institutional Governance Review: Category '{category}' requires factual enquiry and institution response. "
            f"Procedural SLA: 45 Calendar Days."
        )
        return "Medium", reason

    # 4. Low Priority / Routine (Low - 60 Days)
    reason = (
        f"Standard Procedural Review: General administrative matter under '{category}'. "
        f"Standard SLA: 60 Calendar Days."
    )
    return "Low", reason


def suggest_bureau_routing(category: str, subject: str = "", description: str = "") -> Tuple[str, str]:
    """
    Transparent category-to-bureau routing rules.
    Returns (suggested_bureau, routing_rationale).
    """
    text = (subject + " " + description).lower()

    if category == "Ragging & Student Harassment" or "ragging" in text:
        return (
            "Anti-Ragging Cell (ARC)",
            "Anti-Ragging Cell has specialized statutory jurisdiction over safety, harassment, and zero-tolerance compliance."
        )
    elif category in ["Fee Overcharging / Capitation", "Withholding Original Certificates", "Admissions & Affiliation Irregularities"]:
        return (
            "Regulation Bureau (RB)",
            "Regulation Bureau monitors AICTE Approval Process Handbook norm compliance, capitation fee prohibitions, and affiliation validity."
        )
    elif category in ["Infrastructure & Laboratory Deficit", "Unapproved Courses & Excess Intake"]:
        return (
            "Approval Bureau (AB)",
            "Approval Bureau oversees institutional infrastructure norms, approved intake capacities, and land/laboratory requirements."
        )
    elif category == "Misappropriation of Grant Funds":
        return (
            "Policy & Academic Planning Bureau (PAPB)",
            "PAPB oversees AICTE grant utilization, scheme distributions, research sanctions, and financial allocations."
        )
    elif "skill" in category.lower() or "vocational" in text:
        return (
            "Skill Development Cell (SDC)",
            "SDC coordinates vocational, apprenticeship, and skilling initiative complaints."
        )
    else:
        return (
            "PGRC (Public Grievance Redressal)",
            "Public Grievance Redressal Cell manages student, faculty, and stakeholder administrative appeals."
        )

