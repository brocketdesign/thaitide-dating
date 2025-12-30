import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { Message } from '../models/Message';

dotenv.config();

// Thai first names (for username generation)
const thaiMaleNames = ['somchai', 'prasert', 'tanawat', 'nattapong', 'kittisak', 'worawit', 'surapong', 'arthit', 'pichaya', 'thanakorn'];
const thaiFemaleNames = ['pornpan', 'sukanya', 'nattaya', 'siriporn', 'wanida', 'pimchanok', 'kannika', 'rattana', 'ploy', 'araya'];

// Interests pool
const interestsPool = [
  'Travel', 'Photography', 'Cooking', 'Music', 'Fitness', 'Reading', 
  'Movies', 'Beach', 'Hiking', 'Dancing', 'Art', 'Food', 
  'Yoga', 'Meditation', 'Gaming', 'Shopping', 'Nightlife', 'Coffee',
  'Thai Culture', 'Languages', 'Animals', 'Nature'
];

// Languages pool
const languagesPool = ['Thai', 'English', 'Chinese', 'Japanese', 'Korean', 'French', 'German'];

// Bios
const maleBios = [
  "Software engineer by day, foodie by night 🍜 Love exploring Bangkok's hidden gems",
  "Expat living in Thailand for 5 years. Looking for meaningful connections",
  "Fitness enthusiast and coffee addict ☕ Let's grab a drink sometime!",
  "Architect with a passion for Thai culture and temple hopping",
  "Digital nomad exploring Southeast Asia. Based in Chiang Mai currently",
  "Teacher turned entrepreneur. Love Thai food more than my own cooking!",
  "Music producer looking for my muse. Let's create something beautiful",
  "Doctor by profession, adventurer by heart. Ready for new experiences",
  "Investment banker taking a break from the corporate life. Beach lover",
  "Chef specializing in Thai-Western fusion. Looking for a taste tester!"
];

const femaleBios = [
  "Fashion designer with a love for Thai silk 🧵 Seeking genuine connections",
  "Nurse with a heart of gold. Family-oriented and traditional values",
  "Marketing manager who loves to travel. Let's explore Thailand together!",
  "Yoga instructor finding balance in life. Spiritual but not too serious",
  "University student studying international business. Fluent in 3 languages",
  "Hotel manager in Phuket. Beach life is the best life 🏖️",
  "Professional dancer bringing grace to everything I do",
  "Veterinarian who believes in kindness to all creatures",
  "Artist painting the colors of Thailand. Looking for inspiration",
  "Flight attendant seeing the world. Home is where the heart is ❤️"
];

// Thailand locations (longitude, latitude)
// Bangkok area locations prioritized (first 5) to ensure new users always see profiles
const thaiLocations = [
  { coordinates: [100.5018, 13.7563] as [number, number], city: 'Bangkok', country: 'Thailand' },
  { coordinates: [100.5018, 13.7563] as [number, number], city: 'Bangkok', country: 'Thailand' },
  { coordinates: [100.5018, 13.7563] as [number, number], city: 'Bangkok', country: 'Thailand' },
  { coordinates: [100.4927, 13.6514] as [number, number], city: 'Nonthaburi', country: 'Thailand' },
  { coordinates: [100.8771, 12.9236] as [number, number], city: 'Pattaya', country: 'Thailand' },
  { coordinates: [98.9853, 18.7883] as [number, number], city: 'Chiang Mai', country: 'Thailand' },
  { coordinates: [98.3923, 7.8804] as [number, number], city: 'Phuket', country: 'Thailand' },
  { coordinates: [99.9940, 9.1382] as [number, number], city: 'Koh Samui', country: 'Thailand' },
];

// Unsplash profile photos (using specific search terms for diverse Asian profiles)
const malePhotos = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1548449112-96a38a643324?w=400&h=400&fit=crop&crop=face',
];

const femalePhotos = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face',
];

// Helper functions
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomDate(minAge: number, maxAge: number): Date {
  const today = new Date();
  const minYear = today.getFullYear() - maxAge;
  const maxYear = today.getFullYear() - minAge;
  const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

// Seed prefix to identify seeded profiles (for easy deletion)
const SEED_PREFIX = 'seed_';

interface SeedResult {
  profiles: any[];
  insertedCount: number;
}

interface ResetSeedResult {
  deletedProfiles: number;
  deletedMatches: number;
  deletedMessages: number;
}

interface ResetAllResult {
  deletedUsers: number;
  deletedMatches: number;
  deletedMessages: number;
}

async function withDatabase<T>(action: () => Promise<T>): Promise<T> {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaitide-dating';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  }

  try {
    return await action();
  } finally {
    if (!isConnected) {
      await mongoose.disconnect();
      console.log('\n✅ Database connection closed');
    }
  }
}

export async function seedProfiles(): Promise<SeedResult> {
  return withDatabase(async () => {
    const profiles = [] as any[];

    for (let i = 0; i < 10; i++) {
      const location = getRandomItem(thaiLocations);
      profiles.push({
        clerkId: `${SEED_PREFIX}male_${i + 1}`,
        email: `${SEED_PREFIX}male${i + 1}@example.com`,
        username: `${thaiMaleNames[i]}${Math.floor(Math.random() * 9999)}`,
        profilePhoto: malePhotos[i],
        photos: [malePhotos[i]],
        bio: maleBios[i],
        dateOfBirth: generateRandomDate(25, 45),
        gender: 'male' as const,
        lookingFor: Math.random() > 0.2 ? 'female' as const : 'both' as const,
        location: {
          type: 'Point' as const,
          coordinates: location.coordinates,
          city: location.city,
          country: location.country
        },
        languages: getRandomItems(languagesPool, Math.floor(Math.random() * 3) + 1),
        interests: getRandomItems(interestsPool, Math.floor(Math.random() * 5) + 3),
        verified: Math.random() > 0.3,
        photoVerificationStatus: Math.random() > 0.3 ? 'verified' as const : 'pending' as const,
        isPremium: Math.random() > 0.7,
        visibility: Math.floor(Math.random() * 10),
        height: Math.floor(Math.random() * 25) + 165,
        weight: Math.floor(Math.random() * 30) + 60,
        education: getRandomItem(['high-school', 'bachelor', 'master', 'phd', 'other'] as const),
        englishAbility: getRandomItem(['beginner', 'intermediate', 'fluent', 'native'] as const),
        noChildren: getRandomItem(['yes', 'no', 'any'] as const),
        wantsChildren: getRandomItem(['yes', 'no', 'any'] as const),
        likes: [],
        dislikes: [],
        matches: []
      });
    }

    for (let i = 0; i < 10; i++) {
      const location = getRandomItem(thaiLocations);
      profiles.push({
        clerkId: `${SEED_PREFIX}female_${i + 1}`,
        email: `${SEED_PREFIX}female${i + 1}@example.com`,
        username: `${thaiFemaleNames[i]}${Math.floor(Math.random() * 9999)}`,
        profilePhoto: femalePhotos[i],
        photos: [femalePhotos[i]],
        bio: femaleBios[i],
        dateOfBirth: generateRandomDate(21, 38),
        gender: 'female' as const,
        lookingFor: Math.random() > 0.2 ? 'male' as const : 'both' as const,
        location: {
          type: 'Point' as const,
          coordinates: location.coordinates,
          city: location.city,
          country: location.country
        },
        languages: getRandomItems(languagesPool, Math.floor(Math.random() * 3) + 1),
        interests: getRandomItems(interestsPool, Math.floor(Math.random() * 5) + 3),
        verified: Math.random() > 0.3,
        photoVerificationStatus: Math.random() > 0.3 ? 'verified' as const : 'pending' as const,
        isPremium: Math.random() > 0.7,
        visibility: Math.floor(Math.random() * 10),
        height: Math.floor(Math.random() * 20) + 150,
        weight: Math.floor(Math.random() * 20) + 45,
        education: getRandomItem(['high-school', 'bachelor', 'master', 'phd', 'other'] as const),
        englishAbility: getRandomItem(['beginner', 'intermediate', 'fluent', 'native'] as const),
        noChildren: getRandomItem(['yes', 'no', 'any'] as const),
        wantsChildren: getRandomItem(['yes', 'no', 'any'] as const),
        likes: [],
        dislikes: [],
        matches: []
      });
    }

    const result = await User.insertMany(profiles);
    console.log(`✅ Successfully seeded ${result.length} profiles (10 male, 10 female)`);
    console.log('\n📋 Created profiles:');
    result.forEach((profile, index) => {
      console.log(`  ${index + 1}. @${profile.username} (${profile.gender}) - ${profile.location.city}`);
    });

    return { profiles: result, insertedCount: result.length };
  });
}

export async function resetSeedProfiles(): Promise<ResetSeedResult> {
  return withDatabase(async () => {
    const seedUsers = await User.find({ clerkId: { $regex: `^${SEED_PREFIX}` } });
    const seedUserIds = seedUsers.map(u => u._id);

    const matchResult = await Match.deleteMany({
      $or: [
        { user1: { $in: seedUserIds } },
        { user2: { $in: seedUserIds } }
      ]
    } as any);
    console.log(`🗑️  Deleted ${matchResult.deletedCount} matches involving seeded users`);

    const messageResult = await Message.deleteMany({
      $or: [
        { senderId: { $in: seedUserIds } },
        { receiverId: { $in: seedUserIds } }
      ]
    } as any);
    console.log(`🗑️  Deleted ${messageResult.deletedCount} messages involving seeded users`);

    await User.updateMany(
      {},
      {
        $pull: {
          likes: { $in: seedUserIds },
          dislikes: { $in: seedUserIds },
          matches: { $in: seedUserIds },
          profileVisitors: { visitorId: { $in: seedUserIds } }
        }
      }
    );

    const result = await User.deleteMany({ clerkId: { $regex: `^${SEED_PREFIX}` } });
    console.log(`🗑️  Deleted ${result.deletedCount} seeded profiles`);

    return {
      deletedProfiles: result.deletedCount || 0,
      deletedMatches: matchResult.deletedCount || 0,
      deletedMessages: messageResult.deletedCount || 0
    };
  });
}

export async function resetAllData(): Promise<ResetAllResult> {
  return withDatabase(async () => {
    const userResult = await User.deleteMany({});
    const matchResult = await Match.deleteMany({});
    const messageResult = await Message.deleteMany({});

    console.log(`🗑️  Deleted ${userResult.deletedCount} users`);
    console.log(`🗑️  Deleted ${matchResult.deletedCount} matches`);
    console.log(`🗑️  Deleted ${messageResult.deletedCount} messages`);

    return {
      deletedUsers: userResult.deletedCount || 0,
      deletedMatches: matchResult.deletedCount || 0,
      deletedMessages: messageResult.deletedCount || 0
    };
  });
}

// Parse command line arguments
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'seed':
          await seedProfiles();
          break;
        case 'reset':
          await resetSeedProfiles();
          break;
        case 'reset-all':
          await resetAllData();
          break;
        default:
          console.log(`
ThaiTide Dating - Seed Script

Usage:
  npx ts-node src/seed/seedProfiles.ts seed       - Create 20 test profiles (10 male, 10 female)
  npx ts-node src/seed/seedProfiles.ts reset      - Delete only seeded test profiles
  npx ts-node src/seed/seedProfiles.ts reset-all  - Delete ALL data (users, matches, messages)

Or use npm scripts:
  npm run seed           - Create test profiles
  npm run seed:reset     - Delete seeded profiles only
  npm run seed:reset-all - Delete all data
          `);
      }
      process.exit(0);
    } catch (error) {
      console.error('❌ Seed script error:', error);
      process.exit(1);
    }
  })();
}
