import { Schema, model, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: Schema.Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan?: 'premium' | 'premium_plus';
  status: 'active' | 'canceled' | 'past_due' | 'pending';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    plan: { type: String, enum: ['premium', 'premium_plus'] },
    status: { type: String, enum: ['active', 'canceled', 'past_due', 'pending'], required: true, default: 'pending' },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date }
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
