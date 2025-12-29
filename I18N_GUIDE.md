# ThaiTide Internationalization (i18n) Guide

## Overview

ThaiTide now supports **English (en)** and **Thai (th)** languages with an extensible i18n system built on React Context and hooks. The system is designed to make adding new translations and languages easy without modifying core components.

## Architecture

### File Structure

```
frontend/src/
├── lib/
│   ├── i18n.tsx                 # Core i18n system (Context, Provider, hooks)
│   └── translations/
│       ├── en.ts                # English translations
│       └── th.ts                # Thai translations
├── components/
│   ├── Providers.tsx            # TranslationProvider wrapper
│   └── ui/
│       └── LanguageSwitcher.tsx  # Language switcher UI component
└── app/
    └── layout.tsx               # Wrapped with Providers
```

## How It Works

### 1. Translation Provider Setup

The app is wrapped with `TranslationProvider` in `layout.tsx`:

```tsx
<Providers>
  <ClerkProvider>
    {/* App content */}
  </ClerkProvider>
</Providers>
```

The `Providers` component wraps the app with `TranslationProvider`, which:
- Manages current language state
- Persists language choice to localStorage
- Auto-detects Thai if browser language is Thai

### 2. Using Translations in Components

In any client component, use the `useTranslation` hook:

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';

export default function MyComponent() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t.common.loading}</h1>
      <button onClick={() => setLanguage('th')}>Thai</button>
    </div>
  );
}
```

## Translation Structure

Translations are organized by feature area:

- **common**: Basic words (loading, error, save, delete, etc.)
- **nav**: Navigation labels
- **landing**: Landing page content
- **discover**: Discover/swipe page
- **matches**: Matches/connections page
- **messages**: Messages page
- **profile**: Profile page
- **premium**: Premium features page
- **onboarding**: Onboarding flow
- **matchModal**: Match celebration modal
- **pwa**: PWA installer prompts
- **errors**: Error messages
- **toasts**: Toast/notification messages

## Adding New Translations

### Step 1: Update Translation Interface

In `lib/i18n.tsx`, add to the `Translations` interface:

```typescript
export interface Translations {
  // ... existing sections
  
  myNewFeature: {
    title: string;
    description: string;
    button: string;
  };
}
```

### Step 2: Add English Translations

In `lib/translations/en.ts`:

```typescript
export const en: Translations = {
  // ... existing sections
  
  myNewFeature: {
    title: 'My Feature',
    description: 'This is my new feature',
    button: 'Click Me'
  }
};
```

### Step 3: Add Thai Translations

In `lib/translations/th.ts`:

```typescript
export const th: Translations = {
  // ... existing sections
  
  myNewFeature: {
    title: 'ฟีเจอร์ของฉัน',
    description: 'นี่คือฟีเจอร์ใหม่ของฉัน',
    button: 'คลิกฉัน'
  }
};
```

### Step 4: Use in Component

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t.myNewFeature.title}</h1>
      <p>{t.myNewFeature.description}</p>
      <button>{t.myNewFeature.button}</button>
    </div>
  );
}
```

## Language Switcher Component

Three variants available:

### Full Switcher
```tsx
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

<LanguageSwitcher />
```

### Compact for Navigation
```tsx
import { LanguageSwitcherCompact } from '@/components/ui/LanguageSwitcher';

<LanguageSwitcherCompact />
```

### Dropdown for Mobile
```tsx
import { LanguageSwitcherDropdown } from '@/components/ui/LanguageSwitcher';

<LanguageSwitcherDropdown />
```

## Key Features

✅ **Type-Safe**: Full TypeScript support for translation keys  
✅ **Persistent**: Language choice saved to localStorage  
✅ **Auto-Detect**: Detects Thai based on browser language  
✅ **Hydration-Safe**: Prevents hydration mismatches  
✅ **Scalable**: Easy to add new languages  
✅ **Organized**: Translations grouped by feature area  

## Adding a New Language

### Example: Adding Spanish (es)

1. Create `lib/translations/es.ts`
2. Create translations with same structure as English/Thai
3. Update `lib/i18n.tsx`:

```typescript
import { es } from './translations/es';

export type Language = 'en' | 'th' | 'es';

const translations: Record<Language, Translations> = {
  en,
  th,
  es,
};
```

4. Update `LanguageSwitcher.tsx` to include Spanish option

## Best Practices

1. **Keep keys flat**: Use dot notation in types, not deeply nested objects
2. **Group logically**: Related strings go in the same section
3. **Use placeholders sparingly**: Keep translations simple and testable
4. **Translate error messages**: All user-facing errors should be translated
5. **Update both languages**: Never add translation for one language only
6. **Use consistent terminology**: Keep Thai/English word choices consistent across app

## Common Patterns

### Dates
Use `t.common.ago`, `t.common.today`, etc. for relative dates
Format dates with browser locale for absolute dates

### Numbers
Use `t.common.cm`, `t.common.kg` for units
Numbers themselves don't need translation

### Enums/Options
Store options in arrays in translations for consistency
Example: `t.onboarding.basic.genderOptions`

### Plurals
Create separate keys for singular/plural if needed
Example: `t.common.years` for plural, handle count in component

## Type Safety

Get full autocomplete and type checking:

```tsx
const { t } = useTranslation();
// t. will show autocomplete of all available keys
t.discover.title // ✅ Works
t.discover.nonexistent // ❌ TypeScript error
```

## Testing

When adding translations:
1. Add keys to TypeScript interface first
2. Add English translation
3. Add Thai translation
4. Update components to use keys
5. Test both languages in UI

## Performance

- Translations are bundled at build time (no runtime lookup)
- Language persistence prevents extra localStorage reads
- Hydration-safe to prevent hydration mismatches
- No additional network requests for translations

## Future Enhancements

Possible improvements:
- Plural form handling
- Date/time formatting utilities
- Currency formatting
- RTL language support
- Translation management UI
- Missing translation detection

---

**Last Updated**: December 2025  
**Maintained by**: ThaiTide Team
