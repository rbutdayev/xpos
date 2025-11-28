import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    CurrencyDollarIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    TagIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    FolderIcon,
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
    type?: 'supplier_credit';
    supplier_credit_id?: number;
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

export default function Index({ expenses, categories, branches, paymentMethods, filters, flash, errors }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(filters.payment_method || '');

    // Define columns for the table
    const columns: Column[] = [
        {
            key: 'expense_info',
            label: 'Xərc məlumatları',
            mobileLabel: 'Xərc',
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
                                Təchizatçı: {expense.supplier.name}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'amount',
            label: 'Məbləğ',
            sortable: true,
            align: 'right',
            render: (expense: Expense) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {expense.amount.toLocaleString('az-AZ')} ₼
                    </div>
                    {expense.type === 'supplier_credit' && expense.remaining_amount !== undefined && expense.remaining_amount > 0 && (
                        <div className="text-xs text-orange-600 mt-0.5">
                            Qalıq: {expense.remaining_amount.toLocaleString('az-AZ')} ₼
                        </div>
                    )}
                </div>
            ),
            width: '140px'
        },
        {
            key: 'expense_date',
            label: 'Tarix',
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
            label: 'Ödəniş üsulu',
            mobileLabel: 'Ödəniş',
            align: 'center',
            hideOnMobile: true,
            render: (expense: Expense) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    expense.payment_method === 'nağd'
                        ? 'bg-green-100 text-green-800'
                        : expense.payment_method === 'kart'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                }`}>
                    {expense.payment_method === 'nağd' ? 'Nağd' :
                     expense.payment_method === 'kart' ? 'Kart' : 'Köçürmə'}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'branch',
            label: 'Filial',
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
            label: 'Qaimə',
            align: 'center',
            hideOnMobile: true,
            render: (expense: Expense) => (
                expense.receipt_file_path ? (
                    <a
                        href={`/expenses/${expense.expense_id}/view-receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-600 hover:text-green-800"
                        title="Qəbzi görüntülə"
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
            label: 'Kateqoriya',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
                { value: '', label: 'Bütün kateqoriyalar' },
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
            label: 'Filial',
            value: selectedBranch,
            onChange: setSelectedBranch,
            options: [
                { value: '', label: 'Bütün filiallar' },
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
            label: 'Ödəniş üsulu',
            value: selectedPaymentMethod,
            onChange: setSelectedPaymentMethod,
            options: [
                { value: '', label: 'Bütün üsullar' },
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
            label: 'Bax',
            href: (expense: Expense) => `/expenses/${expense.expense_id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary',
            condition: (expense: Expense) => expense.type !== 'supplier_credit' // Hide view for credits
        },
        {
            label: 'Ödə',
            href: (expense: Expense) => `/expenses/create?supplier_credit_id=${expense.supplier_credit_id}`,
            icon: <CurrencyDollarIcon className="w-4 h-4" />,
            variant: 'primary',
            condition: (expense: Expense) => expense.type === 'supplier_credit' && expense.status !== 'paid'
        },
        {
            label: 'Düzəliş',
            href: (expense: Expense) => `/expenses/${expense.expense_id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary',
            condition: (expense: Expense) => expense.type !== 'supplier_credit' // Hide edit for credits
        },
        {
            label: 'Sil',
            onClick: (expense: Expense) => handleDelete(expense),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (expense: Expense) => expense.type !== 'supplier_credit' // Hide delete for credits
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
        if (confirm('Bu xərci silmək istədiyinizə əminsiniz?')) {
            router.delete(`/expenses/${expense.expense_id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Xərclər" />

            <div className="py-6">
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
                        searchPlaceholder="Təsvir, nömrə və ya kateqoriya ilə axtar..."
                        onSearch={handleSearch}
                        onReset={handleReset}
                        createButton={{
                            label: 'Xərc əlavə et',
                            href: '/expenses/create'
                        }}
                        emptyState={{
                            title: 'Heç bir xərc tapılmadı',
                            description: 'İlk xərcinizi əlavə etməklə başlayın.',
                            icon: <CurrencyDollarIcon className="w-12 h-12 text-gray-400" />
                        }}
                        fullWidth={true}
                        mobileClickable={true}
                        hideMobileActions={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}