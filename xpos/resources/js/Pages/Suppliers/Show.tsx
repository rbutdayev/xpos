import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Supplier } from '@/types';
import {
    ArrowLeftIcon,
    PencilIcon,
    BuildingOffice2Icon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Props {
    supplier: Supplier & {
        products?: any[];
        recent_orders?: any[];
        total_orders?: number;
        total_spent?: number;
    };
}

export default function Show({ supplier }: Props) {
    const { t } = useTranslation(['suppliers', 'common']);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPhoneNumber = (phone: string) => {
        // Format Azerbaijani phone numbers: +994 XX XXX XX XX
        if (phone.startsWith('+994')) {
            return phone.replace(/(\+994)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        }
        return phone;
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${supplier.name} - ${t('supplierDetails')}`} />

            <div className="mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link
                            href="/suppliers"
                            className="mr-4 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
                            <div className="flex items-center mt-1 space-x-3">
                                <div className="flex items-center">
                                    <BuildingOffice2Icon className="w-4 h-4 text-gray-500 mr-1" />
                                    <span className="text-sm text-gray-600">{t('fields.supplier')}</span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    supplier.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {supplier.is_active ? t('status.active') : t('status.inactive')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={`/suppliers/${supplier.id}/edit`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                    >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        {t('actions.edit')}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">{t('sections.contactInfo')}</h2>
                            </div>
                            <div className="p-6">
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('fields.companyName')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{supplier.name}</dd>
                                    </div>

                                    {supplier.contact_person && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('fields.contactPerson')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{supplier.contact_person}</dd>
                                        </div>
                                    )}

                                    {supplier.phone && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                <PhoneIcon className="w-4 h-4 inline mr-1" />
                                                {t('fields.phone')}
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:text-blue-800">
                                                    {formatPhoneNumber(supplier.phone)}
                                                </a>
                                            </dd>
                                        </div>
                                    )}

                                    {supplier.email && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                                                {t('fields.email')}
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:text-blue-800">
                                                    {supplier.email}
                                                </a>
                                            </dd>
                                        </div>
                                    )}

                                    {supplier.tax_number && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('fields.taxNumber')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-mono">{supplier.tax_number}</dd>
                                        </div>
                                    )}

                                    {supplier.address && (
                                        <div className="md:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">
                                                <MapPinIcon className="w-4 h-4 inline mr-1" />
                                                {t('fields.address')}
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">{supplier.address}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        </div>

                        {/* Banking Information */}
                        {(supplier.bank_account || supplier.bank_name) && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">{t('sections.bankInfo')}</h2>
                                </div>
                                <div className="p-6">
                                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {supplier.bank_name && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">{t('fields.bankName')}</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{supplier.bank_name}</dd>
                                            </div>
                                        )}

                                        {supplier.bank_account && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">{t('fields.accountNumber')}</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-mono">{supplier.bank_account}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        )}

                        {/* Products */}
                        {supplier.products && supplier.products.length > 0 && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center">
                                        <TagIcon className="w-5 h-5 text-gray-400 mr-2" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {t('sections.suppliedProducts', { count: supplier.products.length })}
                                        </h2>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {supplier.products.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                                                <div>
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    {product.sku && (
                                                        <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {product.pivot?.supplier_price && (
                                                        <div className="font-semibold text-gray-900">
                                                            {formatCurrency(product.pivot.supplier_price)}
                                                        </div>
                                                    )}
                                                    {product.pivot?.lead_time_days && (
                                                        <div className="text-xs text-gray-500">
                                                            {t('products.deliveryDays', { days: product.pivot.lead_time_days })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {supplier.notes && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">{t('fields.notes')}</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-gray-900 whitespace-pre-line">{supplier.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Terms */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">{t('sections.paymentTerms')}</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">{t('fields.paymentTermsLabel')}</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {supplier.payment_terms_days ? `${supplier.payment_terms_days} ${t('products.deliveryDays', { days: '' }).split(':')[0]}` : t('stats.notSpecified')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        {(supplier.total_orders || supplier.total_spent) && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">{t('stats.totalOrders')}</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {supplier.total_orders && (
                                        <div>
                                            <div className="text-sm font-medium text-gray-500">{t('stats.totalOrders')}</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {supplier.total_orders}
                                            </div>
                                        </div>
                                    )}

                                    {supplier.total_spent && (
                                        <div>
                                            <div className="text-sm font-medium text-gray-500">{t('stats.totalSpent')}</div>
                                            <div className="text-lg font-semibold text-green-600">
                                                {formatCurrency(supplier.total_spent)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">{t('sections.history')}</h2>
                            </div>
                            <div className="p-6 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                                        {t('stats.registered')}
                                    </span>
                                    <span className="text-gray-900">
                                        {formatDate(supplier.created_at || '')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        <ClockIcon className="w-4 h-4 inline mr-1" />
                                        {t('stats.lastModified')}
                                    </span>
                                    <span className="text-gray-900">
                                        {formatDate(supplier.updated_at || '')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}