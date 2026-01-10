import React, { FormEventHandler, useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { PageProps, LoyaltyProgram } from '@/types';

interface LoyaltyProgramProps extends PageProps {
    program: LoyaltyProgram | null;
}

export default function Index({ auth, program }: LoyaltyProgramProps) {
    const loyaltyEnabled = usePage().props.loyaltyEnabled as boolean;
    const [isEditing, setIsEditing] = useState(!program && loyaltyEnabled);
    const [showModuleDisableModal, setShowModuleDisableModal] = useState(false);

    const { data, setData, post, processing, errors } = useForm<{
        points_per_currency_unit: number;
        redemption_rate: number;
        min_redemption_points: number;
        points_expiry_days: number | null;
        max_points_per_transaction: number | null;
        earn_on_discounted_items: boolean;
        is_active: boolean;
    }>({
        points_per_currency_unit: program?.points_per_currency_unit || 1,
        redemption_rate: program?.redemption_rate || 100,
        min_redemption_points: program?.min_redemption_points || 100,
        points_expiry_days: program?.points_expiry_days || 365,
        max_points_per_transaction: program?.max_points_per_transaction || null,
        earn_on_discounted_items: program?.earn_on_discounted_items ?? true,
        is_active: program?.is_active ?? false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('loyalty-program.store'), {
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

    const toggleActive = () => {
        post(route('loyalty-program.toggle-active'), {
            preserveScroll: true,
        });
    };

    const toggleModule = () => {
        if (!loyaltyEnabled) {
            // If module is currently disabled, enable it without confirmation
            router.post(route('loyalty-program.toggle-module'), {}, {
                preserveScroll: true,
            });
        } else {
            // If module is enabled, show confirmation modal
            setShowModuleDisableModal(true);
        }
    };

    const confirmModuleDisable = () => {
        router.post(route('loyalty-program.toggle-module'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setShowModuleDisableModal(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Loyallıq Proqramı" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Module Disabled Warning */}
                            {!loyaltyEnabled && (
                                <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start">
                                            <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div>
                                                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                                                    Modul Söndürülüb
                                                </h3>
                                                <p className="text-sm text-yellow-800 mb-3">
                                                    Loyallıq proqramı modulu hazırda deaktivdir. Modulu aktivləşdirmək üçün düyməyə klikləyin və ya aşağıdakı "Təhlükəli Zona" bölməsindən istifadə edin.
                                                </p>
                                            </div>
                                        </div>
                                        <PrimaryButton
                                            onClick={toggleModule}
                                            disabled={processing}
                                            className="ml-4 flex-shrink-0"
                                        >
                                            Modulu Aktivləşdir
                                        </PrimaryButton>
                                    </div>
                                </div>
                            )}

                            {/* Status Card */}
                            {loyaltyEnabled && program && !isEditing && (
                                <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Proqram Statusu
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {program.is_active ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Aktiv
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Deaktiv
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex space-x-3">
                                            <SecondaryButton onClick={() => setIsEditing(true)}>
                                                Redaktə et
                                            </SecondaryButton>
                                            <PrimaryButton
                                                onClick={toggleActive}
                                                disabled={processing}
                                            >
                                                {program.is_active ? 'Proqramı Dayandır' : 'Proqramı İşə Sal'}
                                            </PrimaryButton>
                                        </div>
                                    </div>

                                    {/* Current Configuration */}
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Qazanılan ballar
                                            </p>
                                            <p className="text-lg text-gray-900">
                                                {program.points_per_currency_unit} bal / ₼1
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                İstifadə nisbəti
                                            </p>
                                            <p className="text-lg text-gray-900">
                                                {program.redemption_rate} bal = ₼1 endirim
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Minimum istifadə
                                            </p>
                                            <p className="text-lg text-gray-900">
                                                {program.min_redemption_points} bal
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Bitmə müddəti
                                            </p>
                                            <p className="text-lg text-gray-900">
                                                {program.points_expiry_days ? `${program.points_expiry_days} gün` : 'Bitmir'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Configuration Form */}
                            {loyaltyEnabled && isEditing && (
                                <form onSubmit={submit}>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                {program ? 'Konfiqurasiyanı Redaktə et' : 'Loyallıq Proqramını Konfiqurasiya et'}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-6">
                                                Müştərilər hər alış-verişdən sonra bal qazanır və bu balları endirim üçün istifadə edə bilərlər.
                                            </p>
                                        </div>

                                        {/* Points Earning */}
                                        <div className="border-t pt-4">
                                            <h4 className="text-md font-medium text-gray-900 mb-4">
                                                Bal Qazanma Parametrləri
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="points_per_currency_unit" value="Hər ₼1 üçün bal" />
                                                    <TextInput
                                                        id="points_per_currency_unit"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.points_per_currency_unit}
                                                        className="mt-1 block w-full"
                                                        onChange={(e) => setData('points_per_currency_unit', parseFloat(e.target.value))}
                                                    />
                                                    <InputError message={errors.points_per_currency_unit} className="mt-2" />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Məsələn: 1 = müştəri hər ₼1 xərclədikdə 1 bal qazanır
                                                    </p>
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="max_points_per_transaction" value="Maksimum bal (hər alış-veriş)" />
                                                    <TextInput
                                                        id="max_points_per_transaction"
                                                        type="number"
                                                        min="0"
                                                        value={data.max_points_per_transaction ?? ''}
                                                        className="mt-1 block w-full"
                                                        placeholder="Limitsiz"
                                                        onChange={(e) => setData('max_points_per_transaction', e.target.value ? parseInt(e.target.value) : null)}
                                                    />
                                                    <InputError message={errors.max_points_per_transaction} className="mt-2" />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Boş qoyun = limit yoxdur
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500"
                                                        checked={data.earn_on_discounted_items}
                                                        onChange={(e) => setData('earn_on_discounted_items', e.target.checked)}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Endirimli məhsullardan da bal qazanıla bilər
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Points Redemption */}
                                        <div className="border-t pt-4">
                                            <h4 className="text-md font-medium text-gray-900 mb-4">
                                                Bal İstifadəsi Parametrləri
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="redemption_rate" value="₼1 endirim üçün bal sayı" />
                                                    <TextInput
                                                        id="redemption_rate"
                                                        type="number"
                                                        step="0.01"
                                                        min="1"
                                                        value={data.redemption_rate}
                                                        className="mt-1 block w-full"
                                                        onChange={(e) => setData('redemption_rate', parseFloat(e.target.value))}
                                                    />
                                                    <InputError message={errors.redemption_rate} className="mt-2" />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Məsələn: 100 = 100 bal ₼1 endirim verir
                                                    </p>
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="min_redemption_points" value="Minimum bal (istifadə üçün)" />
                                                    <TextInput
                                                        id="min_redemption_points"
                                                        type="number"
                                                        min="0"
                                                        value={data.min_redemption_points}
                                                        className="mt-1 block w-full"
                                                        onChange={(e) => setData('min_redemption_points', parseInt(e.target.value))}
                                                    />
                                                    <InputError message={errors.min_redemption_points} className="mt-2" />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Müştəri bu qədər bal yığmalıdır
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Points Expiration */}
                                        <div className="border-t pt-4">
                                            <h4 className="text-md font-medium text-gray-900 mb-4">
                                                Bal Bitmə Müddəti
                                            </h4>

                                            <div>
                                                <InputLabel htmlFor="points_expiry_days" value="Ballar neçə gündən sonra bitir?" />
                                                <TextInput
                                                    id="points_expiry_days"
                                                    type="number"
                                                    min="0"
                                                    value={data.points_expiry_days ?? ''}
                                                    className="mt-1 block w-full"
                                                    placeholder="Məsələn: 365"
                                                    onChange={(e) => setData('points_expiry_days', e.target.value ? parseInt(e.target.value) : null)}
                                                />
                                                <InputError message={errors.points_expiry_days} className="mt-2" />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    0 və ya boş = ballar heç vaxt bitmir
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="border-t pt-4">
                                            <h4 className="text-md font-medium text-gray-900 mb-4">
                                                Proqram Statusu
                                            </h4>

                                            <div>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500"
                                                        checked={data.is_active}
                                                        onChange={(e) => setData('is_active', e.target.checked)}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Loyallıq proqramını aktiv et
                                                    </span>
                                                </label>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Aktiv olduqda müştərilər avtomatik bal qazanıb istifadə edə biləcəklər
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 pt-4">
                                            <PrimaryButton disabled={processing}>
                                                Yadda saxla
                                            </PrimaryButton>

                                            {program && (
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                >
                                                    Ləğv et
                                                </SecondaryButton>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* Help Section */}
                            {loyaltyEnabled && (
                            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                    💡 Loyallıq Proqramı Necə İşləyir?
                                </h4>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>Müştərilər alış-veriş edərkən avtomatik bal qazanırlar</li>
                                    <li>Yığdıqları balları növbəti alış-verişlərində endirim üçün istifadə edə bilərlər</li>
                                    <li>POS sistemində müştəri seçdikdə onun bal balansı görünür</li>
                                    <li>Ödəniş zamanı müştəri ballarını istifadə edərək endirim ala bilər</li>
                                    <li>Bütün bal hərəkətləri müştəri tarixçəsində qeyd olunur</li>
                                </ul>
                            </div>
                            )}

                            {/* Danger Zone */}
                            <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
                                <h4 className="text-lg font-semibold text-red-900 mb-2">
                                    ⚠️ Təhlükəli Zona
                                </h4>
                                <p className="text-sm text-red-700 mb-4">
                                    {loyaltyEnabled
                                        ? 'Loyallıq proqramı modulunu tamamilə söndürərkən diqqətli olun. Modul söndürüldükdə menyu siyahısından gizlədilir və heç kim bu funksiyanı istifadə edə bilməz.'
                                        : 'Loyallıq proqramı modulu hazırda söndürülüb. Aktivləşdirdikdə menyu siyahısında görünəcək və istifadəyə hazır olacaq.'}
                                </p>
                                <DangerButton
                                    onClick={toggleModule}
                                    disabled={processing}
                                >
                                    {loyaltyEnabled ? 'Modulu Tamamilə Söndür' : 'Modulu Aktivləşdir'}
                                </DangerButton>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Module Disable Confirmation Modal */}
            {showModuleDisableModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModuleDisableModal(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                                            Loyallıq Proqramı Modulunu Söndür
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Modulu söndürmək istədiyinizə əminsiniz? Bu əməliyyat:
                                            </p>
                                            <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                                                <li>Menyu siyahısından loyallıq proqramını gizlədəcək</li>
                                                <li>Heç kimin bu funksiyanı istifadə etməsinə icazə verməyəcək</li>
                                                <li>Mövcud proqram məlumatları saxlanılacaq</li>
                                                <li>Müştərilərin balları təhlükəsiz saxlanılacaq</li>
                                                <li>İstənilən vaxt yenidən aktivləşdirə bilərsiniz</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                                <DangerButton
                                    onClick={confirmModuleDisable}
                                    disabled={processing}
                                    className="ml-3"
                                >
                                    Bəli, Söndür
                                </DangerButton>
                                <SecondaryButton
                                    onClick={() => setShowModuleDisableModal(false)}
                                    disabled={processing}
                                >
                                    Ləğv et
                                </SecondaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
