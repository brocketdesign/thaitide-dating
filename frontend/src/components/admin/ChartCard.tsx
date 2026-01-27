import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  actions?: React.ReactNode;
}

export default function ChartCard({ title, children, loading = false, error = null, actions }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions && <div>{actions}</div>}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading data</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && children}
    </div>
  );
}
