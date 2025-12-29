'use client';

import { useState } from 'react';
import { subscriptionApi } from '@/lib/api';
import { FaCheck, FaStar, FaBolt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubscribe = async (plan: string) => {
    try {
      setLoading(true);
      const userId = 'temp-user-id'; // This would come from your user profile
      const response = await subscriptionApi.createCheckout(userId, plan);
      
      // In production, redirect to Stripe checkout
      toast.success(t.toasts.subscriptionCreated);
      console.log('Subscription created:', response.data);
    } catch (error) {
      toast.error(t.errors.failedToSave);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: t.premium.plans.premium.name,
      price: '$9.99',
      interval: t.premium.perMonth,
      features: t.premium.plans.premium.features,
      gradient: 'from-pink-500 to-purple-600',
      icon: <FaStar className="text-3xl" />
    },
    {
      name: t.premium.plans.premiumPlus.name,
      price: '$19.99',
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
                  onClick={() => handleSubscribe(plan.name.toLowerCase().replace(' ', '_'))}
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
