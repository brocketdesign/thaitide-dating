'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { clientAnalyticsApi } from '@/lib/adminApi.client';
import MetricsCard from '@/components/admin/MetricsCard';
import ChartCard from '@/components/admin/ChartCard';
import { FiUsers, FiHeart, FiMessageSquare, FiStar } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);
  const [messages, setMessages] = useState<any>(null);
  const [matches, setMatches] = useState<any>(null);
  const [period, setPeriod] = useState('30d');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [overviewRes, demographicsRes, growthRes, messagesRes, matchesRes] = await Promise.all([
        clientAnalyticsApi.getUsersOverview(token),
        clientAnalyticsApi.getUsersDemographics(token),
        clientAnalyticsApi.getUsersGrowth(token, period),
        clientAnalyticsApi.getMessagesOverview(token),
        clientAnalyticsApi.getMatchesOverview(token)
      ]);

      setOverview(overviewRes.data.data);
      setDemographics(demographicsRes.data.data);
      setGrowth(growthRes.data.data);
      setMessages(messagesRes.data.data);
      setMatches(matchesRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [period]);

  const COLORS = ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981'];

  // Format gender data for pie chart
  const genderData = demographics ? [
    { name: 'Male', value: demographics.gender.male },
    { name: 'Female', value: demographics.gender.female },
    { name: 'Other', value: demographics.gender.other }
  ].filter(d => d.value > 0) : [];

  // Format age data for bar chart
  const ageData = demographics ? [
    { age: '18-24', count: demographics.ageDistribution['18-24'] },
    { age: '25-34', count: demographics.ageDistribution['25-34'] },
    { age: '35-44', count: demographics.ageDistribution['35-44'] },
    { age: '45-54', count: demographics.ageDistribution['45-54'] },
    { age: '55+', count: demographics.ageDistribution['55+'] }
  ] : [];

  // Format growth data for line chart
  const growthData = growth ? growth.labels.map((label: string, index: number) => ({
    date: label,
    new: growth.values[index],
    total: growth.cumulative[index]
  })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Monitor your app's performance and user metrics</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Users"
          value={overview?.totalUsers || 0}
          change={overview?.growthRate?.monthly}
          icon={<FiUsers className="w-6 h-6" />}
          trend={overview?.growthRate?.monthly > 0 ? 'up' : overview?.growthRate?.monthly < 0 ? 'down' : 'neutral'}
          loading={loading}
        />
        <MetricsCard
          title="Active Users"
          value={overview?.activeUsers || 0}
          icon={<FiStar className="w-6 h-6" />}
          suffix="last 30d"
          loading={loading}
        />
        <MetricsCard
          title="Premium Users"
          value={overview?.premiumUsers || 0}
          change={overview?.premiumConversionRate}
          icon={<FiStar className="w-6 h-6" />}
          suffix={`(${overview?.premiumConversionRate || 0}%)`}
          trend="neutral"
          loading={loading}
        />
        <MetricsCard
          title="Total Matches"
          value={matches?.totalMatches || 0}
          icon={<FiHeart className="w-6 h-6" />}
          loading={loading}
        />
      </div>

      {/* User Growth Chart */}
      <ChartCard
        title="User Growth"
        loading={loading}
        actions={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="new" stroke="#3B82F6" name="New Users" />
            <Line type="monotone" dataKey="total" stroke="#10B981" name="Total Users" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Gender Distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Age Distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Countries */}
      {demographics && demographics.topCountries.length > 0 && (
        <ChartCard title="Top Countries" loading={loading}>
          <div className="space-y-2">
            {demographics.topCountries.map((country: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-900">{country.country}</span>
                <span className="text-gray-600">{country.count} users</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Message & Match Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Messages</span>
              <span className="font-semibold">{messages?.totalMessages?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Today</span>
              <span className="font-semibold">{messages?.todayMessages?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Week</span>
              <span className="font-semibold">{messages?.weekMessages?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">AI Generated</span>
              <span className="font-semibold">{messages?.aiGeneratedPercentage || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Matches</span>
              <span className="font-semibold">{matches?.totalMatches?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Today</span>
              <span className="font-semibold">{matches?.todayMatches?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-semibold">{matches?.matchSuccessRate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Conversations</span>
              <span className="font-semibold">{matches?.activeConversations?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
