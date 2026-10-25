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
  RefreshCw,
  Layers
} from 'lucide-react';

export function Notifications({ onViewCase, onViewOverlap }) {
  const { currentRole, refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'complaints', 'overlaps', 'slas'
  const [selectedBureau, setSelectedBureau] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      setError(null);
      // For Administrator: pass selectedBureau if filtered, or null for all departments
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
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      n.title?.toLowerCase().includes(term) ||
      n.message?.toLowerCase().includes(term) ||
      n.bureau?.toLowerCase().includes(term) ||
      (n.complaint_id && String(n.complaint_id).includes(term))
    );
  });

  const getIcon = (type, severity) => {
    if (type === 'OVERDUE_ALERT' || severity === 'urgent') {
      return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    }
    if (type === 'UPCOMING_DEADLINE') {
      return <Clock className="w-5 h-5 text-amber-600" />;
    }
    if (type === 'OVERLAP_DETECTED' || type === 'OVERLAP_DECIDED') {
      return <GitMerge className="w-5 h-5 text-purple-600" />;
    }
    if (type === 'ESCALATION') {
      return <ShieldAlert className="w-5 h-5 text-rose-600" />;
    }
    if (type === 'EVIDENCE_SUBMITTED') {
      return <FileText className="w-5 h-5 text-indigo-600" />;
    }
    if (type === 'OFFICER_ASSIGNED') {
      return <UserCheck className="w-5 h-5 text-emerald-600" />;
    }
    if (type === 'CASE_VERIFIED') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    }
    if (type === 'CASE_REJECTED') {
      return <XCircle className="w-5 h-5 text-rose-600" />;
    }
    if (type === 'TRANSFER') {
      return <ArrowRightLeft className="w-5 h-5 text-amber-600" />;
    }
    if (type === 'NEW_COMPLAINT') {
      return <FilePlus className="w-5 h-5 text-[#0845A8]" />;
    }
    if (type === 'STATUS_UPDATE') {
      return <Activity className="w-5 h-5 text-blue-600" />;
    }
    return <AlertCircle className="w-5 h-5 text-[#0845A8]" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Notification & Intelligence Feed</h1>
            {currentRole?.canEditAll && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                Global Central Feed (All Departments)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-department updates for complaint submissions, status transitions, officer assignments, and statutory alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchNotifs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
            title="Refresh Notification Feed"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition"
          >
            <CheckCheck className="w-4 h-4 text-[#0845A8]" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar: Category Tabs & Department Dropdown */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-[#0845A8] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>All Events</span>
            </button>

            <button
              onClick={() => setCategoryFilter('complaints')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'complaints'
                  ? 'bg-[#0845A8] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>SLA Deadlines</span>
            </button>
          </div>

          {/* Department Filter (Admin Oversight) */}
          {currentRole?.canEditAll && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3.5 h-3.5" />
                Department:
              </span>
              <select
                value={selectedBureau}
                onChange={(e) => setSelectedBureau(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0845A8]"
              >
                <option value="All">All Departments (Global)</option>
                {BUREAUS.filter(b => b !== 'All').map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search bar & Unread toggle */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notifications by case ID, keyword, bureau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-[#0845A8]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !unreadOnly
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Statuses ({filteredNotifications.length})
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                unreadOnly
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
        <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">{error}</div>
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
                  ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-300 shadow-sm'
                  : 'bg-white border-slate-200 opacity-90 shadow-xs'
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex-shrink-0 mt-0.5 shadow-xs">
                {getIcon(n.type, n.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold leading-tight ${!n.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>

                <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.bureau && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {n.bureau}
                      </span>
                    )}
                    {n.complaint_id && (
                      <button
                        onClick={() => onViewCase(n.complaint_id)}
                        className="text-xs text-[#0845A8] font-bold hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                      >
                        Inspect Case <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {n.type && (n.type === 'OVERLAP_DETECTED' || n.type === 'OVERLAP_DECIDED') && onViewOverlap && (
                      <button
                        onClick={() => onViewOverlap()}
                        className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>Overlap Intelligence</span>
                      </button>
                    )}
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-2 py-0.5 rounded hover:bg-slate-100"
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
