import React, { FormEventHandler, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import { PageProps } from '@/types';

interface TelegramCredential {
    id: number;
    bot_token: string;
    default_chat_id: string;
    is_active: boolean;
}

interface TelegramSettingsProps extends PageProps {
    credentials: TelegramCredential | null;
}

export default function Settings({ auth, credentials }: TelegramSettingsProps) {
    const [isEditing, setIsEditing] = useState(!credentials);

    const { data, setData, post, processing, errors, reset } = useForm({
        bot_token: '',
        default_chat_id: credentials?.default_chat_id || '',
        is_active: credentials?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('settings.telegram.update'), {
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
        >
            <Head title="Telegram Bot Parametrləri" />

            <div className="py-12">
                <div className="px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-sky-800">
                                    Telegram Bot haqqında
                                </h3>
                                <div className="mt-2 text-sm text-sky-700 space-y-2">
                                    <p>
                                        Telegram Bot yaratmaq üçün @BotFather ilə əlaqə saxlayın və yeni bot yaradın.
                                        Bot Token və Chat ID-ni burada qeyd edin.
                                    </p>
                                    <p>
                                        <strong>Chat ID tapmaq:</strong> Botunuza mesaj göndərin və
                                        <code className="bg-sky-100 px-2 py-0.5 rounded mx-1">
                                            https://api.telegram.org/bot[TOKEN]/getUpdates
                                        </code>
                                        ünvanına daxil olun.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Telegram Bot Parametrləri
                                </h3>
                                {credentials && !isEditing && (
                                    <PrimaryButton type="button" onClick={() => setIsEditing(true)}>
                                        Redaktə et
                                    </PrimaryButton>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="bot_token" value="Bot Token" />
                                    <TextInput
                                        id="bot_token"
                                        type="text"
                                        className="mt-1 block w-full font-mono text-sm"
                                        value={data.bot_token}
                                        onChange={(e) => setData('bot_token', e.target.value)}
                                        required={!credentials}
                                        disabled={!isEditing}
                                        placeholder={credentials ? "Token dəyişdirmək üçün yeni token daxil edin" : "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"}
                                    />
                                    <InputError message={errors.bot_token} className="mt-2" />
                                    {credentials ? (
                                        <p className="mt-1 text-sm text-gray-500">
                                            Token konfiqurasiya olunub. Dəyişdirmək üçün yeni token daxil edin.
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm text-gray-500">
                                            @BotFather-dən aldığınız token
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <InputLabel htmlFor="default_chat_id" value="Default Chat ID" />
                                    <TextInput
                                        id="default_chat_id"
                                        type="text"
                                        className="mt-1 block w-full font-mono text-sm"
                                        value={data.default_chat_id}
                                        onChange={(e) => setData('default_chat_id', e.target.value)}
                                        required
                                        disabled={!isEditing}
                                        placeholder="-1001234567890"
                                    />
                                    <InputError message={errors.default_chat_id} className="mt-2" />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Bildirişlərin göndəriləcəyi chat ID
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300 text-sky-600 shadow-sm focus:ring-sky-500"
                                        disabled={!isEditing}
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                        Aktiv (bildirişlər göndərilsin)
                                    </label>
                                </div>

                                {isEditing && (
                                    <div className="flex items-center gap-4">
                                        <PrimaryButton type="submit" disabled={processing}>
                                            {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                        </PrimaryButton>
                                        {credentials && (
                                            <SecondaryButton
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    reset();
                                                }}
                                            >
                                                Ləğv et
                                            </SecondaryButton>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Status Card */}
                    {credentials && (
                        <div className={`rounded-lg p-6 ${credentials.is_active ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 h-3 w-3 rounded-full ${credentials.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {credentials.is_active ? 'Telegram inteqrasiyası aktiv' : 'Telegram inteqrasiyası deaktiv'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {credentials.is_active ? 'Bildirişlər göndərilir' : 'Bildirişlər göndərilmir'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
