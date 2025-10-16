import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';
import { __ } from '@/utils/translations';
import { 
    PlusIcon,
    ClipboardDocumentListIcon,
    TagIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

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
    expenses: any[];
    created_at: string;
}

interface Props {
    categories: {
        data: ExpenseCategory[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    types: Record<string, string>;
    filters: {
        search?: string;
        type?: string;
        parent_id?: string;
        is_active?: string;
    };
}

export default function Index({ categories, types, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedParent, setSelectedParent] = useState(filters.parent_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.is_active || '');

    // Define columns for the table
    const columns: Column[] = [
        {
            key: 'category_info',
            label: 'Kateqoriya',
            sortable: true,
            render: (category: ExpenseCategory) => (
                <div className="flex items-center">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {category.name}
                        </div>
                        {category.parent && (
                            <div className="text-sm text-gray-500">
                                {category.parent.name}
                            </div>
                        )}
                        {category.description && (
                            <div className="text-xs text-gray-400 truncate">
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
            label: 'Növ',
            sortable: true,
            align: 'center',
            render: (category: ExpenseCategory) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.type === 'maaş' 
                        ? 'bg-blue-100 text-blue-800' 
                        : category.type === 'kommunal'
                        ? 'bg-yellow-100 text-yellow-800'
                        : category.type === 'nəqliyyat'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {types[category.type] || category.type}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'expense_count',
            label: 'Xərc sayı',
            align: 'center',
            render: (category: ExpenseCategory) => (
                <div className="text-sm text-gray-900">
                    {category.expenses?.length || 0}
                </div>
            ),
            width: '100px'
        },
        {
            key: 'is_active',
            label: 'Status',
            align: 'center',
            render: (category: ExpenseCategory) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {category.is_active ? 'Aktiv' : 'Deaktiv'}
                </span>
            ),
            width: '100px'
        }
    ];

    // Define filters
    const tableFilters: Filter[] = [
        {
            key: 'type',
            type: 'dropdown',
            label: 'Növ',
            value: selectedType,
            onChange: setSelectedType,
            options: [
                { value: '', label: 'Bütün növlər' },
                ...Object.entries(types).map(([value, label]) => ({
                    value,
                    label
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'parent_id',
            type: 'dropdown',
            label: 'Ana kateqoriya',
            value: selectedParent,
            onChange: setSelectedParent,
            options: [
                { value: '', label: 'Bütün kateqoriyalar' },
                ...categories.data
                    .filter(cat => !cat.parent)
                    .map(cat => ({
                        value: cat.category_id.toString(),
                        label: cat.name
                    }))
            ],
            className: 'min-w-[180px]'
        },
        {
            key: 'is_active',
            type: 'dropdown',
            label: 'Status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: '1', label: 'Aktiv' },
                { value: '0', label: 'Deaktiv' }
            ],
            className: 'min-w-[120px]'
        }
    ];

    // Define actions
    const actions: Action[] = [
        {
            label: 'Bax',
            href: (category: ExpenseCategory) => `/expense-categories/${category.category_id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Düzəliş',
            href: (category: ExpenseCategory) => `/expense-categories/${category.category_id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            onClick: (category: ExpenseCategory) => handleDelete(category),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (category: ExpenseCategory) => (category.expenses?.length || 0) === 0
        }
    ];

    // Event handlers
    const handleSearch = () => {
        router.get('/expense-categories', {
            search,
            type: selectedType,
            parent_id: selectedParent,
            is_active: selectedStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedType('');
        setSelectedParent('');
        setSelectedStatus('');
        router.get('/expense-categories', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (category: ExpenseCategory) => {
        if ((category.expenses?.length || 0) > 0) {
            alert('Bu kateqoriyada xərclər mövcud olduğu üçün silinə bilməz.');
            return;
        }
        
        if (confirm('Bu kateqoriyanı silmək istədiyinizə əminsiniz?')) {
            router.delete(`/expense-categories/${category.category_id}`);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={__('app.expense_categories')} />

            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {__('app.expense_categories')}
                        </h1>
                        <Link
                            href="/expense-categories/create"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Kateqoriya əlavə et
                        </Link>
                    </div>

                    <SharedDataTable
                        data={categories}
                        columns={columns}
                        actions={actions}
                        filters={tableFilters}
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Kateqoriya adı və ya təsvir ilə axtar..."
                        onSearch={handleSearch}
                        onReset={handleReset}
                        createButton={{
                            label: 'Kateqoriya əlavə et',
                            href: '/expense-categories/create'
                        }}
                        emptyState={{
                            title: 'Heç bir kateqoriya tapılmadı',
                            description: 'İlk kateqoriyanızı əlavə etməklə başlayın.',
                            icon: <TagIcon className="w-12 h-12 text-gray-400" />
                        }}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}