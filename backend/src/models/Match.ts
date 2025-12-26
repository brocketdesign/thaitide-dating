import { Schema, model, Document } from 'mongoose';

export interface IMatch extends Document {
  user1: Schema.Types.ObjectId;
  user2: Schema.Types.ObjectId;
  createdAt: Date;
  lastMessageAt?: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    user1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    user2: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

export const Match = model<IMatch>('Match', matchSchema);
