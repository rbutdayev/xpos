import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

export default function LoginLanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);

    try {
      // Update i18next language
      await i18n.changeLanguage(languageCode);

      // Save to localStorage for persistence
      localStorage.setItem('i18nextLng', languageCode);

      setIsChanging(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing language:', error);
      setIsChanging(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm border-2 border-indigo-200 rounded-xl hover:bg-white hover:border-indigo-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
        title={currentLanguage.nativeName}
      >
        <GlobeAltIcon className="w-5 h-5 text-indigo-600" />
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="font-semibold text-gray-800">{currentLanguage.nativeName}</span>
        {isChanging ? (
          <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg
            className={`w-4 h-4 text-indigo-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Menu */}
          <div className="absolute right-0 z-20 w-64 mt-3 origin-top-right bg-white border-2 border-indigo-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-2">
              {languages.map((language) => {
                const isActive = currentLanguage.code === language.code;
                return (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    disabled={isChanging}
                    className={`flex items-center w-full px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md transform scale-105'
                        : 'text-gray-700 hover:bg-indigo-50 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <span className="text-2xl mr-3">{language.flag}</span>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {language.nativeName}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {language.name}
                      </div>
                    </div>
                    {isActive && (
                      <svg
                        className="w-5 h-5 ml-2 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
