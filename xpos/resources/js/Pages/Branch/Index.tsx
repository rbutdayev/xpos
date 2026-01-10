import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { Branch } from '@/types';
import { BuildingOffice2Icon, PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Props {
    branches: {
        data: Branch[];
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
        status?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ branches, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = () => {
        router.get(route('branches.index'), {
            search: searchValue,
            status: statusFilter,
            sort: filters.sort,
            direction: filters.direction
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleReset = () => {
        setSearchValue('');
        setStatusFilter('');
        router.get(route('branches.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSort = (column: string) => {
        const newDirection = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('branches.index'), {
            ...filters,
            sort: column,
            direction: newDirection
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('branches.index'), {
            ...filters,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Handle double-click to view branch
    const handleRowDoubleClick = (branch: Branch) => {
        router.visit(route('branches.show', branch.id));
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} filialı silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('branches.bulk-delete'), {
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
    const getBulkActions = (selectedIds: (string | number)[], selectedBranches: Branch[]): BulkAction[] => {
        // If only ONE branch is selected, show individual actions
        if (selectedIds.length === 1 && selectedBranches.length === 1) {
            const branch = selectedBranches[0];

            return [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('branches.show', branch.id))
                },
                {
                    label: 'Düzəlt',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('branches.edit', branch.id))
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm(`"${branch.name}" filialını silmək istədiyinizə əminsiniz?`)) {
                            router.delete(route('branches.destroy', branch.id));
                        }
                    }
                }
            ];
        }

        // Multiple branches selected - show bulk actions
        return [
            {
                label: 'Seçilmişləri Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    // Configure filters with values and handlers
    const filtersWithHandlers = tableConfig.branches.filters.map(filter => {
        if (filter.key === 'status') {
            return {
                ...filter,
                value: statusFilter,
                onChange: setStatusFilter
            };
        }
        return {
            ...filter,
            value: '',
            onChange: () => {}
        };
    });

    return (
        <AuthenticatedLayout>
            <Head title="Filiallar" />

            <div className="w-full">
                <SharedDataTable
                    data={branches}
                    columns={tableConfig.branches.columns}
                    selectable={true}
                    bulkActions={getBulkActions}

                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder={tableConfig.branches.searchPlaceholder}
                    filters={filtersWithHandlers}

                    onSort={handleSort}
                    sortField={filters.sort}
                    sortDirection={filters.direction as 'asc' | 'desc'}

                    onPerPageChange={handlePerPageChange}

                    onSearch={handleSearch}
                    onReset={handleReset}

                    title="Filiallar"
                    subtitle="Şirkətinizin filiallarını idarə edin"
                    createButton={{
                        label: 'Yeni Filial',
                        href: route('branches.create')
                    }}

                    emptyState={{
                        icon: <BuildingOffice2Icon className="w-12 h-12" />,
                        title: tableConfig.branches.emptyStateTitle,
                        description: tableConfig.branches.emptyStateDescription,
                        action: (
                            <a
                                href={route('branches.create')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                {tableConfig.branches.createButtonText}
                            </a>
                        )
                    }}

                    className="space-y-6"
                    fullWidth={true}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={(branch: Branch) =>
                        `cursor-pointer hover:bg-blue-50 transition-all duration-200`
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}