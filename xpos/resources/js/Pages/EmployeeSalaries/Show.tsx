import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CurrencyDollarIcon, CalendarIcon, UserIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface EmployeeSalary {
    id: number;
    salary_month: string;
    base_salary: number;
    bonuses: number;
    deductions: number;
    net_salary: number;
    paid: boolean;
    paid_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    employee: {
        id: number;
        name: string;
        hourly_rate: number;
    };
}

interface Props {
    employee_salary: EmployeeSalary;
}

export default function Show({ employee_salary }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(amount);
    };

    const formatMonth = (monthString: string) => {
        const date = new Date(monthString + '-01');
        return date.toLocaleDateString('az-AZ', { 
            year: 'numeric', 
            month: 'long' 
        });
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

    const handleMarkAsPaid = () => {
        if (confirm('Bu maaşı ödənilmiş kimi qeyd etmək istədiyinizə əminsiniz?')) {
            router.patch(`/employee-salaries/${employee_salary.id}/mark-as-paid`, {
                payment_date: new Date().toISOString().split('T')[0]
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Maaş - ${employee_salary.employee.name} - ${formatMonth(employee_salary.salary_month)}`} />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {employee_salary.employee.name}
                                    </h3>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        employee_salary.paid 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {employee_salary.paid ? (
                                            <div className="flex items-center">
                                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                Ödənilmiş
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <XCircleIcon className="h-4 w-4 mr-1" />
                                                Ödənilməmiş
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                                    <div className="flex items-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        <span>{formatMonth(employee_salary.salary_month)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                        <span className="font-semibold text-lg text-green-600">
                                            {formatCurrency(employee_salary.net_salary)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Salary Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Salary Details */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        Maaş Təfərrüatları
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">Əsas maaş</span>
                                            <span className="text-lg font-semibold text-blue-600">
                                                {formatCurrency(employee_salary.base_salary)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">Bonuslar</span>
                                            <span className="text-lg font-semibold text-green-600">
                                                +{formatCurrency(employee_salary.bonuses)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">Tutulmalar</span>
                                            <span className="text-lg font-semibold text-red-600">
                                                -{formatCurrency(employee_salary.deductions)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                                            <span className="text-lg font-bold text-gray-900">Xalis maaş</span>
                                            <span className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(employee_salary.net_salary)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Employee & Payment Info */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        İşçi və Ödəniş Məlumatları
                                    </h4>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">İşçi adı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{employee_salary.employee.name}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Saatlıq əmək haqqı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {formatCurrency(employee_salary.employee.hourly_rate)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Maaş ayı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {formatMonth(employee_salary.salary_month)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Ödəniş statusu</dt>
                                        <dd className="mt-1">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                employee_salary.paid 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {employee_salary.paid ? 'Ödənilmiş' : 'Ödənilməmiş'}
                                            </span>
                                        </dd>
                                    </div>

                                    {employee_salary.paid && employee_salary.paid_date && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Ödəniş tarixi</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {formatDate(employee_salary.paid_date)}
                                            </dd>
                                        </div>
                                    )}

                                    {employee_salary.notes && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Qeydlər</dt>
                                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                                {employee_salary.notes}
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
                                        <dd>{formatDateTime(employee_salary.created_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">Son yeniləmə</dt>
                                        <dd>{formatDateTime(employee_salary.updated_at)}</dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}