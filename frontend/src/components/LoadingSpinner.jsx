import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading records...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-[#8B8988]">
      <Loader2 className="w-8 h-8 animate-spin text-[#9312FF] drop-shadow-[0_0_12px_rgba(147,18,255,0.7)] mb-3" />
      <span className="text-sm font-semibold tracking-wide text-[#F7F7F8]">{text}</span>
    </div>
  );
}
