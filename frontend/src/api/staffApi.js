import client from './client';

export const staffApi = {
  // Dashboard
  getDashboardStats: async () => {
    const { data } = await client.get('/staff/dashboard');
    return data;
  },

  getRecentDeliveries: async () => {
    const { data } = await client.get('/staff/dashboard');
    return data.recentDeliveries || [];
  },

  // Deliveries
  getAllDeliveries: async () => {
    const { data } = await client.get('/staff/deliveries');
    return data;
  },

  recordDelivery: async (payload) => {
    const { data } = await client.post('/staff/deliveries', payload);
    return data.delivery;
  },

  // Farmers
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

  // Transactions
  getAllTransactions: async () => {
    const { data } = await client.get('/staff/transactions');
    return data;
  },

  recordTransaction: async (payload) => {
    const { data } = await client.post('/staff/transactions', payload);
    return data.transaction;
  },

  // Payments
  getPaymentSchedule: async () => {
    const { data } = await client.get('/staff/payments');
    return data;
  },

  // Reports
  getReportSummary: async () => {
    const { data } = await client.get('/staff/reports/summary');
    return data;
  },
    // Charts
  getChartData: async () => {
    const { data } = await client.get('/staff/charts');
    return data;
  },
};