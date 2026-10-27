import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  GitMerge, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  ClipboardList,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Sidebar({ activePage, onNavigate, isCollapsed, onToggleCollapse, overlapCount = 0 }) {
  const { currentRole } = useAuth();
  const { t } = useLanguage();
  const isComplainant = currentRole?.role === 'Complainant';

  // Navigation Sections & Items with full bilingual localization
  const navSections = [
    {
      title: t('nav_operational', 'OPERATIONAL'),
      items: [
        {
          id: 'dashboard',
          label: t('nav_dashboard', 'Dashboard'),
          icon: LayoutDashboard,
          roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'complaints',
          label: isComplainant ? t('nav_my_grievances', 'My Grievances') : t('nav_all_grievances', 'All Grievances'),
          icon: FileText,
          roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'review_queues',
          label: t('nav_review_queues', 'Review Queues'),
          icon: ClipboardList,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
          onClick: () => onNavigate('complaints', { status: 'Pending Verification', filter_label: 'Review Queue' }),
        },
      ]
    },
    {
      title: t('nav_intelligence', 'INTELLIGENCE & DIRECTORY'),
      items: [
        {
          id: 'overlaps',
          label: t('nav_overlap_intelligence', 'Overlap Intelligence'),
          icon: GitMerge,
          roles: ['Administrator', 'Reviewer'],
          badge: overlapCount > 0 ? overlapCount : null,
          badgeColor: 'bg-[#F59E0B] text-white',
        },
        {
          id: 'institutions',
          label: t('nav_institutions', 'Institutions'),
          icon: Building2,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'reports',
          label: t('nav_analytics_sla', 'Analytics & SLA'),
          icon: BarChart3,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
        },
        {
          id: 'audit_logs',
          label: t('nav_audit_logs', 'Audit Log Scrutiny'),
          icon: ShieldCheck,
          roles: ['Reviewer', 'Administrator', 'Viewer'],
          onClick: () => onNavigate('notifications', { audit_mode: true }),
        },
      ]
    },
    {
      title: t('nav_system', 'SYSTEM'),
      items: [
        {
          id: 'settings',
          label: t('nav_settings', 'Settings'),
          icon: SettingsIcon,
          roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
        }
      ]
    }
  ];

  return (
    <aside 
      className={`bg-[#0645A8] border-r border-[#053A8F] shadow-lg transition-all duration-300 ease-in-out flex flex-col justify-between z-20 flex-shrink-0 select-none text-white ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header with Working Collapse Toggle Button */}
        <div className={`p-4 border-b border-[#053A8F] flex items-center bg-[#0645A8] transition-all duration-300 ${
          isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between gap-2'
        }`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0 flex-1'}`}>
            <div className="p-1 rounded-xl bg-white shadow-xs flex items-center justify-center flex-shrink-0">
              <img 
                src="/anvesh_logo.png" 
                alt="ANVESH" 
                className="w-8 h-8 object-contain rounded-lg" 
              />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden min-w-0">
                <span className="font-extrabold text-base tracking-wider text-white block leading-none flex items-center gap-1.5 truncate">
                  {t('brand_name', 'ANVESH')}
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs flex-shrink-0"></span>
                </span>
                <span className="text-[10px] text-blue-100 block truncate font-medium mt-1">
                  {t('dashboard_hero_title', 'AICTE Grievance Intelligence')}
                </span>
              </div>
            )}
          </div>

          {/* Working Sidebar Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 flex-shrink-0 ${
              isCollapsed ? 'w-full flex justify-center' : ''
            }`}
            title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-blue-100 hover:text-white transition-transform" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-blue-100 hover:text-white transition-transform" />
            )}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => 
              !currentRole?.role || item.roles.includes(currentRole?.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                {!isCollapsed && (
                  <div className="px-3 mb-1.5 text-[10px] font-bold tracking-widest text-blue-200/80 uppercase truncate">
                    {section.title}
                  </div>
                )}
                {isCollapsed && sIdx > 0 && (
                  <div className="my-2 border-t border-blue-400/20" />
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
                        className={`w-full flex items-center rounded-xl text-sm transition-all duration-150 text-left ${
                          isCollapsed 
                            ? 'justify-center p-3' 
                            : 'gap-3 px-3.5 py-2.5'
                        } ${
                          isActive
                            ? 'bg-white text-[#0645A8] font-bold shadow-md'
                            : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 transition ${isActive ? 'text-[#0645A8]' : 'text-blue-100'}`} />
                        {!isCollapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-[#0645A8] text-white' : 'bg-amber-400 text-slate-900'
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

      {/* Requirement 2: Sidebar Footer displaying ANVESH Logo & Branding (NO user info or logout) */}
      <div className="p-3 border-t border-[#053A8F] bg-[#053A8F]/70 transition-all duration-300">
        {!isCollapsed ? (
          <div className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
              <img 
                src="/anvesh_logo.png" 
                alt="ANVESH" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-xs tracking-wider text-white block truncate leading-tight">
                {t('brand_name', 'ANVESH')}
              </span>
              <span className="text-[10px] text-blue-100 block truncate font-medium mt-0.5">
                AICTE Grievance Platform
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1">
            <div 
              className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs"
              title="ANVESH — AICTE Grievance Intelligence Platform"
            >
              <img 
                src="/anvesh_logo.png" 
                alt="ANVESH" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
export default Sidebar;
