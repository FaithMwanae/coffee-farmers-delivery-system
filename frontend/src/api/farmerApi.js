import client from './client';

export const farmerApi = {
  // ============================================
  // DASHBOARD
  // ============================================
  getDashboardStats: async () => {
    const { data } = await client.get('/farmer/dashboard');
    return data;
  },

  // ============================================
  // DELIVERIES
  // ============================================
  getDeliveries: async () => {
    const { data } = await client.get('/farmer/deliveries');
    return data;
  },

  // ============================================
  // TRANSACTIONS
  // ============================================
  getTransactions: async () => {
    const { data } = await client.get('/farmer/transactions');
    return data;
  },

  // ============================================
  // ADVANCES — self-service
  // ============================================
  getAdvanceEligibility: async () => {
    const { data } = await client.get('/farmer/advances/eligibility');
    return data;
  },

  getMyAdvances: async () => {
    const { data } = await client.get('/farmer/advances');
    return data;
  },

  requestAdvance: async (payload) => {
    const { data } = await client.post('/farmer/advances/request', payload);
    return data;
  },

  // ============================================
  // PAYMENT DETAILS
  // ============================================
  getPaymentDetails: async () => {
    const { data } = await client.get('/farmer/payment-details');
    return data;
  },

  updatePaymentDetails: async (payload) => {
    const { data } = await client.put('/farmer/payment-details', payload);
    return data;
  },

  // ============================================
  // ANNOUNCEMENTS
  // ============================================
  getAnnouncements: async () => {
    const { data } = await client.get('/farmer/announcements');
    return data;
  },

  // ============================================
  // FORMS
  // ============================================
  getForms: async () => {
    const { data } = await client.get('/forms');
    return data;
  },

  // ============================================
  // PROFILE
  // ============================================
  getProfile: async () => {
    const { data } = await client.get('/farmer/profile');
    return data;
  },

  updateProfile: async (payload) => {
    const { data } = await client.put('/farmer/profile', payload);
    return data;
  },

  // ============================================
  // ENABLE FARMER PROFILE
  // ============================================
  enableFarmerProfile: async (payload) => {
    const { data } = await client.post('/farmer/enable', payload);
    return data.farmer;
  },

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    const { data } = await client.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return data;
  },
};

export default farmerApi;