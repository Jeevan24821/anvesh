import React from 'react';
import { AlertCircle } from 'lucide-react';

export function EmptyState({ title = 'No records found', description = 'Try adjusting your search criteria or filters.', icon: Icon = AlertCircle, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-300">
      <div className="p-3.5 rounded-full bg-blue-50 border border-blue-100 text-[#0845A8] mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
