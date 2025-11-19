export const azLocale = {
    code: 'az-AZ',
    week: {
        dow: 1, // Monday is the first day of the week
        doy: 4  // The week that contains Jan 4th is the first week of the year
    },
    buttonText: {
        prev: 'Əvvəl',
        next: 'Sonra',
        today: 'Bu gün',
        month: 'Ay',
        week: 'Həftə',
        day: 'Gün',
        list: 'Siyahı'
    },
    weekText: 'Hft',
    allDayText: 'Bütün gün',
    moreLinkText: function(n: number) {
        return '+ ' + n + ' daha çox';
    },
    noEventsText: 'İcarə yoxdur',
    direction: 'ltr' as 'ltr',
    buttonHints: {
        prev: 'Əvvəlki $0',
        next: 'Sonrakı $0',
        today: function(buttonText: string) {
            return 'Bu gün' + (buttonText === 'day' ? '' : '');
        }
    },
    viewHint: '$0 görünüş',
    navLinkHint: '$0 keçin',
    moreLinkHint: function(eventCnt: number) {
        return 'Daha ' + eventCnt + ' hadisə göstər';
    }
};

// Month names in Azerbaijani
export const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

export const monthNamesShort = [
    'Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn',
    'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'
];

export const dayNames = [
    'Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 
    'Cümə axşamı', 'Cümə', 'Şənbə'
];

export const dayNamesShort = ['Baz', 'BzE', 'ÇAx', 'Çər', 'CAx', 'Cüm', 'Şən'];

// Custom date formatting function for Azerbaijani
export function formatAzDate(date: Date): string {
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// Custom range formatting
export function formatAzDateRange(start: Date, end: Date): string {
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    if (startYear === endYear && startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth} ${startYear}`;
    } else if (startYear === endYear) {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
    } else {
        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
}