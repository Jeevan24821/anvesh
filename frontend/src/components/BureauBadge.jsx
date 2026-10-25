import React from 'react';

export function BureauBadge({ bureau }) {
  if (!bureau) return null;
  const shortCode = bureau.split(' ')[0].replace('(', '').replace(')', '');
  
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (shortCode === 'PGRC') color = 'bg-sky-50 text-sky-800 border-sky-200';
  else if (shortCode === 'Regulation' || shortCode === 'RB') color = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  else if (shortCode === 'Approval' || shortCode === 'AB') color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  else if (shortCode === 'Policy' || shortCode === 'PAPB') color = 'bg-purple-50 text-purple-800 border-purple-200';
  else if (shortCode === 'Anti-Ragging' || shortCode === 'ARC') color = 'bg-rose-50 text-rose-800 border-rose-200';
  else if (shortCode === 'Skill' || shortCode === 'SDC') color = 'bg-teal-50 text-teal-800 border-teal-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {shortCode}
    </span>
  );
}
