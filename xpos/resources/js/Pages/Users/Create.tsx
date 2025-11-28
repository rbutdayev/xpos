import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Branch {
    id: number;
    name: string;
}

interface Props {
    roleOptions: Array<{value: string; label: string}>;
    branches: Branch[];
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    password_confirmation: string;
    status: string;
    branch_id?: number;
    position?: string;
    hire_date?: string;
    hourly_rate?: number;
    notes?: string;
}

export default function Create({ roleOptions, branches }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        email: '',
        phone: '',
        role: '',
        password: '',
        password_confirmation: '',
        status: 'active',
        branch_id: undefined,
        position: '',
        hire_date: '',
        hourly_rate: undefined,
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Yeni İstifadəçi" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Şəxsi məlumatlar
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="name" value="Ad və Soyad *" />
                                        <TextInput
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="Əli Məmmədov"
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email *" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            placeholder="ali@company.com"
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <InputLabel htmlFor="phone" value="Telefon" />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={data.phone}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+994 XX XXX XX XX"
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>
                            </div>

                            {/* Account Settings */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Hesab ayarları
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="role" value="Sistem Rolu *" />
                                        <select
                                            id="role"
                                            name="role"
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            required
                                        >
                                            <option value="">Sistem rolu seçin...</option>
                                            {roleOptions.map((role) => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.role} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">
                                            İstifadəçinin sistemdə giriş səlahiyyətlərini müəyyən edir
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="status" value="Status *" />
                                        <select
                                            id="status"
                                            name="status"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        >
                                            <option value="active">Aktiv</option>
                                            <option value="inactive">Qeyri-aktiv</option>
                                        </select>
                                        <InputError message={errors.status} className="mt-2" />
                                    </div>
                                </div>

                                {/* Show branch selection for sales_staff role */}
                                {data.role === 'sales_staff' && (
                                    <div className="mt-6">
                                        <InputLabel htmlFor="branch_id" value="Filial *" />
                                        <select
                                            id="branch_id"
                                            name="branch_id"
                                            value={data.branch_id || ''}
                                            onChange={(e) => setData('branch_id', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            required={data.role === 'sales_staff'}
                                        >
                                            <option value="">Filial seçin...</option>
                                            {(branches || []).map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.branch_id} className="mt-2" />
                                    </div>
                                )}
                            </div>

                            {/* Employee Information */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    İşçi məlumatları
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="position" value="Vəzifə (İş yeri)" />
                                        <TextInput
                                            id="position"
                                            name="position"
                                            value={data.position}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('position', e.target.value)}
                                            placeholder="Məsələn: Baş Mexanik, Satış Meneceri"
                                        />
                                        <InputError message={errors.position} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">
                                            İşçinin konkret vəzifəsi (məsələn: Baş Kassir, Anbar İşçisi)
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="hire_date" value="İşə başlama tarixi" />
                                        <TextInput
                                            id="hire_date"
                                            type="date"
                                            name="hire_date"
                                            value={data.hire_date}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('hire_date', e.target.value)}
                                        />
                                        <InputError message={errors.hire_date} className="mt-2" />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <InputLabel htmlFor="hourly_rate" value="Saatlıq əmək haqqı (AZN)" />
                                    <TextInput
                                        id="hourly_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="hourly_rate"
                                        value={data.hourly_rate || ''}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('hourly_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        placeholder="15.00"
                                    />
                                    <InputError message={errors.hourly_rate} className="mt-2" />
                                </div>

                                <div className="mt-6">
                                    <InputLabel htmlFor="notes" value="Qeydlər" />
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        rows={3}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Əlavə qeydlər və ya məlumatlar"
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Giriş məlumatları
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="password" value="Şifrə *" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            placeholder="Minimum 8 simvol"
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Şifrə təkrarı *" />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                            placeholder="Şifrəni təkrarlayın"
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t">
                                <Link href="/users" className="w-full sm:w-auto">
                                    <SecondaryButton type="button" className="w-full sm:w-auto">
                                        Ləğv et
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing} className="w-full sm:w-auto">
                                    {processing ? 'Yadda saxlanır...' : 'İstifadəçi yarat'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Məlumat</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Sistem Rolu:</strong> İstifadəçinin sistemdə giriş səlahiyyətlərini müəyyən edir (məsələn: Admin, Kassir)</li>
                            <li>• <strong>Vəzifə:</strong> İşçinin konkret iş yerindəki vəzifəsi (məsələn: Baş Mexanik, Satış Meneceri)</li>
                            <li>• Şifrə minimum 8 simvoldan ibarət olmalıdır</li>
                            <li>• Satış işçisi rolunu seçərsəniz, filial təyin etmək məcburidir</li>
                            <li>• Qeyri-aktiv istifadəçilər sistema giriş edə bilməzlər</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}