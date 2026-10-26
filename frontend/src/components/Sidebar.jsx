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
      className={`bg-[#0D0D14] border-r border-[#232234] shadow-xl transition-all duration-300 flex flex-col justify-between z-20 flex-shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className={`p-4 border-b border-[#232234] flex items-center bg-[#0D0D14] ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="p-1 rounded-xl bg-[#13131E] border border-[#3A3854] shadow-[0_0_15px_rgba(147,18,255,0.25)] flex items-center justify-center flex-shrink-0">
            <img 
              src="/anvesh_logo.png" 
              alt="ANVESH" 
              className="w-8 h-8 object-contain rounded-lg" 
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="font-extrabold text-lg tracking-wider text-[#F7F7F8] block leading-none flex items-center gap-1.5">
                ANVESH
                <span className="w-1.5 h-1.5 rounded-full bg-[#9312FF] shadow-[0_0_8px_#9312FF]"></span>
              </span>
              <span className="text-[10px] text-[#8B8988] block truncate font-medium mt-1">
                AICTE Grievance Intelligence
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
                  <div className="px-3 mb-1.5 text-[10px] font-bold tracking-widest text-[#8B8988] uppercase opacity-75">
                    {section.title}
                  </div>
                )}
                {isCollapsed && sIdx > 0 && (
                  <div className="my-2 border-t border-[#232234]" />
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                          isActive
                            ? 'bg-gradient-to-r from-[#9312FF]/25 to-[#7A1CF8]/10 text-[#F7F7F8] font-bold border-l-4 border-[#9312FF] shadow-[0_0_15px_rgba(147,18,255,0.15)]'
                            : 'text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#181826] font-medium'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 transition ${isActive ? 'text-[#A020FF] drop-shadow-[0_0_8px_rgba(160,32,255,0.6)]' : 'text-[#8B8988]'}`} />
                        {!isCollapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#9312FF]/25 text-[#D8B4FE] border-[#9312FF]/50 shadow-[0_0_8px_rgba(147,18,255,0.3)]">
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
      <div className="p-3 border-t border-[#232234] bg-[#0D0D14]">
        {!isCollapsed && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-[#13131E] border border-[#232234] text-[11px] text-[#8B8988] space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#F7F7F8] font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-[#9312FF] shadow-[0_0_8px_#9312FF]"></span>
                Royal Violet v2.5
              </span>
              <span className="text-[#A020FF] font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#9312FF]/15 border border-[#9312FF]/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-[#8B8988] truncate mt-0.5">
              Role: <span className="font-semibold text-[#F7F7F8]">{currentRole?.role || 'Guest'}</span>
            </p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#181826] transition border border-transparent hover:border-[#232234]"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
