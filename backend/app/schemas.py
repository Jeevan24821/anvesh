import re
from datetime import date, datetime
from typing import List, Optional, Any, Dict, Tuple
from pydantic import BaseModel, Field, ConfigDict


def validate_complaint_description(desc: str) -> Tuple[bool, str]:
    """
    Robust algorithmic validator for grievance narrative descriptions.
    Enforces genuine grievance content without external paid AI APIs.
    Rejects:
    - Empty, whitespace-only, or < 15 character inputs
    - Obvious keyboard mash / test sequences (e.g. 'asdfghjkl', 'qwertyuiop', 'abc')
    - Repeated single characters or repeated words spam ('aaaaaaaa', 'test test test')
    - Random alphabetic sequences with abnormal consonant clusters or no vowels in Latin text
    Accepts:
    - Concise valid grievances (e.g. 'Fee refund denied', 'Hostel harassment')
    - Detailed multi-sentence narratives
    - Non-English / Indian languages (Hindi, Tamil, Telugu, etc.)
    - Text containing numbers, punctuation, or mixed case
    """
    if not desc or not isinstance(desc, str):
        return False, "Please provide a meaningful description of your grievance, including what happened."

    text = desc.strip()
    if len(text) < 15:
        return False, "Please provide a meaningful description of your grievance (minimum 15 characters), including what happened."

    words = [w for w in re.split(r'\s+', text) if len(w) > 0]
    if len(words) < 2:
        return False, "Please provide a meaningful description of your grievance with at least 2 words explaining what happened."

    # Check for repeating the exact same word multiple times (e.g. 'test test test test')
    cleaned_words = [re.sub(r'[^a-zA-Z0-9]', '', w.lower()) for w in words]
    non_empty = [w for w in cleaned_words if len(w) > 0]
    if len(non_empty) >= 3 and len(set(non_empty)) <= 1:
        return False, "Please provide a meaningful description of your grievance, including what happened."

    # Check if text contains Indian languages (Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam, etc.)
    indic_match = re.search(r'[\u0900-\u0D7F]', text)
    if indic_match:
        unique_indic = set(re.findall(r'[\u0900-\u0D7F]', text))
        if len(unique_indic) < 4:
            return False, "Please provide a meaningful description of your grievance, including what happened."
        return True, ""

    # Alphanumeric check for Latin / English text
    alnum_chars = [c.lower() for c in text if c.isalnum()]
    if len(alnum_chars) < 10:
        return False, "Please provide a meaningful description of your grievance, including what happened."

    unique_chars = set(alnum_chars)
    if len(unique_chars) <= 3:
        return False, "Please provide a meaningful description of your grievance, including what happened."

    # Excessive repeated single char run (e.g. 'aaaaa', 'xxxxxxx')
    if re.search(r'([a-zA-Z])\1{4,}', text):
        return False, "Please provide a meaningful description of your grievance, including what happened."

    # Keyboard mash rows check
    compact = re.sub(r'[^a-zA-Z0-9]', '', text).lower()
    mash_patterns = [
        r'(?i)(asdf|ghjkl|qwerty|yuiop|zxcv|xcvbnm|12345|abcdef)',
    ]
    mash_count = 0
    for pat in mash_patterns:
        if re.search(pat, compact):
            mash_count += 1
    if mash_count > 0 and len(compact) < 40:
        return False, "Please provide a meaningful description of your grievance, including what happened."

    # Vowel to consonant ratio check for Latin text
    letters = [c.lower() for c in text if 'a' <= c.lower() <= 'z']
    if len(letters) >= 10:
        vowels = sum(1 for c in letters if c in 'aeiouy')
        vowel_ratio = vowels / len(letters)
        # Natural English is 25-45% vowels. Gibberish like 'sdfghjklmn' has 0% or < 12%
        if vowel_ratio < 0.12 or vowel_ratio > 0.85:
            return False, "Please provide a meaningful description of your grievance, including what happened."

    # Long consonant cluster check (e.g. 'sdfghjk')
    if re.search(r'(?i)[bcdfghjklmnpqrstvwxz]{6,}', text):
        return False, "Please provide a meaningful description of your grievance, including what happened."

    return True, ""


# --- Institution Schemas ---
class InstitutionBase(BaseModel):
    aicte_id: str
    name: str
    institution_type: str = "Engineering & Technology"
    region: str
    state: str
    district: str
    address: str
    pincode: str
    contact_email: str
    contact_phone: str
    principal_name: str
    approval_status: str = "Approved"

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionResponse(InstitutionBase):
    id: int
    normalized_name: str
    complaint_count: Optional[int] = 0
    active_complaints: Optional[int] = 0
    overdue_complaints: Optional[int] = 0
    overlap_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# --- Case Action Schemas (Audit Log) ---
class CaseActionResponse(BaseModel):
    id: int
    complaint_id: int
    action_type: str
    from_value: Optional[str] = None
    to_value: Optional[str] = None
    actor_name: str
    actor_role: str
    actor_bureau: Optional[str] = None
    remarks: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Case Assignment Schemas ---
class CaseAssignmentResponse(BaseModel):
    id: int
    complaint_id: int
    officer_name: str
    bureau: str
    assigned_by: str
    status: str
    assigned_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Complaint Schemas ---
class ComplaintBase(BaseModel):
    institution_id: int
    source_bureau: Optional[str] = None
    complainant_id: Optional[str] = "user_demo"
    complainant_type: str = "Student"
    complainant_affiliation: Optional[str] = "Student"
    complainant_id_number: Optional[str] = None
    complainant_name: Optional[str] = "Complainant"
    complainant_email: Optional[str] = "confidential@sih-sentrix.nic.in"
    complainant_phone: Optional[str] = "+91-XXXXXXXXXX"
    is_anonymous: Optional[bool] = False
    category: str
    subject: str
    description: str
    priority: Optional[str] = None
    due_date: Optional[date] = None
    next_action_due: Optional[date] = None
    evidence_files: Optional[List[Dict[str, Any]]] = []

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintVerifyRequest(BaseModel):
    confirmed_priority: Optional[str] = None
    priority_override_reason: Optional[str] = None
    verified_by: str = "Authorized Reviewer"
    remarks: str = "Verified and accepted for formal investigation."

class ComplaintInfoRequest(BaseModel):
    request_notes: str
    requested_by: str = "Reviewing Officer"

class ComplaintInfoResponse(BaseModel):
    response_notes: str
    complainant_id: Optional[str] = None

class ComplaintRejectRequest(BaseModel):
    rejection_reason: str
    rejected_by: str = "Reviewing Official"

class ComplaintFeedbackRequest(BaseModel):
    rating: int = Field(5, ge=1, le=5)
    feedback: Optional[str] = None
    feedback_text: Optional[str] = None

class PriorityAssessmentRequest(BaseModel):
    category: str
    subject: str
    description: str
    complainant_type: Optional[str] = "Student"

class PriorityAssessmentResponse(BaseModel):
    suggested_priority: str
    priority_reason: str
    suggested_bureau: str
    routing_reason: str
    statutory_sla_days: int

class ComplaintUpdate(BaseModel):
    priority: Optional[str] = None
    due_date: Optional[date] = None
    next_action_due: Optional[date] = None
    resolution_summary: Optional[str] = None
    actor_name: str = "Authorized AICTE Official"
    actor_role: str = "Bureau Officer"
    actor_bureau: Optional[str] = None
    remarks: Optional[str] = "General details updated"

class ComplaintStatusUpdate(BaseModel):
    status: str
    actor_name: str = "Authorized AICTE Official"
    actor_role: str = "Bureau Officer"
    actor_bureau: Optional[str] = None
    remarks: str
    resolution_summary: Optional[str] = None

class ComplaintActionTakenRequest(BaseModel):
    action_type: str = "Action Taken Report Awaited"
    action_details: str
    new_status: Optional[str] = None
    is_completed: bool = False
    next_follow_up_date: Optional[date] = None
    officer_name: Optional[str] = None

class ComplaintTransfer(BaseModel):
    target_bureau: str
    actor_name: str = "Authorized AICTE Official"
    actor_role: str = "Bureau Officer"
    actor_bureau: Optional[str] = None
    remarks: str

class ComplaintEscalate(BaseModel):
    target_level: str = "Apex Grievance Redressal Committee"
    actor_name: str = "Authorized AICTE Official"
    actor_role: str = "Bureau Officer"
    actor_bureau: Optional[str] = None
    remarks: str

class ComplaintAssign(BaseModel):
    officer_name: str
    bureau: str
    assigned_by: str = "Bureau Head"
    remarks: Optional[str] = "Officer assigned to oversee resolution"

class ComplaintResponse(BaseModel):
    id: int
    case_id: str
    institution_id: int
    institution_name: Optional[str] = None
    institution_aicte_id: Optional[str] = None
    institution_region: Optional[str] = None
    institution_state: Optional[str] = None
    institution_district: Optional[str] = None
    institution_type: Optional[str] = None
    institution_address: Optional[str] = None
    institution_pincode: Optional[str] = None
    source_bureau: str
    complainant_id: Optional[str] = "user_demo"
    complainant_type: str
    complainant_affiliation: Optional[str] = "Student"
    complainant_id_number: Optional[str] = None
    complainant_name: Optional[str] = "Complainant"
    complainant_email: Optional[str] = None
    complainant_phone: Optional[str] = None
    is_anonymous: bool = False
    category: str
    subject: str
    description: str
    priority: str
    suggested_priority: Optional[str] = "Medium"
    suggested_priority_reason: Optional[str] = None
    routing_reason: Optional[str] = None
    status: str
    verification_status: Optional[str] = "Submitted"
    assigned_officer: str
    received_date: date
    due_date: date
    last_action_date: Optional[datetime] = None
    next_action_due: Optional[date] = None
    evidence_files: Optional[List[Dict[str, Any]]] = []
    primary_case_id: Optional[str] = None
    info_request_notes: Optional[str] = None
    complainant_response: Optional[str] = None
    resolution_summary: Optional[str] = None
    complainant_feedback: Optional[str] = None
    disposed_date: Optional[date] = None
    is_overdue: bool = False
    days_overdue: int = 0
    days_remaining: int = 0
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ComplaintDetailResponse(ComplaintResponse):
    actions: List[CaseActionResponse] = []
    assignments: List[CaseAssignmentResponse] = []
    related_overlaps: List[Dict[str, Any]] = []


# --- Overlap Alert Schemas ---
class OverlapAlertResponse(BaseModel):
    id: int
    complaint_id_1: int
    complaint_id_2: int
    case_1_id: str
    case_2_id: str
    case_1_subject: str
    case_2_subject: str
    case_1_bureau: str
    case_2_bureau: str
    case_1_status: str
    case_2_status: str
    case_1_category: str
    case_2_category: str
    case_1_description: str
    case_2_description: str
    institution_1_name: str
    institution_2_name: str
    institution_1_aicte_id: str
    institution_2_aicte_id: str
    pair_key: str
    overlap_type: str
    confidence_score: float
    confidence_label: str
    match_reasons: List[str]
    status: str
    review_decision: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OverlapReviewRequest(BaseModel):
    decision: str = Field(
        ...,
        pattern="^(CONFIRM_LINK|JOINT_INVESTIGATION|TRANSFER_BUREAU|SEPARATE_INVESTIGATION|CONFIRM_DUPLICATE|DISMISS_FALSE_POSITIVE)$"
    )
    reviewed_by: str = "Senior AICTE Officer"
    remarks: str
    target_bureau: Optional[str] = None
    primary_case_id: Optional[str] = None


# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    severity: str
    complaint_id: Optional[int] = None
    bureau: Optional[str] = None
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Stats Schemas ---
class DashboardStatsResponse(BaseModel):
    total_cases: int
    pending_cases: int
    under_process_cases: int
    disposed_cases: int
    transferred_cases: int
    escalated_cases: int
    overdue_cases: int
    potential_overlaps: int
    bureau_workload: List[Dict[str, Any]]
    status_distribution: List[Dict[str, Any]]
    priority_distribution: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
    recent_cases: List[ComplaintResponse]
    approaching_deadlines: List[ComplaintResponse]
