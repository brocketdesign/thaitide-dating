import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  suffix?: string;
  loading?: boolean;
}

export default function MetricsCard({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  suffix = '',
  loading = false
}: MetricsCardProps) {
  // Format number with commas
  const formatNumber = (num: number | string) => {
    if (typeof num === 'string') return num;
    return num.toLocaleString();
  };

  // Get trend color
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (trend === 'up') return <FiTrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <FiTrendingDown className="w-4 h-4" />;
    return <FiMinus className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatNumber(value)}
            {suffix && <span className="text-lg text-gray-600 ml-1">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
