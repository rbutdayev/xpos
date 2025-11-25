import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps, Product, Customer, Branch, LoyaltyProgram } from '@/types';
import TouchCart from './components/TouchCart';
import TouchHeader from './components/TouchHeader';
import TouchPayment from './components/TouchPayment';
import ProductSearchSection from '../POS/components/ProductSearchSection';
import PrintModal from '@/Components/PrintModal';
import { useCart } from '../POS/hooks/useCart';
import { useSearch } from '../POS/hooks/useSearch';
import toast from 'react-hot-toast';

interface TouchPOSProps extends PageProps {
  customers: Customer[];
  branches: Branch[];
  loyaltyProgram?: LoyaltyProgram | null;
}

export default function TouchPOS({ auth, customers, branches, loyaltyProgram }: TouchPOSProps) {
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
    points_to_redeem: 0,
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

  const handleSubmit = () => {
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

  const clearCart = () => {
    setCart([]);
  };

  return (
    <>
      <Head title="TouchPOS" />
      <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
        {/* Header */}
        <TouchHeader
          customers={customers}
          branches={branches}
          formData={formData}
          setFormData={setFormData}
          userBranchId={auth?.user?.branch_id}
          onClearCart={clearCart}
          cartCount={cart.length}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Search and Cart */}
          <div className="flex-1 overflow-auto p-4">
            {/* Product Search - Using exact POS logic */}
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
                loyaltyProgram={loyaltyProgram}
                selectedCustomer={selectedCustomer}
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
    </>
  );
}