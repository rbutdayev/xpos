import React, { FormEventHandler, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import { PageProps, LoyaltyProgram } from '@/types';

interface LoyaltyProgramProps extends PageProps {
    program: LoyaltyProgram | null;
}

export default function Index({ auth, program }: LoyaltyProgramProps) {
    const [isEditing, setIsEditing] = useState(!program);

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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Müştəri Loyallıq Proqramı
                </h2>
            }
        >
            <Head title="Loyallıq Proqramı" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Status Card */}
                            {program && !isEditing && (
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
                                                {program.is_active ? 'Deaktiv et' : 'Aktiv et'}
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
                            {isEditing && (
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
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
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
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
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
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
