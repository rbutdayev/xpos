import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { Branch } from '@/types';
import { BuildingOffice2Icon, PlusIcon } from '@heroicons/react/24/outline';

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

    const handleDeleteAction = (branch: Branch) => {
        if (confirm(`"${branch.name}" filialını silmək istədiyinizə əminsiniz?`)) {
            router.delete(route('branches.destroy', branch.id));
        }
    };

    // Configure actions with delete handler
    const actionsWithHandlers = tableConfig.branches.actions.map(action => {
        if (action.label === 'Sil') {
            return {
                ...action,
                onClick: handleDeleteAction
            };
        }
        return action;
    });

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
                    actions={actionsWithHandlers}

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
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                {tableConfig.branches.createButtonText}
                            </a>
                        )
                    }}

                    className="space-y-6"
                    fullWidth={true}
                    mobileClickable={true}
                    hideMobileActions={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}