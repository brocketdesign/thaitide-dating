import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover'
}) : null;

export const createCustomer = async (email: string, userId: string) => {
  if (!stripe) throw new Error('Stripe not configured');
  return await stripe.customers.create({
    email,
    metadata: { userId }
  });
};

export const createCheckoutSession = async (
  customerId: string,
  plan: string,
  userId: string,
  currency: string = 'usd',
  successUrl: string,
  cancelUrl: string
) => {
  if (!stripe) throw new Error('Stripe not configured');
  
  // Define pricing based on plan and currency
  const pricing: { [key: string]: { [key: string]: number } } = {
    premium: {
      usd: 999, // $9.99 in cents
      thb: 34900, // ฿349 in satang
    },
    premium_plus: {
      usd: 1999, // $19.99 in cents
      thb: 69900, // ฿699 in satang
    },
  };

  const planPricing = pricing[plan];
  if (!planPricing) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const normalizedCurrency = currency.toLowerCase();
  const amount = planPricing[normalizedCurrency] || planPricing['usd'];
  const useCurrency = planPricing[normalizedCurrency] ? normalizedCurrency : 'usd';

  const planNames: { [key: string]: string } = {
    premium: 'ThaiTide Premium',
    premium_plus: 'ThaiTide Premium Plus',
  };

  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: useCurrency,
          product_data: {
            name: planNames[plan] || 'ThaiTide Premium',
            description: `Monthly subscription to ${planNames[plan] || 'ThaiTide Premium'}`,
          },
          unit_amount: amount,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      plan,
    },
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
  });
};

export const createSubscription = async (
  customerId: string,
  priceId: string
) => {
  if (!stripe) throw new Error('Stripe not configured');
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent']
  });
};

export const cancelSubscription = async (subscriptionId: string) => {
  if (!stripe) throw new Error('Stripe not configured');
  return await stripe.subscriptions.cancel(subscriptionId);
};

export const constructEvent = (
  payload: string | Buffer,
  signature: string,
  secret: string
) => {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

export { stripe };
