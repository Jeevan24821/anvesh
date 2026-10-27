import React from 'react';
import { getStatusStyle } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

export function StatusBadge({ status, isComplainant = false }) {
  const { t } = useLanguage();
  const displayStatus = (isComplainant && (status === 'Disposed' || status === 'Resolved')) ? 'Completed' : status;
  const style = getStatusStyle(displayStatus);
  
  // Format key e.g. "Pending Verification" -> "status_pending_verification"
  const translationKey = 'status_' + String(displayStatus).toLowerCase().replace(/[^a-z0-9]/g, '_');
  const localizedLabel = t(translationKey, displayStatus);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {localizedLabel}
    </span>
  );
}
