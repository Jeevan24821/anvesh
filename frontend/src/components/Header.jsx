import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Shield, User } from 'lucide-react';

export function Header({ onNavigate, activePage }) {
  const { currentRole, unreadCount, logout } = useAuth();

  if (!currentRole) return null;

  return (
    <header className="bg-[#0D0D14]/90 backdrop-blur-md border-b border-[#232234] sticky top-0 z-30 px-6 py-3 shadow-md">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Portal Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-xl bg-[#13131E] border border-[#3A3854] shadow-[0_0_15px_rgba(147,18,255,0.25)] flex items-center justify-center">
              <img 
                src="/anvesh_logo.png" 
                alt="ANVESH Logo" 
                className="w-8 h-8 object-contain rounded-lg" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-[#F7F7F8] flex items-center gap-1.5">
                  ANVESH
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9312FF] shadow-[0_0_8px_#9312FF]"></span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  currentRole?.role === 'Complainant'
                    ? 'bg-[#45B558]/15 text-[#45B558] border border-[#45B558]/30'
                    : currentRole?.role === 'Reviewer'
                    ? 'bg-[#9312FF]/15 text-[#A020FF] border border-[#9312FF]/30'
                    : currentRole?.role === 'Administrator'
                    ? 'bg-gradient-to-r from-[#9312FF]/20 to-[#7A1CF8]/20 text-[#D8B4FE] border border-[#9312FF]/40 font-extrabold shadow-[0_0_10px_rgba(147,18,255,0.2)]'
                    : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                }`}>
                  {currentRole?.role} Portal
                </span>
              </div>
              <p className="text-[11px] text-[#8B8988] hidden sm:block font-medium">
                AICTE Inter-Bureau Grievance Intelligence & Resolution Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#13131E] border border-[#232234] text-xs text-[#8B8988] font-medium">
          <Shield className="w-3.5 h-3.5 text-[#9312FF] flex-shrink-0" />
          <span className="text-[11px] text-[#F7F7F8]">Authenticated Session</span>
          <span className="w-1 h-1 rounded-full bg-[#45B558] shadow-[0_0_6px_#45B558]"></span>
          <span className="text-[11px] text-[#8B8988]">Statutory Redressal Active</span>
        </div>

        {/* Right: Notifications & User Profile with Logout */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className={`relative p-2 rounded-xl border transition ${
              activePage === 'notifications'
                ? 'bg-[#9312FF]/20 border-[#9312FF] text-[#A020FF] shadow-[0_0_15px_rgba(147,18,255,0.3)]'
                : 'bg-[#13131E] border-[#232234] text-[#8B8988] hover:text-[#F7F7F8] hover:border-[#3A3854]'
            }`}
            title="Notifications & SLA Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-bold bg-[#F03B2A] text-white rounded-full min-w-[16px] text-center shadow-[0_0_8px_rgba(240,59,42,0.6)]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Authenticated User Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#13131E] border border-[#232234]">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
              currentRole?.role === 'Complainant'
                ? 'bg-[#45B558]/20 text-[#45B558] border-[#45B558]/40'
                : currentRole?.role === 'Reviewer'
                ? 'bg-[#9312FF]/20 text-[#A020FF] border-[#9312FF]/40'
                : currentRole?.role === 'Administrator'
                ? 'bg-gradient-to-br from-[#9312FF] to-[#7A1CF8] text-white border-violet-400 shadow-[0_0_10px_rgba(147,18,255,0.4)]'
                : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
            }`}>
              {currentRole?.name ? currentRole?.name[0] : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#F7F7F8] leading-tight">
                {currentRole?.name}
              </div>
              <div className="text-[10px] text-[#8B8988] font-medium truncate max-w-[170px]">
                {currentRole?.roleName}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F03B2A] bg-[#F03B2A]/10 hover:bg-[#F03B2A]/20 border border-[#F03B2A]/30 rounded-xl transition shadow-xs"
            title="End session and securely log out"
          >
            <LogOut className="w-3.5 h-3.5 text-[#F03B2A]" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
