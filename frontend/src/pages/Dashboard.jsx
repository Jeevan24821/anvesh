import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  'Submitted': '#0645A8',
  'Pending Verification': '#1769D2',
  'Needs More Information': '#F59E0B',
  'Under Review': '#083B8D',
  'New': '#0645A8',
  'Pending Bureau Review': '#2563EB',
  'Under Process': '#0284C7',
  'Hearing Scheduled': '#D97706',
  'Action Taken Report Awaited': '#F59E0B',
  'Joint Investigation': '#4F46E5',
  'Escalated to Committee': '#DC3545',
  'Disposed': '#16A765',
  'Resolved': '#16A765',
  'Transferred': '#7C3AED',
  'Duplicate Linked': '#687386',
  'Rejected': '#DC3545'
};

export function Dashboard({ onNavigate, onViewCase, onViewInstitution }) {
  const { currentRole } = useAuth();
  const { t } = useLanguage();
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
      <div className="p-8 text-center bg-white border border-red-200 rounded-2xl m-6 shadow-xs animate-fade-in">
        <AlertTriangle className="w-10 h-10 text-[#DC3545] mx-auto mb-2" />
        <h3 className="text-lg font-bold text-[#172033]">Dashboard Metrics Unavailable</h3>
        <p className="text-sm text-[#687386] mt-1">{error}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-[#0645A8] hover:bg-[#1769D2] text-white text-sm font-semibold rounded-xl transition shadow-xs"
        >
          {t('action_refresh')}
        </button>
      </div>
    );
  }

  // Complainant specific dashboard view
  if (isComplainant) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Modern Blue & White Dashboard Hero (Complainant) */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(6,69,168,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A765] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#16A765]" />
              Institutional Complainant Access • Confidential Protection Active
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172033]">
              <span className="text-[#0645A8]">
                {t('brand_name')}
              </span>
              <span className="block text-xl sm:text-2xl font-bold text-[#172033] mt-1">
                {t('dashboard_hero_title')}
              </span>
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-[#1769D2] tracking-wide">
              {t('dashboard_hero_subtitle')}
            </p>

            <p className="text-xs text-[#687386] leading-relaxed max-w-xl mx-auto">
              {t('dashboard_hero_desc')}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('complaints')}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-150 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('lodge_grievance')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Complainant Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t('metric_total_grievances')}
            value={stats?.total_cases || 0}
            subtitle={t('metric_subtitle_registered')}
            icon={FileText}
            color="blue"
            onClick={() => onNavigate('complaints')}
          />
          <MetricCard
            title={t('metric_active_cases')}
            value={stats?.under_process_cases || 0}
            subtitle={t('metric_subtitle_in_progress')}
            icon={Clock}
            color="sky"
            onClick={() => onNavigate('complaints')}
          />
          <MetricCard
            title={t('metric_overdue_alerts')}
            value={stats?.pending_verification || 0}
            subtitle={t('metric_subtitle_overdue')}
            icon={HelpCircle}
            color="amber"
            alert={stats?.pending_verification > 0}
            onClick={() => onNavigate('complaints')}
          />
          <MetricCard
            title={t('metric_disposed_cases')}
            value={stats?.disposed_cases || 0}
            subtitle={t('metric_subtitle_resolved')}
            icon={CheckCircle2}
            color="emerald"
            onClick={() => onNavigate('complaints')}
          />
        </div>

        {/* Recent Grievances List */}
        <div className="bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EC]">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">{t('nav_my_grievances')}</h3>
              <p className="text-xs text-[#687386]">Track resolution progress, assigned bureau, and officer responses</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs text-[#0645A8] hover:text-[#1769D2] font-bold flex items-center gap-1 transition"
            >
              <span>{t('action_view_details')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#687386] uppercase text-[10px] tracking-wider border-b border-[#DCE3EC]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">{t('table_case_id')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_subject')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_bureau')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_status')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_date')}</th>
                  <th className="py-2.5 px-3 font-semibold">Statutory SLA Target</th>
                  <th className="py-2.5 px-3 text-right font-semibold">{t('table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF0F6] text-[#172033]">
                {(stats?.recent_cases || []).map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition cursor-pointer" onClick={() => onViewCase(c.id)}>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0645A8] whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[260px]">
                      <span className="font-semibold text-[#172033] block truncate">{c.subject}</span>
                      <span className="text-[10px] text-[#687386]">{c.category}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <BureauBadge bureau={c.source_bureau} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} isComplainant={true} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#687386]">
                      <div className="font-semibold text-[#172033] text-xs">{formatDate(c.received_date)}</div>
                      {c.created_at && (
                        <div className="text-[10px] text-[#687386] font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-[#0645A8]" />
                          <span>{formatTimeOnly(c.created_at) || '09:00 UTC'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-[#0645A8] font-bold">
                        {formatDate(c.due_date)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCase(c.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#EAF3FF] hover:bg-blue-100 text-[#0645A8] border border-[#0645A8]/20 transition shadow-2xs"
                      >
                        {t('action_view_details')}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!stats?.recent_cases || stats.recent_cases.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#687386]">
                      {t('no_records_found')}
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Modern Blue & White Dashboard Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white p-7 sm:p-9 shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(6,69,168,0.09),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3FF] border border-[#0645A8]/25 text-[#0645A8] text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0645A8] animate-pulse" />
            AICTE Inter-Bureau Redressal Mesh
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0645A8]">
              {t('brand_name')}
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] mt-1">
              {t('dashboard_hero_title')}
            </h2>
          </div>

          <p className="text-sm sm:text-base font-semibold text-[#1769D2] tracking-wide">
            {t('dashboard_hero_subtitle')}
          </p>

          <p className="text-xs sm:text-sm text-[#687386] leading-relaxed max-w-2xl mx-auto">
            {t('dashboard_hero_desc')}
          </p>

          {/* Hero Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('complaints')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0645A8] hover:bg-[#1769D2] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-150 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{t('nav_all_grievances')}</span>
            </button>

            <button
              onClick={() => onNavigate('overlaps')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-[#F3F5F8] text-[#0645A8] border border-[#0645A8]/30 shadow-xs hover:-translate-y-0.5 transition duration-150 flex items-center gap-2"
            >
              <GitMerge className="w-4 h-4 text-[#0645A8]" />
              <span>{t('explore_overlaps')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner & Bureau Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#DCE3EC] p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-[#172033] tracking-tight">{t('dashboard_hero_title')}</h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EAF3FF] text-[#0645A8] border border-[#0645A8]/25 font-bold uppercase tracking-wider">
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-[#687386] mt-1 font-medium">
            Real-time monitoring across PGRC, Regulation Bureau (RB), Approval Bureau (AB), Anti-Ragging Cell, and Skill Cell.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#F3F5F8] px-3.5 py-1.5 rounded-xl border border-[#DCE3EC] text-xs text-[#172033]">
            <Filter className="w-3.5 h-3.5 text-[#0645A8]" />
            <span className="text-[#687386] font-medium">{t('table_bureau')}:</span>
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              className="bg-transparent text-[#172033] font-semibold focus:outline-none cursor-pointer"
            >
              {BUREAUS.map((b) => (
                <option key={b} value={b} className="bg-white text-[#172033]">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-white hover:bg-[#F3F5F8] border border-[#DCE3EC] text-[#687386] hover:text-[#0645A8] transition shadow-xs"
            title={t('action_refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Critical Overdue SLA Alert Banner */}
      {stats?.overdue_cases > 0 && (
        <div 
          onClick={() => onNavigate('complaints', { is_overdue: true })}
          className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-red-400 transition group shadow-xs text-[#172033]"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-100 text-[#DC3545] border border-red-200 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#DC3545]">
                {stats.overdue_cases} Institution Grievances Have Breached Statutory SLA Deadlines
              </h4>
              <p className="text-xs text-[#687386] mt-0.5">
                Immediate inter-bureau intervention required under AICTE Regulations 2019. Click to filter overdue cases.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#DC3545] group-hover:translate-x-1 transition">
            <span>Inspect Overdue</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('metric_total_grievances')}
          value={stats?.total_cases || 0}
          subtitle={t('metric_subtitle_registered')}
          icon={FileText}
          color="blue"
          onClick={() => onNavigate('complaints')}
        />
        <MetricCard
          title={t('metric_active_cases')}
          value={stats?.under_process_cases || 0}
          subtitle={t('metric_subtitle_in_progress')}
          icon={Clock}
          color="sky"
          onClick={() => onNavigate('complaints', { status: 'Under Process' })}
        />
        {isAdmin ? (
          <MetricCard
            title={t('metric_cross_bureau_overlaps')}
            value={stats?.cases_flagged_for_overlap || 0}
            subtitle={`${stats?.potential_match_pairs || 0} pairwise match alerts`}
            icon={GitMerge}
            color="violet"
            alert={(stats?.cases_flagged_for_overlap || 0) > 0}
            onClick={() => onNavigate('overlaps')}
          />
        ) : (
          <MetricCard
            title={t('status_pending_verification')}
            value={stats?.pending_cases || 0}
            subtitle="Intake verification pending"
            icon={FileText}
            color="amber"
            onClick={() => onNavigate('complaints', { status: 'Pending Verification' })}
          />
        )}
        <MetricCard
          title={t('metric_disposed_cases')}
          value={stats?.disposed_cases || 0}
          subtitle={`Disposal rate: ${stats?.total_cases ? ((stats.disposed_cases / stats.total_cases) * 100).toFixed(1) : 0}%`}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => onNavigate('complaints', { status: 'Disposed' })}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 shadow-xs hover:border-[#0645A8]/40 transition">
          <span className="text-[11px] font-semibold text-[#687386] uppercase tracking-wider">{t('status_pending_verification')}</span>
          <p className="text-xl font-black text-[#172033] mt-1">{stats?.pending_cases || 0}</p>
        </div>
        {isAdmin ? (
          <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 shadow-xs hover:border-[#0645A8]/40 transition">
            <span className="text-[11px] font-semibold text-[#687386] uppercase tracking-wider">Pending Overlap Decisions</span>
            <p className="text-xl font-black text-[#0645A8] mt-1">{stats?.pending_overlap_decisions || 0}</p>
          </div>
        ) : (
          <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 shadow-xs hover:border-[#0645A8]/40 transition">
            <span className="text-[11px] font-semibold text-[#687386] uppercase tracking-wider">Joint Panel Inquiries</span>
            <p className="text-xl font-black text-[#0645A8] mt-1">{stats?.joint_investigation_cases || 0}</p>
          </div>
        )}
        <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 shadow-xs hover:border-[#0645A8]/40 transition">
          <span className="text-[11px] font-semibold text-[#687386] uppercase tracking-wider">{t('status_transferred')}</span>
          <p className="text-xl font-black text-[#1769D2] mt-1">{stats?.transferred_cases || 0}</p>
        </div>
        <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 shadow-xs hover:border-[#0645A8]/40 transition">
          <span className="text-[11px] font-semibold text-[#687386] uppercase tracking-wider">Approaching SLA (7 Days)</span>
          <p className="text-xl font-black text-[#F59E0B] mt-1">{stats?.approaching_deadlines?.length || 0}</p>
        </div>
      </div>

      {/* CHARTS SECTION 1: COMPLAINT TREND LINE CHART WITH TOGGLE */}
      <div className="bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs hover:border-[#0645A8]/30 transition space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0645A8]" />
              <h3 className="text-sm font-bold text-[#172033] tracking-wide">
                Complaint Intake & Resolution Longitudinal Trends
              </h3>
            </div>
            <p className="text-xs text-[#687386] mt-0.5 font-medium">
              6-month historical trajectory of grievance intake, disposal volume, and pending pipelines
            </p>
          </div>

          {/* Metric filter buttons */}
          <div className="flex items-center gap-1 bg-[#F3F5F8] p-1 rounded-xl border border-[#DCE3EC] text-xs">
            {['All', 'Filed', 'Resolved', 'Pending', 'Overdue'].map((m) => (
              <button
                key={m}
                onClick={() => setTrendMetric(m)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  trendMetric === m
                    ? 'bg-[#0645A8] text-white shadow-xs font-bold'
                    : 'text-[#687386] hover:text-[#172033]'
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
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF0F6" vertical={false} />
              <XAxis dataKey="month" stroke="#687386" fontSize={11} tickLine={false} />
              <YAxis stroke="#687386" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DCE3EC',
                  color: '#172033',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#687386' }} />

              {(trendMetric === 'All' || trendMetric === 'Filed') && (
                <Line
                  type="monotone"
                  dataKey="filed"
                  name="Filed Grievances"
                  stroke="#0645A8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0645A8' }}
                  activeDot={{ r: 6 }}
                />
              )}
              {(trendMetric === 'All' || trendMetric === 'Resolved') && (
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved Cases"
                  stroke="#16A765"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#16A765' }}
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
                  stroke="#DC3545"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#DC3545' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS SECTION 2: Workload & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bureau-Wise Workload Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs hover:border-[#0645A8]/30 transition">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033] tracking-wide">Bureau-Wise Workload Distribution</h3>
              <p className="text-xs text-[#687386]">Active vs. overdue cases per bureau (PGRC, RB, AB, PAPB, ARC, SDC)</p>
            </div>
          </div>
          <div className="h-72 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={260} minWidth={100}>
              <BarChart
                data={normalizedBureauWorkload}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF0F6" vertical={false} />
                <XAxis 
                  dataKey="bureau_short" 
                  stroke="#687386" 
                  fontSize={11} 
                  tickLine={false}
                />
                <YAxis stroke="#687386" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#DCE3EC', 
                    color: '#172033',
                    borderRadius: '12px', 
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#687386' }} />
                <Bar dataKey="active" name="Active Cases" fill="#0645A8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue SLA" fill="#DC3545" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disposed" name="Disposed" fill="#16A765" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution Donut Chart with Total in Center (1 Col) */}
        <div className="bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs hover:border-[#0645A8]/30 transition flex flex-col justify-between relative">
          <div>
            <h3 className="text-sm font-bold text-[#172033] tracking-wide">Status Breakdown</h3>
            <p className="text-xs text-[#687386]">Current lifecycle states of complaints</p>
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
                        fill={STATUS_COLORS[entry.name] || '#687386'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#DCE3EC', 
                      color: '#172033',
                      borderRadius: '12px', 
                      fontSize: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#687386]">
                No active status distribution records
              </div>
            )}

            {/* Total count in center of donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#172033] font-mono leading-none">
                {totalCasesForDonut}
              </span>
              <span className="text-[10px] text-[#687386] font-semibold uppercase tracking-wider mt-0.5">
                Total Cases
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#687386] pt-2 border-t border-[#DCE3EC]">
            {normalizedStatusDist.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: STATUS_COLORS[item.name] || '#687386' }}
                />
                <span className="truncate">{item.name}:</span>
                <span className="font-bold text-[#172033] ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Approaching Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs hover:border-[#0645A8]/30 transition">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033] tracking-wide">Recent Case Intake</h3>
              <p className="text-xs text-[#687386]">Latest technical institution complaints filed</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs text-[#0645A8] hover:text-[#1769D2] flex items-center gap-1 font-semibold transition"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#687386] uppercase text-[10px] tracking-wider border-b border-[#DCE3EC]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">{t('table_case_id')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_institution')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_bureau')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_priority')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('table_status')}</th>
                  <th className="py-2.5 px-3 text-right font-semibold">{t('table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF0F6] text-[#172033]">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0645A8] whitespace-nowrap">
                      {c.case_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate" title={c.institution_name}>
                      <button
                        onClick={() => onViewInstitution(c.institution_id)}
                        className="text-[#172033] hover:text-[#0645A8] font-medium truncate text-left block transition"
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
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#EAF3FF] hover:bg-blue-100 text-[#0645A8] font-semibold border border-[#0645A8]/20 transition shadow-2xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {recentCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#687386]">
                      {t('no_records_found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approaching Deadlines Widget (1 Col) */}
        <div className="bg-white border border-[#DCE3EC] rounded-2xl p-5 shadow-xs hover:border-[#0645A8]/30 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-sm font-bold text-[#172033] tracking-wide">Target Deadlines in 7 Days</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200">
                Action Required
              </span>
            </div>
            <p className="text-xs text-[#687386] mb-4">
              Pending cases approaching statutory SLA resolution limits
            </p>

            <div className="space-y-2.5">
              {approachingDeadlines.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EAF3FF]/40 border border-[#DCE3EC] hover:border-[#0645A8]/40 cursor-pointer transition shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0645A8]">
                      {c.case_id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Due in {c.days_remaining}d
                    </span>
                  </div>
                  <p className="text-xs text-[#172033] font-semibold truncate mt-1" title={c.subject}>
                    {c.subject}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#687386] mt-1">
                    <span className="truncate max-w-[150px]">{c.institution_name}</span>
                    <span>{formatDate(c.due_date)}</span>
                  </div>
                </div>
              ))}

              {approachingDeadlines.length === 0 && (
                <p className="text-xs text-[#687386] text-center py-6">
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
