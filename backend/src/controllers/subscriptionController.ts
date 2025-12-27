import { Request, Response } from 'express';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { createCustomer, createSubscription } from '../services/stripe';

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { userId, plan } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create Stripe customer if doesn't exist
    let subscription = await Subscription.findOne({ userId });
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await createCustomer(user.email, userId);
      customerId = customer.id;
    }

    // Price IDs (in production, these would be real Stripe price IDs)
    const priceIds: { [key: string]: string } = {
      premium: 'price_premium_monthly',
      premium_plus: 'price_premium_plus_monthly'
    };

    const stripeSubscription = await createSubscription(customerId, priceIds[plan]);

    res.json({ 
      subscriptionId: stripeSubscription.id,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ message: 'Error creating checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      
      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        await handleSubscriptionCancellation(deletedSub);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
};

async function handleSubscriptionUpdate(stripeSubscription: any) {
  const userId = stripeSubscription.metadata.userId;
  
  const subscription = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: stripeSubscription.id },
    {
      userId,
      stripeCustomerId: stripeSubscription.customer,
      stripeSubscriptionId: stripeSubscription.id,
      plan: stripeSubscription.metadata.plan || 'premium',
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    },
    { upsert: true, new: true }
  );

  // Update user premium status
  await User.findByIdAndUpdate(userId, {
    isPremium: stripeSubscription.status === 'active',
    premiumUntil: new Date(stripeSubscription.current_period_end * 1000),
    visibility: stripeSubscription.status === 'active' ? 100 : 0
  });
}

async function handleSubscriptionCancellation(stripeSubscription: any) {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: stripeSubscription.id 
  });

  if (subscription) {
    subscription.status = 'canceled';
    await subscription.save();

    await User.findByIdAndUpdate(subscription.userId, {
      isPremium: false,
      visibility: 0
    });
  }
}
