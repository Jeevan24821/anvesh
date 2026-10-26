import React from 'react';
import { AlertCircle } from 'lucide-react';

export function EmptyState({ title = 'No records found', description = 'Try adjusting your search criteria or filters.', icon: Icon = AlertCircle, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0D0D14] rounded-2xl border border-dashed border-[#232234]">
      <div className="p-3.5 rounded-2xl bg-[#9312FF]/15 border border-[#9312FF]/30 text-[#A020FF] shadow-[0_0_18px_rgba(147,18,255,0.25)] mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-[#F7F7F8]">{title}</h4>
      <p className="mt-1 text-sm text-[#8B8988] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
