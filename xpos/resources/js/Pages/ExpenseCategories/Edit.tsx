import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface ExpenseCategory {
    id: number;
    name: string;
    description: string | null;
}

interface Props {
    expense_category: ExpenseCategory;
}

interface CategoryFormData {
    name: string;
    description: string;
}

export default function Edit({ expense_category }: Props) {
    const { data, setData, put, processing, errors } = useForm<CategoryFormData>({
        name: expense_category.name || '',
        description: expense_category.description || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/expense-categories/${expense_category.id}`);
    };

    return (
        <AuthenticatedLayout
        >
            <Head title="Xərc Kateqoriyasını Düzəliş Et" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Category Name */}
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
                                    placeholder="Kateqoriyanın təsvirini daxil edin (istəyə bağlı)"
                                />
                                <InputError message={errors.description} className="mt-2" />
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
        </AuthenticatedLayout>
    );
}