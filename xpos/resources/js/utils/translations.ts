// Translation helper that uses Laravel translations passed via Inertia
export function __(key: string, replacements?: Record<string, string>): string {
    // Get translations from Inertia page props
    let translations: Record<string, string> = {};
    
    try {
        const pageProps = (window as any).page?.props || {};
        translations = pageProps.translations || {};
    } catch (e) {
        // Fallback: if we can't access page props, return the key
        console.warn('Cannot access Laravel translations:', e);
    }
    
    // Remove 'app.' prefix if present since Laravel translations don't have it
    const cleanKey = key.startsWith('app.') ? key.substring(4) : key;
    
    let translation = translations[cleanKey] || cleanKey;

    // Handle replacements if provided
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`:${placeholder}`, replacements[placeholder]);
        });
    }

    return translation;
}