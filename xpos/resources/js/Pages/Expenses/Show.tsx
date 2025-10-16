import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CurrencyDollarIcon, CalendarIcon, DocumentIcon, TagIcon } from '@heroicons/react/24/outline';

interface Expense {
    expense_id: number;
    description: string;
    amount: number;
    expense_date: string;
    receipt_file_path: string | null;
    notes: string | null;
    payment_method: string;
    reference_number: string | null;
    created_at: string;
    updated_at: string;
    category?: {
        category_id: number;
        name: string;
        parent?: {
            category_id: number;
            name: string;
        };
    };
    branch?: {
        id: number;
        name: string;
    };
    user?: {
        id: number;
        name: string;
    };
}

interface Props {
    expense: Expense;
}

export default function Show({ expense }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Xərc Detalları
                    </h2>
                    <div className="flex space-x-3">
                        <Link
                            href={`/expenses/${expense.expense_id}/edit`}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Düzəliş et
                        </Link>
                        <Link
                            href="/expenses"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            ← Xərclərə qayıt
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Xərc - ${expense.description}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {expense.description}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                        <span className="font-semibold text-lg text-green-600">
                                            {formatCurrency(expense.amount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        <span>{formatDate(expense.expense_date)}</span>
                                    </div>
                                    {expense.category && (
                                        <div className="flex items-center">
                                            <TagIcon className="h-4 w-4 mr-1" />
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                {expense.category.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        Əsas Məlumatlar
                                    </h4>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Təsvir</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{expense.description}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Məbləğ</dt>
                                        <dd className="mt-1 text-lg font-semibold text-green-600">
                                            {formatCurrency(expense.amount)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Xərc tarixi</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatDate(expense.expense_date)}</dd>
                                    </div>

                                    {expense.category && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Kateqoriya</dt>
                                            <dd className="mt-1">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                    {expense.category.name}
                                                </span>
                                            </dd>
                                        </div>
                                    )}
                                </div>

                                {/* Receipt and Notes */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        Əlavə Məlumatlar
                                    </h4>

                                    {expense.receipt_file_path && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 mb-2">Qəbz</dt>
                                            <dd className="mt-1">
                                                <div className="flex items-center space-x-3">
                                                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                                                    <div className="flex space-x-2">
                                                        <a 
                                                            href={`/expenses/${expense.expense_id}/view-receipt`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            Görüntülə
                                                        </a>
                                                        <span className="text-gray-400">|</span>
                                                        <a 
                                                            href={`/expenses/${expense.expense_id}/download-receipt`}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                        >
                                                            Endir
                                                        </a>
                                                    </div>
                                                </div>
                                            </dd>
                                        </div>
                                    )}

                                    {expense.notes && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Qeydlər</dt>
                                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                                {expense.notes}
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Information */}
                            <div className="border-t pt-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Sistem Məlumatları</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <dt className="font-medium">Yaradılma tarixi</dt>
                                        <dd>{formatDateTime(expense.created_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">Son yeniləmə</dt>
                                        <dd>{formatDateTime(expense.updated_at)}</dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}