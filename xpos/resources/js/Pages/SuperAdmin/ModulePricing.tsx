import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Module {
    id: string;
    name: string;
    price: number;
    is_paid: boolean;
    updated_at: string;
}

interface Props {
    modules: Module[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ModulePricing({ modules = [], flash }: Props) {
    const [editingModule, setEditingModule] = useState<Module | null>(null);

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        price: '',
    });

    const handleEditModule = (module: Module) => {
        setEditingModule(module);
        setEditData({
            price: module.price.toString(),
        });
    };

    const handleUpdatePrice = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingModule) {
            router.put(`/admin/module-pricing/${editingModule.id}`, {
                monthly_price: parseFloat(editData.price),
            }, {
                onSuccess: () => {
                    setEditingModule(null);
                    resetEdit();
                },
                preserveScroll: true,
            });
        }
    };

    // Handle double-click to edit module
    const handleRowDoubleClick = (module: Module) => {
        handleEditModule(module);
    };

    // Get bulk actions - only show edit for single selection
    const getBulkActions = (selectedIds: (string | number)[], selectedModules: Module[]): BulkAction[] => {
        if (selectedIds.length === 1 && selectedModules.length === 1) {
            const module = selectedModules[0];

            return [
                {
                    label: 'Qiyməti Redaktə Et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => handleEditModule(module)
                }
            ];
        }

        return [];
    };

    // Define table columns
    const tableColumns = [
        {
            key: 'name',
            label: 'Modul Adı',
            sortable: true,
            render: (module: Module) => (
                <div className="text-sm font-medium text-gray-900">
                    {module.name}
                </div>
            )
        },
        {
            key: 'price',
            label: 'Aylıq Qiymət',
            sortable: true,
            render: (module: Module) => (
                <div className="text-sm text-gray-900">
                    {module.price > 0 ? `${module.price} ₼/ay` : 'Pulsuz'}
                </div>
            )
        },
        {
            key: 'is_paid',
            label: 'Status',
            sortable: true,
            render: (module: Module) => (
                module.is_paid ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200">
                        <CheckCircleIcon className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">Ödənişli</span>
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 border border-green-200">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Pulsuz</span>
                    </span>
                )
            )
        },
        {
            key: 'updated_at',
            label: 'Son Yenilənmə',
            sortable: true,
            render: (module: Module) => (
                <div className="text-sm text-gray-600">
                    {new Date(module.updated_at).toLocaleDateString('az-AZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </div>
            )
        }
    ];

    // Prepare data for SharedDataTable
    const paginatedData = {
        data: modules,
        links: [],
        current_page: 1,
        last_page: 1,
        total: modules.length,
        per_page: modules.length,
        from: 1,
        to: modules.length
    };

    return (
        <SuperAdminLayout title="Modul Qiymətləri">
            <Head title="Modul Qiymətləri" />

            {flash?.success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Uğurlu</h3>
                            <div className="mt-2 text-sm text-green-700">{flash.success}</div>
                        </div>
                    </div>
                </div>
            )}

            {flash?.error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Xəta</h3>
                            <div className="mt-2 text-sm text-red-700">{flash.error}</div>
                        </div>
                    </div>
                </div>
            )}

                    {/* Edit Price Modal */}
                    {editingModule && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Qiyməti Redaktə Et
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {editingModule.name}
                                    </p>
                                    <form onSubmit={handleUpdatePrice} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Aylıq Qiymət (₼) *
                                            </label>
                                            <TextInput
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editData.price}
                                                onChange={(e) => setEditData('price', e.target.value)}
                                                className={editErrors.price ? 'border-red-500' : ''}
                                                required
                                            />
                                            {editErrors.price && <span className="text-red-500 text-xs">{editErrors.price}</span>}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Minimum qiymət 0 ₼
                                            </p>
                                        </div>

                                        <div className="flex justify-end space-x-2">
                                            <SecondaryButton
                                                type="button"
                                                onClick={() => {
                                                    setEditingModule(null);
                                                    resetEdit();
                                                }}
                                            >
                                                Ləğv et
                                            </SecondaryButton>
                                            <PrimaryButton type="submit" disabled={editProcessing}>
                                                {editProcessing ? 'Yenilənir...' : 'Qiyməti Yadda Saxla'}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modules Table */}
                    <SharedDataTable
                        data={paginatedData as any}
                        columns={tableColumns as any}
                        selectable={true}
                        bulkActions={getBulkActions}
                        title="Modul Qiymətləri"
                        subtitle={`${modules.length} cəmi`}
                        emptyState={{
                            icon: <XCircleIcon className="w-12 h-12" />,
                            title: 'Məlumat yoxdur',
                            description: 'Heç bir nəticə tapılmadı'
                        }}
                        fullWidth={true}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={() =>
                            `cursor-pointer hover:bg-blue-50 transition-all duration-200`
                        }
                    />
        </SuperAdminLayout>
    );
}
