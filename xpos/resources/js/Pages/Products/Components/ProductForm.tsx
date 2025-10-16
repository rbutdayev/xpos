import { memo, useCallback, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Category, Warehouse } from '@/types';
import { useProductForm, ProductFormState } from '../Hooks/useProductForm';
import BasicInfoSection from './BasicInfoSection';
import PricingSection from './PricingSection';
import InventorySection from './InventorySection';
import AttributesSection from './AttributesSection';
import ClothingInfoSection from './ClothingInfoSection';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Link } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ProductFormState>;
  categories: Category[];
  warehouses: Warehouse[];
  submitUrl: string;
  cancelUrl: string;
  onSubmitTransform?: (data: ProductFormState) => any; // for create: transform initial stock
  method?: 'post' | 'put' | 'patch';
}

export const ProductForm = memo(({ mode, initialData, categories, warehouses, submitUrl, cancelUrl, onSubmitTransform, method = 'post' }: ProductFormProps) => {
  const { data, setData, errors, processing, calculations, setError, clearErrors } = useProductForm(initialData);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [initialType] = useState(initialData?.type || 'product');

  // reset some fields when type changes (but not during initialization)
  useEffect(() => {
    if (data.type === initialType) return; // Don't reset if it's still the initial type
    
    setData('category_id', '');
    if (data.type === 'service') {
      setData('unit', 'ədəd');
      setData('packaging_quantity', '1');
      setData('base_unit', 'ədəd');
      setData('packaging_size', '1 ədəd');
    }
  }, [data.type, setData, initialType]);

  const onChange = useCallback((field: string, value: any) => {
    setData(field as any, value);
  }, [setData]);

  const handleGenerateBarcode = useCallback(async () => {
    setGeneratingBarcode(true);
    try {
      const response = await (window as any).axios.post(route('products.generate-barcode'), { type: data.barcode_type || 'EAN-13' });
      if (response.data?.barcode) setData('barcode', response.data.barcode);
    } finally {
      setGeneratingBarcode(false);
    }
  }, [data.barcode_type, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = onSubmitTransform ? onSubmitTransform(data) : data;

    clearErrors();

    // Use router with proper error handling
    const options = {
      onSuccess: () => {
        toast.success(mode === 'create' ? 'Məhsul uğurla yaradıldı' : 'Dəyişikliklər saxlanıldı');
      },
      onError: (errors: any) => {
        console.log('Form validation errors:', errors);

        // Ensure errors are set on the form
        Object.keys(errors).forEach(key => {
          setError(key as any, errors[key]);
        });

        // Scroll to the first error field
        setTimeout(() => {
          const firstErrorKey = Object.keys(errors)[0];
          // Handle nested attribute errors like 'attributes.size'
          const fieldId = firstErrorKey.includes('.') ? firstErrorKey.split('.').pop() : firstErrorKey;
          const errorElement = document.getElementById(fieldId || '');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
          }
        }, 100);

        // Show toast notification with error summary
        const errorCount = Object.keys(errors).length;
        if (errorCount === 1) {
          const errorKey = Object.keys(errors)[0];
          const errorMessage = Object.values(errors)[0] as string;
          toast.error(`${errorKey}: ${errorMessage}`);
        } else {
          // List the fields with errors
          const errorFields = Object.keys(errors).join(', ');
          toast.error(`${errorCount} xəta: ${errorFields}`, { duration: 6000 });
        }
      }
    };

    if (method === 'post') {
      router.post(submitUrl, payload, options);
    } else if (method === 'put') {
      router.put(submitUrl, payload, options);
    } else if (method === 'patch') {
      router.patch(submitUrl, payload, options);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <BasicInfoSection
        data={data}
        errors={errors as any}
        onChange={onChange}
        categories={categories}
        onGenerateBarcode={handleGenerateBarcode}
        generatingBarcode={generatingBarcode}
      />

      <PricingSection
        data={data}
        errors={errors as any}
        calculations={calculations}
        onChange={onChange}
      />

      <ClothingInfoSection
        data={data}
        errors={errors as any}
        onChange={onChange}
      />

      <InventorySection
        mode={mode}
        data={data}
        errors={errors as any}
        warehouses={warehouses}
        onChange={onChange}
      />

      <AttributesSection
        data={data}
        onChange={onChange}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Link href={cancelUrl}>
          <SecondaryButton type="button" disabled={processing}>Ləğv et</SecondaryButton>
        </Link>
        <PrimaryButton type="submit" disabled={processing}>
          {processing ? 'Yadda saxlanılır...' : mode === 'create' ? 'Məhsul yarat' : 'Dəyişiklikləri saxla'}
        </PrimaryButton>
      </div>
    </form>
  );
});

export default ProductForm;
