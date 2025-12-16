import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { UserIcon, EnvelopeIcon, PhoneIcon, BriefcaseIcon, CalendarIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
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
    last_login_at?: string;
    created_at: string;
}

interface Props {
    user: User;
    roleText: string;
}

export default function Show({ user, roleText }: Props) {
    const { t } = useTranslation('users');

    return (
        <AuthenticatedLayout>
            <Head title={`${user.name} - ${t('show.title')}`} />

            <div className="py-12">
                <div className="px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{t('show.title')}</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {t('show.userId')}: {user.id}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={route('users.index')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                {t('show.back')}
                            </Link>
                            <Link
                                href={route('users.edit', user.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                {t('show.edit')}
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Main Information Card */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center mb-6">
                                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <UserIcon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.status === 'active' ? t('form.active') : t('form.inactive')}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {roleText}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.contactInfo')}</h3>
                                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start">
                                            <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <dt className="text-sm font-medium text-gray-500">{t('show.email')}</dt>
                                                <dd className="mt-1 text-sm text-gray-900 break-words">{user.email}</dd>
                                            </div>
                                        </div>

                                        {user.phone && (
                                            <div className="flex items-start">
                                                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <dt className="text-sm font-medium text-gray-500">{t('show.phone')}</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{user.phone}</dd>
                                                </div>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        </div>

                        {/* Employee Information */}
                        {(user.position || user.hire_date || user.hourly_rate) && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.employeeInfo')}</h3>
                                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {user.position && (
                                            <div className="flex items-start">
                                                <BriefcaseIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <dt className="text-sm font-medium text-gray-500">{t('show.position')}</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{user.position}</dd>
                                                </div>
                                            </div>
                                        )}

                                        {user.hire_date && (
                                            <div className="flex items-start">
                                                <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <dt className="text-sm font-medium text-gray-500">{t('show.hireDate')}</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {new Date(user.hire_date).toLocaleDateString('az-AZ', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </dd>
                                                </div>
                                            </div>
                                        )}

                                        {user.hourly_rate && (
                                            <div className="flex items-start">
                                                <div className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold">₼</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <dt className="text-sm font-medium text-gray-500">{t('show.hourlyRate')}</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{user.hourly_rate} AZN</dd>
                                                </div>
                                            </div>
                                        )}
                                    </dl>

                                    {user.notes && (
                                        <div className="mt-6 border-t pt-6">
                                            <div className="flex items-start">
                                                <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <dt className="text-sm font-medium text-gray-500 mb-2">{t('show.notes')}</dt>
                                                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{user.notes}</dd>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* System Information */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.systemInfo')}</h3>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {user.last_login_at && (
                                        <div className="flex items-start">
                                            <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <dt className="text-sm font-medium text-gray-500">{t('show.lastLogin')}</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {new Date(user.last_login_at).toLocaleDateString('az-AZ', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </dd>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start">
                                        <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <dt className="text-sm font-medium text-gray-500">{t('show.createdAt')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {new Date(user.created_at).toLocaleDateString('az-AZ', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </dd>
                                        </div>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
