import mongoose from 'mongoose';
import { User } from '../models/User';
import * as readline from 'readline';

/**
 * Interactive script to add admin role to a user
 * Usage: npm run add-admin:interactive
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addAdminInteractive() {
  try {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   ThaiTide Dating - Add Admin User Script     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Get MongoDB URI
    const defaultUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaitide-dating';
    console.log(`Default MongoDB URI: ${defaultUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    const useDefault = await question('Use default URI? (y/n): ');

    let mongoUri = defaultUri;
    if (useDefault.toLowerCase() !== 'y') {
      mongoUri = await question('Enter MongoDB URI: ');
    }

    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully!\n');

    // Get user identifier
    console.log('How would you like to identify the user?');
    console.log('1. By email');
    console.log('2. By Clerk ID');
    const choice = await question('Enter choice (1 or 2): ');

    let user;
    if (choice === '1') {
      const email = await question('Enter user email: ');
      console.log(`\n🔍 Searching for user with email: ${email}...`);
      user = await User.findOne({ email });
    } else if (choice === '2') {
      const clerkId = await question('Enter Clerk ID: ');
      console.log(`\n🔍 Searching for user with Clerk ID: ${clerkId}...`);
      user = await User.findOne({ clerkId });
    } else {
      console.error('❌ Invalid choice');
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    if (!user) {
      console.error('❌ User not found!');
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    // Display user info
    console.log('\n✅ User found:');
    console.log('┌─────────────────────────────────────────────┐');
    console.log(`│ Username:     @${user.username.padEnd(30)}│`);
    console.log(`│ Email:        ${user.email.padEnd(31)}│`);
    console.log(`│ Clerk ID:     ${user.clerkId.padEnd(31)}│`);
    console.log(`│ Current Role: ${(user.role || 'user').padEnd(31)}│`);
    console.log('└─────────────────────────────────────────────┘\n');

    // Check if already admin
    if (user.role === 'admin') {
      console.log('⚠️  This user is already an admin!');
      const continueAnyway = await question('Continue anyway? (y/n): ');
      if (continueAnyway.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    // Confirm
    const confirm = await question('Grant admin role to this user? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update to admin
    console.log('\n🔧 Updating user role to admin...');
    user.role = 'admin';
    await user.save();

    console.log('✅ User role updated successfully!');

    // Verify
    const updatedUser = await User.findById(user._id);
    console.log('\n✅ Verification:');
    console.log(`   Username: @${updatedUser?.username}`);
    console.log(`   Email: ${updatedUser?.email}`);
    console.log(`   Role: ${updatedUser?.role}`);

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              SUCCESS! 🎉                       ║');
    console.log('║  User can now access /admin dashboard         ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    rl.close();
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    rl.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
addAdminInteractive();
