import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTranslation } from 'react-i18next';

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
    kiosk_enabled?: boolean;
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
    kiosk_enabled?: boolean;
    kiosk_pin?: string;
    kiosk_pin_confirmation?: string;
}

export default function Edit({ user, roleOptions, branches }: Props) {
    const { t } = useTranslation('users');
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
        kiosk_enabled: user.kiosk_enabled || false,
        kiosk_pin: '',
        kiosk_pin_confirmation: '',
    });

    const isAccountOwner = user.role === 'account_owner';

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('edit')} />

            <div className="py-12">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('form.personalInfo')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="name" value={`${t('form.name')} *`} />
                                        <TextInput
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder={t('form.namePlaceholder')}
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value={`${t('form.email')} *`} />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            placeholder={t('form.emailPlaceholder')}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <InputLabel htmlFor="phone" value={t('form.phone')} />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={data.phone}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder={t('form.phonePlaceholder')}
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>
                            </div>

                            {/* Account Settings */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('form.accountSettings')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="role" value={`${t('form.role')} *`} />
                                        {isAccountOwner ? (
                                            <>
                                                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm text-gray-700 font-medium">
                                                    {t('show.accountOwnerDisplay')}
                                                </div>
                                                <p className="mt-2 text-sm text-amber-600">
                                                    {t('form.accountOwnerWarning')}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <select
                                                    id="role"
                                                    name="role"
                                                    value={data.role}
                                                    onChange={(e) => setData('role', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                                    required
                                                >
                                                    <option value="">{t('form.rolePlaceholder')}</option>
                                                    {(roleOptions || []).map((role) => (
                                                        <option key={role.value} value={role.value}>
                                                            {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.role} className="mt-2" />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {t('form.roleHint')}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="status" value={`${t('form.status')} *`} />
                                        <select
                                            id="status"
                                            name="status"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                        >
                                            <option value="active">{t('form.active')}</option>
                                            <option value="inactive">{t('form.inactive')}</option>
                                        </select>
                                        <InputError message={errors.status} className="mt-2" />
                                    </div>
                                </div>

                                {/* Show branch selection for branch-specific roles */}
                                {['sales_staff', 'branch_manager', 'cashier', 'tailor', 'attendance_user'].includes(data.role) && (
                                    <div className="mt-6">
                                        <InputLabel htmlFor="branch_id" value={`${t('form.branch')} *`} />
                                        <select
                                            id="branch_id"
                                            name="branch_id"
                                            value={data.branch_id || ''}
                                            onChange={(e) => setData('branch_id', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                            required={['sales_staff', 'branch_manager', 'cashier', 'tailor', 'attendance_user'].includes(data.role)}
                                        >
                                            <option value="">{t('form.branchPlaceholder')}</option>
                                            {(branches || []).map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.branch_id} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {data.role === 'branch_manager' && t('form.branchManagerHint')}
                                            {data.role === 'sales_staff' && t('form.salesStaffHint')}
                                            {data.role === 'cashier' && t('form.cashierHint')}
                                            {data.role === 'tailor' && t('form.tailorHint')}
                                            {data.role === 'attendance_user' && 'İşçi hansı filiala aid olduğunu seçin (GPS yoxlaması üçün)'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Employee Information */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('form.employeeInfo')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="position" value={t('form.position')} />
                                        <TextInput
                                            id="position"
                                            name="position"
                                            value={data.position}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('position', e.target.value)}
                                            placeholder={t('form.positionPlaceholder')}
                                        />
                                        <InputError message={errors.position} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('form.positionHint')}
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="hire_date" value={t('form.hireDate')} />
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
                                    <InputLabel htmlFor="hourly_rate" value={t('form.hourlyRate')} />
                                    <TextInput
                                        id="hourly_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="hourly_rate"
                                        value={data.hourly_rate || ''}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('hourly_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        placeholder={t('form.hourlyRatePlaceholder')}
                                    />
                                    <InputError message={errors.hourly_rate} className="mt-2" />
                                </div>

                                <div className="mt-6">
                                    <InputLabel htmlFor="notes" value={t('form.notes')} />
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                        rows={3}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder={t('form.notesPlaceholder')}
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>
                            </div>

                            {/* Password (Optional) */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('form.passwordChange')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="password" value={t('form.passwordNew')} />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder={t('form.passwordNewPlaceholder')}
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value={t('form.passwordRepeat')} />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder={t('form.passwordRepeatPlaceholder')}
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Kiosk Settings */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('form.kioskSettings')}
                                </h3>

                                <div className="space-y-6">
                                    {/* Enable Kiosk Access */}
                                    <div className="flex items-center">
                                        <input
                                            id="kiosk_enabled"
                                            type="checkbox"
                                            checked={data.kiosk_enabled || false}
                                            onChange={(e) => setData('kiosk_enabled', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-slate-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="kiosk_enabled" className="ml-2 block text-sm text-gray-900">
                                            {t('form.kioskEnabled')}
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 -mt-4 ml-6">
                                        {t('form.kioskEnabledHint')}
                                    </p>

                                    {/* PIN Fields - Only shown when kiosk is enabled */}
                                    {data.kiosk_enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
                                            <div>
                                                <InputLabel htmlFor="kiosk_pin" value={t('form.kioskPin')} />
                                                <TextInput
                                                    id="kiosk_pin"
                                                    type="password"
                                                    name="kiosk_pin"
                                                    value={data.kiosk_pin}
                                                    className="mt-1 block w-full"
                                                    onChange={(e) => setData('kiosk_pin', e.target.value)}
                                                    placeholder={t('form.kioskPinPlaceholder')}
                                                    maxLength={6}
                                                />
                                                <InputError message={errors.kiosk_pin} className="mt-2" />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {t('form.kioskPinHint')}
                                                </p>
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="kiosk_pin_confirmation" value={t('form.kioskPinConfirmation')} />
                                                <TextInput
                                                    id="kiosk_pin_confirmation"
                                                    type="password"
                                                    name="kiosk_pin_confirmation"
                                                    value={data.kiosk_pin_confirmation}
                                                    className="mt-1 block w-full"
                                                    onChange={(e) => setData('kiosk_pin_confirmation', e.target.value)}
                                                    placeholder={t('form.kioskPinRepeatPlaceholder')}
                                                    maxLength={6}
                                                />
                                                <InputError message={errors.kiosk_pin_confirmation} className="mt-2" />
                                            </div>

                                            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <div className="ml-3 text-sm text-blue-700">
                                                        <p className="font-medium">{t('form.kioskUserIdInfo')}</p>
                                                        <p className="mt-1">
                                                            {t('form.kioskUserIdValue')}: <span className="font-mono font-bold">{user.id}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                                <Link href="/users">
                                    <SecondaryButton type="button">
                                        {t('actions.cancel')}
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? t('actions.saving') : t('actions.save')}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">{t('help.title')}</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• {t('help.roleInfo')}</li>
                            <li>• {t('help.positionInfo')}</li>
                            <li>• {t('help.passwordChangeInfo')}</li>
                            <li>• {t('help.branchInfo')}</li>
                            <li>• {t('help.inactiveInfo')}</li>
                            <li>• {t('help.emailInfo')}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
