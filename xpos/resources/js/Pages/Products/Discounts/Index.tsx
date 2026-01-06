import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { TagIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import SharedDataTable, { BulkAction, Column } from '@/Components/SharedDataTable';

interface DiscountedProduct {
    id: number;
    name: string;
    sku: string;
    category: string | null;
    original_price: number;
    discount_percentage: number;
    discounted_price: number;
    savings: number;
    effective_from: string;
    effective_until: string | null;
    branch_name: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Props extends PageProps {
    products: {
        data: DiscountedProduct[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    branches: Branch[];
    filters: {
        branch_id?: string;
        tab?: string;
    };
}

export default function Index({ auth, products, branches, filters, discountsEnabled }: Props) {
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
    const [activeTab, setActiveTab] = useState(filters.tab || 'active');

    const handleBranchChange = (branchId: string) => {
        setSelectedBranch(branchId);
        router.get(route('products.discounts'), {
            branch_id: branchId || undefined,
            tab: activeTab
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.get(route('products.discounts'), {
            branch_id: selectedBranch || undefined,
            tab: tab
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Handle double-click to view product
    const handleRowDoubleClick = (product: DiscountedProduct) => {
        router.visit(route('products.show', product.id));
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} məhsulun endirimini silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.delete(route('products.discounts.bulk-delete' as any), {
            data: { ids: selectedIds },
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
    const getBulkActions = (selectedIds: (string | number)[], selectedProducts: DiscountedProduct[]): BulkAction[] => {
        // If only ONE product is selected, show individual actions
        if (selectedIds.length === 1 && selectedProducts.length === 1) {
            const product = selectedProducts[0];

            return [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('products.show', product.id))
                },
                {
                    label: 'Redaktə et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('products.show', product.id))
                },
                {
                    label: 'Endirimi sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm('Bu məhsulun endirimini silmək istədiyinizə əminsiniz?')) {
                            router.delete(route('products.discounts.bulk-delete' as any), {
                                data: { ids: [product.id] },
                            });
                        }
                    }
                }
            ];
        }

        // Multiple products selected - show bulk actions
        return [
            {
                label: 'Endirimi toplu sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    // Table columns configuration
    const columns: Column[] = [
        {
            key: 'name',
            label: 'Məhsul',
            sortable: false,
            render: (product: DiscountedProduct) => (
                <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    {product.sku && (
                        <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    )}
                    {product.category && (
                        <div className="text-xs text-gray-400">{product.category}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'discount',
            label: 'Endirim',
            sortable: false,
            render: (product: DiscountedProduct) => (
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full">
                        <TagIcon className="w-5 h-5 text-red-600" />
                        <span className="text-lg font-bold text-red-600">
                            -{product.discount_percentage}%
                        </span>
                    </div>
                    {activeTab === 'history' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-600 text-white rounded-full">
                            Vaxtı keçib
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'pricing',
            label: 'Qiymət',
            sortable: false,
            render: (product: DiscountedProduct) => (
                <div className="space-y-1">
                    <div className="text-sm text-gray-500">
                        <span className="line-through">{Number(product.original_price).toFixed(2)} AZN</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                        {Number(product.discounted_price).toFixed(2)} AZN
                    </div>
                    <div className="text-xs text-green-600">
                        Qənaət: {Number(product.savings).toFixed(2)} AZN
                    </div>
                </div>
            ),
        },
        {
            key: 'dates',
            label: 'Tarixlər',
            hideOnMobile: true,
            sortable: false,
            render: (product: DiscountedProduct) => (
                <div className="text-sm space-y-1">
                    <div>
                        <span className="text-gray-600">Başlanğıc: </span>
                        <span className="text-gray-900">{formatDate(product.effective_from)}</span>
                    </div>
                    {product.effective_until ? (
                        <div>
                            <span className="text-gray-600">Bitmə: </span>
                            <span className="text-gray-900">{formatDate(product.effective_until)}</span>
                        </div>
                    ) : (
                        <div className="text-blue-600 font-medium">Müddətsiz</div>
                    )}
                </div>
            ),
        },
        {
            key: 'branch',
            label: 'Filial',
            hideOnMobile: true,
            sortable: false,
            render: (product: DiscountedProduct) => (
                <span className="text-sm text-gray-900">{product.branch_name}</span>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Endirimlər" />
            <div className="py-12">
                <div className="w-full">
                    {/* Filter Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700">
                                        Filial:
                                    </label>
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => handleBranchChange(e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="">Bütün filiallar</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleTabChange('active')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === 'active'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Aktiv
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('history')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === 'history'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Tarixçə
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <SharedDataTable
                        data={products as any}
                        columns={columns}
                        selectable={true}
                        bulkActions={getBulkActions}
                        emptyState={{
                            icon: <TagIcon className="w-12 h-12" />,
                            title: activeTab === 'active' ? 'Endirimli məhsul yoxdur' : 'Tarixçə yoxdur',
                            description: activeTab === 'active'
                                ? 'Seçilmiş filial üçün hal-hazırda aktiv endirim yoxdur.'
                                : 'Seçilmiş filial üçün bitmiş endirim yoxdur.'
                        }}
                        fullWidth={true}
                        dense={false}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={(product: DiscountedProduct) =>
                            'cursor-pointer hover:bg-blue-50 transition-all duration-200'
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
