import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product, Customer, Branch, LoyaltyProgram } from '@/types';
import CustomerSection from './components/CustomerSection';
import ProductSearchSection from './components/ProductSearchSection';
import CartSection from './components/CartSection';
import SummaryPaymentSection from './components/SummaryPaymentSection';
import VariantSelectorModal from './components/VariantSelectorModal';
import GiftCardSaleModal from './components/GiftCardSaleModal';
import ReturnModal from '@/Components/ReturnModal';
import ShiftStatusWidget from '@/Components/ShiftStatusWidget';
import ShiftStatusWarningModal from '@/Components/ShiftStatusWarningModal';
import { useCart } from './hooks/useCart';
import { useSearch } from './hooks/useSearch';
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

interface POSIndexProps extends PageProps {
  branches: Branch[];
  customers: Customer[];
  fiscalPrinterEnabled: boolean;
  fiscalConfig: FiscalConfig | null;
  loyaltyProgram?: LoyaltyProgram | null;
  giftCardsEnabled?: boolean;
}

export default function Index({ auth, branches, customers, fiscalPrinterEnabled, fiscalConfig, loyaltyProgram, giftCardsEnabled }: POSIndexProps) {
  const { t } = useTranslation('sales');

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
    payment_method: 'nağd' as 'nağd' | 'kart' | 'köçürmə' | 'bank_kredit',
    paid_amount: 0,
    credit_amount: 0,
    credit_due_date: '',
    credit_description: '',
    use_fiscal_printer: true,
    points_to_redeem: 0,
    gift_card_code: '',
    gift_card_amount: 0,
    gift_card_expiry_months: 12, // Default 12 months for gift card sales
  });

  // Selected customer will be managed by CustomerSection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Cart state and operations
  const { cart, setCart, subtotal, addToCart, updateCartItem, removeFromCart, changeItemUnit } = useCart([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Fiscal printer status
  const [fiscalPrintStatus, setFiscalPrintStatus] = useState<string | null>(null);
  const [fiscalPrintLoading, setFiscalPrintLoading] = useState(false);

  const { flash } = usePage<any>().props;

  // Variant selector modal state
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  // Gift card sale modal state
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false);

  // Shift status warning modal state
  const [shiftWarningModalOpen, setShiftWarningModalOpen] = useState(false);
  const [shiftWarningType, setShiftWarningType] = useState<'offline' | 'closed'>('closed');
  const [pendingSaleSubmission, setPendingSaleSubmission] = useState(false);

  // Product search using debounced + abortable fetch
  const { query: itemSearch, setQuery: setItemSearch, results: searchResults, loading: isSearching, searchImmediate } = useSearch(formData.branch_id);

  // Calculate totals
  const taxAmount = formData.tax_amount;
  const discountAmount = formData.discount_amount;
  const grandTotal = useMemo(() => subtotal + taxAmount - discountAmount, [subtotal, taxAmount, discountAmount]);

  // Update payment amounts when payment status or total changes
  useEffect(() => {
    if (formData.payment_status === 'paid') {
      setFormData((prev) => ({ ...prev, paid_amount: grandTotal, credit_amount: 0 }));
    } else if (formData.payment_status === 'credit') {
      setFormData((prev) => ({ ...prev, paid_amount: 0, credit_amount: grandTotal }));
    }
    // For partial payments, keep user input and calculate the other amount
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          toast.success(t('pos.fiscalPrintCompleted', { fiscalNumber: data.fiscal_number }), {
            duration: 5000,
            icon: '✅'
          });
          if (interval) clearInterval(interval);
        } else if (data.status === 'failed') {
          setFiscalPrintStatus('failed');
          setFiscalPrintLoading(false);
          toast.error(t('pos.fiscalPrintError', { error: data.error || 'Unknown error' }), {
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
          toast.error(t('pos.fiscalPrintTimeout'), {
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

  // Handle product selection (check if has variants)
  const handleProductSelect = (product: Product) => {
    // Check if product has variants
    if (product.has_variants && product.variants && product.variants.length > 0) {
      // Open variant selector modal
      setSelectedProductForVariant(product);
      setVariantModalOpen(true);
    } else {
      // Add directly to cart without variant
      addToCart(product);
    }

    // Clear search
    setItemSearch('');
  };

  // Handle variant selection from modal
  const handleVariantSelect = (product: Product, variant: any) => {
    addToCart(product, variant);
    setVariantModalOpen(false);
    setSelectedProductForVariant(null);
  };

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
        toast.success(t('pos.shiftOpening'), { duration: 3000 });

        // Wait a bit for the shift to actually open
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check status again
        const status = await checkShiftStatus();

        if (status.shift_open) {
          toast.success(t('pos.shiftOpened'), { duration: 2000 });
          setShiftWarningModalOpen(false);
          // Now submit the sale
          submitSale();
        } else {
          toast.error(t('pos.shiftNotOpened'));
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error opening shift:', error);
      toast.error(t('pos.shiftOpenError', { error: error.message }), { duration: 5000 });
    }
  };

  // Actually submit the sale (called directly or after modal confirmation)
  const submitSale = () => {
    const submitData = {
      ...formData,
      items: cart.map((item) => ({
        item_type: 'product',
        product_id: item.product_id,
        variant_id: item.variant_id,
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
      onSuccess: () => {
        setCart([]);
        setFormData((prev) => ({
          ...prev,
          customer_id: '',
          notes: '',
          discount_amount: 0,
          tax_amount: 0,
          payment_status: 'paid',
          payment_method: 'nağd',
          paid_amount: 0,
          credit_amount: 0,
          credit_due_date: '',
        }));
      },
      onError: (errs) => {
        console.error('Sale submission errors:', errs);
        setErrors(errs);
        // Show toast notifications for all errors
        Object.entries(errs).forEach(([field, message]) => {
          if (typeof message === 'string') {
            toast.error(message, { duration: 5000 });
          } else if (Array.isArray(message)) {
            (message as string[]).forEach((msg: string) => toast.error(msg, { duration: 5000 }));
          }
        });
        setProcessing(false);
      },
      onFinish: () => setProcessing(false),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent accidental form submission from barcode scanner Enter key
    const activeElement = document.activeElement;
    if (activeElement && activeElement.id === 'itemSearch') {
      // If the search input is focused, ignore form submission
      // This happens when barcode scanners send Enter key after scanning
      return;
    }

    setProcessing(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.branch_id) newErrors.branch_id = t('pos.errors.branchRequired');
    if (cart.length === 0) newErrors.items = t('pos.errors.minOneProduct');

    // For credit or partial payment, customer is required
    if ((formData.payment_status === 'credit' || formData.payment_status === 'partial') && !formData.customer_id) {
      newErrors.customer_id = t('pos.errors.customerRequiredForCredit');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setProcessing(false);
      return;
    }

    // Check shift status if fiscal printer is enabled
    if (fiscalPrinterEnabled && formData.use_fiscal_printer) {
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

  return (
    <AuthenticatedLayout>
      <Head title={t('pos.title')} />
      <div className="py-6">
        <div className="w-full">
          {/* Fiscal Print Status Banner */}
          {fiscalPrintLoading && (
            <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 mx-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    {t('pos.fiscalPrintWaiting', { status: fiscalPrintStatus === 'processing' ? t('messages.processing') : t('messages.queued') })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Display general errors */}
            {(errors.items || errors.general) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                {errors.general && <p className="text-red-600 text-sm font-medium">{errors.general}</p>}
                {errors.items && <p className="text-red-600 text-sm">{errors.items}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Customer & Details */}
              <div className="lg:col-span-2">
                {/* Customer Selection */}
                <CustomerSection
                  branches={branches}
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  userBranchId={auth?.user?.branch_id}
                  onCustomerChange={setSelectedCustomer}
                />

                {/* Product Search with Gift Card Button */}
                <div className="relative">
                  <ProductSearchSection
                    query={itemSearch}
                    setQuery={(q) => setItemSearch(q)}
                    loading={!!isSearching}
                    results={searchResults}
                    onSelect={handleProductSelect}
                    branchId={formData.branch_id}
                    searchImmediate={searchImmediate}
                  />
                  {giftCardsEnabled && (
                    <button
                      type="button"
                      onClick={() => setGiftCardModalOpen(true)}
                      className="absolute top-6 right-6 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('pos.giftCard')}
                    </button>
                  )}
                </div>

                {/* Cart Items */}
                <CartSection cart={cart} updateCartItem={updateCartItem} removeFromCart={removeFromCart} changeItemUnit={changeItemUnit} />
              </div>

              {/* Right Column - Summary & Actions */}
              <div className="lg:col-span-1">
                {/* Return Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>{t('pos.returnProduct')}</span>
                  </button>
                </div>

                <SummaryPaymentSection
                  processing={processing}
                  subtotal={subtotal}
                  taxAmount={formData.tax_amount}
                  discountAmount={formData.discount_amount}
                  grandTotal={grandTotal}
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  cartCount={cart.length}
                  fiscalPrinterEnabled={fiscalPrinterEnabled}
                  fiscalConfig={fiscalConfig}
                  loyaltyProgram={loyaltyProgram}
                  selectedCustomer={selectedCustomer}
                  giftCardsEnabled={giftCardsEnabled}
                />
              </div>
            </div>
          </form>

          {/* Variant Selector Modal */}
          {selectedProductForVariant && (
            <VariantSelectorModal
              product={selectedProductForVariant}
              isOpen={variantModalOpen}
              onClose={() => {
                setVariantModalOpen(false);
                setSelectedProductForVariant(null);
              }}
              onSelect={handleVariantSelect}
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

