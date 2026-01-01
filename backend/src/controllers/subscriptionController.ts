import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { createCustomer, createCheckoutSession, cancelSubscription } from '../services/stripe';

export const createCheckoutSession_handler = async (req: Request, res: Response) => {
  try {
    const { userId, plan, currency = 'usd' } = req.body;

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
      
      // Save customer ID to subscription record
      if (!subscription) {
        subscription = new Subscription({
          userId,
          stripeCustomerId: customerId,
          status: 'pending',
        });
        await subscription.save();
      } else {
        subscription.stripeCustomerId = customerId;
        await subscription.save();
      }
    }

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession(
      customerId,
      plan,
      userId,
      currency,
      `${frontendUrl}/premium?success=true`,
      `${frontendUrl}/premium?canceled=true`
    );

    res.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
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
  
  // Try to find by stripeSubscriptionId first
  let subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });

  // If not found, try to find by userId (to update the pending one created during checkout session creation)
  if (!subscription && userId) {
    subscription = await Subscription.findOne({ userId });
  }

  if (subscription) {
    subscription.userId = userId;
    subscription.stripeCustomerId = stripeSubscription.customer;
    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.plan = stripeSubscription.metadata.plan || 'premium';
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    await subscription.save();
  } else {
    subscription = await Subscription.create({
      userId,
      stripeCustomerId: stripeSubscription.customer,
      stripeSubscriptionId: stripeSubscription.id,
      plan: stripeSubscription.metadata.plan || 'premium',
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    });
  }

  // Update user premium status
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      isPremium: stripeSubscription.status === 'active',
      premiumUntil: new Date(stripeSubscription.current_period_end * 1000),
      visibility: stripeSubscription.status === 'active' ? 100 : 0
    });
  }
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

// Get subscription details for a user
export const getSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({ userId: userId as any });
    
    if (!subscription) {
      return res.json({ subscription: null });
    }

    // Also get user premium status
    const user = await User.findById(userId).select('isPremium premiumUntil');

    res.json({ 
      subscription: {
        _id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      },
      user: {
        isPremium: user?.isPremium,
        premiumUntil: user?.premiumUntil,
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Error fetching subscription' });
  }
};

// Cancel subscription
export const cancelSubscription_handler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({ userId: userId as any });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription to cancel' });
    }

    if (subscription.status === 'canceled') {
      return res.status(400).json({ message: 'Subscription is already canceled' });
    }

    // Cancel the subscription in Stripe
    await cancelSubscription(subscription.stripeSubscriptionId);

    // Update subscription status locally
    subscription.status = 'canceled';
    await subscription.save();

    // Update user premium status (they keep premium until period ends)
    // Note: We don't immediately remove premium - it remains until currentPeriodEnd
    
    res.json({ 
      message: 'Subscription canceled successfully',
      subscription: {
        _id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Error canceling subscription' });
  }
};
