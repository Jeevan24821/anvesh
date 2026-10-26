import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Shield, User } from 'lucide-react';

export function Header({ onNavigate, activePage }) {
  const { currentRole, unreadCount, logout } = useAuth();

  if (!currentRole) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Portal Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img 
              src="/anvesh_logo.png" 
              alt="ANVESH Logo" 
              className="w-9 h-9 object-contain rounded-lg p-0.5 bg-slate-50 border border-slate-200 shadow-2xs" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-[#0F172A]">ANVESH</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  currentRole?.role === 'Complainant'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentRole?.role === 'Reviewer'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : currentRole?.role === 'Administrator'
                    ? 'bg-slate-100 text-[#12345A] border border-slate-300 font-extrabold'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {currentRole?.role} Portal
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] hidden sm:block font-medium">
                AICTE Inter-Bureau Grievance Intelligence & Resolution Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-[#0F172A] font-medium">
          <Shield className="w-3.5 h-3.5 text-[#0D9488] flex-shrink-0" />
          <span className="text-[11px]">Authenticated Session • Role-Based Access Enforced</span>
        </div>

        {/* Right: Notifications & User Profile with Logout */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className={`relative p-2 rounded-lg border transition ${
              activePage === 'notifications'
                ? 'bg-teal-50 border-teal-300 text-[#0D9488]'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Notifications & SLA Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-bold bg-rose-600 text-white rounded-full min-w-[16px] text-center shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Authenticated User Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs border ${
              currentRole?.role === 'Complainant'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : currentRole?.role === 'Reviewer'
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : currentRole?.role === 'Administrator'
                ? 'bg-slate-100 text-[#12345A] border-slate-300'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {currentRole?.name ? currentRole?.name[0] : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#0F172A] leading-tight">
                {currentRole?.name}
              </div>
              <div className="text-[10px] text-[#64748B] font-medium truncate max-w-[170px]">
                {currentRole?.roleName}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
            title="End session and securely log out"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
