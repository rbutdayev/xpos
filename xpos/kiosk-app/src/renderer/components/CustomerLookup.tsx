import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../stores/cart-store';
import type { Customer } from '../../types';
import toast from 'react-hot-toast';

export default function CustomerLookup() {
  const { customer, setCustomer } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchCustomers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await window.ipc.searchCustomers(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Customer search failed:', error);
        toast.error('Failed to search customers');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelectCustomer = (selectedCustomer: Customer) => {
    setCustomer(selectedCustomer);
    setSearchQuery('');
    setShowResults(false);
    toast.success(`Customer ${selectedCustomer.name} selected`);
  };

  const handleRemoveCustomer = () => {
    setCustomer(null);
    toast.success('Customer removed');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
        {customer && (
          <button
            onClick={handleRemoveCustomer}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
      </div>

      {!customer ? (
        <div className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              placeholder="Search by phone or name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectCustomer(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{result.name}</p>
                      <p className="text-sm text-gray-600">{result.phone || result.email}</p>
                    </div>
                    {result.current_points > 0 && (
                      <div className="bg-blue-100 px-2 py-1 rounded-full">
                        <p className="text-xs font-medium text-blue-900">{result.current_points} pts</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <p className="text-sm text-gray-600 text-center">No customers found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                {customer.phone && <span>{customer.phone}</span>}
                {customer.email && <span>{customer.email}</span>}
              </div>
              {customer.loyalty_card_number && (
                <div className="mt-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    Card: {customer.loyalty_card_number}
                  </span>
                </div>
              )}
            </div>
            {customer.current_points > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Loyalty Points</p>
                <p className="text-2xl font-bold text-blue-600">{customer.current_points}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
