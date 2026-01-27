'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { clientAnalyticsApi } from '@/lib/adminApi';
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function UsersPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    isPremium: '',
    verified: '',
    minAge: '',
    maxAge: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      // Clean filters (remove empty values)
      const cleanFilters: any = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') cleanFilters[key] = value;
      });

      const response = await clientAnalyticsApi.getFilteredUsers(token, cleanFilters, page, 50);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = () => {
    setPage(1); // Reset to page 1 when filtering
    fetchUsers();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      gender: '',
      isPremium: '',
      verified: '',
      minAge: '',
      maxAge: ''
    });
    setPage(1);
  };

  useEffect(() => {
    if (filters.search === '' && filters.gender === '' && filters.isPremium === '' &&
        filters.verified === '' && filters.minAge === '' && filters.maxAge === '') {
      fetchUsers();
    }
  }, [filters]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
        <p className="text-gray-600">Browse and filter users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <FiFilter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </button>
          <div className="text-sm text-gray-600">
            {pagination && `${pagination.total} users found`}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
              <input
                type="number"
                value={filters.minAge}
                onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="18"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
              <input
                type="number"
                value={filters.maxAge}
                onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Premium Status</label>
              <select
                value={filters.isPremium}
                onChange={(e) => setFilters({ ...filters, isPremium: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="true">Premium</option>
                <option value="false">Free</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
              <select
                value={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by username or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age / Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profilePhoto ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.profilePhoto}
                                alt={user.username}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {user.username[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">@{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.age || 'N/A'} years</div>
                        <div className="text-sm text-gray-500 capitalize">{user.gender}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.location?.city || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{user.location?.country || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {user.isPremium && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Premium
                            </span>
                          )}
                          {user.verified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
