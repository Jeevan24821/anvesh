import React from 'react';
import { Building2, GraduationCap, Award, BookOpen } from 'lucide-react';

/**
 * Deterministically generates an official collegiate emblem/crest
 * for any technical educational institution approved by AICTE.
 */
export function InstitutionLogo({ name = 'Institution', aicteId = '', size = 'md', className = '' }) {
  // Extract initials / monogram from institution name
  const getInitials = (str) => {
    if (!str) return 'AICTE';
    const clean = str.replace(/Institute of Technology|College of Engineering|Deemed to be University|University|College|Institute/gi, '').trim();
    const words = (clean || str).split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
    if (words.length === 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0][0] + words[1][0] + (words[2]?.[0] || '')).substring(0, 3).toUpperCase();
  };

  const initials = getInitials(name);

  // Deterministic color palette based on name/ID hash
  const hash = (name + aicteId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorPalettes = [
    { bg: 'bg-[#0645A8]', text: 'text-white', border: 'border-[#1769D2]', accent: '#BBD5F8', ring: 'ring-blue-100' },
    { bg: 'bg-[#1E3A8A]', text: 'text-amber-300', border: 'border-blue-900', accent: '#FDE68A', ring: 'ring-amber-100' },
    { bg: 'bg-[#831843]', text: 'text-pink-100', border: 'border-pink-900', accent: '#FBCFE8', ring: 'ring-pink-100' },
    { bg: 'bg-[#065F46]', text: 'text-emerald-100', border: 'border-emerald-800', accent: '#A7F3D0', ring: 'ring-emerald-100' },
    { bg: 'bg-[#312E81]', text: 'text-indigo-100', border: 'border-indigo-900', accent: '#C7D2FE', ring: 'ring-indigo-100' },
    { bg: 'bg-[#701A75]', text: 'text-fuchsia-100', border: 'border-fuchsia-900', accent: '#F5D0FE', ring: 'ring-fuchsia-100' },
  ];
  const palette = colorPalettes[hash % colorPalettes.length];

  // Size variations
  const sizeMap = {
    xs: {
      container: 'w-7 h-7 text-[10px] rounded-lg',
      icon: 'w-3 h-3',
      showIcon: false,
    },
    sm: {
      container: 'w-9 h-9 text-xs rounded-xl',
      icon: 'w-3.5 h-3.5',
      showIcon: false,
    },
    md: {
      container: 'w-12 h-12 text-sm rounded-2xl',
      icon: 'w-4 h-4',
      showIcon: true,
    },
    lg: {
      container: 'w-16 h-16 text-lg rounded-2xl',
      icon: 'w-5 h-5',
      showIcon: true,
    },
    xl: {
      container: 'w-20 h-20 text-xl rounded-3xl',
      icon: 'w-6 h-6',
      showIcon: true,
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center font-extrabold tracking-wider border shadow-xs select-none flex-shrink-0 ${palette.bg} ${palette.text} ${palette.border} ${currentSize.container} ${className}`}
      title={`${name} (AICTE ID: ${aicteId || 'N/A'})`}
    >
      {/* Decorative inner collegiate shield accent */}
      <div className="absolute inset-0.5 rounded-[inherit] border border-white/20 pointer-events-none" />
      
      <div className="flex flex-col items-center justify-center leading-none">
        {currentSize.showIcon && (
          <GraduationCap className={`${currentSize.icon} opacity-85 mb-0.5`} />
        )}
        <span className="font-mono font-bold tracking-tight">{initials}</span>
      </div>

      {/* Verified AICTE Stamp Dot */}
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#16A765] border-2 border-white rounded-full shadow-2xs" title="AICTE Approved Institution" />
    </div>
  );
}
export default InstitutionLogo;
