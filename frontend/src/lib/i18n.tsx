'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'en' | 'th';

// Translation keys type - all possible translation keys
export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    skip: string;
    done: string;
    close: string;
    search: string;
    filter: string;
    apply: string;
    reset: string;
    viewProfile: string;
    sendMessage: string;
    signOut: string;
    signIn: string;
    signUp: string;
    years: string;
    yearsOld: string;
    cm: string;
    kg: string;
    ago: string;
    today: string;
    yesterday: string;
    thisMonth: string;
    monthsAgo: string;
    yearsAgoLabel: string;
    recently: string;
    online: string;
    offline: string;
    verified: string;
    pendingVerification: string;
    premium: string;
  };
  
  // Navigation
  nav: {
    discover: string;
    connections: string;
    messages: string;
    profile: string;
    premium: string;
  };
  
  // Landing page
  landing: {
    tagline: string;
    subtitle: string;
    getStarted: string;
    features: {
      smartMatching: {
        title: string;
        description: string;
      };
      locationBased: {
        title: string;
        description: string;
      };
      realTimeChat: {
        title: string;
        description: string;
      };
      premiumPerks: {
        title: string;
        description: string;
      };
    };
  };
  
  // Discover page
  discover: {
    title: string;
    noMoreProfiles: string;
    noMoreProfilesMessage: string;
    adjustFilters: string;
    checkBackLater: string;
    searchByUsername: string;
    filters: {
      title: string;
      ageRange: string;
      distance: string;
      location: string;
      gender: string;
      lookingFor: string;
      anyLocation: string;
      km: string;
    };
    card: {
      scrollForMore: string;
      joined: string;
    };
    layout?: {
      card: string;
      grid: string;
    };
    buttons: {
      pass: string;
      like: string;
      superLike: string;
    };
  };
  
  // Matches page
  matches: {
    title: string;
    tabs: {
      matches: string;
      liked: string;
      likesMe: string;
      visitors: string;
    };
    empty: {
      matches: {
        emoji: string;
        title: string;
        message: string;
      };
      liked: {
        emoji: string;
        title: string;
        message: string;
      };
      likes: {
        emoji: string;
        title: string;
        message: string;
      };
      visitors: {
        emoji: string;
        title: string;
        message: string;
      };
    };
    premiumBanner: {
      title: string;
      subtitle: string;
      upgradeNow: string;
    };
  };
  
  // Messages page
  messages: {
    title: string;
    noConversations: string;
    noConversationsMessage: string;
    startMatching: string;
    typeMessage: string;
    send: string;
    you: string;
    newMatch: string;
    startConversation: string;
  };
  
  // Profile page
  profile: {
    title: string;
    editProfile: string;
    createProfile: string;
    notFound: string;
    notFoundMessage: string;
    about: string;
    interests: string;
    languages: string;
    details: {
      location: string;
      age: string;
      height: string;
      weight: string;
      lookingFor: string;
      relationshipStatus: string;
      education: string;
      englishAbility: string;
      children: string;
      wantsChildren: string;
    };
    memberSince: string;
    verifyPhoto: string;
    premiumMember: string;
    premiumUntil: string;
    upgradeToPremium: string;
  };
  
  // Premium page
  premium: {
    title: string;
    subtitle: string;
    plans: {
      premium: {
        name: string;
        features: string[];
      };
      premiumPlus: {
        name: string;
        features: string[];
      };
    };
    popular: string;
    subscribe: string;
    processing: string;
    freeTrial: string;
    cancelAnytime: string;
    perMonth: string;
  };
  
  // Onboarding
  onboarding: {
    welcome: {
      title: string;
      subtitle: string;
      steps: {
        basic: string;
        photos: string;
        preferences: string;
      };
      getStarted: string;
    };
    basic: {
      title: string;
      username: string;
      usernamePlaceholder?: string;
      dateOfBirth: string;
      gender: string;
      genderOptions: {
        male: string;
        female: string;
        other: string;
      };
    };
    lookingFor: {
      title: string;
      lookingForGender: string;
      genderOptions: {
        male: string;
        female: string;
        both: string;
      };
      relationshipGoal: string;
      goalOptions: {
        relationship: string;
        casual: string;
        friendship: string;
        marriage: string;
      };
    };
    location: {
      title: string;
      city: string;
      selectCity: string;
    };
    about: {
      title: string;
      bio: string;
      bioPlaceholder: string;
      interests: string;
      selectInterests: string;
      languages: string;
      selectLanguages: string;
    };
    preferences: {
      title: string;
      height: string;
      weight: string;
      education: string;
      educationOptions: {
        highSchool: string;
        bachelor: string;
        master: string;
        doctorate: string;
        other: string;
      };
      englishAbility: string;
      englishOptions: {
        none: string;
        basic: string;
        conversational: string;
        fluent: string;
        native: string;
      };
      children: string;
      childrenOptions: {
        any: string;
        noChildren: string;
        hasChildren: string;
      };
      wantsChildren: string;
      wantsChildrenOptions: {
        any: string;
        yes: string;
        no: string;
        maybe: string;
      };
    };
    photos: {
      title: string;
      subtitle: string;
      uploadPhoto: string;
      photoVerified: string;
      photoRequirements: string[];
      uploading: string;
    };
    complete: {
      title: string;
      subtitle: string;
      startExploring: string;
    };
  };
  
  // Match Modal
  matchModal: {
    congratulations: string;
    itsAMatch: string;
    youAndLikedEachOther: string;
    sendMessage: string;
    keepSwiping: string;
  };
  
  // Premium Message Modal
  premiumMessage?: {
    messageLimit: string;
    messageIn: string;
    or: string;
    month: string;
    cancelAnytime: string;
    subscribe: string;
    unlimitedMessages: string;
    noWaiting: string;
    securePayment: string;
    readyToMessage: string;
    sendNow: string;
  };
  
  // PWA Installer
  pwa: {
    installTitle: string;
    installSubtitle: string;
    install: string;
  };
  
  // Errors
  errors: {
    failedToLoad: string;
    failedToSave: string;
    networkError: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
  };
  
  // Toast messages
  toasts: {
    profileCreated: string;
    profileUpdated: string;
    messageSent: string;
    photoUploaded: string;
    subscriptionCreated: string;
    signOutSuccess: string;
  };
}

// Context type
interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

// Import translations
import { en } from './translations/en';
import { th } from './translations/th';

const translations: Record<Language, Translations> = {
  en,
  th,
};

// Create context
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Storage key
const LANGUAGE_STORAGE_KEY = 'thaitide_language';

// Provider component
export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (savedLang && (savedLang === 'en' || savedLang === 'th')) {
      setLanguageState(savedLang);
    } else {
      // Auto-detect based on browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('th')) {
        setLanguageState('th');
      }
    }
    setMounted(true);
  }, []);

  // Set language and persist
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  // Get current translations
  const t = translations[language];

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <TranslationContext.Provider value={{ language: 'en', setLanguage, t: translations.en }}>
        {children}
      </TranslationContext.Provider>
    );
  }

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

// Hook to use translations
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Helper function to get nested translation value by key path
export function getTranslation(translations: Translations, keyPath: string): string {
  const keys = keyPath.split('.');
  let value: any = translations;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return keyPath;
  }
  return typeof value === 'string' ? value : keyPath;
}
