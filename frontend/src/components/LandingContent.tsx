'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaHeart, FaGlobe, FaComments, FaStar, FaUsers, FaRocket, FaShieldAlt, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// Sample profile data for the carousel
const sampleProfiles = [
  { id: 1, name: 'Narin', age: 26, city: 'Bangkok', interests: ['Travel', 'Photography'], verified: true },
  { id: 2, name: 'Ploy', age: 24, city: 'Chiang Mai', interests: ['Yoga', 'Cooking'], verified: true },
  { id: 3, name: 'Fern', age: 28, city: 'Phuket', interests: ['Dancing', 'Art'], verified: false },
  { id: 4, name: 'Nan', age: 25, city: 'Pattaya', interests: ['Music', 'Movies'], verified: true },
  { id: 5, name: 'May', age: 27, city: 'Bangkok', interests: ['Fitness', 'Reading'], verified: true },
  { id: 6, name: 'Som', age: 23, city: 'Krabi', interests: ['Beach', 'Diving'], verified: false },
  { id: 7, name: 'Pim', age: 29, city: 'Hua Hin', interests: ['Golf', 'Wine'], verified: true },
  { id: 8, name: 'Joy', age: 24, city: 'Bangkok', interests: ['Fashion', 'Shopping'], verified: true },
  { id: 9, name: 'Bee', age: 26, city: 'Chiang Rai', interests: ['Nature', 'Hiking'], verified: false },
  { id: 10, name: 'Mint', age: 25, city: 'Samui', interests: ['Spa', 'Wellness'], verified: true },
];

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

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-500 mb-2">500,000+</div>
                <div className="text-gray-600">{t.landing.stats.activeUsers}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-500 mb-2">1M+</div>
                <div className="text-gray-600">{t.landing.stats.successfulMatches}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-500 mb-2">4.8★</div>
                <div className="text-gray-600">{t.landing.stats.userRating}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Carousel */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {t.landing.carousel.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.landing.carousel.subtitle}
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4">
            <Swiper
              modules={[Autoplay, EffectCoverflow]}
              effect="coverflow"
              grabCursor={true}
              centeredSlides={true}
              initialSlide={4}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
              }}
              spaceBetween={24}
              slidesPerView={1}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
                1280: {
                  slidesPerView: 4,
                },
              }}
              className="pb-8 profile-carousel"
            >
              {sampleProfiles.map((profile) => (
                <SwiperSlide key={profile.id}>
                  <div className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Image container */}
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={`/assets/woman/image/profil-${profile.id}.JPG`}
                        alt={profile.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Verified badge */}
                      {profile.verified && (
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-green-600 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                          <FaCheckCircle className="text-green-500" />
                          {t.landing.carousel.verified}
                        </div>
                      )}
                      
                      {/* Profile info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white text-lg font-bold tracking-tight">
                              {profile.name}, {profile.age}
                            </h3>
                            <div className="flex items-center text-white/90 text-sm mt-0.5">
                              <FaMapMarkerAlt className="mr-1.5 text-pink-400 text-xs" />
                              {profile.city}
                            </div>
                          </div>
                          <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-pink-500 hover:scale-110 transition-all duration-200">
                            <FaHeart className="text-white text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card footer */}
                    <div className="px-4 py-3 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        {/* Interests */}
                        <div className="flex gap-1.5">
                          {profile.interests.slice(0, 2).map((interest, idx) => (
                            <span 
                              key={idx}
                              className="px-2.5 py-1 bg-white text-gray-600 rounded-full text-xs font-medium border border-gray-100"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                        {/* Online indicator */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-gray-500 font-medium">{t.landing.carousel.online}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* Video Sections */}
        <div className="mt-20 space-y-20">
          {/* Video 1 - Easy Chat */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                  {t.landing.videoSections.chat.title}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {t.landing.videoSections.chat.description}
                </p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <FaComments className="text-blue-500 text-2xl" />
                    <span className="text-gray-700 font-semibold">{t.landing.videoSections.chat.realTimeMessaging}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaRocket className="text-green-500 text-2xl" />
                    <span className="text-gray-700 font-semibold">{t.landing.videoSections.chat.instantDelivery}</span>
                  </div>
                </div>
                <Link 
                  href="/sign-up"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  {t.landing.videoSections.chat.cta}
                </Link>
              </div>
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <video
                  className="w-full"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/assets/woman/video/video-1-thumb.JPG"
                >
                  <source src="/assets/woman/video/video-1.MP4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          {/* Video 2 - Smart Matching */}
          <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 overflow-hidden rounded-2xl shadow-2xl">
                <video
                  className="w-full"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/assets/woman/video/video-2-thumb.JPG"
                >
                  <source src="/assets/woman/video/video-2.MP4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                  {t.landing.videoSections.matching.title}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {t.landing.videoSections.matching.description}
                </p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <FaHeart className="text-pink-500 text-2xl" />
                    <span className="text-gray-700 font-semibold">{t.landing.videoSections.matching.aiPowered}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaShieldAlt className="text-green-500 text-2xl" />
                    <span className="text-gray-700 font-semibold">{t.landing.videoSections.matching.verifiedProfiles}</span>
                  </div>
                </div>
                <Link 
                  href="/sign-up"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  {t.landing.videoSections.matching.cta}
                </Link>
              </div>
            </div>
          </div>

          {/* Video 3 - Premium Features */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                  {t.landing.videoSections.premium.title}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {t.landing.videoSections.premium.description}
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <FaStar className="text-yellow-500 text-xl" />
                    <span className="text-gray-700">{t.landing.videoSections.premium.unlimitedLikes}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaUsers className="text-purple-500 text-xl" />
                    <span className="text-gray-700">{t.landing.videoSections.premium.seeViewers}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaRocket className="text-orange-500 text-xl" />
                    <span className="text-gray-700">{t.landing.videoSections.premium.profileBoost}</span>
                  </div>
                </div>
                <Link 
                  href="/premium"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  {t.landing.videoSections.premium.cta}
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl shadow-2xl">
                <video
                  className="w-full"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/assets/woman/video/video-3-thumb.JPG"
                >
                  <source src="/assets/woman/video/video-3.MP4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          {/* Video 4 - Success Stories */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 overflow-hidden rounded-2xl shadow-2xl">
                <video
                  className="w-full"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/assets/woman/video/video-4-thumb.JPG"
                >
                  <source src="/assets/woman/video/video-4.MP4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                  {t.landing.videoSections.success.title}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {t.landing.videoSections.success.description}
                </p>
                <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-3">
                    &ldquo;{t.landing.videoSections.success.testimonial}&rdquo;
                  </p>
                  <p className="text-gray-500 text-sm">{t.landing.videoSections.success.testimonialAuthor}</p>
                </div>
                <Link 
                  href="/sign-up"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  {t.landing.videoSections.success.cta}
                </Link>
              </div>
            </div>
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
