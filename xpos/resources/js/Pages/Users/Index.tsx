import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { User } from '@/types';
import { usePage } from '@inertiajs/react';
import { UserIcon, PlusIcon } from '@heroicons/react/24/outline';
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

    const handleDeleteAction = (user: User) => {
        if ((user as any).is_system_user) {
            alert(t('messages.cannotDeleteSystem'));
            return;
        }
        if (user.role === 'account_owner') {
            alert(t('messages.cannotDeleteOwner'));
            return;
        }
        if (user.id === auth.user.id) {
            alert(t('messages.cannotDeleteSelf'));
            return;
        }
        if (confirm(t('messages.confirmDelete', { name: user.name }))) {
            router.delete(route('users.destroy', user.id));
        }
    };

    // Add current user indicator to data
    const enrichedUsers = {
        ...users,
        data: users.data.map(user => ({
            ...user,
            is_current_user: user.id === auth.user.id
        }))
    };

    // Configure actions with delete handler and conditional visibility
    const actionsWithHandlers = tableConfig.users.actions.map(action => {
        if (action.label === 'Sil') {
            return {
                ...action,
                onClick: handleDeleteAction,
                condition: (user: any) => !user.is_system_user && user.role !== 'account_owner' && user.id !== auth.user.id
            };
        }
        if (action.label === 'Düzəliş et' || action.label === 'Görüntülə') {
            return {
                ...action,
                condition: (user: any) => !user.is_system_user
            };
        }
        return action;
    });

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
                    actions={actionsWithHandlers}

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
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                {t('firstUser')}
                            </a>
                        )
                    }}

                    rowClassName={(user) => {
                        if ((user as any).is_system_user) return 'bg-gray-100 opacity-60';
                        if (user.is_current_user) return 'bg-blue-50';
                        return '';
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