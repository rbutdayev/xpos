import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ShiftStatusWarningModal from '@/Components/ShiftStatusWarningModal';

interface GiftCardInfo {
    id: number;
    card_number: string;
    status: string;
    denomination: number;
    current_balance: number;
    customer_id: number | null;
}

interface Customer {
    id: number;
    name: string;
    phone?: string;
}

interface GiftCardSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    branchId?: string;
}

export default function GiftCardSaleModal({ isOpen, onClose, customers, branchId }: GiftCardSaleModalProps) {
    const [cardNumber, setCardNumber] = useState('');
    const [cardInfo, setCardInfo] = useState<GiftCardInfo | null>(null);
    const [customerId, setCustomerId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'nağd' | 'kart' | 'köçürmə'>('nağd');
    const [expiryMonths, setExpiryMonths] = useState(12);
    const [isLooking, setIsLooking] = useState(false);
    const [isSelling, setIsSelling] = useState(false);
    const [error, setError] = useState('');

    // Shift status warning modal
    const [shiftWarningModalOpen, setShiftWarningModalOpen] = useState(false);
    const [shiftWarningType, setShiftWarningType] = useState<'offline' | 'closed'>('closed');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setCardNumber('');
            setCardInfo(null);
            setCustomerId('');
            setPaymentMethod('nağd');
            setExpiryMonths(12);
            setError('');
        }
    }, [isOpen]);

    const handleLookup = async () => {
        if (!cardNumber.trim()) {
            setError('Kart nömrəsini daxil edin');
            return;
        }

        setIsLooking(true);
        setError('');
        setCardInfo(null);

        try {
            const response = await axios.post(route('pos.gift-card.lookup'), {
                card_number: cardNumber.trim()
            });

            if (response.data.success) {
                setCardInfo(response.data.card);

                if (response.data.card.status !== 'configured') {
                    setError(`Bu kart satıla bilməz. Status: ${response.data.card.status}`);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Kart tapılmadı');
            setCardInfo(null);
        } finally {
            setIsLooking(false);
        }
    };

    // Check shift status before submitting
    const checkShiftStatus = async (): Promise<{ online: boolean; shift_open: boolean | null }> => {
        try {
            const response = await fetch('/api/shift-status', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('Failed to check shift status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking shift status:', error);
            return { online: false, shift_open: null };
        }
    };

    // Handle opening shift from modal
    const handleOpenShift = async () => {
        try {
            const response = await fetch('/fiscal-printer/shift/open', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('Failed to open shift');
            }

            const data = await response.json();

            if (data.success) {
                toast.success('Növbə açılır...', { duration: 3000 });

                // Wait for shift to open
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Check status again
                const status = await checkShiftStatus();

                if (status.shift_open) {
                    toast.success('Növbə açıldı!', { duration: 2000 });
                    setShiftWarningModalOpen(false);
                    // Now submit the sale
                    performSale();
                } else {
                    toast.error('Növbə açılmadı. Yenidən cəhd edin.');
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error: any) {
            console.error('Error opening shift:', error);
            toast.error(`Növbə açılarkən xəta: ${error.message}`, { duration: 5000 });
        }
    };

    // Actually perform the sale (called after shift check passes)
    const performSale = async () => {
        setIsSelling(true);
        setError('');

        try {
            const response = await axios.post(route('pos.gift-card.sell'), {
                card_number: cardInfo!.card_number,
                customer_id: customerId || null,
                payment_method: paymentMethod,
                branch_id: branchId || null,
                gift_card_expiry_months: expiryMonths
            });

            if (response.data.success) {
                toast.success('Hədiyyə kartı uğurla satıldı!');

                // Show sale details
                const saleInfo = response.data.sale;
                const cardData = response.data.card;

                toast.success(
                    `Satış #${saleInfo.sale_number}\n` +
                    `Kart: ${cardData.card_number}\n` +
                    `Məbləğ: ₼${cardData.denomination}\n` +
                    (saleInfo.fiscal_number ? `Fiskal: ${saleInfo.fiscal_number}` : ''),
                    { duration: 5000 }
                );

                // Close modal and refresh page
                onClose();
                router.reload();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Satış zamanı xəta baş verdi');
        } finally {
            setIsSelling(false);
        }
    };

    const handleSell = async () => {
        if (!cardInfo) {
            setError('Əvvəlcə kartı axtarın');
            return;
        }

        if (cardInfo.status !== 'configured') {
            setError('Yalnız konfiqurasiya olunmuş kartlar satıla bilər');
            return;
        }

        // Check shift status before selling
        const status = await checkShiftStatus();

        if (!status.online) {
            // Agent is offline
            setShiftWarningType('offline');
            setShiftWarningModalOpen(true);
            return;
        }

        if (!status.shift_open) {
            // Shift is closed
            setShiftWarningType('closed');
            setShiftWarningModalOpen(true);
            return;
        }

        // All checks passed, perform the sale
        performSale();
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLookup();
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Hədiyyə Kartı Satışı</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isSelling}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Card Number Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kart Nömrəsi
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value.toUpperCase())}
                                onKeyPress={handleKeyPress}
                                placeholder="AZ-CARD-123456"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                disabled={isLooking || isSelling}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={handleLookup}
                                disabled={isLooking || isSelling || !cardNumber.trim()}
                                className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isLooking ? 'Axtarılır...' : 'Axtar'}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Kart nömrəsini daxil edin və ya barkodu skan edin</p>
                    </div>

                    {/* Card Info Display */}
                    {cardInfo && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Kart:</span>
                                <span className="text-sm text-gray-900 font-mono">{cardInfo.card_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Məbləğ:</span>
                                <span className="text-lg font-bold text-green-600">₼{cardInfo.denomination}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                <span className={`text-sm font-medium ${
                                    cardInfo.status === 'configured' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {cardInfo.status === 'configured' ? 'Satışa Hazır' : cardInfo.status}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Customer Selection */}
                    {cardInfo && cardInfo.status === 'configured' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Müştəri (İxtiyari)
                                </label>
                                <select
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    disabled={isSelling}
                                >
                                    <option value="">Seçin...</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ödəniş Metodu
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('nağd')}
                                        disabled={isSelling}
                                        className={`px-4 py-2 border rounded-md font-medium transition-colors ${
                                            paymentMethod === 'nağd'
                                                ? 'bg-slate-700 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Nağd
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('kart')}
                                        disabled={isSelling}
                                        className={`px-4 py-2 border rounded-md font-medium transition-colors ${
                                            paymentMethod === 'kart'
                                                ? 'bg-slate-700 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Kart
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('köçürmə')}
                                        disabled={isSelling}
                                        className={`px-4 py-2 border rounded-md font-medium transition-colors ${
                                            paymentMethod === 'köçürmə'
                                                ? 'bg-slate-700 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Köçürmə
                                    </button>
                                </div>
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Etibarlılıq Müddəti
                                </label>
                                <select
                                    value={expiryMonths}
                                    onChange={(e) => setExpiryMonths(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    disabled={isSelling}
                                >
                                    <option value={1}>1 ay</option>
                                    <option value={3}>3 ay</option>
                                    <option value={6}>6 ay</option>
                                    <option value={12}>12 ay (standart)</option>
                                    <option value={18}>18 ay</option>
                                    <option value={24}>24 ay (2 il)</option>
                                    <option value={36}>36 ay (3 il)</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Kartın etibarlılıq müddəti satışdan sonra bu qədər ay olacaq
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSelling}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Ləğv et
                    </button>
                    {cardInfo && cardInfo.status === 'configured' && (
                        <button
                            type="button"
                            onClick={handleSell}
                            disabled={isSelling}
                            className="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                        >
                            {isSelling ? 'Satılır...' : `₼${cardInfo.denomination} - Sat`}
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Shift Status Warning Modal */}
        <ShiftStatusWarningModal
            show={shiftWarningModalOpen}
            type={shiftWarningType}
            onContinue={() => {
                setShiftWarningModalOpen(false);
                performSale();
            }}
            onCancel={() => {
                setShiftWarningModalOpen(false);
            }}
            onOpenShift={shiftWarningType === 'closed' ? handleOpenShift : undefined}
        />
        </>
    );
}
