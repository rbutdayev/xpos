import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Read version from version.txt file
const version = fs.readFileSync(path.resolve(__dirname, 'version.txt'), 'utf-8').trim();

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(`v${version}`)
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core vendor libraries
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-inertia': ['@inertiajs/react'],

                    // UI libraries
                    'vendor-ui': [
                        '@headlessui/react',
                        '@heroicons/react',
                    ],

                    // i18n
                    'vendor-i18n': [
                        'i18next',
                        'react-i18next',
                        'i18next-browser-languagedetector',
                        'i18next-http-backend',
                    ],

                    // Other large libraries
                    'vendor-utils': [
                        'axios',
                        'lodash',
                        'date-fns',
                    ],
                },
            },
        },
        chunkSizeWarningLimit: 600, // Increase slightly to 600kb
        sourcemap: false, // Disable source maps in production for smaller builds
    },
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:8000',
            '/products': 'http://localhost:8000',
            '/customers': 'http://localhost:8000',
            '/categories': 'http://localhost:8000',
        }
    }
});
