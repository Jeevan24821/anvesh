import { API_BASE_URL } from '../utils/constants';

let authToken = '';
try {
  authToken = localStorage.getItem('sentrix_auth_token') || '';
} catch (e) {
  // ignore
}

export function setAuthToken(token) {
  authToken = token || '';
  try {
    if (token) {
      localStorage.setItem('sentrix_auth_token', token);
    } else {
      localStorage.removeItem('sentrix_auth_token');
    }
  } catch (e) {
    // ignore
  }
}

export function getAuthToken() {
  return authToken;
}

// Backward compatibility stub for existing callers
export function setApiAuthHeaders(role, id) {
  // Maintained for components that pass role/id info
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      errorDetail = response.statusText;
    }

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/verify-otp')) {
      // Clear token on session expiration
      setAuthToken('');
      window.dispatchEvent(new CustomEvent('sentrix_auth_expired'));
    }

    throw new Error(errorDetail);
  }

  // Handle file downloads
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Authentication
  login: (credentials) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: (payload) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verifyOtp: (payload) => {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  requestOtp: (payload) => {
    return request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  forgotPassword: (payload) => {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resetPassword: (payload) => {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  accountRecovery: (payload) => {
    return request('/auth/account-recovery', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCurrentUser: () => {
    return request('/auth/me');
  },

  logout: () => {
    return request('/auth/logout', { method: 'POST' });
  },

  // Dashboard
  getDashboardStats: (bureau) => {
    const query = bureau && bureau !== 'All' ? `?bureau=${encodeURIComponent(bureau)}` : '';
    return request(`/dashboard/stats${query}`);
  },

  // Institutions
  getInstitutions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.region && params.region !== 'All') query.append('region', params.region);
    if (params.state && params.state !== 'All') query.append('state', params.state);
    return request(`/institutions?${query.toString()}`);
  },

  getInstitutionById: (id) => request(`/institutions/${id}`),

  // Complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.bureau && params.bureau !== 'All') query.append('bureau', params.bureau);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.institution_id) query.append('institution_id', params.institution_id);
    if (params.is_overdue !== undefined && params.is_overdue !== '') query.append('is_overdue', params.is_overdue);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);
    return request(`/complaints?${query.toString()}`);
  },

  getComplaintById: (id) => request(`/complaints/${id}`),

  createComplaint: (data) => {
    return request('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTargetInstitutions: () => request('/complaints/target-institutions'),

  assessPriority: (data) => {
    return request('/complaints/assess-priority', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyComplaint: (id, data) => {
    return request(`/complaints/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  requestMoreInfo: (id, data) => {
    return request(`/complaints/${id}/request-info`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  respondToInfoRequest: (id, data) => {
    return request(`/complaints/${id}/respond-info`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  rejectComplaint: (id, data) => {
    return request(`/complaints/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  recordActionTaken: (id, data) => {
    return request(`/complaints/${id}/action-taken`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  submitFeedback: (id, data) => {
    return request(`/complaints/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateComplaintStatus: (id, data) => {
    return request(`/complaints/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  transferComplaint: (id, data) => {
    return request(`/complaints/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  escalateComplaint: (id, data) => {
    return request(`/complaints/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  assignComplaint: (id, data) => {
    return request(`/complaints/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  uploadEvidence: async (file, complaintId = null) => {
    let url = `${API_BASE_URL}/complaints/upload-evidence`;
    if (complaintId) {
      url += `?complaint_id=${encodeURIComponent(complaintId)}`;
    }
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errDetail = 'Failed to upload evidence';
      try {
        const err = await response.json();
        errDetail = err.detail || errDetail;
      } catch (e) {}
      throw new Error(errDetail);
    }
    return response.json();
  },

  getEvidenceBlob: async (filename, download = false) => {
    const url = `${API_BASE_URL}/complaints/evidence/${encodeURIComponent(filename)}${download ? '?download=true' : ''}`;
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      let errDetail = 'Failed to load evidence file';
      try {
        const err = await response.json();
        errDetail = err.detail || errDetail;
      } catch (e) {
        errDetail = response.statusText || errDetail;
      }
      throw new Error(errDetail);
    }
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return { blob, contentType };
  },

  downloadEvidence: async (filename, displayFilename) => {
    const { blob } = await api.getEvidenceBlob(filename, true);
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = displayFilename || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  },

  // Overlap Detection
  getOverlapAlerts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.confidence && params.confidence !== 'All') query.append('confidence', params.confidence);
    if (params.overlap_type && params.overlap_type !== 'All') query.append('overlap_type', params.overlap_type);
    return request(`/overlaps?${query.toString()}`);
  },

  reviewOverlapAlert: (id, data) => {
    return request(`/overlaps/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  scanOverlaps: () => {
    return request('/overlaps/scan', { method: 'POST' });
  },

  // Reports
  getReportsSummary: (bureau) => {
    const query = bureau && bureau !== 'All' ? `?bureau=${encodeURIComponent(bureau)}` : '';
    return request(`/reports/summary${query}`);
  },

  downloadReportCsv: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.bureau && filters.bureau !== 'All') query.append('bureau', filters.bureau);
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);
    if (filters.priority && filters.priority !== 'All') query.append('priority', filters.priority);
    if (filters.is_overdue) query.append('is_overdue', filters.is_overdue);

    const blob = await request(`/reports/export-csv?${query.toString()}`);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `SENTRIX_AICTE_Complaints_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  getExportCsvUrl: (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.bureau && filters.bureau !== 'All') query.append('bureau', filters.bureau);
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);
    if (filters.priority && filters.priority !== 'All') query.append('priority', filters.priority);
    if (filters.is_overdue) query.append('is_overdue', filters.is_overdue);
    return `${API_BASE_URL}/reports/export-csv?${query.toString()}`;
  },

  exportOverlapsCsv: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);

    const blob = await request(`/reports/export-overlaps-csv?${query.toString()}`);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `ANVESH_AICTE_Overlaps_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  getExportOverlapsCsvUrl: (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);
    return `${API_BASE_URL}/reports/export-overlaps-csv?${query.toString()}`;
  },

  // Notifications
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.bureau && params.bureau !== 'All') query.append('bureau', params.bureau);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.unread_only) query.append('unread_only', 'true');
    if (params.limit) query.append('limit', params.limit);
    return request(`/notifications?${query.toString()}`);
  },

  getUnreadNotificationCount: () => {
    return request('/notifications/unread-count');
  },

  markNotificationRead: (id) => {
    return request(`/notifications/${id}/read`, { method: 'POST' });
  },

  markAllNotificationsRead: (bureau) => {
    const query = bureau && bureau !== 'All' ? `?bureau=${encodeURIComponent(bureau)}` : '';
    return request(`/notifications/read-all${query}`, { method: 'POST' });
  },
};
