import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { BureauBadge } from '../components/BureauBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDateTime } from '../utils/formatters';
import { OVERLAP_DECISION_ACTIONS, BUREAUS } from '../utils/constants';
import { 
  GitMerge, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight,
  Info,
  Download
} from 'lucide-react';

export function extractComponentSimilarities(reasons = []) {
  let institutionSim = 'N/A';
  let narrativeSim = 'N/A';
  let categorySim = 'N/A';
  let explanations = [];

  for (const r of reasons) {
    if (typeof r !== 'string') continue;

    // Institution matching signal
    if (r.includes('Exact AICTE Permanent Institution ID verified')) {
      institutionSim = '100%';
      explanations.push('Verified identical AICTE Permanent Institution ID.');
    } else if (r.includes('institution name variant match')) {
      const m = r.match(/(\d+)%/);
      if (m) institutionSim = `${m[1]}%`;
      explanations.push('High lexical and string similarity in institution name.');
    }

    // Category matching signal
    if (r.includes('Identical grievance category')) {
      categorySim = '100%';
      explanations.push('Both complaints fall under the identical AICTE grievance category.');
    }

    // Narrative text matching signal
    if (r.includes('High narrative overlap')) {
      const m = r.match(/(\d+)%/);
      if (m) narrativeSim = `${m[1]}%`;
      explanations.push('Substantial semantic and keyword overlap between grievance narratives.');
    } else if (r.includes('Shared case keywords')) {
      const kw = r.split(':')[1]?.trim() || '';
      if (kw) explanations.push(`Shared domain keywords: ${kw}`);
    }

    // Cross-bureau signal
    if (r.includes('Cross-Bureau involvement detected')) {
      explanations.push('Dual-bureau concurrent jurisdiction identified.');
    }
  }

  return { institutionSim, narrativeSim, categorySim, explanations };
}

export function Overlaps({ onViewCase }) {
  const { currentRole, refreshNotifications } = useAuth();
  const { t } = useLanguage();
  const isComplainant = currentRole?.role === 'Complainant';

  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [confidenceFilter, setConfidenceFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Review Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('JOINT_INVESTIGATION');
  const [targetBureau, setTargetBureau] = useState('Regulation Bureau (RB)');
  const [primaryCaseId, setPrimaryCaseId] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Scan state
  const [scanning, setScanning] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOverlapAlerts({
        limit: 100,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        confidence: confidenceFilter !== 'All' ? confidenceFilter : undefined,
        overlap_type: typeFilter !== 'All' ? typeFilter : undefined,
      });
      setAlerts(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err.message || 'Failed to fetch overlap alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, confidenceFilter, typeFilter]);

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await api.scanOverlaps();
      alert(`Scan complete: ${res.new_alerts_detected} new alerts flagged.`);
      fetchAlerts();
    } catch (e) {
      alert(e.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      await api.exportOverlapsCsv({
        status: statusFilter !== 'All' ? statusFilter : undefined
      });
    } catch (e) {
      alert(e.message || 'Failed to export overlap report');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleOpenReview = (alertItem, defaultAction = 'JOINT_INVESTIGATION') => {
    setSelectedAlert(alertItem);
    setReviewDecision(defaultAction);
    setTargetBureau(alertItem.case_1_bureau || 'Regulation Bureau (RB)');
    setPrimaryCaseId(alertItem.case_1_id);

    const defaultRemarks = {
      'JOINT_INVESTIGATION': 'Approved inter-bureau joint inquiry between ' + alertItem.case_1_bureau + ' and ' + alertItem.case_2_bureau + ' for unified hearing.',
      'TRANSFER_BUREAU': 'Consolidated single-window transfer to eliminate dual-bureau jurisdictional overlap.',
      'SEPARATE_INVESTIGATION': 'Reviewed and confirmed: individual grievances involve distinct statutory violations, proceeding with independent inquiries.',
      'CONFIRM_DUPLICATE': 'Identical duplicate complaint submission. Merged under parent case #' + alertItem.case_1_id + '.',
      'CONFIRM_LINK': 'Confirmed cross-bureau overlap. Linked for bilateral monitoring.',
      'DISMISS_FALSE_POSITIVE': 'Reviewed by committee: distinct non-overlapping matters. Algorithmic overlap dismissed.'
    };

    setReviewRemarks(defaultRemarks[defaultAction] || 'Administrative decision committed.');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRemarks.trim()) {
      alert('Official review remarks are mandatory for audit compliance.');
      return;
    }

    try {
      setSubmittingReview(true);
      await api.reviewOverlapAlert(selectedAlert.id, {
        decision: reviewDecision,
        reviewed_by: currentRole?.name || 'Administrator',
        remarks: reviewRemarks,
        target_bureau: reviewDecision === 'TRANSFER_BUREAU' ? targetBureau : undefined,
        primary_case_id: reviewDecision === 'CONFIRM_DUPLICATE' ? primaryCaseId : undefined
      });
      setSelectedAlert(null);
      fetchAlerts();
      if (refreshNotifications) refreshNotifications();
    } catch (err) {
      alert(err.message || 'Review submission failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isComplainant) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4 animate-fade-rise">
        <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#172033]">{t('accessRestricted', 'Access Restricted')}</h2>
        <p className="text-xs text-[#687386]">
          The Inter-Bureau Overlap Detection Centre contains internal cross-institutional intelligence and is accessible exclusively to authorized AICTE Reviewers and Administrators.
        </p>
      </div>
    );
  }

  const filterOptions = [
    { key: 'Pending Review', label: t('pendingReview', 'Pending Review') },
    { key: 'Confirmed Linked', label: t('confirmedLinked', 'Confirmed Linked') },
    { key: 'Separate Proceeding', label: t('separateProceeding', 'Separate Proceeding') },
    { key: 'Confirmed Duplicate', label: t('confirmedDuplicate', 'Confirmed Duplicate') },
    { key: 'Dismissed False Positive', label: t('dismissedFalsePositive', 'Dismissed False Positive') },
    { key: 'All', label: t('all', 'All') }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-rise">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-white border border-[#DCE3EC] shadow-xs flex items-center justify-center flex-shrink-0">
            <img 
              src="/aicte_logo.png" 
              alt="AICTE Official Seal" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#172033] tracking-tight">
                {t('overlapIntelligence', 'Inter-Bureau Overlap & Duplicate Intelligence Centre')}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] font-bold">
                6 Administrative Actions
              </span>
            </div>
            <p className="text-xs text-[#687386] mt-1">
              Deterministic, explainable cross-bureau matching. Authorize joint investigations, jurisdictional transfers, duplicate consolidations, and false positive dismissals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv || alerts.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F3F5F8] text-[#172033] border border-[#DCE3EC] hover:border-[#BBD5F8] text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            title="Download full overlap intelligence audit register in CSV format"
          >
            <Download className="w-3.5 h-3.5 text-[#0645A8]" />
            <span>{exportingCsv ? t('exportingCsv', 'Exporting CSV...') : t('exportOverlapsCsv', 'Export Overlaps (CSV)')}</span>
          </button>

          {!currentRole?.readOnly && (
            <button
              onClick={handleTriggerScan}
              disabled={scanning}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#0645A8] hover:bg-[#1769D2] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? t('scanningMatrix', 'Scanning Matrix...') : t('runOnDemandScan', 'Run On-Demand Scan')}
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#DCE3EC] p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === opt.key
                  ? 'bg-[#0645A8] text-white font-semibold shadow-xs'
                  : 'bg-white text-[#687386] hover:text-[#172033] hover:bg-[#F3F5F8] border border-[#DCE3EC]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#687386] font-medium">{t('confidence', 'Confidence')}:</span>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="bg-white border border-[#DCE3EC] text-[#172033] rounded-lg px-2.5 py-1.5 focus:border-[#0645A8] focus:outline-none"
            >
              <option value="All">{t('allConfidence', 'All Confidence')}</option>
              <option value="High">{t('highConfidence', 'High Confidence')}</option>
              <option value="Medium">{t('mediumConfidence', 'Medium Confidence')}</option>
              <option value="Low">{t('lowConfidence', 'Low Confidence')}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#687386] font-medium">{t('type', 'Type')}:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-[#DCE3EC] text-[#172033] rounded-lg px-2.5 py-1.5 focus:border-[#0645A8] focus:outline-none"
            >
              <option value="All">{t('allTypes', 'All Types')}</option>
              <option value="Cross-Bureau Institution Overlap">{t('crossBureauOverlap', 'Cross-Bureau Overlap')}</option>
              <option value="Probable Duplicate Complaint">{t('duplicateComplaint', 'Duplicate Complaint')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overlaps List */}
      {loading ? (
        <LoadingSpinner text={t('analyzingOverlaps', 'Analyzing complaints for cross-bureau overlaps...')} />
      ) : error ? (
        <div className="p-8 text-center text-[#DC3545] bg-[#DC3545]/10 border border-[#DC3545]/30 rounded-xl">{error}</div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title={t('noOverlapsFound', 'No overlap alerts match criteria')}
          description="The detection engine found no unreviewed cross-bureau matches for this filter."
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const simScore = alert.confidence_score <= 1.0 
              ? Math.round(alert.confidence_score * 100) 
              : Math.round(alert.confidence_score);
            const componentSims = extractComponentSimilarities(alert.match_reasons || []);

            return (
              <div
                key={alert.id}
                className="bg-white border border-[#DCE3EC] hover:border-[#BBD5F8] rounded-xl p-5 shadow-xs space-y-4 transition"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3EC]">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#0645A8] bg-[#EAF3FF] px-2.5 py-0.5 rounded border border-[#BBD5F8]">
                      Alert #{alert.id}
                    </span>
                    <span className="font-bold text-[#172033] text-sm">
                      {alert.institution_1_name}
                    </span>
                    <span className="text-[10px] text-[#687386] font-mono">
                      (AICTE ID: {alert.institution_1_aicte_id})
                    </span>
                    {/* Prominent Overall Similarity Score */}
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold border bg-[#EAF3FF] text-[#0645A8] border-[#BBD5F8] flex items-center gap-1 shadow-xs">
                      <span className="text-[10px] text-[#687386] font-normal">{t('similarityScore', 'Similarity Score')}:</span>
                      {simScore}%
                    </span>
                    {/* Clear Relationship Distinction */}
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      alert.status === 'Pending Review'
                        ? 'bg-[#F59E0B]/15 text-[#B45309] border-[#F59E0B]/30'
                        : alert.status === 'Dismissed False Positive'
                        ? 'bg-[#F8FAFC] text-[#687386] border-[#DCE3EC]'
                        : 'bg-[#16A765]/15 text-[#16A765] border-[#16A765]/30'
                    }`}>
                      {alert.status === 'Pending Review' ? t('suggestedOverlapPending', 'Suggested Overlap (Awaiting Review)') : alert.status}
                    </span>
                  </div>

                  {/* Review Action Trigger Buttons */}
                  {!currentRole?.readOnly && alert.status === 'Pending Review' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReview(alert, 'JOINT_INVESTIGATION')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0645A8] hover:bg-[#1769D2] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>{t('takeAction', 'Take Action')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Component Similarities Metric Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#DCE3EC] text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-[#DCE3EC]">
                    <span className="text-[#687386] font-medium">{t('institutionMatch', 'Institution Match')}:</span>
                    <span className={`font-bold ${componentSims.institutionSim !== 'N/A' ? 'text-[#16A765]' : 'text-[#687386]'}`}>
                      {componentSims.institutionSim}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-[#DCE3EC]">
                    <span className="text-[#687386] font-medium">{t('narrativeOverlap', 'Narrative Overlap')}:</span>
                    <span className={`font-bold ${componentSims.narrativeSim !== 'N/A' ? 'text-[#0645A8]' : 'text-[#687386]'}`}>
                      {componentSims.narrativeSim}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-[#DCE3EC]">
                    <span className="text-[#687386] font-medium">{t('categoryMatch', 'Category Match')}:</span>
                    <span className={`font-bold ${componentSims.categorySim !== 'N/A' ? 'text-[#1769D2]' : 'text-[#687386]'}`}>
                      {componentSims.categorySim}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Case Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Case 1 */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0645A8] text-xs">
                        {alert.case_1_id}
                      </span>
                      <button
                        onClick={() => onViewCase(alert.complaint_id_1)}
                        className="text-[11px] font-semibold text-[#0645A8] hover:text-[#1769D2] flex items-center gap-1 transition"
                      >
                        {t('viewCase', 'View Case')} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <BureauBadge bureau={alert.case_1_bureau} />
                      <StatusBadge status={alert.case_1_status} />
                    </div>
                    <div className="text-xs font-semibold text-[#172033]">
                      {alert.case_1_subject}
                    </div>
                    <p className="text-[11px] text-[#687386] line-clamp-3 bg-white p-2.5 rounded-lg border border-[#DCE3EC] whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full overflow-hidden">
                      {alert.case_1_description}
                    </p>
                  </div>

                  {/* Case 2 */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0645A8] text-xs">
                        {alert.case_2_id}
                      </span>
                      <button
                        onClick={() => onViewCase(alert.complaint_id_2)}
                        className="text-[11px] font-semibold text-[#0645A8] hover:text-[#1769D2] flex items-center gap-1 transition"
                      >
                        {t('viewCase', 'View Case')} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <BureauBadge bureau={alert.case_2_bureau} />
                      <StatusBadge status={alert.case_2_status} />
                    </div>
                    <div className="text-xs font-semibold text-[#172033]">
                      {alert.case_2_subject}
                    </div>
                    <p className="text-[11px] text-[#687386] line-clamp-3 bg-white p-2.5 rounded-lg border border-[#DCE3EC] whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full overflow-hidden">
                      {alert.case_2_description}
                    </p>
                  </div>
                </div>

                {/* Explainability Card: Transparent Signal Breakdown */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-[#172033] font-bold uppercase tracking-wider text-[10px]">
                    <Info className="w-3.5 h-3.5 text-[#0645A8]" />
                    {t('engineMatchSignals', 'Engine Match Signals & Explainability Breakdown')}:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[#687386] text-[11px]">
                    {alert.match_reasons.map((reason, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {reason}
                      </li>
                    ))}
                  </ul>

                  {componentSims.explanations.length > 0 && (
                    <div className="pt-2 border-t border-[#DCE3EC] text-[11px] text-[#0645A8] space-y-1">
                      <div className="text-[10px] uppercase font-bold text-[#687386] tracking-wider">
                        {t('conciseSignalAssessment', 'Concise Signal Assessment')}:
                      </div>
                      {componentSims.explanations.map((exp, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[#172033]">
                          <span className="text-[#0645A8] font-bold">•</span>
                          <span>{exp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review History / Remarks if already reviewed */}
                {alert.reviewed_by && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] text-xs space-y-1">
                    <div className="text-[10px] text-[#687386] uppercase font-semibold flex items-center justify-between">
                      <span>{t('administrativeOrderBy', 'Administrative Order by')} {alert.reviewed_by}</span>
                      <span>{formatDateTime(alert.reviewed_at)}</span>
                    </div>
                    <p className="font-semibold text-[#172033]">{alert.review_decision}</p>
                    <p className="text-[#687386] italic">"{alert.review_remarks}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal: Supporting all 6 Administrative Decisions */}
      <Modal
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        title={`Administrative Review & Action on Alert #${selectedAlert?.id}`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DCE3EC] space-y-1">
            <div className="font-bold text-[#172033]">{selectedAlert?.institution_1_name}</div>
            <div className="text-[#687386]">
              Examining pair: <span className="text-[#0645A8] font-mono font-bold">{selectedAlert?.case_1_id}</span> ({selectedAlert?.case_1_bureau}) and{' '}
              <span className="text-[#0645A8] font-mono font-bold">{selectedAlert?.case_2_id}</span> ({selectedAlert?.case_2_bureau})
            </div>
          </div>

          <div>
            <label className="block text-[#687386] font-bold mb-2 uppercase text-[10px] tracking-wider">
              {t('selectAction', 'Select Official Administrative Action')} *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OVERLAP_DECISION_ACTIONS.map((action) => (
                <div
                  key={action.id}
                  onClick={() => {
                    setReviewDecision(action.id);
                    if (action.id === 'TRANSFER_BUREAU') {
                      setReviewRemarks(`Consolidated transfer to ${targetBureau} to prevent overlapping proceedings.`);
                    } else if (action.id === 'JOINT_INVESTIGATION') {
                      setReviewRemarks(`Joint investigation authorized between ${selectedAlert?.case_1_bureau} and ${selectedAlert?.case_2_bureau}.`);
                    } else if (action.id === 'CONFIRM_DUPLICATE') {
                      setReviewRemarks(`Confirmed identical duplicate; linked to primary case #${selectedAlert?.case_1_id}.`);
                    } else if (action.id === 'SEPARATE_INVESTIGATION') {
                      setReviewRemarks('Matters represent independent grievances; proceed with separate inquiries.');
                    } else if (action.id === 'DISMISS_FALSE_POSITIVE') {
                      setReviewRemarks('Algorithmic overlap false positive; complaints are distinct and unrelated.');
                    } else {
                      setReviewRemarks('Confirmed cross-bureau overlap relationship.');
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                    reviewDecision === action.id
                      ? 'bg-[#EAF3FF] border-[#0645A8] text-[#172033] shadow-xs'
                      : 'bg-white border-[#DCE3EC] hover:bg-[#F8FAFC] text-[#687386]'
                  }`}
                >
                  <div className="font-bold text-[#172033] text-xs flex items-center justify-between">
                    <span>{action.label}</span>
                    {reviewDecision === action.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#0645A8]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#687386] mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Input: Target Bureau for Consolidated Transfer */}
          {reviewDecision === 'TRANSFER_BUREAU' && (
            <div className="p-3 bg-[#F8FAFC] border border-[#BBD5F8] rounded-xl space-y-2">
              <label className="block text-[#0645A8] font-bold text-xs">
                Consolidated Destination Bureau *
              </label>
              <select
                value={targetBureau}
                onChange={(e) => {
                  setTargetBureau(e.target.value);
                  setReviewRemarks(`Consolidated transfer to ${e.target.value} to prevent overlapping proceedings.`);
                }}
                className="w-full p-2 bg-white border border-[#DCE3EC] rounded-lg text-[#172033] text-xs focus:border-[#0645A8] focus:outline-none"
              >
                {BUREAUS.filter(b => b !== 'All').map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Input: Primary Case for Duplicate Linking */}
          {reviewDecision === 'CONFIRM_DUPLICATE' && (
            <div className="p-3 bg-[#F8FAFC] border border-[#BBD5F8] rounded-xl space-y-2">
              <label className="block text-[#0645A8] font-bold text-xs">
                Select Master / Primary Case ID *
              </label>
              <select
                value={primaryCaseId}
                onChange={(e) => {
                  setPrimaryCaseId(e.target.value);
                  setReviewRemarks(`Confirmed identical duplicate; linked to master case #${e.target.value}.`);
                }}
                className="w-full p-2 bg-white border border-[#DCE3EC] rounded-lg text-[#172033] text-xs focus:border-[#0645A8] focus:outline-none"
              >
                <option value={selectedAlert?.case_1_id}>{selectedAlert?.case_1_id} ({selectedAlert?.case_1_bureau})</option>
                <option value={selectedAlert?.case_2_id}>{selectedAlert?.case_2_id} ({selectedAlert?.case_2_bureau})</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[#687386] font-semibold mb-1">
              Official Review Remarks & Audit Reason *
            </label>
            <textarea
              rows={3}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#DCE3EC] rounded-lg text-[#172033] placeholder-[#687386] focus:outline-none focus:border-[#0645A8] shadow-xs"
              placeholder="State the factual basis for this decision..."
              required
            />
          </div>

          <div className="pt-3 border-t border-[#DCE3EC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedAlert(null)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-[#F3F5F8] border border-[#DCE3EC] text-[#687386] hover:text-[#172033] font-medium transition"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2 rounded-lg bg-[#0645A8] hover:bg-[#1769D2] text-white font-bold shadow-xs transition disabled:opacity-50"
            >
              {submittingReview ? t('saving', 'Recording...') : t('authorizeAction', 'Authorize Administrative Action')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
