import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category } from '@/types';
import { 
    ArrowLeftIcon,
    PencilIcon,
    FolderIcon,
    CubeIcon,
    WrenchScrewdriverIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

interface Props {
    category: Category;
}

export default function Show({ category }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${category.name} - Kateqoriya`} />

            <div className="mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link
                            href="/categories"
                            className="mr-4 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                            <div className="flex items-center mt-1 space-x-3">
                                <div className="flex items-center">
                                    <FolderIcon className="w-4 h-4 text-blue-500 mr-1" />
                                    <span className="text-sm text-gray-600">Kateqoriya</span>
                                </div>
                                
                                {category.is_service && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Xidmət
                                    </span>
                                )}
                                
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    category.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {category.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <Link
                        href={`/categories/${category.id}/edit`}
                        className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600 active:bg-slate-800 focus:outline-none focus:border-slate-900 focus:ring ring-slate-300 disabled:opacity-25 transition ease-in-out duration-150"
                    >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Düzəlt
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Kateqoriya Məlumatları</h2>
                            </div>
                            <div className="p-6">
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Kateqoriya Adı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{category.name}</dd>
                                    </div>
                                    
                                    {category.parent && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Ana Kateqoriya</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <Link 
                                                    href={`/categories/${category.parent.id}`}
                                                    className="text-slate-600 hover:text-slate-800"
                                                >
                                                    {category.parent.name}
                                                </Link>
                                            </dd>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Növ</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {category.is_service ? 'Xidmət kateqoriyası' : 'Məhsul kateqoriyası'}
                                        </dd>
                                    </div>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Sıralama</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{category.sort_order}</dd>
                                    </div>
                                </dl>
                                
                                {category.description && (
                                    <div className="mt-6">
                                        <dt className="text-sm font-medium text-gray-500">Təsvir</dt>
                                        <dd className="mt-2 text-sm text-gray-900">{category.description}</dd>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Child Categories */}
                        {category.children && category.children.length > 0 && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Alt Kateqoriyalar ({category.children.length})
                                        </h2>
                                        <Link
                                            href="/categories/create"
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                        >
                                            <PlusIcon className="w-4 h-4 mr-1" />
                                            Yeni alt kateqoriya
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {category.children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={`/categories/${child.id}`}
                                                className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-center">
                                                    <FolderIcon className="w-5 h-5 text-blue-500 mr-3" />
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                                            {child.name}
                                                        </h3>
                                                        {child.description && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                {child.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center mt-2 space-x-2">
                                                            {child.is_service && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                    Xidmət
                                                                </span>
                                                            )}
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                                                child.is_active 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {child.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Products in this category */}
                        {category.products && category.products.length > 0 && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Bu Kateqoriyadakı {category.is_service ? 'Xidmətlər' : 'Məhsullar'} ({category.products.length})
                                        </h2>
                                        <Link
                                            href="/products/create"
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                        >
                                            <PlusIcon className="w-4 h-4 mr-1" />
                                            Yeni {category.is_service ? 'xidmət' : 'məhsul'}
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {category.products.map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/products/${product.id}`}
                                                className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-center">
                                                    {product.type === 'service' ? (
                                                        <WrenchScrewdriverIcon className="w-5 h-5 text-blue-500 mr-3" />
                                                    ) : (
                                                        <CubeIcon className="w-5 h-5 text-gray-500 mr-3" />
                                                    )}
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                                            {product.name}
                                                        </h3>
                                                        {product.sku && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                SKU: {product.sku}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center mt-2 space-x-2">
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                                                product.is_active 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {product.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Statistikalar</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Alt kateqoriyalar</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {category.children?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                        {category.is_service ? 'Xidmətlər' : 'Məhsullar'}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {category.products?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className={`text-sm font-medium ${
                                        category.is_active ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {category.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Tarixçə</h2>
                            </div>
                            <div className="p-6 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Yaradılıb</span>
                                    <span className="text-gray-900">
                                        {category.created_at && formatDate(category.created_at)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Son dəyişiklik</span>
                                    <span className="text-gray-900">
                                        {category.updated_at && formatDate(category.updated_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Əməliyyatlar</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <Link
                                    href={`/categories/${category.id}/edit`}
                                    className="block w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    Kateqoriyanı düzəlt
                                </Link>
                                
                                <Link
                                    href="/products/create"
                                    className="block w-full text-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    Bu kateqoriyaya {category.is_service ? 'xidmət' : 'məhsul'} əlavə et
                                </Link>
                                
                                <Link
                                    href="/categories"
                                    className="block w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    Bütün kateqoriyalara qayıt
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}