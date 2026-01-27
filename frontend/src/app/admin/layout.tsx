'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { clientAnalyticsApi } from '@/lib/adminApi';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, userId, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!isLoaded) return;

      if (!userId) {
        router.push('/sign-in');
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          router.push('/sign-in');
          return;
        }

        const response = await clientAnalyticsApi.checkAccess(token);
        if (response.data.success && response.data.data.isAdmin) {
          setIsAdmin(true);
        } else {
          router.push('/discover');
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/discover');
      } finally {
        setChecking(false);
      }
    }

    checkAdmin();
  }, [isLoaded, userId, getToken, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="hidden md:flex gap-6">
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Overview
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Users
                </Link>
              </div>
            </div>
            <Link
              href="/discover"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to App
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
