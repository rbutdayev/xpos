import { Product } from '@/types';
import { usePage } from '@inertiajs/react';

export default function PricingSummary({ product }: { product: Product }) {
  const { auth } = usePage().props as any;
  const currentUser = auth.user;
  const fmt = (n?: number) => n != null ? new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(Math.round(n * 100) / 100) : '-';
  const profit = (product.sale_price && product.purchase_price) ? (product.sale_price - product.purchase_price) : undefined;
  const margin = (product.sale_price && product.purchase_price && product.purchase_price > 0)
    ? (((product.sale_price - product.purchase_price) / product.purchase_price) * 100)
    : undefined;
  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Qiymət Məlumatları</h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {!['sales_staff', 'warehouse_manager'].includes(currentUser.role) && (
          <div>
            <div className="text-sm font-medium text-gray-500">Alış Qiyməti</div>
            <div className="text-lg font-semibold text-gray-900">{fmt(product.purchase_price)}</div>
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-gray-500">Satış Qiyməti</div>
          <div className="text-lg font-semibold text-gray-900">{fmt(product.sale_price)}</div>
        </div>
        {!['sales_staff', 'warehouse_manager'].includes(currentUser.role) && profit != null && (
          <div>
            <div className="text-sm font-medium text-gray-500">Mənfəət</div>
            <div className="text-lg font-semibold text-green-600">{fmt(profit)}</div>
          </div>
        )}
        {!['sales_staff', 'warehouse_manager'].includes(currentUser.role) && margin != null && (
          <div>
            <div className="text-sm font-medium text-gray-500">Marja</div>
            <div className="text-lg font-semibold text-blue-600">{margin.toFixed(1)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}

