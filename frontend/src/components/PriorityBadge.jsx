import React from 'react';
import { getPriorityStyle } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

export function PriorityBadge({ priority }) {
  const { t } = useLanguage();
  const style = getPriorityStyle(priority);
  const translationKey = 'priority_' + String(priority).toLowerCase() + '_badge';
  const localizedPriority = t(translationKey, priority);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {priority === 'Urgent' && <span className="mr-1 text-red-600">⚡</span>}
      {localizedPriority}
    </span>
  );
}
