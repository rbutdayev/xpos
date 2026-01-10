import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Company } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props {
    company: Company;
}

interface CompanyFormData {
    name: string;
    address: string;
    tax_number: string;
    phone: string;
    email: string;
    website: string;
    description: string;
    default_language: string;
    logo: File | null;
}

export default function Edit({ company }: Props) {
    const { data, setData, put, processing, errors } = useForm<CompanyFormData>({
        name: company.name || '',
        address: company.address || '',
        tax_number: company.tax_number || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        description: company.description || '',
        default_language: company.default_language || 'az',
        logo: null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // For file uploads with PUT, use post with _method override
        if (data.logo) {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('address', data.address);
            formData.append('tax_number', data.tax_number);
            formData.append('phone', data.phone);
            formData.append('email', data.email);
            formData.append('website', data.website);
            formData.append('description', data.description);
            formData.append('default_language', data.default_language);
            formData.append('logo', data.logo);
            formData.append('_method', 'PUT');
            
            router.post(route('companies.update', company.id), formData);
        } else {
            put(route('companies.update', company.id));
        }
    };

    const languageOptions = [
        { value: 'az', label: 'Azərbaycan dili' },
        { value: 'en', label: 'English' },
        { value: 'tr', label: 'Türkçe' }
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`Düzəlt: ${company.name}`} />

            <div className="px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Link
                                    href={route('companies.show', company.id)}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        Şirkəti Düzəlt
                                    </h2>
                                    <p className="text-gray-600">{company.name} şirkətinin məlumatlarını yeniləyin</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əsas Məlumatlar
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="name" value="Şirkət Adı *" />
                                        <TextInput
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={data.name}
                                            className="mt-1 block w-full bg-gray-100 cursor-not-allowed"
                                            disabled
                                            required
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            ⚠️ Şirkət adı dəyişdirilə bilməz. Dəyişiklik etmək üçün admin ilə əlaqə saxlayın.
                                        </p>
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    {/* Current Logo */}
                                    {company.logo_path && (
                                        <div className="md:col-span-2">
                                            <InputLabel value="Cari loqo" />
                                            <div className="mt-1 p-4 bg-white border border-gray-300 rounded-md flex justify-center">
                                                <img 
                                                    src={company.logo_url || `/storage/${company.logo_path}`}
                                                    alt="Şirkət loqosu"
                                                    className="h-24 w-auto max-w-full object-contain"
                                                    onError={(e) => {
                                                        // Fallback to storage path if logo_url fails
                                                        const target = e.target as HTMLImageElement;
                                                        if (target.src !== `/storage/${company.logo_path}`) {
                                                            target.src = `/storage/${company.logo_path}`;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Logo Upload */}
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="logo" value={company.logo_path ? "Yeni loqo (şəkil)" : "Loqo (şəkil)"} />
                                        <input
                                            id="logo"
                                            type="file"
                                            name="logo"
                                            accept="image/*"
                                            onChange={(e) => setData('logo', e.target.files?.[0] || null)}
                                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            {company.logo_path 
                                                ? "Yeni loqo yükləmək istəyirsinizsə seçin (Köhnəsini əvəz edəcək)"
                                                : "PNG, JPG və ya GIF formatında şəkil seçin"}
                                        </p>
                                        <p className="mt-1 text-xs text-blue-600">
                                            💡 <strong>Tövsiyə olunan ölçü:</strong> 200x200px və ya 300x300px (kvadrat format), maksimum 5MB
                                        </p>
                                        <InputError message={errors.logo} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="tax_number" value="Vergi Nömrəsi" />
                                        <TextInput
                                            id="tax_number"
                                            type="text"
                                            name="tax_number"
                                            value={data.tax_number}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('tax_number', e.target.value)}
                                        />
                                        <InputError message={errors.tax_number} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="default_language" value="Varsayılan Dil *" />
                                        <select
                                            id="default_language"
                                            name="default_language"
                                            value={data.default_language}
                                            onChange={(e) => setData('default_language', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                            required
                                        >
                                            {languageOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.default_language} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="address" value="Ünvan" />
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                        />
                                        <InputError message={errors.address} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əlaqə Məlumatları
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="phone" value="Telefon" />
                                        <TextInput
                                            id="phone"
                                            type="tel"
                                            name="phone"
                                            value={data.phone}
                                            className="mt-1 block w-full"
                                            placeholder="+994 XX XXX XX XX"
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="E-poçt" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="website" value="Veb Sayt" />
                                        <TextInput
                                            id="website"
                                            type="url"
                                            name="website"
                                            value={data.website}
                                            className="mt-1 block w-full"
                                            placeholder="https://example.com"
                                            onChange={(e) => setData('website', e.target.value)}
                                        />
                                        <InputError message={errors.website} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Əlavə Məlumatlar
                                </h3>
                                <div>
                                    <InputLabel htmlFor="description" value="Təsvir" />
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={4}
                                        className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                        placeholder="Şirkət haqqında əlavə məlumatlar..."
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end space-x-2 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('companies.show', company.id)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    Ləğv et
                                </Link>
                                <PrimaryButton className="ml-4" disabled={processing}>
                                    {processing ? 'Yadda saxlanır...' : 'Dəyişiklikləri Saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}