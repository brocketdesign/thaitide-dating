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
