import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, color = 'teal', alert = false, onClick }) {
  const colorMap = {
    teal: 'border-blue-200 text-[#0845A8] bg-blue-50',
    rose: 'border-red-200 text-red-600 bg-red-50',
    amber: 'border-amber-200 text-amber-700 bg-amber-50',
    emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    sky: 'border-sky-200 text-sky-700 bg-sky-50',
    purple: 'border-purple-200 text-purple-700 bg-purple-50',
  };

  const badgeColor = colorMap[color] || colorMap.teal;

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
        alert ? 'ring-1 ring-red-400 border-red-300' : ''
      } ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${badgeColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full pointer-events-none" />
    </div>
  );
}
