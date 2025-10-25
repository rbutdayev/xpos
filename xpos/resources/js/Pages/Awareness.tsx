import { Link } from '@inertiajs/react';
import {
    SparklesIcon,
    ChartBarIcon,
    CubeIcon,
    UserGroupIcon,
    BoltIcon,
    ShoppingBagIcon,
    DevicePhoneMobileIcon,
    CloudIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    RocketLaunchIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowPathIcon,
    BeakerIcon,
    ComputerDesktopIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Awareness() {
    const [scrollY, setScrollY] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [salesAmount, setSalesAmount] = useState(0);
    const [ordersCount, setOrdersCount] = useState(0);
    const [customersCount, setCustomersCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-rotate process steps
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 4);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    // Animated counters
    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            setSalesAmount(Math.floor((12450 / steps) * currentStep));
            setOrdersCount(Math.floor((247 / steps) * currentStep));
            setCustomersCount(Math.floor((892 / steps) * currentStep));

            if (currentStep >= steps) {
                clearInterval(timer);
                setSalesAmount(12450);
                setOrdersCount(247);
                setCustomersCount(892);
            }
        }, increment);

        return () => clearInterval(timer);
    }, []);

    const processSteps = [
        { icon: ShoppingBagIcon, label: 'Scan', color: 'cyan', emoji: '🛍️' },
        { icon: CurrencyDollarIcon, label: 'Pay', color: 'green', emoji: '💳' },
        { icon: CheckCircleIcon, label: 'Done', color: 'purple', emoji: '✅' },
        { icon: RocketLaunchIcon, label: 'Ship', color: 'orange', emoji: '🚀' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 text-white overflow-hidden">
            {/* Animated Particles Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${5 + Math.random() * 10}s linear infinite`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            {/* Hero - Pure Visual */}
            <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
                {/* Massive Animated Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <SparklesIcon className="w-[800px] h-[800px] text-cyan-400 animate-spin-slow" />
                </div>

                <div className="relative z-10 text-center">
                    {/* Animated Logo Circle */}
                    <div className="relative mx-auto mb-12 w-64 h-64">
                        {/* Rotating Rings */}
                        <div className="absolute inset-0 border-4 border-cyan-500 rounded-full animate-spin-slow opacity-50"></div>
                        <div className="absolute inset-4 border-4 border-purple-500 rounded-full animate-spin-reverse opacity-50"></div>
                        <div className="absolute inset-8 border-4 border-pink-500 rounded-full animate-spin-slow opacity-50"></div>

                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <SparklesIcon className="w-32 h-32 text-cyan-400 drop-shadow-2xl" />
                                <div className="absolute inset-0 bg-cyan-400 blur-3xl opacity-60 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Massive Title */}
                    <h1 className="text-9xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-2xl animate-gradient-x">
                        XPOS
                    </h1>

                    {/* Visual Counter Dashboard */}
                    <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
                        {/* Sales Visual */}
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                            <div className="relative bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl border-2 border-cyan-500/50 transform group-hover:scale-110 transition-all duration-300">
                                <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
                                <div className="text-5xl font-black text-cyan-400 mb-2">₼{salesAmount.toLocaleString()}</div>
                                <div className="text-sm text-gray-400">💰 Sales</div>
                            </div>
                        </div>

                        {/* Orders Visual */}
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                            <div className="relative bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl border-2 border-purple-500/50 transform group-hover:scale-110 transition-all duration-300">
                                <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                                <div className="text-5xl font-black text-purple-400 mb-2">{ordersCount}</div>
                                <div className="text-sm text-gray-400">📦 Orders</div>
                            </div>
                        </div>

                        {/* Customers Visual */}
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                            <div className="relative bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl border-2 border-orange-500/50 transform group-hover:scale-110 transition-all duration-300">
                                <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                                <div className="text-5xl font-black text-orange-400 mb-2">{customersCount}</div>
                                <div className="text-sm text-gray-400">👥 Happy</div>
                            </div>
                        </div>
                    </div>

                    {/* Giant CTA */}
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-4 px-16 py-8 text-3xl font-black text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-110 transition-all duration-300 group animate-pulse-slow"
                    >
                        <RocketLaunchIcon className="w-12 h-12" />
                        START NOW
                        <ArrowRightIcon className="w-12 h-12 group-hover:translate-x-4 transition-transform duration-300" />
                    </Link>
                </div>
            </section>

            {/* Visual Process Flow */}
            <section className="relative py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Giant Emoji Title */}
                    <div className="text-center mb-20">
                        <div className="text-9xl mb-6">⚡</div>
                        <h2 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
                            3 Seconds
                        </h2>
                    </div>

                    {/* Animated Process Steps */}
                    <div className="relative">
                        {/* Connection Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 transform -translate-y-1/2 rounded-full"></div>

                        {/* Steps */}
                        <div className="relative grid grid-cols-4 gap-8">
                            {processSteps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = activeStep === index;
                                return (
                                    <div key={index} className="text-center">
                                        {/* Step Circle */}
                                        <div className={`relative mx-auto w-48 h-48 mb-6 transform transition-all duration-500 ${isActive ? 'scale-125' : 'scale-100'}`}>
                                            {/* Glow Effect */}
                                            <div className={`absolute inset-0 bg-${step.color}-500 rounded-full blur-3xl opacity-${isActive ? '75' : '30'} transition-all duration-500`}></div>

                                            {/* Circle */}
                                            <div className={`relative w-full h-full rounded-full border-8 border-${step.color}-500 bg-gray-900 flex items-center justify-center ${isActive ? 'animate-bounce' : ''}`}>
                                                {/* Big Emoji */}
                                                <div className="text-7xl">{step.emoji}</div>
                                            </div>

                                            {/* Pulse Rings (active only) */}
                                            {isActive && (
                                                <>
                                                    <div className={`absolute inset-0 border-4 border-${step.color}-500 rounded-full animate-ping`}></div>
                                                    <div className={`absolute inset-0 border-4 border-${step.color}-500 rounded-full animate-ping`} style={{ animationDelay: '0.5s' }}></div>
                                                </>
                                            )}
                                        </div>

                                        {/* Step Label */}
                                        <div className={`text-3xl font-black text-${step.color}-400 transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
                                            {step.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Visual Features Grid - Icon Based */}
            <section className="relative py-32 px-4 bg-gradient-to-b from-transparent via-blue-950/50 to-transparent">
                <div className="max-w-7xl mx-auto">
                    {/* Visual Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                        {[
                            { icon: ComputerDesktopIcon, emoji: '💻', color: 'cyan', size: 'huge' },
                            { icon: DevicePhoneMobileIcon, emoji: '📱', color: 'purple', size: 'huge' },
                            { icon: ChartBarIcon, emoji: '📊', color: 'green', size: 'huge' },
                            { icon: CubeIcon, emoji: '📦', color: 'orange', size: 'huge' },
                            { icon: GlobeAltIcon, emoji: '🌍', color: 'blue', size: 'huge' },
                            { icon: BoltIcon, emoji: '⚡', color: 'yellow', size: 'huge' }
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={i}
                                    className="group relative cursor-pointer"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    {/* Glow */}
                                    <div className={`absolute inset-0 bg-${item.color}-500 rounded-3xl blur-3xl opacity-0 group-hover:opacity-50 transition-all duration-500`}></div>

                                    {/* Card */}
                                    <div className="relative bg-gray-900/50 backdrop-blur-xl p-12 rounded-3xl border-2 border-gray-700 group-hover:border-cyan-500 transform group-hover:scale-110 group-hover:-translate-y-4 transition-all duration-500">
                                        {/* Huge Emoji */}
                                        <div className="text-9xl mb-4 transform group-hover:rotate-12 transition-transform duration-300">
                                            {item.emoji}
                                        </div>

                                        {/* Icon Overlay */}
                                        <Icon className={`w-32 h-32 mx-auto text-${item.color}-400 opacity-20 group-hover:opacity-100 transition-all duration-300`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Live Dashboard Visualization */}
            <section className="relative py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Mock Screen */}
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl p-8 border-4 border-cyan-500/50 shadow-2xl shadow-cyan-500/50 transform hover:scale-105 transition-all duration-500">
                        {/* Browser Dots */}
                        <div className="flex gap-3 mb-8">
                            <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse"></div>
                            <div className="w-6 h-6 rounded-full bg-yellow-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-6 h-6 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>

                        {/* Animated Chart */}
                        <div className="space-y-8">
                            {/* Bar Chart Visualization */}
                            <div className="flex items-end justify-between h-64 gap-4">
                                {[65, 45, 80, 55, 90, 70, 85, 95, 75, 88, 92, 78].map((height, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer">
                                        <div
                                            className="bg-gradient-to-t from-cyan-500 via-blue-500 to-purple-500 rounded-t-2xl transition-all duration-1000 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 relative overflow-hidden"
                                            style={{
                                                height: `${height}%`,
                                                animationDelay: `${i * 100}ms`
                                            }}
                                        >
                                            {/* Shimmer Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                        </div>

                                        {/* Value on hover */}
                                        <div className="text-center mt-2 text-cyan-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            {height}%
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stat Pills */}
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { label: '⚡ Real-time', color: 'cyan' },
                                    { label: '☁️ Cloud', color: 'blue' },
                                    { label: '🔒 Secure', color: 'green' },
                                    { label: '📱 Mobile', color: 'purple' },
                                    { label: '🚀 Fast', color: 'orange' },
                                    { label: '💎 Premium', color: 'pink' }
                                ].map((pill, i) => (
                                    <div
                                        key={i}
                                        className={`px-8 py-4 bg-gradient-to-r from-${pill.color}-500/20 to-${pill.color}-600/20 rounded-full text-xl font-bold border-2 border-${pill.color}-500/50 backdrop-blur-sm hover:scale-110 transition-transform duration-300 cursor-pointer`}
                                    >
                                        {pill.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating Success Icon */}
                        <div className="absolute -top-12 -right-12">
                            <CheckCircleIcon className="w-32 h-32 text-green-400 animate-bounce drop-shadow-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Mega CTA */}
            <section className="relative py-32 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Giant Emoji */}
                    <div className="text-9xl mb-8 animate-bounce">🎉</div>

                    {/* Huge Text */}
                    <h2 className="text-8xl font-black mb-12 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 animate-gradient-x">
                        Ready?
                    </h2>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-8 justify-center">
                        <Link
                            href="/shop"
                            className="group relative inline-flex items-center justify-center gap-4 px-16 py-8 text-3xl font-black overflow-hidden rounded-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 animate-gradient-x"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
                            <ShoppingBagIcon className="relative w-12 h-12 text-white" />
                            <span className="relative text-white">VISIT SHOP</span>
                            <ArrowRightIcon className="relative w-12 h-12 text-white group-hover:translate-x-4 transition-transform duration-300" />
                        </Link>

                        <Link
                            href="/login"
                            className="group inline-flex items-center justify-center gap-4 px-16 py-8 text-3xl font-black text-white border-4 border-white/50 rounded-full hover:bg-white/10 hover:border-white transform hover:scale-110 transition-all duration-300"
                        >
                            <RocketLaunchIcon className="w-12 h-12" />
                            SIGN IN
                        </Link>
                    </div>
                </div>
            </section>

            {/* Minimal Footer */}
            <footer className="relative py-12 px-4 border-t border-white/10">
                <div className="text-center">
                    <div className="text-6xl mb-4">✨</div>
                    <p className="text-gray-400">© 2025 XPOS · Onyx Digital</p>
                </div>
            </footer>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }

                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes shimmer {
                    0% { transform: translateY(100%); }
                    100% { transform: translateY(-100%); }
                }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }

                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }

                .animate-spin-reverse {
                    animation: spin-reverse 15s linear infinite;
                }

                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }

                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
