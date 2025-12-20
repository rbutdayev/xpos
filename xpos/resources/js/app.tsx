import '../css/app.css';
import './bootstrap';
import './i18n';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initBarcodePrinter } from './utils/barcodePrinter';

// Cache bust: Route parameter fix for stock-movements applied
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Store CSRF token reference - will be initialized when DOM is ready
let lastKnownCSRFToken: string | null | undefined = null;

// CRITICAL: Initialize CSRF token safely after DOM is ready
// This ensures the meta tag has the fresh token from session regeneration
function initializeCSRFToken() {
    // CRITICAL FIX: Check sessionStorage for pending token from previous page
    // This handles tokens sent via response header before page reload
    const pendingToken = sessionStorage.getItem('pending_csrf_token');

    if (pendingToken) {
        // Update meta tag with pending token
        const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
        if (csrfTokenMeta) {
            csrfTokenMeta.setAttribute('content', pendingToken);
        }

        // Update axios
        if (window.axios) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = pendingToken;
        }

        lastKnownCSRFToken = pendingToken;

        // Clear pending token after applying
        sessionStorage.removeItem('pending_csrf_token');
    } else {

        // No pending token, use meta tag value
        const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
        if (csrfTokenMeta && window.axios) {
            const csrfToken = csrfTokenMeta.getAttribute('content');
            if (csrfToken) {
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
                lastKnownCSRFToken = csrfToken;
            }
        }
    }
}

// Run token initialization immediately if DOM is already loaded
// Otherwise wait for DOMContentLoaded event
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCSRFToken);
} else {
    // DOM is already loaded (script is deferred or dynamically loaded)
    initializeCSRFToken();
}

// Global error handler for Inertia requests
document.addEventListener('inertia:error', (event: any) => {
    // Handle 419 CSRF token mismatch errors
    if (event.detail?.response?.status === 419) {
        event.preventDefault(); // Prevent default Inertia error handling

        // CRITICAL FIX: Extract fresh CSRF token from 419 response headers BEFORE reloading
        // Laravel sends the new token even in error responses
        const response = event.detail?.response;

        if (response?.headers) {
            const freshToken = response.headers['x-csrf-token'] || response.headers['X-CSRF-TOKEN'];

            if (freshToken) {
                // Save to sessionStorage so it survives the reload
                sessionStorage.setItem('pending_csrf_token', freshToken);
            }
        }

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

// CRITICAL: Add CSRF token and locale to every Inertia request
// Inertia overrides axios default headers, so we must explicitly add it
router.on('before', (event) => {
    const token = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const locale = localStorage.getItem('i18nextLng') || 'az';

    // Set in axios defaults (for non-Inertia requests)
    if (token && window.axios) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }

    // CRITICAL: Add to Inertia request headers
    // This is the key fix - Inertia doesn't use axios defaults!
    if (event.detail.visit) {
        event.detail.visit.headers = event.detail.visit.headers || {};

        if (token) {
            event.detail.visit.headers['X-CSRF-TOKEN'] = token;
        }

        // Add locale header for backend to return localized content
        event.detail.visit.headers['X-Locale'] = locale;
    }
});

// CRITICAL FIX: Intercept XMLHttpRequest prototype to capture CSRF token
// This intercepts ALL XHR requests (which axios uses)
(function() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    const xhrRequestMap = new WeakMap();

    XMLHttpRequest.prototype.open = function(this: XMLHttpRequest, ...args: any[]) {
        const url = args[1];
        const urlStr = String(url);
        xhrRequestMap.set(this, urlStr);
        return originalOpen.apply(this, args as any);
    };

    XMLHttpRequest.prototype.send = function(this: XMLHttpRequest, ...args: any[]) {
        this.addEventListener('load', function(this: XMLHttpRequest) {
            // Get CSRF token from response header
            const freshToken = this.getResponseHeader('x-csrf-token') || this.getResponseHeader('X-CSRF-TOKEN');

            if (freshToken) {
                // CRITICAL: Store in sessionStorage so it survives page reload
                sessionStorage.setItem('pending_csrf_token', freshToken);

                // Update meta tag
                const metaTag = document.head.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', freshToken);
                }

                // Update axios defaults
                if ((window as any).axios) {
                    (window as any).axios.defaults.headers.common['X-CSRF-TOKEN'] = freshToken;
                }

                // Update last known token
                lastKnownCSRFToken = freshToken;
            }
        });

        return originalSend.apply(this, args as any);
    };
})();

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

        // Initialize language preference
        // Priority: User DB preference > localStorage > Browser language > Default (az)
        const user = (props.initialPage.props as any)?.auth?.user;
        const userLanguage = user?.language;
        const storedLanguage = localStorage.getItem('i18nextLng');

        // Sync language preference: If user has a DB preference different from localStorage, update localStorage
        if (userLanguage && userLanguage !== storedLanguage) {
            localStorage.setItem('i18nextLng', userLanguage);

            // Dynamically import i18n to avoid circular dependency
            import('./i18n').then((i18nModule) => {
                i18nModule.default.changeLanguage(userLanguage);
            });
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
