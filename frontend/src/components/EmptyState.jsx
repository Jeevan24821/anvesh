import React from 'react';
import { AlertCircle } from 'lucide-react';

export function EmptyState({ title = 'No records found', description = 'Try adjusting your search criteria or filters.', icon: Icon = AlertCircle, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-[#DCE3EC] shadow-xs animate-fade-rise">
      <div className="p-3.5 rounded-2xl bg-[#EAF3FF] border border-[#0645A8]/20 text-[#0645A8] shadow-xs mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-[#172033]">{title}</h4>
      <p className="mt-1 text-sm text-[#687386] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
