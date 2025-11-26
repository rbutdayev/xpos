import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initBarcodePrinter } from './utils/barcodePrinter';

// Cache bust: Route parameter fix for stock-movements applied
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Store CSRF token on page load for comparison
let lastKnownCSRFToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

// Global error handler for Inertia requests
document.addEventListener('inertia:error', (event: any) => {
    // Handle 419 CSRF token mismatch errors
    if (event.detail?.response?.status === 419) {
        event.preventDefault(); // Prevent default Inertia error handling

        // Clear localStorage to prevent stale data
        localStorage.removeItem('wizard_form_data');
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('current_account_id');

        // Show user-friendly message
        alert('Sessiya müddəti bitdi. Səhifə yenilənəcək.');

        // Force full page reload to get fresh CSRF token
        window.location.reload();
    }
});

// Check CSRF token when window regains focus
// This catches cases where user switched accounts in another tab
window.addEventListener('focus', () => {
    const currentToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // If token has changed (page still has old token), reload
    if (lastKnownCSRFToken && currentToken && lastKnownCSRFToken !== currentToken) {
        console.warn('CSRF token changed while page was inactive. Reloading...');
        window.location.reload();
    }

    // Update last known token
    lastKnownCSRFToken = currentToken;
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then(() => {
                // Service worker registered
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize barcode printer
        initBarcodePrinter();

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
