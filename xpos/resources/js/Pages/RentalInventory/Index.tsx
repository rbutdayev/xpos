import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { CubeIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Product {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
}

interface InventoryItem {
    id: number;
    inventory_number: string;
    serial_number: string | null;
    product: Product | null; // Keep for backwards compatibility
    product_name: string; // New: copied product data
    product_sku: string | null;
    product_category: string | null;
    product_brand: string | null;
    original_product_id: number | null;
    original_product_deleted_at: string | null;
    can_return_to_stock: boolean;
    branch: Branch;
    status: string;
    rental_category: string;
    daily_rate: number | null;
    weekly_rate: number | null;
    monthly_rate: number | null;
    replacement_cost: number | null;
    is_active: boolean;
    condition_notes: string | null;
}

interface Props {
    inventory: {
        data: InventoryItem[];
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
        rental_category?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ inventory, filters }: Props) {
    const { auth, flash } = usePage().props as any;
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.rental_category || '');
    const [showFlashMessage, setShowFlashMessage] = useState(true);

    // Reset flash message visibility when flash changes
    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowFlashMessage(true);
        }
    }, [flash]);

    const handleSearch = () => {
        router.get(
            route('rental-inventory.index'),
            {
                search: searchValue,
                status: statusFilter,
                rental_category: categoryFilter,
                sort: filters.sort,
                direction: filters.direction,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleReset = () => {
        setSearchValue('');
        setStatusFilter('');
        setCategoryFilter('');
        router.get(
            route('rental-inventory.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSort = (column: string) => {
        const newDirection = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(
            route('rental-inventory.index'),
            {
                ...filters,
                sort: column,
                direction: newDirection,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            route('rental-inventory.index'),
            {
                ...filters,
                per_page: perPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleDelete = (item: InventoryItem) => {
        if (item.status === 'rented') {
            alert('Hazırda kirayədə olan inventar silinə bilməz.');
            return;
        }
        if (confirm(`${item.inventory_number} inventar elementini silmək istədiyinizə əminsiniz?`)) {
            router.delete(route('rental-inventory.destroy', item.id));
        }
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} inventar elementini silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('rental-inventory.bulk-delete'), {
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

    // Handle double-click to view item
    const handleRowDoubleClick = (item: InventoryItem) => {
        router.visit(route('rental-inventory.show', item.id));
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedItems: InventoryItem[]): BulkAction[] => {
        // If only ONE item is selected, show individual actions
        if (selectedIds.length === 1 && selectedItems.length === 1) {
            const item = selectedItems[0];
            const userRole = auth?.user?.role;
            const canDelete = (userRole === 'admin' || userRole === 'account_owner') && item.status !== 'rented';

            return [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('rental-inventory.show', item.id))
                },
                {
                    label: 'Düzəlt',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('rental-inventory.edit', item.id))
                },
                ...(canDelete ? [{
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDelete(item)
                }] : [])
            ];
        }

        // Multiple items selected - show bulk delete only
        const userRole = auth?.user?.role;
        const canBulkDelete = userRole === 'admin' || userRole === 'account_owner';

        if (!canBulkDelete) {
            return [];
        }

        return [
            {
                label: 'Seçilmişləri Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: () => handleBulkDelete(selectedIds)
            }
        ];
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'rented':
                return 'bg-blue-100 text-blue-800';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800';
            case 'damaged':
                return 'bg-red-100 text-red-800';
            case 'retired':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available':
                return 'Mövcud';
            case 'rented':
                return 'Kirayədə';
            case 'maintenance':
                return 'Təmirdə';
            case 'damaged':
                return 'Zədəli';
            case 'retired':
                return 'İstifadədən çıxarılıb';
            default:
                return status;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'clothing':
                return 'Geyim';
            case 'electronics':
                return 'Elektronika';
            case 'home_appliances':
                return 'Məişət texnikası';
            case 'cosmetics':
                return 'Kosmetika';
            case 'event_equipment':
                return 'Tədbir avadanlığı';
            case 'furniture':
                return 'Mebel';
            case 'jewelry':
                return 'Zərgərlik';
            case 'toys':
                return 'Oyuncaq';
            case 'sports':
                return 'İdman';
            default:
                return category;
        }
    };

    const columns = [
        {
            key: 'inventory_number',
            label: 'İnventar №',
            sortable: true,
            render: (item: InventoryItem) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{item.inventory_number}</div>
                    {item.serial_number && (
                        <div className="text-xs text-gray-500">S/N: {item.serial_number}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'product',
            label: 'Məhsul',
            sortable: false,
            render: (item: InventoryItem) => (
                <div className="text-sm text-gray-900">
                    {item.product_name || item.product?.name || 'Silinmiş məhsul'}
                    {item.original_product_deleted_at && (
                        <span className="ml-2 text-xs text-red-600" title="Original product was deleted">
                            ⚠️
                        </span>
                    )}
                    {item.product_sku && (
                        <div className="text-xs text-gray-500">SKU: {item.product_sku}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'branch',
            label: 'Filial',
            sortable: false,
            render: (item: InventoryItem) => (
                <div className="text-sm text-gray-900">{item.branch.name}</div>
            ),
        },
        {
            key: 'rental_category',
            label: 'Kateqoriya',
            sortable: true,
            render: (item: InventoryItem) => (
                <div className="text-sm text-gray-600">{getCategoryLabel(item.rental_category)}</div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (item: InventoryItem) => (
                <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                        item.status
                    )}`}
                >
                    {getStatusLabel(item.status)}
                </span>
            ),
        },
        {
            key: 'pricing',
            label: 'Qiymət',
            sortable: false,
            render: (item: InventoryItem) => (
                <div className="text-sm text-gray-900">
                    {item.daily_rate && <div>Günlük: {Number(item.daily_rate).toFixed(2)} AZN</div>}
                    {item.weekly_rate && <div>Həftəlik: {Number(item.weekly_rate).toFixed(2)} AZN</div>}
                    {item.monthly_rate && <div>Aylıq: {Number(item.monthly_rate).toFixed(2)} AZN</div>}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Aktiv',
            sortable: false,
            render: (item: InventoryItem) => (
                <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {item.is_active ? 'Bəli' : 'Xeyr'}
                </span>
            ),
        },
    ];

    const actions = [
        {
            label: 'Bax',
            href: (item: InventoryItem) => `/rental-inventory/${item.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'view' as const,
        },
        {
            label: 'Düzəlt',
            href: (item: InventoryItem) => `/rental-inventory/${item.id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'edit' as const,
        },
        {
            label: 'Sil',
            onClick: handleDelete,
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger' as const,
            condition: (item: InventoryItem) => {
                // Only admins and account owners can delete
                const userRole = auth?.user?.role;
                const canDelete = userRole === 'admin' || userRole === 'account_owner';
                return canDelete && item.status !== 'rented';
            },
        },
    ];

    const filtersConfig = [
        {
            key: 'status',
            label: 'Status',
            type: 'dropdown' as const,
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'available', label: 'Mövcud' },
                { value: 'rented', label: 'Kirayədə' },
                { value: 'maintenance', label: 'Təmirdə' },
                { value: 'damaged', label: 'Zədəli' },
                { value: 'retired', label: 'İstifadədən çıxarılıb' },
            ],
        },
        {
            key: 'rental_category',
            label: 'Kateqoriya',
            type: 'dropdown' as const,
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'clothing', label: 'Geyim' },
                { value: 'electronics', label: 'Elektronika' },
                { value: 'home_appliances', label: 'Məişət texnikası' },
                { value: 'cosmetics', label: 'Kosmetika' },
                { value: 'event_equipment', label: 'Tədbir avadanlığı' },
                { value: 'furniture', label: 'Mebel' },
                { value: 'jewelry', label: 'Zərgərlik' },
                { value: 'toys', label: 'Oyuncaq' },
                { value: 'sports', label: 'İdman' },
            ],
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Kirayə Inventarı" />

            <div className="w-full">
                {/* Flash Messages */}
                {showFlashMessage && flash?.success && (
                    <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowFlashMessage(false)}
                                        className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                                    >
                                        <span className="sr-only">Bağla</span>
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showFlashMessage && flash?.error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowFlashMessage(false)}
                                        className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                    >
                                        <span className="sr-only">Bağla</span>
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <SharedDataTable
                    data={inventory}
                    columns={columns}
                    actions={actions}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder="İnventar nömrəsi, seriya nömrəsi və ya məhsul adı ilə axtarın..."
                    filters={filtersConfig}
                    onSort={handleSort}
                    sortField={filters.sort}
                    sortDirection={filters.direction as 'asc' | 'desc'}
                    onPerPageChange={handlePerPageChange}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    title="Kirayə Inventarı"
                    subtitle="Kirayə üçün mövcud məhsulların inventarını idarə edin"
                    emptyState={{
                        icon: <CubeIcon className="w-12 h-12" />,
                        title: 'İnventar tapılmadı',
                        description: 'Hələ heç bir inventar elementi mövcud deyil.',
                    }}
                    createButton={{
                        label: 'Yeni İnventar',
                        href: '/rental-inventory/create',
                    }}
                    className="space-y-6"
                    fullWidth={true}
                    mobileClickable={true}
                    hideMobileActions={true}
                    selectable={true}
                    bulkActions={getBulkActions}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={(item: InventoryItem) => {
                        // Highlight rented items differently
                        if (item.status === 'rented') {
                            return 'bg-blue-50';
                        }
                        return '';
                    }}
                />
            </div>
        </AuthenticatedLayout>
    );
}
