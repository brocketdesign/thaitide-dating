import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/ui/Navigation';
import AdminDebugMenu from '@/components/ui/AdminDebugMenu';
import "./globals.css";

export const metadata: Metadata = {
  title: "ThaiTide - Modern Dating for Thai Singles & Foreigners",
  description: "Connect with Thai singles and international users for authentic connections, romance, and cultural discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {hasClerkKey ? (
          <ClerkProvider>
            <Navigation />
            <Toaster position="top-right" />
            <AdminDebugMenu />
            <div className="md:pt-16 pb-16 md:pb-0">
              {children}
            </div>
          </ClerkProvider>
        ) : (
          <>
            <Navigation />
            <Toaster position="top-right" />
            <AdminDebugMenu />
            <div className="md:pt-16 pb-16 md:pb-0">
              {children}
            </div>
          </>
        )}
      </body>
    </html>
  );
}
