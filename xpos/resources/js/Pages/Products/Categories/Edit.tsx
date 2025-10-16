import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category } from '@/types';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props {
    category: Category;
    parentCategories: Category[];
}

interface CategoryFormData {
    name: string;
    parent_id: string;
    description: string;
    is_service: boolean;
    sort_order: string;
    is_active: boolean;
}

export default function Edit({ category, parentCategories }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm<CategoryFormData>({
        name: category.name || '',
        parent_id: category.parent_id?.toString() || '',
        description: category.description || '',
        is_service: category.is_service || false,
        sort_order: category.sort_order?.toString() || '',
        is_active: category.is_active !== undefined ? category.is_active : true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('categories.update', category.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${category.name} - Düzəlt`} />

            <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Link
                                    href={`/categories/${category.id}`}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        Kateqoriyanı Düzəlt
                                    </h2>
                                    <p className="text-gray-600">{category.name}</p>
                                </div>
                            </div>
                            
                            <Link
                                href={`/categories/${category.id}`}
                                className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                            >
                                <EyeIcon className="w-4 h-4 mr-2" />
                                Bax
                            </Link>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əsas Məlumatlar
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="name" value="Kateqoriya Adı *" />
                                        <TextInput
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={data.name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="parent_id" value="Ana Kateqoriya" />
                                        <select
                                            id="parent_id"
                                            name="parent_id"
                                            value={data.parent_id}
                                            onChange={(e) => setData('parent_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        >
                                            <option value="">Ana kateqoriya seç (isteğe bağlı)</option>
                                            {parentCategories.map((parentCategory) => (
                                                <option key={parentCategory.id} value={parentCategory.id}>
                                                    {parentCategory.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.parent_id} className="mt-2" />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Alt kateqoriya yaratmaq üçün ana kateqoriya seçin
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="description" value="Təsvir" />
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            placeholder="Kateqoriya haqqında qısa məlumat..."
                                        />
                                        <InputError message={errors.description} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Ayarlar
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Kateqoriya aktiv
                                            </span>
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Qeyri-aktiv kateqoriyalar yeni məhsul əlavə edərkən görünməz
                                        </p>
                                    </div>

                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_service}
                                                onChange={(e) => setData('is_service', e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Bu kateqoriya xidmətlər üçündür
                                            </span>
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Xidmət kateqoriyalarında stok idarəetməsi olmur
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="sort_order" value="Sıralama" />
                                        <TextInput
                                            id="sort_order"
                                            type="number"
                                            name="sort_order"
                                            value={data.sort_order}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('sort_order', e.target.value)}
                                            min="0"
                                        />
                                        <InputError message={errors.sort_order} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Kiçik rəqəm daha yuxarıda görünür
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Current Status */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Hazırkı Vəziyyət
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Alt kateqoriyalar:</span>
                                        <span className="ml-2 text-gray-600">
                                            {category.children?.length || 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Məhsullar:</span>
                                        <span className="ml-2 text-gray-600">
                                            {category.products?.length || 0}
                                        </span>
                                    </div>
                                </div>
                                
                                {(category.children && category.children.length > 0) || (category.products && category.products.length > 0) ? (
                                    <div className="mt-3">
                                        <p className="text-sm text-blue-600">
                                            ⚠️ Bu kateqoriyanın alt kateqoriyaları və ya məhsulları var. 
                                            Dəyişikliklər onlara da təsir edə bilər.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <p className="text-sm text-green-600">
                                            ✓ Bu kateqoriyada hələ heç bir alt kateqoriya və ya məhsul yoxdur.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end space-x-2 pt-6 border-t border-gray-200">
                                <Link
                                    href={`/categories/${category.id}`}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Ləğv et
                                </Link>
                                <PrimaryButton className="ml-4" disabled={processing}>
                                    {processing ? 'Yadda saxlanır...' : 'Dəyişiklikləri Yadda Saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}