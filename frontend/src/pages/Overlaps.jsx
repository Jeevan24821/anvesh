import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { BureauBadge } from '../components/BureauBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getConfidenceStyle, formatDate, formatDateTime } from '../utils/formatters';
import { OVERLAP_DECISION_ACTIONS, BUREAUS } from '../utils/constants';
import { 
  GitMerge, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  Info,
  Layers,
  Share2,
  FileText
} from 'lucide-react';

export function Overlaps({ onViewCase }) {
  const { currentRole, refreshNotifications } = useAuth();
  const isComplainant = currentRole?.role === 'Complainant';

  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600">
          The Inter-Bureau Overlap Detection Centre contains internal cross-institutional intelligence and is accessible exclusively to authorized AICTE Reviewers and Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Inter-Bureau Overlap & Duplicate Intelligence Centre
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              6 Administrative Actions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic, explainable cross-bureau matching. Authorize joint investigations, jurisdictional transfers, duplicate consolidations, and false positive dismissals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!currentRole?.readOnly && (
            <button
              onClick={handleTriggerScan}
              disabled={scanning}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0845A8] border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning Matrix...' : 'Run On-Demand Scan'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['Pending Review', 'Confirmed Linked', 'Separate Proceeding', 'Confirmed Duplicate', 'Dismissed False Positive', 'All'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === s
                  ? 'bg-[#0845A8] text-white font-semibold shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Confidence:</span>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Confidence</option>
              <option value="High">High Confidence</option>
              <option value="Medium">Medium Confidence</option>
              <option value="Low">Low Confidence</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Cross-Bureau Institution Overlap">Cross-Bureau Overlap</option>
              <option value="Probable Duplicate Complaint">Duplicate Complaint</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overlaps List */}
      {loading ? (
        <LoadingSpinner text="Analyzing complaints for cross-bureau overlaps..." />
      ) : error ? (
        <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">{error}</div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No overlap alerts match criteria"
          description="The detection engine found no unreviewed cross-bureau matches for this filter."
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-blue-300 transition"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Alert #{alert.id}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {alert.institution_1_name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (AICTE ID: {alert.institution_1_aicte_id})
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getConfidenceStyle(alert.confidence_label)}`}>
                    {alert.confidence_label} Match ({alert.confidence_score}%)
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {alert.status}
                  </span>
                </div>

                {/* Review Action Trigger Buttons */}
                {!currentRole?.readOnly && alert.status === 'Pending Review' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReview(alert, 'JOINT_INVESTIGATION')}
                      className="px-3 py-1.5 rounded-lg bg-[#0845A8] hover:bg-[#063B8B] text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Take Action</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Side-by-Side Case Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Case 1 */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 text-xs">
                      {alert.case_1_id}
                    </span>
                    <button
                      onClick={() => onViewCase(alert.complaint_id_1)}
                      className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      View Case <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <BureauBadge bureau={alert.case_1_bureau} />
                    <StatusBadge status={alert.case_1_status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {alert.case_1_subject}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    {alert.case_1_description}
                  </p>
                </div>

                {/* Case 2 */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 text-xs">
                      {alert.case_2_id}
                    </span>
                    <button
                      onClick={() => onViewCase(alert.complaint_id_2)}
                      className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      View Case <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <BureauBadge bureau={alert.case_2_bureau} />
                    <StatusBadge status={alert.case_2_status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {alert.case_2_subject}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    {alert.case_2_description}
                  </p>
                </div>
              </div>

              {/* Explainability Card: Transparent Signal Breakdown */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                  <Info className="w-3.5 h-3.5 text-[#0845A8]" />
                  Engine Match Signals & Explainability Breakdown:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                  {alert.match_reasons.map((reason, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Review History / Remarks if already reviewed */}
              {alert.reviewed_by && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-between">
                    <span>Administrative Order by {alert.reviewed_by}</span>
                    <span>{formatDateTime(alert.reviewed_at)}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{alert.review_decision}</p>
                  <p className="text-slate-700 italic">"{alert.review_remarks}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal: Supporting all 6 Administrative Decisions */}
      <Modal
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        title={`Administrative Review & Action on Alert #${selectedAlert?.id}`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">{selectedAlert?.institution_1_name}</div>
            <div className="text-slate-600">
              Examining pair: <span className="text-[#0845A8] font-mono font-bold">{selectedAlert?.case_1_id}</span> ({selectedAlert?.case_1_bureau}) and{' '}
              <span className="text-[#0845A8] font-mono font-bold">{selectedAlert?.case_2_id}</span> ({selectedAlert?.case_2_bureau})
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-2 uppercase text-[10px] tracking-wider">
              Select Official Administrative Action *
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
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>{action.label}</span>
                    {reviewDecision === action.id && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Input: Target Bureau for Consolidated Transfer */}
          {reviewDecision === 'TRANSFER_BUREAU' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <label className="block text-blue-900 font-bold text-xs">
                Consolidated Destination Bureau *
              </label>
              <select
                value={targetBureau}
                onChange={(e) => {
                  setTargetBureau(e.target.value);
                  setReviewRemarks(`Consolidated transfer to ${e.target.value} to prevent overlapping proceedings.`);
                }}
                className="w-full p-2 bg-white border border-blue-300 rounded-lg text-slate-800 text-xs"
              >
                {BUREAUS.filter(b => b !== 'All').map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Input: Primary Case for Duplicate Linking */}
          {reviewDecision === 'CONFIRM_DUPLICATE' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
              <label className="block text-purple-900 font-bold text-xs">
                Select Master / Primary Case ID *
              </label>
              <select
                value={primaryCaseId}
                onChange={(e) => {
                  setPrimaryCaseId(e.target.value);
                  setReviewRemarks(`Confirmed identical duplicate; linked to master case #${e.target.value}.`);
                }}
                className="w-full p-2 bg-white border border-purple-300 rounded-lg text-slate-800 text-xs"
              >
                <option value={selectedAlert?.case_1_id}>{selectedAlert?.case_1_id} ({selectedAlert?.case_1_bureau})</option>
                <option value={selectedAlert?.case_2_id}>{selectedAlert?.case_2_id} ({selectedAlert?.case_2_bureau})</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Official Review Remarks & Audit Reason *
            </label>
            <textarea
              rows={3}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#0845A8] shadow-sm"
              placeholder="State the factual basis for this decision..."
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedAlert(null)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2 rounded-lg bg-[#0845A8] text-white font-bold hover:bg-[#063B8B] shadow transition disabled:opacity-50"
            >
              {submittingReview ? 'Recording...' : 'Authorize Administrative Action'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
