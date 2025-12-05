import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';

/**
 * Global session manager that detects user changes across tabs
 * and prevents 419 CSRF errors when switching users
 */
export default function SessionManager() {
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;
    const currentAccountId = auth?.user?.account_id;
    const hasCheckedSession = useRef(false);

    useEffect(() => {
        // Skip check on initial mount
        if (!hasCheckedSession.current) {
            hasCheckedSession.current = true;

            // Store current user info for cross-tab detection
            if (currentUserId) {
                localStorage.setItem('current_user_id', currentUserId.toString());
                localStorage.setItem('current_account_id', currentAccountId?.toString() || '');
            }

            return;
        }

        const storedUserId = localStorage.getItem('current_user_id');
        const storedAccountId = localStorage.getItem('current_account_id');

        // User logged out
        if (!currentUserId && storedUserId) {
            localStorage.removeItem('current_user_id');
            localStorage.removeItem('current_account_id');
            localStorage.removeItem('wizard_form_data');
            return;
        }

        // User logged in or changed
        if (currentUserId) {
            const userChanged = storedUserId && storedUserId !== currentUserId.toString();
            const accountChanged = storedAccountId && currentAccountId && storedAccountId !== currentAccountId.toString();

            // IMPORTANT: Only reload if user/account changed AND we're not on login page
            // The login controller already handles the reload with X-Inertia-Location
            // This prevents double-reload which can cause CSRF token issues
            const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';

            if ((userChanged || accountChanged) && !isLoginPage) {
                console.warn('User/account changed detected. Forcing full page reload...');
                localStorage.setItem('current_user_id', currentUserId.toString());
                localStorage.setItem('current_account_id', currentAccountId?.toString() || '');
                localStorage.removeItem('wizard_form_data');

                // Force full page reload to get fresh CSRF token
                window.location.reload();
                return;
            }

            // Update stored IDs (this happens after login on dashboard)
            localStorage.setItem('current_user_id', currentUserId.toString());
            localStorage.setItem('current_account_id', currentAccountId?.toString() || '');
        }
    }, [currentUserId, currentAccountId]);

    // Listen for storage events from other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // Refresh CSRF token from the page (in case it changed)
            const token = document.head.querySelector('meta[name="csrf-token"]');
            if (token && window.axios?.defaults?.headers?.common) {
                const newToken = token.getAttribute('content');
                if (newToken) {
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                }
            }

            // Another tab logged in with a different user
            if (e.key === 'current_user_id' && e.newValue && currentUserId) {
                if (e.newValue !== currentUserId.toString()) {
                    console.warn('User changed in another tab. Reloading...');
                    window.location.reload();
                }
            }

            // Another tab logged out
            if (e.key === 'current_user_id' && !e.newValue && currentUserId) {
                console.warn('User logged out in another tab. Redirecting to login...');
                window.location.href = '/login';
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentUserId]);

    return null; // This component doesn't render anything
}
