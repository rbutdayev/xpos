import axios from 'axios';
import { router } from '@inertiajs/react';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set up CSRF token for axios
const setCSRFToken = () => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
    } else {
        console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
    }
};

// Set initial token
setCSRFToken();

// Refresh CSRF token when page becomes visible (especially important for multi-tab scenarios)
// This handles cases where user logs out/in with different account in another tab
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh CSRF token when tab becomes active
        setCSRFToken();

        // On mobile or if page was hidden for >5 minutes, do a full page reload
        // to ensure session is still valid and prevent stale state
        const lastVisible = parseInt(sessionStorage.getItem('lastVisibleTime') || '0');
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (lastVisible && (now - lastVisible) > fiveMinutes) {
            // Page was inactive for >5 minutes, reload to ensure fresh session
            router.reload({ only: [] });
        }
    } else {
        // Store when page was hidden
        sessionStorage.setItem('lastVisibleTime', Date.now().toString());
    }
});

// Refresh CSRF token after Inertia page loads (e.g., after login when session regenerates)
router.on('finish', () => {
    setCSRFToken();
});

// Add axios interceptor to handle 419 errors gracefully
window.axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 419) {
            // Clear old token before reload to prevent caching issues
            if (window.axios.defaults.headers.common['X-CSRF-TOKEN']) {
                delete window.axios.defaults.headers.common['X-CSRF-TOKEN'];
            }

            // Page expired - refresh the page to get new tokens
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
