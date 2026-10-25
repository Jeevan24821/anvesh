export function formatDate(dateString) {
  if (!dateString) return '—';
  if (typeof dateString === 'string') {
    // Exact parsing of YYYY-MM-DD without UTC-to-local timezone shifting
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = match[3];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${monthNames[monthIdx]} ${year}`;
      }
    }
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateString);
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return String(dateString);
  }
}

export function formatRegistrationDateTime(createdAt, receivedDate) {
  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (createdAt) {
    try {
      const match = String(createdAt).match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
      if (match) {
        const year = match[1];
        const monthIdx = parseInt(match[2], 10) - 1;
        const day = match[3];
        const hour = match[4];
        const minute = match[5];
        return `Registered on ${parseInt(day, 10)} ${fullMonths[monthIdx]} ${year}, ${hour}:${minute} UTC`;
      }
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        const day = d.getUTCDate();
        const month = fullMonths[d.getUTCMonth()];
        const year = d.getUTCFullYear();
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const mins = String(d.getUTCMinutes()).padStart(2, '0');
        return `Registered on ${day} ${month} ${year}, ${hours}:${mins} UTC`;
      }
    } catch (e) {
      // fallback
    }
  }

  if (receivedDate) {
    const match = String(receivedDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = match[3];
      return `Registered on ${parseInt(day, 10)} ${fullMonths[monthIdx]} ${year}, 09:00 UTC`;
    }
  }

  return 'Registered on AICTE Portal';
}

export function getStatusStyle(status) {
  switch (status) {
    case 'New':
    case 'Submitted':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Pending Bureau Review':
    case 'Pending Verification':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Under Review':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Under Process':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Hearing Scheduled':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Action Taken Report Awaited':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Escalated to Committee':
      return 'bg-red-50 text-red-700 border-red-200 font-semibold animate-pulse';
    case 'Completed':
    case 'Disposed':
    case 'Resolved':
    case 'Closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Transferred':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Needs More Information':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getPriorityStyle(priority) {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-50 text-red-700 border-red-200 font-semibold';
    case 'High':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getConfidenceStyle(label) {
  switch (label) {
    case 'High':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function formatTimeOnly(dateString) {
  if (!dateString) return '';
  try {
    const match = String(dateString).match(/[T\s](\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]} UTC`;
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${mins} UTC`;
    }
  } catch (e) {
    // fallback
  }
  return '';
}

export function formatSubmissionDateTime(receivedDate, createdAt) {
  const dStr = formatDate(receivedDate);
  const tStr = formatTimeOnly(createdAt);
  if (tStr) {
    return `${dStr}, ${tStr}`;
  }
  return dStr;
}
