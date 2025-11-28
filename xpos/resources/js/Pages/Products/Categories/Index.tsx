import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProductsNavigation from '@/Components/ProductsNavigation';
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

interface Props {
    categories: Category[];
}

export default function Index({ categories }: Props) {
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    const toggleExpanded = (categoryId: number) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const handleDelete = (category: Category) => {
        if (category.children && category.children.length > 0) {
            alert('Alt kateqoriyaları olan kateqoriya silinə bilməz.');
            return;
        }
        
        if (category.products && category.products.length > 0) {
            alert('Məhsulları olan kateqoriya silinə bilməz.');
            return;
        }

        if (confirm(`"${category.name}" kateqoriyasını silmək istədiyinizdən əminsiniz?`)) {
            router.delete(route('categories.destroy', category.id));
        }
    };

    const renderCategory = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const indent = level * 24;

        return (
            <div key={category.id}>
                <div 
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                    style={{ paddingLeft: `${16 + indent}px` }}
                >
                    <div className="flex items-center flex-1">
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpanded(category.id)}
                                className="mr-2 p-1 rounded hover:bg-gray-200"
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6 mr-2" />
                        )}
                        
                        <div className="mr-3">
                            {hasChildren ? (
                                isExpanded ? (
                                    <FolderOpenIcon className="w-5 h-5 text-blue-500" />
                                ) : (
                                    <FolderIcon className="w-5 h-5 text-blue-500" />
                                )
                            ) : (
                                <FolderIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <h3 className="text-sm font-medium text-gray-900">
                                    {category.name}
                                </h3>
                                
                                <div className="flex items-center space-x-2">
                                    {category.is_service && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            Xidmət
                                        </span>
                                    )}
                                    
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        category.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {category.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                    </span>
                                    
                                    {category.products && category.products.length > 0 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {category.products.length} məhsul
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {category.description && (
                                <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Link
                            href={`/categories/${category.id}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Bax"
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Link>
                        
                        <Link
                            href={`/categories/${category.id}/edit`}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Düzəlt"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </Link>
                        
                        <button
                            onClick={() => handleDelete(category)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Sil"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {hasChildren && isExpanded && category.children?.map(child => 
                    renderCategory(child, level + 1)
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kateqoriyalar" />

            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <ProductsNavigation currentRoute="categories" />
            </div>

            <div className="mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Məhsul Kateqoriyaları
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Məhsul və xidmət kateqoriyalarını idarə edin
                                </p>
                            </div>
                            <Link
                                href="/categories/create"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Yeni Kateqoriya
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <FolderIcon className="w-8 h-8 text-blue-500" />
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {categories.length}
                                        </div>
                                        <div className="text-sm text-blue-600">Ümumi kateqoriya</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <FolderOpenIcon className="w-8 h-8 text-green-500" />
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-green-600">
                                            {categories.filter(cat => cat.is_active).length}
                                        </div>
                                        <div className="text-sm text-green-600">Aktiv kateqoriya</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <FolderIcon className="w-8 h-8 text-purple-500" />
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {categories.filter(cat => cat.is_service).length}
                                        </div>
                                        <div className="text-sm text-purple-600">Xidmət kateqoriyası</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <FolderIcon className="w-8 h-8 text-orange-500" />
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {categories.filter(cat => !cat.is_service).length}
                                        </div>
                                        <div className="text-sm text-orange-600">Məhsul kateqoriyası</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories Tree */}
                        {categories.length > 0 ? (
                            <div className="bg-white border border-gray-200 rounded-lg">
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            Kateqoriya Ağacı
                                        </h3>
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={() => {
                                                    const allCategoryIds = new Set<number>();
                                                    const collectIds = (cats: Category[]) => {
                                                        cats.forEach(cat => {
                                                            if (cat.children && cat.children.length > 0) {
                                                                allCategoryIds.add(cat.id);
                                                                collectIds(cat.children);
                                                            }
                                                        });
                                                    };
                                                    collectIds(categories);
                                                    setExpandedCategories(allCategoryIds);
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Hamısını aç
                                            </button>
                                            <button
                                                onClick={() => setExpandedCategories(new Set())}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Hamısını bağla
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {categories
                                        .filter(category => !category.parent_id)
                                        .map(category => renderCategory(category))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Heç bir kateqoriya yoxdur</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    İlk kateqoriyanızı yaradaraq başlayın.
                                </p>
                                <div className="mt-6">
                                    <Link
                                        href="/categories/create"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        İlk kateqoriyanızı yaradın
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}