import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface ExpenseCategory {
    category_id: number;
    name: string;
    type: string;
    parent_id: number | null;
    description: string | null;
    is_active: boolean;
}

interface ParentCategory {
    category_id: number;
    name: string;
}

interface Props {
    category: ExpenseCategory;
    parentCategories: ParentCategory[];
    types: Record<string, string>;
}

interface CategoryFormData {
    name: string;
    type: string;
    parent_id: string;
    description: string;
    is_active: boolean;
}

export default function Edit({ category, parentCategories, types }: Props) {
    const { data, setData, put, processing, errors } = useForm<CategoryFormData>({
        name: category.name || '',
        type: category.type || '',
        parent_id: category.parent_id?.toString() || '',
        description: category.description || '',
        is_active: category.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/expense-categories/${category.category_id}`);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Xərc kateqoriyasını düzəliş et" />

            <div className="py-6">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-semibold text-gray-900">
                                    Xərc kateqoriyasını düzəliş et
                                </h1>
                                <Link
                                    href="/expense-categories"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    ← Kateqoriyalara qayıt
                                </Link>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Name */}
                                <div>
                                    <InputLabel htmlFor="name" value="Kateqoriya adı *" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Kateqoriya adını daxil edin"
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                {/* Type */}
                                <div>
                                    <InputLabel htmlFor="type" value="Növ *" />
                                    <select
                                        id="type"
                                        name="type"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    >
                                        <option value="">Növ seçin</option>
                                        {Object.entries(types).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.type} className="mt-2" />
                                </div>

                                {/* Parent Category */}
                                <div>
                                    <InputLabel htmlFor="parent_id" value="Ana kateqoriya" />
                                    <select
                                        id="parent_id"
                                        name="parent_id"
                                        value={data.parent_id}
                                        onChange={(e) => setData('parent_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    >
                                        <option value="">Ana kateqoriya seçin (istəyə bağlı)</option>
                                        {parentCategories.map((parentCategory) => (
                                            <option key={parentCategory.category_id} value={parentCategory.category_id}>
                                                {parentCategory.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.parent_id} className="mt-2" />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Alt kateqoriya yaratmaq üçün ana kateqoriya seçin
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <InputLabel htmlFor="description" value="Təsvir" />
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        placeholder="Kateqoriya haqqında əlavə məlumat (istəyə bağlı)"
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>

                                {/* Active Status */}
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">Aktiv kateqoriya</span>
                                    </label>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Deaktiv kateqoriyalar yeni xərclər üçün istifadə edilə bilməz
                                    </p>
                                    <InputError message={errors.is_active} className="mt-2" />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-between pt-4">
                                    <SecondaryButton>
                                        <Link href="/expense-categories">
                                            Ləğv et
                                        </Link>
                                    </SecondaryButton>

                                    <PrimaryButton
                                        className="ms-4"
                                        disabled={processing}
                                    >
                                        {processing ? 'Yenilənir...' : 'Yenilə'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}