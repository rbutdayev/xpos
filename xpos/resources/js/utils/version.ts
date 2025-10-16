/**
 * Read application version from version.txt file
 */
export function getAppVersion(): string {
    // This will be replaced by Vite at build time
    return import.meta.env.VITE_APP_VERSION || 'v2.1.0';
}