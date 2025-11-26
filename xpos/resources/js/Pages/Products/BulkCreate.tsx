import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category, Warehouse } from '@/types';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface Props {
  categories: Category[];
  warehouses: Warehouse[];
}

interface ProductItem {
  name: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  initial_quantity: string;
  warehouse_id: string;
}

interface FormData {
  category_id: string;
  sale_price: string;
  purchase_price: string;
  unit: string;
  products: ProductItem[];
}

export default function BulkCreate({ categories, warehouses }: Props) {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    category_id: '',
    sale_price: '',
    purchase_price: '',
    unit: 'ədəd',
    products: [
      {
        name: '',
        sku: '',
        barcode: '',
        size: '',
        color: '',
        initial_quantity: '',
        warehouse_id: '',
      }
    ]
  });

  const [productCount, setProductCount] = useState(1);

  // Function to set specific number of products
  const setNumberOfProducts = (count: number) => {
    setProductCount(count);
    const newProducts = [];
    for (let i = 0; i < count; i++) {
      // Keep existing data if available, otherwise create empty product
      if (i < data.products.length) {
        newProducts.push(data.products[i]);
      } else {
        newProducts.push({
          name: '',
          sku: '',
          barcode: '',
          size: '',
          color: '',
          initial_quantity: '',
          warehouse_id: '',
        });
      }
    }
    setData('products', newProducts);
  };

  const addProduct = () => {
    const newCount = data.products.length + 1;
    setProductCount(newCount);
    setData('products', [
      ...data.products,
      {
        name: '',
        sku: '',
        barcode: '',
        size: '',
        color: '',
        initial_quantity: '',
        warehouse_id: '',
      }
    ]);
  };

  const removeProduct = (index: number) => {
    if (data.products.length > 1) {
      const newProducts = data.products.filter((_, i) => i !== index);
      setData('products', newProducts);
    }
  };

  const updateProduct = (index: number, field: keyof ProductItem, value: string) => {
    const newProducts = [...data.products];
    newProducts[index][field] = value;
    setData('products', newProducts);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!data.category_id) {
      toast.error('Kateqoriya seçilməlidir');
      return;
    }
    
    if (!data.sale_price || parseFloat(data.sale_price) <= 0) {
      toast.error('Satış qiyməti daxil edilməlidir');
      return;
    }
    
    if (!data.purchase_price || parseFloat(data.purchase_price) <= 0) {
      toast.error('Alış qiyməti daxil edilməlidir');
      return;
    }
    
    // Check if any product has initial quantity but no warehouse selected for that product
    const productsWithQuantityButNoWarehouse = data.products.filter(p => 
      p.initial_quantity && parseFloat(p.initial_quantity) > 0 && !p.warehouse_id
    );
    if (productsWithQuantityButNoWarehouse.length > 0) {
      toast.error('İlkin miqdarı olan bütün məhsullar üçün anbar seçilməlidir');
      return;
    }
    
    const emptyProducts = data.products.filter(p => !p.name.trim());
    if (emptyProducts.length > 0) {
      toast.error('Bütün məhsulların adı daxil edilməlidir');
      return;
    }

    post(route('products.bulk-store'), {
      onSuccess: () => {
        toast.success('Məhsullar uğurla yaradıldı');
      },
      onError: (errors) => {
        console.log('Validation errors:', errors);
        const errorCount = Object.keys(errors).length;
        if (errorCount === 1) {
          const errorMessage = Object.values(errors)[0] as string;
          toast.error(errorMessage);
        } else {
          toast.error(`${errorCount} xəta var`, { duration: 6000 });
        }
      }
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Toplu Məhsul Yaratma" />

      <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Link href="/products" className="mr-4 text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Toplu Məhsul Yaratma</h2>
                  <p className="text-sm text-gray-600 mt-1">Eyni kateqoriya və qiymətdə bir neçə məhsulu eyni vaxtda yaradın. Barkodlar avtomatik yaradılacaq.</p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-6">

              {/* Common Fields */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ümumi Məlumatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category */}
                  <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                      Kateqoriya *
                    </label>
                    <select
                      id="category_id"
                      value={data.category_id}
                      onChange={(e) => setData('category_id', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Seçin</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700">
                      Satış Qiyməti *
                    </label>
                    <input
                      type="number"
                      id="sale_price"
                      step="0.01"
                      min="0"
                      value={data.sale_price}
                      onChange={(e) => setData('sale_price', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                    {errors.sale_price && <p className="mt-1 text-sm text-red-600">{errors.sale_price}</p>}
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
                      Alış Qiyməti *
                    </label>
                    <input
                      type="number"
                      id="purchase_price"
                      step="0.01"
                      min="0"
                      value={data.purchase_price}
                      onChange={(e) => setData('purchase_price', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                    {errors.purchase_price && <p className="mt-1 text-sm text-red-600">{errors.purchase_price}</p>}
                  </div>

                  {/* Unit */}
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                      Ölçü vahidi *
                    </label>
                    <select
                      id="unit"
                      value={data.unit}
                      onChange={(e) => setData('unit', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="ədəd">ədəd (piece)</option>
                      <option value="kq">kq (kg)</option>
                      <option value="qr">qr (gram)</option>
                      <option value="litr">litr (liter)</option>
                      <option value="ml">ml (milliliter)</option>
                      <option value="metr">metr (meter)</option>
                      <option value="sm">sm (cm)</option>
                      <option value="paket">paket (package)</option>
                      <option value="qutu">qutu (box)</option>
                      <option value="səbət">səbət (basket)</option>
                      <option value="dəst">dəst (set)</option>
                      <option value="cüt">cüt (pair)</option>
                    </select>
                    {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
                  </div>
                </div>
                
              </div>

              {/* Products List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Məhsullar</h3>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Məhsul əlavə et
                  </button>
                </div>

                <div className="space-y-4">
                  {data.products.map((product, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Məhsul #{index + 1}</h4>
                        {data.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Product Name */}
                        <div className="lg:col-span-2">
                          <label htmlFor={`product_name_${index}`} className="block text-xs font-medium text-gray-700">
                            Məhsul Adı *
                          </label>
                          <input
                            type="text"
                            id={`product_name_${index}`}
                            value={product.name}
                            onChange={(e) => updateProduct(index, 'name', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            required
                          />
                        </div>

                        {/* SKU */}
                        <div>
                          <label htmlFor={`product_sku_${index}`} className="block text-xs font-medium text-gray-700">
                            SKU
                          </label>
                          <input
                            type="text"
                            id={`product_sku_${index}`}
                            value={product.sku}
                            onChange={(e) => updateProduct(index, 'sku', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        {/* Barcode */}
                        <div>
                          <label htmlFor={`product_barcode_${index}`} className="block text-xs font-medium text-gray-700">
                            Barkod
                          </label>
                          <input
                            type="text"
                            id={`product_barcode_${index}`}
                            value={product.barcode}
                            onChange={(e) => updateProduct(index, 'barcode', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="13 rəqəmli barkod - boş buraxsanız avtomatik yaradılacaq"
                          />
                        </div>

                        {/* Size */}
                        <div>
                          <label htmlFor={`product_size_${index}`} className="block text-xs font-medium text-gray-700">
                            Ölçü
                          </label>
                          <input
                            type="text"
                            id={`product_size_${index}`}
                            value={product.size}
                            onChange={(e) => updateProduct(index, 'size', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="məs: M, 42"
                          />
                        </div>

                        {/* Color */}
                        <div>
                          <label htmlFor={`product_color_${index}`} className="block text-xs font-medium text-gray-700">
                            Rəng
                          </label>
                          <input
                            type="text"
                            id={`product_color_${index}`}
                            value={product.color}
                            onChange={(e) => updateProduct(index, 'color', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="məs: Qırmızı"
                          />
                        </div>
                      </div>

                      {/* Initial Stock Section for this product */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">İlkin Stok (seçimə bağlı)</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Warehouse for this product */}
                          <div>
                            <label htmlFor={`product_warehouse_${index}`} className="block text-xs font-medium text-gray-700">
                              Anbar
                            </label>
                            <select
                              id={`product_warehouse_${index}`}
                              value={product.warehouse_id}
                              onChange={(e) => updateProduct(index, 'warehouse_id', e.target.value)}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="">Anbar seçin</option>
                              {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Initial Quantity for this product */}
                          <div>
                            <label htmlFor={`product_initial_quantity_${index}`} className="block text-xs font-medium text-gray-700">
                              Başlanğıc miqdarı
                            </label>
                            <input
                              type="number"
                              id={`product_initial_quantity_${index}`}
                              step="0.01"
                              min="0"
                              value={product.initial_quantity}
                              onChange={(e) => updateProduct(index, 'initial_quantity', e.target.value)}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display errors for this product */}
                      {errors[`products.${index}.name` as keyof typeof errors] && (
                        <p className="mt-2 text-sm text-red-600">{errors[`products.${index}.name` as keyof typeof errors]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Link href="/products">
                  <SecondaryButton type="button" disabled={processing}>Ləğv et</SecondaryButton>
                </Link>
                <PrimaryButton type="submit" disabled={processing}>
                  {processing ? 'Yaradılır...' : `${data.products.length} Məhsul Yarat`}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}