import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    branch_id?: number;
    position?: string;
    hire_date?: string;
    hourly_rate?: number;
    notes?: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Props {
    user: User;
    roleOptions: Array<{value: string; label: string}>;
    branches: Branch[];
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    password: string;
    password_confirmation: string;
    branch_id?: number;
    position?: string;
    hire_date?: string;
    hourly_rate?: number;
    notes?: string;
}

export default function Edit({ user, roleOptions, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        status: user.status || 'active',
        password: '',
        password_confirmation: '',
        branch_id: user.branch_id || undefined,
        position: user.position || '',
        hire_date: user.hire_date || '',
        hourly_rate: user.hourly_rate || undefined,
        notes: user.notes || '',
    });

    const isAccountOwner = user.role === 'account_owner';

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    return (
        <AuthenticatedLayout>
            <Head title="İstifadəçini Düzəliş Et" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
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
                                        {isAccountOwner ? (
                                            <>
                                                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm text-gray-700 font-medium">
                                                    Hesab Sahibi (account_owner)
                                                </div>
                                                <p className="mt-2 text-sm text-amber-600">
                                                    ⚠️ Hesab sahibinin rolunu dəyişdirmək mümkün deyil
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <select
                                                    id="role"
                                                    name="role"
                                                    value={data.role}
                                                    onChange={(e) => setData('role', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                    required
                                                >
                                                    <option value="">Rol seçin...</option>
                                                    {(roleOptions || []).map((role) => (
                                                        <option key={role.value} value={role.value}>
                                                            {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.role} className="mt-2" />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    İstifadəçinin sistemdə giriş səlahiyyətlərini müəyyən edir
                                                </p>
                                            </>
                                        )}
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

                            {/* Password (Optional) */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Şifrə dəyişikliyi (məcburi deyil)
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="password" value="Yeni şifrə" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Boş buraxın dəyişdirmək istəmirsinizsə"
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Şifrə təkrarı" />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Yeni şifrəni təkrarlayın"
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                                <Link href="/users">
                                    <SecondaryButton type="button">
                                        Ləğv et
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Yadda saxlanır...' : 'Dəyişiklikləri yadda saxla'}
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
                            <li>• Şifrə sahəsini boş buraxsanız, mövcud şifrə dəyişməyəcək</li>
                            <li>• Satış işçisi rolunu seçərsəniz, filial təyin etmək məcburidir</li>
                            <li>• Qeyri-aktiv istifadəçilər sistema giriş edə bilməzlər</li>
                            <li>• Email ünvanı unikal olmalıdır</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}