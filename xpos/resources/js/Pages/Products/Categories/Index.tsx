import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category } from '@/types';
import {
    PlusIcon,
    FolderIcon,
    FolderOpenIcon,
    PencilIcon,
    EyeIcon,
    TrashIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';

interface Props {
    categories: {
        data: Category[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
}

export default function Index({ categories }: Props) {
    const [search, setSearch] = useState('');

    // Handle double-click to view category
    const handleRowDoubleClick = (category: Category) => {
        router.visit(`/categories/${category.id}`);
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        if (confirm(`Seçilmiş ${selectedIds.length} kateqoriyanı silmək istədiyinizdən əminsiniz?`)) {
            router.delete('/categories/bulk-delete', {
                data: { ids: selectedIds },
                onError: (errors) => {
                    alert('Xəta baş verdi. Bəzi kateqoriyalar alt kateqoriyalara və ya məhsullara sahib ola bilər.');
                },
                preserveScroll: true
            });
        }
    };

    // Delete single category
    const deleteCategory = (category: Category) => {
        if (confirm(`"${category.name}" kateqoriyasını silmək istədiyinizdən əminsiniz?`)) {
            router.delete(`/categories/${category.id}`, {
                onError: (errors) => {
                    if (errors.category) {
                        alert(errors.category as string);
                    } else {
                        alert('Kateqoriya silinə bilmədi.');
                    }
                }
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedCategories: Category[]): BulkAction[] => {
        // If only ONE category is selected, show individual actions
        if (selectedIds.length === 1 && selectedCategories.length === 1) {
            const category = selectedCategories[0];

            return [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/categories/${category.id}`)
                },
                {
                    label: 'Düzəlt',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(`/categories/${category.id}/edit`)
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => deleteCategory(category)
                }
            ];
        }

        // Multiple categories selected - show bulk delete
        return [
            {
                label: 'Toplu Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    // Table columns configuration
    const columns = [
        {
            key: 'name',
            label: 'Ad',
            sortable: true,
            render: (category: Category) => (
                <div className="flex items-center">
                    <FolderIcon className="w-5 h-5 text-blue-500 mr-2" />
                    <div>
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        {category.description && (
                            <div className="text-xs text-gray-500">{category.description}</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'parent',
            label: 'Ana Kateqoriya',
            render: (category: Category) => (
                <span className="text-sm text-gray-900">
                    {category.parent ? category.parent.name : '-'}
                </span>
            )
        },
        {
            key: 'type',
            label: 'Növ',
            render: (category: Category) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    category.is_service
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                }`}>
                    {category.is_service ? 'Xidmət' : 'Məhsul'}
                </span>
            )
        },
        {
            key: 'products_count',
            label: 'Məhsullar',
            align: 'center' as const,
            render: (category: Category) => (
                <span className="text-sm text-gray-900">
                    {category.products?.length || 0}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (category: Category) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    category.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {category.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            )
        }
    ];

    const handleSearch = () => {
        router.get('/categories', { search }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        router.get('/categories', {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kateqoriyalar" />

            <div className="w-full">
                <SharedDataTable
                    data={categories}
                    columns={columns}
                    selectable={true}
                    bulkActions={getBulkActions}
                    createButton={{
                        label: 'Yeni Kateqoriya',
                        href: route('categories.create')
                    }}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Kateqoriya axtar..."
                    onSearch={handleSearch}
                    onReset={handleReset}
                    emptyState={{
                        icon: <FolderIcon className="w-12 h-12" />,
                        title: 'Heç bir kateqoriya yoxdur',
                        description: 'İlk kateqoriyanızı yaradaraq başlayın.'
                    }}
                    fullWidth={true}
                    dense={true}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={(category: Category) =>
                        `cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                            category.is_active ? '' : 'opacity-60'
                        }`
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}