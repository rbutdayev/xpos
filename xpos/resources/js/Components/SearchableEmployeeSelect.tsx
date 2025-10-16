import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Employee {
    id?: number;
    name: string;
    position?: string;
}

interface SearchableEmployeeSelectProps {
    employees: Employee[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    className?: string;
    showPosition?: boolean;
}

export default function SearchableEmployeeSelect({
    employees,
    value,
    onChange,
    placeholder = "Əməkdaş seçin",
    error,
    required = false,
    className = "",
    showPosition = true
}: SearchableEmployeeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState(employees);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find selected employee
    const selectedEmployee = employees.find(e => e.id && e.id.toString() === value.toString());

    // Filter employees based on search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredEmployees(employees);
            return;
        }

        const filtered = employees.filter(employee => {
            const searchLower = searchTerm.toLowerCase();
            return (
                employee.name.toLowerCase().includes(searchLower) ||
                (employee.position && employee.position.toLowerCase().includes(searchLower))
            );
        });
        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

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

    const handleSelect = (employee: Employee) => {
        if (employee.id) {
            onChange(employee.id);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const formatEmployeeDisplay = (employee: Employee) => {
        let display = employee.name;
        if (showPosition && employee.position) {
            display += ` (${employee.position})`;
        }
        return display;
    };

    // Only show searchable dropdown if there are more than 20 employees
    const shouldUseSearchable = employees.length > 20;

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
                    {employees.map(employee => (
                        <option key={employee.id || employee.name} value={employee.id || ''}>
                            {formatEmployeeDisplay(employee)}
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
                        placeholder="Əməkdaş axtar..."
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
                        } ${!selectedEmployee ? 'text-gray-500' : 'text-gray-900'}`}
                    >
                        {selectedEmployee ? formatEmployeeDisplay(selectedEmployee) : placeholder}
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
                    {filteredEmployees.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            {searchTerm ? 'Heç bir əməkdaş tapılmadı' : 'Əməkdaş yoxdur'}
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
                            
                            {filteredEmployees.map((employee) => (
                                <button
                                    key={employee.id || employee.name}
                                    type="button"
                                    onClick={() => handleSelect(employee)}
                                    className={`w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${
                                        selectedEmployee?.id === employee.id ? 'bg-indigo-100' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {employee.name}
                                            </div>
                                            {showPosition && employee.position && (
                                                <div className="text-sm text-gray-500 truncate">
                                                    {employee.position}
                                                </div>
                                            )}
                                        </div>
                                        {selectedEmployee?.id === employee.id && (
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

