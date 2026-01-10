import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    TagIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

interface RentalCategory {
    id: number;
    name_az: string;
    name_en: string | null;
    slug: string;
    color: string;
    description_az: string | null;
    description_en: string | null;
    is_active: boolean;
    sort_order: number;
    templates_count: number;
    created_at: string;
}

interface Props {
    categories: {
        data: RentalCategory[];
        links: any;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/rental-categories', { search, status }, { preserveState: true });
    };

    const toggleStatus = (category: RentalCategory) => {
        if (confirm(`${category.is_active ? 'Deaktiv' : 'Aktiv'} etmək istədiyinizdən əminsiniz?`)) {
            router.post(`/rental-categories/${category.id}/toggle-status`, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const deleteCategory = (category: RentalCategory) => {
        if (category.templates_count > 0) {
            alert('Bu kateqoriya istifadədə olduğu üçün silinə bilməz.');
            return;
        }

        if (confirm('Bu kateqoriyanı silmək istədiyinizdən əminsiniz?')) {
            router.delete(`/rental-categories/${category.id}`, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="İcarə Kateqoriyaları" />

            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <TagIcon className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                İcarə Kateqoriyaları
                            </h1>
                            <p className="text-sm text-gray-600">
                                Kateqoriyaları idarə edin
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/rental-categories/create"
                        className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Yeni Kateqoriya
                    </Link>
                </div>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Axtar..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Bütün statuslar</option>
                                <option value="active">Aktiv</option>
                                <option value="inactive">Deaktiv</option>
                            </select>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Axtar
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kateqoriya
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Şablonlar
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Əməliyyatlar
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.data.map((category) => (
                                    <tr key={category.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div
                                                    className="w-4 h-4 rounded-full mr-3"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {category.name_az}
                                                    </div>
                                                    {category.name_en && (
                                                        <div className="text-sm text-gray-500">
                                                            {category.name_en}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.slug}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.templates_count} şablon
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {category.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                    Aktiv
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <XCircleIcon className="w-4 h-4 mr-1" />
                                                    Deaktiv
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    href={`/rental-categories/${category.id}/edit`}
                                                    className="text-slate-600 hover:text-slate-900"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => toggleStatus(category)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    {category.is_active ? (
                                                        <XCircleIcon className="w-5 h-5" />
                                                    ) : (
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    )}
                                                </button>
                                                {category.templates_count === 0 && (
                                                    <button
                                                        onClick={() => deleteCategory(category)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {categories.total === 0 && (
                        <div className="text-center py-12">
                            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Kateqoriya tapılmadı
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Yeni kateqoriya yaratmaqla başlayın
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
