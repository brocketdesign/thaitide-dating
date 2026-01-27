import axios from 'axios';
import { auth } from '@clerk/nextjs/server';

const API_URL = '/api';

/**
 * Get authorization headers with Clerk session token
 * NOTE: This function uses server-side auth() from Clerk
 * For client-side, use useAuth() hook from @clerk/nextjs
 */
async function getAuthHeaders() {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      throw new Error('No auth token available');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    throw error;
  }
}

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
 * Analytics API - for server-side calls
 */
export const analyticsApi = {
  /**
   * Check if current user has admin access
   */
  checkAccess: async () => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/check-access`, { headers });
  },

  /**
   * Get user overview metrics
   */
  getUsersOverview: async () => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/users/overview`, { headers });
  },

  /**
   * Get user demographics
   */
  getUsersDemographics: async () => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/users/demographics`, { headers });
  },

  /**
   * Get user growth over time
   */
  getUsersGrowth: async (period: string = '30d') => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/users/growth?period=${period}`, { headers });
  },

  /**
   * Get top users by activity metric
   */
  getTopUsers: async (metric: string = 'messages', limit: number = 50) => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/users/top?metric=${metric}&limit=${limit}`, { headers });
  },

  /**
   * Get filtered users list
   */
  getFilteredUsers: async (filters: any = {}, page: number = 1, limit: number = 50) => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return axios.get(`${API_URL}/analytics/users/list?${params.toString()}`, { headers });
  },

  /**
   * Get message analytics
   */
  getMessagesOverview: async () => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/messages/overview`, { headers });
  },

  /**
   * Get match analytics
   */
  getMatchesOverview: async () => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/matches/overview`, { headers });
  },

  /**
   * Get engagement metrics
   */
  getEngagementOverview: async () => {
    const headers = await getAuthHeaders();
    return axios.get(`${API_URL}/analytics/engagement/overview`, { headers });
  }
};

/**
 * Client-side analytics API
 * Use this in client components with useAuth() hook
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
