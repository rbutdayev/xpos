import { useState, FormEventHandler } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    TagIcon,
    ArrowLeftIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface RentalCategory {
    id?: number;
    name_az: string;
    name_en: string | null;
    slug: string;
    color: string;
    description_az: string | null;
    description_en: string | null;
    is_active: boolean;
    sort_order: number;
}

interface Props {
    category: RentalCategory | null;
}

export default function Form({ category }: Props) {
    const [activeTab, setActiveTab] = useState<'az' | 'en'>('az');
    const isEditing = !!category;

    const formData: any = {
        name_az: category?.name_az || '',
        name_en: category?.name_en || '',
        slug: category?.slug || '',
        color: category?.color || '#3B82F6',
        description_az: category?.description_az || '',
        description_en: category?.description_en || '',
        is_active: category?.is_active ?? true,
        sort_order: category?.sort_order || 0,
    };

    const { data, setData: setDataOriginal, post, put, processing, errors } = useForm(formData);
    const setData = setDataOriginal as any;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing && category) {
            put(`/rental-categories/${category.id}`);
        } else {
            post('/rental-categories');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEditing ? 'Kateqoriyanı Düzəlt' : 'Yeni Kateqoriya'} />

            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => router.get('/rental-categories')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Geri
                    </button>
                    <div className="flex items-center">
                        <TagIcon className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Kateqoriyanı Düzəlt' : 'Yeni Kateqoriya'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                İcarə kateqoriyasını konfiqurasiya edin
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Əsas Məlumat
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ad (AZ) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name_az}
                                    onChange={(e) => setData('name_az', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    required
                                />
                                {errors.name_az && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name_az}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ad (EN)
                                </label>
                                <input
                                    type="text"
                                    value={data.name_en || ''}
                                    onChange={(e) => setData('name_en', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                />
                                {errors.name_en && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name_en}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    placeholder="Boş buraxsanız avtomatik yaranacaq"
                                />
                                {errors.slug && (
                                    <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    URL-uyğun identifikator (məs: paltar, elektronika)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rəng
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                        placeholder="#3B82F6"
                                    />
                                </div>
                                {errors.color && (
                                    <p className="mt-1 text-sm text-red-600">{errors.color}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sıra
                                </label>
                                <input
                                    type="number"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                />
                                {errors.sort_order && (
                                    <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                    Aktiv
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('az')}
                                    className={`px-6 py-3 text-sm font-medium ${
                                        activeTab === 'az'
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Azərbaycan dili
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('en')}
                                    className={`px-6 py-3 text-sm font-medium ${
                                        activeTab === 'en'
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    English
                                </button>
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'az' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Təsvir (AZ)
                                    </label>
                                    <textarea
                                        value={data.description_az || ''}
                                        onChange={(e) => setData('description_az', e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    />
                                    {errors.description_az && (
                                        <p className="mt-1 text-sm text-red-600">{errors.description_az}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Təsvir (EN)
                                    </label>
                                    <textarea
                                        value={data.description_en || ''}
                                        onChange={(e) => setData('description_en', e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    />
                                    {errors.description_en && (
                                        <p className="mt-1 text-sm text-red-600">{errors.description_en}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => router.get('/rental-categories')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                            <XMarkIcon className="w-4 h-4 mr-2" />
                            Ləğv Et
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-slate-700 border border-transparent rounded-md text-sm font-medium text-white hover:bg-slate-600 flex items-center disabled:opacity-50"
                        >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            {processing ? 'Saxlanılır...' : 'Saxla'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
