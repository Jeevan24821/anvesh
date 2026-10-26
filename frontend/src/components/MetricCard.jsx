import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, color = 'violet', alert = false, onClick }) {
  const colorMap = {
    violet: 'border-[#9312FF]/40 text-[#A020FF] bg-[#9312FF]/15 shadow-[0_0_12px_rgba(147,18,255,0.25)]',
    teal: 'border-[#9312FF]/40 text-[#A020FF] bg-[#9312FF]/15 shadow-[0_0_12px_rgba(147,18,255,0.25)]',
    purple: 'border-[#9312FF]/40 text-[#A020FF] bg-[#9312FF]/15 shadow-[0_0_12px_rgba(147,18,255,0.25)]',
    navy: 'border-[#232234] text-[#D8B4FE] bg-[#13131E]',
    rose: 'border-[#F03B2A]/40 text-[#F03B2A] bg-[#F03B2A]/15 shadow-[0_0_12px_rgba(240,59,42,0.2)]',
    amber: 'border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/15 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    emerald: 'border-[#45B558]/40 text-[#45B558] bg-[#45B558]/15 shadow-[0_0_12px_rgba(69,181,88,0.2)]',
    sky: 'border-[#9312FF]/40 text-[#A020FF] bg-[#9312FF]/15 shadow-[0_0_12px_rgba(147,18,255,0.25)]',
  };

  const badgeColor = colorMap[color] || colorMap.violet;

  return (
    <div 
      onClick={onClick}
      className={`bg-[#0D0D14] border rounded-xl p-5 transition-all duration-300 relative overflow-hidden group ${
        alert 
          ? 'border-[#F03B2A]/50 bg-[#F03B2A]/5 shadow-[0_0_20px_rgba(240,59,42,0.15)] ring-1 ring-[#F03B2A]/30' 
          : 'border-[#232234] hover:border-[#9312FF]/50 hover:shadow-[0_0_25px_rgba(147,18,255,0.18)] hover:-translate-y-0.5'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9312FF]/30 to-transparent group-hover:via-[#9312FF] transition-all duration-500" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8B8988]">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border transition-all duration-300 ${badgeColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black text-[#F7F7F8] tracking-tight">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[#8B8988] flex items-center gap-1.5 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
