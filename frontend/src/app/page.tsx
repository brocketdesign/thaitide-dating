import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LandingContent from '@/components/LandingContent';

export default async function Home() {
  // Check if Clerk is configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // Redirect authenticated users to discover page
  if (hasClerkKey) {
    const { userId } = await auth();
    if (userId) {
      redirect('/discover');
    }
  }

  return <LandingContent />;
}
