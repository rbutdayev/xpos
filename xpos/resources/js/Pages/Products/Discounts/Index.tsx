import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { TagIcon } from '@heroicons/react/24/outline';

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
        links: any;
        current_page: number;
        last_page: number;
    };
    branches: Branch[];
    filters: {
        branch_id?: string;
        tab?: string;
    };
}

export default function Index({ auth, products, branches, filters }: Props) {
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

    const handleReEnable = (productId: number) => {
        router.visit(route('products.show', productId));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Endirimlər" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Tabs - Enterprise Style */}
                    <div className="mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            <nav className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => handleTabChange('active')}
                                    className={`
                                        relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                        font-medium text-sm transition-all duration-200 ease-in-out
                                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
                                        ${activeTab === 'active'
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 transform scale-[1.02]'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                                        }
                                    `}
                                >
                                    <TagIcon className={`h-5 w-5 ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="font-semibold">Aktiv Endirimlər</span>
                                    {activeTab === 'active' && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleTabChange('history')}
                                    className={`
                                        relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                        font-medium text-sm transition-all duration-200 ease-in-out
                                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
                                        ${activeTab === 'history'
                                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 transform scale-[1.02]'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                                        }
                                    `}
                                >
                                    <svg className={`h-5 w-5 ${activeTab === 'history' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold">Tarixçə</span>
                                    {activeTab === 'history' && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
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
                        </div>
                    </div>

                    {/* Products Grid */}
                    {products.data.length === 0 ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-12 text-center">
                                <TagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {activeTab === 'active' ? 'Endirimli məhsul yoxdur' : 'Tarixçə yoxdur'}
                                </h3>
                                <p className="text-gray-600">
                                    {activeTab === 'active'
                                        ? 'Seçilmiş filial üçün hal-hazırda aktiv endirim yoxdur.'
                                        : 'Seçilmiş filial üçün bitmiş endirim yoxdur.'
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.data.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            {/* Product Info */}
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    {product.sku && (
                                                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                            {product.sku}
                                                        </span>
                                                    )}
                                                    {product.category && (
                                                        <span className="text-gray-500">
                                                            {product.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Discount Badge */}
                                            <div className="mb-4">
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
                                            </div>

                                            {/* Pricing */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Orijinal qiymət:</span>
                                                    <span className="text-sm text-gray-500 line-through">
                                                        {Number(product.original_price).toFixed(2)} AZN
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">Endirimli qiymət:</span>
                                                    <span className="text-xl font-bold text-green-600">
                                                        {Number(product.discounted_price).toFixed(2)} AZN
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                                    <span className="text-sm text-gray-600">Qənaət:</span>
                                                    <span className="text-sm font-semibold text-green-600">
                                                        {Number(product.savings).toFixed(2)} AZN
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Date & Branch Info */}
                                            <div className="space-y-1 text-xs text-gray-500 border-t border-gray-200 pt-3">
                                                <div className="flex items-center justify-between">
                                                    <span>Filial:</span>
                                                    <span className="font-medium text-gray-700">
                                                        {product.branch_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Başlanğıc:</span>
                                                    <span>{formatDate(product.effective_from)}</span>
                                                </div>
                                                {product.effective_until && (
                                                    <div className="flex items-center justify-between">
                                                        <span>Bitmə:</span>
                                                        <span>{formatDate(product.effective_until)}</span>
                                                    </div>
                                                )}
                                                {!product.effective_until && (
                                                    <div className="text-center text-blue-600 font-medium">
                                                        Müddətsiz
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action */}
                                            <div className="mt-4">
                                                <a
                                                    href={route('products.show', product.id)}
                                                    className={`block w-full text-center px-4 py-2 rounded-md transition-colors ${
                                                        activeTab === 'history'
                                                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                                                            : 'bg-green-600 text-white hover:bg-green-700'
                                                    }`}
                                                >
                                                    {activeTab === 'history' ? 'Yenidən aktivləşdir' : 'Məhsula bax'}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {products.last_page > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <div className="flex gap-2">
                                        {products.links.map((link: any, index: number) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (link.url) {
                                                        router.get(link.url);
                                                    }
                                                }}
                                                disabled={!link.url}
                                                className={`px-4 py-2 rounded-md ${
                                                    link.active
                                                        ? 'bg-green-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
