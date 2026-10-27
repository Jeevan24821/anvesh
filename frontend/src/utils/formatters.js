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
    case 'Registered':
      return 'bg-[#EAF3FF] text-[#0645A8] border-[#0645A8]/30 font-semibold shadow-2xs';
    case 'Pending Bureau Review':
    case 'Pending Verification':
      return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
    case 'Under Review':
    case 'Under Investigation':
    case 'Under Process':
      return 'bg-blue-50 text-[#1769D2] border-blue-200 font-semibold';
    case 'Hearing Scheduled':
    case 'Action Taken Report Awaited':
    case 'Needs More Information':
    case 'Info Requested':
      return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
    case 'Escalated':
    case 'Escalated to Committee':
      return 'bg-red-50 text-[#DC3545] border-red-200 font-bold shadow-2xs';
    case 'Completed':
    case 'Disposed':
    case 'Resolved':
    case 'Closed':
      return 'bg-emerald-50 text-[#16A765] border-emerald-200 font-semibold shadow-2xs';
    case 'Transferred':
      return 'bg-[#EAF3FF] text-[#0645A8] border-[#0645A8]/30 font-semibold';
    case 'Rejected':
      return 'bg-red-50 text-[#DC3545] border-red-200 font-semibold';
    case 'Duplicate Linked':
      return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
    default:
      return 'bg-[#F3F5F8] text-[#687386] border-[#DCE3EC]';
  }
}

export function getPriorityStyle(priority) {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-50 text-[#DC3545] border-red-200 font-bold shadow-2xs';
    case 'High':
      return 'bg-amber-50 text-[#F59E0B] border-amber-200 font-bold';
    case 'Medium':
      return 'bg-[#EAF3FF] text-[#0645A8] border-blue-200 font-semibold';
    case 'Low':
      return 'bg-[#F3F5F8] text-[#687386] border-[#DCE3EC]';
    default:
      return 'bg-[#F3F5F8] text-[#687386] border-[#DCE3EC]';
  }
}

export function getConfidenceStyle(label) {
  switch (label) {
    case 'High':
      return 'bg-red-50 text-[#DC3545] border-red-200 font-bold shadow-2xs';
    case 'Medium':
      return 'bg-amber-50 text-[#F59E0B] border-amber-200 font-semibold';
    case 'Low':
      return 'bg-[#EAF3FF] text-[#0645A8] border-blue-200';
    default:
      return 'bg-[#F3F5F8] text-[#687386] border-[#DCE3EC]';
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
