import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initBarcodePrinter } from './utils/barcodePrinter';

// Cache bust: Route parameter fix for stock-movements applied
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// CRITICAL: Set CSRF token IMMEDIATELY before anything else runs
// This prevents 419 errors on first action after login
const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
if (csrfTokenMeta && window.axios) {
    const csrfToken = csrfTokenMeta.getAttribute('content');
    if (csrfToken) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    }
}

// Store CSRF token on page load for comparison
let lastKnownCSRFToken = csrfTokenMeta?.getAttribute('content');

// Global error handler for Inertia requests
document.addEventListener('inertia:error', (event: any) => {
    // Handle 419 CSRF token mismatch errors
    if (event.detail?.response?.status === 419) {
        event.preventDefault(); // Prevent default Inertia error handling

        // Check if this is a logout request - if so, handle silently
        const url = event.detail?.url || '';
        if (url.includes('/logout') || url.endsWith('logout')) {
            // Silently reload page to get fresh token, user will see login page
            window.location.href = '/';
            return;
        }

        // For other 419 errors, clear localStorage and reload
        localStorage.removeItem('wizard_form_data');
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('current_account_id');

        // Show user-friendly message only for non-logout actions
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

    // Update last known token and ensure it's set in Axios
    if (currentToken && window.axios) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = currentToken;
    }
    lastKnownCSRFToken = currentToken;
});

// CRITICAL: Add CSRF token to every Inertia request
// Inertia overrides axios default headers, so we must explicitly add it
router.on('before', (event) => {
    const token = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Set in axios defaults (for non-Inertia requests)
    if (token && window.axios) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }

    // CRITICAL: Add to Inertia request headers
    // This is the key fix - Inertia doesn't use axios defaults!
    if (token && event.detail.visit) {
        event.detail.visit.headers = event.detail.visit.headers || {};
        event.detail.visit.headers['X-CSRF-TOKEN'] = token;
    }
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
        // CRITICAL: Ensure CSRF token is set in Axios before any Inertia request
        // This runs synchronously before the first render
        const token = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token && window.axios) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        }

        const root = createRoot(el);

        // Initialize barcode printer
        initBarcodePrinter();

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
