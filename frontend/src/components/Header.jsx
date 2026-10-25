import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Shield, User } from 'lucide-react';

export function Header({ onNavigate, activePage }) {
  const { currentRole, unreadCount, logout } = useAuth();

  if (!currentRole) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Portal Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img 
              src="/anvesh_logo.png" 
              alt="ANVESH Logo" 
              className="w-10 h-10 object-contain rounded-lg p-0.5 bg-blue-50 border border-blue-200 shadow-xs" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-slate-900">ANVESH</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  currentRole?.role === 'Complainant'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentRole?.role === 'Reviewer'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : currentRole?.role === 'Administrator'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {currentRole?.role} Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                AICTE Inter-Bureau Grievance Intelligence & Resolution Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
          <Shield className="w-3.5 h-3.5 text-[#0845A8] flex-shrink-0" />
          <span>Authenticated Session • Government RBAC Enforced</span>
        </div>

        {/* Right: Notifications & User Profile with Logout */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className={`relative p-2 rounded-lg border transition ${
              activePage === 'notifications'
                ? 'bg-blue-50 border-blue-300 text-[#0845A8]'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Notifications & SLA Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center shadow-lg animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Authenticated User Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
              currentRole?.role === 'Complainant'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : currentRole?.role === 'Reviewer'
                ? 'bg-blue-100 text-[#0845A8] border-blue-200'
                : currentRole?.role === 'Administrator'
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : 'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              {currentRole?.name ? currentRole?.name[0] : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentRole?.name}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold truncate max-w-[170px]">
                {currentRole?.roleName}
              </div>
            </div>
          </div>

          {/* Real Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition shadow-xs"
            title="End session and securely log out"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
