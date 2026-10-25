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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ activePage, onNavigate, isCollapsed, onToggleCollapse, overlapCount = 0 }) {
  const { currentRole } = useAuth();

  const isComplainant = currentRole?.role === 'Complainant';
  const isReviewer = currentRole?.role === 'Reviewer';

  // Role-adaptive navigation items
  const allNavItems = [
    {
      id: 'dashboard',
      label: isComplainant ? 'Grievance Dashboard' : (isReviewer ? 'Bureau Dashboard' : 'Central Dashboard'),
      icon: LayoutDashboard,
      roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
      badge: null,
    },
    {
      id: 'complaints',
      label: isComplainant ? 'My Grievances' : (isReviewer ? 'Assigned Complaints' : 'All Complaints'),
      icon: FileText,
      roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
      badge: null,
    },
    {
      id: 'institutions',
      label: 'Institution Directory',
      icon: Building2,
      roles: ['Reviewer', 'Administrator', 'Viewer'], // Restricted to authorized staff roles; hidden from all Complainants
      badge: null,
    },
    {
      id: 'overlaps',
      label: 'Overlap Intelligence',
      icon: GitMerge,
      roles: ['Administrator'], // Strictly restricted to Administrator as per Master Mandate
      badge: overlapCount > 0 ? overlapCount : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      roles: ['Reviewer', 'Administrator', 'Viewer'], // Complainants do not access internal analytics
      badge: null,
    },
    {
      id: 'notifications',
      label: 'Notifications & SLAs',
      icon: Bell,
      roles: ['Complainant', 'Reviewer', 'Administrator', 'Viewer'],
      badge: null,
    },
  ];

  const visibleNavItems = allNavItems.filter(item => 
    !currentRole?.role || item.roles.includes(currentRole?.role)
  );

  return (
    <aside 
      className={`bg-[#0845A8] border-r border-[#063B8B] shadow-lg transition-all duration-300 flex flex-col justify-between z-20 flex-shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className={`p-3.5 border-b border-white/15 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img 
            src="/anvesh_logo.png" 
            alt="ANVESH" 
            className="w-9 h-9 object-contain rounded-lg p-0.5 bg-white shadow-xs flex-shrink-0" 
          />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="font-black text-lg tracking-wider text-white block leading-none">
                ANVESH
              </span>
              <span className="text-[10px] text-blue-200 block truncate font-medium mt-1">
                AICTE Grievance Network
              </span>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-white text-[#0845A8] font-bold shadow-md'
                    : 'text-blue-100/90 hover:text-white hover:bg-white/10 font-medium'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#0845A8]' : 'text-blue-200'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#0845A8] text-white' : 'bg-white/20 text-white border border-white/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-white/15">
        {!isCollapsed && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-[11px] text-blue-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ANVESH Mesh
              </span>
              <span className="text-emerald-300 font-mono text-[10px] font-bold">ACTIVE</span>
            </div>
            <p className="text-[10px] text-blue-200">
              Role: <span className="font-semibold text-white">{currentRole?.role || 'User'}</span>
            </p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
