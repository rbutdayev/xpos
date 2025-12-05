import React from 'react';
import { Customer, Branch } from '@/types';
import { TrashIcon, BuildingStorefrontIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import SearchableCustomerSelect from '@/Components/SearchableCustomerSelect';
import ShiftStatusWidget from '@/Components/ShiftStatusWidget';

interface FiscalConfig {
  id: number;
  provider: string;
  name: string;
  shift_open: boolean;
  shift_opened_at: string | null;
  last_z_report_at: string | null;
}

interface Props {
  branches: Branch[];
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  userBranchId?: number;
  onClearCart: () => void;
  cartCount: number;
  onCustomerChange?: (customer: Customer | null) => void;
  onOpenReturn: () => void;
  fiscalConfig?: FiscalConfig | null;
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
  fiscalConfig,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b-2 border-slate-200 shadow-lg p-4">
      <div className="flex items-center justify-between">
        {/* Spacer for balance */}
        <div className="flex-1"></div>

        {/* Center - Selectors */}
        <div className="flex items-center space-x-4">
          {/* Branch Selection - Same Height as Buttons */}
          <div className="w-[280px]">
            <div className="bg-white rounded-2xl px-5 py-4 shadow-xl border-2 border-gray-200 hover:border-blue-400 transition-all h-full flex items-center">
              <div className="flex items-center space-x-3 w-full">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg flex-shrink-0">
                  <BuildingStorefrontIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, branch_id: e.target.value }))}
                    className="border-0 focus:ring-0 text-sm font-semibold text-gray-800 w-full p-0 bg-transparent cursor-pointer"
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
              </div>
            </div>
          </div>

          {/* Customer Selection - Same Height as Buttons */}
          <div className="w-[280px]">
            <div className="bg-white rounded-2xl px-5 py-4 shadow-xl border-2 border-gray-200 hover:border-green-400 transition-all h-full flex items-center">
              <div className="flex items-center space-x-3 w-full">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">
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
              </div>
            </div>
          </div>
        </div>

        {/* Right - Elevated Card-Style Buttons */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          {/* Shift Status Widget */}
          {fiscalConfig && <ShiftStatusWidget fiscalConfig={fiscalConfig} compact={true} />}

          {/* Cart Count Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-5 py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-transform">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium opacity-90">Məhsul</div>
              <div className="text-2xl font-bold">{cartCount}</div>
            </div>
          </div>

          {/* Return Card Button */}
          <button
            onClick={onOpenReturn}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-4 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-lg p-2">
                <ArrowUturnLeftIcon className="w-6 h-6" />
              </div>
              <span className="text-sm">Qaytarma</span>
            </div>
          </button>

          {/* Clear Cart Card Button */}
          {cartCount > 0 && (
            <button
              onClick={onClearCart}
              className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-4 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <TrashIcon className="w-6 h-6" />
                </div>
                <span className="text-sm">Təmizlə</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
