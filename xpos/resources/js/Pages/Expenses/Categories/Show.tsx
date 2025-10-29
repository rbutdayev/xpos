import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { TagIcon, FolderIcon, CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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
    children: {
        category_id: number;
        name: string;
        is_active: boolean;
    }[];
    expenses: any[];
    created_at: string;
    updated_at: string;
}

interface Props {
    category: ExpenseCategory;
    types: Record<string, string>;
}

export default function Show({ category, types }: Props) {
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ');
    };

    const handleDelete = () => {
        if (category.children.length > 0) {
            alert('Alt kateqoriyaları olan kateqoriya silinə bilməz.');
            return;
        }
        
        if (category.expenses.length > 0) {
            alert('Xərcləri olan kateqoriya silinə bilməz.');
            return;
        }
        
        if (confirm('Bu kateqoriyanı silmək istədiyinizə əminsiniz?')) {
            router.delete(`/expense-categories/${category.category_id}`);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Kateqoriya - ${category.name}`} />

            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center">
                                    {category.parent ? (
                                        <TagIcon className="w-8 h-8 text-gray-400 mr-3" />
                                    ) : (
                                        <FolderIcon className="w-8 h-8 text-gray-400 mr-3" />
                                    )}
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {category.name}
                                        </h1>
                                        <div className="flex items-center gap-3 mt-1">
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
                                            {category.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                    Aktiv
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircleIcon className="w-3 h-3 mr-1" />
                                                    Deaktiv
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <Link
                                        href={`/expense-categories/${category.category_id}/edit`}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        Düzəliş et
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <TrashIcon className="w-4 h-4 mr-2" />
                                        Sil
                                    </button>
                                    <Link
                                        href="/expense-categories"
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        ← Kateqoriyalara qayıt
                                    </Link>
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        Əsas məlumatlar
                                    </h3>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Kateqoriya adı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{category.name}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Növ</dt>
                                        <dd className="mt-1">
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
                                        </dd>
                                    </div>

                                    {category.parent && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Ana kateqoriya</dt>
                                            <dd className="mt-1">
                                                <Link 
                                                    href={`/expense-categories/${category.parent.category_id}`}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    {category.parent.name}
                                                </Link>
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">
                                            {category.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                    Aktiv
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircleIcon className="w-3 h-3 mr-1" />
                                                    Deaktiv
                                                </span>
                                            )}
                                        </dd>
                                    </div>

                                    {category.description && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Təsvir</dt>
                                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                                {category.description}
                                            </dd>
                                        </div>
                                    )}
                                </div>

                                {/* Statistics and Relations */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        Statistikalar və əlaqələr
                                    </h3>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Alt kateqoriyalar</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {category.children.length} ədəd
                                        </dd>
                                    </div>

                                    {category.children.length > 0 && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 mb-2">Alt kateqoriyalar siyahısı</dt>
                                            <dd className="space-y-1">
                                                {category.children.map((child) => (
                                                    <div key={child.category_id} className="flex items-center justify-between">
                                                        <Link 
                                                            href={`/expense-categories/${child.category_id}`}
                                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                                        >
                                                            {child.name}
                                                        </Link>
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                            child.is_active 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {child.is_active ? 'Aktiv' : 'Deaktiv'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Ümumi xərclər</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {category.expenses.length} ədəd
                                        </dd>
                                    </div>
                                </div>
                            </div>

                            {/* System Information */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem məlumatları</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <dt className="font-medium">Yaradılma tarixi</dt>
                                        <dd>{formatDateTime(category.created_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">Son yeniləmə</dt>
                                        <dd>{formatDateTime(category.updated_at)}</dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}