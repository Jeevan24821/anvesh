import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { BureauBadge } from '../components/BureauBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDate, formatTimeOnly } from '../utils/formatters';
import { BUREAUS } from '../utils/constants';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  GitMerge, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  Filter,
  RefreshCw,
  Building,
  ShieldCheck,
  Plus,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

const STATUS_COLORS = {
  'Submitted': '#6366F1',
  'Pending Verification': '#EC4899',
  'Needs More Information': '#F59E0B',
  'Under Review': '#8B5CF6',
  'New': '#2563EB',
  'Pending Bureau Review': '#9333EA',
  'Under Process': '#0284C7',
  'Hearing Scheduled': '#D97706',
  'Action Taken Report Awaited': '#EA580C',
  'Joint Investigation': '#4F46E5',
  'Escalated to Committee': '#DC2626',
  'Disposed': '#16A34A',
  'Transferred': '#065F46',
  'Duplicate Linked': '#6B7280',
  'Rejected': '#991B1B'
};

export function Dashboard({ onNavigate, onViewCase, onViewInstitution }) {
  const { currentRole } = useAuth();
  const isComplainant = currentRole?.role === 'Complainant';
  const isAdmin = currentRole?.role === 'Administrator' || currentRole?.canEditAll;

  const [selectedBureau, setSelectedBureau] = useState('All');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Line chart trend filter toggle: 'All', 'Filed', 'Resolved', 'Pending', 'Overdue'
  const [trendMetric, setTrendMetric] = useState('All');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats(selectedBureau);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchStats, 20000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [selectedBureau, currentRole]);

  if (loading && !stats) {
    return <LoadingSpinner text="Computing inter-bureau complaint metrics..." />;
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl m-6">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-red-900">Dashboard Metrics Unavailable</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 text-[#0845A8] text-sm font-semibold rounded-lg border border-slate-300 transition shadow-sm"
        >
          Retry Fetching
        </button>
      </div>
    );
  }

  // Complainant specific dashboard view
  if (isComplainant) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 text-[#0F172A] p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                Complainant Tracking Portal
              </span>
              <span className="text-xs text-[#64748B]">
                Logged in as <strong>{currentRole?.name || 'Complainant'}</strong> ({currentRole?.affiliation || 'Student'})
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0F172A]">
              AICTE Grievance Monitoring & Resolution Status
            </h1>
            <p className="text-xs text-[#64748B]">
              Institution: {currentRole?.institution || 'Technical Educational Institution'} • Ref ID: {currentRole?.complainantId || '1DS22CS089'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('complaints')}
            className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Grievance</span>
          </button>
        </div>

        {/* Complainant Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="My Registered Grievances"
            value={stats?.total_cases || 0}
            subtitle="Securely filed records"
            icon={FileText}
            color="teal"
            onClick={() => onNavigate('complaints')}
          />
          <MetricCard
            title="Active Under Inquiry"
            value={stats?.under_process_cases || 0}
            subtitle="Assigned to bureau scrutiny"
            icon={Clock}
            color="sky"
            onClick={() => onNavigate('complaints')}
          />
          <MetricCard
            title="Needs My Clarification"
            value={stats?.pending_verification || 0}
            subtitle="Officer queries awaiting reply"
            icon={HelpCircle}
            color="amber"
            alert={stats?.pending_verification > 0}
            onClick={() => onNavigate('complaints')}
          />
          <MetricCard
            title="Disposed / Resolved"
            value={stats?.disposed_cases || 0}
            subtitle="Formal orders issued"
            icon={CheckCircle2}
            color="emerald"
            onClick={() => onNavigate('complaints')}
          />
        </div>

        {/* Recent Grievances List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">My Registered Grievances & Status</h3>
              <p className="text-xs text-slate-500">Track resolution progress, assigned bureau, and officer responses</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs text-[#0845A8] hover:underline font-bold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Category & Subject</th>
                  <th className="py-2.5 px-3">Assigned Bureau</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Filed Date</th>
                  <th className="py-2.5 px-3">Statutory SLA Target</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(stats?.recent_cases || []).map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/40 transition cursor-pointer" onClick={() => onViewCase(c.id)}>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0845A8] whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[260px]">
                      <span className="font-semibold text-slate-900 block truncate">{c.subject}</span>
                      <span className="text-[10px] text-slate-500">{c.category}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <BureauBadge bureau={c.source_bureau} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} isComplainant={true} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                      <div className="font-semibold text-slate-800 text-xs">{formatDate(c.received_date)}</div>
                      {c.created_at && (
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">{formatDate(c.due_date)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCase(c.id);
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0845A8] font-bold border border-blue-200 transition"
                      >
                        Track Case
                      </button>
                    </td>
                  </tr>
                ))}
                {(!stats?.recent_cases || stats.recent_cases.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No complaints currently filed. Click 'Submit New Grievance' above to register your case.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Official / Reviewer / Administrator Dashboard View
  const totalCasesForDonut = stats?.total_cases || 0;

  // Normalized datasets ensuring no undefined scales or Recharts render exceptions
  const normalizedTrendData = (stats?.trend_data || []).map((item, idx) => ({
    month: item?.month || item?.period || `Month ${idx + 1}`,
    filed: Number(item?.filed ?? item?.Filed ?? 0),
    resolved: Number(item?.resolved ?? item?.Resolved ?? 0),
    pending: Number(item?.pending ?? item?.Pending ?? 0),
    overdue: Number(item?.overdue ?? item?.Overdue ?? 0),
  }));

  const normalizedBureauWorkload = (stats?.bureau_workload || []).map((item) => ({
    bureau: item?.bureau || 'Bureau',
    bureau_short: item?.bureau_short || item?.bureau || 'BUR',
    total: Number(item?.total || 0),
    active: Number(item?.active || 0),
    overdue: Number(item?.overdue || 0),
    disposed: Number(item?.disposed || 0),
  }));

  const normalizedStatusDist = (stats?.status_distribution || [])
    .filter((item) => item && item.name && Number(item.value) > 0)
    .map((item) => ({
      name: String(item.name),
      value: Number(item.value),
    }));

  const recentCases = (stats?.recent_cases || []).map((c, idx) => ({
    ...c,
    id: c?.id || idx + 1,
    case_id: c?.case_id || `CASE-${idx + 1}`,
    subject: c?.subject || 'Grievance record',
    institution_name: c?.institution_name || 'Technical Institution',
    source_bureau: c?.source_bureau || 'PGRC',
    status: c?.status || 'Submitted',
    priority: c?.priority || 'Medium',
  }));

  const approachingDeadlines = (stats?.approaching_deadlines || []).map((c, idx) => ({
    ...c,
    id: c?.id || idx + 1,
    case_id: c?.case_id || `CASE-${idx + 1}`,
    subject: c?.subject || 'Grievance record',
    institution_name: c?.institution_name || 'Technical Institution',
    days_remaining: c?.days_remaining ?? 0,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Bureau Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">AICTE Executive Grievance Overview</h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 font-bold uppercase tracking-wider">
              ANVESH Intelligence Mesh
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Real-time monitoring across PGRC, Regulation Bureau (RB), Approval Bureau (AB), Anti-Ragging Cell, and Skill Cell.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-[#0F172A]">
            <Filter className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="text-[#64748B] font-medium">Bureau:</span>
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              className="bg-transparent text-[#0F172A] font-semibold focus:outline-none cursor-pointer"
            >
              {BUREAUS.map((b) => (
                <option key={b} value={b} className="bg-white text-[#0F172A]">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchStats}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Critical Overdue SLA Alert Banner */}
      {stats?.overdue_cases > 0 && (
        <div 
          onClick={() => onNavigate('complaints', { is_overdue: true })}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-red-300 transition group shadow-sm text-red-900"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-red-100 text-red-600 border border-red-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">
                {stats.overdue_cases} Institution Grievances Have Breached Statutory SLA Deadlines
              </h4>
              <p className="text-xs text-red-700/85">
                Immediate inter-bureau intervention required under AICTE Regulations 2019. Click to filter overdue cases.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 group-hover:translate-x-1 transition">
            <span>Inspect Overdue</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid (With Accurate Overlap Math) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Grievances"
          value={stats?.total_cases || 0}
          subtitle="Unique cases registered"
          icon={FileText}
          color="teal"
          onClick={() => onNavigate('complaints')}
        />
        <MetricCard
          title="Active Under Process"
          value={stats?.under_process_cases || 0}
          subtitle="Inquiry, review & hearings"
          icon={Clock}
          color="sky"
          onClick={() => onNavigate('complaints', { status: 'Under Process' })}
        />
        {isAdmin ? (
          <MetricCard
            title="Cases Flagged for Overlap"
            value={stats?.cases_flagged_for_overlap || 0}
            subtitle={`${stats?.potential_match_pairs || 0} pairwise match alerts`}
            icon={GitMerge}
            color="purple"
            alert={(stats?.cases_flagged_for_overlap || 0) > 0}
            onClick={() => onNavigate('overlaps')}
          />
        ) : (
          <MetricCard
            title="Pending Initial Scrutiny"
            value={stats?.pending_cases || 0}
            subtitle="Intake verification pending"
            icon={FileText}
            color="amber"
            onClick={() => onNavigate('complaints', { status: 'Pending Verification' })}
          />
        )}
        <MetricCard
          title="Disposed / Resolved"
          value={stats?.disposed_cases || 0}
          subtitle={`Disposal rate: ${stats?.total_cases ? ((stats.disposed_cases / stats.total_cases) * 100).toFixed(1) : 0}%`}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => onNavigate('complaints', { status: 'Disposed' })}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Initial Scrutiny</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{stats?.pending_cases || 0}</p>
        </div>
        {isAdmin ? (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Overlap Decisions</span>
            <p className="text-xl font-extrabold text-purple-700 mt-1">{stats?.pending_overlap_decisions || 0}</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Joint Panel Inquiries</span>
            <p className="text-xl font-extrabold text-purple-700 mt-1">{stats?.joint_investigation_cases || 0}</p>
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inter-Bureau Transferred</span>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">{stats?.transferred_cases || 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Approaching SLA (7 Days)</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{stats?.approaching_deadlines?.length || 0}</p>
        </div>
      </div>

      {/* CHARTS SECTION 1: COMPLAINT TREND LINE CHART WITH TOGGLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0D9488]" />
              <h3 className="text-sm font-bold text-[#0F172A] tracking-wide">
                Complaint Intake & Resolution Longitudinal Trends
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              6-month historical trajectory of grievance intake, disposal volume, and pending pipelines
            </p>
          </div>

          {/* Metric filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {['All', 'Filed', 'Resolved', 'Pending', 'Overdue'].map((m) => (
              <button
                key={m}
                onClick={() => setTrendMetric(m)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  trendMetric === m
                    ? 'bg-white text-teal-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={260} minWidth={100}>
            <LineChart
              data={normalizedTrendData}
              margin={{ top: 10, right: 20, left: -15, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  color: '#0F172A',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {(trendMetric === 'All' || trendMetric === 'Filed') && (
                <Line
                  type="monotone"
                  dataKey="filed"
                  name="Filed Grievances"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {(trendMetric === 'All' || trendMetric === 'Resolved') && (
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved Cases"
                  stroke="#16A34A"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {(trendMetric === 'All' || trendMetric === 'Pending') && (
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Under Inquiry"
                  stroke="#D97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              )}
              {(trendMetric === 'All' || trendMetric === 'Overdue') && (
                <Line
                  type="monotone"
                  dataKey="overdue"
                  name="Overdue Breaches"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS SECTION 2: Workload & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bureau-Wise Workload Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-wide">Bureau-Wise Workload Distribution</h3>
              <p className="text-xs text-slate-500">Active vs. overdue cases per bureau (PGRC, RB, AB, PAPB, ARC, SDC)</p>
            </div>
          </div>
          <div className="h-72 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={260} minWidth={100}>
              <BarChart
                data={normalizedBureauWorkload}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="bureau_short" 
                  stroke="#64748B" 
                  fontSize={11} 
                  tickLine={false}
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E2E8F0', 
                    color: '#1E293B',
                    borderRadius: '8px', 
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#475569' }} />
                <Bar dataKey="active" name="Active Cases" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue SLA" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disposed" name="Disposed" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution Donut Chart with Total in Center (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between relative">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-wide">Status Breakdown</h3>
            <p className="text-xs text-[#64748B]">Current lifecycle states of complaints</p>
          </div>

          <div className="h-56 w-full my-auto relative min-h-[224px]">
            {normalizedStatusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={100}>
                <PieChart>
                  <Pie
                    data={normalizedStatusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {normalizedStatusDist.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.name] || '#64748B'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#E2E8F0', 
                      color: '#1E293B',
                      borderRadius: '8px', 
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active status distribution records
              </div>
            )}

            {/* Total count in center of donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 font-mono leading-none">
                {totalCasesForDonut}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Total Cases
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
            {normalizedStatusDist.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: STATUS_COLORS[item.name] || '#64748B' }}
                />
                <span className="truncate">{item.name}:</span>
                <span className="font-bold text-slate-800 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Approaching Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] tracking-wide">Recent Case Intake</h3>
              <p className="text-xs text-[#64748B]">Latest technical institution complaints filed</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1 font-semibold"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-3">Bureau</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#12345A] whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate" title={c.institution_name}>
                      <button
                        onClick={() => onViewInstitution(c.institution_id)}
                        className="text-[#0F172A] hover:text-teal-700 font-medium truncate text-left block"
                      >
                        {c.institution_name}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <BureauBadge bureau={c.source_bureau} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onViewCase(c.id)}
                        className="text-xs px-2.5 py-1 rounded-md bg-white hover:bg-teal-50 text-teal-700 font-semibold border border-slate-200 hover:border-teal-300 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {recentCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No recent cases recorded for this bureau filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approaching Deadlines Widget (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-[#0F172A] tracking-wide">Target Deadlines in 7 Days</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Action Required
              </span>
            </div>
            <p className="text-xs text-[#64748B] mb-4">
              Pending cases approaching statutory SLA resolution limits
            </p>

            <div className="space-y-2.5">
              {approachingDeadlines.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-amber-300 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12345A]">
                      {c.case_id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Due in {c.days_remaining}d
                    </span>
                  </div>
                  <p className="text-xs text-[#0F172A] font-semibold truncate mt-1" title={c.subject}>
                    {c.subject}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-1">
                    <span className="truncate max-w-[150px]">{c.institution_name}</span>
                    <span>{formatDate(c.due_date)}</span>
                  </div>
                </div>
              ))}

              {approachingDeadlines.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">
                  No cases due within the next 7 days.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
