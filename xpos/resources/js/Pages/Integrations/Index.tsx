import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import {
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    ReceiptPercentIcon,
    CheckCircleIcon,
    Cog6ToothIcon,
    GiftIcon,
    ShoppingBagIcon,
    WrenchScrewdriverIcon,
    ClockIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'communication' | 'fiscal' | 'loyalty' | 'payment' | 'business' | 'delivery' | 'other';
    status: 'active' | 'inactive' | 'not_configured';
    route: string;
    color: string;
    features: string[];
    requiresOwner?: boolean;
    isSimpleToggle?: boolean; // For modules that don't have configuration
}

interface DependencyStatus {
    met: boolean;
    missing: string[];
}

interface IntegrationsProps extends PageProps {
    smsConfigured: boolean;
    telegramConfigured: boolean;
    fiscalPrinterConfigured: boolean;
    fiscalPrinterEnabled: boolean;
    loyaltyProgramConfigured: boolean;
    loyaltyProgramActive: boolean;
    shopEnabled: boolean;
    shopConfigured: boolean;
    servicesModuleEnabled: boolean;
    rentModuleEnabled: boolean;
    discountsModuleEnabled: boolean;
    giftCardsModuleEnabled: boolean;
    woltEnabled?: boolean;
    yangoEnabled?: boolean;
    boltEnabled?: boolean;
    dependencyStatus: Record<string, DependencyStatus>;
}

export default function Index({
    auth,
    smsConfigured,
    telegramConfigured,
    fiscalPrinterConfigured,
    fiscalPrinterEnabled,
    loyaltyProgramConfigured,
    loyaltyProgramActive,
    shopEnabled,
    shopConfigured,
    servicesModuleEnabled,
    rentModuleEnabled,
    discountsModuleEnabled,
    giftCardsModuleEnabled,
    woltEnabled = false,
    yangoEnabled = false,
    boltEnabled = false,
    dependencyStatus = {}
}: IntegrationsProps) {
    const isOwner = auth.user.role === 'account_owner';

    // Helper to check if a module can be enabled
    const canEnableModule = (moduleId: string): { canEnable: boolean; message?: string } => {
        if (!dependencyStatus[moduleId]) {
            return { canEnable: true };
        }

        const status = dependencyStatus[moduleId];
        if (!status.met) {
            return {
                canEnable: false,
                message: `Bu modulu aktivləşdirmək üçün əvvəlcə bunları konfiqurasiya etməlisiniz: ${status.missing.join(', ')}`
            };
        }

        return { canEnable: true };
    };

    const integrations: Integration[] = [
        {
            id: 'shop',
            name: 'Online Mağaza',
            description: 'Məhsullarınızı online satışa çıxarın və gəlir əldə edin',
            icon: ShoppingBagIcon,
            category: 'other',
            status: shopConfigured ? (shopEnabled ? 'active' : 'inactive') : 'not_configured',
            route: '/shop-settings',
            color: 'blue',
            features: [
                'Online mağaza',
                'Məhsul kataloqu',
                'Online sifarişlər',
                'Ödəniş inteqrasiyası'
            ]
        },
        {
            id: 'wolt',
            name: 'Wolt Food Delivery',
            description: 'Wolt platformasından sifarişləri avtomatik qəbul edin',
            icon: TruckIcon,
            category: 'delivery',
            status: woltEnabled ? 'active' : 'inactive',
            route: '/integrations/wolt',
            color: 'violet',
            features: [
                'Avtomatik sifariş qəbulu',
                'Status sinxronizasiyası',
                'Anbar seçimi',
                'Filial təyini'
            ],
            isSimpleToggle: true
        },
        {
            id: 'yango',
            name: 'Yango Food Delivery',
            description: 'Yango platformasından sifarişləri avtomatik qəbul edin',
            icon: TruckIcon,
            category: 'delivery',
            status: yangoEnabled ? 'active' : 'inactive',
            route: '/integrations/yango',
            color: 'yellow',
            features: [
                'Avtomatik sifariş qəbulu',
                'Status sinxronizasiyası',
                'Anbar seçimi',
                'Filial təyini'
            ],
            isSimpleToggle: true
        },
        {
            id: 'bolt',
            name: 'Bolt Food Delivery',
            description: 'Bolt Food platformasından sifarişləri avtomatik qəbul edin',
            icon: TruckIcon,
            category: 'delivery',
            status: boltEnabled ? 'active' : 'inactive',
            route: '/integrations/bolt',
            color: 'green',
            features: [
                'Avtomatik sifariş qəbulu',
                'Status sinxronizasiyası',
                'Anbar seçimi',
                'Filial təyini'
            ],
            isSimpleToggle: true
        },
        {
            id: 'sms',
            name: 'SMS Xidməti',
            description: 'Müştərilərə SMS göndərin, avtomatik bildirişlər və kampaniyalar',
            icon: PaperAirplaneIcon,
            category: 'communication',
            status: smsConfigured ? 'active' : 'not_configured',
            route: '/integrations/sms',
            color: 'blue',
            features: [
                'Toplu SMS göndərmə',
                'Müştəri bildirişləri',
                'Avtomatik mesajlar',
                'SMS statistikası'
            ]
        },
        {
            id: 'telegram',
            name: 'Telegram Bot',
            description: 'Telegram vasitəsilə bildirişlər və əlaqə',
            icon: ChatBubbleLeftRightIcon,
            category: 'communication',
            status: telegramConfigured ? 'active' : 'not_configured',
            route: '/integrations/telegram',
            color: 'sky',
            features: [
                'Real-time bildirişlər',
                'Satış məlumatları',
                'Stok xəbərdarlıqları',
                'Müştəri sorğuları'
            ]
        },
        {
            id: 'fiscal-printer',
            name: 'Fiskal Printer (E-Kassa)',
            description: 'Vergilər Nazirliyinin tələb etdiyi elektron kassa inteqrasiyası',
            icon: ReceiptPercentIcon,
            category: 'fiscal',
            status: fiscalPrinterConfigured ? (fiscalPrinterEnabled ? 'active' : 'inactive') : 'not_configured',
            route: '/fiscal-printer',
            color: 'emerald',
            features: [
                '5 provayder dəstəyi',
                'Avtomatik fiskal çek',
                'Lokal şəbəkə əlaqəsi',
                'Audit log'
            ],
            requiresOwner: true
        },
        {
            id: 'loyalty-program',
            name: 'Loyallıq Proqramı',
            description: 'Müştərilərə bal qazandırın və sadiq müştərilər yaradın',
            icon: GiftIcon,
            category: 'loyalty',
            status: loyaltyProgramConfigured ? (loyaltyProgramActive ? 'active' : 'inactive') : 'not_configured',
            route: '/loyalty-program',
            color: 'purple',
            features: [
                'Avtomatik bal qazanma',
                'Endirim üçün bal istifadəsi',
                'Bal bitmə tarixi',
                'Müştəri loyallıq hesabatı'
            ]
        },
        {
            id: 'services',
            name: 'Xidmətlər Modulu',
            description: 'Dərzi, telefon təmiri və digər xidmətləri idarə edin',
            icon: WrenchScrewdriverIcon,
            category: 'business',
            status: servicesModuleEnabled ? 'active' : 'inactive',
            route: '/settings',
            color: 'indigo',
            features: [
                'Dərzi xidmətləri',
                'Telefon təmiri',
                'Elektronika təmiri',
                'Ümumi xidmətlər'
            ],
            isSimpleToggle: true
        },
        {
            id: 'rent',
            name: 'İcarə Modulu',
            description: 'İcarə əməliyyatlarını və inventarı idarə edin',
            icon: ClockIcon,
            category: 'business',
            status: rentModuleEnabled ? 'active' : 'inactive',
            route: '/settings',
            color: 'teal',
            features: [
                'İcarə siyahısı',
                'İcarə təqvimi',
                'İcarə inventarı',
                'Müqavilə şablonları'
            ],
            isSimpleToggle: true
        },
        {
            id: 'discounts',
            name: 'Endirimlər Modulu',
            description: 'Məhsullara endirim tətbiq edin və idarə edin',
            icon: ReceiptPercentIcon,
            category: 'business',
            status: discountsModuleEnabled ? 'active' : 'inactive',
            route: '/settings',
            color: 'amber',
            features: [
                'Məhsul endirimlər',
                'Endirim faizləri',
                'Tarix aralığı ilə endirimlər',
                'Filial üzrə endirimlər'
            ],
            isSimpleToggle: true
        },
        {
            id: 'gift_cards',
            name: 'Hədiyyə Kartları',
            description: 'Hədiyyə kartları satışı və idarəetməsi',
            icon: GiftIcon,
            category: 'business',
            status: giftCardsModuleEnabled ? 'active' : 'inactive',
            route: '/gift-cards/configure',
            color: 'pink',
            features: [
                'Hədiyyə kartları satışı',
                'Fiskal inteqrasiya',
                'Kart balans izləmə',
                'Çoxdəfəli istifadə'
            ],
            isSimpleToggle: true
        }
    ];

    const categories = [
        { id: 'all', name: 'Hamısı', count: integrations.length },
        { id: 'business', name: 'Biznes Modulları', count: integrations.filter(i => i.category === 'business').length },
        { id: 'delivery', name: 'Çatdırılma Platformaları', count: integrations.filter(i => i.category === 'delivery').length },
        { id: 'communication', name: 'Əlaqə', count: integrations.filter(i => i.category === 'communication').length },
        { id: 'fiscal', name: 'Fiskal', count: integrations.filter(i => i.category === 'fiscal').length },
        { id: 'loyalty', name: 'Loyallıq', count: integrations.filter(i => i.category === 'loyalty').length },
        { id: 'other', name: 'Digər', count: integrations.filter(i => i.category === 'other').length },
    ];

    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

    const filteredIntegrations = selectedCategory === 'all'
        ? integrations
        : integrations.filter(i => i.category === selectedCategory);

    const getStatusBadge = (status: Integration['status'], isSimpleToggle?: boolean) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Aktiv
                    </span>
                );
            case 'inactive':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {isSimpleToggle ? 'Deaktiv' : 'Konfiqurasiya edilib'}
                    </span>
                );
            case 'not_configured':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Quraşdırılmayıb
                    </span>
                );
        }
    };

    const getColorClasses = (color: string, type: 'bg' | 'border' | 'text' | 'button' = 'bg') => {
        const classes: Record<string, Record<string, string>> = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', button: 'bg-blue-600' },
            sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', button: 'bg-sky-600' },
            emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', button: 'bg-emerald-600' },
            green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', button: 'bg-green-600' },
            purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', button: 'bg-purple-600' },
            violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', button: 'bg-violet-600' },
            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', button: 'bg-indigo-600' },
            teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', button: 'bg-teal-600' },
            amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', button: 'bg-amber-600' },
            yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', button: 'bg-yellow-600' },
            pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', button: 'bg-pink-600' },
        };
        return classes[color]?.[type] || classes.blue[type];
    };

    const handleIntegrationClick = (integration: Integration) => {
        if (integration.requiresOwner && !isOwner) {
            alert('Bu inteqrasiyaya yalnız account owner daxil ola bilər.');
            return;
        }
        router.visit(integration.route);
    };

    const handleToggleModule = (moduleId: string, currentlyEnabled: boolean) => {
        // If trying to enable, check dependencies first
        if (!currentlyEnabled) {
            const { canEnable, message } = canEnableModule(moduleId);
            if (!canEnable) {
                alert(message);
                return;
            }
        }

        router.post('/settings/toggle-module', {
            module: moduleId
        }, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tətbiqlər və İnteqrasiyalar" />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Category Filter - Enterprise Style */}
                    <div className="mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            <nav className="flex flex-wrap gap-1">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`
                                            relative flex items-center gap-2.5 px-4 py-3 rounded-md
                                            font-medium text-sm transition-all duration-200 ease-in-out
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                            whitespace-nowrap
                                            ${selectedCategory === category.id
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <span className="font-semibold">{category.name}</span>
                                        <span className={`
                                            py-0.5 px-2.5 rounded-full text-xs font-medium
                                            ${selectedCategory === category.id
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                            }
                                        `}>
                                            {category.count}
                                        </span>
                                        {selectedCategory === category.id && (
                                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Integrations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredIntegrations.map((integration) => {
                            const IconComponent = integration.icon;
                            const isDisabled = integration.requiresOwner && !isOwner;

                            return (
                                <div
                                    key={integration.id}
                                    className={`
                                        bg-white rounded-lg shadow-sm border-2 overflow-hidden
                                        ${isDisabled ? 'opacity-60' : 'hover:shadow-md'}
                                        transition-all duration-200
                                        ${getColorClasses(integration.color, 'border')}
                                        flex flex-col
                                    `}
                                >
                                    <div className={`p-4 sm:p-6 ${getColorClasses(integration.color, 'bg')} flex-1 flex flex-col`}>
                                        <div className="flex items-start justify-between">
                                            <div className={`p-2 sm:p-3 rounded-lg ${getColorClasses(integration.color, 'text')} bg-white`}>
                                                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            {getStatusBadge(integration.status, integration.isSimpleToggle)}
                                        </div>

                                        <div className="mt-3 sm:mt-4">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                                {integration.name}
                                                {integration.requiresOwner && (
                                                    <span className="ml-2 text-xs text-gray-500">(Owner)</span>
                                                )}
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-600">
                                                {integration.description}
                                            </p>
                                        </div>

                                        {/* Dependency Warning */}
                                        {integration.status !== 'active' && !canEnableModule(integration.id).canEnable && (
                                            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                                <div className="flex items-start">
                                                    <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-xs font-medium text-yellow-800">
                                                            Qoşulma tələb edir
                                                        </p>
                                                        <p className="text-xs text-yellow-700 mt-1">
                                                            {canEnableModule(integration.id).message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Features */}
                                        <div className="mt-4 space-y-2 flex-1">
                                            {integration.features.map((feature, index) => (
                                                <div key={index} className="flex items-center text-sm text-gray-700">
                                                    <CheckCircleIcon className={`w-4 h-4 mr-2 ${getColorClasses(integration.color, 'text')}`} />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Button */}
                                        <div className="mt-auto pt-4 sm:pt-6">
                                            {['services', 'rent', 'discounts', 'gift_cards', 'shop', 'wolt', 'yango', 'bolt'].includes(integration.id) ? (
                                                // Toggle switch for business modules
                                                <button
                                                    onClick={() => handleToggleModule(integration.id, integration.status === 'active')}
                                                    disabled={integration.status !== 'active' && !canEnableModule(integration.id).canEnable}
                                                    className={`
                                                        w-full flex items-center justify-center px-3 sm:px-4 py-2 border-2
                                                        rounded-md shadow-sm text-xs sm:text-sm font-medium
                                                        ${integration.status !== 'active' && !canEnableModule(integration.id).canEnable
                                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : integration.status === 'active'
                                                                ? `${getColorClasses(integration.color, 'button')} text-white hover:opacity-90`
                                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                        }
                                                        focus:outline-none focus:ring-2 focus:ring-offset-2
                                                        transition-all duration-200
                                                    `}
                                                >
                                                    {integration.status === 'active' ? (
                                                        <>
                                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                                            Aktivdir - Söndür
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Cog6ToothIcon className="w-5 h-5 mr-2" />
                                                            Aktivləşdir
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                // Regular button for other integrations
                                                <button
                                                    onClick={() => handleIntegrationClick(integration)}
                                                    disabled={isDisabled}
                                                    className={`
                                                        w-full flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent
                                                        rounded-md shadow-sm text-xs sm:text-sm font-medium text-white
                                                        ${isDisabled
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : `${getColorClasses(integration.color, 'button')} hover:opacity-90`
                                                        }
                                                        focus:outline-none focus:ring-2 focus:ring-offset-2
                                                        transition-colors duration-200
                                                    `}
                                                >
                                                    <Cog6ToothIcon className="w-5 h-5 mr-2" />
                                                    {integration.status === 'not_configured' ? 'Quraşdır' : 'Parametrlər'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {filteredIntegrations.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Bu kateqoriyada heç bir inteqrasiya yoxdur.</p>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    İnteqrasiyalar haqqında
                                </h3>
                                <div className="mt-2 text-xs sm:text-sm text-blue-700">
                                    <p>
                                        Tətbiqlər və inteqrasiyalar sizin biznesinizi daha effektiv idarə etməyə kömək edir.
                                        Hər bir xidməti aktivləşdirmək üçün uyğun parametrləri konfiqurasiya etməlisiniz.
                                    </p>
                                    <p className="mt-2">
                                        <strong>Qeyd:</strong> Bəzi inteqrasiyalar (məsələn, Fiskal Printer) yalnız account owner tərəfindən idarə oluna bilər.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
