import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { User } from '@/types';
import { usePage } from '@inertiajs/react';
import { UserIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Props {
    users: {
        data: User[];
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
        role?: string;
        status?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ users, filters }: Props) {
    const { t } = useTranslation('users');
    const { auth } = usePage().props as any;
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = () => {
        router.get(route('users.index'), {
            search: searchValue,
            role: roleFilter,
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
        setRoleFilter('');
        setStatusFilter('');
        router.get(route('users.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSort = (column: string) => {
        const newDirection = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('users.index'), {
            ...filters,
            sort: column,
            direction: newDirection
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('users.index'), {
            ...filters,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Add current user indicator to data
    const enrichedUsers = {
        ...users,
        data: users.data.map(user => ({
            ...user,
            is_current_user: user.id === auth.user.id
        }))
    };

    // Handle double-click to view user
    const handleRowDoubleClick = (user: User) => {
        // Don't allow viewing system users
        if ((user as any).is_system_user) {
            return;
        }
        router.visit(route('users.show', user.id));
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} istifadəçini silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('users.bulk-delete'), {
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
    const getBulkActions = (selectedIds: (string | number)[], selectedUsers: User[]): BulkAction[] => {
        // If only ONE user is selected, show individual actions
        if (selectedIds.length === 1 && selectedUsers.length === 1) {
            const user = selectedUsers[0];
            const isSystemUser = (user as any).is_system_user;

            // Don't show any actions for system users
            if (isSystemUser) {
                return [];
            }

            const actions: BulkAction[] = [
                {
                    label: t('actions.view' as any),
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('users.show', user.id))
                },
                {
                    label: t('actions.edit' as any),
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('users.edit', user.id))
                }
            ];

            // Add delete button only if conditions are met
            const canDelete = !isSystemUser && user.role !== 'account_owner' && user.id !== auth.user.id;
            if (canDelete) {
                actions.push({
                    label: t('actions.delete' as any),
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm(t('messages.confirmDelete', { name: user.name }))) {
                            router.delete(route('users.destroy', user.id));
                        }
                    }
                });
            }

            return actions;
        }

        // Multiple users selected - show bulk actions
        return [
            {
                label: t('actions.bulkDelete' as any),
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    // Configure filters with values and handlers
    const filtersWithHandlers = tableConfig.users.filters.map(filter => {
        if (filter.key === 'role') {
            return {
                ...filter,
                value: roleFilter,
                onChange: setRoleFilter
            };
        }
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
            <Head title={t('title')} />

            <div className="w-full">
                <SharedDataTable
                    data={enrichedUsers}
                    columns={tableConfig.users.columns}
                    selectable={true}
                    bulkActions={getBulkActions}

                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder={t('searchPlaceholder')}
                    filters={filtersWithHandlers}

                    onSort={handleSort}
                    sortField={filters.sort}
                    sortDirection={filters.direction as 'asc' | 'desc'}

                    onPerPageChange={handlePerPageChange}

                    onSearch={handleSearch}
                    onReset={handleReset}

                    title={t('title')}
                    subtitle={t('subtitle')}
                    createButton={{
                        label: t('create'),
                        href: route('users.create')
                    }}

                    emptyState={{
                        icon: <UserIcon className="w-12 h-12" />,
                        title: t('noUsers'),
                        description: tableConfig.users.emptyStateDescription,
                        action: (
                            <a
                                href={route('users.create')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                {t('firstUser')}
                            </a>
                        )
                    }}

                    rowClassName={(user) => {
                        if ((user as any).is_system_user) return 'bg-gray-100 opacity-60 cursor-not-allowed';
                        if (user.is_current_user) return 'bg-blue-50 cursor-pointer hover:bg-blue-100 transition-all duration-200';
                        return 'cursor-pointer hover:bg-blue-50 transition-all duration-200';
                    }}
                    className="space-y-6"
                    fullWidth={true}
                    onRowDoubleClick={handleRowDoubleClick}
                />
            </div>
        </AuthenticatedLayout>
    );
}