import client from './client';

export const authApi = {
  // ============================================
  // LOGIN
  // ============================================
  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    return data;
  },

  // ============================================
  // REGISTER
  // ============================================
  register: async (userData) => {
    const { data } = await client.post('/auth/register', userData);
    return data;
  },

  // ============================================
  // FORGOT PASSWORD — request a 6-digit code
  // ============================================
  forgotPassword: async (email) => {
    const { data } = await client.post('/auth/forgot-password', { email });
    return data; // { success, message, devCode? }
  },

  // ============================================
  // VERIFY RESET CODE — validate before resetting
  // ============================================
  verifyResetCode: async (email, code) => {
    const { data } = await client.post('/auth/verify-reset-code', { email, code });
    return data; // { valid, email, name }
  },

  // ============================================
  // RESET PASSWORD — email + code + new password
  // ============================================
  resetPassword: async ({ email, code, password, confirmPassword }) => {
    const { data } = await client.post('/auth/reset-password', {
      email,
      code,
      password,
      confirmPassword,
    });
    return data; // { success, message }
  },

  // ============================================
  // CHANGE PASSWORD — authenticated user
  // ============================================
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    const { data } = await client.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return data;
  },

  // ============================================
  // GET CURRENT USER
  // ============================================
  getCurrentUser: async () => {
    const { data } = await client.get('/auth/me');
    return data;
  },
};

export default authApi;