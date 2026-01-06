import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
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
        per_page: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        month?: string;
        paid?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ employee_salaries, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [selectedMonth, setSelectedMonth] = useState(filters.month || '');
    const [selectedPaid, setSelectedPaid] = useState(filters.paid || '');

    const handleSearch = () => {
        router.get('/employee-salaries', {
            search: searchValue,
            month: selectedMonth,
            paid: selectedPaid,
            sort: filters.sort,
            direction: filters.direction
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleReset = () => {
        setSearchValue('');
        setSelectedMonth('');
        setSelectedPaid('');
        router.get('/employee-salaries', {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSort = (column: string) => {
        const newDirection = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/employee-salaries', {
            search: searchValue,
            month: selectedMonth,
            paid: selectedPaid,
            sort: column,
            direction: newDirection
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/employee-salaries', {
            search: searchValue,
            month: selectedMonth,
            paid: selectedPaid,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Handle double-click to view salary
    const handleRowDoubleClick = (salary: EmployeeSalary) => {
        router.visit(`/employee-salaries/${salary.id}`);
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} maaş qeydini silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post('/employee-salaries/bulk-delete', {
            ids: selectedIds
        }, {
            onSuccess: () => {
                // Success message handled by backend
            },
            onError: (errors: any) => {
                alert('Xəta baş verdi');
            },
            preserveScroll: true
        });
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedSalaries: EmployeeSalary[]): BulkAction[] => {
        // If only ONE salary is selected, show individual actions
        if (selectedIds.length === 1 && selectedSalaries.length === 1) {
            const salary = selectedSalaries[0];

            const actions: BulkAction[] = [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/employee-salaries/${salary.id}`)
                },
                {
                    label: 'Redaktə et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(`/employee-salaries/${salary.id}/edit`)
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm(`${salary.employee_name} - ${salary.salary_month} üçün maaş qeydini silmək istədiyinizə əminsiniz?`)) {
                            router.delete(`/employee-salaries/${salary.id}`);
                        }
                    }
                }
            ];

            return actions;
        }

        // Multiple salaries selected - show bulk delete
        return [
            {
                label: 'Seçilmişləri sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
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

    // Configure filters with values and handlers
    const filtersWithHandlers = [
        {
            key: 'month',
            label: 'Ay',
            type: 'dropdown' as const,
            options: [
                { value: '', label: 'Bütün aylar' },
                ...getMonthOptions()
            ],
            value: selectedMonth,
            onChange: setSelectedMonth
        },
        {
            key: 'paid',
            label: 'Ödəniş statusu',
            type: 'dropdown' as const,
            options: [
                { value: '', label: 'Hamısı' },
                { value: '1', label: 'Ödənilmiş' },
                { value: '0', label: 'Ödənilməmiş' }
            ],
            value: selectedPaid,
            onChange: setSelectedPaid
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="İşçi Maaşları" />

            <div className="w-full">
                <SharedDataTable
                    data={employee_salaries}
                    columns={tableConfig.employeeSalaries.columns}
                    selectable={true}
                    bulkActions={getBulkActions}

                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder={tableConfig.employeeSalaries.searchPlaceholder}
                    filters={filtersWithHandlers}

                    onSort={handleSort}
                    sortField={filters.sort}
                    sortDirection={filters.direction as 'asc' | 'desc'}

                    onPerPageChange={handlePerPageChange}

                    onSearch={handleSearch}
                    onReset={handleReset}

                    title="İşçi Maaşları"
                    subtitle="İşçi maaşlarını idarə edin"
                    createButton={{
                        label: tableConfig.employeeSalaries.createButtonText,
                        href: '/employee-salaries/create'
                    }}

                    emptyState={{
                        icon: <CurrencyDollarIcon className="w-12 h-12" />,
                        title: tableConfig.employeeSalaries.emptyStateTitle,
                        description: tableConfig.employeeSalaries.emptyStateDescription,
                        action: (
                            <a
                                href="/employee-salaries/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                {tableConfig.employeeSalaries.createButtonText}
                            </a>
                        )
                    }}

                    rowClassName={() => 'cursor-pointer hover:bg-blue-50 transition-all duration-200'}
                    className="space-y-6"
                    fullWidth={true}
                    onRowDoubleClick={handleRowDoubleClick}
                />
            </div>
        </AuthenticatedLayout>
    );
}
