/**
 * Admin API - Split into separate files for server and client components
 * 
 * IMPORTANT: 
 * - For CLIENT components: import from '@/lib/adminApi.client'
 * - For SERVER components: import from '@/lib/adminApi.server'
 * 
 * This file only re-exports the client API to maintain backward compatibility,
 * but you should use the specific imports above for clarity.
 */

// Re-export client API for backward compatibility
export { clientAnalyticsApi } from './adminApi.client';
