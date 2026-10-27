import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, LogOut, Shield, User, Globe, Menu } from 'lucide-react';

export function Header({ onNavigate, activePage, onToggleSidebar, isSidebarCollapsed }) {
  const { currentRole, unreadCount, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  if (!currentRole) return null;

  return (
    <header className="bg-white border-b border-[#DCE3EC] sticky top-0 z-30 px-6 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding, Official Government Logos & Portal Badge */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button (Quick Toggle from Header) */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-xl border border-[#DCE3EC] text-[#0645A8] hover:bg-[#EAF3FF] hover:border-[#BBD5F8] transition shadow-2xs flex items-center justify-center mr-0.5"
              title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Institutional Logos Group */}
          <div className="flex items-center gap-2">
            {/* AICTE Statutory Council Seal */}
            <div 
              className="p-1 rounded-xl bg-white border border-[#DCE3EC] shadow-2xs flex items-center justify-center hover:border-[#0645A8]/40 transition"
              title="All India Council for Technical Education (AICTE)"
            >
              <img 
                src="/aicte_logo.png" 
                alt="AICTE Official Seal" 
                className="h-8 w-auto max-w-[42px] object-contain" 
              />
            </div>

            {/* ANVESH Platform Brand Emblem */}
            <div 
              className="p-1 rounded-xl bg-white border border-[#DCE3EC] shadow-2xs flex items-center justify-center hover:border-[#0645A8]/40 transition"
              title="ANVESH Grievance Intelligence Platform"
            >
              <img 
                src="/anvesh_logo.png" 
                alt="ANVESH Logo" 
                className="w-8 h-8 object-contain rounded-lg" 
              />
            </div>

            {/* Digital India Seal (Hidden on narrow mobile, visible sm+) */}
            <div 
              className="hidden sm:flex p-1 rounded-xl bg-white border border-[#DCE3EC] shadow-2xs items-center justify-center hover:border-[#0645A8]/40 transition"
              title="Digital India - Power to Empower"
            >
              <img 
                src="/digital_india_logo.png" 
                alt="Digital India" 
                className="h-8 w-auto max-w-[56px] object-contain" 
              />
            </div>
          </div>

          <div className="border-l border-[#DCE3EC] pl-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-[#0645A8] flex items-center gap-1.5">
                {t('brand_name')}
                <span className="w-1.5 h-1.5 rounded-full bg-[#1769D2] shadow-xs"></span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                currentRole?.role === 'Complainant'
                  ? 'bg-emerald-50 text-[#16A765] border border-emerald-200'
                  : currentRole?.role === 'Reviewer'
                  ? 'bg-[#EAF3FF] text-[#0645A8] border border-[#0645A8]/30 font-bold'
                  : currentRole?.role === 'Administrator'
                  ? 'bg-blue-50 text-[#0645A8] border border-[#0645A8]/40 font-extrabold shadow-2xs'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {currentRole?.role === 'Administrator' ? t('portal_administrator') :
                 currentRole?.role === 'Reviewer' ? t('portal_reviewer') :
                 currentRole?.role === 'Complainant' ? t('portal_student') :
                 `${currentRole?.role} Portal`}
              </span>
            </div>
            <p className="text-[11px] text-[#687386] hidden sm:block font-medium">
              {t('brand_subtitle')}
            </p>
          </div>
        </div>

        {/* Center: System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F3F5F8] border border-[#DCE3EC] text-xs text-[#687386] font-medium">
          <Shield className="w-3.5 h-3.5 text-[#0645A8] flex-shrink-0" />
          <span className="text-[11px] text-[#172033] font-semibold">{t('authenticated_session')}</span>
          <span className="w-1 h-1 rounded-full bg-[#16A765]"></span>
          <span className="text-[11px] text-[#687386]">{t('statutory_active')}</span>
        </div>

        {/* Right: Language Switcher, Notifications & User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher Selector (English / हिन्दी) */}
          <div className="flex items-center bg-[#F3F5F8] border border-[#DCE3EC] rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-[#0645A8] text-white shadow-xs'
                  : 'text-[#687386] hover:text-[#172033] hover:bg-white/60'
              }`}
              title="Switch to English"
            >
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'hi'
                  ? 'bg-[#0645A8] text-white shadow-xs'
                  : 'text-[#687386] hover:text-[#172033] hover:bg-white/60'
              }`}
              title="हिन्दी में देखें (Switch to Hindi)"
            >
              <span>हिन्दी</span>
            </button>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className={`relative p-2 rounded-xl border transition ${
              activePage === 'notifications'
                ? 'bg-[#EAF3FF] border-[#0645A8] text-[#0645A8] shadow-xs'
                : 'bg-[#F3F5F8] border-[#DCE3EC] text-[#687386] hover:text-[#0645A8] hover:bg-[#EAF3FF] hover:border-[#0645A8]/40'
            }`}
            title={t('notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-bold bg-[#DC3545] text-white rounded-full min-w-[16px] text-center shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Authenticated User Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F3F5F8] border border-[#DCE3EC]">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
              currentRole?.role === 'Complainant'
                ? 'bg-emerald-100 text-[#16A765] border-emerald-300'
                : currentRole?.role === 'Reviewer'
                ? 'bg-[#EAF3FF] text-[#0645A8] border-blue-200'
                : currentRole?.role === 'Administrator'
                ? 'bg-[#0645A8] text-white border-[#0645A8] shadow-xs'
                : 'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              {currentRole?.name ? currentRole?.name[0] : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#172033] leading-tight">
                {currentRole?.name}
              </div>
              <div className="text-[10px] text-[#687386] font-medium truncate max-w-[170px]">
                {currentRole?.roleName}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DC3545] bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition shadow-xs"
            title="End session and securely log out"
          >
            <LogOut className="w-3.5 h-3.5 text-[#DC3545]" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
