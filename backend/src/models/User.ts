import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  photos: string[];
  bio?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  lookingFor: 'male' | 'female' | 'both';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    city?: string;
    country?: string;
  };
  languages: string[];
  interests: string[];
  verified: boolean;
  photoVerificationStatus: 'pending' | 'verified' | 'rejected';
  isPremium: boolean;
  premiumUntil?: Date;
  visibility: number; // boosted visibility score
  likes: Schema.Types.ObjectId[];
  dislikes: Schema.Types.ObjectId[];
  matches: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePhoto: { type: String },
    photos: [{ type: String }],
    bio: { type: String, maxlength: 500 },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    lookingFor: { type: String, enum: ['male', 'female', 'both'], required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      city: { type: String },
      country: { type: String }
    },
    languages: [{ type: String }],
    interests: [{ type: String }],
    verified: { type: Boolean, default: false },
    photoVerificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending' 
    },
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date },
    visibility: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    matches: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

export const User = model<IUser>('User', userSchema);
