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
  'Submitted': '#9312FF',
  'Pending Verification': '#C084FC',
  'Needs More Information': '#F59E0B',
  'Under Review': '#7A1CF8',
  'New': '#A020FF',
  'Pending Bureau Review': '#6110C9',
  'Under Process': '#38BDF8',
  'Hearing Scheduled': '#FBBF24',
  'Action Taken Report Awaited': '#FB923C',
  'Joint Investigation': '#818CF8',
  'Escalated to Committee': '#F03B2A',
  'Disposed': '#45B558',
  'Resolved': '#45B558',
  'Transferred': '#A855F7',
  'Duplicate Linked': '#64748B',
  'Rejected': '#EF4444'
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
      <div className="p-8 text-center bg-[#0D0D14] border border-[#F03B2A]/40 rounded-2xl m-6 shadow-[0_0_20px_rgba(240,59,42,0.15)]">
        <AlertTriangle className="w-10 h-10 text-[#F03B2A] mx-auto mb-2" />
        <h3 className="text-lg font-bold text-[#F7F7F8]">Dashboard Metrics Unavailable</h3>
        <p className="text-sm text-[#8B8988] mt-1">{error}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-[#13131E] hover:bg-[#181826] text-[#D8B4FE] text-sm font-semibold rounded-xl border border-[#3A3854] transition shadow-xs"
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
        {/* Cinematic Royal Violet Dashboard Hero (Complainant) */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2A2844] bg-[#0D0D14]/90 p-6 sm:p-8 shadow-[0_0_40px_rgba(147,18,255,0.18)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-[radial-gradient(ellipse_at_top,rgba(147,18,255,0.3),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#45B558]/15 border border-[#45B558]/35 text-[#45B558] text-xs font-semibold shadow-[0_0_10px_rgba(69,181,88,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#45B558] shadow-[0_0_6px_#45B558]" />
              Institutional Complainant Access • Confidential Protection Active
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#F7F7F8]">
              <span className="bg-gradient-to-r from-[#FFFFFF] via-[#D8B4FE] to-[#9312FF] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(147,18,255,0.4)]">
                ANVESH
              </span>
              <span className="block text-xl sm:text-2xl font-bold text-[#F7F7F8] mt-1">
                AICTE Grievance Intelligence
              </span>
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-[#D8B4FE] tracking-wide">
              “Smarter grievance oversight. Explainable AI. Accountable resolution.”
            </p>

            <p className="text-xs text-[#8B8988] leading-relaxed max-w-xl mx-auto">
              Track the real-time processing of your submitted grievances under AICTE Regulations 2019. Receive official information queries, track statutory SLAs, and print official receipts.
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('complaints')}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_20px_rgba(147,18,255,0.4)] hover:shadow-[0_0_30px_rgba(147,18,255,0.6)] hover:-translate-y-0.5 transition duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Submit New Grievance</span>
              </button>
            </div>
          </div>
        </div>

        {/* Complainant Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="My Registered Grievances"
            value={stats?.total_cases || 0}
            subtitle="Securely filed records"
            icon={FileText}
            color="violet"
            onClick={() => onNavigate('complaints')}
          />
          <MetricCard
            title="Active Under Inquiry"
            value={stats?.under_process_cases || 0}
            subtitle="Assigned to bureau scrutiny"
            icon={Clock}
            color="navy"
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
        <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232234]">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7F8]">My Registered Grievances & Status</h3>
              <p className="text-xs text-[#8B8988]">Track resolution progress, assigned bureau, and officer responses</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs text-[#A020FF] hover:text-[#D8B4FE] font-bold flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#13131E] text-[#8B8988] uppercase text-[10px] tracking-wider border-b border-[#232234]">
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
              <tbody className="divide-y divide-[#1F1E2E] text-[#F7F7F8]">
                {(stats?.recent_cases || []).map((c) => (
                  <tr key={c.id} className="hover:bg-[#181826] transition cursor-pointer" onClick={() => onViewCase(c.id)}>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#D8B4FE] whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[260px]">
                      <span className="font-semibold text-[#F7F7F8] block truncate">{c.subject}</span>
                      <span className="text-[10px] text-[#8B8988]">{c.category}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <BureauBadge bureau={c.source_bureau} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} isComplainant={true} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#8B8988]">
                      <div className="font-semibold text-[#F7F7F8] text-xs">{formatDate(c.received_date)}</div>
                      {c.created_at && (
                        <div className="text-[10px] text-[#8B8988] font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-[#9312FF]" />
                          <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-[#D8B4FE] font-bold">
                        {formatDate(c.due_date)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCase(c.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#13131E] hover:bg-[#1C1A2E] text-[#A020FF] border border-[#3A3854] hover:border-[#9312FF]/60 transition shadow-xs"
                      >
                        Track Status
                      </button>
                    </td>
                  </tr>
                ))}
                {(!stats?.recent_cases || stats.recent_cases.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8B8988]">
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
      {/* Cinematic Royal Violet Dashboard Hero (Section 3 & 4) */}
      <div className="relative overflow-hidden rounded-2xl border border-[#2A2844] bg-[#0D0D14]/90 p-8 sm:p-10 shadow-[0_0_50px_rgba(147,18,255,0.18)]">
        {/* Subtle cosmic radial ambient light behind the hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-[radial-gradient(ellipse_at_top,rgba(147,18,255,0.35),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9312FF]/15 border border-[#9312FF]/35 text-[#D8B4FE] text-xs font-semibold shadow-[0_0_12px_rgba(147,18,255,0.25)]">
            <span className="w-2 h-2 rounded-full bg-[#9312FF] animate-pulse shadow-[0_0_8px_#9312FF]" />
            AICTE Inter-Bureau Redressal Mesh
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#F7F7F8]">
              <span className="bg-gradient-to-r from-[#FFFFFF] via-[#D8B4FE] to-[#9312FF] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(147,18,255,0.4)]">
                ANVESH
              </span>
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F7F7F8] mt-1">
              AICTE Grievance Intelligence
            </h2>
          </div>

          <p className="text-sm sm:text-base font-semibold text-[#D8B4FE] tracking-wide">
            “Smarter grievance oversight. Explainable AI. Accountable resolution.”
          </p>

          <p className="text-xs sm:text-sm text-[#8B8988] leading-relaxed max-w-2xl mx-auto">
            Unify grievance monitoring, identify potentially related complaints, support regulatory review, and improve institutional accountability through a single intelligent platform.
          </p>

          {/* Hero Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('complaints')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_20px_rgba(147,18,255,0.4)] hover:shadow-[0_0_30px_rgba(147,18,255,0.6)] hover:-translate-y-0.5 transition duration-200 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>View Grievances</span>
            </button>

            <button
              onClick={() => onNavigate('overlaps')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#13131E] hover:bg-[#181826] text-[#F7F7F8] border border-[#3A3854] hover:border-[#9312FF]/60 shadow-[0_0_15px_rgba(147,18,255,0.15)] hover:-translate-y-0.5 transition duration-200 flex items-center gap-2"
            >
              <GitMerge className="w-4 h-4 text-[#A020FF]" />
              <span>Explore Overlap Intelligence</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner & Bureau Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D0D14] border border-[#232234] p-5 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-[#F7F7F8] tracking-tight">AICTE Executive Grievance Overview</h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30 font-bold uppercase tracking-wider">
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-[#8B8988] mt-1 font-medium">
            Real-time monitoring across PGRC, Regulation Bureau (RB), Approval Bureau (AB), Anti-Ragging Cell, and Skill Cell.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#13131E] px-3.5 py-1.5 rounded-xl border border-[#232234] text-xs text-[#F7F7F8]">
            <Filter className="w-3.5 h-3.5 text-[#9312FF]" />
            <span className="text-[#8B8988] font-medium">Bureau:</span>
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              className="bg-transparent text-[#F7F7F8] font-semibold focus:outline-none cursor-pointer"
            >
              {BUREAUS.map((b) => (
                <option key={b} value={b} className="bg-[#13131E] text-[#F7F7F8]">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-[#13131E] hover:bg-[#181826] border border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] hover:border-[#3A3854] transition shadow-xs"
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
          className="bg-[#F03B2A]/10 border border-[#F03B2A]/35 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#F03B2A]/60 transition group shadow-[0_0_20px_rgba(240,59,42,0.15)] text-[#F7F7F8]"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#F03B2A]/20 text-[#F03B2A] border border-[#F03B2A]/40 shadow-[0_0_12px_rgba(240,59,42,0.3)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F7F7F8]">
                {stats.overdue_cases} Institution Grievances Have Breached Statutory SLA Deadlines
              </h4>
              <p className="text-xs text-[#8B8988] mt-0.5">
                Immediate inter-bureau intervention required under AICTE Regulations 2019. Click to filter overdue cases.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F03B2A] group-hover:translate-x-1 transition">
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
          color="violet"
          onClick={() => onNavigate('complaints')}
        />
        <MetricCard
          title="Active Under Process"
          value={stats?.under_process_cases || 0}
          subtitle="Inquiry, review & hearings"
          icon={Clock}
          color="navy"
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
        <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-4 shadow-sm hover:border-[#3A3854] transition">
          <span className="text-[11px] font-semibold text-[#8B8988] uppercase tracking-wider">Pending Initial Scrutiny</span>
          <p className="text-xl font-black text-[#F7F7F8] mt-1">{stats?.pending_cases || 0}</p>
        </div>
        {isAdmin ? (
          <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-4 shadow-sm hover:border-[#3A3854] transition">
            <span className="text-[11px] font-semibold text-[#8B8988] uppercase tracking-wider">Pending Overlap Decisions</span>
            <p className="text-xl font-black text-[#A020FF] mt-1 drop-shadow-[0_0_8px_rgba(160,32,255,0.4)]">{stats?.pending_overlap_decisions || 0}</p>
          </div>
        ) : (
          <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-4 shadow-sm hover:border-[#3A3854] transition">
            <span className="text-[11px] font-semibold text-[#8B8988] uppercase tracking-wider">Joint Panel Inquiries</span>
            <p className="text-xl font-black text-[#A020FF] mt-1 drop-shadow-[0_0_8px_rgba(160,32,255,0.4)]">{stats?.joint_investigation_cases || 0}</p>
          </div>
        )}
        <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-4 shadow-sm hover:border-[#3A3854] transition">
          <span className="text-[11px] font-semibold text-[#8B8988] uppercase tracking-wider">Inter-Bureau Transferred</span>
          <p className="text-xl font-black text-[#818CF8] mt-1">{stats?.transferred_cases || 0}</p>
        </div>
        <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-4 shadow-sm hover:border-[#3A3854] transition">
          <span className="text-[11px] font-semibold text-[#8B8988] uppercase tracking-wider">Approaching SLA (7 Days)</span>
          <p className="text-xl font-black text-[#F59E0B] mt-1">{stats?.approaching_deadlines?.length || 0}</p>
        </div>
      </div>

      {/* CHARTS SECTION 1: COMPLAINT TREND LINE CHART WITH TOGGLE */}
      <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-md hover:border-[#3A3854] transition space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A020FF]" />
              <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide">
                Complaint Intake & Resolution Longitudinal Trends
              </h3>
            </div>
            <p className="text-xs text-[#8B8988] mt-0.5 font-medium">
              6-month historical trajectory of grievance intake, disposal volume, and pending pipelines
            </p>
          </div>

          {/* Metric filter buttons */}
          <div className="flex items-center gap-1 bg-[#13131E] p-1 rounded-xl border border-[#232234] text-xs">
            {['All', 'Filed', 'Resolved', 'Pending', 'Overdue'].map((m) => (
              <button
                key={m}
                onClick={() => setTrendMetric(m)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  trendMetric === m
                    ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_12px_rgba(147,18,255,0.4)] font-bold'
                    : 'text-[#8B8988] hover:text-[#F7F7F8]'
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1E2E" vertical={false} />
              <XAxis dataKey="month" stroke="#8B8988" fontSize={11} tickLine={false} />
              <YAxis stroke="#8B8988" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0D0D14',
                  borderColor: '#2A293E',
                  color: '#F7F7F8',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 0 25px rgba(0,0,0,0.8)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#8B8988' }} />

              {(trendMetric === 'All' || trendMetric === 'Filed') && (
                <Line
                  type="monotone"
                  dataKey="filed"
                  name="Filed Grievances"
                  stroke="#A020FF"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#A020FF' }}
                  activeDot={{ r: 6 }}
                />
              )}
              {(trendMetric === 'All' || trendMetric === 'Resolved') && (
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved Cases"
                  stroke="#45B558"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#45B558' }}
                  activeDot={{ r: 6 }}
                />
              )}
              {(trendMetric === 'All' || trendMetric === 'Pending') && (
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Under Inquiry"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#F59E0B' }}
                />
              )}
              {(trendMetric === 'All' || trendMetric === 'Overdue') && (
                <Line
                  type="monotone"
                  dataKey="overdue"
                  name="Overdue Breaches"
                  stroke="#F03B2A"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#F03B2A' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS SECTION 2: Workload & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bureau-Wise Workload Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-md hover:border-[#3A3854] transition">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide">Bureau-Wise Workload Distribution</h3>
              <p className="text-xs text-[#8B8988]">Active vs. overdue cases per bureau (PGRC, RB, AB, PAPB, ARC, SDC)</p>
            </div>
          </div>
          <div className="h-72 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={260} minWidth={100}>
              <BarChart
                data={normalizedBureauWorkload}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1E2E" vertical={false} />
                <XAxis 
                  dataKey="bureau_short" 
                  stroke="#8B8988" 
                  fontSize={11} 
                  tickLine={false}
                />
                <YAxis stroke="#8B8988" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D0D14', 
                    borderColor: '#2A293E', 
                    color: '#F7F7F8',
                    borderRadius: '12px', 
                    fontSize: '12px',
                    boxShadow: '0 0 25px rgba(0,0,0,0.8)'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#8B8988' }} />
                <Bar dataKey="active" name="Active Cases" fill="#9312FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue SLA" fill="#F03B2A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disposed" name="Disposed" fill="#45B558" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution Donut Chart with Total in Center (1 Col) */}
        <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-md hover:border-[#3A3854] transition flex flex-col justify-between relative">
          <div>
            <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide">Status Breakdown</h3>
            <p className="text-xs text-[#8B8988]">Current lifecycle states of complaints</p>
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
                        fill={STATUS_COLORS[entry.name] || '#8B8988'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0D0D14', 
                      borderColor: '#2A293E', 
                      color: '#F7F7F8',
                      borderRadius: '12px', 
                      fontSize: '12px',
                      boxShadow: '0 0 25px rgba(0,0,0,0.8)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#8B8988]">
                No active status distribution records
              </div>
            )}

            {/* Total count in center of donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#F7F7F8] font-mono leading-none drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                {totalCasesForDonut}
              </span>
              <span className="text-[10px] text-[#8B8988] font-semibold uppercase tracking-wider mt-0.5">
                Total Cases
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8B8988] pt-2 border-t border-[#1F1E2E]">
            {normalizedStatusDist.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: STATUS_COLORS[item.name] || '#8B8988' }}
                />
                <span className="truncate">{item.name}:</span>
                <span className="font-bold text-[#F7F7F8] ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Approaching Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases Table (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-md hover:border-[#3A3854] transition">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide">Recent Case Intake</h3>
              <p className="text-xs text-[#8B8988]">Latest technical institution complaints filed</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs text-[#D8B4FE] hover:text-[#FFFFFF] flex items-center gap-1 font-semibold transition"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#13131E] text-[#8B8988] uppercase text-[10px] tracking-wider border-b border-[#232234]">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-3">Bureau</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1E2E] text-[#F7F7F8]">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#181826] transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#D8B4FE] whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate" title={c.institution_name}>
                      <button
                        onClick={() => onViewInstitution(c.institution_id)}
                        className="text-[#F7F7F8] hover:text-[#D8B4FE] font-medium truncate text-left block transition"
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
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#13131E] hover:bg-[#9312FF]/20 text-[#D8B4FE] font-semibold border border-[#2A293E] hover:border-[#9312FF]/50 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {recentCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#8B8988]">
                      No recent cases recorded for this bureau filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approaching Deadlines Widget (1 Col) */}
        <div className="bg-[#0D0D14] border border-[#232234] rounded-2xl p-5 shadow-md hover:border-[#3A3854] transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-sm font-bold text-[#F7F7F8] tracking-wide">Target Deadlines in 7 Days</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                Action Required
              </span>
            </div>
            <p className="text-xs text-[#8B8988] mb-4">
              Pending cases approaching statutory SLA resolution limits
            </p>

            <div className="space-y-2.5">
              {approachingDeadlines.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="p-3 rounded-xl bg-[#13131E] hover:bg-[#181826] border border-[#232234] hover:border-[#F59E0B]/50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#D8B4FE]">
                      {c.case_id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/35">
                      Due in {c.days_remaining}d
                    </span>
                  </div>
                  <p className="text-xs text-[#F7F7F8] font-semibold truncate mt-1" title={c.subject}>
                    {c.subject}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#8B8988] mt-1">
                    <span className="truncate max-w-[150px]">{c.institution_name}</span>
                    <span>{formatDate(c.due_date)}</span>
                  </div>
                </div>
              ))}

              {approachingDeadlines.length === 0 && (
                <p className="text-xs text-[#8B8988] text-center py-6">
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
