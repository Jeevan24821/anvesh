import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { BureauBadge } from '../components/BureauBadge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import AcknowledgementModal from '../components/AcknowledgementModal';
import { formatDate, formatDateTime, formatRegistrationDateTime } from '../utils/formatters';
import { BUREAUS, STATUS_OPTIONS, OFFICERS_LIST, PRIORITY_OPTIONS, getAphClause } from '../utils/constants';
import { InstitutionLogo } from '../components/InstitutionLogo';
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
  const { t, language } = useLanguage();
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
          <div className="bg-white border border-[#DCE3EC] rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#687386] hover:text-[#172033] transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{language === 'hi' ? 'वापस मेरी शिकायतें' : 'Back to My Grievances'}</span>
                  </button>
                  <span className="text-[#DCE3EC]">•</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0645A8]" />
                    {language === 'hi' ? 'शिकायत ट्रैकिंग दस्तावेज़' : 'Student Grievance Tracking Dossier'}
                  </span>
                </div>

                <h1 className="text-2xl font-black text-[#172033] tracking-tight font-mono">
                  {complaint.case_id}
                </h1>
                <p className="text-xs text-[#687386] mt-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#687386]" />
                  {formatRegistrationDateTime(complaint.created_at, complaint.received_date)}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                {isCompleted ? (
                  <div className="px-4 py-2 rounded-xl bg-[#16A765]/15 text-[#16A765] border border-[#16A765]/35 font-extrabold text-xs flex items-center gap-2 shadow-2xs">
                    <CheckCircle className="w-4 h-4 text-[#16A765]" />
                    <span>{language === 'hi' ? 'स्थिति: पूर्ण' : 'Status: Completed'}</span>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] font-extrabold text-xs flex items-center gap-2 shadow-2xs">
                    <Clock className="w-4 h-4 text-[#0645A8]" />
                    <span>{language === 'hi' ? 'स्थिति:' : 'Status:'} {complaint.status || 'Under Process'}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowSlip(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#172033] bg-[#F8FAFC] hover:bg-[#EAF3FF] border border-[#DCE3EC] rounded-xl shadow-xs transition"
                >
                  <Printer className="w-4 h-4 text-[#687386]" />
                  <span>{t('action_print_slip', 'Print Acknowledgement Slip')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* COMPLAINANT ACTION BANNER (If officer requested information) */}
          {complaint.verification_status === 'Needs More Information' && (
            <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B]/35 rounded-2xl p-5 shadow-xs space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#F59E0B]/20 text-[#B45309] border border-[#F59E0B]/30 flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-sm text-[#172033]">
                    {language === 'hi' ? 'कार्रवाई आवश्यक: समीक्षा अधिकारी ने अतिरिक्त जानकारी का अनुरोध किया है' : 'Action Required: Reviewing Officer Has Requested Additional Information'}
                  </h3>
                  <p className="text-xs text-[#172033] bg-white p-3 rounded-xl border border-[#DCE3EC] italic">
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
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{language === 'hi' ? 'स्पष्टीकरण उत्तर जमा करें' : 'Submit Clarification Response'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Lifecycle Resolution Pathway Card */}
          <div className="bg-white border border-[#DCE3EC] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF0F6]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0645A8]" />
                <h3 className="text-sm font-extrabold text-[#172033] uppercase tracking-wider">
                  {language === 'hi' ? 'जीवनचक्र निवारण पथ' : 'Lifecycle Resolution Pathway'}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#687386]">
                {language === 'hi' ? 'सांविधिक लक्ष्य:' : 'Statutory Target:'} {formatDate(complaint.due_date)}
              </span>
            </div>

            {/* Horizontal Pathway Steps */}
            <div className="relative pt-2 pb-1">
              <div className="hidden lg:block absolute top-7 left-8 right-8 h-1 bg-[#EAF0F6] -z-0">
                <div 
                  className="h-full bg-gradient-to-r from-[#0645A8] to-[#16A765] transition-all duration-500 rounded-full"
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
                    <div key={st.num} className="flex flex-col items-center text-center gap-2 p-2 rounded-xl bg-[#F8FAFC] lg:bg-transparent border border-[#DCE3EC] lg:border-none">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm flex-shrink-0 ${
                        isDone 
                          ? 'bg-[#16A765] text-white ring-4 ring-[#16A765]/20' 
                          : isReop
                          ? 'bg-[#F59E0B] text-white ring-4 ring-[#F59E0B]/20'
                          : isCur 
                          ? 'bg-[#0645A8] text-white ring-4 ring-[#0645A8]/20 animate-pulse' 
                          : 'bg-[#F8FAFC] text-[#687386] border border-[#DCE3EC]'
                      }`}>
                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : st.num}
                      </div>
                      <div className="w-full">
                        <div className={`text-xs font-bold leading-tight ${
                          isDone ? 'text-[#16A765]' : isReop ? 'text-[#F59E0B]' : isCur ? 'text-[#0645A8]' : 'text-[#687386]'
                        }`}>
                          {st.title}
                        </div>
                        <div className="text-[10px] text-[#687386] mt-0.5 leading-snug">
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
            <div className="lg:col-span-8 bg-white border border-[#DCE3EC] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="space-y-3 pb-4 border-b border-[#EAF0F6]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F8FAFC] text-[#172033] border border-[#DCE3EC] font-semibold">
                    {complaint.category}
                  </span>
                  <PriorityBadge priority={complaint.priority} />
                  {/* Verified APH Clause Tagging */}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                    getAphClause(complaint.category) !== 'No relevant clause identified.'
                      ? 'bg-[#EAF3FF] text-[#0645A8] border-[#BBD5F8]'
                      : 'bg-[#F8FAFC] text-[#687386] border-[#DCE3EC]'
                  }`}>
                    <span className="text-[10px] text-[#0645A8] font-normal">APH:</span>
                    {getAphClause(complaint.category)}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-[#172033] leading-snug">
                  {complaint.subject}
                </h2>

                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs text-[#687386] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#16A765] flex-shrink-0" />
                  <span>
                    <strong className="text-[#172033]">{language === 'hi' ? 'पहचान सुरक्षित:' : 'Identity Protected:'}</strong> {language === 'hi' ? 'दर्जकर्ता' : 'Filed as'} {complaint.is_anonymous ? (language === 'hi' ? 'संरक्षित गोपनीय पहचान' : 'Protected Confidential Identity') : complaint.complainant_name} ({complaint.complainant_affiliation || 'Student'})
                  </span>
                </div>
              </div>

              {/* Narrative */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  {language === 'hi' ? 'शिकायत विवरण एवं तथ्य' : 'Grievance Description & Facts'}
                </h4>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs text-[#172033] leading-relaxed whitespace-pre-wrap break-words break-all max-w-full overflow-hidden">
                  {complaint.description}
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#687386] uppercase tracking-wider">
                    {language === 'hi' ? 'आधिकारिक साक्ष्य एवं दस्तावेज' : 'Official Supporting Evidence & Proof Documents'} ({complaint.evidence_files?.length || 0})
                  </h4>
                  <label className="flex items-center gap-1.5 px-3 py-1 bg-[#0645A8] hover:bg-[#1769D2] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'पीडीएफ साक्ष्य अपलोड करें' : 'Upload PDF Proof'}</span>
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
                  <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] text-xs flex items-center justify-between">
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
                          className="p-3 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-[#0645A8]/50 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${isImg ? 'bg-[#EAF3FF] text-[#0645A8]' : isPdf ? 'bg-red-50 text-[#DC3545]' : 'bg-[#EAF3FF] text-[#0645A8]'}`}>
                              {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#172033] truncate" title={file.name || targetFilename}>
                                {file.name || targetFilename}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[#687386] mt-0.5">
                                {file.size && <span>{file.size}</span>}
                                <span className="text-[#16A765] font-semibold bg-[#16A765]/15 px-1.5 py-0.2 rounded border border-[#16A765]/30">
                                  {language === 'hi' ? 'सत्यापित साक्ष्य' : 'Verified Evidence'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleViewProof(file)}
                              disabled={isThisLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#EAF3FF] hover:bg-[#D4E7FF] text-[#0645A8] border border-[#BBD5F8] rounded-lg text-xs font-bold transition shadow-2xs disabled:opacity-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isThisLoading ? (language === 'hi' ? 'खुल रहा है...' : 'Opening...') : (language === 'hi' ? 'सबूत देखें' : 'View Proof')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadProof(file)}
                              className="p-1.5 bg-white hover:bg-[#F8FAFC] text-[#687386] hover:text-[#172033] border border-[#DCE3EC] rounded-lg transition shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#687386] bg-[#F8FAFC] border border-dashed border-[#DCE3EC] rounded-xl">
                    {language === 'hi' ? 'इस शिकायत में कोई साक्ष्य दस्तावेज संलग्न नहीं है।' : 'No evidence documents attached to this grievance.'}
                  </div>
                )}
              </div>

              {/* Official Case Closure Summary & Order (when Completed / Disposed) */}
              {isCompleted && complaint.resolution_summary && (
                <div className="p-4 rounded-xl bg-[#16A765]/10 border border-[#16A765]/30 text-xs space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-[#16A765] font-bold">
                    <CheckCircle className="w-4 h-4 text-[#16A765]" />
                    {language === 'hi' ? 'आधिकारिक मामला समापन सारांश एवं आदेश' : 'Official Case Closure Summary & Order'}
                  </div>
                  <p className="text-[#172033] leading-relaxed font-medium">
                    {complaint.resolution_summary}
                  </p>
                  <div className="text-[10px] text-[#16A765] pt-2 border-t border-[#16A765]/30 flex items-center justify-between">
                    <span>{language === 'hi' ? 'निस्तारण तिथि:' : 'Disposed on'} {formatDate(complaint.disposed_date || complaint.received_date)}</span>
                    <span className="font-bold">{language === 'hi' ? 'अंतिम सांविधिक निवारण आदेश जारी' : 'Final Statutory Redressal Order Issued'}</span>
                  </div>
                </div>
              )}

              {/* Complainant Feedback Rating (when Completed) */}
              {isCompleted && (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0645A8] text-sm flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-[#0645A8]" />
                      {language === 'hi' ? 'शिकायतकर्ता निवारण प्रतिक्रिया' : 'Complainant Redressal Feedback'}
                    </span>
                    {complaint.complainant_feedback && (
                      <span className="text-[10px] text-[#0645A8] font-semibold bg-[#EAF3FF] border border-[#BBD5F8] px-2 py-0.5 rounded">
                        {language === 'hi' ? 'प्रतिक्रिया दर्ज' : 'Feedback Submitted'}
                      </span>
                    )}
                  </div>

                  {complaint.complainant_feedback ? (
                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-[#DCE3EC]">
                      {complaint.complainant_rating && (
                        <div className="flex items-center gap-1 text-[#F59E0B] mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={complaint.complainant_rating >= s ? 'text-[#F59E0B] text-sm' : 'text-[#DCE3EC] text-sm'}>
                              ★
                            </span>
                          ))}
                          <span className="text-xs font-bold text-[#172033] ml-1.5">
                            {complaint.complainant_rating} / 5 Rating
                          </span>
                        </div>
                      )}
                      <p className="text-[#687386] italic">
                        "{complaint.complainant_feedback}"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[#687386]">
                        {language === 'hi' ? 'कृपया शिकायत निवारण प्रक्रिया और अंतिम समाधान से अपनी संतुष्टि दर्ज करें:' : 'Please rate your satisfaction with the grievance redressal process and final resolution:'}
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedbackRating(star)}
                            className={`p-1.5 rounded ${feedbackRating >= star ? 'text-[#F59E0B]' : 'text-[#DCE3EC]'}`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="text-xs text-[#687386] font-semibold ml-2">({feedbackRating} / 5 Stars)</span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder={language === 'hi' ? 'निवारण की गति, पारदर्शिता और निष्पक्षता पर प्रतिक्रिया साझा करें...' : 'Share feedback on the speed, transparency, and fairness of resolution...'}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full p-2 bg-white border border-[#DCE3EC] rounded-lg text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8]"
                      />
                      <button
                        type="button"
                        onClick={handleFeedbackSubmit}
                        disabled={submitting}
                        className="px-3.5 py-2 bg-[#0645A8] hover:bg-[#1769D2] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{submitting ? (language === 'hi' ? 'जमा हो रहा है...' : 'Submitting...') : (language === 'hi' ? 'रेटिंग जमा करें' : 'Submit Redressal Rating')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Institution Lodged Against */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-[#DCE3EC] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0F6]">
                  <Building2 className="w-4 h-4 text-[#0645A8]" />
                  <h3 className="text-sm font-extrabold text-[#172033] uppercase tracking-wider">
                    {language === 'hi' ? 'संबंधित संस्थान' : 'Institution Lodged Against'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <InstitutionLogo name={complaint.institution_name} aicteId={complaint.institution_aicte_id} size="md" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-base text-[#172033] leading-tight">
                        {complaint.institution_name}
                      </h4>
                      <span className="text-xs font-bold text-[#0645A8] block mt-0.5">
                        Permanent AICTE ID: {complaint.institution_aicte_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-[#172033]">
                      <MapPin className="w-4 h-4 text-[#687386] flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        {[complaint.institution_address, complaint.institution_district, complaint.institution_state].filter(Boolean).join(', ') || complaint.institution_state || 'AICTE Approved Campus'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[#687386] pt-1 border-t border-[#DCE3EC]">
                      <GraduationCap className="w-4 h-4 text-[#687386] flex-shrink-0" />
                      <span className="font-medium text-[#172033]">{complaint.institution_type || 'Engineering & Technology'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#EAF3FF] border border-[#BBD5F8] space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#0645A8] block">
                        {language === 'hi' ? 'आवंटित ब्यूरो नोडल डेस्क' : 'Assigned Bureau Nodal Desk'}
                      </span>
                      <span className="font-extrabold text-[#172033] block mt-0.5">
                        {complaint.source_bureau}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#BBD5F8]">
                      <span className="text-[10px] uppercase font-bold text-[#0645A8] block">
                        {language === 'hi' ? 'सांविधिक एसएलए लक्ष्य' : 'Statutory SLA Target'}
                      </span>
                      <span className="font-extrabold text-[#172033] block mt-0.5">
                        Due Date: {formatDate(complaint.due_date)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#687386] block">
                      {language === 'hi' ? 'आधिकारिक ब्यूरो संपर्क विवरण' : 'Official Bureau Contact Details'}
                    </span>
                    <div className="space-y-1.5 text-[#172033]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#0645A8] flex-shrink-0" />
                        <span className="text-[11px] truncate">grievance-support@aicte-india.org</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#16A765] flex-shrink-0" />
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
              className="flex items-center gap-2 text-xs font-semibold text-[#687386] hover:text-[#172033] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'वापस शिकायत पंजिका' : 'Back to Complaint Registry'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSlip(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172033] bg-[#F8FAFC] hover:bg-[#EAF3FF] border border-[#DCE3EC] rounded-xl shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5 text-[#687386]" />
                <span>{t('action_print_slip', 'Print Acknowledgement Slip')}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#DCE3EC] pb-2">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'dossier'
                  ? 'bg-[#0645A8] text-white shadow-xs font-bold'
                  : 'bg-white text-[#687386] hover:text-[#0645A8] hover:bg-[#EAF3FF] border border-[#DCE3EC]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'hi' ? 'शिकायत दस्तावेज़ एवं साक्ष्य' : 'Grievance Dossier & Evidence'}</span>
            </button>

            <button
              onClick={() => setActiveTab('action_taken')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'action_taken'
                  ? 'bg-[#0645A8] text-white shadow-xs font-bold'
                  : 'bg-white text-[#687386] hover:text-[#0645A8] hover:bg-[#EAF3FF] border border-[#DCE3EC]'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>{language === 'hi' ? 'कार्रवाई कार्यक्षेत्र' : 'Action Taken Workspace'}</span>
              {isReviewerAccepted && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#16A765]/20 text-[#16A765] border border-[#16A765]/35 font-bold">
                  {language === 'hi' ? 'सक्रिय' : 'Active'}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-[#0645A8] text-white shadow-xs font-bold'
                  : 'bg-white text-[#687386] hover:text-[#0645A8] hover:bg-[#EAF3FF] border border-[#DCE3EC]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{language === 'hi' ? 'कालानुक्रमिक ऑडिट ट्रेल' : 'Chronological Audit Trail'} ({complaint.actions?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: Dossier & Evidence */}
          {activeTab === 'dossier' && (
            <div className="space-y-6">
              {/* REVIEWER SCRUTINY PANEL */}
              <div className="bg-white border border-[#DCE3EC] text-[#172033] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAF0F6]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#EAF3FF] border border-[#BBD5F8]">
                      <FileCheck className="w-5 h-5 text-[#0645A8]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                          {language === 'hi' ? 'समीक्षक संवीक्षा कार्यक्षेत्र' : 'Reviewer Intake & Scrutiny Workspace'}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] uppercase tracking-wider">
                          Scrutiny Workspace
                        </span>
                      </div>
                      <p className="text-xs text-[#687386]">
                        {language === 'hi' ? 'दस्तावेज़ संवीक्षा मोड — साक्ष्य प्रामाणिकता सत्यापित करें और सांविधिक प्राथमिकता की पुष्टि करें।' : 'Document Scrutiny Mode — Verify evidence authenticity and confirm statutory priority.'}
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
                        className="px-3.5 py-1.5 rounded-xl bg-[#16A765] hover:bg-[#138d55] text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('action_verify', 'Verify & Accept')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setModalForm({ request_notes: '' });
                          setActiveModal('request_info');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#B45309] border border-[#F59E0B]/35 font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>{t('action_request_info', 'Request Info')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setModalForm({ rejection_reason: '' });
                          setActiveModal('reject');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#DC3545]/10 hover:bg-[#DC3545]/20 text-[#DC3545] border border-[#DC3545]/30 font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{t('action_reject', 'Reject Grievance')}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#DCE3EC]">
                    <span className="text-[10px] uppercase font-bold text-[#687386] block">{language === 'hi' ? 'सुझाई गई प्राथमिकता' : 'Suggested Priority'}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-[#172033] text-sm">
                        {complaint.suggested_priority || complaint.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#687386] mt-1 line-clamp-2">
                      {complaint.suggested_priority_reason || 'AI heuristic SLA model'}
                    </p>
                  </div>

                  <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#DCE3EC]">
                    <span className="text-[10px] uppercase font-bold text-[#687386] block">{language === 'hi' ? 'अधिकार क्षेत्र एवं मार्ग' : 'Jurisdiction & Routing'}</span>
                    <div className="mt-1 font-semibold text-[#172033]">
                      {complaint.source_bureau}
                    </div>
                    <p className="text-[11px] text-[#687386] mt-1 line-clamp-2">
                      {complaint.routing_reason || 'Categorical statutory jurisdiction mapping'}
                    </p>
                  </div>

                  <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#DCE3EC]">
                    <span className="text-[10px] uppercase font-bold text-[#687386] block">{language === 'hi' ? 'वर्तमान सत्यापन स्थिति' : 'Current Verification Status'}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-[#172033] text-sm">
                        {complaint.verification_status || 'Submitted'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#687386] mt-1">
                      {complaint.info_request_notes ? `Active Query: ${complaint.info_request_notes}` : 'Documents pending initial inquiry'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Case Header Card */}
              <div className="bg-white border border-[#DCE3EC] p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#EAF0F6]">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-base font-extrabold text-[#0645A8] tracking-wide">
                        {complaint.case_id}
                      </span>
                      <BureauBadge bureau={complaint.source_bureau} />
                      <PriorityBadge priority={complaint.priority} />
                      <StatusBadge status={complaint.status} />
                      {complaint.is_overdue && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DC3545]/10 text-[#DC3545] border border-[#DC3545]/30 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {complaint.days_overdue} {language === 'hi' ? 'दिन विलंबित एसएलए' : 'Days Overdue SLA'}
                        </span>
                      )}
                    </div>
                    <h1 className="text-lg font-bold text-[#172033] mt-2 leading-snug">
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
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#DCE3EC] text-xs font-semibold shadow-xs transition"
                      >
                        {language === 'hi' ? 'स्थिति बदलें' : 'Change Status'}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setModalForm({ target_bureau: 'Regulation Bureau (RB)' });
                            setActiveModal('transfer');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF3FF] text-[#0645A8] border border-[#DCE3EC] text-xs font-semibold shadow-xs transition"
                        >
                          {t('action_transfer', 'Transfer Bureau')}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setModalForm({ target_level: 'Apex Grievance Redressal Committee' });
                            setActiveModal('escalate');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#DC3545]/10 hover:bg-[#DC3545]/20 text-[#DC3545] border border-[#DC3545]/30 text-xs font-semibold shadow-xs transition"
                        >
                          {t('action_escalate', 'Escalate')}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setModalForm({ officer_name: 'Dr. Sunita Sharma (Chief Redressal Officer)' });
                            setActiveModal('assign');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF3FF] text-[#0645A8] border border-[#DCE3EC] text-xs font-semibold shadow-xs transition"
                        >
                          {t('action_assign_officer', 'Assign Officer')}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setModalForm({ resolution_summary: '' });
                          setActiveModal('resolve');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16A765] hover:bg-[#138d55] text-white text-xs font-bold shadow-xs transition"
                      >
                        {language === 'hi' ? 'निस्तारण करें' : 'Dispose / Resolve'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE3EC]">
                    <span className="text-[10px] uppercase font-semibold text-[#687386] block">{t('table_institution', 'Target Institution')}</span>
                    {isComplainant ? (
                      <span className="font-bold text-[#172033] text-left mt-0.5 truncate block w-full">
                        {complaint.institution_name}
                      </span>
                    ) : (
                      <button
                        onClick={() => onViewInstitution(complaint.institution_id)}
                        className="font-bold text-[#172033] hover:text-[#0645A8] text-left mt-0.5 truncate block w-full transition"
                      >
                        {complaint.institution_name}
                      </button>
                    )}
                    <span className="text-[10px] text-[#687386] font-mono">
                      AICTE ID: {complaint.institution_aicte_id}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE3EC]">
                    <span className="text-[10px] uppercase font-semibold text-[#687386] block">{t('table_category', 'Grievance Category')}</span>
                    <span className="font-bold text-[#172033] mt-0.5 block">{complaint.category}</span>
                    <span className="text-[10px] text-[#0645A8] font-semibold block mt-0.5">
                      APH: {getAphClause(complaint.category)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE3EC]">
                    <span className="text-[10px] uppercase font-semibold text-[#687386] block">{language === 'hi' ? 'आवंटित अधिकारी / डेस्क' : 'Assigned Official / Desk'}</span>
                    <span className="font-bold text-[#172033] mt-0.5 block truncate">
                      {complaint.assigned_officer || 'Central Intake Desk'}
                    </span>
                    <span className="text-[10px] text-[#687386]">{complaint.source_bureau}</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE3EC]">
                    <span className="text-[10px] uppercase font-semibold text-[#687386] block">{language === 'hi' ? 'सांविधिक निवारण एसएलए' : 'Statutory Resolution SLA'}</span>
                    <span className={`font-bold mt-0.5 block ${complaint.is_overdue ? 'text-[#DC3545]' : 'text-[#172033]'}`}>
                      {formatDate(complaint.due_date)}
                    </span>
                    <span className="text-[10px] text-[#687386]">
                      {language === 'hi' ? 'प्राप्ति तिथि:' : 'Intake Date:'} {formatDate(complaint.received_date)}
                    </span>
                  </div>
                </div>

                {/* Narrative */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-2">
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    {language === 'hi' ? 'शिकायत विवरण एवं तथ्य' : 'Grievance Description & Facts'}
                  </h4>
                  <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-wrap break-words break-all max-w-full overflow-hidden">
                    {complaint.description}
                  </p>

                  <div className="pt-2 border-t border-[#EAF0F6] flex flex-wrap items-center gap-4 text-[11px] text-[#687386]">
                    <span>
                      {language === 'hi' ? 'शिकायतकर्ता:' : 'Complainant:'} <strong className="text-[#172033]">{complaint.is_anonymous ? (language === 'hi' ? 'संरक्षित गोपनीय पहचान' : 'Protected Confidential Identity') : complaint.complainant_name}</strong>
                    </span>
                    {complaint.complainant_id_number && (
                      <span>{language === 'hi' ? 'संस्थागत आईडी:' : 'Institutional ID:'} <strong className="text-[#172033]">{complaint.complainant_id_number}</strong></span>
                    )}
                    <span>{language === 'hi' ? 'प्राप्त:' : 'Received:'} <strong className="text-[#172033]">{formatDate(complaint.received_date)}</strong></span>
                  </div>
                </div>

                {/* Evidence Documents (Hidden for Bureau Reviewers) */}
                {!isReviewer && (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#172033] uppercase tracking-wider block">
                        {language === 'hi' ? 'आधिकारिक साक्ष्य एवं दस्तावेज' : 'Official Supporting Evidence & Proof Documents'} ({complaint.evidence_files?.length || 0})
                      </span>
                      <p className="text-[11px] text-[#687386] mt-0.5">
                        {language === 'hi' ? 'प्रशासनिक सत्यापन एवं ऑडिट हेतु प्रस्तुत प्रामाणिक दस्तावेज।' : 'Authentic documents submitted for administrative verification and audit.'}
                      </p>
                    </div>

                    {!currentRole?.readOnly && (isAdmin || (isReviewer && (currentRole?.bureau === 'All' || currentRole?.bureau === complaint.source_bureau))) && (
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0645A8] hover:bg-[#1769D2] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition flex-shrink-0">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploadingEvidence ? (language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...') : (language === 'hi' ? 'पीडीएफ दस्तावेज अपलोड करें' : 'Upload PDF Document')}</span>
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
                    <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] text-xs flex items-center justify-between">
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
                            className="p-3 bg-white border border-[#DCE3EC] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-[#0645A8]/50 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${isImg ? 'bg-[#EAF3FF] text-[#0645A8]' : isPdf ? 'bg-red-50 text-[#DC3545]' : 'bg-[#EAF3FF] text-[#0645A8]'}`}>
                                {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#172033] truncate" title={file.name || targetFilename}>
                                  {file.name || targetFilename}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#687386] mt-0.5">
                                  {file.size && <span>{file.size}</span>}
                                  <span className="text-[#0645A8] font-bold bg-[#EAF3FF] px-2 py-0.5 rounded border border-[#BBD5F8]">
                                    {language === 'hi' ? 'स्वचालित जांच: पारित (%PDF-)' : 'Automated Check: Passed (%PDF-)'}
                                  </span>
                                  {isReviewerAccepted ? (
                                    <span className="text-[#16A765] font-bold bg-[#16A765]/15 px-2 py-0.5 rounded border border-[#16A765]/30">
                                      {language === 'hi' ? 'एपीएच प्रमाणित प्रामाणिकता' : 'APH Verified Authentic'}
                                    </span>
                                  ) : (
                                    <span className="text-[#B45309] font-bold bg-[#F59E0B]/15 px-2 py-0.5 rounded border border-[#F59E0B]/30">
                                      {language === 'hi' ? 'प्रामाणिकता संवीक्षाधीन (खंड 7.23)' : 'Authenticity Scrutiny Pending (APH 7.23)'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewProof(file)}
                                disabled={isThisLoading}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#EAF3FF] hover:bg-[#D4E7FF] text-[#0645A8] border border-[#BBD5F8] rounded-lg text-xs font-bold transition shadow-2xs disabled:opacity-50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isThisLoading ? (language === 'hi' ? 'खुल रहा है...' : 'Opening...') : (language === 'hi' ? 'सबूत देखें' : 'View Proof')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadProof(file)}
                                className="p-1.5 bg-[#F8FAFC] hover:bg-[#EAF3FF] text-[#687386] hover:text-[#172033] border border-[#DCE3EC] rounded-lg transition shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-[#687386] bg-white border border-dashed border-[#DCE3EC] rounded-xl">
                      {language === 'hi' ? 'इस शिकायत में अभी तक कोई साक्ष्य दस्तावेज संलग्न नहीं है।' : 'No evidence documents attached to this complaint yet.'}
                    </div>
                  )}
                </div>
                )}

                {/* Resolution Summary if Disposed */}
                {complaint.status === 'Disposed' && complaint.resolution_summary && (
                  <div className="p-4 rounded-xl bg-[#16A765]/10 border border-[#16A765]/30 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-[#16A765] font-bold">
                      <CheckCircle className="w-4 h-4 text-[#16A765]" />
                      {language === 'hi' ? 'आधिकारिक मामला समापन सारांश एवं आदेश' : 'Official Case Closure Summary & Order'}
                    </div>
                    <p className="text-[#172033] leading-relaxed">{complaint.resolution_summary}</p>
                    <div className="text-[10px] text-[#16A765] pt-1 border-t border-[#16A765]/30 flex items-center justify-between">
                      <span>{language === 'hi' ? 'निस्तारण तिथि:' : 'Disposed on'} {formatDate(complaint.disposed_date)}</span>
                      <span>{language === 'hi' ? 'अंतिम सांविधिक निवारण आदेश जारी' : 'Final Statutory Redressal Order Issued'}</span>
                    </div>
                  </div>
                )}

                {/* Complainant Satisfaction Tracking for Officials */}
                {(complaint.complainant_feedback || complaint.status === 'Disposed') && (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0645A8] text-sm flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-[#0645A8]" />
                        {language === 'hi' ? 'शिकायतकर्ता निवारण संतुष्टि' : 'Complainant Redressal Satisfaction'}
                      </span>
                      {complaint.complainant_feedback && (
                        <span className="text-[10px] text-[#0645A8] font-semibold bg-[#EAF3FF] border border-[#BBD5F8] px-2 py-0.5 rounded">
                          {language === 'hi' ? 'प्रतिक्रिया दर्ज' : 'Feedback Recorded'}
                        </span>
                      )}
                    </div>

                    {complaint.complainant_feedback ? (
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-[#DCE3EC]">
                        {complaint.complainant_rating && (
                          <div className="flex items-center gap-1 text-[#F59E0B] mb-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={complaint.complainant_rating >= s ? 'text-[#F59E0B] text-sm' : 'text-[#DCE3EC] text-sm'}>
                                ★
                              </span>
                            ))}
                            <span className="text-xs font-bold text-[#172033] ml-1.5">
                              {complaint.complainant_rating} / 5 Rating
                            </span>
                          </div>
                        )}
                        <p className="text-[#687386] italic">
                          "{complaint.complainant_feedback}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-[#687386] italic p-2 bg-white rounded-lg border border-[#DCE3EC]">
                        {language === 'hi' ? 'मामला बंद होने पर शिकायतकर्ता संतुष्टि प्रतिक्रिया की प्रतीक्षा है।' : 'Awaiting complainant satisfaction feedback submission upon case closure.'}
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
                <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B]/35 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#F59E0B]/20 text-[#B45309] border border-[#F59E0B]/30 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-sm text-[#172033]">
                        {language === 'hi' ? 'समीक्षक संवीक्षा एवं स्वीकृति लंबित' : 'Reviewer Scrutiny & Acceptance Pending'}
                      </h3>
                      <p className="text-xs text-[#687386] leading-relaxed">
                        {language === 'hi' ? 'एआईसीटीई मानक संचालन प्रक्रियाओं के अनुसार, किसी भी विभागीय निर्देश या कार्रवाई रिपोर्ट को दर्ज करने से पहले समीक्षा अधिकारी द्वारा शिकायत की संवीक्षा और सत्यापन अनिवार्य है।' : 'Under AICTE Standard Operating Procedures, a grievance must first be scrutinised and verified/accepted by the Reviewing Officer before departmental directives, college notices, or Action Taken Reports can be logged.'}
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
                        className="px-4 py-2 bg-[#16A765] hover:bg-[#138d55] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{language === 'hi' ? 'शिकायत का सत्यापन एवं स्वीकृति करें' : 'Proceed to Verify & Accept Grievance'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Summary Banner */}
                  <div className="bg-[#EAF3FF] border border-[#BBD5F8] text-[#172033] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#16A765]/15 text-[#16A765] border border-[#16A765]/30 font-bold uppercase">
                          {language === 'hi' ? 'समीक्षक स्वीकृति सत्यापित' : 'Reviewer Acceptance Confirmed'}
                        </span>
                        <span className="text-xs text-[#0645A8]">
                          {language === 'hi' ? 'सत्यापन स्थिति:' : 'Verification Status:'} <strong className="text-[#172033]">{complaint.verification_status || 'Verified'}</strong>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#172033]">
                        {language === 'hi' ? 'विभागीय कार्रवाई एवं निवारण निर्देश कार्यक्षेत्र' : 'Department Action & Redressal Directive Workspace'}
                      </h3>
                      <p className="text-xs text-[#687386]">
                        {language === 'hi' ? 'आवंटित ब्यूरो:' : 'Assigned Bureau:'} <strong className="text-[#172033]">{complaint.source_bureau}</strong> • {language === 'hi' ? 'लक्ष्य एसएलए:' : 'Target SLA:'} {formatDate(complaint.due_date)}
                      </p>
                    </div>

                    {isCompleted ? (
                      <div className="px-4 py-2 rounded-xl bg-[#16A765]/15 border border-[#16A765]/35 text-[#16A765] font-bold text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#16A765]" />
                        <span>{language === 'hi' ? 'शिकायत पूर्ण एवं समाप्त' : 'Complaint Completed & Concluded'}</span>
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-xl bg-white border border-[#BBD5F8] text-[#0645A8] font-semibold text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0645A8]" />
                        <span>{language === 'hi' ? 'जांच / कार्रवाई प्रगति पर' : 'Inquiry / Action in Progress'}</span>
                      </div>
                    )}
                  </div>

                  {/* Record Action Taken Form */}
                  {!isCompleted && (!currentRole?.readOnly && (isAdmin || (isReviewer && (currentRole?.bureau === 'All' || currentRole?.bureau === complaint.source_bureau)))) && (
                    <div className="bg-white border border-[#DCE3EC] rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0F6]">
                        <FileCheck className="w-4 h-4 text-[#0645A8]" />
                        <h3 className="text-sm font-extrabold text-[#172033] uppercase tracking-wider">
                          {language === 'hi' ? 'आगामी विभागीय कार्रवाई / निर्देश दर्ज करें' : 'Record Subsequent Department Action / Directive'}
                        </h3>
                      </div>

                      <form onSubmit={handleActionTakenSubmit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#172033] font-semibold mb-1">
                              {language === 'hi' ? 'कार्रवाई श्रेणी / मील का पत्थर *' : 'Action Category / Milestone *'}
                            </label>
                            <select
                              value={actionForm.action_type}
                              onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })}
                              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8]"
                              required
                            >
                              <option value="Action Taken Report Awaited" className="bg-white text-[#172033]">Action Taken Report (ATR) Awaited from College</option>
                              <option value="Show Cause Notice Issued" className="bg-white text-[#172033]">Show Cause Notice Issued to College Administration</option>
                              <option value="Joint Inquiry Committee Constituted" className="bg-white text-[#172033]">Joint Inquiry Committee Constituted</option>
                              <option value="Hearing Scheduled" className="bg-white text-[#172033]">Formal Hearing Scheduled with Both Parties</option>
                              <option value="Interim Directive Issued" className="bg-white text-[#172033]">Interim Directive Issued to Institute</option>
                              <option value="Explanation Received" className="bg-white text-[#172033]">Explanation Received from College Management</option>
                              <option value="Site Inspection Conducted" className="bg-white text-[#172033]">Fact-Finding Site Inspection Conducted</option>
                              <option value="Compliance Verified" className="bg-white text-[#172033]">Institutional Compliance Verified</option>
                              <option value="Final Redressal Order Issued" className="bg-white text-[#172033]">Final Statutory Redressal Order & Closure</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[#172033] font-semibold mb-1">
                              {language === 'hi' ? 'अगली अनुवर्ती / अनुपालन नियत तिथि' : 'Next Follow-up / Compliance Due Date'}
                            </label>
                            <input
                              type="date"
                              value={actionForm.next_follow_up_date}
                              onChange={(e) => setActionForm({ ...actionForm, next_follow_up_date: e.target.value })}
                              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#172033] font-semibold mb-1">
                            {language === 'hi' ? 'कार्रवाई की निगरानी करने वाले अधिकारी' : 'Officer Overseeing Action'}
                          </label>
                          <input
                            type="text"
                            placeholder="Officer Name / Bureau Official (e.g. Dr. Sunita Sharma, Regional Officer)"
                            value={actionForm.officer_name}
                            onChange={(e) => setActionForm({ ...actionForm, officer_name: e.target.value })}
                            className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[#172033] font-semibold mb-1">
                            {language === 'hi' ? 'विस्तृत निष्कर्ष / जारी निर्देश *' : 'Detailed Findings / Directives Issued *'}
                          </label>
                          <textarea
                            rows={4}
                            placeholder={language === 'hi' ? 'आधिकारिक जांच निष्कर्ष, नोटिस संदर्भ संख्या, कॉलेज प्रशासन को दिए गए निर्देश, सुनवाई स्थल/तिथि आदि दर्ज करें...' : 'Detail the official inquiry findings, notice reference numbers, directives to college administration, hearing venue/date, or interim relief granted...'}
                            value={actionForm.action_details}
                            onChange={(e) => setActionForm({ ...actionForm, action_details: e.target.value })}
                            className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
                            required
                          />
                        </div>

                        <div className="p-3 bg-[#16A765]/10 border border-[#16A765]/30 rounded-xl space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-[#172033] text-xs">
                            <input
                              type="checkbox"
                              checked={actionForm.is_completed}
                              onChange={(e) => setActionForm({ ...actionForm, is_completed: e.target.checked })}
                              className="w-4 h-4 text-[#16A765] rounded bg-white border-[#DCE3EC]"
                            />
                            <span>{language === 'hi' ? 'शिकायत कार्रवाई को पूर्ण और समाप्त चिह्नित करें (अंतिम समाधान)' : 'Mark Complaint Action as Completed & Concluded (Final Resolution)'}</span>
                          </label>
                          <p className="text-[11px] text-[#687386] pl-6">
                            {language === 'hi' ? 'इसे चेक करने पर मामला स्थिति को निस्तारित/पूर्ण कर दिया जाएगा और सभी पक्षों को सूचित किया जाएगा।' : "Checking this will transition the case status to 'Disposed' / 'Completed', finalize the official case closure statement, and notify all parties. Reviewer acceptance alone does not complete a case."}
                          </p>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={actionSubmitting}
                            className="px-5 py-2.5 bg-[#0645A8] hover:bg-[#1769D2] text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>{actionSubmitting ? (language === 'hi' ? 'कार्रवाई दर्ज हो रही है...' : 'Recording Action...') : (language === 'hi' ? 'कार्रवाई सहेजें व दर्ज करें' : 'Save & Log Action Taken')}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Recorded Action History */}
                  <div className="bg-white border border-[#DCE3EC] rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAF0F6]">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#0645A8]" />
                        <h3 className="text-sm font-extrabold text-[#172033] uppercase tracking-wider">
                          {language === 'hi' ? 'दर्ज कार्रवाइयां एवं निर्देश समयरेखा' : 'Recorded Actions & Directive Timeline'}
                        </h3>
                      </div>
                      <span className="text-xs text-[#687386] font-medium">
                        {complaint.actions?.length || 0} {language === 'hi' ? 'इवेंट्स दर्ज' : 'Events Logged'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {complaint.actions?.map((act) => (
                        <div key={act.id} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#172033] text-sm">
                                {act.action_type}
                              </span>
                              {act.to_value && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8]">
                                  Status: {act.to_value}
                                </span>
                              )}
                            </div>
                            <span className="text-[#687386] font-mono text-[11px]">
                              {formatDateTime(act.created_at)}
                            </span>
                          </div>

                          <p className="text-[#172033] leading-relaxed font-medium">
                            {act.remarks}
                          </p>

                          <div className="pt-2 border-t border-[#EAF0F6] flex items-center justify-between text-[11px] text-[#687386]">
                            <span>{language === 'hi' ? 'अधिकारी:' : 'Official:'} <strong className="text-[#172033]">{act.actor_name}</strong> ({act.actor_role})</span>
                            <span>{language === 'hi' ? 'अधिकार क्षेत्र:' : 'Jurisdiction:'} <strong className="text-[#172033]">{act.actor_bureau || complaint.source_bureau}</strong></span>
                          </div>
                        </div>
                      ))}

                      {(!complaint.actions || complaint.actions.length === 0) && (
                        <div className="py-6 text-center text-[#687386]">
                          {language === 'hi' ? 'अभी तक कोई कार्रवाई दर्ज नहीं की गई है।' : 'No actions recorded yet. Use the form above to record subsequent department actions.'}
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
              <div className="lg:col-span-2 bg-white border border-[#DCE3EC] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#0645A8]" />
                    <h3 className="text-sm font-bold text-[#172033] tracking-wide">
                      {language === 'hi' ? 'कालानुक्रमिक मामला कार्रवाई इतिहास' : 'Chronological Case Action History'} ({complaint.actions?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#687386]">
                    {language === 'hi' ? 'अपरिवर्तनीय ऑडिट-अनुपालक इवेंट ट्रेल' : 'Immutable audit-compliant event trail'}
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCE3EC]">
                  {complaint.actions?.map((act) => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#0645A8] ring-4 ring-white shadow-xs" />
                      <div className="bg-[#F8FAFC] border border-[#DCE3EC] p-3.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#172033]">{act.action_type}</span>
                          <span className="text-[10px] text-[#687386] font-mono">{formatDateTime(act.created_at)}</span>
                        </div>
                        {act.from_value && act.to_value && (
                          <div className="text-[11px] text-[#0645A8] font-medium">
                            Transition: <span className="line-through text-[#687386]">{act.from_value}</span> &rarr; {act.to_value}
                          </div>
                        )}
                        <p className="text-[#172033] text-xs leading-relaxed mt-1">
                          {act.remarks}
                        </p>
                        <div className="text-[10px] text-[#687386] pt-1 border-t border-[#EAF0F6] flex items-center justify-between">
                          <span>{language === 'hi' ? 'कर्ता:' : 'Actor:'} <strong className="text-[#172033]">{act.actor_name}</strong> ({act.actor_role})</span>
                          {act.actor_bureau && <span>{language === 'hi' ? 'ब्यूरो:' : 'Bureau:'} {act.actor_bureau}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-[#0645A8]" />
                      <h3 className="text-sm font-bold text-[#172033]">{language === 'hi' ? 'संबंधित अंतर-ब्यूरो अतिव्याप्तियां' : 'Linked Cross-Bureau Overlaps'}</h3>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {complaint.related_overlaps?.map((ov) => (
                      <div
                        key={ov.alert_id}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0645A8]">{ov.overlap_type}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] font-semibold">
                            {ov.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#687386] truncate" title={ov.matched_subject}>
                          Matched: <strong className="text-[#172033]">{ov.matched_case_id}</strong> ({ov.matched_bureau})
                        </div>
                      </div>
                    ))}

                    {(!complaint.related_overlaps || complaint.related_overlaps.length === 0) && (
                      <p className="text-xs text-[#687386] py-4 text-center">
                        {language === 'hi' ? 'इस मामले से जुड़ा कोई सक्रिय ओवरलैप नहीं है।' : 'No active cross-bureau overlap linked to this case.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4 text-[#0645A8]" />
                    <h3 className="text-sm font-bold text-[#172033]">{language === 'hi' ? 'आवंटित जांच दल' : 'Assigned Inquiry Team'}</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {complaint.assignments?.map((asm) => (
                      <div key={asm.id} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs">
                        <div className="font-bold text-[#172033]">{asm.officer_name}</div>
                        <div className="text-[10px] text-[#687386]">Bureau: {asm.bureau}</div>
                        <div className="text-[10px] text-[#687386] mt-1">
                          Assigned by {asm.assigned_by} on {formatDate(asm.assigned_at)}
                        </div>
                      </div>
                    ))}

                    {(!complaint.assignments || complaint.assignments.length === 0) && (
                      <p className="text-xs text-[#687386] py-3 text-center">
                        {language === 'hi' ? 'वर्तमान में केंद्रीकृत नोडल इनटेक डेस्क पर प्रबंधित।' : 'Currently handled at centralized nodal intake desk.'}
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
            ? (language === 'hi' ? 'सक्रिय संवीक्षा हेतु शिकायत सत्यापित व स्वीकार करें' : 'Verify & Accept Grievance for Active Scrutiny')
            : activeModal === 'request_info'
            ? (language === 'hi' ? 'शिकायतकर्ता से अतिरिक्त जानकारी का अनुरोध करें' : 'Request Additional Information from Complainant')
            : activeModal === 'respond_info'
            ? (language === 'hi' ? 'समीक्षा अधिकारी को स्पष्टीकरण प्रस्तुत करें' : 'Submit Clarification to Reviewing Officer')
            : activeModal === 'reject'
            ? (language === 'hi' ? 'आधिकारिक औचित्य के साथ शिकायत अस्वीकार करें' : 'Reject Grievance with Stated Official Rationale')
            : activeModal === 'status'
            ? (language === 'hi' ? 'शिकायत स्थिति अद्यतन करें' : 'Update Complaint Status')
            : activeModal === 'transfer'
            ? (language === 'hi' ? 'ब्यूरो क्षेत्राधिकार स्थानांतरित करें' : 'Transfer Bureau Jurisdiction')
            : activeModal === 'escalate'
            ? (language === 'hi' ? 'उच्च प्राधिकरण को अग्रेषित करें' : 'Escalate to Higher Authority')
            : activeModal === 'assign'
            ? (language === 'hi' ? 'मामले में अधिकारी नियुक्त करें' : 'Assign Officer to Case')
            : (language === 'hi' ? 'आधिकारिक समाधान दर्ज करें एवं मामला निस्तारित करें' : 'Record Official Resolution & Dispose Case')
        }
      >
        <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
          {/* VERIFY MODAL */}
          {activeModal === 'verify' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#16A765]/10 border border-[#16A765]/30 rounded-xl text-[#172033]">
                <p className="font-bold text-[#16A765]">{language === 'hi' ? 'ब्यूरो जांच कार्यप्रवाह में शिकायत स्वीकार करें' : 'Accept Grievance into Bureau Inquiry Workflow'}</p>
                <p className="text-[11px] text-[#687386] mt-0.5">
                  {language === 'hi' ? "यह कार्रवाई दस्तावेज़ की सत्यता को मान्य करती है और मामले की स्थिति को 'प्रस्तुत' से 'समीक्षाधीन' में बदलती है।" : "This action validates document genuineness and transitions the case from 'Submitted' to 'Under Review'."}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#172033]">
                  <input
                    type="checkbox"
                    checked={modalForm.override_priority}
                    onChange={(e) => setModalForm({ ...modalForm, override_priority: e.target.checked })}
                    className="w-4 h-4 text-[#0645A8] rounded bg-white border-[#DCE3EC]"
                  />
                  <span>{language === 'hi' ? 'सुझाई गई प्राथमिकता स्तर को ओवरराइड करें' : 'Override Suggested Priority Level'}</span>
                </label>
              </div>

              {modalForm.override_priority && (
                <div className="p-3 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl space-y-3">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'नई पुष्टि की गई प्राथमिकता *' : 'New Confirmed Priority *'}</label>
                    <select
                      value={modalForm.confirmed_priority || complaint.priority}
                      onChange={(e) => setModalForm({ ...modalForm, confirmed_priority: e.target.value })}
                      className="w-full p-2 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8]"
                    >
                      {PRIORITY_OPTIONS.filter(p => p !== 'All').map(p => (
                        <option key={p} value={p} className="bg-white text-[#172033]">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'अनिवार्य ओवरराइड औचित्य *' : 'Mandatory Override Justification *'}</label>
                    <input
                      type="text"
                      placeholder={language === 'hi' ? 'उदा. साक्ष्य त्वरित 15-दिवसीय समाधान की आवश्यकता दर्शाता है' : 'e.g. Evidence shows immediate threat requiring expedited 15-day resolution'}
                      value={modalForm.priority_override_reason || ''}
                      onChange={(e) => setModalForm({ ...modalForm, priority_override_reason: e.target.value })}
                      className="w-full p-2 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'संवीक्षा निष्कर्ष एवं टिप्पणी' : 'Scrutiny Findings & Remarks'}</label>
                <textarea
                  rows={3}
                  value={modalForm.remarks || ''}
                  onChange={(e) => setModalForm({ ...modalForm, remarks: e.target.value })}
                  placeholder={language === 'hi' ? 'सत्यापित दस्तावेजों या प्रारंभिक निष्कर्षों का सारांश दर्ज करें...' : 'Record summary of verified documents, transaction IDs, or initial findings...'}
                  className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* REQUEST INFO MODAL */}
          {activeModal === 'request_info' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-[#172033]">
                <p className="font-bold text-[#B45309]">{language === 'hi' ? 'शिकायतकर्ता से स्पष्टीकरण का अनुरोध करें' : 'Request Clarification from Complainant'}</p>
                <p className="text-[11px] text-[#687386] mt-0.5">
                  {language === 'hi' ? "शिकायत की स्थिति को 'अतिरिक्त जानकारी आवश्यक' में बदलता है। शिकायतकर्ता को पोर्टल में उत्तर देने का संदेश मिलेगा।" : "Transitions grievance status to 'Needs More Information'. The complainant will receive an in-portal prompt to respond."}
                </p>
              </div>
              <div>
                <label className="block text-[#172033] font-semibold mb-1">
                  {language === 'hi' ? 'विशिष्ट दस्तावेज / साक्ष्य आवश्यक *' : 'Specific Documents / Evidence Required *'}
                </label>
                <textarea
                  rows={4}
                  placeholder={language === 'hi' ? 'उदा. कृपया मूल शुल्क रसीद, परिपत्र या उपस्थिति पत्रक की प्रति प्रस्तुत करें...' : 'e.g. Please furnish copy of the original fee receipt, fee breakdown circular issued by college, or attendance sheet...'}
                  value={modalForm.request_notes || ''}
                  onChange={(e) => setModalForm({ ...modalForm, request_notes: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* RESPOND INFO MODAL */}
          {activeModal === 'respond_info' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-[#172033]">
                <p className="font-bold text-[#B45309]">{language === 'hi' ? 'समीक्षा अधिकारी को स्पष्टीकरण प्रस्तुत करें' : 'Submit Clarification to Reviewing Officer'}</p>
                <p className="text-[11px] text-[#687386] mt-0.5">
                  {language === 'hi' ? 'मामले की जांच पुनः आरंभ करने हेतु मांगी गई जानकारी या स्पष्टीकरण प्रदान करें।' : 'Provide the requested information or clarification to resume case scrutiny.'}
                </p>
              </div>
              <div>
                <label className="block text-[#172033] font-semibold mb-1">
                  {language === 'hi' ? 'स्पष्टीकरण / अतिरिक्त विवरण *' : 'Clarification / Additional Details *'}
                </label>
                <textarea
                  rows={4}
                  placeholder={language === 'hi' ? 'अनुरोधित लेनदेन विवरण, रसीदें या स्पष्टीकरण प्रदान करें...' : 'Provide transaction details, receipts, or explanations requested...'}
                  value={modalForm.response_notes || ''}
                  onChange={(e) => setModalForm({ ...modalForm, response_notes: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* REJECT MODAL */}
          {activeModal === 'reject' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#DC3545]/10 border border-[#DC3545]/30 rounded-xl text-[#172033]">
                <p className="font-bold text-[#DC3545]">{language === 'hi' ? 'शिकायत की औपचारिक अस्वीकृति' : 'Formal Rejection of Grievance'}</p>
                <p className="text-[11px] text-[#687386] mt-0.5">
                  {language === 'hi' ? 'एआईसीटीई विनियम 2019 के अंतर्गत कानूनी रूप से वैध औचित्य आवश्यक है।' : 'A legally sound justification is required under AICTE Grievance Redressal Regulations 2019.'}
                </p>
              </div>
              <div>
                <label className="block text-[#172033] font-semibold mb-1">
                  {language === 'hi' ? 'आधिकारिक अस्वीकृति औचित्य *' : 'Official Rejection Rationale *'}
                </label>
                <textarea
                  rows={4}
                  placeholder={language === 'hi' ? 'अस्वीकृति का कारण बताएं (उदा. एआईसीटीई के अधिकार क्षेत्र से बाहर, उच्च न्यायालय में विचाराधीन)...' : 'State why the matter is rejected (e.g. Outside AICTE statutory purview, sub-judice in high court, anonymous without actionable proof, unsubstantiated claims)...'}
                  value={modalForm.rejection_reason || ''}
                  onChange={(e) => setModalForm({ ...modalForm, rejection_reason: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* STATUS CHANGE */}
          {activeModal === 'status' && (
            <div>
              <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'नई स्थिति *' : 'New Status *'}</label>
              <select
                value={modalForm.status || complaint.status}
                onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8] shadow-xs"
              >
                {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                  <option key={s} value={s} className="bg-white text-[#172033]">{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* TRANSFER MODAL */}
          {activeModal === 'transfer' && (
            <div>
              <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'लक्ष्य एआईसीटीई ब्यूरो *' : 'Target AICTE Bureau *'}</label>
              <select
                value={modalForm.target_bureau || 'Regulation Bureau (RB)'}
                onChange={(e) => setModalForm({ ...modalForm, target_bureau: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8] shadow-xs"
              >
                {BUREAUS.filter(b => b !== 'All' && b !== complaint.source_bureau).map(b => (
                  <option key={b} value={b} className="bg-white text-[#172033]">{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* ESCALATE MODAL */}
          {activeModal === 'escalate' && (
            <div>
              <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'उच्च समिति / निकाय *' : 'Escalation Committee / Body *'}</label>
              <select
                value={modalForm.target_level || 'Apex Grievance Redressal Committee'}
                onChange={(e) => setModalForm({ ...modalForm, target_level: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8] shadow-xs"
              >
                <option value="Apex Grievance Redressal Committee" className="bg-white text-[#172033]">Apex Grievance Redressal Committee</option>
                <option value="Central Standing Appellate Committee" className="bg-white text-[#172033]">Central Standing Appellate Committee</option>
                <option value="Chief Vigilance Officer (CVO)" className="bg-white text-[#172033]">Chief Vigilance Officer (CVO)</option>
                <option value="Chairman Executive Committee" className="bg-white text-[#172033]">Chairman Executive Committee</option>
              </select>
            </div>
          )}

          {/* ASSIGN OFFICER MODAL */}
          {activeModal === 'assign' && (
            <div>
              <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'अधिकारी चुनें *' : 'Select Officer *'}</label>
              <select
                value={modalForm.officer_name || OFFICERS_LIST[0]}
                onChange={(e) => setModalForm({ ...modalForm, officer_name: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8] shadow-xs"
              >
                {OFFICERS_LIST.map(o => (
                  <option key={o} value={o} className="bg-white text-[#172033]">{o}</option>
                ))}
              </select>
            </div>
          )}

          {/* RESOLVE MODAL */}
          {activeModal === 'resolve' && (
            <div>
              <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'समाधान सारांश आदेश *' : 'Resolution Summary Order *'}</label>
              <textarea
                rows={3}
                placeholder={language === 'hi' ? 'अंतिम निष्कर्ष, संस्थान को जारी निर्देश, आदेशित रिफंड या लगाया गया जुर्माना दर्ज करें...' : 'State final findings, directive issued to institute, refund ordered, or penalties imposed...'}
                value={modalForm.resolution_summary || ''}
                onChange={(e) => setModalForm({ ...modalForm, resolution_summary: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 shadow-xs"
                required
              />
            </div>
          )}

          {/* Mandatory Remarks */}
          {['status', 'transfer', 'escalate', 'assign', 'resolve'].includes(activeModal) && (
            <div>
              <label className="block text-[#172033] font-semibold mb-1">
                {language === 'hi' ? 'आधिकारिक कार्रवाई टिप्पणी * (ऑडिट ट्रेल हेतु अनिवार्य)' : 'Official Action Remarks * (Audit Trail Mandatory)'}
              </label>
              <textarea
                rows={3}
                placeholder={language === 'hi' ? 'इस परिवर्तन का प्रशासनिक औचित्य बताएं...' : 'State administrative justification for this change...'}
                value={modalForm.remarks || ''}
                onChange={(e) => setModalForm({ ...modalForm, remarks: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 shadow-xs"
                required
              />
            </div>
          )}

          <div className="pt-3 border-t border-[#DCE3EC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#DCE3EC] text-[#687386] hover:text-[#172033] font-medium transition"
            >
              {t('action_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0645A8] hover:bg-[#1769D2] text-white font-bold shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (language === 'hi' ? 'दर्ज हो रहा है...' : 'Recording...') : (language === 'hi' ? 'कार्रवाई दर्ज करें' : 'Commit Action')}
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
          title={`${language === 'hi' ? 'दस्तावेज साक्ष्य पूर्वावलोकन:' : 'Document Evidence Preview:'} ${previewEvidence.name}`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#172033] bg-[#F8FAFC] p-3 rounded-xl border border-[#DCE3EC]">
              <span className="font-semibold truncate max-w-sm">
                {language === 'hi' ? 'दस्तावेज:' : 'Document:'} <strong className="text-[#172033]">{previewEvidence.name}</strong> {previewEvidence.size ? `(${previewEvidence.size})` : ''}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(previewEvidence.url, '_blank')}
                  className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#EAF3FF] border border-[#DCE3EC] rounded-lg font-bold text-[#0645A8] shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#0645A8]" />
                  <span>{language === 'hi' ? 'पूर्ण टैब में खोलें' : 'Open in Full Tab'}</span>
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
                  className="flex items-center gap-1 px-3 py-1 bg-[#0645A8] hover:bg-[#1769D2] text-white rounded-lg font-bold shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'डाउनलोड करें' : 'Download'}</span>
                </button>
              </div>
            </div>

            {/* APH Dual Authenticity Assessment Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE3EC]">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#EAF3FF] border border-[#BBD5F8]">
                <ShieldCheck className="w-4 h-4 text-[#0645A8] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#0645A8] block text-[11px]">
                    {language === 'hi' ? 'स्वचालित सिस्टम सत्यापन: पारित' : 'Automated System Check: PASSED'}
                  </span>
                  <span className="text-[10px] text-[#687386] block mt-0.5">
                    %PDF- signature verified • Size within 10MB statutory limit • Non-executable format.
                  </span>
                </div>
              </div>

              <div className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                isReviewerAccepted 
                  ? 'bg-[#16A765]/10 border-[#16A765]/30 text-[#16A765]' 
                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#B45309]'
              }`}>
                {isReviewerAccepted ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <div>
                  <span className="font-bold block text-[11px]">
                    {isReviewerAccepted 
                      ? (language === 'hi' ? 'सांविधिक प्रामाणिकता: सत्यापित (एपीएच अध्याय VII)' : 'Statutory Authenticity: VERIFIED (APH Ch. VII)')
                      : (language === 'hi' ? 'सांविधिक प्रामाणिकता: संवीक्षाधीन' : 'Statutory Authenticity: SCRUTINY PENDING')}
                  </span>
                  <span className="text-[10px] opacity-85 block mt-0.5">
                    {isReviewerAccepted 
                      ? 'Nodal Officer confirmed institutional seal and signatory credentials under APH Clause 7.23.'
                      : 'Automated checks do not guarantee legal authenticity. Official seal verification required.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-[#DCE3EC] rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center min-h-[420px]">
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
                  className="w-full h-[70vh] bg-white border-0"
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
