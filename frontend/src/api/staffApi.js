import client from './client';

export const staffApi = {
  // ============================================
  // DASHBOARD
  // ============================================
  getDashboardStats: async () => {
    const { data } = await client.get('/staff/dashboard');
    return data;
  },

  getRecentDeliveries: async () => {
    const { data } = await client.get('/staff/dashboard');
    return data.recentDeliveries || [];
  },

  // ============================================
  // DELIVERIES
  // ============================================
  getAllDeliveries: async () => {
    const { data } = await client.get('/staff/deliveries');
    return data;
  },

  recordDelivery: async (payload) => {
    const { data } = await client.post('/staff/deliveries', payload);
    return data.delivery;
  },

  // ============================================
  // FARMERS
  // ============================================
  getAllFarmers: async () => {
    const { data } = await client.get('/staff/farmers');
    return data;
  },
  
  getFarmerAdvanceInfo: async (farmerId) => {
    const { data } = await client.get(`/staff/farmers/${farmerId}/advance-info`);
    return data;
  },
  
  registerFarmer: async (payload) => {
    const { data } = await client.post('/staff/farmers', payload);
    return data.farmer;
  },

  // ============================================
  // FARM INPUTS
  // ============================================
  getAllInputs: async () => {
    const { data } = await client.get('/staff/inputs');
    return data;
  },
  
  getPendingInputsCount: async () => {
    const { data } = await client.get('/staff/inputs/count');
    return data;
  },

  recordInput: async (payload) => {
    const { data } = await client.post('/staff/inputs', payload);
    return data;
  },

  updateInputStatus: async (id, status) => {
    const { data } = await client.put(`/staff/inputs/${id}/status`, { status });
    return data;
  },

  issueInput: async (id, payload) => {
    const { data } = await client.post(`/staff/inputs/${id}/issue`, payload);
    return data;
  },

  getInputSettings: async () => {
    const { data } = await client.get('/staff/settings/input-rules');
    return data;
  },

  // ============================================
  // TRANSACTIONS
  // ============================================
  getAllTransactions: async () => {
    const { data } = await client.get('/staff/transactions');
    return data;
  },

  recordTransaction: async (payload) => {
    const { data } = await client.post('/staff/transactions', payload);
    return data.transaction;
  },

  // ============================================
  // PAYMENTS
  // ============================================
  getPaymentSchedule: async () => {
    const { data } = await client.get('/staff/payments');
    return data;
  },

  getReleasedPayments: async (season) => {
    const { data } = await client.get('/staff/payments/released', {
      params: season ? { season } : {},
    });
    return data;
  },

  getPaymentsGrouped: async (groupBy = 'bank') => {
    const { data } = await client.get('/staff/payments/grouped', {
      params: { groupBy },
    });
    return data;
  },

  bulkReleasePayments: async (farmerIds, method) => {
    const { data } = await client.post('/staff/payments/bulk', {
      farmerIds,
      method,
    });
    return data;
  },

  releasePayment: async (farmerId, payload) => {
    const { data } = await client.post(
      `/staff/payments/release/${farmerId}`,
      payload
    );
    return data;
  },

  // ============================================
  // REPORTS & CHARTS
  // ============================================
  getReportSummary: async () => {
    const { data } = await client.get('/staff/reports/summary');
    return data;
  },

  getChartData: async () => {
    const { data } = await client.get('/staff/charts');
    return data;
  },

  // ============================================
  // ANNOUNCEMENTS (Added for Staff UI)
  // ============================================
  getAnnouncements: async () => {
    const { data } = await client.get('/announcements');
    return data;
  },

  createAnnouncement: async (formData) => {
    const { data } = await client.post('/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.announcement;
  },

  deleteAnnouncement: async (id) => {
    const { data } = await client.delete(`/announcements/${id}`);
    return data;
  },
};

export default staffApi;