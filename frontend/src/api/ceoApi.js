import client from './client';

export const ceoApi = {
  getDashboardStats: async () => {
    const { data } = await client.get('/ceo/dashboard');
    return data;
  },
  getPendingAdvances: async () => {
    const { data } = await client.get('/ceo/pending-advances');
    return data;
  },
  approveAdvance: async (id) => {
    const { data } = await client.post(`/ceo/advances/${id}/approve`);
    return data;
  },
  rejectAdvance: async (id, reason) => {
    const { data } = await client.post(`/ceo/advances/${id}/reject`, { reason });
    return data;
  },
  getChartData: async () => {
    const { data } = await client.get('/ceo/charts');
    return data;
  },
};

export default ceoApi;