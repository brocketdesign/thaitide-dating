import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/auth-redirect(.*)'
]);

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip protection if no valid Clerk key is configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');
  
  if (!hasClerkKey) {
    return;
  }

  const authObj = await auth();
  const { userId } = authObj;
  const { pathname, searchParams } = request.nextUrl;

  // Handle Clerk handshake/sync parameters - let them pass through to the client
  if (searchParams.has('__clerk_db_jwt') || searchParams.has('__clerk_status')) {
    return;
  }

  // Redirect authenticated users from landing page or auth pages to auth-redirect
  // (auth-redirect will check if profile exists and redirect to onboarding if needed)
  if (userId && (pathname === '/' || isAuthRoute(request))) {
    const redirectUrl = new URL('/auth-redirect', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Protect all non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files (include common media and json; include uppercase variants)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|JPE?G|webp|WEBP|png|PNG|gif|GIF|svg|SVG|mp4|MP4|json|webmanifest|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
