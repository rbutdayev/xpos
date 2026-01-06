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
    ExclamationTriangleIcon,
    ArrowTopRightOnSquareIcon,
    ChevronRightIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';

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
    isSimpleToggle?: boolean;
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
    shopUrl: string | null;
    servicesModuleEnabled: boolean;
    rentModuleEnabled: boolean;
    discountsModuleEnabled: boolean;
    giftCardsModuleEnabled: boolean;
    expeditorModuleEnabled: boolean;
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
    shopUrl,
    servicesModuleEnabled,
    rentModuleEnabled,
    discountsModuleEnabled,
    giftCardsModuleEnabled,
    expeditorModuleEnabled,
    woltEnabled = false,
    yangoEnabled = false,
    boltEnabled = false,
    dependencyStatus = {}
}: IntegrationsProps) {
    const isOwner = auth.user.role === 'account_owner';

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
        },
        {
            id: 'expeditor',
            name: 'Ekspeditor (Sahə Satışı)',
            description: 'Müştəri yerində məhsul kataloqu göstərib satış aparın',
            icon: TruckIcon,
            category: 'business',
            status: expeditorModuleEnabled ? 'active' : 'inactive',
            route: '/expeditor',
            color: 'orange',
            features: [
                'Mobil məhsul kataloqu',
                'Müştəri yerində satış',
                'GPS məkan qeydi',
                'Sürətli sifariş təkrarı'
            ],
            isSimpleToggle: true
        }
    ];

    const categories = [
        { id: 'all', name: 'Hamısı', count: integrations.length },
        { id: 'business', name: 'Biznes Modulları', count: integrations.filter(i => i.category === 'business').length },
        { id: 'delivery', name: 'Çatdırılma', count: integrations.filter(i => i.category === 'delivery').length },
        { id: 'communication', name: 'Əlaqə', count: integrations.filter(i => i.category === 'communication').length },
        { id: 'fiscal', name: 'Fiskal', count: integrations.filter(i => i.category === 'fiscal').length },
        { id: 'loyalty', name: 'Loyallıq', count: integrations.filter(i => i.category === 'loyalty').length },
        { id: 'other', name: 'Digər', count: integrations.filter(i => i.category === 'other').length },
    ];

    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

    const filteredIntegrations = selectedCategory === 'all'
        ? integrations
        : integrations.filter(i => i.category === selectedCategory);

    const handleIntegrationClick = (integration: Integration) => {
        if (integration.requiresOwner && !isOwner) {
            alert('Bu inteqrasiyaya yalnız account owner daxil ola bilər.');
            return;
        }
        router.visit(integration.route);
    };

    const handleToggleModule = (moduleId: string, currentlyEnabled: boolean) => {
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

    // Handle double-click to view/configure integration
    const handleRowDoubleClick = (integration: Integration) => {
        handleIntegrationClick(integration);
    };

    // Handle bulk disable for multiple integrations
    const handleBulkDisable = (selectedIds: (string | number)[]) => {
        const confirmMessage = `${selectedIds.length} inteqrasiyanı deaktiv etmək istədiyinizə əminsiniz?`;

        if (confirm(confirmMessage)) {
            router.post('/integrations/bulk-disable', {
                ids: selectedIds
            }, {
                onError: (errors) => {
                    alert('Deaktiv etmə zamanı xəta baş verdi');
                },
                preserveScroll: true
            });
        }
    };

    // Handle bulk activate for multiple integrations
    const handleBulkActivate = (selectedIds: (string | number)[]) => {
        const confirmMessage = `${selectedIds.length} inteqrasiyanı aktiv etmək istədiyinizə əminsiniz?`;

        if (confirm(confirmMessage)) {
            router.post('/integrations/bulk-activate', {
                ids: selectedIds
            }, {
                onError: (errors) => {
                    alert('Aktiv etmə zamanı xəta baş verdi');
                },
                preserveScroll: true
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedIntegrations: Integration[]): BulkAction[] => {
        // If only ONE integration is selected, show individual actions
        if (selectedIds.length === 1 && selectedIntegrations.length === 1) {
            const integration = selectedIntegrations[0];

            const actions: BulkAction[] = [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => handleIntegrationClick(integration)
                },
                {
                    label: integration.status === 'not_configured' ? 'Quraşdır' : 'Parametrlər',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => handleIntegrationClick(integration)
                }
            ];

            // Add toggle actions for toggleable integrations
            if (['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'shop', 'wolt', 'yango', 'bolt'].includes(integration.id)) {
                if (integration.status === 'active') {
                    actions.push({
                        label: 'Deaktiv et',
                        icon: <TrashIcon className="w-4 h-4" />,
                        variant: 'danger' as const,
                        onClick: () => handleToggleModule(integration.id, true)
                    });
                } else if (integration.status === 'inactive') {
                    actions.push({
                        label: 'Aktiv et',
                        icon: <CheckCircleIcon className="w-4 h-4" />,
                        variant: 'success' as const,
                        onClick: () => handleToggleModule(integration.id, false)
                    });
                }
            }

            return actions;
        }

        // Multiple integrations selected - show bulk actions
        return [
            {
                label: 'Aktiv et',
                icon: <CheckCircleIcon className="w-4 h-4" />,
                variant: 'success' as const,
                onClick: handleBulkActivate
            },
            {
                label: 'Deaktiv et',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDisable
            }
        ];
    };

    // Brand color configurations for each integration
    const brandColors: Record<string, { gradient: string; iconColor: string; border?: string }> = {
        'shop': {
            gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            iconColor: 'text-white'
        },
        'wolt': {
            gradient: 'bg-gradient-to-br from-[#009DE0] to-[#0077B6]',
            iconColor: 'text-white'
        },
        'yango': {
            gradient: 'bg-gradient-to-br from-[#FFCC00] to-[#FF9900]',
            iconColor: 'text-gray-900'
        },
        'bolt': {
            gradient: 'bg-gradient-to-br from-[#34D186] to-[#14B068]',
            iconColor: 'text-white'
        },
        'sms': {
            gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
            iconColor: 'text-white'
        },
        'telegram': {
            gradient: 'bg-gradient-to-br from-[#2AABEE] to-[#229ED9]',
            iconColor: 'text-white'
        },
        'fiscal-printer': {
            gradient: 'bg-gradient-to-br from-emerald-500 to-green-600',
            iconColor: 'text-white'
        },
        'loyalty-program': {
            gradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
            iconColor: 'text-white'
        },
        'services': {
            gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
            iconColor: 'text-white'
        },
        'rent': {
            gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
            iconColor: 'text-white'
        },
        'discounts': {
            gradient: 'bg-gradient-to-br from-orange-500 to-red-600',
            iconColor: 'text-white'
        },
        'gift_cards': {
            gradient: 'bg-gradient-to-br from-pink-500 to-rose-600',
            iconColor: 'text-white'
        }
    };

    // Table columns configuration
    const tableColumns = [
        {
            key: 'icon',
            label: '',
            render: (integration: Integration) => {
                const IconComponent = integration.icon;
                const colors = brandColors[integration.id] || {
                    gradient: 'bg-gradient-to-br from-gray-400 to-gray-600',
                    iconColor: 'text-white'
                };

                return (
                    <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-lg ${colors.gradient} flex items-center justify-center shadow-sm`}>
                            <IconComponent className={`w-6 h-6 ${colors.iconColor}`} />
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'name',
            label: 'Ad',
            sortable: true,
            render: (integration: Integration) => (
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{integration.name}</h3>
                        {integration.requiresOwner && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                Owner
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Kateqoriya',
            render: (integration: Integration) => {
                const categoryLabels: Record<string, string> = {
                    'communication': 'Əlaqə',
                    'fiscal': 'Fiskal',
                    'loyalty': 'Loyallıq',
                    'payment': 'Ödəniş',
                    'business': 'Biznes',
                    'delivery': 'Çatdırılma',
                    'other': 'Digər'
                };
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                        {categoryLabels[integration.category] || integration.category}
                    </span>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (integration: Integration) => {
                if (integration.status === 'active') {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium text-emerald-700">Aktiv</span>
                        </span>
                    );
                } else if (integration.status === 'inactive') {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-xs font-medium text-gray-600">
                                {integration.isSimpleToggle ? 'Deaktiv' : 'Konfiqurasiya edilib'}
                            </span>
                        </span>
                    );
                } else {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-xs font-medium text-amber-700">Quraşdırılmayıb</span>
                        </span>
                    );
                }
            }
        },
        {
            key: 'features',
            label: 'Xüsusiyyətlər',
            render: (integration: Integration) => (
                <div className="flex flex-wrap gap-1.5">
                    {integration.features.slice(0, 3).map((feature, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-700"
                        >
                            <CheckCircleIcon className="w-3 h-3 text-gray-400" />
                            {feature}
                        </span>
                    ))}
                    {integration.features.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-500">
                            +{integration.features.length - 3}
                        </span>
                    )}
                </div>
            )
        }
    ];

    // Prepare data for SharedDataTable - it expects paginated data structure
    const paginatedData = {
        data: filteredIntegrations,
        links: [],
        current_page: 1,
        last_page: 1,
        total: filteredIntegrations.length,
        per_page: filteredIntegrations.length,
        from: 1,
        to: filteredIntegrations.length
    };

    // Category filter configuration
    const tableFilters = [
        {
            key: 'category',
            type: 'dropdown' as const,
            label: 'Kateqoriya',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: categories.map(cat => ({
                value: cat.id,
                label: `${cat.name} (${cat.count})`
            }))
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Tətbiqlər və İnteqrasiyalar" />

            <div className="w-full">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        İnteqrasiyalar
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Biznesinizi genişləndirmək və avtomatlaşdırmaq üçün xidmətləri və modulları idarə edin
                    </p>
                </div>

                {/* Info Banner */}
                <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Tətbiqlər və inteqrasiyalar sizin biznesinizi daha effektiv idarə etməyə kömək edir.
                                Hər bir xidməti aktivləşdirmək üçün uyğun parametrləri konfiqurasiya etməlisiniz.
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                                <strong className="font-semibold">Qeyd:</strong> Bəzi inteqrasiyalar yalnız account owner tərəfindən idarə oluna bilər.
                            </p>
                        </div>
                    </div>
                </div>

                <SharedDataTable
                    data={paginatedData as any}
                    columns={tableColumns as any}
                    selectable={true}
                    bulkActions={getBulkActions}
                    filters={tableFilters}
                    emptyState={{
                        icon: <Cog6ToothIcon className="w-12 h-12" />,
                        title: 'Heç bir inteqrasiya tapılmadı',
                        description: 'Bu kateqoriyada heç bir inteqrasiya yoxdur.'
                    }}
                    fullWidth={true}
                    dense={false}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={(integration: Integration) => {
                        const isDisabled = integration.requiresOwner && !isOwner;
                        return `cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                            isDisabled ? 'opacity-60' : ''
                        }`;
                    }}
                />
            </div>
        </AuthenticatedLayout>
    );
}
