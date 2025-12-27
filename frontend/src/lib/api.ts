import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User endpoints
export const userApi = {
  createProfile: (data: any) => api.post('/users', data),
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (userId: string, data: any) => api.put(`/users/${userId}`, data),
  uploadPhoto: (userId: string, photoUrl: string) => 
    api.post(`/users/${userId}/photos`, { photoUrl }),
};

// Match endpoints
export const matchApi = {
  swipeRight: (userId: string, targetUserId: string) => 
    api.post(`/matches/${userId}/swipe-right`, { targetUserId }),
  swipeLeft: (userId: string, targetUserId: string) => 
    api.post(`/matches/${userId}/swipe-left`, { targetUserId }),
  getMatches: (userId: string) => api.get(`/matches/${userId}/matches`),
  getPotentialMatches: (userId: string, params?: any) => 
    api.get(`/matches/${userId}/potential`, { params }),
};

// Message endpoints
export const messageApi = {
  sendMessage: (data: any) => api.post('/messages', data),
  getMessages: (matchId: string, params?: any) => 
    api.get(`/messages/${matchId}`, { params }),
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),
};

// Subscription endpoints
export const subscriptionApi = {
  createCheckout: (userId: string, plan: string) => 
    api.post('/subscriptions/create-checkout', { userId, plan }),
};
