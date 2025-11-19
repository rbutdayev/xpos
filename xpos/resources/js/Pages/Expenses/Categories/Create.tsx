import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface ParentCategory {
    category_id: number;
    name: string;
}

interface Props {
    parentCategories: ParentCategory[];
    types: Record<string, string>;
}

interface CategoryFormData {
    name: string;
    type: string;
    parent_id: string;
    description: string;
}

export default function Create({ parentCategories, types }: Props) {
    const { data, setData, post, processing, errors } = useForm<CategoryFormData>({
        name: '',
        type: '',
        parent_id: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/expense-categories');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Yeni xərc kateqoriyası" />

            <div className="py-6">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                    Yeni xərc kateqoriyası
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
                                        {parentCategories.map((category) => (
                                            <option key={category.category_id} value={category.category_id}>
                                                {category.name}
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

                                {/* Submit Buttons */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
                                    <SecondaryButton className="w-full sm:w-auto">
                                        <Link href="/expense-categories">
                                            Ləğv et
                                        </Link>
                                    </SecondaryButton>

                                    <PrimaryButton
                                        className="w-full sm:w-auto"
                                        disabled={processing}
                                    >
                                        {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
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