import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)'
]);

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip protection if no valid Clerk key is configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');
  
  if (!hasClerkKey) {
    return;
  }

  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // Redirect authenticated users from landing page or auth pages to discover
  // (discover page will check if profile exists and redirect to onboarding if needed)
  if (userId && (pathname === '/' || isAuthRoute(request))) {
    const discoverUrl = new URL('/auth-redirect', request.url);
    return NextResponse.redirect(discoverUrl);
  }

  // Protect non-public routes (except onboarding which needs auth)
  if (!isPublicRoute(request) && !isOnboardingRoute(request)) {
    await auth.protect();
  }

  // Protect onboarding route
  if (isOnboardingRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
