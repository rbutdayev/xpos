export const getLanguageName = (lang: string) => {
  const languages: Record<string, string> = {
    az: 'Azərbaycan dili',
    en: 'English',
    tr: 'Türkçe',
  };
  return languages[lang] || lang?.toUpperCase?.() || '';
};

export const formatBusinessHours = (hours: any) => {
  if (!hours || typeof hours !== 'object') return null;
  const days: Record<string, string> = {
    monday: 'Bazar ertəsi',
    tuesday: 'Çərşənbə axşamı',
    wednesday: 'Çərşənbə',
    thursday: 'Cümə axşamı',
    friday: 'Cümə',
    saturday: 'Şənbə',
    sunday: 'Bazar',
  };
  return Object.entries(hours).map(([day, schedule]: [string, any]) => ({ day: (days as any)[day] || day, schedule }));
};

