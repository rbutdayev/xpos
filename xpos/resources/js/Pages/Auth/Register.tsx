import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

export default function Register() {
    const { t } = useTranslation('auth');
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gradient-to-br from-blue-50 to-indigo-100">
            <Head title={t('register.pageTitle')} />

            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-2xl overflow-hidden sm:rounded-lg border border-gray-200">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-2xl">O</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('register.title')}</h1>
                    <p className="text-sm text-gray-600">{t('register.subtitle')}</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value={t('register.nameLabel')} className="text-gray-700 font-medium" />

                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition duration-200"
                            autoComplete="name"
                            isFocused={true}
                            placeholder={t('register.namePlaceholder')}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />

                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value={t('register.emailLabel')} className="text-gray-700 font-medium" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition duration-200"
                            autoComplete="username"
                            placeholder={t('register.emailPlaceholder')}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value={t('register.passwordLabel')} className="text-gray-700 font-medium" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition duration-200"
                            autoComplete="new-password"
                            placeholder={t('register.passwordPlaceholder')}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value={t('register.confirmPasswordLabel')}
                            className="text-gray-700 font-medium"
                        />

                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition duration-200"
                            autoComplete="new-password"
                            placeholder={t('register.confirmPasswordPlaceholder')}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <PrimaryButton
                            className="w-full justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition duration-200"
                            disabled={processing}
                        >
                            {processing ? t('register.registering') : t('register.registerButton')}
                        </PrimaryButton>
                    </div>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        {t('register.alreadyHaveAccount')}{' '}
                        <Link
                            href={route('login')}
                            className="font-medium text-slate-600 hover:text-slate-500 underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
                        >
                            {t('register.loginLink')}
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>&copy; 2025 xPOS. {t('register.allRightsReserved')}</p>
                </div>
            </div>
        </div>
    );
}
