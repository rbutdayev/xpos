import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface CommandItem {
    id: string;
    name: string;
    description?: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    category: 'navigation' | 'action' | 'recent';
    keywords?: string[];
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const { t } = useTranslation('common');
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Get all available commands (you can expand this)
    const allCommands: CommandItem[] = useMemo(() => [
        // Navigation items - Main
        { id: 'dashboard', name: t('navigation.dashboard'), href: '/dashboard', category: 'navigation', keywords: ['home', 'главная', 'ana'] },
        { id: 'pos', name: t('navigation.pos_sales'), href: route('pos.index'), category: 'navigation', keywords: ['sell', 'satış', 'kassa'] },
        { id: 'touch-pos', name: t('navigation.touch_pos'), href: route('pos.touch'), category: 'navigation', keywords: ['tablet', 'touch', 'sensor'] },
        { id: 'sales', name: t('navigation.sales_list'), href: '/sales', category: 'navigation', keywords: ['satış', 'list', 'siyahı'] },
        { id: 'returns', name: t('navigation.returns'), href: route('returns.index'), category: 'navigation', keywords: ['refund', 'qaytarma', 'iade'] },
        { id: 'shift-management', name: t('navigation.shift_management'), href: route('shift-management.index'), category: 'navigation', keywords: ['shift', 'növbə', 'smena'] },

        // Products & Inventory
        { id: 'products', name: t('navigation.products'), href: '/products', category: 'navigation', keywords: ['məhsul', 'items', 'tovar'] },
        { id: 'categories', name: t('navigation.categories'), href: route('categories.index'), category: 'navigation', keywords: ['kateqoriya', 'category'] },
        { id: 'bulk-create', name: t('navigation.bulk_create'), href: route('products.bulk-create'), category: 'navigation', keywords: ['toplu', 'bulk', 'массовое'] },
        { id: 'discounts', name: t('navigation.discounts'), href: route('products.discounts'), category: 'navigation', keywords: ['endirim', 'discount', 'скидка'] },
        { id: 'product-stock', name: t('navigation.product_stock'), href: route('product-stock.index'), category: 'navigation', keywords: ['stok', 'stock', 'запас'] },
        { id: 'inventory', name: t('navigation.inventory'), href: '/inventory', category: 'navigation', keywords: ['stock', 'ehtiyat', 'inventar'] },
        { id: 'alerts', name: t('navigation.alerts'), href: route('alerts.index'), category: 'navigation', keywords: ['xəbərdarlıq', 'warning', 'уведомления'] },
        { id: 'product-history', name: t('navigation.product_history'), href: route('product-activity.timeline'), category: 'navigation', keywords: ['tarixçə', 'history', 'история'] },

        // Customers
        { id: 'customers', name: t('navigation.customers'), href: '/customers', category: 'navigation', keywords: ['müştəri', 'client', 'клиент'] },
        { id: 'customer-items', name: t('navigation.tailor_service'), href: route('customer-items.index'), category: 'navigation', keywords: ['dərzi', 'tailor', 'портной'] },
        { id: 'gift-cards', name: t('navigation.gift_cards'), href: route('gift-cards.index'), category: 'navigation', keywords: ['hədiyyə', 'gift', 'подарок'] },
        { id: 'online-orders', name: t('navigation.online_orders'), href: route('online-orders.index'), category: 'navigation', keywords: ['online', 'интернет'] },

        // Warehouse Management
        { id: 'warehouses', name: t('navigation.warehouses'), href: route('warehouses.index'), category: 'navigation', keywords: ['anbar', 'storage', 'склад'] },
        { id: 'goods-receipts', name: t('navigation.goods_receipt'), href: '/goods-receipts', category: 'navigation', keywords: ['qəbul', 'receipt', 'приход'] },
        { id: 'suppliers', name: t('navigation.suppliers'), href: '/suppliers', category: 'navigation', keywords: ['təchizatçı', 'vendor', 'поставщик'] },
        { id: 'stock-movements', name: t('navigation.stock_movements'), href: route('stock-movements.index'), category: 'navigation', keywords: ['hərəkət', 'movement', 'движение'] },
        { id: 'transfers', name: t('navigation.transfers'), href: route('warehouse-transfers.index'), category: 'navigation', keywords: ['transfer', 'köçürmə', 'перемещение'] },
        { id: 'product-returns', name: t('navigation.product_returns'), href: route('product-returns.index'), category: 'navigation', keywords: ['qaytarma', 'return', 'возврат'] },

        // Finance & Reports
        { id: 'expenses', name: t('navigation.expenses'), href: '/expenses', category: 'navigation', keywords: ['xərc', 'costs', 'расход'] },
        { id: 'expense-categories', name: t('navigation.expense_categories'), href: route('expense-categories.index'), category: 'navigation', keywords: ['kateqoriya', 'category'] },
        { id: 'employee-salaries', name: t('navigation.employee_salaries'), href: route('employee-salaries.index'), category: 'navigation', keywords: ['maaş', 'salary', 'зарплата'] },
        { id: 'customer-credits', name: 'Müştəri Krediti', href: route('credits.customer'), category: 'navigation', keywords: ['kredit', 'credit', 'долг'] },
        { id: 'supplier-credits', name: 'Təchizatçı Krediti', href: route('credits.supplier'), category: 'navigation', keywords: ['kredit', 'credit', 'долг'] },
        { id: 'reports', name: t('navigation.report_center'), href: '/reports', category: 'navigation', keywords: ['hesabat', 'analytics', 'отчет'] },

        // Settings & Administration
        { id: 'settings', name: t('navigation.settings'), href: '/settings', category: 'navigation', keywords: ['ayarlar', 'config', 'настройки'] },
        { id: 'branches', name: t('navigation.branches'), href: route('branches.index'), category: 'navigation', keywords: ['filial', 'branch', 'филиал'] },
        { id: 'users', name: t('navigation.users'), href: '/users', category: 'navigation', keywords: ['istifadəçi', 'employees', 'пользователи'] },
        { id: 'printer-configs', name: t('navigation.printer_configs'), href: route('printer-configs.index'), category: 'navigation', keywords: ['printer', 'çap', 'принтер'] },
        { id: 'receipt-templates', name: t('navigation.receipt_templates'), href: route('receipt-templates.index'), category: 'navigation', keywords: ['şablon', 'template', 'шаблон'] },
        { id: 'audit-logs', name: t('navigation.audit_logs'), href: route('audit-logs.index'), category: 'navigation', keywords: ['log', 'jurnal', 'журнал'] },

        // Integrations & SMS
        { id: 'integrations', name: t('navigation.integrations'), href: route('integrations.index'), category: 'navigation', keywords: ['tətbiq', 'integration', 'интеграция'] },
        { id: 'sms', name: t('navigation.sms'), href: route('sms.index'), category: 'navigation', keywords: ['sms', 'mesaj', 'сообщение'] },
        { id: 'send-sms', name: t('navigation.send_sms'), href: route('sms.send-page'), category: 'navigation', keywords: ['göndər', 'send', 'отправить'] },
        { id: 'sms-logs', name: t('navigation.sms_logs'), href: route('sms.logs'), category: 'navigation', keywords: ['log', 'jurnal', 'журнал'] },

        // Quick Actions
        { id: 'new-sale', name: t('actions.create_sale'), href: route('pos.index'), category: 'action', keywords: ['new', 'yeni', 'create', 'новый'] },
        { id: 'new-product', name: t('actions.create_product'), href: route('products.create'), category: 'action', keywords: ['add', 'əlavə', 'добавить'] },
        { id: 'new-customer', name: t('actions.create_customer'), href: route('customers.create'), category: 'action', keywords: ['add', 'yeni', 'новый'] },
        { id: 'new-expense', name: t('actions.create_expense'), href: route('expenses.create'), category: 'action', keywords: ['add', 'xərc', 'расход'] },
    ], [t]);

    // Filter commands based on query
    const filteredCommands = useMemo(() => {
        if (!query) return allCommands.filter(cmd => cmd.category === 'navigation').slice(0, 8);

        const lowerQuery = query.toLowerCase();
        return allCommands.filter(cmd => {
            const nameMatch = cmd.name.toLowerCase().includes(lowerQuery);
            const keywordMatch = cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery));
            return nameMatch || keywordMatch;
        }).slice(0, 10);
    }, [query, allCommands]);

    // Reset selection when filtered results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = filteredCommands[selectedIndex];
                if (selected) {
                    router.visit(selected.href);
                    onClose();
                    setQuery('');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    const handleSelect = (command: CommandItem) => {
        router.visit(command.href);
        onClose();
        setQuery('');
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-200 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
                            {/* Search Input */}
                            <div className="relative">
                                <MagnifyingGlassIcon
                                    className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                    placeholder={t('command_palette.search_placeholder')}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoFocus
                                />
                                <div className="absolute right-4 top-3 text-xs text-gray-400">
                                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">ESC</kbd>
                                </div>
                            </div>

                            {/* Results */}
                            {filteredCommands.length > 0 ? (
                                <ul className="max-h-96 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800">
                                    {filteredCommands.map((command, index) => (
                                        <li
                                            key={command.id}
                                            className={`cursor-pointer select-none px-4 py-3 ${
                                                index === selectedIndex
                                                    ? 'bg-slate-700 text-white'
                                                    : 'hover:bg-gray-100'
                                            }`}
                                            onClick={() => handleSelect(command)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {command.icon && (
                                                        <command.icon className={`h-5 w-5 ${index === selectedIndex ? 'text-white' : 'text-gray-400'}`} />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{command.name}</div>
                                                        {command.description && (
                                                            <div className={`text-xs ${index === selectedIndex ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                {command.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {command.category === 'action' && (
                                                    <span className={`text-xs ${index === selectedIndex ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {t('command_palette.action')}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-6 py-14 text-center text-sm text-gray-500">
                                    <MagnifyingGlassIcon className="mx-auto h-6 w-6 text-gray-400" />
                                    <p className="mt-4">{t('command_palette.no_results')}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex flex-wrap items-center bg-gray-50 px-4 py-2.5 text-xs text-gray-700">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↑↓</kbd>
                                        {t('command_palette.navigate')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↵</kbd>
                                        {t('command_palette.select')}
                                    </span>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
