import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product, Customer, Branch, LoyaltyProgram } from '@/types';
import CustomerSection from './components/CustomerSection';
import ProductSearchSection from './components/ProductSearchSection';
import CartSection from './components/CartSection';
import SummaryPaymentSection from './components/SummaryPaymentSection';
import VariantSelectorModal from './components/VariantSelectorModal';
import { useCart } from './hooks/useCart';
import { useSearch } from './hooks/useSearch';

interface POSIndexProps extends PageProps {
  customers: Customer[];
  branches: Branch[];
  fiscalPrinterEnabled: boolean;
  loyaltyProgram?: LoyaltyProgram | null;
}

export default function Index({ auth, customers, branches, fiscalPrinterEnabled, loyaltyProgram }: POSIndexProps) {

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

  // Selected customer
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id.toString() === formData.customer_id) || null,
    [customers, formData.customer_id]
  );

  // Cart state and operations
  const { cart, setCart, subtotal, addToCart, updateCartItem, removeFromCart, changeItemUnit } = useCart([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Variant selector modal state
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

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
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">POS Satış</h2>}>
      <Head title="POS Satış" />
      <div className="py-6">
        <div className="w-full">
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
                  customers={customers}
                  branches={branches}
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  userBranchId={auth?.user?.branch_id}
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

