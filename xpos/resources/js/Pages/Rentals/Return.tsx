import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    CalendarIcon,
    UserIcon,
    CubeIcon,
    XMarkIcon,
    CheckIcon,
    CameraIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from '@/Hooks/useTranslations';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
}

interface RentalItem {
    id: number;
    product?: {
        id: number;
        name: string;
        size?: string;
        color?: string;
    } | null;
    product_name?: string;
    product_sku?: string;
    condition_checklist: any;
    rental_price: number;
}

interface Rental {
    id: number;
    rental_number: string;
    customer: Customer;
    rental_start_date: string;
    rental_end_date: string;
    rental_price: number;
    deposit_amount: number;
    late_fee: number;
    damage_fee: number;
    total_cost: number;
    paid_amount: number;
    credit_amount: number;
    collateral_type: string;
    collateral_type_label: string;
    collateral_document_type: string;
    collateral_document_number: string;
    items: RentalItem[];
    is_overdue: boolean;
    days_overdue: number;
}

interface ChecklistItem {
    id: string;
    label_az: string;
    label_en: string;
    type: 'boolean' | 'select' | 'number' | 'text' | 'checklist';
    options_az?: string[];
    options_en?: string[];
    items_az?: string[];
    items_en?: string[];
    min?: number;
    max?: number;
    required?: boolean;
    critical?: boolean;
}

interface Props {
    rental: Rental;
    rentalCategory?: string;
    conditionChecklist?: ChecklistItem[];
}

export default function Return({ rental, rentalCategory = 'general', conditionChecklist = [] }: Props) {
    const { flash } = usePage().props as any;
    const { translatePaymentMethod } = useTranslations();

    // Ensure conditionChecklist is always an array (defensive programming)
    const checklistArray = Array.isArray(conditionChecklist) ? conditionChecklist : [];

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actualReturnDate, setActualReturnDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);
    // Dynamic condition state based on checklist
    const [itemsCondition, setItemsCondition] = useState<{
        [key: number]: {
            [fieldId: string]: any; // Dynamic field values
            // Per-checklist-item damage tracking
            damages: {
                [checklistItemId: string]: {
                    notes: string;
                    fee: string;
                };
            };
        };
    }>({});
    const [collateralReturned, setCollateralReturned] = useState(false);
    const [needsCleaning, setNeedsCleaning] = useState(false);
    const [cleaningFeeAmount, setCleaningFeeAmount] = useState<string>('10');
    const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'credit'>('full');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>('');
    const [sendSms, setSendSms] = useState(true);
    const [sendTelegram, setSendTelegram] = useState(true);

    // Calculate late fee
    const calculateLateFee = () => {
        if (!actualReturnDate) return 0;

        const endDate = new Date(rental.rental_end_date);
        const returnDate = new Date(actualReturnDate);
        const diffTime = returnDate.getTime() - endDate.getTime();
        const daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        if (daysLate <= 0) return 0;

        // Late fee rate: 15 AZN per day
        return daysLate * 15;
    };

    // Calculate total damage fees from all checklist items across all rental items
    const calculateTotalDamageFee = () => {
        return Object.values(itemsCondition).reduce((sum, condition) => {
            if (!condition.damages) return sum;
            // Sum up all damage fees from all checklist items
            const itemDamages = Object.values(condition.damages).reduce((damageSum, damage) => {
                return damageSum + (parseFloat(damage.fee) || 0);
            }, 0);
            return sum + itemDamages;
        }, 0);
    };

    // Calculate cleaning fee (optional)
    const calculateCleaningFee = () => {
        return needsCleaning ? parseFloat(cleaningFeeAmount) || 0 : 0;
    };

    // Calculate totals
    const lateFee = calculateLateFee();
    const damageFee = calculateTotalDamageFee();
    const cleaningFee = calculateCleaningFee();
    const totalAmount = rental.rental_price + lateFee + damageFee + cleaningFee;
    const remainingBalance = totalAmount - rental.paid_amount;
    const daysLate = Math.max(
        0,
        Math.ceil(
            (new Date(actualReturnDate).getTime() - new Date(rental.rental_end_date).getTime()) /
                (1000 * 60 * 60 * 24)
        )
    );

    const handleItemConditionChange = (
        itemId: number,
        field: string,
        value: any
    ) => {
        setItemsCondition((prev) => {
            const currentCondition = prev[itemId] || { damages: {} };
            return {
                ...prev,
                [itemId]: {
                    ...currentCondition,
                    [field]: value,
                },
            };
        });
    };

    // Handle per-checklist-item damage notes and fees
    const handleItemDamageChange = (
        itemId: number,
        checklistItemId: string,
        field: 'notes' | 'fee',
        value: string
    ) => {
        setItemsCondition((prev) => {
            const currentCondition = prev[itemId] || { damages: {} };
            const currentDamages = currentCondition.damages || {};
            const currentItemDamage = currentDamages[checklistItemId] || { notes: '', fee: '0' };

            return {
                ...prev,
                [itemId]: {
                    ...currentCondition,
                    damages: {
                        ...currentDamages,
                        [checklistItemId]: {
                            ...currentItemDamage,
                            [field]: value,
                        },
                    },
                },
            };
        });
    };

    // Helper to render different field types
    const renderConditionField = (
        checklistItem: ChecklistItem,
        itemId: number,
        pickupValue: any,
        isReturnSide: boolean = false
    ) => {
        const currentValue = itemsCondition[itemId]?.[checklistItem.id];
        const label = checklistItem.label_az; // Use Azeri labels

        switch (checklistItem.type) {
            case 'boolean':
                if (!isReturnSide) {
                    // Pickup side - just display
                    return (
                        <div className="flex items-center text-sm">
                            <span className="mr-2">{pickupValue ? '✅' : '❌'}</span>
                            <span className="text-gray-700">{label}</span>
                        </div>
                    );
                }
                // Return side - editable checkbox
                return (
                    <label className="flex items-center text-sm">
                        <input
                            type="checkbox"
                            checked={currentValue ?? true}
                            onChange={(e) =>
                                handleItemConditionChange(itemId, checklistItem.id, e.target.checked)
                            }
                            className="rounded border-gray-300 text-blue-600 mr-2"
                        />
                        <span className="text-gray-700">{label}</span>
                    </label>
                );

            case 'select':
                if (!isReturnSide) {
                    // Pickup side - display value
                    return (
                        <div className="flex items-center text-sm">
                            <span className="mr-2">📋</span>
                            <span className="text-gray-700">{label}: <strong>{pickupValue}</strong></span>
                        </div>
                    );
                }
                // Return side - dropdown
                return (
                    <div className="space-y-1">
                        <label className="block text-sm text-gray-700">{label}</label>
                        <select
                            value={currentValue ?? (checklistItem.options_az?.[0] || '')}
                            onChange={(e) =>
                                handleItemConditionChange(itemId, checklistItem.id, e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            {(checklistItem.options_az || []).map((option, idx) => (
                                <option key={idx} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case 'number':
                if (!isReturnSide) {
                    // Pickup side - display value
                    return (
                        <div className="flex items-center text-sm">
                            <span className="mr-2">🔢</span>
                            <span className="text-gray-700">{label}: <strong>{pickupValue}</strong></span>
                        </div>
                    );
                }
                // Return side - number input
                return (
                    <div className="space-y-1">
                        <label className="block text-sm text-gray-700">{label}</label>
                        <input
                            type="number"
                            value={currentValue ?? pickupValue ?? ''}
                            onChange={(e) =>
                                handleItemConditionChange(itemId, checklistItem.id, e.target.value)
                            }
                            min={checklistItem.min}
                            max={checklistItem.max}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                );

            case 'text':
                if (!isReturnSide) {
                    return pickupValue ? (
                        <div className="flex items-center text-sm">
                            <span className="mr-2">📝</span>
                            <span className="text-gray-700">{label}: <strong>{pickupValue}</strong></span>
                        </div>
                    ) : null;
                }
                return (
                    <div className="space-y-1">
                        <label className="block text-sm text-gray-700">{label}</label>
                        <input
                            type="text"
                            value={currentValue ?? pickupValue ?? ''}
                            onChange={(e) =>
                                handleItemConditionChange(itemId, checklistItem.id, e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    const handleSubmitConfirm = () => {
        // Build condition_on_return object from dynamic checklist fields
        const conditionOnReturn: { [key: string]: any } = {};

        // Get first item's condition to build the return condition object
        if (rental.items.length > 0 && itemsCondition[rental.items[0].id]) {
            const firstItemCondition = itemsCondition[rental.items[0].id];
            Object.keys(firstItemCondition).forEach(key => {
                if (key !== 'damages') {
                    conditionOnReturn[key] = firstItemCondition[key];
                }
            });
        }

        const formData = {
            return_date: actualReturnDate,
            return_collateral: collateralReturned,
            needs_cleaning: needsCleaning,
            cleaning_fee: needsCleaning ? parseFloat(cleaningFeeAmount) || 0 : 0,
            condition_on_return: conditionOnReturn, // Send dynamic condition
            items: rental.items.map((item) => {
                const condition = itemsCondition[item.id] || {
                    damages: {},
                };

                // Build item condition from checklist fields
                const itemConditionReturn: { [key: string]: any } = {};
                Object.keys(condition).forEach(key => {
                    if (key !== 'damages') {
                        itemConditionReturn[key] = condition[key];
                    }
                });

                // Calculate total damage fee from all checklist items for this rental item
                const totalDamageFee = condition.damages
                    ? Object.values(condition.damages).reduce(
                          (sum: number, damage: any) => sum + (parseFloat(damage.fee) || 0),
                          0
                      )
                    : 0;

                // Collect all damage notes
                const damageNotes = condition.damages
                    ? Object.entries(condition.damages)
                          .filter(([_, damage]: [string, any]) => damage.notes)
                          .map(([checklistItemId, damage]: [string, any]) => {
                              const checklistItem = checklistArray.find(ci => ci.id === checklistItemId);
                              return `${checklistItem?.label_az || checklistItemId}: ${damage.notes}`;
                          })
                          .join('; ')
                    : '';

                return {
                    item_id: item.id,
                    condition_on_return: itemConditionReturn,
                    damage_notes: damageNotes || null,
                    damage_fee: totalDamageFee,
                };
            }),
            payment_type: paymentType,
            payment_method: paymentMethod,
            payment_amount: paymentType === 'partial' ? parseFloat(partialPaymentAmount) || 0 : 0,
            send_sms: sendSms,
            send_telegram: sendTelegram,
        };

        router.post(route('rentals.return', rental.id), formData, {
            onSuccess: () => {
                setShowConfirmModal(false);
                toast.success('Qaytarma uğurla tamamlandı');
            },
            onError: (errors) => {
                console.error('Return errors:', errors);
                setShowConfirmModal(false);
                toast.error('Qaytarma zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Qaytarma - ${rental.rental_number}`} />

            <div className="w-full">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Qaytarma - {rental.rental_number}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">Kirayə məhsulunun qaytarılması</p>
                    </div>
                    <button
                        onClick={() => router.visit(route('rentals.show', rental.id))}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        ← Geri
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Return Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer & Product Info */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Əsas Məlumat</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <UserIcon className="h-5 w-5 mr-2" />
                                        Müştəri
                                    </div>
                                    <p className="text-base font-medium text-gray-900">{rental.customer.name}</p>
                                    <p className="text-sm text-gray-600">{rental.customer.phone}</p>
                                </div>
                                <div>
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <CubeIcon className="h-5 w-5 mr-2" />
                                        Məhsullar
                                    </div>
                                    {rental.items.map((item) => (
                                        <p key={item.id} className="text-base font-medium text-gray-900">
                                            {item.product?.name || item.product_name || 'Silinmiş məhsul'}
                                            {item.product?.color && ` ${item.product.color}`}
                                            {item.product?.size && ` (${item.product.size})`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Date Information */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <CalendarIcon className="h-5 w-5 mr-2" />
                                Tarix Məlumatı
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-600">Gözlənilən Qaytarma</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {rental.rental_end_date}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Faktiki Qaytarma (Bu gün)
                                        </label>
                                        <input
                                            type="date"
                                            value={actualReturnDate}
                                            onChange={(e) => setActualReturnDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                                        />
                                    </div>
                                </div>

                                {daysLate > 0 && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <ClockIcon className="h-5 w-5 text-yellow-400" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-yellow-800">
                                                    Gecikmə: {daysLate} gün
                                                </p>
                                                <p className="text-sm text-yellow-700 mt-1">
                                                    Cərimə (₼15/gün): ₼{lateFee.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Condition Check - Fully Dynamic */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Vəziyyət Yoxlaması
                            </h2>

                            {rental.items.map((item) => {
                                const condition = itemsCondition[item.id] || {
                                    damageNotes: '',
                                    damageFee: '0',
                                };

                                // Parse pickup condition from item
                                let pickupCondition: any = {};
                                try {
                                    pickupCondition =
                                        typeof item.condition_checklist === 'string'
                                            ? JSON.parse(item.condition_checklist)
                                            : item.condition_checklist || {};
                                } catch (e) {
                                    pickupCondition = {};
                                }

                                // Check if any condition field indicates damage and collect damaged items
                                const damagedChecklistItems: ChecklistItem[] = [];
                                checklistArray.forEach(checklistItem => {
                                    const returnValue = condition[checklistItem.id];
                                    const pickupValue = pickupCondition[checklistItem.id];

                                    if (checklistItem.type === 'boolean') {
                                        if (pickupValue === true && returnValue === false) {
                                            damagedChecklistItems.push(checklistItem);
                                        }
                                    }
                                });

                                const hasDamage = damagedChecklistItems.length > 0;

                                return (
                                    <div
                                        key={item.id}
                                        className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0"
                                    >
                                        <h3 className="text-base font-medium text-gray-900 mb-4">
                                            {item.product?.name || item.product_name || 'Silinmiş məhsul'}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Pickup Condition */}
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 mb-3">
                                                    Qəbul zamanı
                                                </div>
                                                <div className="space-y-2">
                                                    {checklistArray.length > 0 ? (
                                                        checklistArray
                                                            .filter(ci => ci.type !== 'text' || pickupCondition[ci.id])
                                                            .map((checklistItem) => (
                                                                <div key={checklistItem.id}>
                                                                    {renderConditionField(
                                                                        checklistItem,
                                                                        item.id,
                                                                        pickupCondition[checklistItem.id],
                                                                        false
                                                                    )}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <p className="text-sm text-gray-500">Məlumat yoxdur</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Return Condition */}
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 mb-3">
                                                    Qaytarma zamanı
                                                </div>
                                                <div className="space-y-2">
                                                    {checklistArray.length > 0 ? (
                                                        checklistArray.map((checklistItem) => (
                                                            <div key={checklistItem.id}>
                                                                {renderConditionField(
                                                                    checklistItem,
                                                                    item.id,
                                                                    pickupCondition[checklistItem.id],
                                                                    true
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-gray-500">Məlumat yoxdur</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Damage Section - shows damage inputs for each deteriorated checklist item */}
                                        {hasDamage && (
                                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                                <h4 className="text-sm font-medium text-red-800 mb-3">
                                                    Zərər Məlumatı
                                                </h4>
                                                <div className="space-y-4">
                                                    {damagedChecklistItems.map((checklistItem) => {
                                                        const damage = condition.damages?.[checklistItem.id] || { notes: '', fee: '0' };
                                                        return (
                                                            <div key={checklistItem.id} className="border-l-2 border-red-400 pl-3">
                                                                <div className="text-xs font-medium text-red-700 mb-2">
                                                                    ❌ {checklistItem.label_az}
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <label className="block text-xs text-gray-700 mb-1">
                                                                            Təsvir
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={damage.notes}
                                                                            onChange={(e) =>
                                                                                handleItemDamageChange(
                                                                                    item.id,
                                                                                    checklistItem.id,
                                                                                    'notes',
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            placeholder="Məs: Düymə qopub"
                                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-gray-700 mb-1">
                                                                            Təmir haqqı (₼)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            value={damage.fee}
                                                                            onChange={(e) =>
                                                                                handleItemDamageChange(
                                                                                    item.id,
                                                                                    checklistItem.id,
                                                                                    'fee',
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            min="0"
                                                                            step="0.01"
                                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        className="flex items-center text-xs text-slate-600 hover:text-slate-800 mt-2"
                                                    >
                                                        <CameraIcon className="h-3 w-3 mr-1" />
                                                        Şəkil əlavə et
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Collateral Return */}
                        {rental.collateral_type && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                                    Təminatın Qaytarılması
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-gray-600">Növ</div>
                                        <p className="text-base font-medium text-gray-900">
                                            {rental.collateral_type_label}{' '}
                                            {rental.collateral_document_number}
                                        </p>
                                    </div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={collateralReturned}
                                            onChange={(e) => setCollateralReturned(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 mr-2"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Müştəriyə təhvil verildi
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Notifications */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Bildiriş</h2>
                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={sendSms}
                                        onChange={(e) => setSendSms(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 mr-2"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Müştəriyə SMS göndər (qəbz)
                                    </span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={sendTelegram}
                                        onChange={(e) => setSendTelegram(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 mr-2"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Sahibə Telegram göndər (zərər qeydi)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Financial Summary & Actions */}
                    <div className="space-y-6">
                        {/* Financial Summary */}
                        <div className="bg-white shadow-sm rounded-lg p-6 sticky top-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                                Maliyyə Hesabatı
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">İcarə qiyməti</span>
                                    <span className="font-medium text-gray-900">
                                        ₼{rental.rental_price.toFixed(2)}
                                    </span>
                                </div>

                                {lateFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600">
                                            Gecikmə cəriməsi ({daysLate} gün)
                                        </span>
                                        <span className="font-medium text-red-600">
                                            ₼{lateFee.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {/* Cleaning fee with optional checkbox */}
                                <div className="border-t pt-3">
                                    <label className="flex items-center text-sm mb-2">
                                        <input
                                            type="checkbox"
                                            checked={needsCleaning}
                                            onChange={(e) => setNeedsCleaning(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 mr-2"
                                        />
                                        <span className="text-gray-700">Təmizlik tələb olunur</span>
                                    </label>
                                    {needsCleaning && (
                                        <div className="ml-6 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-600 whitespace-nowrap">Məbləğ (₼)</label>
                                                <input
                                                    type="number"
                                                    value={cleaningFeeAmount}
                                                    onChange={(e) => setCleaningFeeAmount(e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-orange-600">Təmizlik haqqı</span>
                                                <span className="font-medium text-orange-600">
                                                    ₼{cleaningFee.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {damageFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600">Zərər haqqı</span>
                                        <span className="font-medium text-red-600">
                                            ₼{damageFee.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-3 border-t">
                                    <div className="flex justify-between mb-3">
                                        <span className="text-base font-medium text-gray-900">CƏMİ</span>
                                        <span className="text-base font-bold text-gray-900">
                                            ₼{totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-gray-600">Əvvəl ödənilib</span>
                                        <span className="font-medium text-gray-900">
                                            ₼{rental.paid_amount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-gray-900">ÖDƏNİLMƏLİ</span>
                                        <span
                                            className={
                                                remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                                            }
                                        >
                                            ₼{remainingBalance.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Type */}
                                <div className="pt-4 border-t">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ödəniş
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payment_type"
                                                value="full"
                                                checked={paymentType === 'full'}
                                                onChange={() => setPaymentType('full')}
                                                className="text-blue-600 mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Tam</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payment_type"
                                                value="partial"
                                                checked={paymentType === 'partial'}
                                                onChange={() => setPaymentType('partial')}
                                                className="text-blue-600 mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Qismən</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payment_type"
                                                value="credit"
                                                checked={paymentType === 'credit'}
                                                onChange={() => setPaymentType('credit')}
                                                className="text-blue-600 mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Borc</span>
                                        </label>
                                    </div>

                                    {/* Partial payment amount input */}
                                    {paymentType === 'partial' && (
                                        <div className="mt-3 ml-6">
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Ödəniləcək məbləğ (₼)
                                            </label>
                                            <input
                                                type="number"
                                                value={partialPaymentAmount}
                                                onChange={(e) => setPartialPaymentAmount(e.target.value)}
                                                min="0"
                                                max={remainingBalance}
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div className="pt-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                paymentMethod === 'cash'
                                                    ? 'bg-slate-700 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {translatePaymentMethod('cash')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('card')}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                paymentMethod === 'card'
                                                    ? 'bg-slate-700 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {translatePaymentMethod('card')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('transfer')}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                paymentMethod === 'transfer'
                                                    ? 'bg-slate-700 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {translatePaymentMethod('bank_transfer')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowConfirmModal(true)}
                                className="w-full flex items-center justify-center px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-medium shadow-sm"
                            >
                                <CheckIcon className="h-5 w-5 mr-2" />
                                Qaytarmanı Tamamla
                            </button>
                            <button
                                onClick={() => router.visit(route('rentals.show', rental.id))}
                                className="w-full flex items-center justify-center px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium shadow-sm"
                            >
                                <XMarkIcon className="h-5 w-5 mr-2" />
                                Ləğv et
                            </button>
                        </div>
                    </div>
                </div>

                {/* Confirm Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Qaytarmanı Təsdiqlə</h3>
                            <div className="mb-6">
                                {/* Warning if there's remaining balance */}
                                {remainingBalance > 0 && (
                                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm font-medium text-yellow-800 mb-1">
                                            ⚠️ Diqqət: Ödənilməmiş məbləğ var
                                        </p>
                                        <p className="text-xs text-yellow-700">
                                            {paymentType === 'full' && 'Qaytarmanı təsdiqləməklə tam ödəniş qəbul ediləcək və ödəniş qeydi yaradılacaq.'}
                                            {paymentType === 'partial' && `Qismən ödəniş qəbul ediləcək və ₼${((remainingBalance) - (parseFloat(partialPaymentAmount) || 0)).toFixed(2)} borc qalacaq.`}
                                            {paymentType === 'credit' && 'Qaytarmanı təsdiqləməklə məhsul qaytarılacaq, lakin borc hesabda qalacaq.'}
                                        </p>
                                    </div>
                                )}

                                <p className="text-sm text-gray-600 mb-4">
                                    Aşağıdakı məlumatları yoxlayın və təsdiqləyin:
                                </p>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Ümumi məbləğ:</span>
                                        <span className="font-semibold text-gray-900">
                                            ₼{totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Əvvəl ödənilib:</span>
                                        <span className="font-medium text-gray-600">
                                            ₼{rental.paid_amount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t pt-2">
                                        <span className="text-gray-600">Qalıq borc:</span>
                                        <span className="font-bold text-red-600">
                                            ₼{remainingBalance.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Show payment details based on type */}
                                    {remainingBalance > 0 && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Ödəniş növü:</span>
                                                <span className="font-medium text-gray-900">
                                                    {paymentType === 'full' && 'Tam ödəniş'}
                                                    {paymentType === 'partial' && 'Qismən ödəniş'}
                                                    {paymentType === 'credit' && 'Borc'}
                                                </span>
                                            </div>
                                            {paymentType === 'full' && (
                                                <div className="flex justify-between text-sm mt-1">
                                                    <span className="text-green-700">İndi ödəniləcək:</span>
                                                    <span className="font-bold text-green-700">
                                                        ₼{remainingBalance.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            {paymentType === 'partial' && (
                                                <>
                                                    <div className="flex justify-between text-sm mt-1">
                                                        <span className="text-green-700">İndi ödəniləcək:</span>
                                                        <span className="font-bold text-green-700">
                                                            ₼{(parseFloat(partialPaymentAmount) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm mt-1">
                                                        <span className="text-orange-600">Yeni borc:</span>
                                                        <span className="font-bold text-orange-600">
                                                            ₼{Math.max(0, remainingBalance - (parseFloat(partialPaymentAmount) || 0)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={handleSubmitConfirm}
                                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-medium"
                                >
                                    Təsdiq et və Qaytarışı Tamamla
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
