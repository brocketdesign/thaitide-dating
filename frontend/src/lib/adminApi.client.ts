import axios from 'axios';

const API_URL = '/api';

/**
 * Create axios instance for client-side requests
 * Pass token directly when calling from client components
 */
function createClientRequest(token: string) {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Client-side analytics API
 * Use this in client components with useAuth() hook from @clerk/nextjs
 */
export const clientAnalyticsApi = {
  /**
   * Check if current user has admin access
   */
  checkAccess: (token: string) => {
    const api = createClientRequest(token);
    return api.get('/analytics/check-access');
  },

  /**
   * Get user overview metrics
   */
  getUsersOverview: (token: string) => {
    const api = createClientRequest(token);
    return api.get('/analytics/users/overview');
  },

  /**
   * Get user demographics
   */
  getUsersDemographics: (token: string) => {
    const api = createClientRequest(token);
    return api.get('/analytics/users/demographics');
  },

  /**
   * Get user growth over time
   */
  getUsersGrowth: (token: string, period: string = '30d') => {
    const api = createClientRequest(token);
    return api.get(`/analytics/users/growth?period=${period}`);
  },

  /**
   * Get top users by activity metric
   */
  getTopUsers: (token: string, metric: string = 'messages', limit: number = 50) => {
    const api = createClientRequest(token);
    return api.get(`/analytics/users/top?metric=${metric}&limit=${limit}`);
  },

  /**
   * Get filtered users list
   */
  getFilteredUsers: (token: string, filters: any = {}, page: number = 1, limit: number = 50) => {
    const api = createClientRequest(token);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return api.get(`/analytics/users/list?${params.toString()}`);
  },

  /**
   * Get message analytics
   */
  getMessagesOverview: (token: string) => {
    const api = createClientRequest(token);
    return api.get('/analytics/messages/overview');
  },

  /**
   * Get match analytics
   */
  getMatchesOverview: (token: string) => {
    const api = createClientRequest(token);
    return api.get('/analytics/matches/overview');
  },

  /**
   * Get engagement metrics
   */
  getEngagementOverview: (token: string) => {
    const api = createClientRequest(token);
    return api.get('/analytics/engagement/overview');
  }
};
