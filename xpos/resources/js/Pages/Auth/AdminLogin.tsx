import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import {
    UserIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldCheckIcon,
    ServerIcon,
    ChartBarIcon,
    CogIcon,
    UsersIcon,
    CircleStackIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function AdminLogin({
    status,
}: {
    status?: string;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [floatingIcons, setFloatingIcons] = useState<Array<{id: number, x: number, y: number, delay: number, icon: any}>>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    useEffect(() => {
        // Generate random floating admin icons
        const icons = [ShieldCheckIcon, ServerIcon, ChartBarIcon, CogIcon, UsersIcon, CircleStackIcon];
        const items = Array.from({ length: 8 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5,
            icon: icons[Math.floor(Math.random() * icons.length)]
        }));
        setFloatingIcons(items);
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('admin.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
            <Head title="Super Admin Girişi - ONYX xPos" />

            {/* Animated Background Grid */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                }}
            ></div>

            {/* Animated Floating Admin Icons */}
            {floatingIcons.map((item) => {
                const Icon = item.icon;
                return (
                    <div
                        key={item.id}
                        className="absolute animate-float-slow opacity-20"
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            animationDelay: `${item.delay}s`,
                            animationDuration: `${8 + Math.random() * 4}s`
                        }}
                    >
                        <Icon className="w-12 h-12 text-indigo-400" />
                    </div>
                );
            })}

            {/* Floating Admin-Themed Shapes */}
            <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-full blur-3xl animate-bounce-slow"></div>
            <div className="absolute bottom-32 right-32 w-56 h-56 bg-gradient-to-br from-purple-500/25 to-indigo-600/25 rounded-full blur-3xl animate-pulse" style={{animationDuration: '3s'}}></div>
            <div className="absolute top-1/3 right-20 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-full blur-2xl animate-bounce-slow" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-20 left-32 w-28 h-28 bg-gradient-to-br from-indigo-500/25 to-violet-600/25 rounded-full blur-2xl animate-pulse" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-6xl flex gap-8 items-center">
                {/* Left Side - Admin Branding */}
                <div className="hidden lg:flex flex-col flex-1">
                    <div className="mb-8">
                        <div className="relative inline-block mb-6">
                            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl animate-pulse" style={{animationDuration: '2s'}}>
                                <ShieldCheckIcon className="h-16 w-16 text-white" />
                            </div>
                            <div className="absolute -inset-6 bg-gradient-to-r from-indigo-400/30 to-purple-500/30 rounded-full blur-2xl -z-10 animate-pulse" style={{animationDuration: '3s'}}></div>
                        </div>
                        <h1 className="text-5xl font-extrabold mb-4 text-white tracking-tight leading-tight animate-fade-in">
                            Super Admin Panel
                        </h1>
                        <p className="text-2xl text-indigo-300 font-semibold mb-2">
                            ONYX xPos İdarəetmə Paneli
                        </p>
                        <p className="text-lg text-indigo-200">
                            Sistem idarəçiliyə tam girişə xoş gəlmisiniz
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-indigo-400/30 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                                <UsersIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Hesab İdarəetməsi</h3>
                                <p className="text-sm text-indigo-200">Bütün tenant hesablarına tam nəzarət</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-purple-400/30 hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
                                <CircleStackIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Sistem Monitorinqi</h3>
                                <p className="text-sm text-indigo-200">Real vaxt sistem sağlamlığı və performansı</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-indigo-400/30 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-md">
                                <ChartBarIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Ətraflı Analitika</h3>
                                <p className="text-sm text-indigo-200">Platform genişliyində hesabatlar və metrikalar</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-violet-400/30 hover:border-violet-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md">
                                <CogIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Sistem Parametrləri</h3>
                                <p className="text-sm text-indigo-200">Qlobal ayarlar və konfiqurasiya idarəsi</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="flex-1 max-w-md w-full">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl mb-4">
                            <ShieldCheckIcon className="h-12 w-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2 text-white">
                            Super Admin
                        </h1>
                        <p className="text-indigo-200 font-medium">İdarəetmə Paneli</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl p-8 relative border-2 border-indigo-300 animate-fade-in">
                        {/* Accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 rounded-t-3xl"></div>

                        <div className="text-center mb-8 mt-2">
                            <div className="inline-block p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
                                <ShieldCheckIcon className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Girişi</h2>
                            <p className="text-gray-600">Super admin hesabınıza daxil olun</p>
                        </div>

                        {status && (
                            <div className="mb-6 text-sm font-medium text-emerald-700 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="email" value="E-poçt Ünvanı" className="text-gray-700 font-semibold mb-2 block" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-indigo-300"
                                        autoComplete="username"
                                        isFocused={true}
                                        placeholder="admin@onyx.az"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Şifrə" className="text-gray-700 font-semibold mb-2 block" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <TextInput
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={data.password}
                                        className="block w-full pl-12 pr-14 py-3.5 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-indigo-300"
                                        autoComplete="current-password"
                                        placeholder="Şifrənizi daxil edin"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-indigo-100 rounded-r-xl px-2 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-indigo-700 transition-colors" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-indigo-700 transition-colors" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center cursor-pointer group">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData('remember', e.target.checked)
                                        }
                                        className="rounded border-indigo-300 text-indigo-600 focus:ring-slate-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                                        Məni xatırla
                                    </span>
                                </label>
                            </div>

                            <div className="pt-2">
                                <PrimaryButton
                                    className="w-full justify-center py-3.5 px-6 border-0 rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 focus:outline-none focus:ring-4 focus:ring-slate-500/50 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Daxil olunur...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            Daxil ol
                                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    )}
                                </PrimaryButton>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-indigo-100">
                            <div className="text-center space-y-3">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center text-sm text-indigo-600 hover:text-purple-600 font-semibold transition-colors"
                                >
                                    <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Tenant girişi
                                </Link>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p className="font-semibold text-gray-700">ONYX Super Admin Panel</p>
                                    <p className="text-xs">&copy; 2025 ONYX. Bütün hüquqlar qorunur.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
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
            `}</style>
        </div>
    );
}
