<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- PWA Meta Tags -->
        <meta name="description" content="Professional Point of Sale and Inventory Management System by ONYX Digital">
        <meta name="theme-color" content="#2563eb">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="ONYX xPOS">

        <!-- PWA Icons -->
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png">
        <link rel="apple-touch-icon" sizes="72x72" href="/icon-72x72.png">
        <link rel="apple-touch-icon" sizes="96x96" href="/icon-96x96.png">
        <link rel="apple-touch-icon" sizes="128x128" href="/icon-128x128.png">
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.png">
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png">
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png">
        <link rel="apple-touch-icon" sizes="384x384" href="/icon-384x384.png">
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png">

        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
