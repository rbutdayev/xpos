import { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action, BulkAction } from '@/Components/SharedDataTable';
import CreateExpenseModal from '@/Components/Modals/CreateExpenseModal';
import PaySupplierCreditModal from '@/Components/Modals/PaySupplierCreditModal';
import CreateSupplierPaymentModal from '@/Components/Modals/CreateSupplierPaymentModal';
import PayGoodsReceiptModal from '@/Components/Modals/PayGoodsReceiptModal';
import { GoodsReceipt } from '@/types';
import {
    CurrencyDollarIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronRightIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface Expense {
    expense_id: number | null;
    description: string;
    amount: number;
    remaining_amount?: number;
    expense_date: string;
    due_date?: string;
    reference_number: string;
    payment_method: string;
    status?: string;
    payment_status?: string;
    type?: 'supplier_credit' | 'goods_receipt';
    entry_type?: 'automatic' | 'manual' | 'migration';
    old_system_reference?: string;
    supplier_credit_id?: number;
    goods_receipt_id?: number;
    goods_receipt_data?: GoodsReceipt;
    receipt_file_path: string | null;
    category: {
        category_id: number;
        name: string;
        type: string;
    } | null;
    branch: {
        id: number;
        name: string;
    } | null;
    supplier: {
        id: number;
        name: string;
    } | null;
    supplier_id?: number;
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface SupplierCredit {
    supplier_credit_id: number;
    reference_number: string;
    description: string;
    amount: number;
    remaining_amount: number;
    entry_type?: 'automatic' | 'manual' | 'migration';
    old_system_reference?: string;
    supplier: {
        id: number;
        name: string;
    };
}

interface Supplier {
    id: number;
    name: string;
    company?: string | null;
}

interface Props {
    expenses: {
        data: Expense[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    categories: Array<{
        category_id: number;
        name: string;
        type: string;
        parent?: {
            category_id: number;
            name: string;
        };
    }>;
    branches: Array<{
        id: number;
        name: string;
    }>;
    paymentMethods: Record<string, string>;
    suppliers: Supplier[];
    unpaidGoodsReceipts: GoodsReceipt[];
    filters: {
        search?: string;
        category_id?: string;
        branch_id?: string;
        payment_method?: string;
        date_from?: string;
        date_to?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: Record<string, string>;
}

export default function Index({ expenses, categories, branches, paymentMethods, suppliers, unpaidGoodsReceipts, filters, flash, errors }: Props) {
    const { t } = useTranslation(['expenses', 'common']);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(filters.payment_method || '');
    const [showCreateExpenseModal, setShowCreateExpenseModal] = useState(false);
    const [showPaySupplierCreditModal, setShowPaySupplierCreditModal] = useState(false);
    const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState(false);
    const [showPayGoodsReceiptModal, setShowPayGoodsReceiptModal] = useState(false);
    const [selectedSupplierCredit, setSelectedSupplierCredit] = useState<SupplierCredit | null>(null);
    const [selectedGoodsReceipt, setSelectedGoodsReceipt] = useState<GoodsReceipt | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
    const [isMobile, setIsMobile] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Toggle group expansion
    const toggleGroup = (supplierCreditId: number) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(supplierCreditId)) {
                newSet.delete(supplierCreditId);
            } else {
                newSet.add(supplierCreditId);
            }
            return newSet;
        });
    };

    // Group expenses by supplier_credit_id
    // Main expenses (SupplierCredits with remaining_amount) will have partial payments grouped under them
    const groupedExpensesData = () => {
        const groups: Array<{
            main: Expense;
            children: Expense[];
        }> = [];

        // Use separate sets to avoid collision between expense_id and supplier_credit_id
        const processedExpenseIds = new Set<number>();
        const processedSupplierCreditIds = new Set<number>();

        // FIRST: Find all SupplierCredits (main records with remaining_amount)
        const supplierCredits = expenses.data.filter(e =>
            e.type === 'supplier_credit' &&
            e.remaining_amount !== undefined &&
            e.remaining_amount !== null
        );

        // Create groups for each SupplierCredit with its children
        supplierCredits.forEach(credit => {
            // Find all partial payment expenses for this credit
            const children = expenses.data.filter(e =>
                credit.supplier_credit_id && // Only match if credit has a valid supplier_credit_id
                e.supplier_credit_id === credit.supplier_credit_id &&
                e.type !== 'supplier_credit' && // Not another supplier credit
                e.expense_id !== null // Has an expense_id (is an actual expense, not a credit)
            );

            // Mark credit as processed
            if (credit.supplier_credit_id) {
                processedSupplierCreditIds.add(credit.supplier_credit_id);
            }

            // Mark children as processed
            children.forEach(child => {
                if (child.expense_id) {
                    processedExpenseIds.add(child.expense_id);
                }
            });

            groups.push({ main: credit, children });
        });

        // SECOND: Add standalone expenses that weren't grouped
        expenses.data.forEach(expense => {
            // Skip if already processed
            if (expense.expense_id && processedExpenseIds.has(expense.expense_id)) return;
            if (expense.supplier_credit_id && processedSupplierCreditIds.has(expense.supplier_credit_id)) return;

            // Skip supplier credits (already processed above)
            if (expense.type === 'supplier_credit') return;

            // Skip goods receipts (they are just informational, not actual expenses)
            if (expense.type === 'goods_receipt') return;

            groups.push({ main: expense, children: [] });
        });

        // Sort all groups by expense_date (latest first)
        groups.sort((a, b) => {
            const dateA = new Date(a.main.expense_date).getTime();
            const dateB = new Date(b.main.expense_date).getTime();
            return dateB - dateA; // Descending order (latest first)
        });

        return groups;
    };

    // Define columns for the table
    const columns: Column[] = [
        {
            key: 'expense_info',
            label: t('expenseInfo'),
            mobileLabel: t('title'),
            sortable: true,
            render: (expense: Expense) => {
                // Find group info
                const groups = groupedExpensesData();
                const group = groups.find(g => {
                    // Check if this expense is the main of this group
                    if (g.main.reference_number === expense.reference_number) return true;
                    // Check if this expense is a child
                    if (g.children.some(c => c.expense_id === expense.expense_id)) return true;
                    return false;
                });

                const isMain = group && group.main.reference_number === expense.reference_number;
                const isChild = group && group.children.some(c => c.expense_id === expense.expense_id);
                const hasChildren = isMain && group && group.children.length > 0;
                const isExpanded = expense.supplier_credit_id ? expandedGroups.has(expense.supplier_credit_id) : false;

                // Child payment row - minimal, clean design
                if (isChild) {
                    return (
                        <div className="flex items-start pl-12 py-1">
                            <div className="flex items-center min-w-0 flex-1">
                                {/* Subtle connection indicator */}
                                <div className="flex-shrink-0 mr-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            Ödəniş
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                            {expense.reference_number}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {new Date(expense.expense_date).toLocaleDateString('az-AZ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Parent/main row - prominent, clear design
                return (
                    <div className={`flex items-start ${hasChildren ? 'py-2' : ''}`}>
                        {/* Expand/collapse button - aligned to left edge */}
                        <div className="flex-shrink-0 mr-2">
                            {hasChildren && expense.supplier_credit_id ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroup(expense.supplier_credit_id!);
                                    }}
                                    className="w-6 h-6 rounded hover:bg-gray-100 transition-colors flex items-center justify-center group"
                                    title={isExpanded ? 'Bağla' : 'Aç'}
                                >
                                    {isExpanded ? (
                                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                            ) : (
                                <div className="w-6 h-6" />
                            )}
                        </div>

                        {/* Main icon */}
                        <div className="flex-shrink-0 mr-3 mt-0.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                hasChildren
                                    ? 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200'
                                    : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
                            }`}>
                                <CurrencyDollarIcon className={`w-4 h-4 ${
                                    hasChildren ? 'text-orange-600' : 'text-blue-600'
                                }`} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    {/* Title and badge row */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                                            {expense.description}
                                        </h4>
                                        {hasChildren && (
                                            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                {group.children.length} ödəniş
                                            </span>
                                        )}
                                        {/* Manual/Migration Entry Badge */}
                                        {expense.type === 'supplier_credit' && expense.entry_type && expense.entry_type !== 'automatic' && (
                                            <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                expense.entry_type === 'manual'
                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                            }`}>
                                                {expense.entry_type === 'manual' ? 'Əl ilə' : 'Köçürmə'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Reference number */}
                                    <div className="flex items-center gap-1 mb-1">
                                        <DocumentTextIcon className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-500 font-mono">
                                            {expense.reference_number}
                                        </span>
                                    </div>

                                    {/* Meta info row */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        {expense.category && (
                                            <span className="inline-flex items-center text-xs text-blue-600 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
                                                {expense.category.name}
                                            </span>
                                        )}
                                        {expense.supplier && (
                                            <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                                {expense.supplier.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            },
            className: 'min-w-0'
        },
        {
            key: 'amount',
            label: t('labels.amount', { ns: 'common' }),
            mobileLabel: t('labels.amount', { ns: 'common' }),
            sortable: true,
            align: 'right',
            render: (expense: Expense) => {
                // Find group info to determine if this is a child
                const groups = groupedExpensesData();
                const group = groups.find(g => {
                    if (g.main.reference_number === expense.reference_number) return true;
                    if (g.children.some(c => c.expense_id === expense.expense_id)) return true;
                    return false;
                });
                const isChild = group && group.children.some(c => c.expense_id === expense.expense_id);

                const remainingAmount = expense.remaining_amount ?? 0;
                const isPartiallyPaid = (expense.type === 'supplier_credit' || expense.type === 'goods_receipt')
                    && remainingAmount > 0
                    && remainingAmount < expense.amount;

                const paidAmount = isPartiallyPaid ? expense.amount - remainingAmount : null;

                // Child payment - simplified amount display
                if (isChild) {
                    return (
                        <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">
                                {expense.amount.toLocaleString('az-AZ')} ₼
                            </div>
                        </div>
                    );
                }

                // Main expense - detailed amount display
                return (
                    <div className="text-right">
                        <div className="text-base font-semibold text-gray-900 mb-1">
                            {expense.amount.toLocaleString('az-AZ')} ₼
                        </div>
                        {isPartiallyPaid && paidAmount !== null && (
                            <div className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
                                <CheckCircleIcon className="w-3 h-3" />
                                <span>Ödənilib: {paidAmount.toLocaleString('az-AZ')} ₼</span>
                            </div>
                        )}
                        {(expense.type === 'supplier_credit' || expense.type === 'goods_receipt') && remainingAmount > 0 && (
                            <div className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{remainingAmount.toLocaleString('az-AZ')} ₼</span>
                            </div>
                        )}
                    </div>
                );
            },
            width: '160px'
        },
        {
            key: 'expense_date',
            label: t('labels.date', { ns: 'common' }),
            sortable: true,
            hideOnMobile: true,
            render: (expense: Expense) => (
                <div className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                    {new Date(expense.expense_date).toLocaleDateString('az-AZ')}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'payment_method',
            label: t('labels.payment', { ns: 'common' }),
            mobileLabel: t('labels.payment', { ns: 'common' }),
            align: 'center',
            hideOnMobile: true,
            render: (expense: Expense) => {
                // Find group info to determine if this is a child
                const groups = groupedExpensesData();
                const group = groups.find(g => {
                    if (g.main.reference_number === expense.reference_number) return true;
                    if (g.children.some(c => c.expense_id === expense.expense_id)) return true;
                    return false;
                });
                const isChild = group && group.children.some(c => c.expense_id === expense.expense_id);

                const remainingAmount = expense.remaining_amount ?? 0;
                const isPartiallyPaid = (expense.type === 'supplier_credit' || expense.type === 'goods_receipt')
                    && remainingAmount > 0
                    && remainingAmount < expense.amount;

                // Child payment - show only payment method with icon
                if (isChild) {
                    const getPaymentIcon = (method: string) => {
                        switch (method) {
                            case 'cash':
                                return (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                );
                            case 'card':
                                return (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                );
                            default:
                                return (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                );
                        }
                    };

                    return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            expense.payment_method === 'cash'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : expense.payment_method === 'card'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                            {getPaymentIcon(expense.payment_method)}
                            <span>
                                {expense.payment_method === 'cash' ? t('paymentMethods.cash') :
                                 expense.payment_method === 'card' ? t('paymentMethods.card') : t('paymentMethods.transfer')}
                            </span>
                        </span>
                    );
                }

                // For partially paid expenses, show "Qismən ödənilib"
                if (isPartiallyPaid) {
                    return (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Qismən ödənilib
                        </span>
                    );
                }

                // For supplier credits that are not paid, show "Ödənilməyib"
                if (expense.type === 'supplier_credit' && expense.status !== 'paid') {
                    return (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('paymentMethods.unpaid')}
                        </span>
                    );
                }

                // For unpaid goods receipts (credit payment), show "Ödənilməyib"
                if (expense.type === 'goods_receipt' && expense.payment_status !== 'paid') {
                    return (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('paymentMethods.unpaid')}
                        </span>
                    );
                }

                // For payment method 'borc' (debt/credit), show "Ödənilməyib"
                if (expense.payment_method === 'borc') {
                    return (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('paymentMethods.unpaid')}
                        </span>
                    );
                }

                // For paid expenses (regular or paid supplier credits), show payment method
                const getPaymentIcon = (method: string) => {
                    switch (method) {
                        case 'cash':
                            return (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            );
                        case 'card':
                            return (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            );
                        default:
                            return (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            );
                    }
                };

                return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        expense.payment_method === 'cash'
                            ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                            : expense.payment_method === 'card'
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                        {getPaymentIcon(expense.payment_method)}
                        <span>
                            {expense.payment_method === 'cash' ? t('paymentMethods.cash') :
                             expense.payment_method === 'card' ? t('paymentMethods.card') : t('paymentMethods.transfer')}
                        </span>
                    </span>
                );
            },
            width: '150px'
        },
        {
            key: 'branch',
            label: t('fields.branch'),
            hideOnMobile: true,
            render: (expense: Expense) => (
                <div className="flex items-center text-sm text-gray-900">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
                    {expense.branch?.name || '-'}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'receipt',
            label: t('fields.receipt'),
            align: 'center',
            hideOnMobile: true,
            render: (expense: Expense) => (
                expense.receipt_file_path ? (
                    <a
                        href={`/expenses/${expense.expense_id}/view-receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-600 hover:text-green-800"
                        title={t('actions.viewReceipt')}
                    >
                        <DocumentTextIcon className="w-5 h-5" />
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
            width: '80px'
        }
    ];

    // Define filters
    const tableFilters: Filter[] = [
        {
            key: 'category_id',
            type: 'dropdown',
            label: t('fields.category'),
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
                { value: '', label: t('filters.allCategories') },
                ...categories.map(cat => ({
                    value: cat.category_id.toString(),
                    label: cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name
                }))
            ],
            className: 'min-w-[200px]'
        },
        {
            key: 'branch_id',
            type: 'dropdown',
            label: t('fields.branch'),
            value: selectedBranch,
            onChange: setSelectedBranch,
            options: [
                { value: '', label: t('filters.allBranches') },
                ...branches.map(branch => ({
                    value: branch.id.toString(),
                    label: branch.name
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'payment_method',
            type: 'dropdown',
            label: t('fields.paymentMethod'),
            value: selectedPaymentMethod,
            onChange: setSelectedPaymentMethod,
            options: [
                { value: '', label: t('filters.allMethods') },
                ...Object.entries(paymentMethods).map(([value, label]) => ({
                    value,
                    label
                }))
            ],
            className: 'min-w-[150px]'
        }
    ];

    // Define actions
    const actions: Action[] = [
        {
            label: t('actions.view', { ns: 'common' }),
            href: (expense: Expense) => {
                // Route to goods receipt page for goods receipts AND supplier credits linked to goods receipts
                if ((expense.type === 'goods_receipt' || expense.type === 'supplier_credit') && expense.goods_receipt_id) {
                    return `/goods-receipts/${expense.goods_receipt_id}`;
                }
                // Route to expense page for regular expenses
                if (expense.expense_id) {
                    return `/expenses/${expense.expense_id}`;
                }
                return '#';
            },
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary',
            condition: (expense: Expense) => {
                return !!(
                    (expense.type === 'goods_receipt' && expense.goods_receipt_id) ||
                    (expense.type === 'supplier_credit' && expense.goods_receipt_id) ||
                    (expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt' && expense.expense_id)
                );
            }
        },
        {
            label: t('actions.pay'),
            onClick: (expense: Expense) => handlePaySupplierCredit(expense),
            icon: <CurrencyDollarIcon className="w-4 h-4" />,
            variant: 'primary',
            condition: (expense: Expense) => expense.type === 'supplier_credit' && expense.status !== 'paid'
        },
        {
            label: t('actions.pay'),
            onClick: (expense: Expense) => handlePayGoodsReceipt(expense),
            icon: <CurrencyDollarIcon className="w-4 h-4" />,
            variant: 'primary',
            condition: (expense: Expense) => {
                return expense.type === 'goods_receipt' && expense.payment_status !== 'paid';
            }
        },
        {
            label: t('actions.edit', { ns: 'common' }),
            href: (expense: Expense) => `/expenses/${expense.expense_id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary',
            condition: (expense: Expense) => expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt' // Hide edit for credits and goods receipts
        },
        {
            label: t('actions.delete', { ns: 'common' }),
            onClick: (expense: Expense) => handleDelete(expense),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (expense: Expense) => {
                // Hide delete for supplier credits
                if (expense.type === 'supplier_credit') return false;

                // Hide delete for unpaid/partial goods receipts shown in list (expense_id is null)
                // These should be deleted from the goods receipts page, not here
                if (expense.type === 'goods_receipt' && expense.expense_id === null) return false;

                // Allow delete for:
                // 1. Goods receipt instant payment expenses (expense_id !== null) - permission check in backend
                // 2. Regular expenses
                return expense.expense_id !== null;
            }
        }
    ];

    // Event handlers
    const handleSearch = () => {
        router.get('/expenses', {
            search,
            category_id: selectedCategory,
            branch_id: selectedBranch,
            payment_method: selectedPaymentMethod,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedBranch('');
        setSelectedPaymentMethod('');
        router.get('/expenses', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (expense: Expense) => {
        // More specific confirmation message for goods receipt expenses
        let confirmMessage = t('messages.confirmDelete');

        if (expense.type === 'goods_receipt') {
            confirmMessage = 'Bu mal qəbulu ödəməsini silmək istədiyinizdən əminsiniz? Mal qəbulu ödənilməmiş statusuna qaytarılacaq.';
        }

        if (confirm(confirmMessage)) {
            router.delete(`/expenses/${expense.expense_id}`, {
                preserveScroll: true,
            });
        }
    };

    const handlePaySupplierCredit = (expense: Expense) => {
        if (expense.supplier_credit_id && expense.supplier) {
            setSelectedSupplierCredit({
                supplier_credit_id: expense.supplier_credit_id,
                reference_number: expense.reference_number,
                description: expense.description,
                amount: expense.amount,
                remaining_amount: expense.remaining_amount || expense.amount,
                supplier: expense.supplier
            });
            setShowPaySupplierCreditModal(true);
        }
    };

    const handlePayGoodsReceipt = (expense: Expense) => {
        if (expense.goods_receipt_data) {
            setSelectedGoodsReceipt(expense.goods_receipt_data);
            setShowPayGoodsReceiptModal(true);
        }
    };

    // Get payment method badge
    const getPaymentMethodBadge = (expense: Expense) => {
        const remainingAmount = expense.remaining_amount ?? 0;
        const isPartiallyPaid = (expense.type === 'supplier_credit' || expense.type === 'goods_receipt')
            && remainingAmount > 0
            && remainingAmount < expense.amount;

        if (isPartiallyPaid) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                    Qismən ödənilib
                </span>
            );
        }

        if (expense.type === 'supplier_credit' && expense.status !== 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    {t('paymentMethods.unpaid')}
                </span>
            );
        }

        if (expense.type === 'goods_receipt' && expense.payment_status !== 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    {t('paymentMethods.unpaid')}
                </span>
            );
        }

        if (expense.payment_method === 'borc') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    {t('paymentMethods.unpaid')}
                </span>
            );
        }

        const methodColors: Record<string, string> = {
            cash: 'bg-green-50 text-green-700 border-green-200',
            card: 'bg-blue-50 text-blue-700 border-blue-200',
            transfer: 'bg-purple-50 text-purple-700 border-purple-200',
        };

        const methodColor = methodColors[expense.payment_method] || 'bg-gray-50 text-gray-700 border-gray-200';

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${methodColor}`}>
                {expense.payment_method === 'cash' ? t('paymentMethods.cash') :
                 expense.payment_method === 'card' ? t('paymentMethods.card') : t('paymentMethods.transfer')}
            </span>
        );
    };

    // Get action buttons for mobile card
    const getActionButtons = (expense: Expense) => {
        const buttons = [];

        // View button
        if ((expense.type === 'goods_receipt' && expense.goods_receipt_id) ||
            (expense.type === 'supplier_credit' && expense.goods_receipt_id) ||
            (expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt' && expense.expense_id)) {

            const href = ((expense.type === 'goods_receipt' || expense.type === 'supplier_credit') && expense.goods_receipt_id)
                ? `/goods-receipts/${expense.goods_receipt_id}`
                : expense.expense_id ? `/expenses/${expense.expense_id}` : '#';

            buttons.push(
                <Link
                    key="view"
                    href={href}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200"
                >
                    <EyeIcon className="w-4 h-4" />
                    {t('actions.view', { ns: 'common' })}
                </Link>
            );
        }

        // Pay button
        if (expense.type === 'supplier_credit' && expense.status !== 'paid') {
            buttons.push(
                <button
                    key="pay"
                    onClick={() => handlePaySupplierCredit(expense)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200"
                >
                    <CurrencyDollarIcon className="w-4 h-4" />
                    {t('actions.pay')}
                </button>
            );
        }

        if (expense.type === 'goods_receipt' && expense.payment_status !== 'paid') {
            buttons.push(
                <button
                    key="pay"
                    onClick={() => handlePayGoodsReceipt(expense)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200"
                >
                    <CurrencyDollarIcon className="w-4 h-4" />
                    {t('actions.pay')}
                </button>
            );
        }

        // Edit button
        if (expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt') {
            buttons.push(
                <Link
                    key="edit"
                    href={`/expenses/${expense.expense_id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                    <PencilIcon className="w-4 h-4" />
                    {t('actions.edit', { ns: 'common' })}
                </Link>
            );
        }

        // Delete button
        if ((expense.type !== 'supplier_credit') &&
            !(expense.type === 'goods_receipt' && expense.expense_id === null) &&
            expense.expense_id !== null) {
            buttons.push(
                <button
                    key="delete"
                    onClick={() => handleDelete(expense)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200"
                >
                    <TrashIcon className="w-4 h-4" />
                    {t('actions.delete', { ns: 'common' })}
                </button>
            );
        }

        return buttons;
    };

    // Mobile card view
    const renderMobileView = () => {
        const groups = groupedExpensesData();

        if (groups.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t('messages.noExpensesFound')}
                    </h3>
                    <p className="text-gray-500">
                        {t('messages.startAddingExpenses')}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {groups.map((group, groupIndex) => {
                    const { main, children } = group;
                    const hasChildren = children.length > 0;
                    const isExpanded = main.supplier_credit_id ? expandedGroups.has(main.supplier_credit_id) : false;
                    const remainingAmount = main.remaining_amount ?? 0;

                    return (
                        <div key={groupIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Main expense card */}
                            <div className={`p-4 ${hasChildren ? 'border-l-4 border-l-orange-400' : ''}`}>
                                {/* Header with expand button */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                {main.description}
                                            </h3>
                                            {hasChildren && (
                                                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                    {children.length} ödəniş
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                                            <DocumentTextIcon className="w-3.5 h-3.5" />
                                            {main.reference_number}
                                        </div>
                                    </div>
                                    {hasChildren && main.supplier_credit_id && (
                                        <button
                                            onClick={() => toggleGroup(main.supplier_credit_id!)}
                                            className="flex-shrink-0 ml-2 p-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                    )}
                                </div>

                                {/* Amount and date */}
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {main.amount.toLocaleString('az-AZ')} ₼
                                        </div>
                                        {remainingAmount > 0 && (
                                            <div className="text-sm text-orange-600 font-medium mt-1">
                                                Qalıq: {remainingAmount.toLocaleString('az-AZ')} ₼
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <CalendarIcon className="w-4 h-4 mr-1" />
                                            {new Date(main.expense_date).toLocaleDateString('az-AZ')}
                                        </div>
                                        {getPaymentMethodBadge(main)}
                                    </div>
                                </div>

                                {/* Category and supplier */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {main.category && (
                                        <span className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
                                            {main.category.name}
                                        </span>
                                    )}
                                    {main.supplier && (
                                        <span className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                            {main.supplier.name}
                                        </span>
                                    )}
                                    {main.branch && (
                                        <span className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
                                            <BuildingOfficeIcon className="w-3.5 h-3.5 mr-1" />
                                            {main.branch.name}
                                        </span>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                    {getActionButtons(main)}
                                </div>
                            </div>

                            {/* Child payments */}
                            {hasChildren && isExpanded && (
                                <div className="border-t border-gray-200 bg-blue-50/30">
                                    {children.map((child, childIndex) => (
                                        <div key={childIndex} className="px-4 py-3 border-b border-blue-100 last:border-b-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center">
                                                        <CheckCircleIcon className="w-3.5 h-3.5 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Ödəniş
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-mono">
                                                            {child.reference_number}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(child.expense_date).toLocaleDateString('az-AZ')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-3">
                                                    <div className="text-lg font-bold text-green-600">
                                                        {child.amount.toLocaleString('az-AZ')} ₼
                                                    </div>
                                                    {getPaymentMethodBadge(child)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `${selectedIds.length} xərci silmək istədiyinizdən əminsiniz?`;

        if (confirm(confirmMessage)) {
            router.post('/expenses/bulk-delete', {
                ids: selectedIds
            }, {
                onError: (errors) => {
                    console.error('Bulk delete error:', errors);
                },
                preserveScroll: true
            });
        }
    };

    // Handle row double click
    const handleRowDoubleClick = (expense: Expense) => {
        // Route to goods receipt page for goods receipts AND supplier credits linked to goods receipts
        if ((expense.type === 'goods_receipt' || expense.type === 'supplier_credit') && expense.goods_receipt_id) {
            router.visit(`/goods-receipts/${expense.goods_receipt_id}`);
        }
        // Route to expense page for regular expenses
        else if (expense.expense_id) {
            router.visit(`/expenses/${expense.expense_id}`);
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedExpenses: Expense[]): BulkAction[] => {
        // If only ONE expense is selected, show individual actions
        if (selectedIds.length === 1 && selectedExpenses.length === 1) {
            const expense = selectedExpenses[0];

            const actions: BulkAction[] = [];

            // View action
            if ((expense.type === 'goods_receipt' && expense.goods_receipt_id) ||
                (expense.type === 'supplier_credit' && expense.goods_receipt_id) ||
                (expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt' && expense.expense_id)) {

                const href = ((expense.type === 'goods_receipt' || expense.type === 'supplier_credit') && expense.goods_receipt_id)
                    ? `/goods-receipts/${expense.goods_receipt_id}`
                    : expense.expense_id ? `/expenses/${expense.expense_id}` : '#';

                actions.push({
                    label: t('actions.view', { ns: 'common' }) as string,
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(href)
                });
            }

            // Edit action (only for regular expenses, not supplier credits or goods receipts)
            if (expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt') {
                actions.push({
                    label: t('actions.edit', { ns: 'common' }) as string,
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(`/expenses/${expense.expense_id}/edit`)
                });
            }

            // Delete action
            if ((expense.type !== 'supplier_credit') &&
                !(expense.type === 'goods_receipt' && expense.expense_id === null) &&
                expense.expense_id !== null) {
                actions.push({
                    label: t('actions.delete', { ns: 'common' }) as string,
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDelete(expense)
                });
            }

            return actions;
        }

        // Multiple expenses selected - show bulk delete only
        // Filter to only show deletable expenses
        const deletableExpenses = selectedExpenses.filter(expense =>
            expense.type !== 'supplier_credit' &&
            !(expense.type === 'goods_receipt' && expense.expense_id === null) &&
            expense.expense_id !== null
        );

        if (deletableExpenses.length === 0) {
            return [];
        }

        return [
            {
                label: (t('actions.bulkDelete', { ns: 'common' }) || 'Seçilmişləri Sil') as string,
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />

            <div className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="w-full">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{flash.success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(flash?.error || errors?.error) && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <XCircleIcon className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">{flash?.error || errors?.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mb-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowSupplierPaymentModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/30 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                        >
                            <CurrencyDollarIcon className="w-5 h-5" />
                            Təchizatçıya Ödə
                        </button>
                    </div>

                    {/* Mobile View */}
                    {isMobile ? (
                        <div className="space-y-4">
                            {/* Mobile Search and Filters */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                {/* Search Bar */}
                                <div className="relative mb-3">
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder={t('placeholders.searchExpenses')}
                                        className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Filter Toggle Button */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    >
                                        <FunnelIcon className="w-4 h-4" />
                                        Filtrlər
                                    </button>
                                    <button
                                        onClick={handleSearch}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Axtar
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Filter Options */}
                                {showFilters && (
                                    <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('fields.category')}
                                            </label>
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">{t('filters.allCategories')}</option>
                                                {categories.map(cat => (
                                                    <option key={cat.category_id} value={cat.category_id.toString()}>
                                                        {cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('fields.branch')}
                                            </label>
                                            <select
                                                value={selectedBranch}
                                                onChange={(e) => setSelectedBranch(e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">{t('filters.allBranches')}</option>
                                                {branches.map(branch => (
                                                    <option key={branch.id} value={branch.id.toString()}>
                                                        {branch.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('fields.paymentMethod')}
                                            </label>
                                            <select
                                                value={selectedPaymentMethod}
                                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">{t('filters.allMethods')}</option>
                                                {Object.entries(paymentMethods).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Cards */}
                            {renderMobileView()}

                            {/* Mobile Pagination */}
                            {expenses.data.length > 0 && expenses.last_page > 1 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">
                                            Göstərilir {expenses.from}-{expenses.to} / {expenses.total}
                                        </span>
                                        <div className="flex gap-2">
                                            {expenses.current_page > 1 && (
                                                <Link
                                                    href={`/expenses?page=${expenses.current_page - 1}`}
                                                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                >
                                                    Əvvəlki
                                                </Link>
                                            )}
                                            {expenses.current_page < expenses.last_page && (
                                                <Link
                                                    href={`/expenses?page=${expenses.current_page + 1}`}
                                                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                                >
                                                    Növbəti
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Desktop Table View */
                        <SharedDataTable
                        data={{
                            ...expenses,
                            data: (() => {
                                const groups = groupedExpensesData();
                                const result: Expense[] = [];

                                groups.forEach(group => {
                                    // Always add the main expense
                                    result.push(group.main);

                                    // Add children only if the group is expanded
                                    if (group.children.length > 0 && group.main.supplier_credit_id && expandedGroups.has(group.main.supplier_credit_id)) {
                                        result.push(...group.children);
                                    }
                                });

                                return result;
                            })()
                        }}
                        columns={columns}
                        actions={actions}
                        filters={tableFilters}
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder={t('placeholders.searchExpenses')}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        emptyState={{
                            title: t('messages.noExpensesFound'),
                            description: t('messages.startAddingExpenses'),
                            icon: <CurrencyDollarIcon className="w-12 h-12 text-gray-400" />
                        }}
                        fullWidth={true}
                        mobileClickable={true}
                        hideMobileActions={true}
                        selectable={true}
                        bulkActions={getBulkActions}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={(expense: Expense) => {
                            // Find group info
                            const groups = groupedExpensesData();
                            const group = groups.find(g => {
                                if (g.main.reference_number === expense.reference_number) return true;
                                if (g.children.some(c => c.expense_id === expense.expense_id)) return true;
                                return false;
                            });

                            const isMain = group && group.main.reference_number === expense.reference_number;
                            const isChild = group && group.children.some(c => c.expense_id === expense.expense_id);
                            const hasChildren = isMain && group && group.children.length > 0;
                            const isExpanded = expense.supplier_credit_id ? expandedGroups.has(expense.supplier_credit_id) : false;

                            if (isChild) {
                                return 'bg-blue-50/30 border-l-4 border-l-blue-200 hover:bg-blue-50/50 cursor-pointer';
                            }

                            if (hasChildren && isExpanded) {
                                return 'bg-orange-50/40 border-l-4 border-l-orange-300 shadow-sm hover:bg-orange-50/60 cursor-pointer';
                            }

                            if (hasChildren) {
                                return 'bg-orange-50/20 border-l-4 border-l-orange-200 hover:bg-orange-50/40 cursor-pointer';
                            }

                            return 'hover:bg-gray-50 cursor-pointer';
                        }}
                    />
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateExpenseModal
                show={showCreateExpenseModal}
                onClose={() => setShowCreateExpenseModal(false)}
                categories={categories}
                branches={branches}
                paymentMethods={paymentMethods}
            />

            <PaySupplierCreditModal
                show={showPaySupplierCreditModal}
                onClose={() => setShowPaySupplierCreditModal(false)}
                supplierCredit={selectedSupplierCredit}
                categories={categories}
                branches={branches}
                paymentMethods={paymentMethods}
            />

            <CreateSupplierPaymentModal
                show={showSupplierPaymentModal}
                onClose={() => setShowSupplierPaymentModal(false)}
                suppliers={suppliers}
                paymentMethods={paymentMethods}
                unpaidGoodsReceipts={unpaidGoodsReceipts}
                branches={branches}
                categories={categories}
            />

            {selectedGoodsReceipt && (
                <PayGoodsReceiptModal
                    show={showPayGoodsReceiptModal}
                    onClose={() => setShowPayGoodsReceiptModal(false)}
                    goodsReceipt={selectedGoodsReceipt}
                    categories={categories}
                    branches={branches}
                    paymentMethods={paymentMethods}
                />
            )}
        </AuthenticatedLayout>
    );
}