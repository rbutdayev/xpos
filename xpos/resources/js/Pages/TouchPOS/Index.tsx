import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps, Product, Customer, Branch, Service } from '@/types';
import TouchCart from './components/TouchCart';
import TouchHeader from './components/TouchHeader';
import TouchPayment from './components/TouchPayment';
import ProductSearchSection from '../POS/components/ProductSearchSection';
import { useCart } from '../POS/hooks/useCart';
import { useSearch } from '../POS/hooks/useSearch';

interface TouchPOSProps extends PageProps {
  customers: Customer[];
  branches: Branch[];
}

export default function TouchPOS({ auth, customers, branches }: TouchPOSProps) {
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
    paid_amount: 0,
    credit_amount: 0,
    credit_due_date: '',
    credit_description: '',
  });

  // Cart state
  const { cart, setCart, subtotal, addToCart, updateCartItem, removeFromCart, changeItemUnit } = useCart([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Product search using exact same logic as POS
  const { query: itemSearch, setQuery: setItemSearch, results: searchResults, loading: isSearching } = useSearch('sale', [], formData.branch_id);

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
      onSuccess: () => {
        setCart([]);
        setFormData((prev) => ({
          ...prev,
          customer_id: '',
          notes: '',
          discount_amount: 0,
          tax_amount: 0,
          payment_status: 'paid',
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
              results={searchResults as (Product | Service)[]}
              onSelect={(item) => {
                addToCart(item);
                setItemSearch('');
              }}
              mode="sale"
              branchId={formData.branch_id}
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
          <div className="w-96 bg-white border-l border-gray-200">
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
            />
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
    </>
  );
}