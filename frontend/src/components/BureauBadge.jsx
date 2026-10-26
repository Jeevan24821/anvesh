import React from 'react';

export function BureauBadge({ bureau }) {
  if (!bureau) return null;
  const shortCode = bureau.split(' ')[0].replace('(', '').replace(')', '');
  
  let color = 'bg-[#13131E] text-[#8B8988] border-[#232234]';
  if (shortCode === 'PGRC') color = 'bg-[#9312FF]/20 text-[#D8B4FE] border-[#9312FF]/40 shadow-[0_0_8px_rgba(147,18,255,0.2)]';
  else if (shortCode === 'Regulation' || shortCode === 'RB') color = 'bg-violet-900/40 text-[#C084FC] border-violet-700/50';
  else if (shortCode === 'Approval' || shortCode === 'AB') color = 'bg-[#45B558]/20 text-[#45B558] border-[#45B558]/40';
  else if (shortCode === 'Policy' || shortCode === 'PAPB') color = 'bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-800/40';
  else if (shortCode === 'Anti-Ragging' || shortCode === 'ARC') color = 'bg-[#F03B2A]/20 text-[#F03B2A] border-[#F03B2A]/40 shadow-[0_0_8px_rgba(240,59,42,0.2)]';
  else if (shortCode === 'Skill' || shortCode === 'SDC') color = 'bg-teal-950/40 text-teal-300 border-teal-800/40';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${color}`}>
      {shortCode}
    </span>
  );
}
