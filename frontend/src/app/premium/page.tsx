'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { subscriptionApi, userApi } from '@/lib/api';
import { FaCheck, FaStar, FaBolt, FaCrown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

function PremiumPageContent() {
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { t, language } = useTranslation();
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for success/canceled query params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success(t.toasts.subscriptionCreated);
      // Redirect to subscription page after successful payment
      setTimeout(() => {
        router.push('/subscription');
      }, 2000);
    } else if (searchParams.get('canceled') === 'true') {
      toast.error(t.errors.paymentCanceled || 'Payment was canceled');
    }
  }, [searchParams, t, router]);

  // Fetch user profile ID
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded) return;
      
      if (user?.id) {
        try {
          setProfileLoading(true);
          console.log('Fetching profile for Clerk user ID:', user.id);
          const response = await userApi.getProfileByClerkId(user.id);
          console.log('Profile response:', response.data);
          // The API returns { user: {...} } so we need to access response.data.user._id
          if (response.data?.user?._id) {
            setProfileId(response.data.user._id);
            setIsPremium(response.data.user.isPremium || false);
            console.log('Set profileId to:', response.data.user._id);
            
            // Check if user has an active subscription
            try {
              const subResponse = await subscriptionApi.getSubscription(response.data.user._id);
              if (subResponse.data?.subscription?.status === 'active') {
                setHasActiveSubscription(true);
              }
            } catch (subError) {
              console.log('No subscription found');
            }
          } else {
            console.log('No profile found for user');
            setProfileId(null);
          }
        } catch (error: any) {
          console.error('Error fetching profile:', error);
          // 404 means profile doesn't exist, which is fine
          if (error.response?.status === 404) {
            setProfileId(null);
          }
        } finally {
          setProfileLoading(false);
        }
      } else {
        console.log('No Clerk user ID available');
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id, isLoaded]);

  // Show loading while Clerk is loading or profile is loading
  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access premium features.</p>
          <a
            href="/sign-in"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Show create profile prompt if user doesn't have a profile
  if (isLoaded && user && !profileId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">Please create your profile before subscribing to premium features.</p>
          <Link
            href="/onboarding"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all mr-4"
          >
            Create Profile
          </Link>
          <Link
            href="/profile"
            className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  const handleSubscribe = async (plan: string) => {
    if (!isLoaded) {
      toast.error('Loading user information...');
      return;
    }

    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (!profileId) {
      toast.error(t.errors.profileNotFound || 'Please create a profile first');
      return;
    }

    try {
      setLoading(true);
      console.log('Subscribing with profileId:', profileId);
      // Use currency based on language (THB for Thai, USD for others)
      const currency = language === 'th' ? 'thb' : 'usd';
      const response = await subscriptionApi.createCheckout(profileId, plan, currency);
      
      // Redirect to Stripe checkout
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        toast.error(t.errors.failedToSave);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t.errors.failedToSave);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: t.premium.plans.premium.name,
      price: t.premium.plans.premium.priceDisplay,
      planKey: 'premium',
      interval: t.premium.perMonth,
      features: t.premium.plans.premium.features,
      gradient: 'from-pink-500 to-purple-600',
      icon: <FaStar className="text-3xl" />
    },
    {
      name: t.premium.plans.premiumPlus.name,
      price: t.premium.plans.premiumPlus.priceDisplay,
      planKey: 'premium_plus',
      interval: t.premium.perMonth,
      features: t.premium.plans.premiumPlus.features,
      gradient: 'from-purple-600 to-indigo-600',
      icon: <FaBolt className="text-3xl" />,
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Existing Premium User Banner */}
        {hasActiveSubscription && (
          <div className="mb-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <FaCrown className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t.profile.premiumMember}</h2>
                  <p className="text-white/80">{t.subscription?.noSubscriptionMessage?.split('.')[0] || 'You have an active subscription'}</p>
                </div>
              </div>
              <Link
                href="/subscription"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all"
              >
                {t.subscription?.manageSubscription || 'Manage Subscription'}
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
            {t.premium.title}
          </h1>
          <p className="text-xl text-gray-600">
            {t.premium.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
                plan.popular ? 'ring-4 ring-purple-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 font-semibold">
                  {t.premium.popular}
                </div>
              )}
              
              <div className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-r ${plan.gradient} rounded-full flex items-center justify-center text-white mb-4`}>
                  {plan.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.interval}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.planKey)}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r ${plan.gradient} text-white py-4 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? t.premium.processing : t.premium.subscribe}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">{t.premium.freeTrial}</p>
          <p className="text-sm">{t.premium.cancelAnytime}</p>
        </div>
      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PremiumPageContent />
    </Suspense>
  );
}
