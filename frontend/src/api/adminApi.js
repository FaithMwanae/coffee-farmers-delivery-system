import client from './client';

export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    const { data } = await client.get('/admin/dashboard');
    return data;
  },

  getRecentActivity: async () => {
    const { data } = await client.get('/admin/activity');
    return data;
  },

  getRoleDistribution: async () => {
    const { data } = await client.get('/admin/roles');
    return data;
  },

  // Charts
  getChartData: async () => {
    const { data } = await client.get('/admin/charts');
    return data;
  },

  // Users
  getAllUsers: async () => {
    const { data } = await client.get('/admin/users');
    return data;
  },

  createUser: async (payload) => {
    const { data } = await client.post('/admin/users', payload);
    return data.user;
  },

  updateUser: async (id, payload) => {
    const { data } = await client.put(`/admin/users/${id}`, payload);
    return data.user;
  },

  toggleUserStatus: async (id) => {
    const { data } = await client.patch(`/admin/users/${id}/toggle-status`);
    return data.user;
  },

  // Settings
  getSettings: async () => {
    const { data } = await client.get('/admin/settings');
    return data;
  },

  updateSettings: async (payload) => {
    const { data } = await client.put('/admin/settings', payload);
    return data.settings;
  },

  // Audit Logs
  getAuditLogs: async () => {
    const { data } = await client.get('/admin/audit-logs');
    return data;
  },
};