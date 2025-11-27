import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product, Customer, Branch, LoyaltyProgram } from '@/types';
import CustomerSection from './components/CustomerSection';
import ProductSearchSection from './components/ProductSearchSection';
import CartSection from './components/CartSection';
import SummaryPaymentSection from './components/SummaryPaymentSection';
import VariantSelectorModal from './components/VariantSelectorModal';
import ReturnModal from '@/Components/ReturnModal';
import { useCart } from './hooks/useCart';
import { useSearch } from './hooks/useSearch';
import toast from 'react-hot-toast';

interface POSIndexProps extends PageProps {
  branches: Branch[];
  fiscalPrinterEnabled: boolean;
  loyaltyProgram?: LoyaltyProgram | null;
}

export default function Index({ auth, branches, fiscalPrinterEnabled, loyaltyProgram }: POSIndexProps) {

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
    payment_method: 'nağd' as 'nağd' | 'kart' | 'köçürmə',
    paid_amount: 0,
    credit_amount: 0,
    credit_due_date: '',
    credit_description: '',
    use_fiscal_printer: true,
    points_to_redeem: 0,
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


  const handleSubmit = (e: React.FormEvent) => {
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
        setProcessing(false);
      },
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <AuthenticatedLayout header={
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">POS Satış</h2>
        <button
          type="button"
          onClick={() => setReturnModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-900 focus:outline-none focus:border-red-900 focus:ring ring-red-300 disabled:opacity-25 transition ease-in-out duration-150"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Mal Qaytarma
        </button>
      </div>
    }>
      <Head title="POS Satış" />
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
                    Fiskal çap gözləyir... ({fiscalPrintStatus === 'processing' ? 'İşlənir' : 'Növbədə'})
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

                {/* Product Search */}
                <ProductSearchSection
                  query={itemSearch}
                  setQuery={(q) => setItemSearch(q)}
                  loading={!!isSearching}
                  results={searchResults}
                  onSelect={handleProductSelect}
                  branchId={formData.branch_id}
                  searchImmediate={searchImmediate}
                />

                {/* Cart Items */}
                <CartSection cart={cart} updateCartItem={updateCartItem} removeFromCart={removeFromCart} changeItemUnit={changeItemUnit} />
              </div>

              {/* Right Column - Summary & Actions */}
              <div className="lg:col-span-1">
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
                  loyaltyProgram={loyaltyProgram}
                  selectedCustomer={selectedCustomer}
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

