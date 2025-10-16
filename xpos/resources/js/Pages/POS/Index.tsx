import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product, Customer, Vehicle, Branch, User, Service } from '@/types';
import ModeSelector from './components/ModeSelector';
import CustomerSection from './components/CustomerSection';
import ServiceSection from './components/ServiceSection';
import ProductSearchSection from './components/ProductSearchSection';
import CartSection from './components/CartSection';
import SummaryPaymentSection from './components/SummaryPaymentSection';
import VariantSelectorModal from './components/VariantSelectorModal';
import { useCart } from './hooks/useCart';
import { useSearch } from './hooks/useSearch';

interface POSIndexProps extends PageProps {
  customers: Customer[];
  vehicles: Vehicle[];
  employees: User[];
  services: Service[];
  branches: Branch[];
}

export default function Index({ auth, customers, vehicles, employees, services, branches }: POSIndexProps) {
  const { url } = usePage();
  const urlParams = new URLSearchParams(url.split('?')[1] || '');
  const initialMode = urlParams.get('mode') === 'service' ? 'service' : 'sale';
  const initialCustomerId = urlParams.get('customer_id') || '';
  const initialVehicleId = urlParams.get('vehicle_id') || '';

  // Mode selection
  const [mode, setMode] = useState<'sale' | 'service'>(initialMode);

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

  // Form data
  const [formData, setFormData] = useState({
    customer_id: initialCustomerId,
    vehicle_id: initialVehicleId,
    branch_id: getUserBranch(),
    employee_id: '', // Only for service mode
    description: '', // Only for service mode
    labor_cost: 0, // Only for service mode
    service_date: new Date().toISOString().split('T')[0], // Only for service mode
    service_time: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }), // Only for service mode
    status: 'pending', // Only for service mode
    tax_amount: 0, // Only for sale mode
    discount_amount: 0,
    notes: '',
    vehicle_mileage: undefined as number | undefined, // Only for service mode
    // Payment fields (unified for both modes)
    payment_status: 'paid', // paid, credit, partial
    paid_amount: 0,
    credit_amount: 0,
    credit_due_date: '',
    credit_description: '',
  });

  // Cart state and operations
  const { cart, setCart, subtotal, addToCart, updateCartItem, removeFromCart, changeItemUnit } = useCart([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Variant selector modal state
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  // Product/Service search using debounced + abortable fetch
  const { query: itemSearch, setQuery: setItemSearch, results: searchResults, loading: isSearching } = useSearch(mode, services, formData.branch_id);

  // Check if user can edit date/time (service mode only)
  const canEditDateTime = auth?.user?.role && ['account_owner', 'admin', 'branch_manager'].includes(auth.user.role);

  // Calculate totals
  const taxAmount = mode === 'sale' ? formData.tax_amount : 0;
  const discountAmount = formData.discount_amount;
  const laborCost = mode === 'service' ? formData.labor_cost : 0;
  const grandTotal = useMemo(() => subtotal + taxAmount + laborCost - discountAmount, [subtotal, taxAmount, laborCost, discountAmount]);

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
  const handleProductSelect = (item: Product | Service) => {
    const product = item as Product;

    // Check if product has variants
    if (product.has_variants && product.variants && product.variants.length > 0) {
      // Open variant selector modal
      setSelectedProductForVariant(product);
      setVariantModalOpen(true);
    } else {
      // Add directly to cart without variant
      addToCart(item);
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

  // Clear mode-specific fields when switching modes
  useEffect(() => {
    if (mode === 'sale') {
      setFormData((prev) => ({
        ...prev,
        vehicle_id: '',
        employee_id: '',
        description: '',
        labor_cost: 0,
        service_date: new Date().toISOString().split('T')[0],
        service_time: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        vehicle_mileage: undefined as number | undefined,
        payment_status: 'paid',
        paid_amount: 0,
        credit_amount: 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tax_amount: 0,
        payment_status: 'paid',
        paid_amount: 0,
        credit_amount: 0,
      }));
    }
    setCart([]);
  }, [mode, setCart]);

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
    if (cart.length === 0) newErrors.items = 'Ən azı bir məhsul və ya xidmət əlavə edilməlidir';

    // For credit or partial payment, customer is required
    if ((formData.payment_status === 'credit' || formData.payment_status === 'partial') && !formData.customer_id) {
      newErrors.customer_id = 'Borc və ya qismən ödəniş üçün müştəri seçmək məcburidir';
    }

    if (mode === 'service') {
      if (!formData.customer_id) newErrors.customer_id = 'Servis üçün müştəri seçmək məcburidir';
      if (!formData.description.trim()) newErrors.description = 'Servis açıqlaması məcburidir';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setProcessing(false);
      return;
    }

    const submitData: any = {
      ...formData,
      items: cart.map((item) => ({
        item_type: item.type === 'service' ? 'service' : 'product',
        product_id: item.product_id,
        variant_id: item.variant_id,
        service_id_ref: item.service_id_ref,
        item_name: item.item_name,
        quantity: item.quantity,
        base_quantity: item.base_quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        notes: item.notes,
      })),
      total: grandTotal,
    };

    if (mode === 'sale') {
      submitData.service_items = undefined;
      router.post('/pos/sale', submitData, {
        onSuccess: () => {
          setCart([]);
          setFormData((prev) => ({
            ...prev,
            customer_id: '',
            vehicle_id: '',
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
    } else {
      submitData.service_items = submitData.items;
      submitData.items = undefined;
      router.post('/pos/service', submitData, {
        onSuccess: () => {
          setCart([]);
          setFormData((prev) => ({
            ...prev,
            customer_id: '',
            vehicle_id: '',
            description: '',
            notes: '',
            discount_amount: 0,
            labor_cost: 0,
            vehicle_mileage: undefined,
            payment_status: 'paid',
            paid_amount: 0,
            credit_amount: 0,
            credit_due_date: '',
          }));
        },
        onError: (errs) => {
          console.error('Service submission errors:', errs);
          setErrors(errs);
          setProcessing(false);
        },
        onFinish: () => setProcessing(false),
      });
    }
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">POS Satış</h2>}>
      <Head title="POS Satış" />
      <div className="py-6">
        <div className="w-full">
          {/* Mode Selection */}
          <ModeSelector mode={mode} onChange={setMode} />

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
                  mode={mode}
                  customers={customers}
                  vehicles={vehicles}
                  branches={branches}
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  userBranchId={auth?.user?.branch_id}
                />

                {/* Service Details (Service mode only) */}
                {mode === 'service' && (
                  <ServiceSection
                    canEditDateTime={!!canEditDateTime}
                    employees={employees}
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                  />
                )}

                {/* Product Search */}
                <ProductSearchSection
                  query={itemSearch}
                  setQuery={(q) => setItemSearch(q)}
                  loading={!!isSearching}
                  results={searchResults as (Product | Service)[]}
                  onSelect={handleProductSelect}
                  mode={mode}
                  branchId={formData.branch_id}
                />

                {/* Cart Items */}
                <CartSection cart={cart} updateCartItem={updateCartItem} removeFromCart={removeFromCart} changeItemUnit={changeItemUnit} />
              </div>

              {/* Right Column - Summary & Actions */}
              <div className="lg:col-span-1">
                <SummaryPaymentSection
                  mode={mode}
                  processing={processing}
                  subtotal={subtotal}
                  laborCost={laborCost}
                  taxAmount={formData.tax_amount}
                  discountAmount={formData.discount_amount}
                  grandTotal={grandTotal}
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  cartCount={cart.length}
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

