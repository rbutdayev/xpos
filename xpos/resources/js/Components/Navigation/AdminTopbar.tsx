import { Link } from '@inertiajs/react';
import {
    BuildingOffice2Icon,
    UsersIcon,
    Cog6ToothIcon,
    PuzzlePieceIcon,
    QueueListIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    PrinterIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useModuleAccess } from '@/Hooks/useModuleAccess';

export default function AdminTopbar() {
    const { t } = useTranslation('common');
    const { canAccessModule } = useModuleAccess();

    const isActive = (routeName: string) => {
        const activeRoute = route().current() || '';
        return activeRoute.includes(routeName);
    };

    const navItems = [
        {
            href: route('companies.index'),
            icon: BuildingOffice2Icon,
            label: 'Şirkət',
            isActive: isActive('companies')
        },
        {
            href: route('branches.index'),
            icon: BuildingOffice2Icon,
            label: 'Filiallar',
            isActive: isActive('branches')
        },
        {
            href: route('users.index'),
            icon: UsersIcon,
            label: t('navigation.users'),
            isActive: isActive('users') && !isActive('customers')
        },
        {
            href: route('settings.index'),
            icon: Cog6ToothIcon,
            label: t('navigation.system_settings'),
            isActive: isActive('settings')
        },
        {
            href: route('integrations.index'),
            icon: PuzzlePieceIcon,
            label: t('navigation.integrations'),
            isActive: isActive('integrations')
        },
        {
            href: route('receipt-templates.index'),
            icon: DocumentTextIcon,
            label: t('navigation.receipt_templates'),
            isActive: isActive('receipt-templates')
        },
        {
            href: route('printer-configs.index'),
            icon: PrinterIcon,
            label: t('navigation.printer_configs'),
            isActive: isActive('printer-configs')
        },
        ...(canAccessModule('fiscal_printer') ? [{
            href: route('fiscal-printer-jobs.index'),
            icon: QueueListIcon,
            label: t('navigation.fiscal_printer_queue'),
            isActive: isActive('fiscal-printer-jobs')
        }] : []),
        ...(canAccessModule('sms') ? [{
            href: route('sms.logs'),
            icon: ChatBubbleLeftRightIcon,
            label: t('navigation.sms_logs'),
            isActive: isActive('sms.logs')
        }] : []),
        ...(canAccessModule('telegram') ? [{
            href: route('telegram.logs'),
            icon: ChatBubbleLeftRightIcon,
            label: t('navigation.telegram_logs'),
            isActive: isActive('telegram.logs')
        }] : []),
        {
            href: route('audit-logs.index'),
            icon: ClockIcon,
            label: t('navigation.audit_logs'),
            isActive: isActive('audit-logs')
        },
    ];

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
            <div className="px-4 sm:px-6 lg:px-8">
                <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap
                                    ${item.isActive
                                        ? 'bg-slate-50 text-slate-700 border border-slate-200'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${item.isActive ? 'text-slate-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
