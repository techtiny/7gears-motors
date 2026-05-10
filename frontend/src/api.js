import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const customerApi = {
  getAll: (q) => api.get('/customers', { params: q ? { q } : {} }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const vehicleApi = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  getByCustomer: (customerId) => api.get('/vehicles', { params: { customerId } }),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const jobApi = {
  getDashboard: () => api.get('/jobs/dashboard'),
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  track: (jobNumber) => api.get(`/jobs/track/${jobNumber}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  updateStatus: (id, status, message, sentBy) =>
    api.put(`/jobs/${id}/status`, { status, message, sentBy }),
  addUpdate: (id, data) => api.post(`/jobs/${id}/updates`, data),
};

export const appointmentApi = {
  getAll:  (params) => api.get('/appointments', { params }),
  create:  (data)   => api.post('/appointments', data),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
  delete:  (id)     => api.delete(`/appointments/${id}`),
};

export const campaignApi = {
  getAll:   ()        => api.get('/campaigns'),
  create:   (data)    => api.post('/campaigns', data),
  execute:  (id)      => api.post(`/campaigns/${id}/execute`),
  template: (type)    => api.get(`/campaigns/template/${type}`),
};

export const feedbackApi = {
  getAll:   ()        => api.get('/feedback'),
  stats:    ()        => api.get('/feedback/stats'),
  submit:   (data)    => api.post('/feedback', data),
  request:  (jobId)   => api.post(`/feedback/request/${jobId}`),
};

export const loyaltyApi = {
  get:    (customerId) => api.get(`/loyalty/${customerId}`),
  award:  (customerId, amount) => api.post(`/loyalty/${customerId}/award`, { amount }),
  redeem: (customerId, points) => api.post(`/loyalty/${customerId}/redeem`, { points }),
};

export default api;
