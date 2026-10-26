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
      return 'bg-[#9312FF]/20 text-[#D8B4FE] border-[#9312FF]/40 font-semibold shadow-[0_0_8px_rgba(147,18,255,0.2)]';
    case 'Pending Bureau Review':
    case 'Pending Verification':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 font-semibold';
    case 'Under Review':
      return 'bg-violet-950/50 text-[#C084FC] border-violet-800/50 font-semibold';
    case 'Under Process':
      return 'bg-violet-900/40 text-[#D8B4FE] border-violet-700/50 font-semibold';
    case 'Hearing Scheduled':
      return 'bg-[#F59E0B]/20 text-[#FCD34D] border-[#F59E0B]/40 font-semibold';
    case 'Action Taken Report Awaited':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40';
    case 'Escalated to Committee':
      return 'bg-[#F03B2A]/20 text-[#F03B2A] border-[#F03B2A]/50 font-bold shadow-[0_0_10px_rgba(240,59,42,0.3)] animate-pulse';
    case 'Completed':
    case 'Disposed':
    case 'Resolved':
    case 'Closed':
      return 'bg-[#45B558]/20 text-[#45B558] border-[#45B558]/40 font-semibold shadow-[0_0_8px_rgba(69,181,88,0.25)]';
    case 'Transferred':
      return 'bg-[#9312FF]/25 text-[#A020FF] border-[#9312FF]/50 font-semibold';
    case 'Rejected':
      return 'bg-[#F03B2A]/20 text-[#F03B2A] border-[#F03B2A]/40 font-semibold';
    case 'Needs More Information':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 font-semibold';
    case 'Duplicate Linked':
      return 'bg-purple-900/40 text-purple-300 border-purple-700/50 font-semibold';
    default:
      return 'bg-[#13131E] text-[#8B8988] border-[#232234]';
  }
}

export function getPriorityStyle(priority) {
  switch (priority) {
    case 'Urgent':
      return 'bg-[#F03B2A]/25 text-[#F03B2A] border-[#F03B2A]/50 font-bold shadow-[0_0_10px_rgba(240,59,42,0.35)]';
    case 'High':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 font-bold';
    case 'Medium':
      return 'bg-[#9312FF]/20 text-[#D8B4FE] border-[#9312FF]/40 font-semibold';
    case 'Low':
      return 'bg-[#13131E] text-[#8B8988] border-[#232234]';
    default:
      return 'bg-[#13131E] text-[#8B8988] border-[#232234]';
  }
}

export function getConfidenceStyle(label) {
  switch (label) {
    case 'High':
      return 'bg-[#F03B2A]/25 text-[#F03B2A] border-[#F03B2A]/40 font-bold shadow-[0_0_8px_rgba(240,59,42,0.25)]';
    case 'Medium':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 font-semibold';
    case 'Low':
      return 'bg-[#9312FF]/20 text-[#D8B4FE] border-[#9312FF]/40';
    default:
      return 'bg-[#13131E] text-[#8B8988] border-[#232234]';
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
