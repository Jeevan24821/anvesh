import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../utils/formatters';
import { BUREAUS } from '../utils/constants';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Clock, 
  GitMerge, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  FileText,
  UserCheck,
  CheckCircle2,
  ArrowRightLeft,
  FilePlus,
  XCircle,
  Activity,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

export function Notifications({ onViewCase, onViewOverlap, initialFilter = {} }) {
  const { currentRole, refreshNotifications } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'complaints', 'overlaps', 'slas'
  const [selectedBureau, setSelectedBureau] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [actorSearchTerm, setActorSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuditMode = Boolean(initialFilter?.audit_mode);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      setError(null);
      const bureauParam = currentRole?.canEditAll 
        ? (selectedBureau !== 'All' ? selectedBureau : null) 
        : currentRole?.bureau;

      const data = await api.getNotifications({
        bureau: bureauParam,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        unread_only: unreadOnly,
        limit: 300
      });
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const handleFocus = () => fetchNotifs();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchNotifs, 15000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [unreadOnly, categoryFilter, selectedBureau, currentRole]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifs();
      if (refreshNotifications) refreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const bureauParam = currentRole?.canEditAll 
        ? (selectedBureau !== 'All' ? selectedBureau : null) 
        : currentRole?.bureau;
      await api.markAllNotificationsRead(bureauParam);
      fetchNotifs();
      if (refreshNotifications) refreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesKeyword = (
        n.title?.toLowerCase().includes(term) ||
        n.message?.toLowerCase().includes(term) ||
        n.bureau?.toLowerCase().includes(term) ||
        (n.complaint_id && String(n.complaint_id).includes(term))
      );
      if (!matchesKeyword) return false;
    }

    if (actorSearchTerm.trim()) {
      const actorTerm = actorSearchTerm.toLowerCase();
      const matchesActor = (
        n.message?.toLowerCase().includes(actorTerm) ||
        n.title?.toLowerCase().includes(actorTerm) ||
        n.bureau?.toLowerCase().includes(actorTerm)
      );
      if (!matchesActor) return false;
    }

    return true;
  });

  const getIcon = (type, severity) => {
    if (type === 'OVERDUE_ALERT' || severity === 'urgent') {
      return <AlertTriangle className="w-5 h-5 text-[#DC3545]" />;
    }
    if (type === 'UPCOMING_DEADLINE') {
      return <Clock className="w-5 h-5 text-[#F59E0B]" />;
    }
    if (type === 'OVERLAP_DETECTED' || type === 'OVERLAP_DECIDED') {
      return <GitMerge className="w-5 h-5 text-[#0645A8]" />;
    }
    if (type === 'ESCALATION') {
      return <ShieldAlert className="w-5 h-5 text-[#DC3545]" />;
    }
    if (type === 'EVIDENCE_SUBMITTED') {
      return <FileText className="w-5 h-5 text-[#0645A8]" />;
    }
    if (type === 'OFFICER_ASSIGNED') {
      return <UserCheck className="w-5 h-5 text-[#16A765]" />;
    }
    if (type === 'CASE_VERIFIED') {
      return <CheckCircle2 className="w-5 h-5 text-[#16A765]" />;
    }
    if (type === 'CASE_REJECTED') {
      return <XCircle className="w-5 h-5 text-[#DC3545]" />;
    }
    if (type === 'TRANSFER') {
      return <ArrowRightLeft className="w-5 h-5 text-[#F59E0B]" />;
    }
    if (type === 'NEW_COMPLAINT') {
      return <FilePlus className="w-5 h-5 text-[#0645A8]" />;
    }
    if (type === 'STATUS_UPDATE') {
      return <Activity className="w-5 h-5 text-[#0645A8]" />;
    }
    return <AlertCircle className="w-5 h-5 text-[#0645A8]" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-rise">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#172033] tracking-tight">
              {isAuditMode ? t('auditLogScrutiny', 'Audit Log Scrutiny & Statutory Ledger') : t('notifications', 'Notification & Intelligence Feed')}
            </h1>
            {currentRole?.canEditAll && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#0645A8] border border-[#BBD5F8] uppercase">
                Global Central Feed (All Departments)
              </span>
            )}
          </div>
          <p className="text-xs text-[#687386] mt-1">
            {isAuditMode 
              ? 'Complete, cryptographically structured audit trail of grievance status transitions, reviewer deliberations, officer assignments, and statutory SLA milestones.'
              : 'Real-time multi-department updates for complaint submissions, status transitions, officer assignments, and statutory alerts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchNotifs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F5F8] text-[#172033] border border-[#DCE3EC] hover:border-[#BBD5F8] text-xs font-semibold shadow-xs transition"
            title="Refresh Notification Feed"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#687386]" />
            <span>{t('refresh', 'Refresh')}</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F5F8] text-[#172033] border border-[#DCE3EC] hover:border-[#BBD5F8] text-xs font-semibold shadow-xs transition"
          >
            <CheckCheck className="w-4 h-4 text-[#0645A8]" />
            <span>{t('markAllRead', 'Mark All Read')}</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar: Category Tabs & Department Dropdown */}
      <div className="p-4 bg-white border border-[#DCE3EC] rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-[#0645A8] text-white shadow-xs'
                  : 'bg-white text-[#687386] hover:text-[#172033] hover:bg-[#F3F5F8] border border-[#DCE3EC]'
              }`}
            >
              <span>{t('allEvents', 'All Events')}</span>
            </button>

            <button
              onClick={() => setCategoryFilter('complaints')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'complaints'
                  ? 'bg-[#0645A8] text-white shadow-xs'
                  : 'bg-white text-[#687386] hover:text-[#172033] hover:bg-[#F3F5F8] border border-[#DCE3EC]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t('complaintUpdates', 'Complaint Updates & Changes')}</span>
            </button>

            {(currentRole?.role === 'Administrator' || currentRole?.canEditAll) && (
              <button
                onClick={() => setCategoryFilter('overlaps')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  categoryFilter === 'overlaps'
                    ? 'bg-[#0645A8] text-white shadow-xs'
                    : 'bg-white text-[#687386] hover:text-[#172033] hover:bg-[#F3F5F8] border border-[#DCE3EC]'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>{t('overlapIntelligence', 'Overlap Intelligence')}</span>
              </button>
            )}

            <button
              onClick={() => setCategoryFilter('slas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'slas'
                  ? 'bg-[#DC3545] text-white shadow-xs'
                  : 'bg-white text-[#687386] hover:text-[#172033] hover:bg-[#F3F5F8] border border-[#DCE3EC]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('slaDeadlines', 'SLA Deadlines')}</span>
            </button>
          </div>

          {/* Department Filter (Admin Oversight) */}
          {currentRole?.canEditAll && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#687386] flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#0645A8]" />
                {t('department', 'Department')}:
              </span>
              <select
                value={selectedBureau}
                onChange={(e) => setSelectedBureau(e.target.value)}
                className="p-1.5 bg-white border border-[#DCE3EC] rounded-lg text-[#172033] text-xs font-semibold focus:outline-none focus:border-[#0645A8]"
              >
                <option value="All">{t('allDepartments', 'All Departments (Global)')}</option>
                {BUREAUS.filter(b => b !== 'All').map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search bar & Actor search & Unread toggle */}
        <div className="pt-2 border-t border-[#DCE3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#687386] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by case ID, keyword, bureau..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#DCE3EC] rounded-lg text-[#172033] placeholder-[#687386] text-xs focus:outline-none focus:border-[#0645A8]"
              />
            </div>

            <div className="relative flex-1 w-full max-w-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#687386] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Actor / Official..."
                value={actorSearchTerm}
                onChange={(e) => setActorSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#DCE3EC] rounded-lg text-[#172033] placeholder-[#687386] text-xs focus:outline-none focus:border-[#0645A8]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !unreadOnly
                  ? 'bg-[#0645A8] text-white shadow-xs'
                  : 'bg-white text-[#687386] hover:text-[#172033] border border-[#DCE3EC]'
              }`}
            >
              {t('allStatuses', 'All Statuses')} ({filteredNotifications.length})
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                unreadOnly
                  ? 'bg-[#0645A8] text-white shadow-xs'
                  : 'bg-white text-[#687386] hover:text-[#172033] border border-[#DCE3EC]'
              }`}
            >
              {t('unreadOnly', 'Unread Only')}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      {loading ? (
        <LoadingSpinner text={t('loading', 'Retrieving real-time alerts...')} />
      ) : error ? (
        <div className="p-8 text-center text-[#DC3545] bg-[#DC3545]/10 border border-[#DC3545]/30 rounded-xl">{error}</div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title={t('noNotifications', 'No notifications to display')}
          description={unreadOnly ? "You're all caught up! No unread notifications." : "No notifications match your current filter criteria."}
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition flex items-start gap-3.5 ${
                !n.is_read
                  ? 'bg-[#EAF3FF] border-[#BBD5F8] shadow-xs ring-1 ring-[#0645A8]/20'
                  : 'bg-white border-[#DCE3EC] hover:bg-[#F8FAFC] shadow-xs'
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-[#DCE3EC] flex-shrink-0 mt-0.5 shadow-xs">
                {getIcon(n.type, n.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold leading-tight ${!n.is_read ? 'text-[#0645A8]' : 'text-[#172033]'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-[#687386] whitespace-nowrap">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>

                <p className="text-xs text-[#687386] mt-1 leading-relaxed">
                  {n.message}
                </p>

                <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.bureau && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#687386] border border-[#DCE3EC] font-semibold">
                        {n.bureau}
                      </span>
                    )}
                    {n.complaint_id && (
                      <button
                        onClick={() => onViewCase(n.complaint_id)}
                        className="text-xs text-[#0645A8] font-bold hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#BBD5F8] transition"
                      >
                        {t('inspectCase', 'Inspect Case')} <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {n.type && (n.type === 'OVERLAP_DETECTED' || n.type === 'OVERLAP_DECIDED') && onViewOverlap && (
                      <button
                        onClick={() => onViewOverlap()}
                        className="text-xs text-[#0645A8] font-bold hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#BBD5F8] transition"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>{t('overlapIntelligence', 'Overlap Intelligence')}</span>
                      </button>
                    )}
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-[#687386] hover:text-[#172033] font-medium px-2 py-0.5 rounded hover:bg-[#F3F5F8] transition"
                    >
                      {t('dismiss', 'Dismiss')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Notifications;
