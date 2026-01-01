'use client';

import { useState, useEffect } from 'react';
import { subscriptionApi, userApi } from '@/lib/api';
import { FaCrown, FaBolt, FaCalendarAlt, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface SubscriptionData {
  _id: string;
  plan: 'premium' | 'premium_plus';
  status: 'active' | 'canceled' | 'past_due' | 'pending';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId: string;
}

interface UserPremiumData {
  isPremium: boolean;
  premiumUntil: string;
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [userPremium, setUserPremium] = useState<UserPremiumData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { t, language } = useTranslation();
  const { user, isLoaded } = useUser();

  // Fetch user profile ID
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded || !user?.id) return;
      
      try {
        const response = await userApi.getProfileByClerkId(user.id);
        if (response.data?.user?._id) {
          setProfileId(response.data.user._id);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [user?.id, isLoaded]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!profileId) return;
      
      try {
        setLoading(true);
        const response = await subscriptionApi.getSubscription(profileId);
        setSubscription(response.data.subscription);
        setUserPremium(response.data.user);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, [profileId]);

  const handleCancelSubscription = async () => {
    if (!profileId) return;
    
    try {
      setCancelLoading(true);
      await subscriptionApi.cancelSubscription(profileId);
      toast.success(t.subscription?.cancelSuccess || 'Subscription canceled successfully');
      
      // Refresh subscription data
      const response = await subscriptionApi.getSubscription(profileId);
      setSubscription(response.data.subscription);
      setUserPremium(response.data.user);
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error(t.errors.failedToSave);
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = (plan: string) => {
    if (plan === 'premium_plus') {
      return t.premium.plans.premiumPlus.name;
    }
    return t.premium.plans.premium.name;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'canceled':
        return 'text-orange-600 bg-orange-100';
      case 'past_due':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t.subscription?.statusActive || 'Active';
      case 'canceled':
        return t.subscription?.statusCanceled || 'Canceled';
      case 'past_due':
        return t.subscription?.statusPastDue || 'Past Due';
      case 'pending':
        return t.subscription?.statusPending || 'Pending';
      default:
        return status;
    }
  };

  // Show loading while checking authentication
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t.common.signIn}</h1>
          <p className="text-gray-600 mb-6">{t.subscription?.signInRequired || 'Please sign in to manage your subscription.'}</p>
          <a
            href="/sign-in"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
          >
            {t.common.signIn}
          </a>
        </div>
      </div>
    );
  }

  // No subscription found
  if (!subscription || subscription.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCrown className="text-4xl text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {t.subscription?.noSubscription || 'No Active Subscription'}
            </h1>
            <p className="text-gray-600 mb-8">
              {t.subscription?.noSubscriptionMessage || 'You don\'t have an active subscription. Upgrade to Premium to unlock all features!'}
            </p>
            <Link
              href="/premium"
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
            >
              {t.profile.upgradeToPremium}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
            {t.subscription?.title || 'Manage Subscription'}
          </h1>
          <p className="text-gray-600">
            {t.subscription?.subtitle || 'View and manage your subscription details'}
          </p>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          {/* Header */}
          <div className={`p-6 ${subscription.plan === 'premium_plus' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-pink-500 to-purple-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  {subscription.plan === 'premium_plus' ? (
                    <FaBolt className="text-2xl text-white" />
                  ) : (
                    <FaCrown className="text-2xl text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {getPlanName(subscription.plan)}
                  </h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Billing Period */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaCalendarAlt className="text-pink-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {t.subscription?.billingPeriod || 'Billing Period'}
                </h3>
                <p className="text-gray-600">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>

            {/* Next Billing / Cancellation Info */}
            {subscription.status === 'active' && (
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCheck className="text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {t.subscription?.nextBilling || 'Next Billing Date'}
                  </h3>
                  <p className="text-gray-600">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
            )}

            {subscription.status === 'canceled' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800">
                      {t.subscription?.canceledNotice || 'Subscription Canceled'}
                    </h3>
                    <p className="text-orange-700 text-sm">
                      {t.subscription?.accessUntil || 'You will have access to premium features until'} {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Features */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                {t.subscription?.includedFeatures || 'Included Features'}
              </h3>
              <ul className="space-y-2">
                {(subscription.plan === 'premium_plus' 
                  ? t.premium.plans.premiumPlus.features 
                  : t.premium.plans.premium.features
                ).map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <FaCheck className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          {subscription.status === 'active' && (
            <div className="border-t p-6">
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full border-2 border-red-500 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all"
                >
                  {t.subscription?.cancelSubscription || 'Cancel Subscription'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-center">
                      {t.subscription?.cancelConfirmMessage || 'Are you sure you want to cancel? You will lose access to premium features after your current billing period ends.'}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      {cancelLoading ? t.common.loading : (t.subscription?.confirmCancel || 'Yes, Cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resubscribe Option */}
          {subscription.status === 'canceled' && (
            <div className="border-t p-6">
              <Link
                href="/premium"
                className="block w-full text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
              >
                {t.subscription?.resubscribe || 'Resubscribe'}
              </Link>
            </div>
          )}
        </div>

        {/* Back to Profile */}
        <div className="text-center">
          <Link
            href="/profile"
            className="text-pink-500 hover:text-pink-600 font-medium"
          >
            ← {t.common.back} {t.nav.profile}
          </Link>
        </div>
      </div>
    </div>
  );
}
