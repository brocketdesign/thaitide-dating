import { Translations } from '../i18n';

export const en: Translations = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    done: 'Done',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    apply: 'Apply',
    reset: 'Reset',
    viewProfile: 'View Profile',
    sendMessage: 'Send Message',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    years: 'years',
    yearsOld: 'years old',
    cm: 'cm',
    kg: 'kg',
    ago: 'ago',
    today: 'Today',
    yesterday: 'Yesterday',
    thisMonth: 'This month',
    monthsAgo: 'months ago',
    yearsAgoLabel: 'years ago',
    recently: 'Recently',
    online: 'Online',
    offline: 'Offline',
    verified: 'Verified',
    pendingVerification: 'Pending Verification',
    premium: 'Premium',
  },
  
  // Navigation
  nav: {
    discover: 'Discover',
    connections: 'Connections',
    messages: 'Messages',
    profile: 'Profile',
    premium: 'Premium',
  },
  
  // Landing page
  landing: {
    tagline: 'Modern Dating for Thai Singles & Foreigners',
    subtitle: 'Connect for authentic romance and cultural discovery',
    getStarted: 'Get Started Free',
    features: {
      smartMatching: {
        title: 'Smart Matching',
        description: 'Swipe-based matching with advanced algorithms to find your perfect connection',
      },
      locationBased: {
        title: 'Location-Based',
        description: 'Find matches nearby with geolocation search and advanced filters',
      },
      realTimeChat: {
        title: 'Real-Time Chat',
        description: 'Instant messaging with your matches powered by real-time technology',
      },
      premiumPerks: {
        title: 'Premium Perks',
        description: 'Boosted visibility, unlimited likes, and exclusive features',
      },
    },
  },
  
  // Discover page
  discover: {
    title: 'Discover',
    noMoreProfiles: 'No more profiles',
    noMoreProfilesMessage: 'You\'ve seen everyone in your area!',
    adjustFilters: 'Adjust Filters',
    checkBackLater: 'Check back later for new profiles',
    filters: {
      title: 'Filters',
      ageRange: 'Age Range',
      distance: 'Distance',
      location: 'Location',
      gender: 'Gender',
      lookingFor: 'Looking For',
      anyLocation: 'Any Location',
      km: 'km',
    },
    card: {
      scrollForMore: 'Scroll for more info',
      joined: 'Joined',
    },
    layout: {
      card: 'Card View',
      grid: 'Grid View',
    },
    buttons: {
      pass: 'Pass',
      like: 'Like',
      superLike: 'Super Like',
    },
  },
  
  // Matches page
  matches: {
    title: 'Connections',
    tabs: {
      matches: 'Matches',
      liked: 'I Liked',
      likesMe: 'Liked Me',
      visitors: 'Visitors',
    },
    empty: {
      matches: {
        emoji: '💕',
        title: 'No matches yet',
        message: 'Start swiping to find your perfect match!',
      },
      liked: {
        emoji: '❤️',
        title: 'No likes yet',
        message: 'Discover profiles and like someone!',
      },
      likes: {
        emoji: '💝',
        title: 'No one liked you yet',
        message: 'Complete your profile to attract more people!',
      },
      visitors: {
        emoji: '👀',
        title: 'No visitors yet',
        message: 'Make your profile stand out!',
      },
    },
    premiumBanner: {
      title: 'Unlock Premium to see who\'s interested!',
      subtitle: 'See who liked your profile and who visited you',
      upgradeNow: 'Upgrade Now',
    },
  },
  
  // Messages page
  messages: {
    title: 'Messages',
    noConversations: 'No conversations yet',
    noConversationsMessage: 'Match with someone to start chatting!',
    startMatching: 'Start Matching',
    typeMessage: 'Type a message...',
    send: 'Send',
    you: 'You',
    newMatch: 'New match!',
    startConversation: 'Start a conversation',
  },
  
  // Profile page
  profile: {
    title: 'Profile',
    editProfile: 'Edit Profile',
    createProfile: 'Create Profile',
    notFound: 'Profile Not Found',
    notFoundMessage: 'Please complete your profile to continue.',
    about: 'About',
    interests: 'Interests',
    languages: 'Languages',
    details: {
      location: 'Location',
      age: 'Age',
      height: 'Height',
      weight: 'Weight',
      lookingFor: 'Looking For',
      relationshipStatus: 'Relationship Status',
      education: 'Education',
      englishAbility: 'English Ability',
      children: 'Children',
      wantsChildren: 'Wants Children',
    },
    memberSince: 'Member since',
    verifyPhoto: 'Verify Photo',
    premiumMember: 'Premium Member',
    premiumUntil: 'Premium until',
    upgradeToPremium: 'Upgrade to Premium',
  },
  
  // Premium page
  premium: {
    title: 'Unlock Premium Features',
    subtitle: 'Boost your chances of finding love with our premium plans',
    plans: {
      premium: {
        name: 'Premium',
        features: [
          'Unlimited likes',
          'See who liked you',
          'Boosted profile visibility',
          'Advanced filters',
          'No ads',
          'Rewind last swipe',
        ],
      },
      premiumPlus: {
        name: 'Premium Plus',
        features: [
          'All Premium features',
          'Priority in discovery',
          '2x profile boost per week',
          'Read receipts',
          'Video calls',
          'Premium badge',
          'Priority support',
        ],
      },
    },
    popular: 'MOST POPULAR',
    subscribe: 'Subscribe Now',
    processing: 'Processing...',
    freeTrial: 'All plans include a 7-day free trial',
    cancelAnytime: 'Cancel anytime. No hidden fees.',
    perMonth: '/month',
  },
  
  // Onboarding
  onboarding: {
    welcome: {
      title: 'Welcome to ThaiTide! 🌊',
      subtitle: 'Let\'s create your profile and help you find your perfect match',
      steps: {
        basic: 'Tell us about yourself',
        photos: 'Add your best photos',
        preferences: 'Set your preferences',
      },
      getStarted: 'Let\'s Get Started',
    },
    basic: {
      title: 'Basic Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      genderOptions: {
        male: 'Male',
        female: 'Female',
        other: 'Other',
      },
    },
    lookingFor: {
      title: 'What are you looking for?',
      lookingForGender: 'I\'m interested in',
      genderOptions: {
        male: 'Men',
        female: 'Women',
        both: 'Both',
      },
      relationshipGoal: 'Relationship Goal',
      goalOptions: {
        relationship: 'Serious Relationship',
        casual: 'Casual Dating',
        friendship: 'New Friends',
        marriage: 'Marriage',
      },
    },
    location: {
      title: 'Where are you located?',
      city: 'City',
      selectCity: 'Select your city',
    },
    about: {
      title: 'Tell us about yourself',
      bio: 'Bio',
      bioPlaceholder: 'Write something interesting about yourself...',
      interests: 'Interests',
      selectInterests: 'Select your interests (min 3)',
      languages: 'Languages',
      selectLanguages: 'Select languages you speak',
    },
    preferences: {
      title: 'Your Details',
      height: 'Height (cm)',
      weight: 'Weight (kg)',
      education: 'Education',
      educationOptions: {
        highSchool: 'High School',
        bachelor: 'Bachelor\'s Degree',
        master: 'Master\'s Degree',
        doctorate: 'Doctorate',
        other: 'Other',
      },
      englishAbility: 'English Ability',
      englishOptions: {
        none: 'None',
        basic: 'Basic',
        conversational: 'Conversational',
        fluent: 'Fluent',
        native: 'Native',
      },
      children: 'Children',
      childrenOptions: {
        any: 'Any',
        noChildren: 'No Children',
        hasChildren: 'Has Children',
      },
      wantsChildren: 'Wants Children',
      wantsChildrenOptions: {
        any: 'Any',
        yes: 'Yes',
        no: 'No',
        maybe: 'Maybe',
      },
    },
    photos: {
      title: 'Add your photo',
      subtitle: 'Show your best self! Upload a clear photo of your face.',
      uploadPhoto: 'Upload Photo',
      photoVerified: 'Photo Verified!',
      photoRequirements: [
        'Clear, well-lit photo',
        'Face clearly visible',
        'Recent photo',
        'No sunglasses or masks',
      ],
      uploading: 'Uploading...',
    },
    complete: {
      title: 'You\'re all set! 🎉',
      subtitle: 'Your profile is ready. Start discovering amazing people!',
      startExploring: 'Start Exploring',
    },
  },
  
  // Match Modal
  matchModal: {
    congratulations: '✨ Congratulations! ✨',
    itsAMatch: 'It\'s a Match!',
    youAndLikedEachOther: 'You and {name} liked each other',
    sendMessage: 'Send a Message',
    keepSwiping: 'Keep Swiping',
  },
  
  // Premium Message Modal
  premiumMessage: {
    messageLimit: 'Message Limit Reached',
    messageIn: 'Message {username} in',
    or: 'or',
    month: 'month',
    cancelAnytime: 'Cancel anytime',
    subscribe: 'Subscribe to Premium',
    unlimitedMessages: 'Unlimited messages',
    noWaiting: 'No waiting',
    securePayment: 'Secure payment handled by',
    readyToMessage: 'Ready to message',
    sendNow: 'Send Message Now',
  },
  
  // PWA Installer
  pwa: {
    installTitle: 'Install ThaiTide',
    installSubtitle: 'Get instant access from your home screen',
    install: 'Install',
  },
  
  // Errors
  errors: {
    failedToLoad: 'Failed to load data',
    failedToSave: 'Failed to save',
    networkError: 'Network error. Please try again.',
    unauthorized: 'Please sign in to continue',
    notFound: 'Not found',
    serverError: 'Server error. Please try again later.',
  },
  
  // Toast messages
  toasts: {
    profileCreated: 'Profile created successfully! 🎉',
    profileUpdated: 'Profile updated successfully!',
    messageSent: 'Message sent!',
    photoUploaded: 'Photo uploaded successfully!',
    subscriptionCreated: 'Subscription created!',
    signOutSuccess: 'Signed out successfully',
  },
};
