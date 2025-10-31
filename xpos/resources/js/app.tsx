import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initBarcodePrinter } from './utils/barcodePrinter';

// Cache bust: Route parameter fix for stock-movements applied
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
