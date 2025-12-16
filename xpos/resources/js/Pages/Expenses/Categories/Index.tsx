import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';
import ExpensesNavigation from '@/Components/ExpensesNavigation';
import {
    TagIcon,
    FolderIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ExpenseCategory {
    category_id: number;
    name: string;
    type: string;
    description: string | null;
    is_active: boolean;
    parent: {
        category_id: number;
        name: string;
    } | null;
    children: ExpenseCategory[];
    created_at: string;
}

interface Props {
    categories: ExpenseCategory[];
    types: Record<string, string>;
}

export default function Index({ categories, types }: Props) {
    const { t } = useTranslation(['expenses', 'common']);
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Define columns for the table
    const columns: Column[] = [
        {
            key: 'category_info',
            label: t('categories.categoryInfo'),
            sortable: true,
            render: (category: ExpenseCategory) => (
                <div className="flex items-center">
                    {category.parent ? (
                        <TagIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    ) : (
                        <FolderIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {category.name}
                        </div>
                        {category.parent && (
                            <div className="text-xs text-gray-500">
                                {t('categories.messages.underParent', { parent: category.parent.name })}
                            </div>
                        )}
                        {category.description && (
                            <div className="text-xs text-gray-600 truncate">
                                {category.description}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'type',
            label: t('categories.type'),
            sortable: true,
            render: (category: ExpenseCategory) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.type === 'maaş' 
                        ? 'bg-green-100 text-green-800' 
                        : category.type === 'xərclər' 
                        ? 'bg-red-100 text-red-800'
                        : category.type === 'ödənişlər'
                        ? 'bg-blue-100 text-blue-800'
                        : category.type === 'kommunal'
                        ? 'bg-yellow-100 text-yellow-800'
                        : category.type === 'nəqliyyat'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {types[category.type] || category.type}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'children_count',
            label: t('categories.subCategories'),
            align: 'center',
            render: (category: ExpenseCategory) => (
                <div className="text-sm text-gray-900">
                    {category.children.length}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'is_active',
            label: t('categories.fields.status'),
            align: 'center',
            render: (category: ExpenseCategory) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {category.is_active ? t('categories.fields.isActive') : t('fields.inactive')}
                </span>
            ),
            width: '100px'
        },
        {
            key: 'created_at',
            label: t('fields.createdAt'),
            sortable: true,
            render: (category: ExpenseCategory) => (
                <div className="text-sm text-gray-900">
                    {new Date(category.created_at).toLocaleDateString('az-AZ')}
                </div>
            ),
            width: '120px'
        }
    ];

    // Define filters
    const tableFilters: Filter[] = [
        {
            key: 'type',
            type: 'dropdown',
            label: t('categories.type'),
            value: selectedType,
            onChange: setSelectedType,
            options: [
                { value: '', label: t('categories.filters.allTypes') },
                ...Object.entries(types).map(([value, label]) => ({
                    value,
                    label
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'is_active',
            type: 'dropdown',
            label: t('categories.fields.status'),
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: '', label: t('categories.filters.allStatuses') },
                { value: '1', label: t('categories.fields.isActive') },
                { value: '0', label: t('fields.inactive') }
            ],
            className: 'min-w-[120px]'
        }
    ];

    // Define actions
    const actions: Action[] = [
        {
            label: t('actions.view'),
            href: (category: ExpenseCategory) => `/expense-categories/${category.category_id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: t('actions.edit'),
            href: (category: ExpenseCategory) => `/expense-categories/${category.category_id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: t('actions.delete'),
            onClick: (category: ExpenseCategory) => handleDelete(category),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger'
        }
    ];

    // Event handlers
    const handleSearch = () => {
        router.get('/expense-categories', {
            search,
            type: selectedType,
            is_active: selectedStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedType('');
        setSelectedStatus('');
        router.get('/expense-categories', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (category: ExpenseCategory) => {
        if (category.children.length > 0) {
            alert(t('categories.messages.cannotDeleteWithChildren'));
            return;
        }

        if (confirm(t('categories.messages.confirmDelete'))) {
            router.delete(`/expense-categories/${category.category_id}`);
        }
    };

    // Transform categories for table display
    const flattenCategories = (cats: ExpenseCategory[]): ExpenseCategory[] => {
        const result: ExpenseCategory[] = [];
        
        cats.forEach(cat => {
            result.push(cat);
            if (cat.children && cat.children.length > 0) {
                cat.children.forEach(child => {
                    result.push(child);
                });
            }
        });
        
        return result;
    };

    const tableData = {
        data: flattenCategories(categories),
        links: [
            { url: null, label: 'Previous', active: false },
            { url: null, label: '1', active: true },
            { url: null, label: 'Next', active: false }
        ],
        current_page: 1,
        last_page: 1,
        total: flattenCategories(categories).length,
        per_page: flattenCategories(categories).length,
        from: 1,
        to: flattenCategories(categories).length
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('categories.title')} />

            <div className="py-6">
                <div className="px-4 sm:px-6 lg:px-8">
                    {/* Expense Navigation */}
                    <ExpensesNavigation currentRoute={route().current()} />

                    <div className="w-full">
                        <SharedDataTable
                        data={tableData}
                        columns={columns}
                        actions={actions}
                        filters={tableFilters}
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder={t('categories.placeholders.searchCategories')}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        emptyState={{
                            title: t('categories.messages.noCategoriesFound'),
                            description: t('categories.messages.startAddingCategories'),
                            icon: <TagIcon className="w-12 h-12 text-gray-400" />
                        }}
                        fullWidth={true}
                    />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}