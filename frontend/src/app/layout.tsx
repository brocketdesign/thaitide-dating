import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/ui/Navigation';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThaiTide - Modern Dating for Thai Singles & Foreigners",
  description: "Connect with Thai singles and international users for authentic connections, romance, and cultural discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navigation />
          <Toaster position="top-right" />
          <div className="md:pt-16 pb-16 md:pb-0">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
