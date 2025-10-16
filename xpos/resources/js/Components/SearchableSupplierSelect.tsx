import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
}

interface SearchableSupplierSelectProps {
    suppliers: Supplier[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    className?: string;
    showContactPerson?: boolean;
    showPhone?: boolean;
}

export default function SearchableSupplierSelect({
    suppliers,
    value,
    onChange,
    placeholder = "Təchizatçı seçin",
    error,
    required = false,
    className = "",
    showContactPerson = true,
    showPhone = false
}: SearchableSupplierSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find selected supplier
    const selectedSupplier = suppliers.find(s => s.id.toString() === value.toString());

    // Filter suppliers based on search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredSuppliers(suppliers);
            return;
        }

        const filtered = suppliers.filter(supplier => {
            const searchLower = searchTerm.toLowerCase();
            return (
                supplier.name.toLowerCase().includes(searchLower) ||
                (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchLower)) ||
                (supplier.phone && supplier.phone.toLowerCase().includes(searchLower))
            );
        });
        setFilteredSuppliers(filtered);
    }, [searchTerm, suppliers]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (supplier: Supplier) => {
        onChange(supplier.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const formatSupplierDisplay = (supplier: Supplier) => {
        let display = supplier.name;
        if (showContactPerson && supplier.contact_person) {
            display += ` (${supplier.contact_person})`;
        }
        if (showPhone && supplier.phone) {
            display += ` - ${supplier.phone}`;
        }
        return display;
    };

    // Only show searchable dropdown if there are more than 20 suppliers
    const shouldUseSearchable = suppliers.length > 20;

    if (!shouldUseSearchable) {
        return (
            <div className={className}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                        error ? 'border-red-300' : ''
                    }`}
                    required={required}
                >
                    <option value="">{placeholder}</option>
                    {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                            {formatSupplierDisplay(supplier)}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Selected value display / Search input */}
            <div className="relative">
                {isOpen ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Təchizatçı axtar..."
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 pr-10 ${
                            error ? 'border-red-300' : ''
                        }`}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className={`w-full text-left rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2 pr-10 ${
                            error ? 'border-red-300' : ''
                        } ${!selectedSupplier ? 'text-gray-500' : 'text-gray-900'}`}
                    >
                        {selectedSupplier ? formatSupplierDisplay(selectedSupplier) : placeholder}
                    </button>
                )}
                
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-0 top-0 h-full px-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                    <ChevronUpDownIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredSuppliers.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            {searchTerm ? 'Heç bir təchizatçı tapılmadı' : 'Təchizatçı yoxdur'}
                        </div>
                    ) : (
                        <>
                            {/* Clear selection option */}
                            {!required && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('');
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-500 text-sm border-b border-gray-100"
                                >
                                    {placeholder}
                                </button>
                            )}
                            
                            {filteredSuppliers.map((supplier) => (
                                <button
                                    key={supplier.id}
                                    type="button"
                                    onClick={() => handleSelect(supplier)}
                                    className={`w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${
                                        selectedSupplier?.id === supplier.id ? 'bg-indigo-100' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {supplier.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {showContactPerson && supplier.contact_person && `Əlaqə: ${supplier.contact_person}`}
                                                {showPhone && supplier.phone && ` • ${supplier.phone}`}
                                            </div>
                                        </div>
                                        {selectedSupplier?.id === supplier.id && (
                                            <CheckIcon className="h-4 w-4 text-indigo-600 ml-2" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {/* Hidden input for form submission */}
            <input
                type="hidden"
                value={value}
                required={required}
            />
        </div>
    );
}