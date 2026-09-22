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
  // ANNOUNCEMENTS
  // ============================================
  getAnnouncements: async () => {
    const { data } = await client.get('/farmer/announcements');
    return data;
  },

  // ============================================
  // FORMS — now points to /forms (shared endpoint)
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
  // ENABLE FARMER PROFILE (staff/admin → farmer)
  // ============================================
  enableFarmerProfile: async (payload) => {
    const { data } = await client.post('/farmer/enable', payload);
    return data.farmer;
  },

  // ============================================
  // CHANGE PASSWORD (authenticated)
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