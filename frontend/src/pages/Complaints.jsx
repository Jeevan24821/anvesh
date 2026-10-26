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
        } ${isFieldActive ? 'text-[#0D9488] font-bold bg-teal-50/60' : 'text-slate-600 hover:text-slate-900'}`}
        onClick={() => handleSort(field)}
        title={`Sort by ${label} (${isFieldActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'click to toggle'})`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          {isFieldActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-[#0D9488]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-[#0D9488]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
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
          <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
            {initialFilter.filter_label || (isComplainant ? 'My Grievances & Status Tracker' : 'AICTE Grievance Registry & Monitoring')}
            {isComplainant && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Verified Complainant Access
              </span>
            )}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {isComplainant
              ? 'Track the real-time processing of your submitted grievances. Receive official information queries, track SLAs, and print official acknowledgement receipts.'
              : 'Centralized registry to triage, scrutinize, investigate, and resolve institutional complaints across AICTE bureaus.'}
          </p>
        </div>

        {/* Grievance Submission: Strictly reserved for Complainants; Admin manages oversight */}
        {isComplainant && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] hover:bg-[#0b7c72] text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Grievance</span>
          </button>
        )}
      </div>

      {/* Complainant Privacy Assurance Banner */}
      {isComplainant && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-emerald-900 space-y-1">
            <p className="font-bold text-sm text-emerald-950">Statutory Complainant Protection & Confidentiality Guarantee</p>
            <p className="text-emerald-800">
              Your record is strictly isolated under AICTE Regulations 2019. Only your authenticated submissions are accessible to you. Internal officer deliberations and confidential evidence are protected from unauthorized disclosure.
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-3.5">
        {/* Quick Status Filter Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Quick Status Filter
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-[#0D9488] hover:text-[#0b7c72] flex items-center gap-1 transition"
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
                      ? 'bg-[#0D9488] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort Controls Row */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
              className="w-full pl-10 pr-9 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(0);
                }}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="created_at:desc">Newest First (Submission Date)</option>
                <option value="created_at:asc">Oldest First (Submission Date)</option>
                <option value="due_date:asc">Target SLA (Earliest Due)</option>
                <option value="due_date:desc">Target SLA (Latest Due)</option>
                <option value="case_id:asc">Case ID (Ascending)</option>
                <option value="case_id:desc">Case ID (Descending)</option>
              </select>
            </div>

            {!isComplainant && (
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isOverdue}
                  onChange={(e) => {
                    setIsOverdue(e.target.checked);
                    setPage(0);
                  }}
                  className="w-4 h-4 rounded text-[#0845A8] focus:ring-[#0845A8] bg-white border-slate-300"
                />
                <span className="font-semibold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue SLAs Only
                </span>
              </label>
            )}

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition whitespace-nowrap"
                title="Reset all active search, filters, and sort options"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {!isComplainant && (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Bureau</label>
              {isReviewer ? (
                <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 truncate" title={currentRole?.bureau}>
                  {currentRole?.bureau || 'Assigned Bureau'}
                </div>
              ) : (
                <select
                  value={bureau}
                  onChange={(e) => {
                    setBureau(e.target.value);
                    setPage(0);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
                >
                  {BUREAUS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Listing Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner text="Retrieving complaints records..." />
        ) : error ? (
          <div className="p-8 text-center text-red-600 font-semibold">{error}</div>
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0845A8] hover:bg-[#063B8B] text-white text-xs font-bold rounded-xl transition shadow-sm"
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
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.map((c) => (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => onViewCase(c.id)}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0D9488] whitespace-nowrap">
                        <div>{c.case_id}</div>
                        {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mt-0.5 inline-flex">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>Proof Attached</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 max-w-[220px]">
                        <div className="font-semibold text-[#0F172A] truncate" title={c.institution_name}>
                          {c.institution_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {c.institution_aicte_id} • {c.institution_state}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <BureauBadge bureau={c.source_bureau} />
                      </td>
                      <td className="py-3 px-3.5 max-w-[240px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                            {c.category}
                          </span>
                          {getAphClause(c.category) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {getAphClause(c.category)}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[#0F172A] block truncate mt-0.5" title={c.subject}>
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
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.verification_status}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-700">
                        <div className="font-semibold text-[#0F172A] text-xs">{formatDate(c.received_date)}</div>
                        {c.created_at && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {c.is_overdue ? (
                          <div className="text-red-600 font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{c.days_overdue}d Overdue</span>
                          </div>
                        ) : (
                          <div className="text-slate-600 text-[11px]">
                            {formatDate(c.due_date)}
                            {c.days_remaining <= 5 && c.status !== 'Disposed' && (
                              <span className="ml-1 text-[10px] text-amber-600 font-bold">({c.days_remaining}d left)</span>
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
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs flex items-center gap-1"
                              title="Reviewer has requested additional details"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Respond</span>
                            </button>
                          )}

                          {/* Print / View Acknowledgement Slip */}
                          <button
                            onClick={() => setSelectedReceiptComplaint(c)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition flex items-center gap-1"
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
                              className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-[11px] font-medium transition"
                              title="Quick Status Change"
                            >
                              Update
                            </button>
                          )}

                          {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                            <button
                              onClick={() => onViewCase(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                              title="Open complaint evidence & proof documents"
                            >
                              <FileText className="w-3 h-3 text-teal-600" />
                              <span>Proof</span>
                            </button>
                          )}

                          <button
                            onClick={() => onViewCase(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0D9488] border border-teal-200 text-[11px] font-bold transition"
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
            <div className="block lg:hidden divide-y divide-slate-100">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="p-4 hover:bg-slate-50 transition cursor-pointer space-y-3"
                >
                  {/* Top row: Case ID, Proof tag, and Status/Priority badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#0D9488] flex items-center gap-1.5">
                        <span>{c.case_id}</span>
                        {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>Proof</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
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
                      <span className="text-[10px] uppercase font-semibold text-slate-500">
                        {c.category}
                      </span>
                      {getAphClause(c.category) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {getAphClause(c.category)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[#0F172A] line-clamp-2 mt-0.5" title={c.subject}>
                      {c.subject}
                    </h4>
                  </div>

                  {/* Institution & Bureau */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-700 font-medium truncate max-w-[240px]">
                      <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.institution_name}</span>
                    </div>
                    <div>
                      <BureauBadge bureau={c.source_bureau} />
                    </div>
                  </div>

                  {/* Meta Grid: Submitted Date/Time & SLA */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Submitted</span>
                      <div className="font-semibold text-slate-800 text-xs mt-0.5">
                        {formatDate(c.received_date)}
                      </div>
                      {c.created_at && (
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Target SLA</span>
                      {c.is_overdue ? (
                        <div className="text-red-600 font-bold flex items-center gap-1 text-xs mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{c.days_overdue}d Overdue</span>
                        </div>
                      ) : (
                        <div className="text-slate-700 text-xs mt-0.5 font-medium">
                          {formatDate(c.due_date)}
                          {c.days_remaining <= 5 && c.status !== 'Disposed' && (
                            <span className="ml-1 text-[10px] text-amber-600 font-bold">({c.days_remaining}d left)</span>
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
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition flex items-center gap-1"
                        title="View Official AICTE Acknowledgement Slip"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Slip</span>
                      </button>

                      {!isReviewer && c.evidence_files && c.evidence_files.length > 0 && (
                        <button
                          onClick={() => onViewCase(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>Proof</span>
                        </button>
                      )}

                      {isComplainant && c.verification_status === 'Needs More Information' && (
                        <button
                          onClick={() => {
                            setSelectedCaseForResponse(c);
                            setComplainantResponseText('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-sm flex items-center gap-1"
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
                          className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-[11px] font-medium transition"
                        >
                          Update
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onViewCase(c.id)}
                      className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0D9488] border border-teal-200 text-xs font-bold transition"
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
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-800">{complaints.length > 0 ? page * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-800">{Math.min((page + 1) * limit, total)}</span> of{' '}
            <span className="font-bold text-slate-800">{total}</span> complaints
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
                className="bg-white border border-slate-200 text-slate-800 rounded px-2 py-1 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-slate-800 font-semibold">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
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
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Institution *</label>
            <select
              value={createForm.institution_id}
              onChange={(e) => setCreateForm({ ...createForm, institution_id: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
              required
            >
              {institutionsList.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.aicte_id}) - {inst.state}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Complainant Affiliation *</label>
              <select
                value={createForm.complainant_affiliation}
                onChange={(e) => setCreateForm({ ...createForm, complainant_affiliation: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
              >
                {AFFILIATION_OPTIONS.map((aff) => (
                  <option key={aff} value={aff}>{aff}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Institutional USN / Roll No / ID</label>
              <input
                type="text"
                placeholder="e.g. 1DS22CS089"
                value={createForm.complainant_id_number}
                onChange={(e) => setCreateForm({ ...createForm, complainant_id_number: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
              />
            </div>
          </div>

          {/* Anonymous toggle option */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.is_anonymous}
                onChange={(e) => setCreateForm({ ...createForm, is_anonymous: e.target.checked })}
                className="w-4 h-4 text-[#0D9488] rounded focus:ring-[#0D9488]"
              />
              <span className="font-semibold text-slate-800">
                Submit as Protected Anonymous Grievance
              </span>
            </label>
            <p className="text-[11px] text-slate-500 ml-6">
              When checked, your personal name is protected from institutional authorities. AICTE maintains internal cryptographic hash for audit compliance.
            </p>
          </div>

          {!createForm.is_anonymous && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Complainant Name *</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={createForm.complainant_name}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
                  required={!createForm.is_anonymous}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={createForm.complainant_email}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_email: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91-XXXXXXXXXX"
                  value={createForm.complainant_phone}
                  onChange={(e) => setCreateForm({ ...createForm, complainant_phone: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Grievance Category *</label>
            <select
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
            >
              {CATEGORIES.filter(c => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Case Subject / Summary *</label>
            <input
              type="text"
              placeholder="e.g. Unapproved examination fee demand under threat of hall ticket withholding"
              value={createForm.subject}
              onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold">Detailed Description *</label>
              <span className={`text-[11px] font-mono font-bold ${
                createForm.description.trim().length >= 150 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {createForm.description.trim().length} / 150 characters minimum
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Provide narrative facts, dates, monetary demands, faculty/officer names, or specific regulations violated (minimum 150 characters)..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] shadow-xs text-xs"
              required
            />
          </div>

          {/* Explainable AI / Rules-Based Priority Card (Manual selection removed to prevent gaming SLAs) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#0F172A] font-bold text-xs">
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
                <span>Explainable Priority & Auto-Routing Assessment</span>
              </div>
              <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                AICTE Rule-Engine Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Calculated Priority SLA</span>
                <div className="flex items-center gap-2 mt-1">
                  <PriorityBadge priority={priorityAssessment.suggested_priority} />
                  <span className="font-bold text-slate-800">
                    {priorityAssessment.statutory_sla_days} Days Resolution Target
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Jurisdictional Bureau</span>
                <div className="mt-1">
                  <BureauBadge bureau={priorityAssessment.suggested_bureau} />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
              <span className="font-bold text-slate-800">Determination Rationale: </span>
              {priorityAssessment.reason}
            </div>

            <p className="text-[10px] text-slate-500 italic">
              * Note: Complainants cannot manually set priority levels. Reviewing officials verify or adjust priority upon evidence inspection.
            </p>
          </div>

          {/* Real Evidence Upload Section */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-semibold flex items-center gap-1.5 text-xs">
                <UploadCloud className="w-4 h-4 text-[#0D9488]" />
                <span>Supporting Documentary Evidence (PDF, DOC, DOCX max 10MB)</span>
              </label>
              <label className="cursor-pointer px-3 py-1 bg-[#0D9488] hover:bg-[#0b7c72] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs">
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
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#0D9488] flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-0.5 rounded hover:bg-red-50 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No documents attached yet. Click "+ Attach Document" to upload receipts, fee notices, or affidavits.
              </div>
            )}

            <p className="text-[10px] text-slate-500">
              Files are securely stored in server-isolated repository and served exclusively to authorized officials and case owner.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0b7c72] text-white font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-2"
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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Reviewing Officer Inquiry Note:
            </span>
            <p className="text-amber-800 text-xs italic">
              "{selectedCaseForResponse?.info_request_notes || 'Please furnish supporting payment receipts or attendance log to substantiate your grievance.'}"
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Your Response & Clarification *
            </label>
            <textarea
              rows={4}
              placeholder="Provide exact facts, transaction IDs, or explanations addressing the officer inquiry..."
              value={complainantResponseText}
              onChange={(e) => setComplainantResponseText(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-sm"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCaseForResponse(null)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={responseSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition disabled:opacity-50"
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
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Institution:</div>
            <div className="text-slate-800 font-semibold">{selectedCaseForStatus?.institution_name}</div>
            <div className="text-slate-500 font-medium mt-1">Current Status:</div>
            <div className="mt-0.5"><StatusBadge status={selectedCaseForStatus?.status} /></div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">New Workflow Status *</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 shadow-xs"
            >
              {STATUS_OPTIONS.filter(s => s !== 'All' && s !== selectedCaseForStatus?.status).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Official Justification / Investigation Remarks * (Logged to Audit Trail)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Completed initial evidence scrutiny. Notice issued to principal."
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 shadow-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCaseForStatus(null)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={statusSubmitting}
              className="px-5 py-2 rounded-lg bg-[#0D9488] text-white font-bold hover:bg-[#0b7c72] shadow-xs transition disabled:opacity-50"
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
