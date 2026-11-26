import client from './client';

export const announcementApi = {
  // Get all announcements
  getAll: async () => {
    const { data } = await client.get('/announcements');
    return data;
  },

  // Create a new announcement (Supports File Upload)
  create: async (payload) => {
    const { data } = await client.post('/announcements', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.announcement;
  },

  // Update an announcement (Supports File Upload)
  update: async (id, payload) => {
    const { data } = await client.put(`/announcements/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.announcement;
  },

  // Delete an announcement
  delete: async (id) => {
    const { data } = await client.delete(`/announcements/${id}`);
    return data;
  },
};