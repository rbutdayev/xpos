import React, { FormEventHandler, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { PageProps } from '@/types';

interface SMSCredential {
    id: number;
    gateway_url: string;
    login: string;
    sender_name: string;
    is_active: boolean;
}

interface SMSSettingsProps extends PageProps {
    credentials: SMSCredential | null;
    statistics: {
        total: number;
        sent: number;
        failed: number;
        pending: number;
    };
}

export default function Settings({ auth, credentials, statistics }: SMSSettingsProps) {
    const [isEditing, setIsEditing] = useState(!credentials);

    const { data, setData, post, processing, errors, reset } = useForm({
        gateway_url: credentials?.gateway_url || 'https://apps.lsim.az/quicksms/v1/smssender',
        login: credentials?.login || '',
        password: '',
        sender_name: credentials?.sender_name || '',
        is_active: credentials?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('sms.credentials.store'), {
            onSuccess: () => {
                setIsEditing(false);
                reset('password');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        SMS Parametrləri
                    </h2>
                </div>
            }
        >
            <Head title="SMS Parametrləri" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-500">Cəmi SMS</div>
                            <div className="text-2xl font-bold text-gray-900 mt-2">
                                {statistics.total}
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-500">Göndərilən</div>
                            <div className="text-2xl font-bold text-green-600 mt-2">
                                {statistics.sent}
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-500">Uğursuz</div>
                            <div className="text-2xl font-bold text-red-600 mt-2">
                                {statistics.failed}
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-500">Gözləyir</div>
                            <div className="text-2xl font-bold text-yellow-600 mt-2">
                                {statistics.pending}
                            </div>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    SMS Gateway Parametrləri
                                </h3>
                                {credentials && !isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Redaktə et
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <form onSubmit={submit} className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="provider" value="SMS Provayder" />
                                        <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                                            LSIM
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Standart SMS provayderi
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="login" value="İstifadəçi adı (Login)" />
                                        <TextInput
                                            id="login"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.login}
                                            onChange={(e) => setData('login', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.login} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Şifrə" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required={!credentials}
                                            placeholder={credentials ? 'Dəyişdirmək üçün yeni şifrə daxil edin' : ''}
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="sender_name" value="Göndərən adı (Sender Name)" />
                                        <TextInput
                                            id="sender_name"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.sender_name}
                                            onChange={(e) => setData('sender_name', e.target.value)}
                                            required
                                            maxLength={11}
                                        />
                                        <InputError message={errors.sender_name} className="mt-2" />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Maksimum 11 simvol
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="is_active"
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <label htmlFor="is_active" className="ml-2 text-sm text-gray-600">
                                            Aktivdir
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <PrimaryButton disabled={processing}>
                                            {credentials ? 'Yenilə' : 'Yadda saxla'}
                                        </PrimaryButton>

                                        {credentials && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    reset();
                                                }}
                                                className="text-gray-600 hover:text-gray-800"
                                            >
                                                Ləğv et
                                            </button>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-500">SMS Provayder</div>
                                        <div className="mt-1 text-sm text-gray-900">LSIM</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-500">İstifadəçi adı</div>
                                        <div className="mt-1 text-sm text-gray-900">{credentials?.login}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-500">Göndərən adı</div>
                                        <div className="mt-1 text-sm text-gray-900">{credentials?.sender_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-500">Status</div>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                credentials?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {credentials?.is_active ? 'Aktiv' : 'Deaktiv'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Məlumat
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>SMS göndərmək üçün əvvəlcə LSIM parametrlərini qeyd etməlisiniz</li>
                            <li>Sistem LSIM SMS provayderi ilə inteqrasiya olunub</li>
                            <li>Göndərən adı maksimum 11 simvol ola bilər</li>
                            <li>Hər müştəri öz hesabı üçün ayrıca parametrlər təyin edə bilər</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
