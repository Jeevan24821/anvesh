import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className={`bg-[#0D0D14] border border-[#2A293E] rounded-2xl w-full ${maxWidth} shadow-[0_0_50px_rgba(147,18,255,0.25)] overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232234] bg-[#13131E]">
          <h3 className="text-lg font-bold text-[#F7F7F8] tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#9312FF] shadow-[0_0_8px_#9312FF]"></span>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8B8988] hover:text-[#F7F7F8] hover:bg-[#1E1D2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto text-[#F7F7F8]">
          {children}
        </div>
      </div>
    </div>
  );
}
