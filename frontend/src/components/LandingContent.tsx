'use client';

import Link from 'next/link';
import { FaHeart, FaGlobe, FaComments, FaStar } from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function LandingContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-6">
            ThaiTide
          </h1>
          <p className="text-2xl md:text-3xl text-gray-800 mb-4">
            {t.landing.tagline}
          </p>
          <p className="text-lg text-gray-600 mb-12">
            {t.landing.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
            >
              {t.landing.getStarted}
            </Link>
            <Link 
              href="/sign-in"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-full text-lg font-semibold hover:bg-purple-50 transition-all"
            >
              {t.common.signIn}
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
              <FaHeart className="text-pink-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.landing.features.smartMatching.title}</h3>
            <p className="text-gray-600">
              {t.landing.features.smartMatching.description}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <FaGlobe className="text-purple-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.landing.features.locationBased.title}</h3>
            <p className="text-gray-600">
              {t.landing.features.locationBased.description}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaComments className="text-blue-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.landing.features.realTimeChat.title}</h3>
            <p className="text-gray-600">
              {t.landing.features.realTimeChat.description}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <FaStar className="text-yellow-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.landing.features.premiumPerks.title}</h3>
            <p className="text-gray-600">
              {t.landing.features.premiumPerks.description}
            </p>
          </div>
        </div>

        {/* Language Support */}
        <div className="mt-20 text-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
