import React, { useState } from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import SearchableCustomerSelect from '@/Components/SearchableCustomerSelect';
import { Branch, Customer } from '@/types';

interface Props {
  branches: Branch[];
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  userBranchId?: number;
  onCustomerChange?: (customer: Customer | null) => void;
}

function CustomerSection({ branches, formData, setFormData, errors, userBranchId, onCustomerChange }: Props) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const isBranchFixed = !!userBranchId;
  const selectedBranch = branches.find(b => b.id.toString() === formData.branch_id);

  return (
    <div className="bg-white shadow-sm sm:rounded-lg mb-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Müştəri Məlumatları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputLabel htmlFor="customer_id" value="Müştəri" />
            <SearchableCustomerSelect
              value={formData.customer_id}
              onChange={(value, customer) => {
                setFormData((prev: any) => ({ ...prev, customer_id: value }));
                const newCustomer = customer || null;
                setSelectedCustomer(newCustomer);
                if (onCustomerChange) {
                  onCustomerChange(newCustomer);
                }
              }}
              className="mt-1 block w-full"
            />
            <InputError message={errors.customer_id} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="branch_id" value="Filial *" />
            {isBranchFixed ? (
              <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">
                <span className="text-gray-700">{selectedBranch?.name || 'Bilinməyən filial'}</span>
                <span className="ml-2 text-xs text-gray-500">(Təyin edilmiş filial)</span>
              </div>
            ) : (
              <select
                id="branch_id"
                value={formData.branch_id}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, branch_id: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Filial seçin</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
            <InputError message={errors.branch_id} className="mt-2" />
          </div>
        </div>

        {/* Display customer loyalty points if customer is selected */}
        {selectedCustomer && (selectedCustomer.current_points || 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-blue-900">Bonus Ballar</span>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Mövcud: <span className="font-semibold">{selectedCustomer.current_points}</span> bal
                    {selectedCustomer.lifetime_points && selectedCustomer.lifetime_points > 0 && (
                      <span className="ml-2">• Ümumi: {selectedCustomer.lifetime_points} bal</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CustomerSection);

