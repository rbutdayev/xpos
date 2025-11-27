import React from 'react';
import { Customer, Branch } from '@/types';
import { TrashIcon, UserIcon, BuildingStorefrontIcon, ArrowLeftIcon, HomeIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import SearchableCustomerSelect from '@/Components/SearchableCustomerSelect';

interface Props {
  branches: Branch[];
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  userBranchId?: number;
  onClearCart: () => void;
  cartCount: number;
  onCustomerChange?: (customer: Customer | null) => void;
  onOpenReturn: () => void;
}

export default function TouchHeader({
  branches,
  formData,
  setFormData,
  userBranchId,
  onClearCart,
  cartCount,
  onCustomerChange,
  onOpenReturn,
}: Props) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Left - Back Button & Title */}
        <div className="flex items-center space-x-4">
          {/* Back to Dashboard Button */}
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md border border-slate-300"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-lg">Ana Səhifə</span>
          </Link>

          <div className="h-10 w-px bg-gray-300"></div>

          <h1 className="text-2xl font-bold text-gray-900">TouchPOS</h1>
          <span className="text-sm text-gray-500">Satış Terminali</span>
        </div>

        {/* Center - Quick Selectors */}
        <div className="flex items-center space-x-4">
          {/* Branch Selection */}
          <div className="flex items-center space-x-2">
            <BuildingStorefrontIcon className="w-6 h-6 text-gray-600" />
            <select
              value={formData.branch_id}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, branch_id: e.target.value }))}
              className="text-lg border-2 border-gray-300 rounded-lg px-4 py-2 min-w-[200px] focus:ring-blue-500 focus:border-blue-500"
              disabled={!!userBranchId && branches.length === 1}
            >
              <option value="">Filial seçin</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selection */}
          <div className="flex items-center space-x-2 min-w-[300px]">
            <SearchableCustomerSelect
              value={formData.customer_id}
              onChange={(value, customer) => {
                setFormData((prev: any) => ({ ...prev, customer_id: value }));
                if (onCustomerChange) {
                  onCustomerChange(customer || null);
                }
              }}
              placeholder="Müştəri axtar..."
            />
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center space-x-3">
          {/* Cart Count */}
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
            Məhsul: {cartCount}
          </div>

          {/* Return Button */}
          <button
            onClick={onOpenReturn}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
            <span>Mal Qaytarma</span>
          </button>

          {/* Clear Cart Button */}
          {cartCount > 0 && (
            <button
              onClick={onClearCart}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Səbəti Təmizlə</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}