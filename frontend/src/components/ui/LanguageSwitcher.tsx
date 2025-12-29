'use client';

import { useTranslation, Language } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  ];

  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            language === lang.code
              ? 'bg-white text-pink-500 shadow-md'
              : 'text-gray-600 hover:text-pink-500 hover:bg-white/50'
          }`}
          title={lang.label}
        >
          <span className="text-base">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.code === 'en' ? 'EN' : 'TH'}</span>
        </button>
      ))}
    </div>
  );
}

// Compact version for navigation bar
export function LanguageSwitcherCompact() {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
      title={language === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
    >
      <span className="text-lg">{language === 'en' ? '🇹🇭' : '🇬🇧'}</span>
      <span className="hidden md:inline text-xs font-medium">
        {language === 'en' ? 'TH' : 'EN'}
      </span>
    </button>
  );
}

// Mobile-friendly dropdown version
export function LanguageSwitcherDropdown() {
  const { language, setLanguage } = useTranslation();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
    >
      <option value="en">🇬🇧 English</option>
      <option value="th">🇹🇭 ภาษาไทย</option>
    </select>
  );
}
