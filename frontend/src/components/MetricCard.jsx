import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, color = 'teal', alert = false, onClick }) {
  const colorMap = {
    teal: 'border-teal-200 text-[#0D9488] bg-teal-50',
    navy: 'border-slate-200 text-[#12345A] bg-slate-100',
    rose: 'border-rose-200 text-rose-600 bg-rose-50',
    amber: 'border-amber-200 text-amber-700 bg-amber-50',
    emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    sky: 'border-sky-200 text-sky-700 bg-sky-50',
    purple: 'border-purple-200 text-purple-700 bg-purple-50',
  };

  const badgeColor = colorMap[color] || colorMap.teal;

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all ${
        alert ? 'border-red-300 ring-1 ring-red-200 bg-red-50/20' : 'hover:border-slate-300 hover:shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${badgeColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[#64748B] flex items-center gap-1.5 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
