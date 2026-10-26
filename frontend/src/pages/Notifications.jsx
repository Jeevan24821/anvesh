import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
      return <AlertTriangle className="w-5 h-5 text-[#F03B2A]" />;
    }
    if (type === 'UPCOMING_DEADLINE') {
      return <Clock className="w-5 h-5 text-[#F59E0B]" />;
    }
    if (type === 'OVERLAP_DETECTED' || type === 'OVERLAP_DECIDED') {
      return <GitMerge className="w-5 h-5 text-[#D8B4FE]" />;
    }
    if (type === 'ESCALATION') {
      return <ShieldAlert className="w-5 h-5 text-[#F03B2A]" />;
    }
    if (type === 'EVIDENCE_SUBMITTED') {
      return <FileText className="w-5 h-5 text-[#D8B4FE]" />;
    }
    if (type === 'OFFICER_ASSIGNED') {
      return <UserCheck className="w-5 h-5 text-[#45B558]" />;
    }
    if (type === 'CASE_VERIFIED') {
      return <CheckCircle2 className="w-5 h-5 text-[#45B558]" />;
    }
    if (type === 'CASE_REJECTED') {
      return <XCircle className="w-5 h-5 text-[#F03B2A]" />;
    }
    if (type === 'TRANSFER') {
      return <ArrowRightLeft className="w-5 h-5 text-[#F59E0B]" />;
    }
    if (type === 'NEW_COMPLAINT') {
      return <FilePlus className="w-5 h-5 text-[#9312FF]" />;
    }
    if (type === 'STATUS_UPDATE') {
      return <Activity className="w-5 h-5 text-[#D8B4FE]" />;
    }
    return <AlertCircle className="w-5 h-5 text-[#9312FF]" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#F7F7F8] tracking-tight">
              {isAuditMode ? 'Audit Log Scrutiny & Statutory Ledger' : 'Notification & Intelligence Feed'}
            </h1>
            {currentRole?.canEditAll && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#9312FF]/15 text-[#D8B4FE] border border-[#9312FF]/30 uppercase">
                Global Central Feed (All Departments)
              </span>
            )}
          </div>
          <p className="text-xs text-[#8B8988] mt-1">
            {isAuditMode 
              ? 'Complete, cryptographically structured audit trail of grievance status transitions, reviewer deliberations, officer assignments, and statutory SLA milestones.'
              : 'Real-time multi-department updates for complaint submissions, status transitions, officer assignments, and statutory alerts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchNotifs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13131E] hover:bg-[#1A1926] text-[#F7F7F8] border border-[#232234] hover:border-[#3A3854] text-xs font-semibold shadow-xs transition"
            title="Refresh Notification Feed"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8B8988]" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13131E] hover:bg-[#1A1926] text-[#F7F7F8] border border-[#232234] hover:border-[#3A3854] text-xs font-semibold shadow-xs transition"
          >
            <CheckCheck className="w-4 h-4 text-[#D8B4FE]" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar: Category Tabs & Department Dropdown */}
      <div className="p-4 bg-[#0D0D14] border border-[#232234] rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_10px_rgba(147,18,255,0.3)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#1A1926] border border-[#232234]'
              }`}
            >
              <span>All Events</span>
            </button>

            <button
              onClick={() => setCategoryFilter('complaints')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'complaints'
                  ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_10px_rgba(147,18,255,0.3)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#1A1926] border border-[#232234]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Complaint Updates & Changes</span>
            </button>

            {(currentRole?.role === 'Administrator' || currentRole?.canEditAll) && (
              <button
                onClick={() => setCategoryFilter('overlaps')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  categoryFilter === 'overlaps'
                    ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_10px_rgba(147,18,255,0.3)]'
                    : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#1A1926] border border-[#232234]'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Overlap Intelligence</span>
              </button>
            )}

            <button
              onClick={() => setCategoryFilter('slas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'slas'
                  ? 'bg-gradient-to-r from-[#F03B2A] to-[#DC2626] text-white shadow-[0_0_10px_rgba(240,59,42,0.3)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#1A1926] border border-[#232234]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>SLA Deadlines</span>
            </button>
          </div>

          {/* Department Filter (Admin Oversight) */}
          {currentRole?.canEditAll && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#8B8988] flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#D8B4FE]" />
                Department:
              </span>
              <select
                value={selectedBureau}
                onChange={(e) => setSelectedBureau(e.target.value)}
                className="p-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-[#F7F7F8] text-xs font-semibold focus:outline-none focus:border-[#9312FF]"
              >
                <option value="All">All Departments (Global)</option>
                {BUREAUS.filter(b => b !== 'All').map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search bar & Actor search & Unread toggle */}
        <div className="pt-2 border-t border-[#232234] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#8B8988] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by case ID, keyword, bureau..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-[#F7F7F8] placeholder-[#8B8988] text-xs focus:outline-none focus:border-[#9312FF]"
              />
            </div>

            <div className="relative flex-1 w-full max-w-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#8B8988] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Actor / Official..."
                value={actorSearchTerm}
                onChange={(e) => setActorSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#13131E] border border-[#232234] rounded-lg text-[#F7F7F8] placeholder-[#8B8988] text-xs focus:outline-none focus:border-[#9312FF]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !unreadOnly
                  ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_10px_rgba(147,18,255,0.3)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234]'
              }`}
            >
              All Statuses ({filteredNotifications.length})
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                unreadOnly
                  ? 'bg-gradient-to-r from-[#9312FF] to-[#7A1CF8] text-white shadow-[0_0_10px_rgba(147,18,255,0.3)]'
                  : 'bg-[#13131E] text-[#8B8988] hover:text-[#F7F7F8] border border-[#232234]'
              }`}
            >
              Unread Only
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      {loading ? (
        <LoadingSpinner text="Retrieving real-time alerts..." />
      ) : error ? (
        <div className="p-8 text-center text-[#F03B2A] bg-[#F03B2A]/10 border border-[#F03B2A]/30 rounded-xl">{error}</div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications to display"
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
                  ? 'bg-[#13131E] border-[#9312FF]/50 shadow-[0_0_15px_rgba(147,18,255,0.15)] ring-1 ring-[#9312FF]/30'
                  : 'bg-[#0D0D14] border-[#232234] opacity-80 hover:opacity-100 shadow-xs'
              }`}
            >
              <div className="p-2 rounded-lg bg-[#0D0D14] border border-[#232234] flex-shrink-0 mt-0.5 shadow-xs">
                {getIcon(n.type, n.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold leading-tight ${!n.is_read ? 'text-[#F7F7F8]' : 'text-[#8B8988]'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-[#8B8988] whitespace-nowrap">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>

                <p className="text-xs text-[#8B8988] mt-1 leading-relaxed">
                  {n.message}
                </p>

                <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.bureau && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D0D14] text-[#8B8988] border border-[#232234] font-semibold">
                        {n.bureau}
                      </span>
                    )}
                    {n.complaint_id && (
                      <button
                        onClick={() => onViewCase(n.complaint_id)}
                        className="text-xs text-[#D8B4FE] font-bold hover:underline flex items-center gap-1 bg-[#9312FF]/15 px-2 py-0.5 rounded border border-[#9312FF]/30 transition"
                      >
                        Inspect Case <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {n.type && (n.type === 'OVERLAP_DETECTED' || n.type === 'OVERLAP_DECIDED') && onViewOverlap && (
                      <button
                        onClick={() => onViewOverlap()}
                        className="text-xs text-[#D8B4FE] font-bold hover:underline flex items-center gap-1 bg-[#9312FF]/15 px-2 py-0.5 rounded border border-[#9312FF]/30 transition"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>Overlap Intelligence</span>
                      </button>
                    )}
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-[#8B8988] hover:text-[#F7F7F8] font-medium px-2 py-0.5 rounded hover:bg-[#1A1926] transition"
                    >
                      Dismiss
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
