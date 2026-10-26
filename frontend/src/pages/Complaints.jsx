import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  X
} from 'lucide-react';

export function Complaints({ onViewCase, onViewInstitution, initialFilter = {} }) {
  const { currentRole, refreshNotifications } = useAuth();
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
    if (createForm.description.trim().length < 150) {
      setCreateError(`Complaint description must be at least 150 characters for comprehensive investigation (currently ${createForm.description.trim().length} characters).`);
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
        } ${isFieldActive ? 'text-[#D8B4FE] font-bold bg-[#9312FF]/15' : 'text-[#8B8988] hover:text-[#F7F7F8]'}`}
        onClick={() => handleSort(field)}
        title={`Sort by ${label} (${isFieldActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'click to toggle'})`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          {isFieldActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-[#A020FF]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-[#A020FF]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-[#8B8988] group-hover:text-[#F7F7F8]" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#F7F7F8] tracking-tight flex items-center gap-2">
            {initialFilter.filter_label || (isComplainant ? 'My Grievances & Status Tracker' : 'AICTE Grievance Registry & Monitoring')}
            {isComplainant && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#45B558]/15 text-[#45B558] border border-[#45B558]/30">
                Verified Complainant Access
              </span>
            )}
          </h1>
          <p className="text-xs text-[#8B8988] mt-1">
            {isComplainant
              ? 'Track the real-time processing of your submitted grievances. Receive official information queries, track SLAs, and print official acknowledgement receipts.'
              : 'Centralized registry to triage, scrutinize, investigate, and resolve institutional complaints across AICTE bureaus.'}
          </p>
        </div>

        {/* Grievance Submission: Strictly reserved for Complainants; Admin manages oversight */}
        {isComplainant && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_20px_rgba(147,18,255,0.5)] text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(147,18,255,0.35)] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Grievance</span>
          </button>
        )}
      </div>

      {/* Complainant Privacy Assurance Banner */}
      {isComplainant && (
        <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-[#45B558]/20 text-[#45B558] border border-[#45B558]/30 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#8B8988] space-y-1">
            <p className="font-bold text-sm text-[#F7F7F8]">Statutory Complainant Protection & Confidentiality Guarantee</p>
            <p>
              Your record is strictly isolated under AICTE Regulations 2019. Only your authenticated submissions are accessible to you. Internal officer deliberations and confidential evidence are protected from unauthorized disclosure.
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#0D0D14] border border-[#232234] p-4 rounded-2xl shadow-md space-y-3.5">
        {/* Quick Status Filter Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B8988]">
              Quick Status Filter
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-[#D8B4FE] hover:text-white flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
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
                      ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_12px_rgba(147,18,255,0.4)]'
                      : 'bg-[#13131E] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234]'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort Controls Row */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-1 border-t border-[#1F1E2E]">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8988]" />
            <input
              type="text"
              placeholder={
                isComplainant 
                  ? "Search your cases by Case ID (AICTE-2026-...) or Subject..." 
                  : "Search by Case ID, Institution Name, AICTE ID, or Subject..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-9 py-2 bg-[#13131E] border border-[#232234] rounded-xl text-xs text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF] transition shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8988] hover:text-[#F7F7F8] p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#13131E] border border-[#232234] rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-[#8B8988] font-medium">Sort:</span>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(0);
                }}
                className="bg-transparent text-[#F7F7F8] font-bold focus:outline-none cursor-pointer"
              >
                <option value="created_at:desc" className="bg-[#13131E] text-[#F7F7F8]">Newest First (Submission Date)</option>
                <option value="created_at:asc" className="bg-[#13131E] text-[#F7F7F8]">Oldest First (Submission Date)</option>
                <option value="due_date:asc" className="bg-[#13131E] text-[#F7F7F8]">Target SLA (Earliest Due)</option>
                <option value="due_date:desc" className="bg-[#13131E] text-[#F7F7F8]">Target SLA (Latest Due)</option>
                <option value="case_id:asc" className="bg-[#13131E] text-[#F7F7F8]">Case ID (Ascending)</option>
                <option value="case_id:desc" className="bg-[#13131E] text-[#F7F7F8]">Case ID (Descending)</option>
              </select>
            </div>

            {!isComplainant && (
              <label className="flex items-center gap-2 px-3 py-1.5 bg-[#13131E] border border-[#232234] rounded-xl text-xs text-[#F7F7F8] cursor-pointer hover:bg-[#181826] transition whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isOverdue}
                  onChange={(e) => {
                    setIsOverdue(e.target.checked);
                    setPage(0);
                  }}
                  className="w-4 h-4 rounded text-[#9312FF] focus:ring-[#9312FF] bg-[#0D0D14] border-[#232234]"
                />
                <span className="font-semibold text-[#F03B2A] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue SLAs Only
                </span>
              </label>
            )}

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131E] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234] font-semibold text-xs rounded-xl transition whitespace-nowrap"
                title="Reset all active search, filters, and sort options"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8B8988]" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1F1E2E] text-xs">
          {!isComplainant && (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8B8988] mb-1">Bureau</label>
              {isReviewer ? (
                <div className="px-2.5 py-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-xs font-semibold text-[#F7F7F8] truncate" title={currentRole?.bureau}>
                  {currentRole?.bureau || 'Assigned Bureau'}
                </div>
              ) : (
                <select
                  value={bureau}
                  onChange={(e) => {
                    setBureau(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-xs text-[#F7F7F8] focus:outline-none focus:border-[#9312FF]"
                >
                  {BUREAUS.map((b) => (
                    <option key={b} value={b} className="bg-[#13131E] text-[#F7F7F8]">{b}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B8988] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-xs text-[#F7F7F8] focus:outline-none focus:border-[#9312FF]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[#13131E] text-[#F7F7F8]">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B8988] mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-xs text-[#F7F7F8] focus:outline-none focus:border-[#9312FF]"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p} className="bg-[#13131E] text-[#F7F7F8]">{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8B8988] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-xs text-[#F7F7F8] focus:outline-none focus:border-[#9312FF]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#13131E] text-[#F7F7F8]">{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Listing Container */}
      <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl overflow-hidden shadow-md">
        {loading ? (
          <LoadingSpinner text="Retrieving complaints records..." />
        ) : error ? (
          <div className="p-8 text-center text-[#F03B2A] font-semibold">{error}</div>
        ) : complaints.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <EmptyState
              title={isComplainant ? "No grievances registered under this account" : "No complaints match current filters"}
              description={
                isComplainant 
                  ? "You have not filed any grievances yet. Click 'Submit New Grievance' to lodge an official complaint."
                  : "Adjust your search terms, bureau jurisdiction, or status filters."
              }
            />
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(147,18,255,0.4)] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#13131E] text-[#8B8988] uppercase text-[10px] tracking-wider border-b border-[#232234]">
                  <tr>
                    {renderSortHeader('case_id', 'Case ID')}
                    <th className="py-3 px-3.5">Institution & AICTE ID</th>
                    <th className="py-3 px-3.5">Assigned Bureau</th>
                    <th className="py-3 px-3.5">Category & Subject</th>
                    <th className="py-3 px-3.5">Priority</th>
                    <th className="py-3 px-3.5">Current Status</th>
                    {renderSortHeader('created_at', 'Submitted Date & Time')}
                    {renderSortHeader('due_date', 'Target SLA')}
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1E2E] text-[#F7F7F8]">
                  {complaints.map((c) => (
                    <tr 
                      key={c.id} 
                      className="hover:bg-[#181826] transition group cursor-pointer"
                      onClick={() => onViewCase(c.id)}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-[#D8B4FE] whitespace-nowrap">
                        <div>{c.case_id}</div>
                        {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-[#D8B4FE] bg-[#9312FF]/15 px-1.5 py-0.5 rounded border border-[#9312FF]/30 mt-0.5 inline-flex">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>Proof Attached</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 max-w-[220px]">
                        <div className="font-semibold text-[#F7F7F8] truncate group-hover:text-[#D8B4FE] transition" title={c.institution_name}>
                          {c.institution_name}
                        </div>
                        <div className="text-[10px] text-[#8B8988] font-mono mt-0.5">
                          ID: {c.institution_aicte_id} • {c.institution_state}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <BureauBadge bureau={c.source_bureau} />
                      </td>
                      <td className="py-3 px-3.5 max-w-[240px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-[#8B8988] uppercase tracking-wider block truncate">
                            {c.category}
                          </span>
                          {getAphClause(c.category) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30">
                              {getAphClause(c.category)}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[#F7F7F8] block truncate mt-0.5" title={c.subject}>
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
                                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/35 animate-pulse'
                                : 'bg-[#13131E] text-[#8B8988] border border-[#232234]'
                            }`}>
                              {c.verification_status}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-[#F7F7F8]">
                        <div className="font-semibold text-xs">{formatDate(c.received_date)}</div>
                        {c.created_at && (
                          <div className="text-[10px] text-[#8B8988] font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-[#8B8988]" />
                            <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {c.is_overdue ? (
                          <div className="text-[#F03B2A] font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{c.days_overdue}d Overdue</span>
                          </div>
                        ) : (
                          <div className="text-[#8B8988] text-[11px]">
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
                              className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40 text-[11px] font-bold shadow-xs flex items-center gap-1"
                              title="Reviewer has requested additional details"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Respond</span>
                            </button>
                          )}

                          {/* Print / View Acknowledgement Slip */}
                          <button
                            onClick={() => setSelectedReceiptComplaint(c)}
                            className="px-2 py-1 rounded-lg bg-[#13131E] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234] text-[11px] font-medium transition flex items-center gap-1"
                            title="View Official AICTE Acknowledgement Slip"
                          >
                            <Printer className="w-3 h-3" />
                            <span className="hidden md:inline">Slip</span>
                          </button>

                          {/* Reviewer / Admin Quick Status */}
                          {!currentRole?.readOnly && !isComplainant && c.status !== 'Disposed' && (
                            <button
                              onClick={() => {
                                setSelectedCaseForStatus(c);
                                setNewStatus(c.status);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#13131E] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234] text-[11px] font-medium transition"
                              title="Quick Status Change"
                            >
                              Update
                            </button>
                          )}

                          {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                            <button
                              onClick={() => onViewCase(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#9312FF]/15 hover:bg-[#9312FF]/25 text-[#D8B4FE] border border-[#9312FF]/30 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                              title="Open complaint evidence & proof documents"
                            >
                              <FileText className="w-3 h-3 text-[#A020FF]" />
                              <span>Proof</span>
                            </button>
                          )}

                          <button
                            onClick={() => onViewCase(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#13131E] hover:bg-[#9312FF]/20 text-[#D8B4FE] border border-[#2A293E] hover:border-[#9312FF]/50 text-[11px] font-bold transition"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View (< lg) */}
            <div className="block lg:hidden divide-y divide-[#1F1E2E]">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="p-4 hover:bg-[#181826] transition cursor-pointer space-y-3"
                >
                  {/* Top row: Case ID, Proof tag, and Status/Priority badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#D8B4FE] flex items-center gap-1.5">
                        <span>{c.case_id}</span>
                        {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-[#D8B4FE] bg-[#9312FF]/15 px-1.5 py-0.5 rounded border border-[#9312FF]/30">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>Proof</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8B8988] font-mono mt-0.5">
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
                      <span className="text-[10px] uppercase font-semibold text-[#8B8988]">
                        {c.category}
                      </span>
                      {getAphClause(c.category) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30">
                          {getAphClause(c.category)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[#F7F7F8] line-clamp-2 mt-0.5" title={c.subject}>
                      {c.subject}
                    </h4>
                  </div>

                  {/* Institution & Bureau */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 text-[#F7F7F8] font-medium truncate max-w-[240px]">
                      <Building className="w-3.5 h-3.5 text-[#8B8988] flex-shrink-0" />
                      <span className="truncate">{c.institution_name}</span>
                    </div>
                    <div>
                      <BureauBadge bureau={c.source_bureau} />
                    </div>
                  </div>

                  {/* Meta Grid: Submitted Date/Time & SLA */}
                  <div className="grid grid-cols-2 gap-2 bg-[#13131E] p-2.5 rounded-xl border border-[#232234] text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Submitted</span>
                      <div className="font-semibold text-[#F7F7F8] text-xs mt-0.5">
                        {formatDate(c.received_date)}
                      </div>
                      {c.created_at && (
                        <div className="text-[10px] text-[#8B8988] font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-[#8B8988]" />
                          <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Target SLA</span>
                      {c.is_overdue ? (
                        <div className="text-[#F03B2A] font-bold flex items-center gap-1 text-xs mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{c.days_overdue}d Overdue</span>
                        </div>
                      ) : (
                        <div className="text-[#8B8988] text-xs mt-0.5 font-medium">
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
                        className="px-2.5 py-1 rounded-lg bg-[#13131E] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234] text-[11px] font-medium transition flex items-center gap-1"
                        title="View Official AICTE Acknowledgement Slip"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Slip</span>
                      </button>

                      {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                        <button
                          onClick={() => onViewCase(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#9312FF]/15 hover:bg-[#9312FF]/25 text-[#D8B4FE] border border-[#9312FF]/30 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <FileText className="w-3 h-3 text-[#A020FF]" />
                          <span>Proof</span>
                        </button>
                      )}

                      {isComplainant && c.verification_status === 'Needs More Information' && (
                        <button
                          onClick={() => {
                            setSelectedCaseForResponse(c);
                            setComplainantResponseText('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40 text-[11px] font-bold shadow-sm flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Respond</span>
                        </button>
                      )}

                      {!currentRole?.readOnly && !isComplainant && c.status !== 'Disposed' && (
                        <button
                          onClick={() => {
                            setSelectedCaseForStatus(c);
                            setNewStatus(c.status);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#13131E] hover:bg-[#181826] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234] text-[11px] font-medium transition"
                        >
                          Update
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onViewCase(c.id)}
                      className="px-3 py-1 rounded-lg bg-[#13131E] hover:bg-[#9312FF]/20 text-[#D8B4FE] border border-[#2A293E] hover:border-[#9312FF]/50 text-xs font-bold transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-[#13131E] border-t border-[#232234] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8B8988]">
          <div>
            Showing <span className="font-bold text-[#F7F7F8]">{complaints.length > 0 ? page * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-[#F7F7F8]">{Math.min((page + 1) * limit, total)}</span> of{' '}
            <span className="font-bold text-[#F7F7F8]">{total}</span> complaints
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(0);
                }}
                className="bg-[#0D0D14] border border-[#232234] text-[#F7F7F8] rounded-lg px-2 py-1 focus:outline-none focus:border-[#9312FF]"
              >
                <option value={10} className="bg-[#0D0D14] text-[#F7F7F8]">10</option>
                <option value={25} className="bg-[#0D0D14] text-[#F7F7F8]">25</option>
                <option value={50} className="bg-[#0D0D14] text-[#F7F7F8]">50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-[#0D0D14] border border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#181826] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-[#F7F7F8] font-semibold">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-[#0D0D14] border border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#181826] transition"
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
          title="Lodge Official Institutional Grievance"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-[#F03B2A]/15 border border-[#F03B2A]/30 text-[#F03B2A] text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-[#F7F7F8] font-semibold mb-1">Target Institution *</label>
            <select
              value={createForm.institution_id}
              onChange={(e) => setCreateForm({ ...createForm, institution_id: e.target.value })}
              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
              required
            >
              {institutionsList.map((inst) => (
                <option key={inst.id} value={inst.id} className="bg-[#13131E] text-[#F7F7F8]">
                  {inst.name} ({inst.aicte_id}) - {inst.state}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">Complainant Affiliation *</label>
              <select
                value={createForm.complainant_affiliation}
                onChange={(e) => setCreateForm({ ...createForm, complainant_affiliation: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
              >
                {AFFILIATION_OPTIONS.map((aff) => (
                  <option key={aff} value={aff} className="bg-[#13131E] text-[#F7F7F8]">{aff}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#F7F7F8] font-semibold mb-1">Institutional USN / Roll No / ID</label>
              <input
                type="text"
                placeholder="e.g. 1DS22CS089"
                value={createForm.complainant_id_number}
                onChange={(e) => setCreateForm({ ...createForm, complainant_id_number: e.target.value })}
                className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
              />
            </div>
          </div>

          {/* Anonymous toggle option */}
          <div className="p-3 bg-[#0D0D14] border border-[#232234] rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.is_anonymous}
                onChange={(e) => setCreateForm({ ...createForm, is_anonymous: e.target.checked })}
                className="w-4 h-4 text-[#9312FF] rounded focus:ring-[#9312FF] bg-[#13131E] border-[#232234]"
              />
              <span className="font-semibold text-[#F7F7F8]">
                Submit as Protected Anonymous Grievance
              </span>
            </label>
            <p className="text-[11px] text-[#8B8988] ml-6">
              When checked, your personal name is protected from institutional authorities. AICTE maintains internal cryptographic hash for audit compliance.
            </p>
          </div>

          {!createForm.is_anonymous && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#F7F7F8] font-semibold mb-1">Complainant Name *</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={createForm.complainant_name}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_name: e.target.value })}
                  className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
                  required={!createForm.is_anonymous}
                />
              </div>
              <div>
                <label className="block text-[#F7F7F8] font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={createForm.complainant_email}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_email: e.target.value })}
                  className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[#F7F7F8] font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91-XXXXXXXXXX"
                  value={createForm.complainant_phone}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_phone: e.target.value })}
                  className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#F7F7F8] font-semibold mb-1">Grievance Category *</label>
            <select
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
            >
              {CATEGORIES.filter(c => c !== 'All').map((c) => (
                <option key={c} value={c} className="bg-[#13131E] text-[#F7F7F8]">{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#F7F7F8] font-semibold mb-1">Case Subject / Summary *</label>
            <input
              type="text"
              placeholder="e.g. Unapproved examination fee demand under threat of hall ticket withholding"
              value={createForm.subject}
              onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#F7F7F8] font-semibold">Detailed Description *</label>
              <span className={`text-[11px] font-mono font-bold ${
                createForm.description.trim().length >= 150 ? 'text-[#45B558]' : 'text-[#F59E0B]'
              }`}>
                {createForm.description.trim().length} / 150 characters minimum
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Provide narrative facts, dates, monetary demands, faculty/officer names, or specific regulations violated (minimum 150 characters)..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:ring-2 focus:ring-[#9312FF]/30 focus:border-[#9312FF] shadow-xs text-xs"
              required
            />
          </div>

          {/* Explainable AI / Rules-Based Priority Card (Manual selection removed to prevent gaming SLAs) */}
          <div className="p-3.5 bg-[#0D0D14] border border-[#232234] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#F7F7F8] font-bold text-xs">
                <Sparkles className="w-4 h-4 text-[#A020FF]" />
                <span>Explainable Priority & Auto-Routing Assessment</span>
              </div>
              <span className="text-[10px] text-[#D8B4FE] font-semibold bg-[#9312FF]/15 border border-[#9312FF]/30 px-2 py-0.5 rounded">
                AICTE Rule-Engine Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-[#13131E] p-2.5 rounded-lg border border-[#232234] shadow-2xs">
                <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Calculated Priority SLA</span>
                <div className="flex items-center gap-2 mt-1">
                  <PriorityBadge priority={priorityAssessment.suggested_priority} />
                  <span className="font-bold text-[#F7F7F8]">
                    {priorityAssessment.statutory_sla_days} Days Resolution Target
                  </span>
                </div>
              </div>

              <div className="bg-[#13131E] p-2.5 rounded-lg border border-[#232234] shadow-2xs">
                <span className="text-[10px] font-semibold text-[#8B8988] uppercase block">Jurisdictional Bureau</span>
                <div className="mt-1">
                  <BureauBadge bureau={priorityAssessment.suggested_bureau} />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#8B8988] bg-[#13131E] p-2 rounded-lg border border-[#232234]">
              <span className="font-bold text-[#F7F7F8]">Determination Rationale: </span>
              {priorityAssessment.reason}
            </div>

            <p className="text-[10px] text-[#8B8988] italic">
              * Note: Complainants cannot manually set priority levels. Reviewing officials verify or adjust priority upon evidence inspection.
            </p>
          </div>

          {/* Real Evidence Upload Section */}
          <div className="border border-[#232234] rounded-xl p-3 bg-[#0D0D14] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[#F7F7F8] font-semibold flex items-center gap-1.5 text-xs">
                <UploadCloud className="w-4 h-4 text-[#A020FF]" />
                <span>Supporting Documentary Evidence (PDF, DOC, DOCX max 10MB)</span>
              </label>
              <label className="cursor-pointer px-3 py-1 bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_15px_rgba(147,18,255,0.4)] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs">
                <span>{uploadingEvidence ? 'Uploading...' : '+ Attach Document'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingEvidence}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
              </label>
            </div>

            {evidenceList.length > 0 ? (
              <div className="space-y-1.5">
                {evidenceList.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-[#13131E] rounded-lg border border-[#232234] text-xs shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#A020FF] flex-shrink-0" />
                      <span className="font-semibold text-[#F7F7F8] truncate">{file.name}</span>
                      <span className="text-[10px] text-[#8B8988] font-mono flex-shrink-0">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(idx)}
                      className="text-[#F03B2A] hover:text-red-400 text-xs font-bold px-2 py-0.5 rounded hover:bg-[#F03B2A]/10 ml-2 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-[#13131E] rounded-lg border border-dashed border-[#2A293E] text-center text-xs text-[#8B8988]">
                No documents attached yet. Click "+ Attach Document" to upload receipts, fee notices, or affidavits.
              </div>
            )}

            <p className="text-[10px] text-[#8B8988]">
              Files are securely stored in server-isolated repository and served exclusively to authorized officials and case owner.
            </p>
          </div>

          <div className="pt-3 border-t border-[#232234] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#13131E] hover:bg-[#181826] border border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_20px_rgba(147,18,255,0.5)] text-white font-bold shadow-[0_0_15px_rgba(147,18,255,0.35)] transition disabled:opacity-50 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{createSubmitting ? 'Registering...' : 'Submit Grievance & Generate Slip'}</span>
            </button>
          </div>
        </form>
      </Modal>
      )}

      {/* Modal: Complainant Clarification Response */}
      <Modal
        isOpen={Boolean(selectedCaseForResponse)}
        onClose={() => setSelectedCaseForResponse(null)}
        title={`Respond to Scrutiny Query: Case ${selectedCaseForResponse?.case_id}`}
      >
        <form onSubmit={handleComplainantResponseSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl space-y-1">
            <span className="text-xs font-bold text-[#F59E0B] block flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
              Reviewing Officer Inquiry Note:
            </span>
            <p className="text-[#F7F7F8] text-xs italic">
              "{selectedCaseForResponse?.info_request_notes || 'Please furnish supporting payment receipts or attendance log to substantiate your grievance.'}"
            </p>
          </div>

          <div>
            <label className="block text-[#F7F7F8] font-semibold mb-1">
              Your Response & Clarification *
            </label>
            <textarea
              rows={4}
              placeholder="Provide exact facts, transaction IDs, or explanations addressing the officer inquiry..."
              value={complainantResponseText}
              onChange={(e) => setComplainantResponseText(e.target.value)}
              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:border-[#9312FF] focus:ring-2 focus:ring-[#9312FF]/30 shadow-sm"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#232234] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCaseForResponse(null)}
              className="px-4 py-2 rounded-xl bg-[#13131E] hover:bg-[#181826] border border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={responseSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#45B558] to-[#16A34A] text-white font-bold shadow-[0_0_15px_rgba(69,181,88,0.35)] transition disabled:opacity-50"
            >
              {responseSubmitting ? 'Submitting...' : 'Submit Official Clarification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Status Change (Officials only) */}
      <Modal
        isOpen={Boolean(selectedCaseForStatus)}
        onClose={() => setSelectedCaseForStatus(null)}
        title={`Update Status: ${selectedCaseForStatus?.case_id}`}
      >
        <form onSubmit={handleQuickStatusSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#0D0D14] border border-[#232234]">
            <div className="text-[#8B8988] font-medium">Institution:</div>
            <div className="text-[#F7F7F8] font-semibold">{selectedCaseForStatus?.institution_name}</div>
            <div className="text-[#8B8988] font-medium mt-1">Current Status:</div>
            <div className="mt-0.5"><StatusBadge status={selectedCaseForStatus?.status} /></div>
          </div>

          <div>
            <label className="block text-[#F7F7F8] font-semibold mb-1">New Workflow Status *</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] focus:outline-none focus:border-[#9312FF] focus:ring-2 focus:ring-[#9312FF]/30 shadow-xs"
            >
              {STATUS_OPTIONS.filter(s => s !== 'All' && s !== selectedCaseForStatus?.status).map((s) => (
                <option key={s} value={s} className="bg-[#13131E] text-[#F7F7F8]">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#F7F7F8] font-semibold mb-1">
              Official Justification / Investigation Remarks * (Logged to Audit Trail)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Completed initial evidence scrutiny. Notice issued to principal."
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
              className="w-full p-2.5 bg-[#13131E] border border-[#232234] rounded-xl text-[#F7F7F8] placeholder-[#8B8988] focus:outline-none focus:border-[#9312FF] focus:ring-2 focus:ring-[#9312FF]/30 shadow-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#232234] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCaseForStatus(null)}
              className="px-4 py-2 rounded-xl bg-[#13131E] hover:bg-[#181826] border border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={statusSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] hover:shadow-[0_0_20px_rgba(147,18,255,0.5)] text-white font-bold shadow-[0_0_15px_rgba(147,18,255,0.35)] transition disabled:opacity-50"
            >
              {statusSubmitting ? 'Recording...' : 'Record Status Change'}
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
    </div>
  );
}
