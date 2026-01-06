import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentDuplicateIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';

interface RentalTemplate {
    id: number;
    name: string;
    rental_category: string;
    is_active: boolean;
    is_default: boolean;
    require_photos: boolean;
    min_photos: number;
    created_at: string;
    updated_at: string;
}

interface Category {
    value: string;
    label: string;
    label_en?: string;
    color?: string;
}

interface Props {
    templates: {
        data: RentalTemplate[];
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
        category?: string;
        status?: string;
    };
    categories: Category[];
}

// Helper function to get color class based on category color or default
const getCategoryColorClass = (color?: string): string => {
    if (!color) return 'bg-gray-100 text-gray-800';

    // Convert hex color to tailwind classes
    const colorMap: Record<string, string> = {
        '#6B7280': 'bg-gray-100 text-gray-800',
        '#8B5CF6': 'bg-purple-100 text-purple-800',
        '#3B82F6': 'bg-blue-100 text-blue-800',
        '#10B981': 'bg-green-100 text-green-800',
        '#F59E0B': 'bg-yellow-100 text-yellow-800',
        '#EF4444': 'bg-red-100 text-red-800',
        '#EC4899': 'bg-pink-100 text-pink-800',
        '#14B8A6': 'bg-teal-100 text-teal-800',
    };

    return colorMap[color] || 'bg-gray-100 text-gray-800';
};

export default function Index({ templates, filters, categories }: Props) {
    // Create lookup maps for categories
    const categoryLabels = categories.reduce((acc, cat) => {
        acc[cat.value] = cat.label;
        return acc;
    }, {} as Record<string, string>);

    const categoryColors = categories.reduce((acc, cat) => {
        acc[cat.value] = getCategoryColorClass(cat.color);
        return acc;
    }, {} as Record<string, string>);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = () => {
        router.get('/rental-templates', {
            search,
            category: selectedCategory,
            status: selectedStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedStatus('');
        router.get('/rental-templates', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const deleteTemplate = (template: RentalTemplate) => {
        if (confirm(`"${template.name}" şablonunu silmək istədiyinizə əminsiniz?`)) {
            router.delete(`/rental-templates/${template.id}`);
        }
    };

    const toggleStatus = (template: RentalTemplate) => {
        router.post(`/rental-templates/${template.id}/toggle-status`);
    };

    const setAsDefault = (template: RentalTemplate) => {
        if (!template.is_active) {
            alert('Yalnız aktiv şablonlar default edilə bilər');
            return;
        }
        router.post(`/rental-templates/${template.id}/set-default`);
    };

    const duplicateTemplate = (template: RentalTemplate) => {
        router.post(`/rental-templates/${template.id}/duplicate`);
    };

    // Handle double-click to view template
    const handleRowDoubleClick = (template: RentalTemplate) => {
        router.visit(`/rental-templates/${template.id}`);
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        if (confirm(`Seçilmiş ${selectedIds.length} şablonu silmək istədiyinizdən əminsiniz?`)) {
            router.delete('/rental-templates/bulk-delete', {
                data: { ids: selectedIds },
                onError: (errors) => {
                    alert('Xəta baş verdi. Bəzi şablonlar istifadədə ola bilər və ya default şablonlar silinə bilməz.');
                },
                preserveScroll: true
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedTemplates: RentalTemplate[]): BulkAction[] => {
        // If only ONE template is selected, show individual actions
        if (selectedIds.length === 1 && selectedTemplates.length === 1) {
            const template = selectedTemplates[0];

            const actions: BulkAction[] = [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/rental-templates/${template.id}`)
                },
                {
                    label: 'Düzəlt',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(`/rental-templates/${template.id}/edit`)
                },
                {
                    label: 'Kopyala',
                    icon: <DocumentDuplicateIcon className="w-4 h-4" />,
                    variant: 'secondary' as const,
                    onClick: () => duplicateTemplate(template)
                }
            ];

            // Only show delete for non-default templates
            if (!template.is_default) {
                actions.push({
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => deleteTemplate(template)
                });
            }

            return actions;
        }

        // Multiple templates selected - show bulk delete (only for non-default templates)
        const hasDefaultTemplate = selectedTemplates.some(t => t.is_default);

        if (hasDefaultTemplate) {
            return [];
        }

        return [
            {
                label: 'Toplu Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    const tableFilters = [
        {
            key: 'category',
            type: 'dropdown' as const,
            label: 'Kateqoriya',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
                { value: '', label: 'Bütün kateqoriyalar' },
                ...categories.map(cat => ({ value: cat.value, label: cat.label })),
            ],
        },
        {
            key: 'status',
            type: 'dropdown' as const,
            label: 'Status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' },
            ],
        },
    ];

    const columns = [
        {
            key: 'name',
            label: 'Şablon Adı',
            render: (template: RentalTemplate) => (
                <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        {template.is_default && (
                            <div className="flex items-center text-xs text-yellow-600 mt-1">
                                <StarSolidIcon className="w-3 h-3 mr-1" />
                                Default
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Kateqoriya',
            render: (template: RentalTemplate) => (
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[template.rental_category] || 'bg-gray-100 text-gray-800'}`}>
                    {categoryLabels[template.rental_category] || template.rental_category}
                </span>
            ),
        },
        {
            key: 'photo_requirements',
            label: 'Foto Tələbləri',
            render: (template: RentalTemplate) => (
                <div className="text-sm">
                    {template.require_photos ? (
                        <span className="text-green-600">
                            Bəli (min: {template.min_photos})
                        </span>
                    ) : (
                        <span className="text-gray-500">Xeyr</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (template: RentalTemplate) => (
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {template.is_active ? (
                        <>
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Aktiv
                        </>
                    ) : (
                        <>
                            <XCircleIcon className="w-3 h-3 mr-1" />
                            Qeyri-aktiv
                        </>
                    )}
                </span>
            ),
        },
    ];

    const tableActions = [
        {
            label: 'Bax',
            href: (template: RentalTemplate) => `/rental-templates/${template.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'view' as const,
        },
        {
            label: 'Düzəlt',
            href: (template: RentalTemplate) => `/rental-templates/${template.id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'edit' as const,
        },
        {
            label: 'Kopyala',
            icon: <DocumentDuplicateIcon className="w-4 h-4" />,
            variant: 'secondary' as const,
            onClick: duplicateTemplate,
        },
        {
            label: 'Default Et',
            icon: <StarIcon className="w-4 h-4" />,
            variant: 'secondary' as const,
            onClick: setAsDefault,
            condition: (template: RentalTemplate) => !template.is_default,
        },
        {
            label: 'Status',
            icon: <CheckCircleIcon className="w-4 h-4" />,
            variant: 'secondary' as const,
            onClick: toggleStatus,
        },
        {
            label: 'Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'delete' as const,
            onClick: deleteTemplate,
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="İcarə Müqavilə Şablonları" />

            <div className="w-full">
                <SharedDataTable
                    data={templates}
                    columns={columns}
                    actions={tableActions}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Şablon adı və ya kateqoriya ilə axtarış..."
                    filters={tableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    title="İcarə Müqavilə Şablonları"
                    createButton={{
                        label: 'Yeni Şablon',
                        href: '/rental-templates/create',
                    }}
                    emptyState={{
                        icon: <DocumentTextIcon className="w-12 h-12" />,
                        title: 'Heç bir şablon tapılmadı',
                        description: 'Başlamaq üçün yeni şablon əlavə edin.',
                    }}
                    fullWidth={true}
                    selectable={true}
                    bulkActions={getBulkActions}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={(template: RentalTemplate) =>
                        template.is_default ? 'bg-yellow-50' : ''
                    }
                    mobileClickable={true}
                    hideMobileActions={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}
