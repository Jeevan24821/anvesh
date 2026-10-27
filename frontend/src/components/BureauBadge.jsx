import React from 'react';

export function BureauBadge({ bureau }) {
  if (!bureau) return null;
  const shortCode = bureau.split(' ')[0].replace('(', '').replace(')', '');
  
  let color = 'bg-[#F3F5F8] text-[#172033] border-[#DCE3EC]';
  if (shortCode === 'PGRC') color = 'bg-[#EAF3FF] text-[#0645A8] border-[#0645A8]/30 font-semibold shadow-2xs';
  else if (shortCode === 'Regulation' || shortCode === 'RB') color = 'bg-blue-50 text-[#1769D2] border-blue-200 font-semibold';
  else if (shortCode === 'Approval' || shortCode === 'AB') color = 'bg-emerald-50 text-[#16A765] border-emerald-200 font-semibold';
  else if (shortCode === 'Policy' || shortCode === 'PAPB') color = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
  else if (shortCode === 'Anti-Ragging' || shortCode === 'ARC') color = 'bg-red-50 text-[#DC3545] border-red-200 font-semibold';
  else if (shortCode === 'Skill' || shortCode === 'SDC') color = 'bg-teal-50 text-teal-700 border-teal-200 font-semibold';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${color}`}>
      {shortCode}
    </span>
  );
}
