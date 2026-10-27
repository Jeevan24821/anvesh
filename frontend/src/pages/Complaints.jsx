import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { BureauBadge } from '../components/BureauBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import AcknowledgementModal from '../components/AcknowledgementModal';
import { formatDate, formatTimeOnly } from '../utils/formatters';
import { 
  BUREAUS, 
  STATUS_OPTIONS, 
  PRIORITY_OPTIONS, 
  CATEGORIES,
  AFFILIATION_OPTIONS,
  getAphClause
} from '../utils/constants';
import { InstitutionLogo } from '../components/InstitutionLogo';
import { CaseScannerModal } from '../components/CaseScannerModal';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  ArrowUpDown,
  Building,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Printer,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  FileText,
  MessageSquare,
  HelpCircle,
  Paperclip,
  Clock,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  X,
  Scan
} from 'lucide-react';

export function validateComplaintDescription(desc) {
  if (!desc || typeof desc !== 'string') {
    return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
  }
  const text = desc.trim();
  if (text.length < 15) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance (minimum 15 characters), including what happened.' };
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance with at least 2 words explaining what happened.' };
  }

  // Check for repeating the exact same word multiple times (e.g. 'test test test test')
  const cleanedWords = words.map(w => w.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')).filter(Boolean);
  if (cleanedWords.length >= 3 && new Set(cleanedWords).size <= 1) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
  }

  // Check if text contains Indian languages (Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam, etc.)
  if (/[\u0900-\u0D7F]/.test(text)) {
    const indicChars = text.match(/[\u0900-\u0D7F]/g) || [];
    if (new Set(indicChars).size < 4) {
      return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
    }
    return { valid: true };
  }

  // Alphanumeric check for Latin / English text
  const alnumChars = (text.toLowerCase().match(/[a-z0-9]/g) || []);
  if (alnumChars.length < 10) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
  }
  if (new Set(alnumChars).size <= 3) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
  }

  // Repeated single char run (e.g. 'aaaaa', 'xxxxxxx')
  if (/([a-zA-Z])\1{4,}/.test(text)) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
  }

  // Keyboard mash rows check
  const compact = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const mashPatterns = [/(asdf|ghjkl|qwerty|yuiop|zxcv|xcvbnm|12345|abcdef)/i];
  if (mashPatterns.some(pat => pat.test(compact)) && compact.length < 40) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
  }

  // Vowel to consonant ratio check for Latin text
  const letters = (text.toLowerCase().match(/[a-z]/g) || []);
  if (letters.length >= 10) {
    const vowels = letters.filter(c => 'aeiouy'.includes(c)).length;
    const vowelRatio = vowels / letters.length;
    if (vowelRatio < 0.12 || vowelRatio > 0.85) {
      return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
    }
  }

  // Long consonant cluster
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(text)) {
    return { valid: false, error: 'Please provide a meaningful description of your grievance, including what happened.' };
  }

  return { valid: true };
}

export function Complaints({ onViewCase, onViewInstitution, initialFilter = {} }) {
  const { currentRole, refreshNotifications } = useAuth();
  const { t, language } = useLanguage();
  const isComplainant = currentRole?.role === 'Complainant';
  const isReviewer = currentRole?.role === 'Reviewer';

  // Filter state
  const [search, setSearch] = useState('');
  const [bureau, setBureau] = useState(
    initialFilter.bureau || (isReviewer ? (currentRole?.bureau || 'All') : 'All')
  );
  const [status, setStatus] = useState(initialFilter.status || 'All');
  const [priority, setPriority] = useState(initialFilter.priority || 'All');
  const [category, setCategory] = useState('All');
  const [isOverdue, setIsOverdue] = useState(initialFilter.is_overdue || false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // React to initialFilter changes from Sidebar routing
  useEffect(() => {
    if (initialFilter.status !== undefined) setStatus(initialFilter.status);
    if (initialFilter.is_overdue !== undefined) setIsOverdue(initialFilter.is_overdue);
    if (initialFilter.priority !== undefined) setPriority(initialFilter.priority);
    if (initialFilter.bureau !== undefined) setBureau(initialFilter.bureau);
    setPage(0);
  }, [initialFilter.status, initialFilter.is_overdue, initialFilter.priority, initialFilter.bureau]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Complaint Registration Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [institutionsList, setInstitutionsList] = useState([]);
  const [createForm, setCreateForm] = useState({
    institution_id: '',
    complainant_affiliation: isComplainant ? (currentRole?.affiliation || 'Student') : 'Student',
    complainant_id_number: isComplainant ? (currentRole?.complainantId || '') : '',
    complainant_name: isComplainant ? (currentRole?.name || '') : '',
    complainant_email: isComplainant ? (currentRole?.email || 'priya.nair@dsce.edu.in') : '',
    complainant_phone: isComplainant ? (currentRole?.phone || '+91-9845012345') : '',
    is_anonymous: false,
    category: 'Fee Overcharging / Capitation',
    subject: '',
    description: '',
    evidence_files: []
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Real Evidence Upload State
  const [evidenceList, setEvidenceList] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Upload PDF only. Only .pdf files are accepted for official grievance evidence.');
      e.target.value = null;
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds maximum allowable size (10 MB).');
      e.target.value = null;
      return;
    }

    setUploadingEvidence(true);
    try {
      const res = await api.uploadEvidence(file);
      setEvidenceList(prev => [...prev, res]);
    } catch (err) {
      alert(err.message || 'Evidence upload failed');
    } finally {
      setUploadingEvidence(false);
      e.target.value = null;
    }
  };

  const removeEvidence = (index) => {
    setEvidenceList(prev => prev.filter((_, idx) => idx !== index));
  };

  // Rules-based priority suggestion state
  const [priorityAssessment, setPriorityAssessment] = useState({
    suggested_priority: 'Medium',
    statutory_sla_days: 45,
    suggested_bureau: 'PGRC (Public Grievance Redressal)',
    reason: 'Evaluating grievance parameters...',
    applicable_regulations: 'AICTE Public Grievance Redressal Norms'
  });

  // Acknowledgement Modal state
  const [selectedReceiptComplaint, setSelectedReceiptComplaint] = useState(null);

  // Complainant Response Modal state
  const [selectedCaseForResponse, setSelectedCaseForResponse] = useState(null);
  const [complainantResponseText, setComplainantResponseText] = useState('');
  const [responseSubmitting, setResponseSubmitting] = useState(false);

  // Quick Status Change Modal state (Officials only)
  const [selectedCaseForStatus, setSelectedCaseForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('Under Process');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getComplaints({
        skip: page * limit,
        limit,
        search,
        bureau: !isComplainant && bureau !== 'All' ? bureau : undefined,
        status: status !== 'All' ? status : undefined,
        priority: priority !== 'All' ? priority : undefined,
        category: category !== 'All' ? category : undefined,
        is_overdue: isOverdue ? true : undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setComplaints(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, limit, search, bureau, status, priority, category, isOverdue, sortBy, sortOrder, currentRole]);

  // Load institutions list for creation modal
  const loadInstitutions = async () => {
    try {
      const res = await api.getTargetInstitutions();
      const items = Array.isArray(res) ? res : (res?.items || []);
      setInstitutionsList(items);
      if (items.length > 0 && !createForm.institution_id) {
        setCreateForm(prev => ({ ...prev, institution_id: items[0].id }));
      }
    } catch (e) {
      console.error('Target institutions load error:', e);
    }
  };

  // Live Priority Evaluation via Backend / Rules
  useEffect(() => {
    if (!isCreateOpen) return;
    const timer = setTimeout(async () => {
      try {
        const assessment = await api.assessPriority({
          category: createForm.category,
          subject: createForm.subject,
          description: createForm.description,
          complainant_type: createForm.complainant_affiliation
        });
        setPriorityAssessment(assessment);
      } catch (e) {
        // Fallback local rules calculation
        let p = 'Medium';
        let b = 'PGRC (Public Grievance Redressal)';
        let days = 45;
        let r = 'Standard grievance evaluation.';
        if (createForm.category.includes('Ragging') || createForm.subject.toLowerCase().includes('ragging')) {
          p = 'Urgent';
          b = 'Anti-Ragging Cell (ARC)';
          days = 15;
          r = 'Zero-tolerance safety mandate under AICTE Prevention of Ragging Norms.';
        } else if (createForm.category.includes('Fee') || createForm.category.includes('Certificate')) {
          p = 'High';
          b = 'Regulation Bureau (RB)';
          days = 30;
          r = 'Severe academic career detriment under Fee & Certificate Protection Guidelines.';
        }
        setPriorityAssessment({
          suggested_priority: p,
          statutory_sla_days: days,
          suggested_bureau: b,
          reason: r,
          applicable_regulations: 'AICTE Statutory Framework 2026'
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [createForm.category, createForm.subject, createForm.description, isCreateOpen]);

  const handleOpenCreate = () => {
    if (!isComplainant) return;
    loadInstitutions();
    setEvidenceList([]);
    setCreateForm({
      institution_id: institutionsList[0]?.id || '',
      complainant_affiliation: currentRole?.affiliation || 'Student',
      complainant_id_number: currentRole?.complainantId || '',
      complainant_name: currentRole?.name || '',
      complainant_email: currentRole?.email || 'priya.nair@dsce.edu.in',
      complainant_phone: currentRole?.phone || '+91-9845012345',
      is_anonymous: false,
      category: 'Fee Overcharging / Capitation',
      subject: '',
      description: '',
      evidence_files: []
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.subject || !createForm.description) {
      setCreateError('Please complete subject and description fields.');
      return;
    }

    const descValidation = validateComplaintDescription(createForm.description);
    if (!descValidation.valid) {
      setCreateError(descValidation.error);
      return;
    }

    if (!createForm.is_anonymous && !createForm.complainant_name) {
      setCreateError('Please provide complainant name or select confidential anonymous filing.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);

      const payload = {
        institution_id: parseInt(createForm.institution_id || institutionsList[0]?.id),
        complainant_affiliation: createForm.complainant_affiliation,
        complainant_id_number: createForm.complainant_id_number,
        complainant_name: createForm.is_anonymous ? 'Anonymous Complainant' : createForm.complainant_name,
        complainant_email: createForm.complainant_email,
        complainant_phone: createForm.complainant_phone,
        is_anonymous: Boolean(createForm.is_anonymous),
        category: createForm.category,
        subject: createForm.subject,
        description: createForm.description,
        evidence_files: evidenceList
      };

      const created = await api.createComplaint(payload, currentRole?.name || 'Complainant');
      setIsCreateOpen(false);
      fetchComplaints();
      refreshNotifications();
      // Show official acknowledgement receipt
      setSelectedReceiptComplaint(created);
    } catch (err) {
      setCreateError(err.message || 'Failed to register grievance');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleComplainantResponseSubmit = async (e) => {
    e.preventDefault();
    if (!complainantResponseText.trim()) {
      alert('Please enter clarification response notes.');
      return;
    }

    try {
      setResponseSubmitting(true);
      await api.respondToInfo(selectedCaseForResponse.id, {
        response_notes: complainantResponseText
      });
      setSelectedCaseForResponse(null);
      setComplainantResponseText('');
      fetchComplaints();
      alert('Your response has been securely submitted to the reviewing officer.');
    } catch (err) {
      alert(err.message || 'Failed to submit clarification response');
    } finally {
      setResponseSubmitting(false);
    }
  };

  const handleQuickStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusRemarks) {
      alert('Official remarks are required for audit traceability.');
      return;
    }

    try {
      setStatusSubmitting(true);
      await api.updateComplaintStatus(selectedCaseForStatus.id, {
        status: newStatus,
        actor_name: currentRole?.name || 'Reviewing Official',
        actor_role: currentRole?.role || 'Reviewer',
        actor_bureau: currentRole?.bureau || selectedCaseForStatus.source_bureau,
        remarks: statusRemarks
      });
      setSelectedCaseForStatus(null);
      setStatusRemarks('');
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Status update failed');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const handleSort = (field) => {
    if (sortBy === field || (field === 'created_at' && (sortBy === 'created_at' || sortBy === 'received_date'))) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearch('');
    if (!isReviewer) {
      setBureau('All');
    }
    setStatus('All');
    setPriority('All');
    setCategory('All');
    setIsOverdue(false);
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
  };

  const isFiltered = Boolean(
    search ||
    (!isReviewer && bureau !== 'All') ||
    status !== 'All' ||
    priority !== 'All' ||
    category !== 'All' ||
    isOverdue ||
    sortBy !== 'created_at' ||
    sortOrder !== 'desc'
  );

  const quickStatusOptions = [
    { label: 'All Cases', value: 'All' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Under Review', value: 'Under Review' },
    { label: 'Under Process', value: 'Under Process' },
    { label: 'Needs More Info', value: 'Needs More Information' },
    { label: 'Hearing Scheduled', value: 'Hearing Scheduled' },
    { label: 'Action Taken Awaited', value: 'Action Taken Report Awaited' },
    { label: isComplainant ? 'Completed' : 'Disposed', value: 'Disposed' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  const renderSortHeader = (field, label, align = 'left') => {
    const isFieldActive = sortBy === field || (field === 'created_at' && (sortBy === 'created_at' || sortBy === 'received_date'));
    return (
      <th 
        className={`py-3 px-3.5 cursor-pointer select-none transition ${
          align === 'right' ? 'text-right' : 'text-left'
        } ${isFieldActive ? 'text-[#0645A8] font-bold bg-[#EAF3FF]' : 'text-[#687386] hover:text-[#172033]'}`}
        onClick={() => handleSort(field)}
        title={`Sort by ${label} (${isFieldActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'click to toggle'})`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          {isFieldActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-[#0645A8]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-[#0645A8]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-[#687386] group-hover:text-[#172033]" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#172033] tracking-tight flex items-center gap-2">
            {initialFilter.filter_label || (isComplainant ? t('nav_my_grievances', 'My Grievances & Status Tracker') : t('nav_all_grievances', 'AICTE Grievance Registry & Monitoring'))}
            {isComplainant && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#16A765]/15 text-[#16A765] border border-[#16A765]/30">
                {language === 'hi' ? 'सत्यापित शिकायतकर्ता पहुंच' : 'Verified Complainant Access'}
              </span>
            )}
          </h1>
          <p className="text-xs text-[#687386] mt-1">
            {isComplainant
              ? (language === 'hi'
                  ? 'अपनी दर्ज शिकायतों की वास्तविक समय स्थिति को ट्रैक करें, आधिकारिक स्पष्टीकरण अनुरोधों का उत्तर दें और पावती रसीदें प्रिंट करें।'
                  : 'Track the real-time processing of your submitted grievances. Receive official information queries, track SLAs, and print official acknowledgement receipts.')
              : (language === 'hi'
                  ? 'एआईसीटीई ब्यूरो के सभी मामलों की संवीक्षा, जांच एवं निस्तारण हेतु केंद्रीकृत शिकायत पंजिका।'
                  : 'Centralized registry to triage, scrutinize, investigate, and resolve institutional complaints across AICTE bureaus.')}
          </p>
        </div>

        {/* Grievance Submission: Strictly reserved for Complainants; Admin manages oversight */}
        {isComplainant && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0645A8] hover:bg-[#1769D2] text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('lodge_grievance', 'Submit New Grievance')}</span>
          </button>
        )}
      </div>

      {/* Complainant Privacy Assurance Banner */}
      {isComplainant && (
        <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="p-2 rounded-xl bg-[#16A765]/10 text-[#16A765] border border-[#16A765]/25 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#687386] space-y-1">
            <p className="font-bold text-sm text-[#172033]">
              {language === 'hi' ? 'सांविधिक शिकायतकर्ता संरक्षण एवं गोपनीयता गारंटी' : 'Statutory Complainant Protection & Confidentiality Guarantee'}
            </p>
            <p>
              {language === 'hi'
                ? 'एआईसीटीई विनियम 2019 के अंतर्गत आपका विवरण सुरक्षित और पृथक रखा जाता है। केवल अधिकृत अधिकारी और आप ही इसे देख सकते हैं।'
                : 'Your record is strictly isolated under AICTE Regulations 2019. Only your authenticated submissions are accessible to you. Internal officer deliberations and confidential evidence are protected from unauthorized disclosure.'}
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#DCE3EC] p-4 rounded-2xl shadow-xs space-y-3.5">
        {/* Quick Status Filter Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#687386]">
              {language === 'hi' ? 'त्वरित स्थिति फ़िल्टर' : 'Quick Status Filter'}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-[#0645A8] hover:text-[#1769D2] flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('action_reset', 'Reset Filters')}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickStatusOptions.map((opt) => {
              const isActive = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStatus(opt.value);
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0645A8] text-white shadow-xs font-bold'
                      : 'bg-[#F8FAFC] hover:bg-[#EAF3FF] text-[#687386] hover:text-[#0645A8] border border-[#DCE3EC]'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort Controls Row */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-1 border-t border-[#EAF0F6]">
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#687386]" />
              <input
                type="text"
                placeholder={
                  isComplainant 
                    ? (language === 'hi' ? "मामला आईडी (AICTE-2026-...) या विषय द्वारा खोजें..." : "Search your cases by Case ID (AICTE-2026-...) or Subject...") 
                    : (language === 'hi' ? "मामला आईडी, संस्थान का नाम, एआईसीटीई आईडी, या विषय द्वारा खोजें..." : "Search by Case ID, Institution Name, AICTE ID, or Subject...")
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-10 pr-9 py-2 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] transition shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(0);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687386] hover:text-[#172033] p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#EAF3FF] hover:bg-[#D4E7FF] text-[#0645A8] border border-[#BBD5F8] rounded-xl text-xs font-bold transition shadow-2xs flex-shrink-0"
              title={language === 'hi' ? 'केस बारकोड या क्यूआर कोड स्कैन करें' : 'Scan Case Barcode or QR Code'}
            >
              <Scan className="w-4 h-4 text-[#0645A8]" />
              <span className="hidden sm:inline">{language === 'hi' ? 'बारकोड स्कैन' : 'Scan Slip'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-[#687386] font-medium">{language === 'hi' ? 'क्रम:' : 'Sort:'}</span>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(0);
                }}
                className="bg-transparent text-[#172033] font-bold focus:outline-none cursor-pointer"
              >
                <option value="created_at:desc" className="bg-white text-[#172033]">{language === 'hi' ? 'नवीनतम पहले' : 'Newest First (Submission Date)'}</option>
                <option value="created_at:asc" className="bg-white text-[#172033]">{language === 'hi' ? 'पुरातन पहले' : 'Oldest First (Submission Date)'}</option>
                <option value="due_date:asc" className="bg-white text-[#172033]">{language === 'hi' ? 'लक्ष्य एसएलए (शीघ्र नियत)' : 'Target SLA (Earliest Due)'}</option>
                <option value="due_date:desc" className="bg-white text-[#172033]">{language === 'hi' ? 'लक्ष्य एसएलए (विलंब नियत)' : 'Target SLA (Latest Due)'}</option>
                <option value="case_id:asc" className="bg-white text-[#172033]">{language === 'hi' ? 'मामला आईडी (आरोही)' : 'Case ID (Ascending)'}</option>
                <option value="case_id:desc" className="bg-white text-[#172033]">{language === 'hi' ? 'मामला आईडी (अवरोही)' : 'Case ID (Descending)'}</option>
              </select>
            </div>

            {!isComplainant && (
              <label className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl text-xs text-[#172033] cursor-pointer hover:bg-[#EAF3FF] transition whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isOverdue}
                  onChange={(e) => {
                    setIsOverdue(e.target.checked);
                    setPage(0);
                  }}
                  className="w-4 h-4 rounded text-[#0645A8] focus:ring-[#0645A8] bg-white border-[#DCE3EC]"
                />
                <span className="font-semibold text-[#DC3545] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'केवल विलंबित एसएलए' : 'Overdue SLAs Only'}
                </span>
              </label>
            )}

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#EAF3FF] text-[#687386] hover:text-[#0645A8] border border-[#DCE3EC] font-semibold text-xs rounded-xl transition whitespace-nowrap"
                title="Reset all active search, filters, and sort options"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#687386]" />
                <span>{t('action_reset', 'Reset')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#EAF0F6] text-xs">
          {!isComplainant && (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#687386] mb-1">{t('table_bureau', 'Bureau')}</label>
              {isReviewer ? (
                <div className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs font-semibold text-[#172033] truncate" title={currentRole?.bureau}>
                  {currentRole?.bureau || 'Assigned Bureau'}
                </div>
              ) : (
                <select
                  value={bureau}
                  onChange={(e) => {
                    setBureau(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#0645A8]"
                >
                  {BUREAUS.map((b) => (
                    <option key={b} value={b} className="bg-white text-[#172033]">{b}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#687386] mb-1">{t('table_status', 'Status')}</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#0645A8]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-white text-[#172033]">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#687386] mb-1">{t('table_priority', 'Priority')}</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#0645A8]"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p} className="bg-white text-[#172033]">{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#687386] mb-1">{t('table_category', 'Category')}</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#0645A8]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-white text-[#172033]">{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Listing Container */}
      <div className="bg-white border border-[#DCE3EC] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner text={language === 'hi' ? 'शिकायत रिकॉर्ड पुनर्प्राप्त किए जा रहे हैं...' : 'Retrieving complaints records...'} />
        ) : error ? (
          <div className="p-8 text-center text-[#DC3545] font-semibold">{error}</div>
        ) : complaints.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <EmptyState
              title={isComplainant ? (language === 'hi' ? 'इस खाते के तहत कोई शिकायत दर्ज नहीं है' : 'No grievances registered under this account') : (language === 'hi' ? 'वर्तमान फ़िल्टर से कोई शिकायत मेल नहीं खाती' : 'No complaints match current filters')}
              description={
                isComplainant 
                  ? (language === 'hi' ? "आपने अभी तक कोई शिकायत दर्ज नहीं की है। नई शिकायत दर्ज करने के लिए 'नई शिकायत दर्ज करें' पर क्लिक करें।" : "You have not filed any grievances yet. Click 'Submit New Grievance' to lodge an official complaint.")
                  : (language === 'hi' ? "अपनी खोज शर्तें, ब्यूरो अधिकार क्षेत्र या स्थिति फ़िल्टर समायोजित करें।" : "Adjust your search terms, bureau jurisdiction, or status filters.")
              }
            />
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0645A8] hover:bg-[#1769D2] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सभी फ़िल्टर रीसेट करें' : 'Reset All Filters'}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#687386] uppercase text-[10px] tracking-wider border-b border-[#DCE3EC]">
                  <tr>
                    {renderSortHeader('case_id', t('table_case_id', 'Case ID'))}
                    <th className="py-3 px-3.5">{t('table_institution', 'Institution')} & AICTE ID</th>
                    <th className="py-3 px-3.5">{t('table_bureau', 'Assigned Bureau')}</th>
                    <th className="py-3 px-3.5">{t('table_category', 'Category')} & {t('table_subject', 'Subject')}</th>
                    <th className="py-3 px-3.5">{t('table_priority', 'Priority')}</th>
                    <th className="py-3 px-3.5">{t('table_status', 'Current Status')}</th>
                    {renderSortHeader('created_at', t('table_date', 'Submitted Date & Time'))}
                    {renderSortHeader('due_date', 'Target SLA')}
                    <th className="py-3 px-3.5 text-right">{t('table_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF0F6] text-[#172033]">
                  {complaints.map((c) => (
                    <tr 
                      key={c.id} 
                      className="hover:bg-[#F8FAFC] transition group cursor-pointer"
                      onClick={() => onViewCase(c.id)}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0645A8] whitespace-nowrap">
                        <div className="hover:underline">{c.case_id}</div>
                        {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-[#0645A8] bg-[#EAF3FF] px-1.5 py-0.5 rounded border border-[#BBD5F8] mt-0.5 inline-flex">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>{language === 'hi' ? 'दस्तावेज़ संलग्न' : 'Proof Attached'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <InstitutionLogo name={c.institution_name} aicteId={c.institution_aicte_id} size="xs" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-[#172033] truncate group-hover:text-[#0645A8] transition" title={c.institution_name}>
                              {c.institution_name}
                            </div>
                            <div className="text-[10px] text-[#687386] font-mono mt-0.5">
                              ID: {c.institution_aicte_id} • {c.institution_state}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <BureauBadge bureau={c.source_bureau} />
                      </td>
                      <td className="py-3 px-3.5 max-w-[240px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-[#687386] uppercase tracking-wider block truncate">
                            {c.category}
                          </span>
                          {getAphClause(c.category) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8]">
                              {getAphClause(c.category)}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[#172033] block truncate mt-0.5" title={c.subject}>
                          {c.subject}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge status={c.status} isComplainant={isComplainant} />
                          {c.verification_status && c.verification_status !== 'Verified' && (
                            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block ${
                              c.verification_status === 'Needs More Information'
                                ? 'bg-[#F59E0B]/15 text-[#B45309] border border-[#F59E0B]/35 animate-pulse'
                                : 'bg-[#F8FAFC] text-[#687386] border border-[#DCE3EC]'
                            }`}>
                              {c.verification_status}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-[#172033]">
                        <div className="font-semibold text-xs">{formatDate(c.received_date)}</div>
                        {c.created_at && (
                          <div className="text-[10px] text-[#687386] font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-[#687386]" />
                            <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {c.is_overdue ? (
                          <div className="text-[#DC3545] font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{c.days_overdue}d Overdue</span>
                          </div>
                        ) : (
                          <div className="text-[#687386] text-[11px]">
                            {formatDate(c.due_date)}
                            {c.days_remaining <= 5 && c.status !== 'Disposed' && (
                              <span className="ml-1 text-[10px] text-[#F59E0B] font-bold">({c.days_remaining}d left)</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Complainant: Respond to query button */}
                          {isComplainant && c.verification_status === 'Needs More Information' && (
                            <button
                              onClick={() => {
                                setSelectedCaseForResponse(c);
                                setComplainantResponseText('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#B45309] border border-[#F59E0B]/40 text-[11px] font-bold shadow-xs flex items-center gap-1"
                              title="Reviewer has requested additional details"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{language === 'hi' ? 'उत्तर दें' : 'Respond'}</span>
                            </button>
                          )}

                          {/* Print / View Acknowledgement Slip */}
                          <button
                            onClick={() => setSelectedReceiptComplaint(c)}
                            className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF3FF] text-[#687386] hover:text-[#0645A8] border border-[#DCE3EC] text-[11px] font-medium transition flex items-center gap-1"
                            title="View Official AICTE Acknowledgement Slip"
                          >
                            <Printer className="w-3 h-3" />
                            <span className="hidden md:inline">{language === 'hi' ? 'पावती' : 'Slip'}</span>
                          </button>

                          {/* Reviewer / Admin Quick Status */}
                          {!currentRole?.readOnly && !isComplainant && c.status !== 'Disposed' && (
                            <button
                              onClick={() => {
                                setSelectedCaseForStatus(c);
                                setNewStatus(c.status);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF3FF] text-[#687386] hover:text-[#0645A8] border border-[#DCE3EC] text-[11px] font-medium transition"
                              title="Quick Status Change"
                            >
                              {language === 'hi' ? 'अद्यतन' : 'Update'}
                            </button>
                          )}

                          {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                            <button
                              onClick={() => onViewCase(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#EAF3FF] hover:bg-[#D4E7FF] text-[#0645A8] border border-[#BBD5F8] text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                              title="Open complaint evidence & proof documents"
                            >
                              <FileText className="w-3 h-3 text-[#0645A8]" />
                              <span>{language === 'hi' ? 'सबूत' : 'Proof'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => onViewCase(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EAF3FF] text-[#0645A8] border border-[#DCE3EC] hover:border-[#0645A8]/50 text-[11px] font-bold transition"
                          >
                            {t('action_view_details', 'View Details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View (< lg) */}
            <div className="block lg:hidden divide-y divide-[#EAF0F6]">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="p-4 hover:bg-[#F8FAFC] transition cursor-pointer space-y-3"
                >
                  {/* Top row: Case ID, Proof tag, and Status/Priority badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#0645A8] flex items-center gap-1.5">
                        <span>{c.case_id}</span>
                        {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-[#0645A8] bg-[#EAF3FF] px-1.5 py-0.5 rounded border border-[#BBD5F8]">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>{language === 'hi' ? 'सबूत' : 'Proof'}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#687386] font-mono mt-0.5">
                        ID: {c.institution_aicte_id} • {c.institution_state}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={c.status} isComplainant={isComplainant} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                  </div>

                  {/* Subject & Category with APH Clause */}
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-semibold text-[#687386]">
                        {c.category}
                      </span>
                      {getAphClause(c.category) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8]">
                          {getAphClause(c.category)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[#172033] line-clamp-2 mt-0.5" title={c.subject}>
                      {c.subject}
                    </h4>
                  </div>

                  {/* Institution & Bureau */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 text-[#172033] font-medium truncate max-w-[240px]">
                      <Building className="w-3.5 h-3.5 text-[#687386] flex-shrink-0" />
                      <span className="truncate">{c.institution_name}</span>
                    </div>
                    <div>
                      <BureauBadge bureau={c.source_bureau} />
                    </div>
                  </div>

                  {/* Meta Grid: Submitted Date/Time & SLA */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#DCE3EC] text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-[#687386] uppercase block">{t('table_date', 'Submitted')}</span>
                      <div className="font-semibold text-[#172033] text-xs mt-0.5">
                        {formatDate(c.received_date)}
                      </div>
                      {c.created_at && (
                        <div className="text-[10px] text-[#687386] font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-[#687386]" />
                          <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-[#687386] uppercase block">Target SLA</span>
                      {c.is_overdue ? (
                        <div className="text-[#DC3545] font-bold flex items-center gap-1 text-xs mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{c.days_overdue}d Overdue</span>
                        </div>
                      ) : (
                        <div className="text-[#687386] text-xs mt-0.5 font-medium">
                          {formatDate(c.due_date)}
                          {c.days_remaining <= 5 && c.status !== 'Disposed' && (
                            <span className="ml-1 text-[10px] text-[#F59E0B] font-bold">({c.days_remaining}d left)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-1 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedReceiptComplaint(c)}
                        className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF3FF] text-[#687386] hover:text-[#0645A8] border border-[#DCE3EC] text-[11px] font-medium transition flex items-center gap-1"
                        title="View Official AICTE Acknowledgement Slip"
                      >
                        <Printer className="w-3 h-3" />
                        <span>{language === 'hi' ? 'पावती' : 'Slip'}</span>
                      </button>

                      {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                        <button
                          onClick={() => onViewCase(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#EAF3FF] hover:bg-[#D4E7FF] text-[#0645A8] border border-[#BBD5F8] text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <FileText className="w-3 h-3 text-[#0645A8]" />
                          <span>{language === 'hi' ? 'सबूत' : 'Proof'}</span>
                        </button>
                      )}

                      {isComplainant && c.verification_status === 'Needs More Information' && (
                        <button
                          onClick={() => {
                            setSelectedCaseForResponse(c);
                            setComplainantResponseText('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#B45309] border border-[#F59E0B]/40 text-[11px] font-bold shadow-xs flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{language === 'hi' ? 'उत्तर दें' : 'Respond'}</span>
                        </button>
                      )}

                      {!currentRole?.readOnly && !isComplainant && c.status !== 'Disposed' && (
                        <button
                          onClick={() => {
                            setSelectedCaseForStatus(c);
                            setNewStatus(c.status);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF3FF] text-[#687386] hover:text-[#0645A8] border border-[#DCE3EC] text-[11px] font-medium transition"
                        >
                          {language === 'hi' ? 'अद्यतन' : 'Update'}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onViewCase(c.id)}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-[#EAF3FF] text-[#0645A8] border border-[#DCE3EC] hover:border-[#0645A8]/50 text-xs font-bold transition"
                    >
                      {t('action_view_details', 'View Details')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#DCE3EC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#687386]">
          <div>
            {language === 'hi' ? 'दिखा रहे हैं ' : 'Showing '}
            <span className="font-bold text-[#172033]">{complaints.length > 0 ? page * limit + 1 : 0}</span> {language === 'hi' ? 'से' : 'to'}{' '}
            <span className="font-bold text-[#172033]">{Math.min((page + 1) * limit, total)}</span> {language === 'hi' ? 'कुल' : 'of'}{' '}
            <span className="font-bold text-[#172033]">{total}</span> {language === 'hi' ? 'शिकायतें' : 'complaints'}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>{language === 'hi' ? 'प्रति पृष्ठ पंक्तियाँ:' : 'Rows per page:'}</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(0);
                }}
                className="bg-white border border-[#DCE3EC] text-[#172033] rounded-lg px-2 py-1 focus:outline-none focus:border-[#0645A8]"
              >
                <option value={10} className="bg-white text-[#172033]">10</option>
                <option value={25} className="bg-white text-[#172033]">25</option>
                <option value={50} className="bg-white text-[#172033]">50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-white border border-[#DCE3EC] text-[#687386] hover:text-[#172033] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8FAFC] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-[#172033] font-semibold">
                {language === 'hi' ? `पृष्ठ ${page + 1} / ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-white border border-[#DCE3EC] text-[#687386] hover:text-[#172033] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8FAFC] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Register New Complaint / Grievance (Strictly restricted to Complainants) */}
      {isComplainant && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={t('form_title', 'Lodge Official Institutional Grievance')}
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-[#172033] font-semibold mb-1">{t('form_target_institution', 'Target Institution *')}</label>
            <select
              value={createForm.institution_id}
              onChange={(e) => setCreateForm({ ...createForm, institution_id: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
              required
            >
              {institutionsList.map((inst) => (
                <option key={inst.id} value={inst.id} className="bg-white text-[#172033]">
                  {inst.name} ({inst.aicte_id}) - {inst.state}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#172033] font-semibold mb-1">{t('form_affiliation', 'Complainant Affiliation *')}</label>
              <select
                value={createForm.complainant_affiliation}
                onChange={(e) => setCreateForm({ ...createForm, complainant_affiliation: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
              >
                {AFFILIATION_OPTIONS.map((aff) => (
                  <option key={aff} value={aff} className="bg-white text-[#172033]">{aff}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#172033] font-semibold mb-1">{t('form_complainant_id_number', 'Institutional USN / Roll No / ID')}</label>
              <input
                type="text"
                placeholder="e.g. 1DS22CS089"
                value={createForm.complainant_id_number}
                onChange={(e) => setCreateForm({ ...createForm, complainant_id_number: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
              />
            </div>
          </div>

          {/* Anonymous toggle option */}
          <div className="p-3 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.is_anonymous}
                onChange={(e) => setCreateForm({ ...createForm, is_anonymous: e.target.checked })}
                className="w-4 h-4 text-[#0645A8] rounded focus:ring-[#0645A8] bg-white border-[#DCE3EC]"
              />
              <span className="font-semibold text-[#172033]">
                {t('form_anonymous_label', 'Submit as Protected Anonymous Grievance')}
              </span>
            </label>
            <p className="text-[11px] text-[#687386] ml-6">
              {t('form_anonymous_sublabel', 'When checked, your personal name is protected from institutional authorities. AICTE maintains internal cryptographic hash for audit compliance.')}
            </p>
          </div>

          {!createForm.is_anonymous && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#172033] font-semibold mb-1">{t('form_complainant_name', 'Complainant Name *')}</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={createForm.complainant_name}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
                  required={!createForm.is_anonymous}
                />
              </div>
              <div>
                <label className="block text-[#172033] font-semibold mb-1">{t('form_email', 'Email Address')}</label>
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={createForm.complainant_email}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_email: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[#172033] font-semibold mb-1">{t('form_phone', 'Phone Number')}</label>
                <input
                  type="text"
                  placeholder="+91-XXXXXXXXXX"
                  value={createForm.complainant_phone}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_phone: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#172033] font-semibold mb-1">{t('form_category', 'Grievance Category *')}</label>
            <select
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
            >
              {CATEGORIES.filter(c => c !== 'All').map((c) => (
                <option key={c} value={c} className="bg-white text-[#172033]">{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1">{t('form_subject', 'Case Subject / Summary *')}</label>
            <input
              type="text"
              placeholder={t('form_subject_placeholder', 'e.g. Unapproved examination fee demand under threat of hall ticket withholding')}
              value={createForm.subject}
              onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#172033] font-semibold">{t('form_description', 'Detailed Description *')}</label>
              <span className={`text-[11px] font-mono font-bold ${
                createForm.description.trim().length >= 15 ? 'text-[#16A765]' : 'text-[#F59E0B]'
              }`}>
                {createForm.description.trim().length} {t('form_min_chars', 'characters (min 15)')}
              </span>
            </div>
            <textarea
              rows={4}
              placeholder={t('form_description_placeholder', 'Provide a meaningful description of your grievance including what happened, dates, monetary demands, or specific facts...')}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:ring-2 focus:ring-[#0645A8]/20 focus:border-[#0645A8] shadow-xs text-xs"
              required
            />
          </div>

          {/* Explainable AI / Rules-Based Priority Card */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#172033] font-bold text-xs">
                <Sparkles className="w-4 h-4 text-[#0645A8]" />
                <span>{language === 'hi' ? 'स्पष्टीकरणात्मक प्राथमिकता एवं स्वतः-मार्ग निर्धारण' : 'Explainable Priority & Auto-Routing Assessment'}</span>
              </div>
              <span className="text-[10px] text-[#0645A8] font-semibold bg-[#EAF3FF] border border-[#BBD5F8] px-2 py-0.5 rounded">
                AICTE Rule-Engine Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-[#DCE3EC] shadow-2xs">
                <span className="text-[10px] font-semibold text-[#687386] uppercase block">
                  {language === 'hi' ? 'परिकलित प्राथमिकता एसएलए' : 'Calculated Priority SLA'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <PriorityBadge priority={priorityAssessment.suggested_priority} />
                  <span className="font-bold text-[#172033]">
                    {priorityAssessment.statutory_sla_days} {language === 'hi' ? 'दिन निवारण लक्ष्य' : 'Days Resolution Target'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-[#DCE3EC] shadow-2xs">
                <span className="text-[10px] font-semibold text-[#687386] uppercase block">
                  {language === 'hi' ? 'अधिकार क्षेत्र ब्यूरो' : 'Jurisdictional Bureau'}
                </span>
                <div className="mt-1">
                  <BureauBadge bureau={priorityAssessment.suggested_bureau} />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#687386] bg-white p-2 rounded-lg border border-[#DCE3EC]">
              <span className="font-bold text-[#172033]">{language === 'hi' ? 'निर्धारण तर्क: ' : 'Determination Rationale: '}</span>
              {priorityAssessment.reason}
            </div>

            <p className="text-[10px] text-[#687386] italic">
              {language === 'hi' ? '* नोट: शिकायतकर्ता मैन्युअल रूप से प्राथमिकता स्तर सेट नहीं कर सकते। समीक्षा अधिकारी साक्ष्य निरीक्षण के बाद इसे समायोजित करते हैं।' : '* Note: Complainants cannot manually set priority levels. Reviewing officials verify or adjust priority upon evidence inspection.'}
            </p>
          </div>

          {/* Real Evidence Upload Section */}
          <div className="border border-[#DCE3EC] rounded-xl p-3 bg-[#F8FAFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[#172033] font-semibold flex items-center gap-1.5 text-xs">
                <UploadCloud className="w-4 h-4 text-[#0645A8]" />
                <span>{t('form_evidence_label', 'Supporting Documentary Evidence (Upload PDF only, max 10MB)')}</span>
              </label>
              <label className="cursor-pointer px-3 py-1 bg-[#0645A8] hover:bg-[#1769D2] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs">
                <span>{uploadingEvidence ? (language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...') : t('form_attach_pdf', '+ Attach PDF')}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingEvidence}
                  className="hidden"
                  accept=".pdf"
                />
              </label>
            </div>

            {evidenceList.length > 0 ? (
              <div className="space-y-1.5">
                {evidenceList.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#DCE3EC] text-xs shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#0645A8] flex-shrink-0" />
                      <span className="font-semibold text-[#172033] truncate">{file.name}</span>
                      <span className="text-[10px] text-[#687386] font-mono flex-shrink-0">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(idx)}
                      className="text-[#DC3545] hover:text-red-700 text-xs font-bold px-2 py-0.5 rounded hover:bg-[#DC3545]/10 ml-2 transition"
                    >
                      {language === 'hi' ? 'हटाएं' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-dashed border-[#DCE3EC] text-center text-xs text-[#687386]">
                {t('form_no_docs', "No documents attached yet. Click '+ Attach PDF' to upload receipts, fee notices, or affidavits.")}
              </div>
            )}

            <p className="text-[10px] text-[#687386]">
              {t('form_secure_storage_note', 'Files are securely stored in server-isolated repository and served exclusively to authorized officials and case owner.')}
            </p>
          </div>

          <div className="pt-3 border-t border-[#DCE3EC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#DCE3EC] text-[#687386] hover:text-[#172033] font-medium transition"
            >
              {t('action_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-5 py-2 rounded-xl bg-[#0645A8] hover:bg-[#1769D2] text-white font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{createSubmitting ? t('form_submitting', 'Registering...') : t('form_submit_btn', 'Submit Grievance & Generate Slip')}</span>
            </button>
          </div>
        </form>
      </Modal>
      )}

      {/* Modal: Complainant Clarification Response */}
      <Modal
        isOpen={Boolean(selectedCaseForResponse)}
        onClose={() => setSelectedCaseForResponse(null)}
        title={`${language === 'hi' ? 'संवीक्षा प्रश्न का उत्तर दें:' : 'Respond to Scrutiny Query:'} Case ${selectedCaseForResponse?.case_id}`}
      >
        <form onSubmit={handleComplainantResponseSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl space-y-1">
            <span className="text-xs font-bold text-[#B45309] block flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
              {language === 'hi' ? 'समीक्षा अधिकारी प्रश्न नोट:' : 'Reviewing Officer Inquiry Note:'}
            </span>
            <p className="text-[#172033] text-xs italic">
              "{selectedCaseForResponse?.info_request_notes || 'Please furnish supporting payment receipts or attendance log to substantiate your grievance.'}"
            </p>
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1">
              {language === 'hi' ? 'आपका उत्तर एवं स्पष्टीकरण *' : 'Your Response & Clarification *'}
            </label>
            <textarea
              rows={4}
              placeholder={language === 'hi' ? 'अधिकारी के प्रश्न का उत्तर देते हुए स्पष्ट तथ्य, रसीद विवरण या स्पष्टीकरण प्रदान करें...' : 'Provide exact facts, transaction IDs, or explanations addressing the officer inquiry...'}
              value={complainantResponseText}
              onChange={(e) => setComplainantResponseText(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] focus:ring-2 focus:ring-[#0645A8]/20 shadow-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#DCE3EC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCaseForResponse(null)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#DCE3EC] text-[#687386] hover:text-[#172033] font-medium transition"
            >
              {t('action_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={responseSubmitting}
              className="px-5 py-2 rounded-xl bg-[#16A765] hover:bg-[#138d55] text-white font-bold shadow-xs transition disabled:opacity-50"
            >
              {responseSubmitting ? (language === 'hi' ? 'जमा हो रहा है...' : 'Submitting...') : (language === 'hi' ? 'आधिकारिक स्पष्टीकरण जमा करें' : 'Submit Official Clarification')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Status Change (Officials only) */}
      <Modal
        isOpen={Boolean(selectedCaseForStatus)}
        onClose={() => setSelectedCaseForStatus(null)}
        title={`${language === 'hi' ? 'स्थिति अद्यतन करें:' : 'Update Status:'} ${selectedCaseForStatus?.case_id}`}
      >
        <form onSubmit={handleQuickStatusSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC]">
            <div className="text-[#687386] font-medium">{t('table_institution', 'Institution')}:</div>
            <div className="text-[#172033] font-semibold">{selectedCaseForStatus?.institution_name}</div>
            <div className="text-[#687386] font-medium mt-1">{language === 'hi' ? 'वर्तमान स्थिति:' : 'Current Status:'}</div>
            <div className="mt-0.5"><StatusBadge status={selectedCaseForStatus?.status} /></div>
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1">{language === 'hi' ? 'नई कार्यप्रवाह स्थिति *' : 'New Workflow Status *'}</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] focus:outline-none focus:border-[#0645A8] focus:ring-2 focus:ring-[#0645A8]/20 shadow-xs"
            >
              {STATUS_OPTIONS.filter(s => s !== 'All' && s !== selectedCaseForStatus?.status).map((s) => (
                <option key={s} value={s} className="bg-white text-[#172033]">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1">
              {language === 'hi' ? 'आधिकारिक औचित्य / जांच टिप्पणी * (ऑडिट ट्रेल में दर्ज)' : 'Official Justification / Investigation Remarks * (Logged to Audit Trail)'}
            </label>
            <textarea
              rows={3}
              placeholder={language === 'hi' ? 'उदा. प्रारंभिक साक्ष्य संवीक्षा पूर्ण। प्राचार्य को नोटिस जारी किया गया।' : 'e.g. Completed initial evidence scrutiny. Notice issued to principal.'}
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-xl text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] focus:ring-2 focus:ring-[#0645A8]/20 shadow-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#DCE3EC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCaseForStatus(null)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#DCE3EC] text-[#687386] hover:text-[#172033] font-medium transition"
            >
              {t('action_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={statusSubmitting}
              className="px-5 py-2 rounded-xl bg-[#0645A8] hover:bg-[#1769D2] text-white font-bold shadow-xs transition disabled:opacity-50"
            >
              {statusSubmitting ? (language === 'hi' ? 'दर्ज हो रहा है...' : 'Recording...') : (language === 'hi' ? 'स्थिति परिवर्तन दर्ज करें' : 'Record Status Change')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Official Acknowledgement Receipt */}
      <AcknowledgementModal
        isOpen={Boolean(selectedReceiptComplaint)}
        onClose={() => setSelectedReceiptComplaint(null)}
        complaint={selectedReceiptComplaint}
      />

      {/* Modal: Case Barcode & QR Code Scanner */}
      <CaseScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectCase={(id) => onViewCase(id)}
      />
    </div>
  );
}
