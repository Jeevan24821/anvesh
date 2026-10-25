import React from 'react';
import { getPriorityStyle } from '../utils/formatters';

export function PriorityBadge({ priority }) {
  const style = getPriorityStyle(priority);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {priority === 'Urgent' && <span className="mr-1 text-rose-400">⚡</span>}
      {priority}
    </span>
  );
}
