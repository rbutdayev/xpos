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

// Refresh CSRF token on mobile browsers when page becomes visible
if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            setCSRFToken();
        }
    });
}

// Refresh CSRF token after Inertia page loads (e.g., after login when session regenerates)
router.on('finish', () => {
    setCSRFToken();
});

// Add axios interceptor to handle 419 errors gracefully
window.axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 419) {
            // Page expired - refresh the page to get new tokens
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
