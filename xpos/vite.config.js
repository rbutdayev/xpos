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
