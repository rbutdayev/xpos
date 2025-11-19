// Azerbaijani month names
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const shortMonthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];

/**
 * Format date with Azerbaijani month names
 * @param date Date object or string
 * @param format 'short' | 'long' | 'numeric' for month format
 * @param includeTime Whether to include time
 * @returns Formatted date string
 */
export function formatAzerbaijaniDate(
    date: Date | string,
    format: 'short' | 'long' | 'numeric' = 'numeric',
    includeTime = false
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const monthIndex = dateObj.getMonth();
    const year = dateObj.getFullYear();
    
    let monthStr: string;
    switch (format) {
        case 'short':
            monthStr = shortMonthNames[monthIndex];
            break;
        case 'long':
            monthStr = monthNames[monthIndex];
            break;
        case 'numeric':
        default:
            monthStr = (monthIndex + 1).toString().padStart(2, '0');
            break;
    }
    
    let result = `${day} ${monthStr}`;
    if (format !== 'short') {
        result += ` ${year}`;
    }
    
    if (includeTime) {
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        result += ` ${hours}:${minutes}`;
    }
    
    return result;
}

/**
 * Format date for chart labels (day + short month)
 * @param date Date object or string
 * @returns Formatted string like "15 Noy"
 */
export function formatChartDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = shortMonthNames[dateObj.getMonth()];
    return `${day} ${month}`;
}

/**
 * Format full date and time for display
 * @param date Date object or string
 * @returns Formatted string like "15 Noyabr 2025, 14:30"
 */
export function formatFullDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}