import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FaHeart, FaGlobe, FaComments, FaStar } from 'react-icons/fa';

export default async function Home() {
  // Check if Clerk is configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // Redirect authenticated users to discover page
  if (hasClerkKey) {
    const { userId } = await auth();
    if (userId) {
      redirect('/discover');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-6">
            ThaiTide
          </h1>
          <p className="text-2xl md:text-3xl text-gray-800 mb-4">
            Modern Dating for Thai Singles & Foreigners
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Connect for authentic romance and cultural discovery
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Get Started Free
            </Link>
            <Link 
              href="/sign-in"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-full text-lg font-semibold hover:bg-purple-50 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
              <FaHeart className="text-pink-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
            <p className="text-gray-600">
              Swipe-based matching with advanced algorithms to find your perfect connection
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <FaGlobe className="text-purple-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Location-Based</h3>
            <p className="text-gray-600">
              Find matches nearby with geolocation search and advanced filters
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaComments className="text-blue-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Chat</h3>
            <p className="text-gray-600">
              Instant messaging with your matches powered by real-time technology
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <FaStar className="text-yellow-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Premium Perks</h3>
            <p className="text-gray-600">
              Boosted visibility, unlimited likes, and exclusive features
            </p>
          </div>
        </div>

        {/* Language Support */}
        <div className="mt-20 text-center">
          <div className="inline-flex gap-4 bg-white px-8 py-4 rounded-full shadow-lg">
            <span className="text-lg">🇹🇭 ไทย</span>
            <span className="text-gray-400">|</span>
            <span className="text-lg">🇬🇧 English</span>
          </div>
        </div>
      </div>
    </div>
  );
}
