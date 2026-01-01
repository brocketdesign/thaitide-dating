import axios from 'axios';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

export const getImageUrl = (path: string) => {
  // If it's already a full URL (starts with http/https), return as-is
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  
  if (typeof window !== 'undefined') {
    return path;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User endpoints
export const userApi = {
  createProfile: (data: any) => api.post('/users', data),
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  getProfileByClerkId: (clerkId: string) => api.get(`/users/clerk/${clerkId}`),
  updateProfile: (userId: string, data: any) => api.put(`/users/${userId}`, data),
  uploadPhoto: (userId: string, photoUrl: string) => 
    api.post(`/users/${userId}/photos`, { photoUrl }),
  addPhoto: (userId: string, image: string) => 
    api.post(`/users/${userId}/photos/add`, { image }),
  setProfilePhoto: (userId: string, photoUrl: string) => 
    api.put(`/users/${userId}/photos/profile`, { photoUrl }),
  removePhoto: (userId: string, photoUrl: string) => 
    api.delete(`/users/${userId}/photos`, { data: { photoUrl } }),
  checkProfileExists: (clerkId: string) => api.get(`/users/clerk/${clerkId}/exists`),
  checkUsername: (username: string) => api.get(`/users/check-username/${username}`),
  searchByUsername: (userId: string, query: string) => 
    api.get(`/users/search/${userId}`, { params: { query } }),
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
  getOrCreateConversation: (userId: string, targetUserId: string) =>
    api.post(`/matches/${userId}/conversation`, { targetUserId }),
  findMatchBetweenUsers: (userId: string, targetUserId: string) =>
    api.get(`/matches/${userId}/match-with/${targetUserId}`),
  getInteractionStatus: (userId: string, targetUserId: string) =>
    api.get(`/matches/${userId}/interaction-status/${targetUserId}`),
  getLikedProfiles: (userId: string) => api.get(`/matches/${userId}/liked`),
  getWhoLikedMe: (userId: string) => api.get(`/matches/${userId}/who-liked-me`),
  getProfileVisitors: (userId: string) => api.get(`/matches/${userId}/visitors`),
  recordProfileVisit: (userId: string, visitorId: string) =>
    api.post(`/matches/${userId}/record-visit`, { visitorId }),
  getMatchDetails: (matchId: string, currentUserId?: string) =>
    api.get(`/matches/details/${matchId}`, { params: { currentUserId } }),
};

// Message endpoints
export const messageApi = {
  sendMessage: (data: any) => api.post('/messages', data),
  getMessages: (matchId: string, params?: any) => 
    api.get(`/messages/${matchId}`, { params }),
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),
  getConversations: (userId: string) => api.get(`/messages/conversations/${userId}`),
  getUnreadCount: (userId: string) => api.get(`/messages/unread/${userId}`),
  markConversationAsRead: (matchId: string, userId: string) => 
    api.put(`/messages/${matchId}/read-all/${userId}`),
};

// Subscription endpoints
export const subscriptionApi = {
  createCheckout: (userId: string, plan: string, currency: string = 'usd') => 
    api.post('/subscriptions/create-checkout', { userId, plan, currency }),
  getSubscription: (userId: string) => 
    api.get(`/subscriptions/${userId}`),
  cancelSubscription: (userId: string) => 
    api.post(`/subscriptions/${userId}/cancel`),
};

// Upload endpoints
export const uploadApi = {
  verifyAndUpload: (base64Image: string) => 
    api.post('/uploads/verify', { image: base64Image }),
  moderate: (base64Image: string) => 
    api.post('/uploads/moderate', { image: base64Image }),
};
