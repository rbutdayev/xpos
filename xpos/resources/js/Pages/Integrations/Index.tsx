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
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'communication' | 'fiscal' | 'loyalty' | 'payment' | 'business' | 'delivery' | 'other';
    status: 'active' | 'inactive';
    route: string;
    color: string;
    features: string[];
    requiresOwner?: boolean;
    isSimpleToggle?: boolean;
    requiresConfiguration?: boolean;
    disabled?: boolean;
}

interface DependencyStatus {
    met: boolean;
    missing: string[];
}

interface ModulePrice {
    module_id: string;
    price: number;
    is_paid: boolean;
}

interface IntegrationsProps extends PageProps {
    smsConfigured: boolean;
    smsEnabled: boolean;
    telegramConfigured: boolean;
    telegramEnabled: boolean;
    fiscalPrinterConfigured: boolean;
    fiscalPrinterEnabled: boolean;
    loyaltyProgramConfigured: boolean;
    loyaltyModuleEnabled: boolean;
    shopEnabled: boolean;
    shopConfigured: boolean;
    shopUrl: string | null;
    servicesModuleEnabled: boolean;
    rentModuleEnabled: boolean;
    discountsModuleEnabled: boolean;
    giftCardsModuleEnabled: boolean;
    expeditorModuleEnabled: boolean;
    attendanceModuleEnabled: boolean;
    woltEnabled?: boolean;
    yangoEnabled?: boolean;
    boltEnabled?: boolean;
    dependencyStatus: Record<string, DependencyStatus>;
    modulePrices?: Record<string, number>;
    confirmationRequired?: {
        module_name: string;
        module_price: number;
        prorated_amount: number;
        new_monthly_total: number;
        days_used: number;
        days_in_month: number;
    };
}

export default function Index({
    auth,
    smsConfigured,
    smsEnabled,
    telegramConfigured,
    telegramEnabled,
    fiscalPrinterConfigured,
    fiscalPrinterEnabled,
    loyaltyProgramConfigured,
    loyaltyModuleEnabled,
    shopEnabled,
    shopConfigured,
    shopUrl,
    servicesModuleEnabled,
    rentModuleEnabled,
    discountsModuleEnabled,
    giftCardsModuleEnabled,
    expeditorModuleEnabled,
    attendanceModuleEnabled,
    woltEnabled = false,
    yangoEnabled = false,
    boltEnabled = false,
    dependencyStatus = {},
    modulePrices = {},
    confirmationRequired
}: IntegrationsProps) {
    const isOwner = auth.user.role === 'account_owner';
    const [showConfirmationModal, setShowConfirmationModal] = React.useState(false);
    const [showErrorModal, setShowErrorModal] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string>('');
    const [pendingModuleToggle, setPendingModuleToggle] = React.useState<{
        moduleId: string;
        moduleName: string;
        currentlyEnabled: boolean;
        price?: number;
        proratedAmount?: number;
        newMonthlyTotal?: number;
        daysUsed?: number;
        daysInMonth?: number;
    } | null>(null);

    // Check if there's a confirmation required from the backend
    React.useEffect(() => {
        if (confirmationRequired) {
            const integration = integrations.find(i => i.id === confirmationRequired.module_name);
            setPendingModuleToggle({
                moduleId: confirmationRequired.module_name,
                moduleName: integration?.name || confirmationRequired.module_name,
                currentlyEnabled: false, // We're enabling, that's why we need confirmation
                price: confirmationRequired.module_price,
                proratedAmount: confirmationRequired.prorated_amount,
                newMonthlyTotal: confirmationRequired.new_monthly_total,
                daysUsed: confirmationRequired.days_used,
                daysInMonth: confirmationRequired.days_in_month,
            });
            setShowConfirmationModal(true);
        }
    }, [confirmationRequired]);

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
            status: shopEnabled ? 'active' : 'inactive',
            route: '/shop-settings',
            color: 'blue',
            features: [
                'Online mağaza',
                'Məhsul kataloqu',
                'Online sifarişlər',
                'Ödəniş inteqrasiyası'
            ],
            isSimpleToggle: true,
            requiresConfiguration: shopEnabled && !shopConfigured
        },
        {
            id: 'wolt',
            name: 'Wolt Food Delivery',
            description: 'Wolt platformasından sifarişləri avtomatik qəbul edin',
            icon: TruckIcon,
            category: 'delivery',
            status: 'inactive',
            route: '/integrations/wolt',
            color: 'violet',
            features: [
                'Avtomatik sifariş qəbulu',
                'Status sinxronizasiyası',
                'Anbar seçimi',
                'Filial təyini'
            ],
            disabled: true
        },
        {
            id: 'yango',
            name: 'Yango Food Delivery',
            description: 'Yango platformasından sifarişləri avtomatik qəbul edin',
            icon: TruckIcon,
            category: 'delivery',
            status: 'inactive',
            route: '/integrations/yango',
            color: 'yellow',
            features: [
                'Avtomatik sifariş qəbulu',
                'Status sinxronizasiyası',
                'Anbar seçimi',
                'Filial təyini'
            ],
            disabled: true
        },
        {
            id: 'bolt',
            name: 'Bolt Food Delivery',
            description: 'Bolt Food platformasından sifarişləri avtomatik qəbul edin',
            icon: TruckIcon,
            category: 'delivery',
            status: 'inactive',
            route: '/integrations/bolt',
            color: 'green',
            features: [
                'Avtomatik sifariş qəbulu',
                'Status sinxronizasiyası',
                'Anbar seçimi',
                'Filial təyini'
            ],
            disabled: true
        },
        {
            id: 'sms',
            name: 'SMS Xidməti',
            description: 'Müştərilərə SMS göndərin, avtomatik bildirişlər və kampaniyalar',
            icon: PaperAirplaneIcon,
            category: 'communication',
            status: smsEnabled ? 'active' : 'inactive',
            route: '/integrations/sms',
            color: 'blue',
            features: [
                'Toplu SMS göndərmə',
                'Müştəri bildirişləri',
                'Avtomatik mesajlar',
                'SMS statistikası'
            ],
            isSimpleToggle: true,
            requiresConfiguration: smsEnabled && !smsConfigured
        },
        {
            id: 'telegram',
            name: 'Telegram Bot',
            description: 'Telegram vasitəsilə bildirişlər və əlaqə',
            icon: ChatBubbleLeftRightIcon,
            category: 'communication',
            status: telegramEnabled ? 'active' : 'inactive',
            route: '/integrations/telegram',
            color: 'sky',
            features: [
                'Real-time bildirişlər',
                'Satış məlumatları',
                'Stok xəbərdarlıqları',
                'Müştəri sorğuları'
            ],
            isSimpleToggle: true,
            requiresConfiguration: telegramEnabled && !telegramConfigured
        },
        {
            id: 'fiscal-printer',
            name: 'Fiskal Printer (E-Kassa)',
            description: 'Vergilər Nazirliyinin tələb etdiyi elektron kassa inteqrasiyası',
            icon: ReceiptPercentIcon,
            category: 'fiscal',
            status: fiscalPrinterEnabled ? 'active' : 'inactive',
            route: '/fiscal-printer',
            color: 'emerald',
            features: [
                '5 provayder dəstəyi',
                'Avtomatik fiskal çek',
                'Lokal şəbəkə əlaqəsi',
                'Audit log'
            ],
            requiresOwner: true,
            isSimpleToggle: true,
            requiresConfiguration: fiscalPrinterEnabled && !fiscalPrinterConfigured
        },
        {
            id: 'loyalty',
            name: 'Loyallıq Proqramı',
            description: 'Müştərilərə bal qazandırın və sadiq müştərilər yaradın',
            icon: GiftIcon,
            category: 'loyalty',
            status: loyaltyModuleEnabled ? 'active' : 'inactive',
            route: '/loyalty-program',
            color: 'purple',
            features: [
                'Avtomatik bal qazanma',
                'Endirim üçün bal istifadəsi',
                'Bal bitmə tarixi',
                'Müştəri loyallıq hesabatı'
            ],
            isSimpleToggle: true,
            requiresConfiguration: loyaltyModuleEnabled && !loyaltyProgramConfigured
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
        },
        {
            id: 'attendance',
            name: 'İşçi Davamiyyəti',
            description: 'İşçilərin işə gəlmə və gedişini GPS ilə izləyin',
            icon: ClockIcon,
            category: 'business',
            status: attendanceModuleEnabled ? 'active' : 'inactive',
            route: '/attendance/reports',
            color: 'blue',
            features: [
                'QR kod ilə giriş/çıxış',
                'GPS məkan yoxlaması',
                'Avtomatik hesabatlar',
                'İş saatı hesablaması'
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
        // Prevent clicks on disabled integrations
        if (integration.disabled) {
            setErrorMessage('Bu xidmət hələ mövcud deyil. Tezliklə əlavə ediləcək.');
            setShowErrorModal(true);
            return;
        }

        // Check permissions first
        if (integration.requiresOwner && !isOwner) {
            setErrorMessage('Bu inteqrasiyaya yalnız account owner daxil ola bilər.');
            setShowErrorModal(true);
            return;
        }

        // For simple toggle modules without dedicated settings pages, show message
        const modulesWithoutSettings = ['services', 'rent', 'discounts'];
        if (modulesWithoutSettings.includes(integration.id)) {
            if (integration.status === 'inactive') {
                setErrorMessage('Modul aktiv deyil. Əvvəlcə modulu aktivləşdirin.');
                setShowErrorModal(true);
            } else {
                setErrorMessage('Bu modul aktivdir və xüsusi parametr səhifəsi yoxdur.');
                setShowErrorModal(true);
            }
            return;
        }

        // Navigate to module settings/configuration page
        router.visit(integration.route);
    };

    const handleToggleModule = (moduleId: string, currentlyEnabled: boolean) => {
        console.log('handleToggleModule called:', { moduleId, currentlyEnabled });

        const integration = integrations.find(i => i.id === moduleId);

        if (!currentlyEnabled) {
            const { canEnable, message } = canEnableModule(moduleId);
            console.log('Dependency check:', { canEnable, message });
            if (!canEnable) {
                setErrorMessage(message || 'Xəta baş verdi');
                setShowErrorModal(true);
                return;
            }
        }

        // Get module name for the modal
        const moduleName = integration?.name || moduleId;

        // Get pricing info if available
        const modulePrice = modulePrices?.[moduleId];

        console.log('Sending toggle request:', { moduleId, confirmed: false, modulePrice });

        // First send with confirmed: false to check if confirmation is needed
        router.post('/settings/toggle-module', {
            module: moduleId,
            confirmed: false
        }, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                console.log('Toggle request successful');
                // If backend returns confirmation_required, the useEffect will handle it
                // Otherwise, the toggle was successful
            },
            onError: (errors: any) => {
                console.error('Toggle request error:', errors);
            },
        });
    };

    const handleConfirmToggle = () => {
        if (!pendingModuleToggle) return;

        router.post('/settings/toggle-module', {
            module: pendingModuleToggle.moduleId,
            confirmed: true
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowConfirmationModal(false);
                setPendingModuleToggle(null);
            },
        });
    };

    const handleCancelToggle = () => {
        setShowConfirmationModal(false);
        setPendingModuleToggle(null);
    };

    // Handle double-click to view/configure integration
    const handleRowDoubleClick = (integration: Integration) => {
        // Prevent double-click on disabled integrations
        if (integration.disabled) {
            setErrorMessage('Bu xidmət hələ mövcud deyil. Tezliklə əlavə ediləcək.');
            setShowErrorModal(true);
            return;
        }

        // Prevent double-click on unconfigured integrations (regardless of active/inactive)
        if (integration.requiresConfiguration) {
            setErrorMessage('Modul quraşdırılmayıb. Əvvəlcə "Quraşdır" düyməsinə klikləyin.');
            setShowErrorModal(true);
            return;
        }

        // Prevent double-click on INACTIVE but configured integrations
        if (integration.status === 'inactive') {
            setErrorMessage('Modul aktiv deyil. Əvvəlcə modulu aktivləşdirin.');
            setShowErrorModal(true);
            return;
        }

        // Allow double-click only on ACTIVE and CONFIGURED integrations
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
                    setErrorMessage('Deaktiv etmə zamanı xəta baş verdi');
                    setShowErrorModal(true);
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
                    setErrorMessage('Aktiv etmə zamanı xəta baş verdi');
                    setShowErrorModal(true);
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

            // Disabled integrations get no actions
            if (integration.disabled) {
                return [];
            }

            const actions: BulkAction[] = [];

            // Check if module requires configuration first (regardless of active/inactive status)
            if (integration.requiresConfiguration) {
                // Module not configured yet - show Configure button only
                actions.push({
                    label: 'Quraşdır',
                    icon: <Cog6ToothIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => handleIntegrationClick(integration)
                });

                // If it's an active but unconfigured module, also show Deactivate button
                if (integration.status === 'active' && ['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'attendance', 'shop', 'wolt', 'yango', 'bolt', 'fiscal-printer', 'sms', 'telegram', 'loyalty'].includes(integration.id)) {
                    actions.push({
                        label: 'Deaktiv et',
                        icon: <TrashIcon className="w-4 h-4" />,
                        variant: 'danger' as const,
                        onClick: () => {
                            console.log('Deaktiv et clicked for:', integration.id);
                            handleToggleModule(integration.id, true);
                        }
                    });
                }
            } else if (integration.status === 'inactive') {
                // INACTIVE but configured: Show Activate button
                if (['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'attendance', 'shop', 'wolt', 'yango', 'bolt', 'fiscal-printer', 'sms', 'telegram', 'loyalty'].includes(integration.id)) {
                    actions.push({
                        label: 'Aktiv et',
                        icon: <CheckCircleIcon className="w-4 h-4" />,
                        variant: 'success' as const,
                        onClick: () => {
                            console.log('Aktiv et clicked for:', integration.id);
                            handleToggleModule(integration.id, false);
                        }
                    });
                }
            } else {
                // ACTIVE and CONFIGURED: Show View, Settings, and Deactivate buttons
                actions.push(
                    {
                        label: 'Bax',
                        icon: <EyeIcon className="w-4 h-4" />,
                        variant: 'view' as const,
                        onClick: () => handleIntegrationClick(integration)
                    },
                    {
                        label: 'Parametrlər',
                        icon: <PencilIcon className="w-4 h-4" />,
                        variant: 'edit' as const,
                        onClick: () => handleIntegrationClick(integration)
                    }
                );

                // Add deactivate button for toggleable active modules
                if (['services', 'rent', 'discounts', 'gift_cards', 'expeditor', 'attendance', 'shop', 'wolt', 'yango', 'bolt', 'fiscal-printer', 'sms', 'telegram', 'loyalty'].includes(integration.id)) {
                    actions.push({
                        label: 'Deaktiv et',
                        icon: <TrashIcon className="w-4 h-4" />,
                        variant: 'danger' as const,
                        onClick: () => {
                            console.log('Deaktiv et clicked for:', integration.id);
                            handleToggleModule(integration.id, true);
                        }
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
            gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
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
            gradient: 'bg-gradient-to-br from-slate-400 to-slate-700',
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
            gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
            iconColor: 'text-white'
        },
        'rent': {
            gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
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
                        <div className={`w-12 h-12 rounded-lg ${integration.disabled ? 'bg-gray-200' : colors.gradient} flex items-center justify-center shadow-sm ${integration.disabled ? 'opacity-50' : ''}`}>
                            <IconComponent className={`w-6 h-6 ${integration.disabled ? 'text-gray-400' : colors.iconColor}`} />
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'name',
            label: 'Ad',
            sortable: true,
            render: (integration: Integration) => {
                const modulePrice = modulePrices?.[integration.id];
                const isPaidModule = modulePrice !== undefined && modulePrice > 0;

                return (
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-base font-semibold ${integration.disabled ? 'text-gray-400' : 'text-gray-900'}`}>{integration.name}</h3>
                            {integration.disabled && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                    Tezliklə
                                </span>
                            )}
                            {integration.requiresOwner && !integration.disabled && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    Owner
                                </span>
                            )}
                            {integration.requiresConfiguration && !integration.disabled && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                    Quraşdırılmayıb
                                </span>
                            )}
                            {isPaidModule && !integration.disabled && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                    {modulePrice} ₼/ay
                                </span>
                            )}
                            {modulePrice !== undefined && modulePrice === 0 && !integration.disabled && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                    Pulsuz
                                </span>
                            )}
                        </div>
                        <p className={`text-sm ${integration.disabled ? 'text-gray-400' : 'text-gray-600'}`}>{integration.description}</p>
                    </div>
                );
            }
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
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium ${integration.disabled ? 'text-gray-400 opacity-50' : 'text-gray-700'}`}>
                        {categoryLabels[integration.category] || integration.category}
                    </span>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (integration: Integration) => {
                if (integration.disabled) {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 opacity-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            <span className="text-xs font-medium text-gray-400">Deaktiv</span>
                        </span>
                    );
                }
                if (integration.status === 'active') {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium text-emerald-700">Aktiv</span>
                        </span>
                    );
                } else {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-xs font-medium text-gray-600">Deaktiv</span>
                        </span>
                    );
                }
            }
        },
        {
            key: 'features',
            label: 'Xüsusiyyətlər',
            render: (integration: Integration) => (
                <div className={`flex flex-wrap gap-1.5 ${integration.disabled ? 'opacity-50' : ''}`}>
                    {integration.features.slice(0, 3).map((feature, index) => (
                        <span
                            key={index}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-xs ${integration.disabled ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                            <CheckCircleIcon className={`w-3 h-3 ${integration.disabled ? 'text-gray-300' : 'text-gray-400'}`} />
                            {feature}
                        </span>
                    ))}
                    {integration.features.length > 3 && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-xs ${integration.disabled ? 'text-gray-400' : 'text-gray-500'}`}>
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
                <div className="mb-6 bg-slate-50/50 border border-slate-100 rounded-lg p-4">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
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
                        if (integration.disabled) {
                            return 'opacity-60 cursor-not-allowed';
                        }
                        const isDisabled = integration.requiresOwner && !isOwner;
                        return `cursor-pointer hover:bg-slate-50 transition-all duration-200 ${
                            isDisabled ? 'opacity-60' : ''
                        }`;
                    }}
                />
            </div>

            {/* Confirmation Modal */}
            {showConfirmationModal && pendingModuleToggle && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Modul Aktivləşdirmə Təsdiqi
                            </h3>

                            <div className="mb-4">
                                <p className="text-sm text-gray-700 mb-3">
                                    {pendingModuleToggle.currentlyEnabled
                                        ? `${pendingModuleToggle.moduleName} modulunu deaktiv etmək istədiyinizə əminsiniz?`
                                        : 'Bu modulun aktivləşdirilməsi gələcək aydan aylıq ödənişinizə əlavə olunacaq.'
                                    }
                                </p>

                                {pendingModuleToggle.price !== undefined && pendingModuleToggle.price > 0 ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                        <p className="text-sm font-medium text-green-900">
                                            🎉 İlk ay PULSUZ!
                                        </p>
                                        <div className="space-y-2 text-sm text-green-800">
                                            <div className="flex justify-between">
                                                <span>Bu ay:</span>
                                                <strong className="text-green-700">PULSUZ (0 ₼)</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Gələcək aydan:</span>
                                                <strong>{pendingModuleToggle.price.toFixed(2)} ₼/ay</strong>
                                            </div>
                                            {pendingModuleToggle.newMonthlyTotal !== undefined && (
                                                <div className="flex justify-between pt-2 border-t border-green-300">
                                                    <span className="font-semibold">Yeni aylıq ödəniş (gələcək aydan):</span>
                                                    <strong className="text-green-900">{pendingModuleToggle.newMonthlyTotal.toFixed(2)} ₼</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-sm text-green-800">
                                            Bu modul pulsuz
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <SecondaryButton
                                    type="button"
                                    onClick={handleCancelToggle}
                                >
                                    Ləğv et
                                </SecondaryButton>
                                <PrimaryButton
                                    type="button"
                                    onClick={handleConfirmToggle}
                                >
                                    {pendingModuleToggle.currentlyEnabled
                                        ? 'Təsdiq et və Deaktiv et'
                                        : 'Təsdiq et və Aktivləşdir'
                                    }
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Xəta
                                </h3>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-700">
                                    {errorMessage}
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <PrimaryButton
                                    type="button"
                                    onClick={() => setShowErrorModal(false)}
                                >
                                    Bağla
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
