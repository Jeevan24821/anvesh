import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  GitMerge, 
  BarChart3, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Settings as SettingsIcon,
  SearchCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ activePage, onNavigate, isCollapsed, onToggleCollapse, overlapCount = 0 }) {
  const { currentRole } = useAuth();
  const isComplainant = currentRole?.role === 'Complainant';

  // Navigation Items according to ANVESH Modern Specification
  const navSections = [
    {
      title: 'OPERATIONAL',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'complaints',
          label: isComplainant ? 'My Grievances' : 'All Grievances',
          icon: FileText,
          roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'review_queues',
          label: 'Review Queues',
          icon: ClipboardList,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
          onClick: () => onNavigate('complaints', { status: 'Pending Verification', filter_label: 'Review Queue' }),
        },
        {
          id: 'inspect_queue',
          label: 'Inspect Queue',
          icon: AlertTriangle,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
          badge: 'SLA Priority',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          onClick: () => onNavigate('complaints', { overdue_only: true, filter_label: 'Inspect Queue (SLA Breach Warnings)' }),
        },
      ]
    },
    {
      title: 'INTELLIGENCE & DIRECTORY',
      items: [
        {
          id: 'overlaps',
          label: 'Overlap Intelligence',
          icon: GitMerge,
          roles: ['Administrator', 'Reviewer'],
          badge: overlapCount > 0 ? overlapCount : null,
          badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        },
        {
          id: 'institutions',
          label: 'Institutions',
          icon: Building2,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'reports',
          label: 'Analytics & SLA',
          icon: BarChart3,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'audit_logs',
          label: 'Audit Log Scrutiny',
          icon: ShieldCheck,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
          onClick: () => onNavigate('notifications', { audit_mode: true }),
        },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: SettingsIcon,
          roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
        }
      ]
    }
  ];

  return (
    <aside 
      className={`bg-white border-r border-slate-200 shadow-xs transition-all duration-300 flex flex-col justify-between z-20 flex-shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-200 flex items-center bg-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img 
            src="/anvesh_logo.png" 
            alt="ANVESH" 
            className="w-9 h-9 object-contain rounded-lg p-0.5 bg-slate-50 border border-slate-200 shadow-2xs flex-shrink-0" 
          />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="font-extrabold text-lg tracking-wider text-[#0F172A] block leading-none">
                ANVESH
              </span>
              <span className="text-[10px] text-[#64748B] block truncate font-medium mt-1">
                AICTE Grievance Platform
              </span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => 
              !currentRole?.role || item.roles.includes(currentRole?.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                {!isCollapsed && (
                  <div className="px-3 mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {section.title}
                  </div>
                )}
                {isCollapsed && sIdx > 0 && (
                  <div className="my-2 border-t border-slate-100" />
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;

                    const handleClick = () => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        onNavigate(item.id);
                      }
                    };

                    return (
                      <button
                        key={item.id}
                        onClick={handleClick}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                          isActive
                            ? 'bg-teal-50 text-teal-800 font-semibold border-l-4 border-[#0D9488]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0D9488]' : 'text-slate-500'}`} />
                        {!isCollapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            item.badgeColor || (isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 border-slate-200')
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-slate-200 bg-white">
        {!isCollapsed && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                ANVESH v2.0
              </span>
              <span className="text-teal-700 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              Role: <span className="font-semibold text-slate-700">{currentRole?.role || 'Guest'}</span>
            </p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
