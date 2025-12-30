import type { Metadata, Viewport } from "next";
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';
import "./globals.css";

export const metadata: Metadata = {
  title: "ThaiTide - Modern Dating for Thai Singles & Foreigners",
  description: "Connect with Thai singles and international users for authentic connections, romance, and cultural discovery.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ThaiTide",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ff6b9d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ThaiTide" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ff6b9d" />
        <link rel="icon" type="image/png" href="/icon-192.png" />
      </head>
      <body className="antialiased font-sans">
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

function ServiceWorkerRegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').then(
                (registration) => {
                  console.log('ServiceWorker registration successful:', registration);
                  
                  registration.onupdatefound = () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.onstatechange = () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('New service worker available');
                          if (window.confirm('A new version of ThaiTide is available. Reload to update?')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                          }
                        }
                      };
                    }
                  };
                },
                (err) => {
                  console.log('ServiceWorker registration failed:', err);
                }
              );
            });
          }
        `,
      }}
    />
  );
}
