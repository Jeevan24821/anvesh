import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { BureauBadge } from '../components/BureauBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import { REGIONS } from '../utils/constants';
import { 
  Building2, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  ShieldCheck, 
  AlertTriangle, 
  GitMerge, 
  FileText,
  User,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export function Institutions({ onViewCase }) {
  const { currentRole } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal
  const [selectedInstId, setSelectedInstId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInstitutions({
        limit: 50,
        search,
        region: region !== 'All' ? region : undefined,
      });
      setInstitutions(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRole?.role === 'Complainant') return;
    fetchInstitutions();
  }, [search, region, currentRole]);

  const handleOpenDetail = async (id) => {
    try {
      setSelectedInstId(id);
      setDetailLoading(true);
      const data = await api.getInstitutionById(id);
      setDetailData(data);
    } catch (e) {
      alert('Failed to load institution profile details');
    } finally {
      setDetailLoading(false);
    }
  };

  if (currentRole?.role === 'Complainant') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          The Institution Directory, aggregated complaint statistics, overdue metrics, and overlap intelligence are strictly restricted to authorized AICTE administrative and reviewer personnel.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Technical Institution Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated profiles and multi-bureau grievance track records for AICTE approved colleges.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="text-[#0845A8] font-bold">{institutions.length}</span> of {total} Institutions
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Institution Name, AICTE Permanent ID (1-3349...), or District..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0845A8] focus:ring-2 focus:ring-[#0845A8]/20 transition"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#0845A8] focus:ring-2 focus:ring-[#0845A8]/20"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>Region: {r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Institutions Grid */}
      {loading ? (
        <LoadingSpinner text="Retrieving institution profiles and complaint records..." />
      ) : error ? (
        <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">{error}</div>
      ) : institutions.length === 0 ? (
        <EmptyState title="No institutions found" description="Try clearing your search keyword or region filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((inst) => (
            <div
              key={inst.id}
              onClick={() => handleOpenDetail(inst.id)}
              className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-xl p-5 cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0845A8] border border-blue-200">
                    {inst.aicte_id}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    inst.approval_status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {inst.approval_status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mt-2.5 leading-snug line-clamp-2" title={inst.name}>
                  {inst.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{inst.district}, {inst.state} ({inst.region})</span>
                </div>

                <div className="text-[11px] text-slate-500 mt-1">
                  Type: <span className="text-slate-700 font-medium">{inst.institution_type}</span>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Complaints</span>
                    <span className="font-bold text-slate-800">{inst.complaint_count}</span>
                  </div>

                  {inst.overdue_complaints > 0 && (
                    <div>
                      <span className="text-[10px] text-rose-600 uppercase block">Overdue</span>
                      <span className="font-bold text-rose-600">{inst.overdue_complaints}</span>
                    </div>
                  )}

                  {inst.overlap_count > 0 && (
                    <div>
                      <span className="text-[10px] text-purple-600 uppercase block">Overlaps</span>
                      <span className="font-bold text-purple-700 flex items-center gap-0.5">
                        <GitMerge className="w-3 h-3 text-purple-600" />
                        {inst.overlap_count}
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-xs text-[#0845A8] font-semibold flex items-center gap-1">
                  History <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Institution Detail Profile & Consolidated History Modal */}
      <Modal
        isOpen={Boolean(selectedInstId)}
        onClose={() => {
          setSelectedInstId(null);
          setDetailData(null);
        }}
        title="Consolidated Institution Profile & Multi-Bureau Grievance History"
        maxWidth="max-w-4xl"
      >
        {detailLoading || !detailData ? (
          <LoadingSpinner text="Fetching multi-bureau history..." />
        ) : (
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0845A8]">
                  Permanent AICTE ID: {detailData.aicte_id}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {detailData.approval_status}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{detailData.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-xs pt-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{detailData.address}, {detailData.district}, {detailData.state} - {detailData.pincode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Head: {detailData.principal_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{detailData.contact_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{detailData.contact_phone}</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Counts */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase">Total Filed</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{detailData.total_complaints}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[10px] text-sky-600 uppercase">Active Cases</div>
                <div className="text-lg font-bold text-sky-700 mt-0.5">{detailData.active_complaints}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[10px] text-rose-600 uppercase">Overdue Breaches</div>
                <div className="text-lg font-bold text-rose-700 mt-0.5">{detailData.overdue_complaints}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[10px] text-purple-600 uppercase">Overlap Alerts</div>
                <div className="text-lg font-bold text-purple-700 mt-0.5">{detailData.overlap_alerts_count}</div>
              </div>
            </div>

            {/* Consolidated Complaints Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 tracking-wide">
                  Cross-Bureau Complaint History ({detailData.complaints.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Tracked across PGRC, Regulation, Approval, ARC, and SDC
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Case ID</th>
                      <th className="py-2.5 px-3">Bureau</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(detailData.complaints || []).map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0845A8] whitespace-nowrap">
                          {c.case_id}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <BureauBadge bureau={c.source_bureau} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                          {c.category}
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate" title={c.subject}>
                          {c.subject}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedInstId(null);
                              onViewCase(c.id);
                            }}
                            className="text-xs px-2.5 py-1 rounded bg-blue-50 text-[#0845A8] hover:bg-blue-100 border border-blue-200 font-semibold transition"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
