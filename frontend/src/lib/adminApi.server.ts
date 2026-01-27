import axios from 'axios';
import { auth } from '@clerk/nextjs/server';

const API_URL = '/api';

/**
 * Get authorization headers with Clerk session token
 * NOTE: This function uses server-side auth() from Clerk
 * Only use this in Server Components or Route Handlers
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
 * Analytics API - for server-side calls only
 * Use in Server Components or Route Handlers
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
