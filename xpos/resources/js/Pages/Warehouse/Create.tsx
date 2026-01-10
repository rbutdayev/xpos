import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { Branch } from '@/types';

interface Props {
    branches: Branch[];
}

export default function Create({ branches }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'auxiliary' as 'main' | 'auxiliary' | 'mobile',
        location: '',
        description: '',
        branch_permissions: [] as Array<{
            branch_id: number;
            can_transfer: boolean;
            can_view_stock: boolean;
            can_modify_stock: boolean;
            can_receive_stock: boolean;
            can_issue_stock: boolean;
        }>
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('warehouses.store'));
    };

    const updateBranchPermission = (branchId: number, permission: string, value: boolean) => {
        const updatedPermissions = [...data.branch_permissions];
        const existingIndex = updatedPermissions.findIndex(p => p.branch_id === branchId);
        
        if (existingIndex >= 0) {
            updatedPermissions[existingIndex] = {
                ...updatedPermissions[existingIndex],
                [permission]: value
            };
        } else {
            updatedPermissions.push({
                branch_id: branchId,
                can_transfer: permission === 'can_transfer' ? value : false,
                can_view_stock: permission === 'can_view_stock' ? value : false,
                can_modify_stock: permission === 'can_modify_stock' ? value : false,
                can_receive_stock: permission === 'can_receive_stock' ? value : false,
                can_issue_stock: permission === 'can_issue_stock' ? value : false,
            });
        }
        
        setData('branch_permissions', updatedPermissions);
    };

    const getBranchPermission = (branchId: number, permission: string): boolean => {
        const branchPerm = data.branch_permissions.find(p => p.branch_id === branchId);
        return branchPerm ? (branchPerm as any)[permission] : false;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Yeni Anbar" />

            <div className="px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center mb-2">
                        <BuildingStorefrontIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-3" />
                        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Yeni Anbar</h1>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">Yeni anbar yaradın və məlumatları doldurun</p>
                </div>

                {/* Form */}
                <div className="bg-white shadow-sm sm:rounded-lg">
                    <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Əsas Məlumatlar
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Anbar Adı *" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Məsələn: Mərkəzi Anbar"
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="type" value="Anbar Növü *" />
                                    <select
                                        id="type"
                                        className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value as 'main' | 'auxiliary' | 'mobile')}
                                        required
                                    >
                                        <option value="main">Əsas Anbar</option>
                                        <option value="auxiliary">Köməkçi Anbar</option>
                                        <option value="mobile">Mobil Anbar</option>
                                    </select>
                                    <InputError message={errors.type} className="mt-2" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="location" value="Yer/Ünvan" />
                                    <TextInput
                                        id="location"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="Anbarın yer/ünvanını daxil edin"
                                    />
                                    <InputError message={errors.location} className="mt-2" />
                                </div>

                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Təsvir
                            </h3>
                            
                            <div>
                                <InputLabel htmlFor="description" value="Anbar Təsviri" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder="Anbar haqqında əlavə məlumatlar"
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        {/* Branch Permissions */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Filial İcazələri
                            </h3>
                            
                            {branches.length > 0 ? (
                                <div className="space-y-4">
                                    {branches.map((branch) => (
                                        <div key={branch.id} className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">
                                                {branch.name}
                                                {branch.is_main && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Əsas
                                                    </span>
                                                )}
                                            </h4>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`branch_${branch.id}_view`}
                                                        checked={getBranchPermission(branch.id, 'can_view_stock')}
                                                        onChange={(e) => updateBranchPermission(branch.id, 'can_view_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`branch_${branch.id}_view`} className="ml-2 text-sm text-gray-700">
                                                        Görüntülə
                                                    </label>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`branch_${branch.id}_modify`}
                                                        checked={getBranchPermission(branch.id, 'can_modify_stock')}
                                                        onChange={(e) => updateBranchPermission(branch.id, 'can_modify_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`branch_${branch.id}_modify`} className="ml-2 text-sm text-gray-700">
                                                        Dəyişdir
                                                    </label>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`branch_${branch.id}_transfer`}
                                                        checked={getBranchPermission(branch.id, 'can_transfer')}
                                                        onChange={(e) => updateBranchPermission(branch.id, 'can_transfer', e.target.checked)}
                                                    />
                                                    <label htmlFor={`branch_${branch.id}_transfer`} className="ml-2 text-sm text-gray-700">
                                                        Transfer
                                                    </label>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`branch_${branch.id}_receive`}
                                                        checked={getBranchPermission(branch.id, 'can_receive_stock')}
                                                        onChange={(e) => updateBranchPermission(branch.id, 'can_receive_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`branch_${branch.id}_receive`} className="ml-2 text-sm text-gray-700">
                                                        Qəbul
                                                    </label>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id={`branch_${branch.id}_issue`}
                                                        checked={getBranchPermission(branch.id, 'can_issue_stock')}
                                                        onChange={(e) => updateBranchPermission(branch.id, 'can_issue_stock', e.target.checked)}
                                                    />
                                                    <label htmlFor={`branch_${branch.id}_issue`} className="ml-2 text-sm text-gray-700">
                                                        Buraxma
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <p>Əvvəlcə filial yaratmalısınız</p>
                                    <Link 
                                        href={route('branches.create')}
                                        className="text-blue-600 hover:underline mt-2 inline-block"
                                    >
                                        Filial yarat
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                            <Link
                                href={route('warehouses.index')}
                                className="w-full sm:w-auto"
                            >
                                <SecondaryButton type="button" className="w-full sm:w-auto">
                                    Ləğv et
                                </SecondaryButton>
                            </Link>
                            
                            <PrimaryButton disabled={processing} className="w-full sm:w-auto">
                                {processing ? 'Saxlanılır...' : 'Anbarı Saxla'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}