<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XPOS - Biznesiniz üçün Müasir Satış Sistemi</title>
    <link rel="icon" href="{{ asset('favicon.ico') }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        body {
            font-family: 'Inter', sans-serif;
        }

        @keyframes float-slow {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
            }
            25% {
                transform: translateY(-20px) rotate(5deg);
            }
            50% {
                transform: translateY(-10px) rotate(-5deg);
            }
            75% {
                transform: translateY(-30px) rotate(3deg);
            }
        }

        @keyframes bounce-slow {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-25px);
            }
        }

        @keyframes fade-in {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .animate-float-slow {
            animation: float-slow 10s ease-in-out infinite;
        }

        .animate-bounce-slow {
            animation: bounce-slow 6s ease-in-out infinite;
        }

        .animate-fade-in {
            animation: fade-in 1s ease-out;
        }

        .feature-card {
            transition: all 0.3s ease;
        }

        .feature-card:hover {
            transform: translateY(-8px);
        }

        .smooth-scroll {
            scroll-behavior: smooth;
        }
    </style>
</head>
<body class="smooth-scroll bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-x-hidden">

    <!-- Animated Background Grid -->
    <div class="fixed inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px); background-size: 60px 60px;"></div>

    <!-- Floating Retail-Themed Shapes -->
    <div class="fixed top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/30 to-indigo-400/30 rounded-full blur-3xl animate-bounce-slow pointer-events-none"></div>
    <div class="fixed bottom-32 right-32 w-56 h-56 bg-gradient-to-br from-purple-300/25 to-indigo-400/25 rounded-full blur-3xl animate-pulse pointer-events-none" style="animation-duration: 3s;"></div>
    <div class="fixed top-1/3 right-20 w-32 h-32 bg-gradient-to-br from-cyan-300/20 to-blue-400/20 rounded-full blur-2xl animate-bounce-slow pointer-events-none" style="animation-delay: 1s;"></div>
    <div class="fixed bottom-20 left-32 w-28 h-28 bg-gradient-to-br from-indigo-300/25 to-purple-400/25 rounded-full blur-2xl animate-pulse pointer-events-none" style="animation-duration: 4s; animation-delay: 0.5s;"></div>

    <!-- Animated Floating Retail Icons -->
    <div class="fixed top-10 left-1/4 animate-float-slow opacity-20 pointer-events-none" style="animation-delay: 0s; animation-duration: 10s;">
        <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
    </div>
    <div class="fixed bottom-1/3 right-1/4 animate-float-slow opacity-20 pointer-events-none" style="animation-delay: 2s; animation-duration: 12s;">
        <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
    </div>
    <div class="fixed top-1/2 left-10 animate-float-slow opacity-20 pointer-events-none" style="animation-delay: 4s; animation-duration: 11s;">
        <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
    </div>
    <div class="fixed top-2/3 right-10 animate-float-slow opacity-20 pointer-events-none" style="animation-delay: 1s; animation-duration: 9s;">
        <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
        </svg>
    </div>
    <div class="fixed bottom-10 left-1/3 animate-float-slow opacity-20 pointer-events-none" style="animation-delay: 3s; animation-duration: 10s;">
        <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
    </div>
    <div class="fixed top-20 right-1/3 animate-float-slow opacity-20 pointer-events-none" style="animation-delay: 5s; animation-duration: 13s;">
        <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
    </div>

    <!-- Top Banner -->
    <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-2 text-center text-sm font-medium">
        <div class="flex items-center justify-center gap-2 flex-wrap px-4">
            <span>ONYX Digital</span>
            <span class="hidden sm:inline">•</span>
            <a href="https://onyx.az" target="_blank" class="hover:underline">onyx.az</a>
            <span class="hidden sm:inline">•</span>
            <a href="tel:+994553102040" class="hover:underline">+994 55 310 20 40</a>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="sticky top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50 border-b-2 border-indigo-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-3">
                    <img src="{{ asset('logo.png') }}" alt="XPOS Logo" class="h-10 w-10 filter drop-shadow-lg">
                    <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">XPOS</span>
                </div>
                <div class="hidden md:flex items-center space-x-8">
                    <a href="#features" class="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Xüsusiyyətlər</a>
                    <a href="#benefits" class="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Üstünlüklər</a>
                    <a href="#contact" class="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Əlaqə</a>
                    <a href="{{ route('login') }}" class="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">Giriş</a>
                </div>
                <div class="md:hidden">
                    <a href="{{ route('login') }}" class="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg">Giriş</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16 animate-fade-in">
                <div class="inline-block mb-8 relative">
                    <img src="{{ asset('logo.png') }}" alt="XPOS Logo" class="h-24 w-24 mx-auto filter drop-shadow-2xl animate-pulse" style="animation-duration: 2s;">
                    <div class="absolute -inset-8 bg-gradient-to-r from-indigo-400/30 to-purple-500/30 rounded-full blur-2xl -z-10 animate-pulse" style="animation-duration: 3s;"></div>
                </div>
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                    Biznesinizi Rəqəmsallaşdırın
                </h1>
                <p class="text-xl md:text-2xl text-gray-700 mb-4 font-medium max-w-3xl mx-auto">
                    Müasir Pərakəndə Satış Sistemi
                </p>
                <p class="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                    Satışlarınızı idarə edin, stokları izləyin, müştərilərinizə daha yaxşı xidmət göstərin
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="#contact" class="inline-flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105">
                        İndi Başlayın
                        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                    <a href="#features" class="inline-flex items-center justify-center bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all transform hover:scale-105">
                        Daha Ətraflı
                    </a>
                </div>
            </div>

            <!-- Hero Feature Cards -->
            <div class="grid md:grid-cols-4 gap-6 mt-16">
                <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in">
                    <div class="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md inline-block mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Sürətli Satış</h3>
                    <p class="text-sm text-gray-600">İldırım sürətli POS sistemi</p>
                </div>

                <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in" style="animation-delay: 0.1s;">
                    <div class="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md inline-block mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Stok İdarəsi</h3>
                    <p class="text-sm text-gray-600">Real vaxt izləmə</p>
                </div>

                <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in" style="animation-delay: 0.2s;">
                    <div class="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-md inline-block mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Hesabatlar</h3>
                    <p class="text-sm text-gray-600">Detallı analitika</p>
                </div>

                <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in" style="animation-delay: 0.3s;">
                    <div class="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-md inline-block mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Müştərilər</h3>
                    <p class="text-sm text-gray-600">CRM sistemi</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16">
                <div class="inline-block p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
                    <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                </div>
                <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Hər Şey <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Bir Yerdə</span>
                </h2>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                    Biznesinizi idarə etmək üçün lazım olan bütün alətlər
                </p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Feature Cards -->
                <div class="feature-card bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">Sürətli Satış</h3>
                    <p class="text-gray-600 leading-relaxed">
                        İstər kassada, istərsə də toxunma ekranda sürətli və asan satış prosesi
                    </p>
                </div>

                <div class="feature-card bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">Stok İdarəsi</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Real vaxt rejimində stok izləmə, avtomatik xəbərdarlıqlar və anbar idarəsi
                    </p>
                </div>

                <div class="feature-card bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-xl">
                    <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">Müştəri İdarəsi</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Müştəri məlumatları, borc izləmə və xüsusi xidmət yazıları
                    </p>
                </div>

                <div class="feature-card bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl">
                    <div class="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">Detallı Hesabatlar</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Satış, gəlir, xərc və mənfəət hesabatları bir kliklə
                    </p>
                </div>

                <div class="feature-card bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl">
                    <div class="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">Çoxsaylı Filial</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Bütün filial və anbarlarınızı bir sistemdən idarə edin
                    </p>
                </div>

                <div class="feature-card bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl">
                    <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">Dərzi Xidmətləri</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Geyim mağazaları üçün xüsusi dərzi xidməti idarəsi
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section id="benefits" class="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-16">
                <div class="inline-block p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl mb-4">
                    <svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Niyə <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">XPOS?</span>
                </h2>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                    Biznesini inkişaf etdirmək istəyənlər üçün ideal həll
                </p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <div class="flex gap-4 items-start bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Asan İstifadə</h3>
                        <p class="text-gray-600 text-sm">Heç bir texniki biliyə ehtiyac yoxdur. İstifadəyə dərhal başlayın</p>
                    </div>
                </div>

                <div class="flex gap-4 items-start bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Vaxt Qənaəti</h3>
                        <p class="text-gray-600 text-sm">Avtomatlaşdırma sayəsində gündəlik əməliyyatlarda saatlarla vaxt qazanın</p>
                    </div>
                </div>

                <div class="flex gap-4 items-start bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Dəqiq Məlumat</h3>
                        <p class="text-gray-600 text-sm">Bütün satış və stok məlumatlarınız real vaxt rejimində</p>
                    </div>
                </div>

                <div class="flex gap-4 items-start bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Təhlükəsizlik</h3>
                        <p class="text-gray-600 text-sm">Məlumatlarınız şifrələnmiş şəkildə saxlanılır və qorunur</p>
                    </div>
                </div>

                <div class="flex gap-4 items-start bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Dəstək</h3>
                        <p class="text-gray-600 text-sm">Peşəkar dəstək komandamız hər zaman yanınızdadır</p>
                    </div>
                </div>

                <div class="flex gap-4 items-start bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-pink-200 hover:border-pink-400 hover:shadow-lg transition-all">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Mobil Uyğun</h3>
                        <p class="text-gray-600 text-sm">İstənilən cihazdan - kompüter, tablet və ya telefon - giriş edin</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div class="max-w-4xl mx-auto">
            <div class="bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-3xl p-12 text-center shadow-2xl border-2 border-indigo-200 relative overflow-hidden">
                <!-- Decorative shapes -->
                <div class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                <div class="relative z-10">
                    <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                        Biznesinizi Böyütməyə Hazırsınızmı?
                    </h2>
                    <p class="text-xl text-indigo-100 mb-8">
                        Minlərlə biznes XPOS ilə inkişaf edir. Növbəti siz olun!
                    </p>
                    <a href="#contact" class="inline-flex items-center justify-center bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105">
                        İndi Başlayın
                        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div class="max-w-3xl mx-auto">
            <div class="text-center mb-12">
                <div class="inline-block p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
                    <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                </div>
                <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Bizimlə Əlaqə</span>
                </h2>
                <p class="text-xl text-gray-600 mb-4">
                    Suallarınız varmı? Biz sizə kömək etməyə hazırıq
                </p>
                <a href="tel:+994553102040" class="inline-flex items-center text-lg font-semibold text-indigo-600 hover:text-indigo-700">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    +994 55 310 20 40
                </a>
            </div>

            <div class="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-indigo-100">
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Adınız</label>
                        <input type="text" class="w-full px-4 py-3.5 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition bg-indigo-50/50" placeholder="Adınızı daxil edin">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Telefon</label>
                        <input type="tel" class="w-full px-4 py-3.5 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition bg-indigo-50/50" placeholder="+994 XX XXX XX XX">
                    </div>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">E-mail</label>
                    <input type="email" class="w-full px-4 py-3.5 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition bg-indigo-50/50" placeholder="email@example.com">
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Mesajınız</label>
                    <textarea rows="5" class="w-full px-4 py-3.5 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition bg-indigo-50/50" placeholder="Bizə nə demək istəyirsiniz?"></textarea>
                </div>
                <button class="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02]">
                    Göndər
                </button>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white/80 backdrop-blur-md border-t-2 border-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div class="max-w-7xl mx-auto">
            <div class="grid md:grid-cols-3 gap-8 mb-8">
                <div>
                    <div class="flex items-center space-x-3 mb-4">
                        <img src="{{ asset('logo.png') }}" alt="XPOS Logo" class="h-10 w-10 filter drop-shadow-lg">
                        <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">XPOS</span>
                    </div>
                    <p class="text-gray-600">
                        Biznesiniz üçün müasir və asan POS həlli
                    </p>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Keçidlər</h3>
                    <ul class="space-y-2">
                        <li><a href="#features" class="text-gray-600 hover:text-indigo-600 transition-colors">Xüsusiyyətlər</a></li>
                        <li><a href="#benefits" class="text-gray-600 hover:text-indigo-600 transition-colors">Üstünlüklər</a></li>
                        <li><a href="#contact" class="text-gray-600 hover:text-indigo-600 transition-colors">Əlaqə</a></li>
                        <li><a href="{{ route('login') }}" class="text-indigo-600 hover:text-purple-600 transition-colors font-semibold">Giriş</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Əlaqə</h3>
                    <ul class="space-y-2 text-gray-600">
                        <li>Bakı, Azərbaycan</li>
                        <li><a href="mailto:info@xpos.az" class="hover:text-indigo-600">info@xpos.az</a></li>
                        <li><a href="tel:+994553102040" class="hover:text-indigo-600">+994 55 310 20 40</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t-2 border-indigo-100 pt-8 text-center">
                <p class="text-gray-600 mb-2">
                    <span class="font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">ONYX</span> tərəfindən •
                    <a href="https://onyx.az" target="_blank" class="hover:underline">onyx.az</a>
                </p>
                <p class="text-gray-500 text-sm">&copy; 2025 XPOS. Bütün hüquqlar qorunur.</p>
            </div>
        </div>
    </footer>

</body>
</html>
