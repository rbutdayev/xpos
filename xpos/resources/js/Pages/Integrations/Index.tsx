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
} from '@heroicons/react/24/outline';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'communication' | 'fiscal' | 'loyalty' | 'payment' | 'business' | 'other';
    status: 'active' | 'inactive' | 'not_configured';
    route: string;
    color: string;
    features: string[];
    requiresOwner?: boolean;
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
    discountsModuleEnabled
}: IntegrationsProps) {
    const isOwner = auth.user.role === 'account_owner';

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
            ]
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
            ]
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
            ]
        }
    ];

    const categories = [
        { id: 'all', name: 'Hamısı', count: integrations.length },
        { id: 'business', name: 'Biznes Modulları', count: integrations.filter(i => i.category === 'business').length },
        { id: 'communication', name: 'Əlaqə', count: integrations.filter(i => i.category === 'communication').length },
        { id: 'fiscal', name: 'Fiskal', count: integrations.filter(i => i.category === 'fiscal').length },
        { id: 'loyalty', name: 'Loyallıq', count: integrations.filter(i => i.category === 'loyalty').length },
        { id: 'other', name: 'Digər', count: integrations.filter(i => i.category === 'other').length },
    ];

    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

    const filteredIntegrations = selectedCategory === 'all'
        ? integrations
        : integrations.filter(i => i.category === selectedCategory);

    const getStatusBadge = (status: Integration['status']) => {
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Konfiqurasiya edilib
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
            purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', button: 'bg-purple-600' },
            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', button: 'bg-indigo-600' },
            teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', button: 'bg-teal-600' },
            amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', button: 'bg-amber-600' },
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

    const handleToggleModule = (moduleId: string) => {
        router.post('/settings/toggle-module', {
            module: moduleId
        }, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-lg sm:text-xl text-gray-800 leading-tight">
                            Tətbiqlər və İnteqrasiyalar
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                            Biznesinizi genişləndirmək üçün xidmətləri inteqrasiya edin
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tətbiqlər və İnteqrasiyalar" />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Category Filter */}
                    <div className="mb-6">
                        <div className="border-b border-gray-200 overflow-x-auto">
                            <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`
                                            whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm
                                            ${selectedCategory === category.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        {category.name}
                                        <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                                            {category.count}
                                        </span>
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
                                            {getStatusBadge(integration.status)}
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
                                            {['services', 'rent', 'discounts'].includes(integration.id) ? (
                                                // Toggle switch for business modules
                                                <button
                                                    onClick={() => handleToggleModule(integration.id)}
                                                    className={`
                                                        w-full flex items-center justify-center px-3 sm:px-4 py-2 border-2
                                                        rounded-md shadow-sm text-xs sm:text-sm font-medium
                                                        ${integration.status === 'active'
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
