import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Warehouse {
    id: number;
    name: string;
    type?: string;
    address?: string;
}

interface SearchableWarehouseSelectProps {
    warehouses: Warehouse[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
    excludeId?: string | number; // Exclude specific warehouse (for transfer scenarios)
}

export default function SearchableWarehouseSelect({
    warehouses,
    value,
    onChange,
    placeholder = "Anbar seçin",
    error,
    required = false,
    className = "",
    disabled = false,
    excludeId
}: SearchableWarehouseSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredWarehouses, setFilteredWarehouses] = useState(warehouses);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find selected warehouse
    const selectedWarehouse = warehouses.find(w => w.id.toString() === value.toString());

    // Filter warehouses based on search term and exclusions
    useEffect(() => {
        let warehousesToFilter = warehouses;
        
        // Exclude specific warehouse if provided
        if (excludeId) {
            warehousesToFilter = warehouses.filter(w => w.id.toString() !== excludeId.toString());
        }

        if (!searchTerm) {
            setFilteredWarehouses(warehousesToFilter);
            return;
        }

        const filtered = warehousesToFilter.filter(warehouse => {
            const searchLower = searchTerm.toLowerCase();
            return (
                warehouse.name.toLowerCase().includes(searchLower) ||
                (warehouse.type && warehouse.type.toLowerCase().includes(searchLower)) ||
                (warehouse.address && warehouse.address.toLowerCase().includes(searchLower))
            );
        });
        setFilteredWarehouses(filtered);
    }, [searchTerm, warehouses, excludeId]);

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

    const handleSelect = (warehouse: Warehouse) => {
        onChange(warehouse.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const formatWarehouseDisplay = (warehouse: Warehouse) => {
        let display = warehouse.name;
        if (warehouse.type) {
            const typeMap: { [key: string]: string } = {
                'main': 'Əsas',
                'auxiliary': 'Köməkçi', 
                'mobile': 'Mobil'
            };
            display += ` (${typeMap[warehouse.type] || warehouse.type})`;
        }
        return display;
    };

    // Only show searchable dropdown if there are more than 20 warehouses
    const shouldUseSearchable = warehouses.length > 20;

    if (!shouldUseSearchable) {
        return (
            <div className={className}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                        error ? 'border-red-300' : ''
                    } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
                    required={required}
                    disabled={disabled}
                >
                    <option value="">{placeholder}</option>
                    {filteredWarehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                            {formatWarehouseDisplay(warehouse)}
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
                        placeholder="Anbar axtar..."
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 pr-10 ${
                            error ? 'border-red-300' : ''
                        }`}
                        disabled={disabled}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(true)}
                        className={`w-full text-left rounded-md border border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2 pr-10 ${
                            error ? 'border-red-300' : ''
                        } ${!selectedWarehouse ? 'text-gray-500' : 'text-gray-900'} ${
                            disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                        }`}
                        disabled={disabled}
                    >
                        {selectedWarehouse ? formatWarehouseDisplay(selectedWarehouse) : placeholder}
                    </button>
                )}
                
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className="absolute right-0 top-0 h-full px-2 flex items-center text-gray-400 hover:text-gray-600"
                    disabled={disabled}
                >
                    <ChevronUpDownIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredWarehouses.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            {searchTerm ? 'Heç bir anbar tapılmadı' : 'Anbar yoxdur'}
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
                            
                            {filteredWarehouses.map((warehouse) => (
                                <button
                                    key={warehouse.id}
                                    type="button"
                                    onClick={() => handleSelect(warehouse)}
                                    className={`w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${
                                        selectedWarehouse?.id === warehouse.id ? 'bg-indigo-100' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {warehouse.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {warehouse.type && (
                                                    <>
                                                        {warehouse.type === 'main' && 'Əsas Anbar'}
                                                        {warehouse.type === 'auxiliary' && 'Köməkçi Anbar'}
                                                        {warehouse.type === 'mobile' && 'Mobil Anbar'}
                                                    </>
                                                )}
                                                {warehouse.address && ` • ${warehouse.address}`}
                                            </div>
                                        </div>
                                        {selectedWarehouse?.id === warehouse.id && (
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