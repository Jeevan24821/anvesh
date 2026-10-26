import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { BureauBadge } from '../components/BureauBadge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import AcknowledgementModal from '../components/AcknowledgementModal';
import { formatDate, formatDateTime, formatRegistrationDateTime } from '../utils/formatters';
import { BUREAUS, STATUS_OPTIONS, OFFICERS_LIST, PRIORITY_OPTIONS, getAphClause } from '../utils/constants';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  ShieldAlert, 
  GitMerge, 
  CheckCircle, 
  Share2, 
  AlertTriangle,
  History,
  FileCheck,
  Send,
  UserCheck,
  Printer,
  Sparkles,
  HelpCircle,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Mail,
  Phone,
  Star,
  FileText,
  Eye,
  Download,
  UploadCloud,
  Paperclip,
  ExternalLink,
  MapPin,
  GraduationCap,
  Check,
  Image as ImageIcon
} from 'lucide-react';

export function CaseDetails({ caseId, onBack, onViewCase, onViewInstitution }) {
  const { currentRole, refreshNotifications } = useAuth();
  const isComplainant = currentRole?.role === 'Complainant';
  const isReviewer = currentRole?.role === 'Reviewer';
  const isAdmin = currentRole?.role === 'Administrator';

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evidence preview and interaction state
  const [previewEvidence, setPreviewEvidence] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [loadingFileName, setLoadingFileName] = useState(null);
  const [evidenceError, setEvidenceError] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'status', 'transfer', 'escalate', 'assign', 'resolve', 'verify', 'request_info', 'respond_info', 'reject', 'feedback'
  const [modalForm, setModalForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSlip, setShowSlip] = useState(false);

  // Tab navigation for officials
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier', 'action_taken', 'audit'

  // Action Taken form state (Fix 2)
  const [actionForm, setActionForm] = useState({
    action_type: 'Action Taken Report Awaited',
    action_details: '',
    new_status: '',
    is_completed: false,
    next_follow_up_date: '',
    officer_name: ''
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Complainant Feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getComplaintById(caseId);
      setComplaint(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) fetchCase();
  }, [caseId, currentRole]);

  const handleViewProof = async (file) => {
    setEvidenceError(null);
    const targetFilename = file.stored_name || file.name;
    setLoadingFileName(targetFilename);
    setEvidenceLoading(true);
    try {
      const { blob, contentType } = await api.getEvidenceBlob(targetFilename, false);
      const url = window.URL.createObjectURL(blob);
      setPreviewEvidence({
        url,
        name: file.name || targetFilename,
        type: contentType,
        size: file.size || ''
      });
    } catch (err) {
      setEvidenceError(err.message || 'Failed to open proof document');
    } finally {
      setEvidenceLoading(false);
      setLoadingFileName(null);
    }
  };

  const handleDownloadProof = async (file) => {
    setEvidenceError(null);
    const targetFilename = file.stored_name || file.name;
    try {
      await api.downloadEvidence(targetFilename, file.name);
    } catch (err) {
      setEvidenceError(err.message || 'Failed to download proof document');
    }
  };

  const handleEvidenceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setEvidenceError(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setEvidenceError('Upload PDF only. Only official .pdf documents are accepted for grievance evidence.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setEvidenceError('File exceeds maximum allowable size (10 MB).');
      return;
    }

    setUploadingEvidence(true);
    try {
      await api.uploadEvidence(file, complaint.id);
      await fetchCase();
      if (refreshNotifications) refreshNotifications();
    } catch (err) {
      setEvidenceError(err.message || 'Failed to upload supporting evidence');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setSubmitting(true);
      await api.submitFeedback(complaint.id, {
        rating: feedbackRating,
        feedback_text: feedbackText
      });
      alert('Thank you! Your redressal satisfaction feedback has been recorded.');
      await fetchCase();
    } catch (err) {
      alert(err.message || 'Failed to submit redressal feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const actorName = currentRole?.name || 'Reviewing Officer';
      const actorRole = currentRole?.role || 'Reviewer';
      const actorBureau = currentRole?.bureau || complaint.source_bureau || 'PGRC';

      if (activeModal === 'verify') {
        await api.verifyComplaint(complaint.id, {
          verified_by: actorName,
          remarks: modalForm.remarks || 'Scrutiny completed and case accepted for active inquiry.',
          confirmed_priority: modalForm.override_priority ? modalForm.confirmed_priority : undefined,
          priority_override_reason: modalForm.override_priority ? modalForm.priority_override_reason : undefined
        });
      } else if (activeModal === 'request_info') {
        if (!modalForm.request_notes) {
          alert('Please specify the exact information or documents requested.');
          return;
        }
        await api.requestMoreInfo(complaint.id, {
          request_notes: modalForm.request_notes,
          requested_by: actorName
        });
      } else if (activeModal === 'respond_info') {
        if (!modalForm.response_notes) {
          alert('Please enter your response notes.');
          return;
        }
        await api.respondToInfoRequest(complaint.id, {
          response_notes: modalForm.response_notes
        });
        alert('Your response has been submitted successfully to the reviewing officer.');
      } else if (activeModal === 'reject') {
        if (!modalForm.rejection_reason) {
          alert('A stated official rationale is mandatory to reject a grievance.');
          return;
        }
        await api.rejectComplaint(complaint.id, {
          rejection_reason: modalForm.rejection_reason,
          rejected_by: actorName
        });
      } else if (activeModal === 'feedback') {
        await api.submitFeedback(complaint.id, {
          rating: feedbackRating,
          feedback_text: feedbackText
        });
        alert('Thank you. Your feedback has been recorded.');
      } else if (activeModal === 'status') {
        await api.updateComplaintStatus(complaint.id, {
          status: modalForm.status,
          actor_name: actorName,
          actor_role: actorRole,
          actor_bureau: actorBureau,
          remarks: modalForm.remarks
        });
      } else if (activeModal === 'transfer') {
        await api.transferComplaint(complaint.id, {
          target_bureau: modalForm.target_bureau,
          actor_name: actorName,
          actor_role: actorRole,
          actor_bureau: actorBureau,
          remarks: modalForm.remarks
        });
      } else if (activeModal === 'escalate') {
        await api.escalateComplaint(complaint.id, {
          target_level: modalForm.target_level || 'Apex Grievance Redressal Committee',
          actor_name: actorName,
          actor_role: actorRole,
          actor_bureau: actorBureau,
          remarks: modalForm.remarks
        });
      } else if (activeModal === 'assign') {
        await api.assignComplaint(complaint.id, {
          officer_name: modalForm.officer_name,
          bureau: modalForm.bureau || complaint.source_bureau,
          assigned_by: actorName,
          remarks: modalForm.remarks
        });
      } else if (activeModal === 'resolve') {
        await api.updateComplaintStatus(complaint.id, {
          status: 'Disposed',
          actor_name: actorName,
          actor_role: actorRole,
          actor_bureau: actorBureau,
          remarks: modalForm.remarks,
          resolution_summary: modalForm.resolution_summary || modalForm.remarks
        });
      }

      setActiveModal(null);
      setModalForm({});
      fetchCase();
      if (refreshNotifications) refreshNotifications();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionTakenSubmit = async (e) => {
    e.preventDefault();
    if (!actionForm.action_details.trim()) {
      alert('Please specify the detailed directives or action notes.');
      return;
    }
    try {
      setActionSubmitting(true);
      await api.recordActionTaken(complaint.id, {
        action_type: actionForm.action_type,
        action_details: actionForm.action_details.trim(),
        new_status: actionForm.is_completed ? 'Disposed' : (actionForm.new_status || undefined),
        is_completed: actionForm.is_completed,
        next_follow_up_date: actionForm.next_follow_up_date || undefined,
        officer_name: actionForm.officer_name || undefined
      });
      setActionForm({
        action_type: 'Action Taken Report Awaited',
        action_details: '',
        new_status: '',
        is_completed: false,
        next_follow_up_date: '',
        officer_name: ''
      });
      await fetchCase();
      if (refreshNotifications) refreshNotifications();
      alert('Action taken has been recorded and logged in the complaint audit trail.');
    } catch (err) {
      alert(err.message || 'Failed to record action taken');
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading complete case file & timeline..." />;
  if (error || !complaint) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
        <p className="font-bold text-sm">{error || 'Complaint record inaccessible or restricted'}</p>
        <p className="text-xs text-rose-500 mt-1">
          {isComplainant
            ? 'As a complainant, you are strictly restricted from inspecting grievances filed by other individuals.'
            : 'Check case ID or permissions.'}
        </p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm">
          Return to Grievances
        </button>
      </div>
    );
  }

  const isClosed = ['Disposed', 'Closed'].includes(complaint?.status);
  const isResolved = complaint?.status === 'Resolved';
  const isReopened = complaint?.status === 'Reopened';
  const isCompleted = isClosed || isResolved;
  const isReviewerAccepted = complaint?.verification_status === 'Verified' || ['Under Review', 'Under Process', 'Hearing Scheduled', 'Action Taken Report Awaited', 'Escalated to Committee', 'Joint Investigation', 'Disposed', 'Resolved', 'Closed', 'Completed'].includes(complaint?.status);

  // 6 Lifecycle stages as per Master Mandate:
  // 1. Submitted — Recorded
  // 2. Institutional Review — Initial Assessment
  // 3. AICTE Escalation — Regulatory Review
  // 4. Investigation — Inquiry and Directives
  // 5. Resolution Decision — Official Redressal
  // 6. Closed / Reopened — Final Outcome
  const isStage2Done = isCompleted || isReviewerAccepted;
  const isStage3Done = isCompleted || ['Escalated to Committee', 'Joint Investigation', 'Hearing Scheduled', 'Action Taken Report Awaited'].includes(complaint?.status) || (complaint?.actions || []).some(a => (a.action_type || '').toLowerCase().includes('escalat') || (a.action_type || '').toLowerCase().includes('action taken') || (a.action_type || '').toLowerCase().includes('hearing') || (a.action_type || '').toLowerCase().includes('notice'));
  const isStage4Done = isCompleted || ['Hearing Scheduled', 'Action Taken Report Awaited', 'Joint Investigation'].includes(complaint?.status) || (complaint?.actions || []).some(a => (a.action_type || '').toLowerCase().includes('hearing') || (a.action_type || '').toLowerCase().includes('investig') || (a.action_type || '').toLowerCase().includes('inquiry'));
  const isStage5Done = isCompleted;
  const isStage6Done = isClosed;

  const pathwayStages = [
    {
      num: 1,
      title: 'Submitted',
      subtitle: 'Recorded in National Portal',
      status: 'completed'
    },
    {
      num: 2,
      title: 'Institutional Review',
      subtitle: 'Initial Assessment & Scrutiny',
      status: isStage2Done ? 'completed' : 'current'
    },
    {
      num: 3,
      title: 'AICTE Escalation',
      subtitle: 'Bureau Allocation & Review',
      status: isStage3Done ? 'completed' : (isStage2Done ? 'current' : 'upcoming')
    },
    {
      num: 4,
      title: 'Investigation',
      subtitle: 'Inquiry & Directives',
      status: isStage4Done ? 'completed' : (isStage3Done ? 'current' : 'upcoming')
    },
    {
      num: 5,
      title: 'Resolution Decision',
      subtitle: 'Official Redressal Statement',
      status: isStage5Done ? 'completed' : (isStage4Done ? 'current' : 'upcoming')
    },
    {
      num: 6,
      title: isReopened ? 'Reopened' : (isClosed ? 'Closed' : 'Final Outcome'),
      subtitle: isReopened ? 'Case Reopened for Inquiry' : (isClosed ? 'Official Case Closure' : (isResolved ? 'Pending Final Disposition' : 'Awaiting Redressal')),
      status: isStage6Done ? 'completed' : (isReopened ? 'reopened' : (isStage5Done ? 'current' : 'upcoming'))
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ========================================================================= */}
      {/* COMPLAINANT TRACKING VIEW (Fix 3 - Matching request dashboard.jpeg)       */}
      {/* ========================================================================= */}
      {isComplainant ? (
        <div className="space-y-6">
          {/* Header Row: Back button, badge, Case ID, Registered timestamp, Status pill, Print button */}
          <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#8B8988] hover:text-[#F7F7F8] transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to My Grievances</span>
                  </button>
                  <span className="text-[#3A3854]">•</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#A020FF]" />
                    Student Grievance Tracking Dossier
                  </span>
                </div>

                <h1 className="text-2xl font-black text-[#F7F7F8] tracking-tight font-mono">
                  {complaint.case_id}
                </h1>
                <p className="text-xs text-[#8B8988] mt-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#8B8988]" />
                  {formatRegistrationDateTime(complaint.created_at, complaint.received_date)}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                {isCompleted ? (
                  <div className="px-4 py-2 rounded-xl bg-[#45B558]/15 text-[#45B558] border border-[#45B558]/35 font-extrabold text-xs flex items-center gap-2 shadow-2xs">
                    <CheckCircle className="w-4 h-4 text-[#45B558]" />
                    <span>Status: Completed</span>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/35 font-extrabold text-xs flex items-center gap-2 shadow-2xs">
                    <Clock className="w-4 h-4 text-[#A020FF]" />
                    <span>Status: {complaint.status || 'Under Process'}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowSlip(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#F7F7F8] bg-[#13131E] hover:bg-[#181826] border border-[#232234] hover:border-[#3A3854] rounded-xl shadow-2xs transition"
                >
                  <Printer className="w-4 h-4 text-[#8B8988]" />
                  <span>Print Acknowledgement Slip</span>
                </button>
              </div>
            </div>
          </div>

          {/* COMPLAINANT ACTION BANNER (If officer requested information) */}
          {complaint.verification_status === 'Needs More Information' && (
            <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B]/35 rounded-2xl p-5 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 flex-shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-sm text-[#F7F7F8]">
                    Action Required: Reviewing Officer Has Requested Additional Information
                  </h3>
                  <p className="text-xs text-[#D8B4FE] bg-[#13131E] p-3 rounded-xl border border-[#232234] italic">
                    "{complaint.info_request_notes || 'Please provide copy of fee payment slip or supporting bank statement.'}"
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setModalForm({ response_notes: '' });
                    setActiveModal('respond_info');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Clarification Response</span>
                </button>
              </div>
            </div>
          )}

          {/* Lifecycle Resolution Pathway Card */}
          <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1E2E]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A020FF]" />
                <h3 className="text-sm font-extrabold text-[#F7F7F8] uppercase tracking-wider">
                  Lifecycle Resolution Pathway
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#8B8988]">
                Statutory Target: {formatDate(complaint.due_date)}
              </span>
            </div>

            {/* Horizontal Pathway Steps */}
            <div className="relative pt-2 pb-1">
              <div className="hidden lg:block absolute top-7 left-8 right-8 h-1 bg-[#1F1E2E] -z-0">
                <div 
                  className="h-full bg-gradient-to-r from-[#9312FF] to-[#45B558] transition-all duration-500 rounded-full"
                  style={{
                    width: isClosed ? '100%' : isResolved ? '83%' : isStage4Done ? '66%' : isStage3Done ? '50%' : isStage2Done ? '33%' : '16%'
                  }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative z-10">
                {pathwayStages.map((st) => {
                  const isDone = st.status === 'completed';
                  const isCur = st.status === 'current';
                  const isReop = st.status === 'reopened';

                  return (
                    <div key={st.num} className="flex flex-col items-center text-center gap-2 p-2 rounded-xl bg-[#13131E] lg:bg-transparent border border-[#232234] lg:border-none">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm flex-shrink-0 ${
                        isDone 
                          ? 'bg-[#45B558] text-white ring-4 ring-[#45B558]/20' 
                          : isReop
                          ? 'bg-[#F59E0B] text-white ring-4 ring-[#F59E0B]/20'
                          : isCur 
                          ? 'bg-[#9312FF] text-white ring-4 ring-[#9312FF]/30 animate-pulse' 
                          : 'bg-[#13131E] text-[#8B8988] border border-[#232234]'
                      }`}>
                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : st.num}
                      </div>
                      <div className="w-full">
                        <div className={`text-xs font-bold leading-tight ${
                          isDone ? 'text-[#45B558]' : isReop ? 'text-[#F59E0B]' : isCur ? 'text-[#D8B4FE]' : 'text-[#8B8988]'
                        }`}>
                          {st.title}
                        </div>
                        <div className="text-[10px] text-[#8B8988] mt-0.5 leading-snug">
                          {st.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Grievance Statement (Left) & Institution Lodged Against (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Grievance Statement */}
            <div className="lg:col-span-8 bg-[#0D0D14] border border-[#232234] rounded-2xl p-6 shadow-md space-y-5">
              <div className="space-y-3 pb-4 border-b border-[#1F1E2E]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#13131E] text-[#F7F7F8] border border-[#232234] font-semibold">
                    {complaint.category}
                  </span>
                  <PriorityBadge priority={complaint.priority} />
                  {/* Verified APH Clause Tagging */}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                    getAphClause(complaint.category) !== 'No relevant clause identified.'
                      ? 'bg-[#9312FF]/15 text-[#D8B4FE] border-[#9312FF]/30'
                      : 'bg-[#13131E] text-[#8B8988] border-[#232234]'
                  }`}>
                    <span className="text-[10px] text-[#A020FF] font-normal">APH:</span>
                    {getAphClause(complaint.category)}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-[#F7F7F8] leading-snug">
                  {complaint.subject}
                </h2>

                <div className="p-2.5 rounded-xl bg-[#13131E] border border-[#232234] text-xs text-[#8B8988] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#45B558] flex-shrink-0" />
                  <span>
                    <strong className="text-[#F7F7F8]">Identity Protected:</strong> Filed as {complaint.is_anonymous ? 'Protected Confidential Identity' : complaint.complainant_name} ({complaint.complainant_affiliation || 'Student'})
                  </span>
                </div>
              </div>

              {/* Narrative */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#F7F7F8] uppercase tracking-wider">
                  Grievance Description & Facts
                </h4>
                <div className="p-4 rounded-xl bg-[#13131E] border border-[#232234] text-xs text-[#F7F7F8] leading-relaxed whitespace-pre-wrap break-words break-all max-w-full overflow-hidden">
                  {complaint.description}
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#8B8988] uppercase tracking-wider">
                    Official Supporting Evidence & Proof Documents ({complaint.evidence_files?.length || 0})
                  </h4>
                  <label className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_15px_rgba(147,18,255,0.4)] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload PDF Proof</span>
                    <input
                      type="file"
                      onChange={handleEvidenceUpload}
                      disabled={uploadingEvidence}
                      accept=".pdf"
                      className="hidden"
                    />
                  </label>
                </div>

                {evidenceError && (
                  <div className="p-3 rounded-xl bg-[#F03B2A]/15 border border-[#F03B2A]/30 text-[#F03B2A] text-xs flex items-center justify-between">
                    <span>{evidenceError}</span>
                    <button onClick={() => setEvidenceError(null)} className="font-bold underline ml-2">Dismiss</button>
                  </div>
                )}

                {complaint.evidence_files && complaint.evidence_files.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {complaint.evidence_files.map((file, idx) => {
                      const targetFilename = file.stored_name || file.name || `Evidence_${idx + 1}.pdf`;
                      const isImg = file.type?.includes('image') || /\.(png|jpe?g|gif|webp)$/i.test(targetFilename);
                      const isPdf = file.type?.includes('pdf') || /\.pdf$/i.test(targetFilename);
                      const isThisLoading = evidenceLoading && loadingFileName === targetFilename;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-[#13131E] border border-[#232234] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-[#9312FF]/50 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${isImg ? 'bg-[#9312FF]/20 text-[#D8B4FE]' : isPdf ? 'bg-[#F03B2A]/20 text-[#F03B2A]' : 'bg-[#9312FF]/15 text-[#D8B4FE]'}`}>
                              {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#F7F7F8] truncate" title={file.name || targetFilename}>
                                {file.name || targetFilename}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[#8B8988] mt-0.5">
                                {file.size && <span>{file.size}</span>}
                                <span className="text-[#45B558] font-semibold bg-[#45B558]/15 px-1.5 py-0.2 rounded border border-[#45B558]/30">
                                  Verified Evidence
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleViewProof(file)}
                              disabled={isThisLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#9312FF]/15 hover:bg-[#9312FF]/25 text-[#D8B4FE] border border-[#9312FF]/30 rounded-lg text-xs font-bold transition shadow-2xs disabled:opacity-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isThisLoading ? 'Opening...' : 'View Proof'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadProof(file)}
                              className="p-1.5 bg-[#0D0D14] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234] rounded-lg transition shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#8B8988] bg-[#13131E] border border-dashed border-[#2A293E] rounded-xl">
                    No evidence documents attached to this grievance.
                  </div>
                )}
              </div>

              {/* Official Case Closure Summary & Order (when Completed / Disposed) */}
              {isCompleted && complaint.resolution_summary && (
                <div className="p-4 rounded-xl bg-[#45B558]/10 border border-[#45B558]/30 text-xs space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-[#45B558] font-bold">
                    <CheckCircle className="w-4 h-4 text-[#45B558]" />
                    Official Case Closure Summary & Order
                  </div>
                  <p className="text-[#F7F7F8] leading-relaxed font-medium">
                    {complaint.resolution_summary}
                  </p>
                  <div className="text-[10px] text-[#45B558] pt-2 border-t border-[#45B558]/30 flex items-center justify-between">
                    <span>Disposed on {formatDate(complaint.disposed_date || complaint.received_date)}</span>
                    <span className="font-bold">Final Statutory Redressal Order Issued</span>
                  </div>
                </div>
              )}

              {/* Complainant Feedback Rating (when Completed) */}
              {isCompleted && (
                <div className="p-4 rounded-xl bg-[#13131E] border border-[#232234] text-xs space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#D8B4FE] text-sm flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-[#A020FF]" />
                      Complainant Redressal Feedback
                    </span>
                    {complaint.complainant_feedback && (
                      <span className="text-[10px] text-[#D8B4FE] font-semibold bg-[#9312FF]/20 border border-[#9312FF]/35 px-2 py-0.5 rounded">
                        Feedback Submitted
                      </span>
                    )}
                  </div>

                  {complaint.complainant_feedback ? (
                    <div className="space-y-1.5 bg-[#0D0D14] p-3 rounded-lg border border-[#232234]">
                      {complaint.complainant_rating && (
                        <div className="flex items-center gap-1 text-[#F59E0B] mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={complaint.complainant_rating >= s ? 'text-[#F59E0B] text-sm' : 'text-[#3A3854] text-sm'}>
                              ★
                            </span>
                          ))}
                          <span className="text-xs font-bold text-[#F7F7F8] ml-1.5">
                            {complaint.complainant_rating} / 5 Rating
                          </span>
                        </div>
                      )}
                      <p className="text-[#8B8988] italic">
                        "{complaint.complainant_feedback}"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[#8B8988]">
                        Please rate your satisfaction with the grievance redressal process and final resolution:
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedbackRating(star)}
                            className={`p-1.5 rounded ${feedbackRating >= star ? 'text-[#F59E0B]' : 'text-[#3A3854]'}`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="text-xs text-[#8B8988] font-semibold ml-2">({feedbackRating} / 5 Stars)</span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Share feedback on the speed, transparency, and fairness of resolution..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full p-2 bg-[#0D0D14] border border-[#232234] rounded-lg text-xs text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:border-[#9312FF]"
                      />
                      <button
                        type="button"
                        onClick={handleFeedbackSubmit}
                        disabled={submitting}
                        className="px-3.5 py-2 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_15px_rgba(147,18,255,0.4)] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{submitting ? 'Submitting...' : 'Submit Redressal Rating'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Institution Lodged Against */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#1F1E2E]">
                  <Building2 className="w-4 h-4 text-[#A020FF]" />
                  <h3 className="text-sm font-extrabold text-[#F7F7F8] uppercase tracking-wider">
                    Institution Lodged Against
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-extrabold text-base text-[#F7F7F8] leading-tight">
                      {complaint.institution_name}
                    </h4>
                    <span className="text-xs font-bold text-[#F03B2A] block mt-0.5">
                      Code: {complaint.institution_aicte_id}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#13131E] border border-[#232234] space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-[#F7F7F8]">
                      <MapPin className="w-4 h-4 text-[#8B8988] flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        {[complaint.institution_address, complaint.institution_district, complaint.institution_state].filter(Boolean).join(', ') || complaint.institution_state || 'AICTE Approved Campus'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[#8B8988] pt-1 border-t border-[#232234]">
                      <GraduationCap className="w-4 h-4 text-[#8B8988] flex-shrink-0" />
                      <span className="font-medium text-[#F7F7F8]">{complaint.institution_type || 'Engineering & Technology'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#9312FF]/10 border border-[#9312FF]/25 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#D8B4FE] block">
                        Assigned Bureau Nodal Desk
                      </span>
                      <span className="font-extrabold text-[#F7F7F8] block mt-0.5">
                        {complaint.source_bureau}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#9312FF]/20">
                      <span className="text-[10px] uppercase font-bold text-[#D8B4FE] block">
                        Statutory SLA Target
                      </span>
                      <span className="font-extrabold text-[#F7F7F8] block mt-0.5">
                        Due Date: {formatDate(complaint.due_date)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#13131E] border border-[#232234] space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#8B8988] block">
                      Official Bureau Contact Details
                    </span>
                    <div className="space-y-1.5 text-[#F7F7F8]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#A020FF] flex-shrink-0" />
                        <span className="text-[11px] truncate">grievance-support@aicte-india.org</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#45B558] flex-shrink-0" />
                        <span className="text-[11px]">011-29581000 / 1800-180-5522</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* OFFICIALS VIEW (Reviewer & Admin) with Tabs & Action Taken Workspace      */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Back button and breadcrumb */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-semibold text-[#8B8988] hover:text-[#F7F7F8] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Complaint Registry</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSlip(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F7F7F8] bg-[#13131E] hover:bg-[#181826] border border-[#232234] hover:border-[#3A3854] rounded-xl shadow-2xs transition"
              >
                <Printer className="w-3.5 h-3.5 text-[#8B8988]" />
                <span>Print Acknowledgement Slip</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#232234] pb-2">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'dossier'
                  ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_12px_rgba(147,18,255,0.4)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Grievance Dossier & Evidence</span>
            </button>

            <button
              onClick={() => setActiveTab('action_taken')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'action_taken'
                  ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_12px_rgba(147,18,255,0.4)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234]'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Action Taken Workspace</span>
              {isReviewerAccepted && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#45B558]/20 text-[#45B558] border border-[#45B558]/35 font-bold">
                  Active
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_12px_rgba(147,18,255,0.4)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Chronological Audit Trail ({complaint.actions?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: Dossier & Evidence */}
          {activeTab === 'dossier' && (
            <div className="space-y-6">
              {/* REVIEWER SCRUTINY PANEL */}
              <div className="bg-[#0D0D14] border border-[#232234] text-[#F7F7F8] rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F1E2E]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#9312FF]/15 border border-[#9312FF]/30">
                      <FileCheck className="w-5 h-5 text-[#A020FF]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#F7F7F8] tracking-tight">Reviewer Intake & Scrutiny Workspace</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30 uppercase tracking-wider">
                          Scrutiny Workspace
                        </span>
                      </div>
                      <p className="text-xs text-[#8B8988]">
                        Document Scrutiny Mode — Verify evidence authenticity and confirm statutory priority.
                      </p>
                    </div>
                  </div>

                  {complaint.status !== 'Disposed' && complaint.status !== 'Rejected' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setModalForm({
                            override_priority: false,
                            confirmed_priority: complaint.priority,
                            remarks: 'Scrutiny completed and case accepted for active inquiry.'
                          });
                          setActiveModal('verify');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#45B558] to-[#16A34A] text-white font-semibold text-xs shadow-[0_0_12px_rgba(69,181,88,0.35)] transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify & Accept</span>
                      </button>

                      <button
                        onClick={() => {
                          setModalForm({ request_notes: '' });
                          setActiveModal('request_info');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/35 font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Request Info</span>
                      </button>

                      <button
                        onClick={() => {
                          setModalForm({ rejection_reason: '' });
                          setActiveModal('reject');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F03B2A]/20 hover:bg-[#F03B2A]/30 text-[#F03B2A] border border-[#F03B2A]/35 font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Grievance</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-[#13131E] rounded-xl p-3 border border-[#232234]">
                    <span className="text-[10px] uppercase font-bold text-[#8B8988] block">Suggested Priority</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-[#F7F7F8] text-sm">
                        {complaint.suggested_priority || complaint.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8B8988] mt-1 line-clamp-2">
                      {complaint.suggested_priority_reason || 'AI heuristic SLA model'}
                    </p>
                  </div>

                  <div className="bg-[#13131E] rounded-xl p-3 border border-[#232234]">
                    <span className="text-[10px] uppercase font-bold text-[#8B8988] block">Jurisdiction & Routing</span>
                    <div className="mt-1 font-semibold text-[#F7F7F8]">
                      {complaint.source_bureau}
                    </div>
                    <p className="text-[11px] text-[#8B8988] mt-1 line-clamp-2">
                      {complaint.routing_reason || 'Categorical statutory jurisdiction mapping'}
                    </p>
                  </div>

                  <div className="bg-[#13131E] rounded-xl p-3 border border-[#232234]">
                    <span className="text-[10px] uppercase font-bold text-[#8B8988] block">Current Verification Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-[#F7F7F8] text-sm">
                        {complaint.verification_status || 'Submitted'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8B8988] mt-1">
                      {complaint.info_request_notes ? `Active Query: ${complaint.info_request_notes}` : 'Documents pending initial inquiry'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Case Header Card */}
              <div className="bg-[#0D0D14] border border-[#232234] p-6 rounded-2xl shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#1F1E2E]">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-base font-extrabold text-[#D8B4FE] tracking-wide">
                        {complaint.case_id}
                      </span>
                      <BureauBadge bureau={complaint.source_bureau} />
                      <PriorityBadge priority={complaint.priority} />
                      <StatusBadge status={complaint.status} />
                      {complaint.is_overdue && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F03B2A]/15 text-[#F03B2A] border border-[#F03B2A]/35 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {complaint.days_overdue} Days Overdue SLA
                        </span>
                      )}
                    </div>
                    <h1 className="text-lg font-bold text-[#F7F7F8] mt-2 leading-snug">
                      {complaint.subject}
                    </h1>
                  </div>

                  {/* Action Toolbar */}
                  {!currentRole?.readOnly && complaint.status !== 'Disposed' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setModalForm({ status: complaint.status });
                          setActiveModal('status');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#13131E] hover:bg-[#181826] text-[#F7F7F8] border border-[#232234] hover:border-[#3A3854] text-xs font-semibold shadow-2xs transition"
                      >
                        Change Status
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setModalForm({ target_bureau: 'Regulation Bureau (RB)' });
                            setActiveModal('transfer');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#13131E] hover:bg-[#181826] text-[#818CF8] border border-[#232234] hover:border-[#818CF8]/50 text-xs font-semibold shadow-2xs transition"
                        >
                          Transfer Bureau
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setModalForm({ target_level: 'Apex Grievance Redressal Committee' });
                            setActiveModal('escalate');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#F03B2A]/15 hover:bg-[#F03B2A]/25 text-[#F03B2A] border border-[#F03B2A]/35 text-xs font-semibold shadow-2xs transition"
                        >
                          Escalate
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setModalForm({ officer_name: 'Dr. Sunita Sharma (Chief Redressal Officer)' });
                            setActiveModal('assign');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#13131E] hover:bg-[#181826] text-[#38BDF8] border border-[#232234] hover:border-[#38BDF8]/50 text-xs font-semibold shadow-2xs transition"
                        >
                          Assign Officer
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setModalForm({ resolution_summary: '' });
                          setActiveModal('resolve');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#45B558]/15 hover:bg-[#45B558]/25 text-[#45B558] border border-[#45B558]/35 text-xs font-bold shadow-2xs transition"
                      >
                        Dispose / Resolve
                      </button>
                    </div>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
                  <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
                    <span className="text-[10px] uppercase font-semibold text-[#8B8988] block">Target Institution</span>
                    {isComplainant ? (
                      <span className="font-bold text-[#F7F7F8] text-left mt-0.5 truncate block w-full">
                        {complaint.institution_name}
                      </span>
                    ) : (
                      <button
                        onClick={() => onViewInstitution(complaint.institution_id)}
                        className="font-bold text-[#F7F7F8] hover:text-[#D8B4FE] text-left mt-0.5 truncate block w-full transition"
                      >
                        {complaint.institution_name}
                      </button>
                    )}
                    <span className="text-[10px] text-[#8B8988] font-mono">
                      AICTE ID: {complaint.institution_aicte_id}
                    </span>
                  </div>

                  <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
                    <span className="text-[10px] uppercase font-semibold text-[#8B8988] block">Grievance Category</span>
                    <span className="font-bold text-[#F7F7F8] mt-0.5 block">{complaint.category}</span>
                    <span className="text-[10px] text-[#D8B4FE] font-semibold block mt-0.5">
                      APH: {getAphClause(complaint.category)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
                    <span className="text-[10px] uppercase font-semibold text-[#8B8988] block">Assigned Official / Desk</span>
                    <span className="font-bold text-[#F7F7F8] mt-0.5 block truncate">
                      {complaint.assigned_officer || 'Central Intake Desk'}
                    </span>
                    <span className="text-[10px] text-[#8B8988]">{complaint.source_bureau}</span>
                  </div>

                  <div className="p-3 bg-[#13131E] rounded-xl border border-[#232234]">
                    <span className="text-[10px] uppercase font-semibold text-[#8B8988] block">Statutory Resolution SLA</span>
                    <span className={`font-bold mt-0.5 block ${complaint.is_overdue ? 'text-[#F03B2A]' : 'text-[#F7F7F8]'}`}>
                      {formatDate(complaint.due_date)}
                    </span>
                    <span className="text-[10px] text-[#8B8988]">
                      Intake Date: {formatDate(complaint.received_date)}
                    </span>
                  </div>
                </div>

                {/* Narrative */}
                <div className="p-4 rounded-xl bg-[#13131E] border border-[#232234] space-y-2">
                  <h4 className="text-xs font-bold text-[#F7F7F8] uppercase tracking-wider">
                    Grievance Description & Facts
                  </h4>
                  <p className="text-xs text-[#F7F7F8] leading-relaxed whitespace-pre-wrap break-words break-all max-w-full overflow-hidden">
                    {complaint.description}
                  </p>

                  <div className="pt-2 border-t border-[#1F1E2E] flex flex-wrap items-center gap-4 text-[11px] text-[#8B8988]">
                    <span>
                      Complainant: <strong className="text-[#F7F7F8]">{complaint.is_anonymous ? 'Protected Confidential Identity' : complaint.complainant_name}</strong>
                    </span>
                    {complaint.complainant_id_number && (
                      <span>Institutional ID: <strong className="text-[#F7F7F8]">{complaint.complainant_id_number}</strong></span>
                    )}
                    <span>Received: <strong className="text-[#F7F7F8]">{formatDate(complaint.received_date)}</strong></span>
                  </div>
                </div>

                {/* Evidence Documents (Hidden for Bureau Reviewers) */}
                {!isReviewer && (
                <div className="p-4 rounded-xl bg-[#13131E] border border-[#232234] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#F7F7F8] uppercase tracking-wider block">
                        Official Supporting Evidence & Proof Documents ({complaint.evidence_files?.length || 0})
                      </span>
                      <p className="text-[11px] text-[#8B8988] mt-0.5">
                        Authentic documents submitted for administrative verification and audit.
                      </p>
                    </div>

                    {!currentRole?.readOnly && (isAdmin || (isReviewer && (currentRole?.bureau === 'All' || currentRole?.bureau === complaint.source_bureau))) && (
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_15px_rgba(147,18,255,0.4)] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition flex-shrink-0">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploadingEvidence ? 'Uploading...' : 'Upload PDF Document'}</span>
                        <input
                          type="file"
                          onChange={handleEvidenceUpload}
                          disabled={uploadingEvidence}
                          accept=".pdf"
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {evidenceError && (
                    <div className="p-3 rounded-xl bg-[#F03B2A]/15 border border-[#F03B2A]/30 text-[#F03B2A] text-xs flex items-center justify-between">
                      <span>{evidenceError}</span>
                      <button onClick={() => setEvidenceError(null)} className="font-bold underline ml-2">Dismiss</button>
                    </div>
                  )}

                  {complaint.evidence_files && complaint.evidence_files.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {complaint.evidence_files.map((file, idx) => {
                        const targetFilename = file.stored_name || file.name || `Evidence_${idx + 1}.pdf`;
                        const isImg = file.type?.includes('image') || /\.(png|jpe?g|gif|webp)$/i.test(targetFilename);
                        const isPdf = file.type?.includes('pdf') || /\.pdf$/i.test(targetFilename);
                        const isThisLoading = evidenceLoading && loadingFileName === targetFilename;

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-[#0D0D14] border border-[#232234] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-[#9312FF]/50 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${isImg ? 'bg-[#9312FF]/20 text-[#D8B4FE]' : isPdf ? 'bg-[#F03B2A]/20 text-[#F03B2A]' : 'bg-[#9312FF]/15 text-[#D8B4FE]'}`}>
                                {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#F7F7F8] truncate" title={file.name || targetFilename}>
                                  {file.name || targetFilename}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#8B8988] mt-0.5">
                                  {file.size && <span>{file.size}</span>}
                                  <span className="text-[#45B558] font-semibold bg-[#45B558]/15 px-1.5 py-0.2 rounded border border-[#45B558]/30">
                                    Verified Evidence
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewProof(file)}
                                disabled={isThisLoading}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#9312FF]/15 hover:bg-[#9312FF]/25 text-[#D8B4FE] border border-[#9312FF]/30 rounded-lg text-xs font-bold transition shadow-2xs disabled:opacity-50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isThisLoading ? 'Opening...' : 'View Proof'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadProof(file)}
                                className="p-1.5 bg-[#13131E] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234] rounded-lg transition shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-[#8B8988] bg-[#0D0D14] border border-dashed border-[#2A293E] rounded-xl">
                      No evidence documents attached to this complaint yet.
                    </div>
                  )}
                </div>
                )}

                {/* Resolution Summary if Disposed */}
                {complaint.status === 'Disposed' && complaint.resolution_summary && (
                  <div className="p-4 rounded-xl bg-[#45B558]/10 border border-[#45B558]/30 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-[#45B558] font-bold">
                      <CheckCircle className="w-4 h-4 text-[#45B558]" />
                      Official Case Closure Summary & Order
                    </div>
                    <p className="text-[#F7F7F8] leading-relaxed">{complaint.resolution_summary}</p>
                    <div className="text-[10px] text-[#45B558] pt-1 border-t border-[#45B558]/30 flex items-center justify-between">
                      <span>Disposed on {formatDate(complaint.disposed_date)}</span>
                      <span>Final Statutory Redressal Order Issued</span>
                    </div>
                  </div>
                )}

                {/* Complainant Satisfaction Tracking for Officials */}
                {(complaint.complainant_feedback || complaint.status === 'Disposed') && (
                  <div className="p-4 rounded-xl bg-[#13131E] border border-[#232234] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#D8B4FE] text-sm flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-[#A020FF]" />
                        Complainant Redressal Satisfaction
                      </span>
                      {complaint.complainant_feedback && (
                        <span className="text-[10px] text-[#D8B4FE] font-semibold bg-[#9312FF]/20 border border-[#9312FF]/35 px-2 py-0.5 rounded">
                          Feedback Recorded
                        </span>
                      )}
                    </div>

                    {complaint.complainant_feedback ? (
                      <div className="space-y-1.5 bg-[#0D0D14] p-3 rounded-lg border border-[#232234]">
                        {complaint.complainant_rating && (
                          <div className="flex items-center gap-1 text-[#F59E0B] mb-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={complaint.complainant_rating >= s ? 'text-[#F59E0B] text-sm' : 'text-[#3A3854] text-sm'}>
                                ★
                              </span>
                            ))}
                            <span className="text-xs font-bold text-[#F7F7F8] ml-1.5">
                              {complaint.complainant_rating} / 5 Rating
                            </span>
                          </div>
                        )}
                        <p className="text-[#8B8988] italic">
                          "{complaint.complainant_feedback}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-[#8B8988] italic p-2 bg-[#0D0D14] rounded-lg border border-[#232234]">
                        Awaiting complainant satisfaction feedback submission upon case closure.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: Action Taken Workspace (Fix 2 - Available after reviewer acceptance) */}
          {/* ========================================================================= */}
          {activeTab === 'action_taken' && (
            <div className="space-y-6">
              {!isReviewerAccepted ? (
                <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B]/35 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-sm text-[#F7F7F8]">
                        Reviewer Scrutiny & Acceptance Pending
                      </h3>
                      <p className="text-xs text-[#8B8988] leading-relaxed">
                        Under AICTE Standard Operating Procedures, a grievance must first be scrutinised and verified/accepted by the Reviewing Officer before departmental directives, college notices, or Action Taken Reports can be logged.
                      </p>
                    </div>
                  </div>

                  {complaint.status !== 'Rejected' && (
                    <div className="pt-2 border-t border-[#F59E0B]/20 flex justify-end">
                      <button
                        onClick={() => {
                          setModalForm({
                            override_priority: false,
                            confirmed_priority: complaint.priority,
                            remarks: 'Scrutiny completed and case accepted for active inquiry.'
                          });
                          setActiveModal('verify');
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-[#45B558] to-[#16A34A] text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(69,181,88,0.35)] transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Proceed to Verify & Accept Grievance</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Summary Banner */}
                  <div className="bg-gradient-to-r from-[#9312FF]/25 to-[#7A1CF8]/15 border border-[#9312FF]/30 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#45B558]/20 text-[#45B558] border border-[#45B558]/30 font-bold uppercase">
                          Reviewer Acceptance Confirmed
                        </span>
                        <span className="text-xs text-[#D8B4FE]">
                          Verification Status: <strong className="text-white">{complaint.verification_status || 'Verified'}</strong>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#F7F7F8]">
                        Department Action & Redressal Directive Workspace
                      </h3>
                      <p className="text-xs text-[#8B8988]">
                        Assigned Bureau: <strong className="text-[#F7F7F8]">{complaint.source_bureau}</strong> • Target SLA: {formatDate(complaint.due_date)}
                      </p>
                    </div>

                    {isCompleted ? (
                      <div className="px-4 py-2 rounded-xl bg-[#45B558]/20 border border-[#45B558]/35 text-[#45B558] font-bold text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#45B558]" />
                        <span>Complaint Completed & Concluded</span>
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-xl bg-[#9312FF]/20 border border-[#9312FF]/35 text-[#D8B4FE] font-semibold text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#A020FF]" />
                        <span>Inquiry / Action in Progress</span>
                      </div>
                    )}
                  </div>

                  {/* Record Action Taken Form */}
                  {!isCompleted && (!currentRole?.readOnly && (isAdmin || (isReviewer && (currentRole?.bureau === 'All' || currentRole?.bureau === complaint.source_bureau)))) && (
                    <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-6 shadow-md space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#1F1E2E]">
                        <FileCheck className="w-4 h-4 text-[#A020FF]" />
                        <h3 className="text-sm font-extrabold text-[#F7F7F8] uppercase tracking-wider">
                          Record Subsequent Department Action / Directive
                        </h3>
                      </div>

                      <form onSubmit={handleActionTakenSubmit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#F7F7F8] font-semibold mb-1">
                              Action Category / Milestone *
                            </label>
                            <select
                              value={actionForm.action_type}
                              onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })}
                              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF]"
                              required
                            >
                              <option value="Action Taken Report Awaited" className="bg-[#13131E] text-[#F7F7F8]">Action Taken Report (ATR) Awaited from College</option>
                              <option value="Show Cause Notice Issued" className="bg-[#13131E] text-[#F7F7F8]">Show Cause Notice Issued to College Administration</option>
                              <option value="Joint Inquiry Committee Constituted" className="bg-[#13131E] text-[#F7F7F8]">Joint Inquiry Committee Constituted</option>
                              <option value="Hearing Scheduled" className="bg-[#13131E] text-[#F7F7F8]">Formal Hearing Scheduled with Both Parties</option>
                              <option value="Interim Directive Issued" className="bg-[#13131E] text-[#F7F7F8]">Interim Directive Issued to Institute</option>
                              <option value="Explanation Received" className="bg-[#13131E] text-[#F7F7F8]">Explanation Received from College Management</option>
                              <option value="Site Inspection Conducted" className="bg-[#13131E] text-[#F7F7F8]">Fact-Finding Site Inspection Conducted</option>
                              <option value="Compliance Verified" className="bg-[#13131E] text-[#F7F7F8]">Institutional Compliance Verified</option>
                              <option value="Final Redressal Order Issued" className="bg-[#13131E] text-[#F7F7F8]">Final Statutory Redressal Order & Closure</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[#F7F7F8] font-semibold mb-1">
                              Next Follow-up / Compliance Due Date
                            </label>
                            <input
                              type="date"
                              value={actionForm.next_follow_up_date}
                              onChange={(e) => setActionForm({ ...actionForm, next_follow_up_date: e.target.value })}
                              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#F7F7F8] font-semibold mb-1">
                            Officer Overseeing Action
                          </label>
                          <input
                            type="text"
                            placeholder="Officer Name / Bureau Official (e.g. Dr. Sunita Sharma, Regional Officer)"
                            value={actionForm.officer_name}
                            onChange={(e) => setActionForm({ ...actionForm, officer_name: e.target.value })}
                            className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF] shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[#F7F7F8] font-semibold mb-1">
                            Detailed Findings / Directives Issued *
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Detail the official inquiry findings, notice reference numbers, directives to college administration, hearing venue/date, or interim relief granted..."
                            value={actionForm.action_details}
                            onChange={(e) => setActionForm({ ...actionForm, action_details: e.target.value })}
                            className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF] shadow-xs"
                            required
                          />
                        </div>

                        <div className="p-3 bg-[#45B558]/10 border border-[#45B558]/30 rounded-xl space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-[#F7F7F8] text-xs">
                            <input
                              type="checkbox"
                              checked={actionForm.is_completed}
                              onChange={(e) => setActionForm({ ...actionForm, is_completed: e.target.checked })}
                              className="w-4 h-4 text-[#45B558] rounded bg-[#13131E] border-[#232234]"
                            />
                            <span>Mark Complaint Action as Completed & Concluded (Final Resolution)</span>
                          </label>
                          <p className="text-[11px] text-[#8B8988] pl-6">
                            Checking this will transition the case status to 'Disposed' / 'Completed', finalize the official case closure statement, and notify all parties. Reviewer acceptance alone does not complete a case.
                          </p>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={actionSubmitting}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_20px_rgba(147,18,255,0.5)] text-white font-bold rounded-xl shadow-[0_0_15px_rgba(147,18,255,0.35)] transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>{actionSubmitting ? 'Recording Action...' : 'Save & Log Action Taken'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Recorded Action History */}
                  <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-6 shadow-md space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#1F1E2E]">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#A020FF]" />
                        <h3 className="text-sm font-extrabold text-[#F7F7F8] uppercase tracking-wider">
                          Recorded Actions & Directive Timeline
                        </h3>
                      </div>
                      <span className="text-xs text-[#8B8988] font-medium">
                        {complaint.actions?.length || 0} Events Logged
                      </span>
                    </div>

                    <div className="space-y-3">
                      {complaint.actions?.map((act) => (
                        <div key={act.id} className="p-4 rounded-xl bg-[#13131E] border border-[#232234] text-xs space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#F7F7F8] text-sm">
                                {act.action_type}
                              </span>
                              {act.to_value && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#9312FF]/20 text-[#D8B4FE] border border-[#9312FF]/30">
                                  Status: {act.to_value}
                                </span>
                              )}
                            </div>
                            <span className="text-[#8B8988] font-mono text-[11px]">
                              {formatDateTime(act.created_at)}
                            </span>
                          </div>

                          <p className="text-[#F7F7F8] leading-relaxed font-medium">
                            {act.remarks}
                          </p>

                          <div className="pt-2 border-t border-[#1F1E2E] flex items-center justify-between text-[11px] text-[#8B8988]">
                            <span>Official: <strong className="text-[#F7F7F8]">{act.actor_name}</strong> ({act.actor_role})</span>
                            <span>Jurisdiction: <strong className="text-[#F7F7F8]">{act.actor_bureau || complaint.source_bureau}</strong></span>
                          </div>
                        </div>
                      ))}

                      {(!complaint.actions || complaint.actions.length === 0) && (
                        <div className="py-6 text-center text-[#8B8988]">
                          No actions recorded yet. Use the form above to record subsequent department actions.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: Chronological Audit Trail & Linked Overlaps                        */}
          {/* ========================================================================= */}
          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#0D0D14] border border-[#232234] rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#A020FF]" />
                    <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide">
                      Chronological Case Action History ({complaint.actions?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#8B8988]">
                    Immutable audit-compliant event trail
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#232234]">
                  {complaint.actions?.map((act) => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#9312FF] ring-4 ring-[#0D0D14] shadow-[0_0_8px_#9312FF]" />
                      <div className="bg-[#13131E] border border-[#232234] p-3.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F7F7F8]">{act.action_type}</span>
                          <span className="text-[10px] text-[#8B8988] font-mono">{formatDateTime(act.created_at)}</span>
                        </div>
                        {act.from_value && act.to_value && (
                          <div className="text-[11px] text-[#D8B4FE] font-medium">
                            Transition: <span className="line-through text-[#8B8988]">{act.from_value}</span> &rarr; {act.to_value}
                          </div>
                        )}
                        <p className="text-[#F7F7F8] text-xs leading-relaxed mt-1">
                          {act.remarks}
                        </p>
                        <div className="text-[10px] text-[#8B8988] pt-1 border-t border-[#1F1E2E] flex items-center justify-between">
                          <span>Actor: <strong className="text-[#F7F7F8]">{act.actor_name}</strong> ({act.actor_role})</span>
                          {act.actor_bureau && <span>Bureau: {act.actor_bureau}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-[#A020FF]" />
                      <h3 className="text-sm font-bold text-[#F7F7F8]">Linked Cross-Bureau Overlaps</h3>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {complaint.related_overlaps?.map((ov) => (
                      <div
                        key={ov.alert_id}
                        className="p-3 rounded-xl bg-[#13131E] border border-[#232234] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#D8B4FE]">{ov.overlap_type}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#9312FF]/20 text-[#D8B4FE] border border-[#9312FF]/30 font-semibold">
                            {ov.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8B8988] truncate" title={ov.matched_subject}>
                          Matched: <strong className="text-[#F7F7F8]">{ov.matched_case_id}</strong> ({ov.matched_bureau})
                        </div>
                      </div>
                    ))}

                    {(!complaint.related_overlaps || complaint.related_overlaps.length === 0) && (
                      <p className="text-xs text-[#8B8988] py-4 text-center">
                        No active cross-bureau overlap linked to this case.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4 text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-[#F7F7F8]">Assigned Inquiry Team</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {complaint.assignments?.map((asm) => (
                      <div key={asm.id} className="p-2.5 rounded-xl bg-[#13131E] border border-[#232234] text-xs">
                        <div className="font-bold text-[#F7F7F8]">{asm.officer_name}</div>
                        <div className="text-[10px] text-[#8B8988]">Bureau: {asm.bureau}</div>
                        <div className="text-[10px] text-[#8B8988] mt-1">
                          Assigned by {asm.assigned_by} on {formatDate(asm.assigned_at)}
                        </div>
                      </div>
                    ))}

                    {(!complaint.assignments || complaint.assignments.length === 0) && (
                      <p className="text-xs text-[#8B8988] py-3 text-center">
                        Currently handled at centralized nodal intake desk.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Action Modal */}
      <Modal
        isOpen={Boolean(activeModal)}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'verify'
            ? 'Verify & Accept Grievance for Active Scrutiny'
            : activeModal === 'request_info'
            ? 'Request Additional Information from Complainant'
            : activeModal === 'respond_info'
            ? 'Submit Clarification to Reviewing Officer'
            : activeModal === 'reject'
            ? 'Reject Grievance with Stated Official Rationale'
            : activeModal === 'status'
            ? 'Update Complaint Status'
            : activeModal === 'transfer'
            ? 'Transfer Bureau Jurisdiction'
            : activeModal === 'escalate'
            ? 'Escalate to Higher Authority'
            : activeModal === 'assign'
            ? 'Assign Officer to Case'
            : 'Record Official Resolution & Dispose Case'
        }
      >
        <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
          {/* VERIFY MODAL */}
          {activeModal === 'verify' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#45B558]/10 border border-[#45B558]/30 rounded-xl text-[#F7F7F8]">
                <p className="font-bold text-[#45B558]">Accept Grievance into Bureau Inquiry Workflow</p>
                <p className="text-[11px] text-[#8B8988] mt-0.5">
                  This action validates document genuineness and transitions the case from 'Submitted' to 'Under Review'.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#F7F7F8]">
                  <input
                    type="checkbox"
                    checked={modalForm.override_priority}
                    onChange={(e) => setModalForm({ ...modalForm, override_priority: e.target.checked })}
                    className="w-4 h-4 text-[#9312FF] rounded bg-[#13131E] border-[#232234]"
                  />
                  <span>Override Suggested Priority Level</span>
                </label>
              </div>

              {modalForm.override_priority && (
                <div className="p-3 bg-[#0D0D14] border border-[#232234] rounded-xl space-y-3">
                  <div>
                    <label className="block text-[#F7F7F8] font-semibold mb-1">New Confirmed Priority *</label>
                    <select
                      value={modalForm.confirmed_priority || complaint.priority}
                      onChange={(e) => setModalForm({ ...modalForm, confirmed_priority: e.target.value })}
                      className="w-full p-2 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF]"
                    >
                      {PRIORITY_OPTIONS.filter(p => p !== 'All').map(p => (
                        <option key={p} value={p} className="bg-[#13131E] text-[#F7F7F8]">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#F7F7F8] font-semibold mb-1">Mandatory Override Justification *</label>
                    <input
                      type="text"
                      placeholder="e.g. Evidence shows immediate threat requiring expedited 15-day resolution"
                      value={modalForm.priority_override_reason || ''}
                      onChange={(e) => setModalForm({ ...modalForm, priority_override_reason: e.target.value })}
                      className="w-full p-2 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#F7F7F8] font-semibold mb-1">Scrutiny Findings & Remarks</label>
                <textarea
                  rows={3}
                  value={modalForm.remarks || ''}
                  onChange={(e) => setModalForm({ ...modalForm, remarks: e.target.value })}
                  placeholder="Record summary of verified documents, transaction IDs, or initial findings..."
                  className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]"
                  required
                />
              </div>
            </div>
          )}

          {/* REQUEST INFO MODAL */}
          {activeModal === 'request_info' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-[#F7F7F8]">
                <p className="font-bold text-[#F59E0B]">Request Clarification from Complainant</p>
                <p className="text-[11px] text-[#8B8988] mt-0.5">
                  Transitions grievance status to 'Needs More Information'. The complainant will receive an in-portal prompt to respond.
                </p>
              </div>
              <div>
                <label className="block text-[#F7F7F8] font-semibold mb-1">
                  Specific Documents / Evidence Required *
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Please furnish copy of the original fee receipt, fee breakdown circular issued by college, or attendance sheet..."
                  value={modalForm.request_notes || ''}
                  onChange={(e) => setModalForm({ ...modalForm, request_notes: e.target.value })}
                  className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]"
                  required
                />
              </div>
            </div>
          )}

          {/* RESPOND INFO MODAL */}
          {activeModal === 'respond_info' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-[#F7F7F8]">
                <p className="font-bold text-[#F59E0B]">Submit Clarification to Reviewing Officer</p>
                <p className="text-[11px] text-[#8B8988] mt-0.5">
                  Provide the requested information or clarification to resume case scrutiny.
                </p>
              </div>
              <div>
                <label className="block text-[#F7F7F8] font-semibold mb-1">
                  Clarification / Additional Details *
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide transaction details, receipts, or explanations requested..."
                  value={modalForm.response_notes || ''}
                  onChange={(e) => setModalForm({ ...modalForm, response_notes: e.target.value })}
                  className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]"
                  required
                />
              </div>
            </div>
          )}

          {/* REJECT MODAL */}
          {activeModal === 'reject' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F03B2A]/15 border border-[#F03B2A]/30 rounded-xl text-[#F7F7F8]">
                <p className="font-bold text-[#F03B2A]">Formal Rejection of Grievance</p>
                <p className="text-[11px] text-[#8B8988] mt-0.5">
                  A legally sound justification is required under AICTE Grievance Redressal Regulations 2019.
                </p>
              </div>
              <div>
                <label className="block text-[#F7F7F8] font-semibold mb-1">
                  Official Rejection Rationale *
                </label>
                <textarea
                  rows={4}
                  placeholder="State why the matter is rejected (e.g. Outside AICTE statutory purview, sub-judice in high court, anonymous without actionable proof, unsubstantiated claims)..."
                  value={modalForm.rejection_reason || ''}
                  onChange={(e) => setModalForm({ ...modalForm, rejection_reason: e.target.value })}
                  className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]"
                  required
                />
              </div>
            </div>
          )}

          {/* STATUS CHANGE */}
          {activeModal === 'status' && (
            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">New Status *</label>
              <select
                value={modalForm.status || complaint.status}
                onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF] shadow-xs"
              >
                {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                  <option key={s} value={s} className="bg-[#13131E] text-[#F7F7F8]">{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* TRANSFER MODAL */}
          {activeModal === 'transfer' && (
            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">Target AICTE Bureau *</label>
              <select
                value={modalForm.target_bureau || 'Regulation Bureau (RB)'}
                onChange={(e) => setModalForm({ ...modalForm, target_bureau: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF] shadow-xs"
              >
                {BUREAUS.filter(b => b !== 'All' && b !== complaint.source_bureau).map(b => (
                  <option key={b} value={b} className="bg-[#13131E] text-[#F7F7F8]">{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* ESCALATE MODAL */}
          {activeModal === 'escalate' && (
            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">Escalation Committee / Body *</label>
              <select
                value={modalForm.target_level || 'Apex Grievance Redressal Committee'}
                onChange={(e) => setModalForm({ ...modalForm, target_level: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF] shadow-xs"
              >
                <option value="Apex Grievance Redressal Committee" className="bg-[#13131E] text-[#F7F7F8]">Apex Grievance Redressal Committee</option>
                <option value="Central Standing Appellate Committee" className="bg-[#13131E] text-[#F7F7F8]">Central Standing Appellate Committee</option>
                <option value="Chief Vigilance Officer (CVO)" className="bg-[#13131E] text-[#F7F7F8]">Chief Vigilance Officer (CVO)</option>
                <option value="Chairman Executive Committee" className="bg-[#13131E] text-[#F7F7F8]">Chairman Executive Committee</option>
              </select>
            </div>
          )}

          {/* ASSIGN OFFICER MODAL */}
          {activeModal === 'assign' && (
            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">Select Officer *</label>
              <select
                value={modalForm.officer_name || OFFICERS_LIST[0]}
                onChange={(e) => setModalForm({ ...modalForm, officer_name: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF] shadow-xs"
              >
                {OFFICERS_LIST.map(o => (
                  <option key={o} value={o} className="bg-[#13131E] text-[#F7F7F8]">{o}</option>
                ))}
              </select>
            </div>
          )}

          {/* RESOLVE MODAL */}
          {activeModal === 'resolve' && (
            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">Resolution Summary Order *</label>
              <textarea
                rows={3}
                placeholder="State final findings, directive issued to institute, refund ordered, or penalties imposed..."
                value={modalForm.resolution_summary || ''}
                onChange={(e) => setModalForm({ ...modalForm, resolution_summary: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF] shadow-xs"
                required
              />
            </div>
          )}

          {/* Mandatory Remarks */}
          {['status', 'transfer', 'escalate', 'assign', 'resolve'].includes(activeModal) && (
            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">
                Official Action Remarks * (Audit Trail Mandatory)
              </label>
              <textarea
                rows={3}
                placeholder="State administrative justification for this change..."
                value={modalForm.remarks || ''}
                onChange={(e) => setModalForm({ ...modalForm, remarks: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF] shadow-xs"
                required
              />
            </div>
          )}

          <div className="pt-3 border-t border-[#232234] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl bg-[#13131E] hover:bg-[#181826] border border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_20px_rgba(147,18,255,0.5)] text-white font-bold shadow-[0_0_15px_rgba(147,18,255,0.35)] transition disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Commit Action'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Evidence Document Preview Modal */}
      {previewEvidence && (
        <Modal
          isOpen={Boolean(previewEvidence)}
          onClose={() => {
            if (previewEvidence?.url) {
              window.URL.revokeObjectURL(previewEvidence.url);
            }
            setPreviewEvidence(null);
          }}
          title={`Document Evidence Preview: ${previewEvidence.name}`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#F7F7F8] bg-[#0D0D14] p-3 rounded-xl border border-[#232234]">
              <span className="font-semibold truncate max-w-sm">
                Document: <strong className="text-white">{previewEvidence.name}</strong> {previewEvidence.size ? `(${previewEvidence.size})` : ''}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(previewEvidence.url, '_blank')}
                  className="flex items-center gap-1 px-3 py-1 bg-[#13131E] hover:bg-[#181826] border border-[#232234] rounded-lg font-bold text-[#D8B4FE] shadow-2xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#A020FF]" />
                  <span>Open in Full Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewEvidence.url;
                    link.download = previewEvidence.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white rounded-lg font-bold shadow-2xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="border border-[#232234] rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[420px]">
              {previewEvidence.type?.startsWith('image/') ? (
                <img
                  src={previewEvidence.url}
                  alt={previewEvidence.name}
                  className="max-h-[70vh] object-contain mx-auto p-2"
                />
              ) : (
                <iframe
                  src={previewEvidence.url}
                  title={previewEvidence.name}
                  className="w-full h-[70vh] bg-[#0D0D14] border-0"
                />
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Official Acknowledgement Slip Modal */}
      <AcknowledgementModal
        isOpen={showSlip}
        onClose={() => setShowSlip(false)}
        complaint={complaint}
      />
    </div>
  );
}
