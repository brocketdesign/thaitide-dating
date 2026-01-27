import mongoose from 'mongoose';
import { User } from '../models/User';

/**
 * Script to add admin role to a user
 * Usage:
 *   npm run add-admin -- --email=user@example.com
 *   npm run add-admin -- --email=user@example.com --uri=mongodb://...
 *   npm run add-admin -- --clerkId=user_xxxxx
 */

async function addAdmin() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let email: string | null = null;
    let clerkId: string | null = null;
    let mongoUri: string | null = null;

    args.forEach(arg => {
      if (arg.startsWith('--email=')) {
        email = arg.split('=')[1];
      } else if (arg.startsWith('--clerkId=')) {
        clerkId = arg.split('=')[1];
      } else if (arg.startsWith('--uri=')) {
        mongoUri = arg.split('=')[1];
      }
    });

    // Validate input
    if (!email && !clerkId) {
      console.error('❌ Error: You must provide either --email or --clerkId');
      console.log('\nUsage:');
      console.log('  npm run add-admin -- --email=user@example.com');
      console.log('  npm run add-admin -- --clerkId=user_xxxxx');
      console.log('  npm run add-admin -- --email=user@example.com --uri=mongodb://...');
      process.exit(1);
    }

    // Get MongoDB URI (from argument, env, or default)
    const MONGODB_URI = mongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/thaitide-dating';

    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials in log

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    console.log('\n🔍 Searching for user...');
    const query = email ? { email } : { clerkId };
    const user = await User.findOne(query);

    if (!user) {
      console.error(`❌ User not found with ${email ? 'email' : 'clerkId'}: ${email || clerkId}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Username: @${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   Current Role: ${user.role || 'user'}`);

    // Check if already admin
    if (user.role === 'admin') {
      console.log('\n⚠️  User is already an admin!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update to admin
    console.log('\n🔧 Updating user role to admin...');
    user.role = 'admin';
    await user.save();

    console.log('✅ User role updated successfully!');

    // Verify update
    const updatedUser = await User.findById(user._id);
    console.log('\n✅ Verification:');
    console.log(`   Username: @${updatedUser?.username}`);
    console.log(`   Email: ${updatedUser?.email}`);
    console.log(`   Role: ${updatedUser?.role}`);

    console.log('\n🎉 Done! User is now an admin.');
    console.log(`   They can now access the admin dashboard at /admin`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
addAdmin();
