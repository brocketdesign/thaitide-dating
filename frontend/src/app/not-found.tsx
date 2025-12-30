'use client';

import Link from 'next/link';
import { FaHeart, FaHome } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Broken heart icon */}
        <div className="mb-8">
          <div className="relative inline-block">
            <FaHeart className="w-24 h-24 text-pink-300 opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-pink-500">404</span>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>
        
        <p className="text-gray-600 mb-8">
          Oops! Looks like this page has gone on a date somewhere else. 
          Let&apos;s get you back to finding your perfect match.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <FaHome className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
