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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div 
        className={`bg-white border border-[#DCE3EC] rounded-2xl w-full ${maxWidth} shadow-2xl overflow-hidden animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE3EC] bg-[#F8FAFC]">
          <h3 className="text-lg font-bold text-[#172033] tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0645A8]"></span>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#687386] hover:text-[#172033] hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto text-[#172033]">
          {children}
        </div>
      </div>
    </div>
  );
}
