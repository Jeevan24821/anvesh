import json
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Boolean, Float, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    aicte_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    normalized_name = Column(String(255), index=True, nullable=False)
    institution_type = Column(String(64), default="Engineering & Technology")
    region = Column(String(64), index=True, nullable=False)
    state = Column(String(64), index=True, nullable=False)
    district = Column(String(64), nullable=False)
    address = Column(Text, nullable=False)
    pincode = Column(String(16), nullable=False)
    contact_email = Column(String(128), nullable=False)
    contact_phone = Column(String(32), nullable=False)
    principal_name = Column(String(128), nullable=False)
    approval_status = Column(String(32), default="Approved")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    complaints = relationship("Complaint", back_populates="institution", cascade="all, delete-orphan")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(64), unique=True, index=True, nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    source_bureau = Column(String(64), index=True, nullable=False)
    complainant_id = Column(String(64), index=True, default="user_demo")
    complainant_type = Column(String(64), default="Student")
    complainant_affiliation = Column(String(64), default="Student")
    complainant_id_number = Column(String(64), nullable=True)  # USN / Roll No / App No
    complainant_name = Column(String(128), nullable=False)
    complainant_email = Column(String(128), default="confidential@sih-sentrix.nic.in")
    complainant_phone = Column(String(32), default="+91-XXXXXXXXXX")
    is_anonymous = Column(Boolean, default=False)
    category = Column(String(128), index=True, nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(32), default="Medium", index=True)
    suggested_priority = Column(String(32), default="Medium")
    suggested_priority_reason = Column(Text, nullable=True)
    routing_reason = Column(Text, nullable=True)
    status = Column(String(64), default="Submitted", index=True)
    verification_status = Column(String(64), default="Submitted", index=True)
    assigned_officer = Column(String(128), default="Unassigned", index=True)
    received_date = Column(Date, default=date.today, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    last_action_date = Column(DateTime(timezone=True), server_default=func.now())
    next_action_due = Column(Date, nullable=True)
    evidence_files = Column(Text, default="[]")  # JSON list: [{"name": ..., "size": ..., "type": ...}]
    primary_case_id = Column(String(64), nullable=True)  # Set if linked as duplicate
    info_request_notes = Column(Text, nullable=True)  # Query sent to complainant
    complainant_response = Column(Text, nullable=True)  # Reply from complainant
    resolution_summary = Column(Text, nullable=True)
    complainant_feedback = Column(Text, nullable=True)  # Post-resolution feedback
    disposed_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    institution = relationship("Institution", back_populates="complaints")
    actions = relationship(
        "CaseAction",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="desc(CaseAction.created_at)"
    )
    assignments = relationship("CaseAssignment", back_populates="complaint", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="complaint")

    @property
    def evidence_list(self):
        try:
            return json.loads(self.evidence_files) if self.evidence_files else []
        except Exception:
            return []


class CaseAction(Base):
    __tablename__ = "case_actions"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False)
    from_value = Column(String(128), nullable=True)
    to_value = Column(String(128), nullable=True)
    actor_name = Column(String(128), nullable=False)
    actor_role = Column(String(64), nullable=False)
    actor_bureau = Column(String(64), nullable=True)
    remarks = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # True = internal review notes; False = visible to complainant
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    complaint = relationship("Complaint", back_populates="actions")


class CaseAssignment(Base):
    __tablename__ = "case_assignments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    officer_name = Column(String(128), nullable=False)
    bureau = Column(String(64), nullable=False)
    assigned_by = Column(String(128), nullable=False)
    status = Column(String(32), default="Active")
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="assignments")


class OverlapAlert(Base):
    __tablename__ = "overlap_alerts"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id_1 = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id_2 = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    pair_key = Column(String(64), unique=True, index=True, nullable=False)
    overlap_type = Column(String(64), nullable=False)
    confidence_score = Column(Float, nullable=False)
    confidence_label = Column(String(32), nullable=False)
    match_reasons = Column(Text, nullable=False)  # JSON-encoded array of reasons
    status = Column(String(32), default="Pending Review", index=True)
    review_decision = Column(String(64), nullable=True)
    decision_type = Column(String(64), nullable=True)  # keep_separate, link_coordination, transfer_merge
    lead_bureau = Column(String(64), nullable=True)
    affected_bureaus = Column(String(255), nullable=True)
    assigned_officer = Column(String(128), nullable=True)
    justification = Column(Text, nullable=True)
    reviewed_by = Column(String(128), nullable=True)
    review_remarks = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case_1 = relationship("Complaint", foreign_keys=[complaint_id_1])
    case_2 = relationship("Complaint", foreign_keys=[complaint_id_2])

    @property
    def reasons_list(self):
        try:
            return json.loads(self.match_reasons)
        except Exception:
            return [self.match_reasons]


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(32), default="info")
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    bureau = Column(String(64), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    complainant_id = Column(String(64), nullable=True, index=True)
    recipient_role = Column(String(32), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    complaint = relationship("Complaint", back_populates="notifications")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False)  # Administrator, Reviewer, Complainant, Viewer
    bureau = Column(String(64), default="All")
    designation = Column(String(128), nullable=False)
    password_hash = Column(String(255), nullable=True)
    salt = Column(String(64), nullable=True)
    complainant_id = Column(String(64), nullable=True, index=True)
    phone = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
