import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';
import ExpensesNavigation from '@/Components/ExpensesNavigation';
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
    XCircleIcon
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

    // Define columns for the table
    const columns: Column[] = [
        {
            key: 'expense_info',
            label: t('expenseInfo'),
            mobileLabel: t('title'),
            sortable: true,
            render: (expense: Expense) => (
                <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {expense.description}
                        </div>
                        <div className="text-sm text-gray-500">
                            {expense.reference_number}
                        </div>
                        {expense.category && (
                            <div className="text-xs text-blue-600">
                                {expense.category.name}
                            </div>
                        )}
                        {expense.supplier && (
                            <div className="text-xs text-green-600">
                                {t('fields.supplier')}: {expense.supplier.name}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'amount',
            label: t('labels.amount', { ns: 'common' }),
            sortable: true,
            align: 'right',
            render: (expense: Expense) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {expense.amount.toLocaleString('az-AZ')} ₼
                    </div>
                    {expense.type === 'supplier_credit' && expense.remaining_amount !== undefined && expense.remaining_amount > 0 && (
                        <div className="text-xs text-orange-600 mt-0.5">
                            {t('fields.remainingAmount')}: {expense.remaining_amount.toLocaleString('az-AZ')} ₼
                        </div>
                    )}
                </div>
            ),
            width: '140px'
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
                // For supplier credits that are not paid, show "Ödənilməyib"
                if (expense.type === 'supplier_credit' && expense.status !== 'paid') {
                    return (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {t('paymentMethods.unpaid')}
                        </span>
                    );
                }

                // For paid expenses (regular or paid supplier credits), show payment method
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.payment_method === 'cash'
                            ? 'bg-green-100 text-green-800'
                            : expense.payment_method === 'card'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                    }`}>
                        {expense.payment_method === 'cash' ? t('paymentMethods.cash') :
                         expense.payment_method === 'card' ? t('paymentMethods.card') : t('paymentMethods.transfer')}
                    </span>
                );
            },
            width: '120px'
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
            href: (expense: Expense) => `/expenses/${expense.expense_id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary',
            condition: (expense: Expense) => expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt' // Hide view for credits and goods receipts
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
            condition: (expense: Expense) => expense.type === 'goods_receipt' && expense.payment_status !== 'paid'
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
            condition: (expense: Expense) => expense.type !== 'supplier_credit' && expense.type !== 'goods_receipt' // Hide delete for credits and goods receipts
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
        if (confirm(t('messages.confirmDelete'))) {
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

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Expense Navigation */}
                    <ExpensesNavigation
                        currentRoute={route().current()}
                        onCreateExpense={() => setShowCreateExpenseModal(true)}
                        onCreateSupplierPayment={() => setShowSupplierPaymentModal(true)}
                    />

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

                    <SharedDataTable
                        data={expenses}
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
                    />
                </div>
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