import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading records...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-[#687386] animate-fade-in">
      <Loader2 className="w-8 h-8 animate-spin text-[#0645A8] mb-3" />
      <span className="text-sm font-semibold tracking-wide text-[#172033]">{text}</span>
    </div>
  );
}
