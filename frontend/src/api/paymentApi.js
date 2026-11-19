import client from './client';

export const paymentApi = {
  // ============================================
  // PAYMENTS (STAFF / ADMIN)
  // ============================================
  getSchedule: async () => {
    const { data } = await client.get('/payments/schedule');
    return data;
  },

  getReleased: async (season) => {
    const { data } = await client.get('/payments/released', { params: season ? { season } : {} });
    return data;
  },

  release: async (farmerId, payload) => {
    const { data } = await client.post(`/payments/release/${farmerId}`, payload);
    return data;
  },

  bulkRelease: async (farmerIds, method) => {
    const { data } = await client.post('/payments/bulk', { farmerIds, method });
    return data;
  },

  // ⭐ NEW: Collect via M-Pesa STK Push (Input upfront payments)
  collectMpesa: async (payload) => {
    const { data } = await client.post('/payments/collect/stk', payload);
    return data;
  },

  // ============================================
  // ADMIN APPROVALS
  // ============================================
  getPendingApprovals: async () => {
    const { data } = await client.get('/payments/pending-approvals');
    return data;
  },

  approvePayment: async (id) => {
    const { data } = await client.post(`/payments/${id}/approve`);
    return data;
  },
};

export default paymentApi;