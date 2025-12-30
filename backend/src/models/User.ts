import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  username: string;
  profilePhoto?: string;
  photos: string[];
  bio?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  lookingFor: 'male' | 'female' | 'both';
  isAI: boolean; // Whether this is an AI-generated profile
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    city?: string;
    country?: string;
  };
  languages: string[];
  interests: string[];
  // Physical attributes
  height?: number; // in cm
  weight?: number; // in kg
  // Profile information
  education?: 'high-school' | 'bachelor' | 'master' | 'phd' | 'other';
  englishAbility?: 'beginner' | 'intermediate' | 'fluent' | 'native';
  // Family preferences
  noChildren?: 'yes' | 'no' | 'any';
  wantsChildren?: 'yes' | 'no' | 'any';
  // Visibility and status
  lastActiveAt?: Date;
  verified: boolean;
  photoVerificationStatus: 'pending' | 'verified' | 'rejected';
  isPremium: boolean;
  premiumUntil?: Date;
  visibility: number; // boosted visibility score
  // Interactions
  likes: Schema.Types.ObjectId[];
  dislikes: Schema.Types.ObjectId[];
  matches: Schema.Types.ObjectId[];
  profileVisitors: { visitorId: Schema.Types.ObjectId; visitedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
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
    // Physical attributes
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    // Profile information
    education: { 
      type: String, 
      enum: ['high-school', 'bachelor', 'master', 'phd', 'other']
    },
    englishAbility: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'fluent', 'native']
    },
    // Family preferences
    noChildren: { 
      type: String, 
      enum: ['yes', 'no', 'any'],
      default: 'any'
    },
    wantsChildren: { 
      type: String, 
      enum: ['yes', 'no', 'any'],
      default: 'any'
    },
    // Visibility and status
    lastActiveAt: { type: Date },
    verified: { type: Boolean, default: false },
    photoVerificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending' 
    },
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date },
    visibility: { type: Number, default: 0 },
    isAI: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    matches: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    profileVisitors: [{
      visitorId: { type: Schema.Types.ObjectId, ref: 'User' },
      visitedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

export const User = model<IUser>('User', userSchema);
