import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PageProps, Product, Customer, Branch, LoyaltyProgram } from '@/types';
import TouchCart from './components/TouchCart';
import TouchHeader from './components/TouchHeader';
import TouchPayment from './components/TouchPayment';
import ProductSearchSection from '../POS/components/ProductSearchSection';
import GiftCardSaleModal from '../POS/components/GiftCardSaleModal';
import PrintModal from '@/Components/PrintModal';
import ReturnModal from '@/Components/ReturnModal';
import ShiftStatusWarningModal from '@/Components/ShiftStatusWarningModal';
import { useCart } from '../POS/hooks/useCart';
import { useSearch } from '../POS/hooks/useSearch';
import toast from 'react-hot-toast';

interface FiscalConfig {
  id: number;
  provider: string;
  name: string;
  shift_open: boolean;
  shift_opened_at: string | null;
  last_z_report_at: string | null;
  credit_contract_number?: string;
}

interface TouchPOSProps extends PageProps {
  customers: Customer[];
  branches: Branch[];
  fiscalConfig: FiscalConfig | null;
  loyaltyProgram?: LoyaltyProgram | null;
  giftCardsEnabled?: boolean;
}

export default function TouchPOS({ auth, customers, branches, fiscalConfig, loyaltyProgram, giftCardsEnabled }: TouchPOSProps) {
  // Determine initial branch selection
  const getUserBranch = () => {
    // If user is assigned to a branch, use that
    if (auth?.user?.branch_id) {
      return auth.user.branch_id.toString();
    }
    // If only one branch available, auto-select it
    if (branches.length === 1) {
      return branches[0].id.toString();
    }
    return '';
  };

  // Form data (simplified for sales only)
  const [formData, setFormData] = useState({
    customer_id: '',
    branch_id: getUserBranch(),
    tax_amount: 0,
    discount_amount: 0,
    notes: '',
    payment_status: 'paid' as 'paid' | 'credit' | 'partial',
    payment_method: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'bank_credit',
    paid_amount: 0,
    credit_amount: 0,
    credit_due_date: '',
    credit_description: '',
    points_to_redeem: 0,
    gift_card_code: '',
    gift_card_amount: 0,
    gift_card_expiry_months: 12, // Default 12 months for gift card sales
  });

  // Selected customer
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id.toString() === formData.customer_id) || null,
    [customers, formData.customer_id]
  );

  // Cart state
  const { cart, setCart, subtotal, addToCart, updateCartItem, removeFromCart, changeItemUnit } = useCart([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Number pad state
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [numberPadValue, setNumberPadValue] = useState('');
  const [numberPadTargetIndex, setNumberPadTargetIndex] = useState<number | null>(null); // cart item index

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [lastSaleNumber, setLastSaleNumber] = useState<string>('');

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  // Gift card sale modal state
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false);

  // Shift status warning modal state
  const [shiftWarningModalOpen, setShiftWarningModalOpen] = useState(false);
  const [shiftWarningType, setShiftWarningType] = useState<'offline' | 'closed'>('closed');
  const [pendingSaleSubmission, setPendingSaleSubmission] = useState(false);

  // Fiscal printer status
  const [fiscalPrintStatus, setFiscalPrintStatus] = useState<string | null>(null);
  const [fiscalPrintLoading, setFiscalPrintLoading] = useState(false);

  const { flash } = usePage<any>().props;

  // Product search using exact same logic as POS (only products, no services)
  const { query: itemSearch, setQuery: setItemSearch, results: searchResults, loading: isSearching, searchImmediate } = useSearch(formData.branch_id);

  // Calculate totals
  const taxAmount = formData.tax_amount;
  const discountAmount = formData.discount_amount;
  const grandTotal = subtotal + taxAmount - discountAmount;

  // Update payment amounts when total changes
  useEffect(() => {
    if (formData.payment_status === 'paid') {
      setFormData((prev) => ({ ...prev, paid_amount: grandTotal, credit_amount: 0 }));
    } else if (formData.payment_status === 'credit') {
      setFormData((prev) => ({ ...prev, paid_amount: 0, credit_amount: grandTotal }));
    }
  }, [formData.payment_status, grandTotal]);

  // Fiscal printer status polling
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;

    const pollFiscalStatus = async (saleId: number) => {
      try {
        const response = await fetch(`/api/jobs/sale/${saleId}/status`, {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin'
        });

        if (!response.ok) {
          console.error('Failed to fetch fiscal status');
          return;
        }

        const data = await response.json();

        if (data.status === 'completed') {
          setFiscalPrintStatus('completed');
          setFiscalPrintLoading(false);
          toast.success(`Fiskal çap tamamlandı! №${data.fiscal_number}`, {
            duration: 5000,
            icon: '✅'
          });
          if (interval) clearInterval(interval);
        } else if (data.status === 'failed') {
          setFiscalPrintStatus('failed');
          setFiscalPrintLoading(false);
          toast.error(`Fiskal çap xətası: ${data.error || 'Naməlum xəta'}`, {
            duration: 7000,
            icon: '❌'
          });
          if (interval) clearInterval(interval);
        } else if (data.status === 'pending' || data.status === 'processing') {
          setFiscalPrintStatus(data.status);
          setFiscalPrintLoading(true);
        }
      } catch (error) {
        console.error('Error polling fiscal status:', error);
      }
    };

    // Start polling if sale was just completed
    if (flash?.sale_completed && flash?.sale_id) {
      setFiscalPrintLoading(true);
      pollFiscalStatus(flash.sale_id); // Initial poll
      interval = setInterval(() => pollFiscalStatus(flash.sale_id), 2000); // Poll every 2 seconds

      // Stop polling after 2 minutes
      timeout = setTimeout(() => {
        if (interval) clearInterval(interval);
        if (fiscalPrintLoading) {
          setFiscalPrintLoading(false);
          toast.error('Fiskal çap müddəti doldu. Bridge aktiv deyilmi?', {
            duration: 5000
          });
        }
      }, 120000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [flash?.sale_completed, flash?.sale_id]);

  // Handle sale completion and auto-print
  useEffect(() => {
    if (flash?.sale_completed && flash?.sale_id) {
      // Show success toast
      toast.success(flash.success || `Satış uğurla tamamlandı! Qaimə #${flash.sale_number}`, {
        duration: 4000,
        position: 'top-center',
      });

      // Store sale info for printing
      setLastSaleId(flash.sale_id);
      setLastSaleNumber(flash.sale_number || '');

      // Always show print modal after sale (auto-print will trigger automatically if enabled)
      setTimeout(() => {
        setShowPrintModal(true);
      }, 500);
    }
  }, [flash]);

  // Check shift status before submitting sale
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
      // If we can't check status, assume offline
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

        // Wait a bit for the shift to actually open
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check status again
        const status = await checkShiftStatus();

        if (status.shift_open) {
          toast.success('Növbə açıldı!', { duration: 2000 });
          setShiftWarningModalOpen(false);
          // Now submit the sale
          submitSale();
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

  // Actually submit the sale (called directly or after modal confirmation)
  const submitSale = () => {
    const submitData = {
      ...formData,
      items: cart.map((item) => ({
        item_type: 'product',
        product_id: item.product_id,
        item_name: item.item_name,
        quantity: item.quantity,
        base_quantity: item.base_quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        notes: item.notes,
      })),
      total: grandTotal,
    };

    router.post('/pos/sale', submitData, {
      preserveScroll: true,
      preserveState: false,
      onSuccess: () => {
        setCart([]);
        setFormData((prev) => ({
          ...prev,
          customer_id: '',
          notes: '',
          discount_amount: 0,
          tax_amount: 0,
          payment_status: 'paid',
          payment_method: 'cash',
          paid_amount: 0,
          credit_amount: 0,
          credit_due_date: '',
        }));
      },
      onError: (errs) => {
        console.error('Sale submission errors:', errs);
        setErrors(errs);
        setProcessing(false);
      },
      onFinish: () => setProcessing(false),
    });
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.branch_id) newErrors.branch_id = 'Filial seçmək məcburidir';
    if (cart.length === 0) newErrors.items = 'Ən azı bir məhsul əlavə edilməlidir';

    // For credit or partial payment, customer is required
    if ((formData.payment_status === 'credit' || formData.payment_status === 'partial') && !formData.customer_id) {
      newErrors.customer_id = 'Borc və ya qismən ödəniş üçün müştəri seçmək məcburidir';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setProcessing(false);
      return;
    }

    // Check shift status if fiscal printer is enabled
    if (fiscalConfig) {
      const status = await checkShiftStatus();

      if (!status.online) {
        // Agent is offline
        setShiftWarningType('offline');
        setShiftWarningModalOpen(true);
        setPendingSaleSubmission(true);
        setProcessing(false);
        return;
      }

      if (!status.shift_open) {
        // Shift is closed
        setShiftWarningType('closed');
        setShiftWarningModalOpen(true);
        setPendingSaleSubmission(true);
        setProcessing(false);
        return;
      }
    }

    // All checks passed, submit the sale
    submitSale();
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <>
      <Head title="TouchPOS" />
      <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
        {/* Floating Home Button - Fixed Position */}
        <Link
          href="/dashboard"
          className="fixed bottom-6 left-6 z-50 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-all border-2 border-gray-300 group"
          title="Ana Səhifə"
        >
          <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>

        {/* Header */}
        <TouchHeader
          branches={branches}
          formData={formData}
          setFormData={setFormData}
          userBranchId={auth?.user?.branch_id}
          onClearCart={clearCart}
          cartCount={cart.length}
          onOpenReturn={() => setReturnModalOpen(true)}
          fiscalConfig={fiscalConfig}
        />

        {/* Fiscal Print Status Banner */}
        {fiscalPrintLoading && (
          <div className="bg-blue-50 border-b-2 border-blue-400 px-4 py-2">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 text-blue-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-700 font-medium">
                Fiskal çap gözləyir... ({fiscalPrintStatus === 'processing' ? 'İşlənir' : 'Növbədə'})
              </span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Search and Cart */}
          <div className="flex-1 overflow-auto p-4">
            {/* Product Search with Gift Card Button */}
            <div className="relative">
              <ProductSearchSection
                query={itemSearch}
                setQuery={setItemSearch}
                loading={!!isSearching}
                results={searchResults}
                onSelect={(item) => {
                  addToCart(item);
                  setItemSearch('');
                }}
                branchId={formData.branch_id}
                searchImmediate={searchImmediate}
              />
              <button
                type="button"
                onClick={() => setGiftCardModalOpen(true)}
                className="absolute top-6 right-6 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hədiyyə Kartı
              </button>
            </div>

            {/* Cart Items */}
            <TouchCart
              cart={cart}
              updateCartItem={updateCartItem}
              removeFromCart={removeFromCart}
              changeItemUnit={changeItemUnit}
            />
          </div>

          {/* Right Side - Payment Only */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Print Last Receipt Button (if sale was just completed) */}
            {lastSaleId && (
              <div className="p-4 bg-green-50 border-b border-green-200">
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Qəbzi Çap Et #{lastSaleNumber}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              <TouchPayment
                processing={processing}
                subtotal={subtotal}
                taxAmount={taxAmount}
                discountAmount={discountAmount}
                grandTotal={grandTotal}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                errors={errors}
                cartCount={cart.length}
                fiscalConfig={fiscalConfig}
                loyaltyProgram={loyaltyProgram}
                selectedCustomer={selectedCustomer}
                giftCardsEnabled={giftCardsEnabled}
              />
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {Object.keys(errors).length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            {Object.entries(errors).map(([key, message]) => (
              <div key={key}>{message}</div>
            ))}
          </div>
        )}
      </div>

      {/* Print Modal */}
      {lastSaleId && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          resourceType="sale"
          resourceId={lastSaleId}
          title={`Satış: ${lastSaleNumber}`}
          autoTrigger={flash?.auto_print}
        />
      )}

      {/* Return Modal */}
      <ReturnModal
        show={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
      />

      {/* Shift Status Warning Modal */}
      <ShiftStatusWarningModal
        show={shiftWarningModalOpen}
        type={shiftWarningType}
        onContinue={() => {
          setShiftWarningModalOpen(false);
          setPendingSaleSubmission(false);
          submitSale();
        }}
        onCancel={() => {
          setShiftWarningModalOpen(false);
          setPendingSaleSubmission(false);
        }}
        onOpenShift={shiftWarningType === 'closed' ? handleOpenShift : undefined}
      />

      {/* Gift Card Sale Modal */}
      <GiftCardSaleModal
        isOpen={giftCardModalOpen}
        onClose={() => setGiftCardModalOpen(false)}
        customers={customers}
        branchId={formData.branch_id}
      />
    </>
  );
}