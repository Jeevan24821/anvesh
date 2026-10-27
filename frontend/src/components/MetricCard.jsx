import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, color = 'blue', alert = false, onClick, className = '' }) {
  const colorMap = {
    blue: 'border-[#0645A8]/20 text-[#0645A8] bg-[#EAF3FF]',
    violet: 'border-[#0645A8]/20 text-[#0645A8] bg-[#EAF3FF]',
    teal: 'border-[#0645A8]/20 text-[#0645A8] bg-[#EAF3FF]',
    purple: 'border-[#0645A8]/20 text-[#0645A8] bg-[#EAF3FF]',
    navy: 'border-[#DCE3EC] text-[#172033] bg-[#F3F5F8]',
    rose: 'border-red-200 text-[#DC3545] bg-red-50',
    amber: 'border-amber-200 text-[#F59E0B] bg-amber-50',
    emerald: 'border-emerald-200 text-[#16A765] bg-emerald-50',
    sky: 'border-[#0645A8]/20 text-[#1769D2] bg-[#EAF3FF]',
  };

  const badgeColor = colorMap[color] || colorMap.blue;

  return (
    <div 
      onClick={onClick}
      className={`bg-white border rounded-xl p-5 transition-all duration-200 relative overflow-hidden group shadow-xs animate-fade-rise ${
        alert 
          ? 'border-[#DC3545]/40 bg-red-50/20 shadow-xs ring-1 ring-[#DC3545]/20' 
          : 'border-[#DCE3EC] hover:border-[#0645A8]/40 hover:shadow-md hover:-translate-y-0.5'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0645A8]/20 to-transparent group-hover:via-[#0645A8] transition-all duration-300" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#687386]">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border transition-all duration-200 ${badgeColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[#687386] flex items-center gap-1.5 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
