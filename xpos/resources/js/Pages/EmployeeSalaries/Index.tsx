import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import Pagination from '@/Components/Pagination';
import { 
    UsersIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface EmployeeSalary {
    id: number;
    employee_name: string;
    employee_id: number;
    salary_month: string;
    base_salary: number;
    bonuses: number;
    deductions: number;
    net_salary: number;
    paid: boolean;
    paid_date: string | null;
    created_at: string;
}

interface Props {
    employee_salaries: {
        data: EmployeeSalary[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        month?: string;
        paid?: string;
    };
}

export default function Index({ employee_salaries, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedMonth, setSelectedMonth] = useState(filters.month || '');
    const [selectedPaid, setSelectedPaid] = useState(filters.paid || '');

    const handleSearch = () => {
        router.get('/employee-salaries', {
            search,
            month: selectedMonth,
            paid: selectedPaid,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedMonth('');
        setSelectedPaid('');
        router.get('/employee-salaries', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleMarkAsPaid = (salary: EmployeeSalary) => {
        if (confirm('Bu maaşı ödənilmiş kimi qeyd etmək istədiyinizə əminsiniz?')) {
            router.patch(`/employee-salaries/${salary.id}/mark-as-paid`, {
                payment_date: new Date().toISOString().split('T')[0]
            });
        }
    };

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
        return new Date(dateString).toLocaleDateString('az-AZ');
    };

    // Generate month options for the last 12 months
    const getMonthOptions = () => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('az-AZ', { 
                year: 'numeric', 
                month: 'long' 
            });
            options.push({ value: monthStr, label: monthName });
        }
        return options;
    };

    return (
        <AuthenticatedLayout>
            <Head title="İşçi Maaşları" />

            <div className="py-6">
                <div className="w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">İşçi Maaşları</h1>
                        <Link
                            href="/employee-salaries/create"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Yeni maaş
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        İşçi axtar
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="İşçi adı axtar..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ay
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Bütün aylar</option>
                                        {getMonthOptions().map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ödəniş statusu
                                    </label>
                                    <select
                                        value={selectedPaid}
                                        onChange={(e) => setSelectedPaid(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Hamısı</option>
                                        <option value="1">Ödənilmiş</option>
                                        <option value="0">Ödənilməmiş</option>
                                    </select>
                                </div>

                                <div className="flex items-end space-x-2">
                                    <button
                                        onClick={handleSearch}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        Axtar
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Sıfırla
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salaries List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {employee_salaries.data.length > 0 ? (
                                employee_salaries.data.map((salary) => (
                                    <li key={salary.id}>
                                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center">
                                                        <UserIcon className="h-5 w-5 text-blue-500 mr-3" />
                                                        <div>
                                                            <p className="text-lg font-medium text-gray-900">
                                                                {salary.employee_name}
                                                            </p>
                                                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                                                <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                                                <span>{formatMonth(salary.salary_month)}</span>
                                                                <CurrencyDollarIcon className="flex-shrink-0 ml-4 mr-1.5 h-4 w-4" />
                                                                <span className="font-medium text-green-600">
                                                                    {formatCurrency(salary.net_salary)}
                                                                </span>
                                                                <span className={`ml-4 px-2 py-1 text-xs rounded-full ${
                                                                    salary.paid 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {salary.paid ? 'Ödənilmiş' : 'Ödənilməmiş'}
                                                                </span>
                                                            </div>
                                                            {salary.paid && salary.paid_date && (
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    Ödəniş tarixi: {formatDate(salary.paid_date)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        href={`/employee-salaries/${salary.id}`}
                                                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                                    >
                                                        Bax
                                                    </Link>
                                                    {!salary.paid && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(salary)}
                                                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                                                        >
                                                            Ödənildi
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li>
                                    <div className="px-4 py-12 text-center">
                                        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Maaş qeydi tapılmadı</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            İlk maaş emalını başlatın.
                                        </p>
                                        <div className="mt-6">
                                            <Link
                                                href="/employee-salaries/create"
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                                Yeni maaş
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Pagination */}
                    {employee_salaries.links.length > 3 && (
                        <div className="mt-6">
                            <Pagination 
                                links={employee_salaries.links}
                                currentPage={employee_salaries.current_page}
                                lastPage={employee_salaries.last_page}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}