import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Customer } from '../../types';
import toast from 'react-hot-toast';

export default function CustomerLookup() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search customers
  useEffect(() => {
    if (!isOpen) return;

    const searchCustomers = async () => {
      if (searchQuery.trim().length < 2) {
        setCustomers([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await window.ipc.searchCustomers(searchQuery);
        setCustomers(results);
      } catch (error) {
        console.error('Failed to search customers:', error);
        toast.error(t('customer.noCustomer'));
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, isOpen, t]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsOpen(false);
    setSearchQuery('');
    toast.success(t('customer.customerSelected'));
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    toast.success(t('customer.noCustomer'));
  };

  return (
    <>
      {/* Customer Bar */}
      <div className="card">
        <div className="card-body py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {selectedCustomer ? (
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">{selectedCustomer.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                    {selectedCustomer.loyalty_card_number && (
                      <span className="ml-3 badge badge-info">
                        {selectedCustomer.current_points} {t('customer.points')}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="font-semibold text-gray-500">{t('pos.noCustomer')}</div>
                  <div className="text-xs text-gray-400">{t('customer.selectCustomer')}</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedCustomer && (
                <button
                  onClick={handleClearCustomer}
                  className="btn btn-secondary text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('common.delete')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {selectedCustomer ? t('common.edit') : t('pos.selectCustomer')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="gradient-primary px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">{t('customer.search')}</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('customer.search')}
                  className="input input-lg pl-12 pr-4"
                />
                {isLoading && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto p-6">
              {customers.length === 0 && searchQuery.trim().length >= 2 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-lg font-semibold">{t('customer.noCustomer')}</p>
                </div>
              )}

              {customers.length === 0 && searchQuery.trim().length < 2 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-lg font-semibold">{t('customer.search')}</p>
                  <p className="text-sm mt-1">{t('customer.name')}, {t('customer.phone').toLowerCase()}, {t('customer.email').toLowerCase()}</p>
                </div>
              )}

              {customers.length > 0 && (
                <div className="space-y-2">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-98 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-lg">{customer.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {customer.phone && <span>{customer.phone}</span>}
                            {customer.email && customer.phone && <span className="mx-2">•</span>}
                            {customer.email && <span>{customer.email}</span>}
                          </div>
                        </div>
                        {customer.loyalty_card_number && (
                          <div className="ml-4 text-right">
                            <div className="badge badge-info text-sm px-3 py-1">
                              {customer.current_points} {t('customer.points')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {customer.loyalty_card_number}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-secondary w-full"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
