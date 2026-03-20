const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const BACKEND_ORIGIN = 'http://localhost:8000';

function getAuthToken() {
  return localStorage.getItem('authToken');
}

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const { skipAuth, headers: optHeaders, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(optHeaders || {}),
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message = (data && (data.detail || data.message)) || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login/', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
  },
  logout: async () => {
    return apiRequest('/auth/logout/', { method: 'POST', skipAuth: true });
  },
  refreshToken: async (refreshToken) => {
    return apiRequest('/auth/refresh/', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ refresh: refreshToken }),
    });
  },
  getCurrentUser: async () => {
    return apiRequest('/auth/me/');
  },
  updateCurrentUser: async (userData) => {
    return apiRequest('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
};

export const userAPI = {
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users/?${queryString}`);
  },
  getUser: async (id) => {
    return apiRequest(`/users/${id}/`);
  },
  createUser: async (userData) => {
    return apiRequest('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  updateUser: async (id, userData) => {
    return apiRequest(`/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
  deleteUser: async (id) => {
    return apiRequest(`/users/${id}/`, { method: 'DELETE' });
  },
  bulkImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/bulk-import/`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return response.json();
  },
};

export const complianceAPI = {
  getDocuments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/compliance/documents/?${queryString}`);
  },
  uploadDocument: async (data) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/compliance/documents/`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });
    return response.json();
  },
  updateDocumentStatus: async (id, status, notes) => {
    return apiRequest(`/compliance/documents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },
  getReports: async () => {
    return apiRequest('/compliance/reports/');
  },
};

export const scheduleAPI = {
  getAppointments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/schedule/appointments/?${queryString}`);
  },
  createAppointment: async (appointmentData) => {
    return apiRequest('/schedule/appointments/', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },
  updateAppointment: async (id, data) => {
    return apiRequest(`/schedule/appointments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteAppointment: async (id) => {
    return apiRequest(`/schedule/appointments/${id}/`, { method: 'DELETE' });
  },
  getTasks: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/schedule/tasks/?${queryString}`);
  },
};

export const operationsAPI = {
  getRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/operations/requests/?${queryString}`);
  },
  createRequest: async (requestData) => {
    return apiRequest('/operations/requests/', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },
  updateRequest: async (id, data) => {
    return apiRequest(`/operations/requests/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  getActivityLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/operations/activity-logs/?${queryString}`);
  },
  getMetrics: async () => {
    return apiRequest('/operations/metrics/');
  },
};

export const financialAPI = {
  getInvoices: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/financial/invoices/?${queryString}`);
  },
  createInvoice: async (invoiceData) => {
    return apiRequest('/financial/invoices/', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  },
  getPayments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/financial/payments/?${queryString}`);
  },
  processPayment: async (paymentData) => {
    return apiRequest('/financial/payments/', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  getRevenueAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/financial/revenue-analytics/?${queryString}`);
  },
  getProfitLossReport: async (startDate, endDate) => {
    return apiRequest(`/financial/reports/profit-loss/?start_date=${startDate}&end_date=${endDate}`);
  },
};

export const commercialSpaceAPI = {
  getUnits: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/commercial-spaces/units/?${queryString}`);
  },
  getUnit: async (id) => {
    return apiRequest(`/commercial-spaces/units/${id}/`);
  },
  createUnit: async (unitData) => {
    return apiRequest('/commercial-spaces/units/', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  },
  updateUnit: async (id, unitData) => {
    return apiRequest(`/commercial-spaces/units/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(unitData),
    });
  },
  deleteUnit: async (id) => {
    return apiRequest(`/commercial-spaces/units/${id}/`, { method: 'DELETE' });
  },
  assignTenant: async (unitId, tenantId) => {
    return apiRequest(`/commercial-spaces/units/${unitId}/assign-tenant/`, {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
    });
  },
};

export const maintenanceAPI = {
  getRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/maintenance/requests/?${queryString}`);
  },
  createRequest: async (data) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/maintenance/requests/`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });
    return response.json();
  },
  updateRequest: async (id, data) => {
    return apiRequest(`/maintenance/requests/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export const notificationsAPI = {
  getNotifications: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/notifications/?${queryString}`);
  },
  markAsRead: async (id) => {
    return apiRequest(`/notifications/${id}/mark-read/`, { method: 'PATCH' });
  },
  markAllAsRead: async () => {
    return apiRequest('/notifications/mark-all-read/', { method: 'POST' });
  },
};

export default {
  auth: authAPI,
  users: userAPI,
  compliance: complianceAPI,
  schedule: scheduleAPI,
  operations: operationsAPI,
  financial: financialAPI,
  commercialSpace: commercialSpaceAPI,
  maintenance: maintenanceAPI,
  notifications: notificationsAPI,
}
