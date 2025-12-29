# ThaiTide PWA & App Mode Feature

## Overview

The app has been configured as a Progressive Web App (PWA) with full support for launching in "app mode" when installed from the home screen. This provides users with a native app-like experience while maintaining the flexibility of a web application.

## Features Implemented

### 1. **Web App Manifest** (`public/manifest.json`)
- Defines app metadata (name, description, icons, theme colors)
- Configures display mode as "standalone" for app-like appearance
- Sets up app orientation, background color, and theme color
- Includes maskable icons for adaptive icon support on Android

### 2. **Service Worker** (`public/sw.js`)
- Enables offline functionality and caching strategies
- Implements network-first strategy for API requests
- Uses cache-first strategy for static assets
- Automatically updates when new versions are available
- Handles service worker lifecycle events

### 3. **App Mode Hook** (`src/lib/useAppMode.ts`)
- `useAppMode()`: Detects if app is running in standalone/app mode
- `useInstallPrompt()`: Manages the install prompt and installation flow
- Returns app mode information for conditional rendering and styling
- Automatically applies CSS classes when in app mode

### 4. **PWA Installer Component** (`src/components/ui/PWAInstaller.tsx`)
- Shows install banner only when not already installed
- Handles install prompts on supported browsers
- Automatically hides in app mode
- iOS-aware (shows different messaging for iOS devices)

### 5. **App Mode Styling** (`src/app/globals.css`)
- Optimizes layout for app mode display
- Handles safe areas for notched devices (iPhone X+)
- Removes browser UI chrome styling
- Fullscreen-optimized navigation and containers
- Proper padding for device notches and safe areas

## How It Works

### Desktop/Web Browser
1. User visits thaitide.com in their browser
2. Install banner appears with "Install" option
3. User clicks "Install" to add app to home screen
4. Browser shows native install dialog

### Mobile (After Installation)
1. User taps app icon on home screen
2. App launches in standalone/app mode (no browser address bar)
3. Service worker registers and caches assets
4. App displays fullscreen with optimized layout
5. PWA installer component automatically hides

### App Mode Detection
The app automatically detects app mode through:
- CSS media query: `(display-mode: standalone)`
- Navigator property: `window.navigator.standalone`
- Document referrer checking for Android app launch

## Usage in Components

### Detecting App Mode
```tsx
'use client';
import { useAppMode } from '@/lib/useAppMode';

export default function MyComponent() {
  const appMode = useAppMode();
  
  return (
    <div>
      {appMode.isAppMode && <p>Running as installed app!</p>}
      <p>Display mode: {appMode.displayMode}</p>
    </div>
  );
}
```

### Handling Install Prompts
```tsx
'use client';
import { useInstallPrompt } from '@/lib/useAppMode';

export default function InstallButton() {
  const { installPrompt, isInstalled, promptInstall } = useInstallPrompt();
  
  if (isInstalled || !installPrompt) return null;
  
  return (
    <button onClick={promptInstall}>
      Install App
    </button>
  );
}
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Manifest | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Standalone Mode | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ✅ | ❌* | ✅ |

*Safari on iOS uses a different mechanism (manual "Add to Home Screen" from share menu)

## iOS Specific Notes

- Install banner automatically hides on iOS
- Users must manually add app using the Share menu → "Add to Home Screen"
- App runs in full-screen mode without browser chrome
- Safe area insets are properly handled for notched devices
- Meta tags configured for iOS web app mode

## File Structure

```
frontend/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── icon-192.png          # App icon (192x192)
│   ├── icon-512.png          # App icon (512x512)
│   ├── icon-maskable-192.png # Maskable icon for Android
│   └── icon-maskable-512.png # Maskable icon for Android
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Service worker registration
│   │   └── globals.css        # App mode styling
│   ├── lib/
│   │   └── useAppMode.ts      # App mode detection hooks
│   └── components/
│       └── ui/
│           └── PWAInstaller.tsx # Install prompt component
└── next.config.ts            # PWA headers configuration
```

## Customization

### Updating App Icons
Replace the following files in `public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)
- `icon-maskable-192.png` (192x192 with safe area)
- `icon-maskable-512.png` (512x512 with safe area)

### Changing Theme Color
Edit in `public/manifest.json`:
```json
{
  "theme_color": "#ff6b9d",
  "background_color": "#ffffff"
}
```

And in `src/app/layout.tsx`:
```tsx
themeColor: "#ff6b9d"
```

### Modifying Cache Strategy
Edit `public/sw.js` to change caching behavior for different asset types.

## Testing

### Desktop Testing
1. Run `npm run dev` in frontend directory
2. Open DevTools (F12) → Application tab
3. Check "Manifest" section
4. Check Service Worker registration
5. Look for install banner

### Mobile Testing
1. Deploy to HTTPS (PWAs require HTTPS)
2. Add to home screen (manual on iOS, prompt on Android)
3. Launch app and verify no browser chrome appears
4. Verify offline functionality with DevTools throttling

### Lighthouse PWA Audit
Run Lighthouse in Chrome DevTools:
1. Open DevTools
2. Go to Lighthouse tab
3. Run PWA audit
4. Should pass all PWA installability checks

## Future Enhancements

- Add offline page for when network fails
- Implement advanced caching strategies per route
- Add app update notification system
- Implement background sync for messages
- Add push notification support
- Create app splash screens for better perceived performance

## Notes

- Service worker requires HTTPS in production (localhost works for development)
- Install prompt only shows on supporting browsers and if app isn't already installed
- App mode styling handles safe areas for all modern devices
- Works seamlessly alongside existing Clerk authentication
