import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    ClockIcon,
    UserIcon,
    CubeIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    XMarkIcon,
    PrinterIcon,
    EyeIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from '@/Hooks/useTranslations';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Payment {
    payment_id: number;
    amount: number;
    method: string;
    notes: string;
    created_at: string;
}

interface RentalItem {
    id: number;
    product: {
        id: number;
        name: string;
        sku: string;
        barcode: string;
        brand: string;
        model: string;
        size: string;
        color: string;
        image_url: string;
    } | null;
    quantity: number;
    rental_price: number;
    deposit_per_item: number;
    condition_checklist: any;
    notes: string;
}

interface Rental {
    id: number;
    rental_number: string;
    customer: Customer;
    branch: Branch;
    rental_start_date: string;
    rental_end_date: string;
    actual_return_date: string | null;
    days_rented: number;
    days_overdue: number;
    is_overdue: boolean;
    is_due_today: boolean;
    rental_price: number;
    deposit_amount: number;
    late_fee: number;
    damage_fee: number;
    total_cost: number;
    paid_amount: number;
    credit_amount: number;
    remaining_balance: number;
    status: string;
    status_label: string;
    payment_status: string;
    payment_status_label: string;
    collateral_type: string;
    collateral_type_label: string;
    collateral_amount: number | null;
    collateral_document_type: string;
    collateral_document_number: string;
    collateral_photo_path: string;
    collateral_notes: string;
    collateral_returned: boolean;
    collateral_returned_at: string | null;
    items: RentalItem[];
    items_count: number;
    has_agreement: boolean;
    payments: Payment[];
    notes: string;
    internal_notes: string;
    sms_sent: boolean;
    telegram_sent: boolean;
    reminder_sent: boolean;
    overdue_alert_sent: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    rental: Rental;
    agreementPhotos?: string[];
    customerSignatureUrl?: string | null;
    staffSignatureUrl?: string | null;
}

export default function Show({ rental, agreementPhotos = [], customerSignatureUrl, staffSignatureUrl }: Props) {
    const { flash } = usePage().props as any;
    const { translatePaymentMethod } = useTranslations();
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [newEndDate, setNewEndDate] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'reserved':
                return 'bg-blue-100 text-blue-800';
            case 'returned':
                return 'bg-gray-100 text-gray-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusBadgeClass = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800';
            case 'credit':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleExtendSubmit = () => {
        if (!newEndDate) {
            toast.error('Zəhmət olmasa yeni tarix seçin');
            return;
        }

        setIsSubmitting(true);

        fetch(route('rentals.extend', rental.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ new_end_date: newEndDate }),
        })
            .then(response => response.json())
            .then(data => {
                setIsSubmitting(false);
                if (data.success) {
                    toast.success(data.message || 'Kirayə müddəti uğurla uzadıldı');
                    setShowExtendModal(false);
                    setNewEndDate('');
                    router.reload({ only: ['rental'] });
                } else {
                    toast.error(data.message || 'Xəta baş verdi');
                }
            })
            .catch(error => {
                setIsSubmitting(false);
                toast.error('Xəta baş verdi');
                console.error('Error:', error);
            });
    };

    const handleCancelSubmit = () => {
        setIsSubmitting(true);

        fetch(route('rentals.cancel', rental.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ reason: cancelReason }),
        })
            .then(response => response.json())
            .then(data => {
                setIsSubmitting(false);
                if (data.success) {
                    toast.success(data.message || 'Kirayə uğurla ləğv edildi');
                    setShowCancelModal(false);
                    setCancelReason('');
                    router.reload({ only: ['rental'] });
                } else {
                    toast.error(data.message || 'Xəta baş verdi');
                }
            })
            .catch(error => {
                setIsSubmitting(false);
                toast.error('Xəta baş verdi');
                console.error('Error:', error);
            });
    };

    const handleAddPayment = () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Zəhmət olmasa düzgün məbləğ daxil edin');
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (amount > rental.credit_amount) {
            toast.error(`Maksimum ödəniş məbləği: ₼${rental.credit_amount.toFixed(2)}`);
            return;
        }

        setIsSubmitting(true);

        router.post(
            route('rentals.add-payment', rental.id),
            {
                amount: amount,
                method: paymentMethod,
                notes: paymentNotes,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setShowAddPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentMethod('cash');
                    setPaymentNotes('');
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMessage = Object.values(errors)[0] as string;
                    toast.error(errorMessage || 'Xəta baş verdi');
                },
            }
        );
    };

    const calculateDuration = () => {
        if (!rental.rental_start_date || !rental.rental_end_date) return 0;

        const start = new Date(rental.rental_start_date);
        const end = new Date(rental.rental_end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    const duration = calculateDuration();

    return (
        <AuthenticatedLayout>
            <Head title={`Kirayə - ${rental.rental_number}`} />

            <div className="w-full">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{rental.rental_number}</h1>
                        <p className="mt-1 text-sm text-gray-600">Kirayə təfərrüatları</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span
                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(
                                rental.status
                            )}`}
                        >
                            {rental.status_label}
                        </span>
                        <span
                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusBadgeClass(
                                rental.payment_status
                            )}`}
                        >
                            {rental.payment_status_label}
                        </span>
                    </div>
                </div>

                {/* Overdue Alert */}
                {rental.is_overdue && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    Bu kirayə {rental.days_overdue} gün gecikmiş! Müştəri ilə əlaqə saxlayın.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer & Branch Info */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Əsas Məlumat</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer */}
                                <div>
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <UserIcon className="h-5 w-5 mr-2" />
                                        Müştəri
                                    </div>
                                    <div>
                                        <p className="text-base font-medium text-gray-900">
                                            {rental.customer.name}
                                        </p>
                                        <p className="text-sm text-gray-600">{rental.customer.phone}</p>
                                        {rental.customer.email && (
                                            <p className="text-sm text-gray-600">{rental.customer.email}</p>
                                        )}
                                        <a
                                            href={route('customers.show', rental.customer.id)}
                                            className="inline-flex items-center mt-2 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            <EyeIcon className="h-3 w-3 mr-1" />
                                            Müştəriyə bax
                                        </a>
                                    </div>
                                </div>

                                {/* Branch */}
                                <div>
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                                        Filial
                                    </div>
                                    <p className="text-base font-medium text-gray-900">{rental.branch.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rental Period */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <CalendarIcon className="h-5 w-5 mr-2" />
                                Kirayə Müddəti
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Başlama Tarixi</div>
                                    <p className="text-base font-medium text-gray-900">
                                        {rental.rental_start_date}
                                    </p>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Bitmə Tarixi</div>
                                    <p className="text-base font-medium text-gray-900">
                                        {rental.rental_end_date}
                                    </p>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Müddət</div>
                                    <p className="text-base font-medium text-gray-900">
                                        {duration} gün
                                    </p>
                                </div>
                            </div>

                            {rental.actual_return_date && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="text-sm text-gray-500 mb-1">Faktiki Qaytarılma Tarixi</div>
                                    <p className="text-base font-medium text-gray-900">
                                        {rental.actual_return_date}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Rental Items */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <CubeIcon className="h-5 w-5 mr-2" />
                                Kirayə Məhsulları ({rental.items_count})
                            </h2>
                            <div className="space-y-4">
                                {rental.items.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-base font-medium text-gray-900">
                                                    {item.product?.name || 'Silinmiş məhsul'}
                                                </h3>
                                                {!item.product && (
                                                    <div className="mt-1 text-sm text-red-600">
                                                        ⚠️ Bu məhsul sistemdən silinib
                                                    </div>
                                                )}
                                                {item.product && (
                                                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                        {item.product.barcode && (
                                                            <div>
                                                                <span className="font-medium">Barkod:</span> {item.product.barcode}
                                                            </div>
                                                        )}
                                                        {item.product.sku && (
                                                            <div>
                                                                <span className="font-medium">SKU:</span> {item.product.sku}
                                                            </div>
                                                        )}
                                                        {item.product.size && (
                                                            <div>
                                                                <span className="font-medium">Ölçü:</span> {item.product.size}
                                                            </div>
                                                        )}
                                                        {item.product.color && (
                                                            <div>
                                                                <span className="font-medium">Rəng:</span> {item.product.color}
                                                            </div>
                                                        )}
                                                        {item.product.brand && (
                                                            <div>
                                                                <span className="font-medium">Brend:</span> {item.product.brand}
                                                            </div>
                                                        )}
                                                        {item.product.model && (
                                                            <div>
                                                                <span className="font-medium">Model:</span> {item.product.model}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200 text-sm">
                                            <div>
                                                <div className="text-gray-500">Miqdar</div>
                                                <div className="font-medium text-gray-900">{item.quantity}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Qiymət</div>
                                                <div className="font-medium text-gray-900">
                                                    ₼{Number(item.rental_price || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Depozit</div>
                                                <div className="font-medium text-gray-900">
                                                    ₼{Number(item.deposit_per_item || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Cəm</div>
                                                <div className="font-medium text-gray-900">
                                                    ₼{(Number(item.quantity || 0) * (Number(item.rental_price || 0) + Number(item.deposit_per_item || 0))).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        {item.notes && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-sm text-gray-600 italic">{item.notes}</p>
                                            </div>
                                        )}
                                        {item.product ? (
                                            <a
                                                href={route('products.show', item.product.id)}
                                                className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                Məhsula bax
                                            </a>
                                        ) : (
                                            <span className="inline-flex items-center mt-3 text-sm text-gray-400">
                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                Məhsul mövcud deyil
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Collateral Information */}
                        {rental.collateral_type && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                                    Girov Məlumatı
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Girov Növü</div>
                                        <p className="text-base font-medium text-gray-900">
                                            {rental.collateral_type_label}
                                        </p>
                                    </div>

                                    {rental.collateral_amount && (
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Depozit Məbləği</div>
                                            <p className="text-base font-medium text-gray-900">
                                                ₼{Number(rental.collateral_amount || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    )}

                                    {rental.collateral_document_type && (
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Sənəd Növü</div>
                                            <p className="text-base font-medium text-gray-900">
                                                {rental.collateral_document_type}
                                            </p>
                                        </div>
                                    )}

                                    {rental.collateral_document_number && (
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Sənəd Nömrəsi</div>
                                            <p className="text-base font-medium text-gray-900">
                                                {rental.collateral_document_number}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {rental.collateral_notes && (
                                    <div className="mt-4">
                                        <div className="text-sm text-gray-500 mb-1">Qeydlər</div>
                                        <p className="text-sm text-gray-700">{rental.collateral_notes}</p>
                                    </div>
                                )}

                                {rental.collateral_photo_path && (
                                    <div className="mt-4">
                                        <a
                                            href={rental.collateral_photo_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            🖼️ Şəkli göstər
                                        </a>
                                    </div>
                                )}

                                {rental.collateral_returned && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center text-green-600">
                                            <svg
                                                className="h-5 w-5 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">
                                                Girov qaytarılıb ({rental.collateral_returned_at})
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Agreement Photos and Signatures */}
                        {rental.has_agreement && (agreementPhotos.length > 0 || customerSignatureUrl || staffSignatureUrl) && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                                    Müqavilə Sənədləri
                                </h2>

                                {/* Condition Photos */}
                                {agreementPhotos.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Vəziyyət Şəkilləri</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {agreementPhotos.map((photoUrl, index) => (
                                                <a
                                                    key={index}
                                                    href={photoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                                                >
                                                    <img
                                                        src={photoUrl}
                                                        alt={`Vəziyyət şəkli ${index + 1}`}
                                                        className="w-full h-full object-cover group-hover:opacity-90"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-30 transition-opacity">
                                                        <EyeIcon className="h-8 w-8 text-white" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Signatures */}
                                {(customerSignatureUrl || staffSignatureUrl) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Customer Signature */}
                                        {customerSignatureUrl && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 mb-3">Müştəri İmzası</h3>
                                                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <img
                                                        src={customerSignatureUrl}
                                                        alt="Müştəri imzası"
                                                        className="w-full h-32 object-contain"
                                                    />
                                                    <div className="mt-2 text-xs text-gray-500 text-center">
                                                        {rental.customer.name}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Staff Signature */}
                                        {staffSignatureUrl && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 mb-3">İşçi Təsdiqi</h3>
                                                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <img
                                                        src={staffSignatureUrl}
                                                        alt="İşçi imzası"
                                                        className="w-full h-32 object-contain"
                                                    />
                                                    <div className="mt-2 text-xs text-gray-500 text-center">
                                                        Təsdiqlənib
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Condition Checklist */}
                        {rental.items.some(item => item.condition_checklist) && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Vəziyyət (Qəbul zamanı)
                                </h2>
                                {rental.items.map((item) => {
                                    if (!item.condition_checklist) return null;
                                    const conditions = typeof item.condition_checklist === 'string'
                                        ? JSON.parse(item.condition_checklist)
                                        : item.condition_checklist;

                                    return (
                                        <div key={item.id} className="mb-4 last:mb-0">
                                            <div className="text-sm font-medium text-gray-700 mb-2">
                                                {item.product?.name || 'Silinmiş məhsul'}
                                                {!item.product && (
                                                    <span className="ml-2 text-red-600 text-xs">⚠️ məhsul silinib</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {Object.entries(conditions).map(([key, value]) => (
                                                    <div key={key} className="flex items-center text-sm">
                                                        <span className="mr-2">{value ? '✅' : '❌'}</span>
                                                        <span className="text-gray-700">{key}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Notes */}
                        {(rental.notes || rental.internal_notes) && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                                    Qeydlər
                                </h2>
                                {rental.notes && (
                                    <div className="mb-4">
                                        <div className="text-sm text-gray-500 mb-1">Ümumi Qeydlər</div>
                                        <p className="text-sm text-gray-700">{rental.notes}</p>
                                    </div>
                                )}
                                {rental.internal_notes && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Daxili Qeydlər</div>
                                        <p className="text-sm text-gray-700">{rental.internal_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment History */}
                        {rental.payments && rental.payments.length > 0 && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                                    Ödəniş Tarixçəsi
                                </h2>
                                <div className="space-y-3">
                                    {rental.payments.map((payment) => (
                                        <div
                                            key={payment.payment_id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        ₼{Number(payment.amount).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                                        {payment.method}
                                                    </span>
                                                </div>
                                                {payment.notes && (
                                                    <p className="text-xs text-gray-600">{payment.notes}</p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(payment.created_at).toLocaleDateString('az-AZ', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Financial Summary */}
                    <div className="space-y-6">
                        <div className="bg-white shadow-sm rounded-lg p-6 sticky top-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                                Maliyyə Xülasəsi
                            </h2>
                            <div className="space-y-3">
                                {duration > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Günlük tarif</span>
                                        <span className="font-medium text-gray-900">
                                            ₼{(Number(rental.rental_price) / duration).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Kirayə Qiyməti ({duration} gün)</span>
                                    <span className="font-medium text-gray-900">
                                        ₼{Number(rental.rental_price || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Depozit</span>
                                    <span className="font-medium text-gray-900">
                                        ₼{Number(rental.deposit_amount || 0).toFixed(2)}
                                    </span>
                                </div>

                                {rental.late_fee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600">Gecikdirmə Cəriməsi</span>
                                        <span className="font-medium text-red-600">
                                            ₼{Number(rental.late_fee || 0).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {rental.damage_fee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600">Zərər Haqqı</span>
                                        <span className="font-medium text-red-600">
                                            ₼{Number(rental.damage_fee || 0).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-3 border-t">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-base font-medium text-gray-900">Ümumi Məbləğ</span>
                                        <span className="text-base font-bold text-gray-900">
                                            ₼{Number(rental.total_cost || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-gray-600">Ödənilib</span>
                                        <span className="font-medium text-green-600">
                                            ₼{Number(rental.paid_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Qalıq Borc</span>
                                        <span
                                            className={`font-medium ${
                                                Number(rental.remaining_balance || 0) > 0
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                            }`}
                                        >
                                            ₼{Number(rental.remaining_balance || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {rental.has_agreement && (
                                <div className="mt-6 pt-6 border-t">
                                    <a
                                        href={route('rentals.agreement.pdf', rental.id)}
                                        className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        <svg
                                            className="h-5 w-5 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        Müqaviləni Yüklə (PDF)
                                    </a>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t">
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>Yaradılıb: {rental.created_at}</div>
                                    <div>Yenilənib: {rental.updated_at}</div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {(rental.status === 'active' || rental.status === 'reserved' || rental.status === 'overdue') && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.visit(route('rentals.return.show', rental.id))}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Qaytarma İşlə
                                </button>
                                {['reserved', 'active', 'overdue'].includes(rental.status) && (
                                    <button
                                        onClick={() => router.visit(route('rentals.edit', rental.id))}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                    >
                                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Redaktə et
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowExtendModal(true)}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                                    Uzat
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    <XMarkIcon className="h-5 w-5 mr-2" />
                                    Ləğv et
                                </button>
                            </div>
                        )}

                        {/* Add Payment Button - Only for returned rentals with outstanding credit */}
                        {rental.status === 'returned' && rental.credit_amount > 0 && (
                            <div className="space-y-3">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-medium text-yellow-800 mb-1">
                                        Ödənilməmiş borc
                                    </p>
                                    <p className="text-2xl font-bold text-yellow-900">
                                        ₼{Number(rental.credit_amount).toFixed(2)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddPaymentModal(true)}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                                    Ödəniş əlavə et
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Extend Modal */}
                {showExtendModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kirayə Müddətini Uzat</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Yeni Bitmə Tarixi
                                </label>
                                <input
                                    type="date"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                    min={rental.rental_end_date}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowExtendModal(false);
                                        setNewEndDate('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                    disabled={isSubmitting}
                                >
                                    Ləğv et
                                </button>
                                <button
                                    onClick={handleExtendSubmit}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Yüklənir...' : 'Təsdiq et'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kirayəni Ləğv Et</h3>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Bu kirayəni ləğv etmək istədiyinizə əminsiniz?
                                </p>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ləğv Səbəbi (ixtiyari)
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Ləğv səbəbini daxil edin..."
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                    disabled={isSubmitting}
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={handleCancelSubmit}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Yüklənir...' : 'Ləğv Et'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Payment Modal */}
                {showAddPaymentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödəniş əlavə et</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ödəniş Məbləği
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">₼</span>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            step="0.01"
                                            min="0.01"
                                            max={rental.credit_amount}
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="0.00"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Maksimum: ₼{Number(rental.credit_amount).toFixed(2)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ödəniş Üsulu
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        disabled={isSubmitting}
                                    >
                                        <option value="cash">{translatePaymentMethod('cash')}</option>
                                        <option value="card">{translatePaymentMethod('card')}</option>
                                        <option value="transfer">{translatePaymentMethod('bank_transfer')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Qeyd (ixtiyari)
                                    </label>
                                    <textarea
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Ödəniş haqqında qeyd..."
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAddPaymentModal(false);
                                        setPaymentAmount('');
                                        setPaymentMethod('cash');
                                        setPaymentNotes('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                    disabled={isSubmitting}
                                >
                                    Ləğv et
                                </button>
                                <button
                                    onClick={handleAddPayment}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Yüklənir...' : 'Ödənişi Təsdiq Et'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
