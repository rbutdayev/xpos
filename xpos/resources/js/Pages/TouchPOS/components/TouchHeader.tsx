import React from 'react';
import { Customer, Branch } from '@/types';
import { TrashIcon, UserIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

interface Props {
  customers: Customer[];
  branches: Branch[];
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  userBranchId?: number;
  onClearCart: () => void;
  cartCount: number;
}

export default function TouchHeader({
  customers,
  branches,
  formData,
  setFormData,
  userBranchId,
  onClearCart,
  cartCount,
}: Props) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center space-x-4">
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
          <div className="flex items-center space-x-2">
            <UserIcon className="w-6 h-6 text-gray-600" />
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, customer_id: e.target.value }))}
              className="text-lg border-2 border-gray-300 rounded-lg px-4 py-2 min-w-[200px] focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Müştəri seçin (ixtiyari)</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone && ` - ${customer.phone}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center space-x-3">
          {/* Cart Count */}
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
            Məhsul: {cartCount}
          </div>

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