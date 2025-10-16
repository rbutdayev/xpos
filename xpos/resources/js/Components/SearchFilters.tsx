import { ReactNode } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import FilterDropdown from './FilterDropdown';

export interface FilterOption {
    value: string;
    label: string;
}

export interface SearchFilter {
    key: string;
    type: 'dropdown' | 'date' | 'text';
    label: string;
    placeholder?: string;
    options?: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

interface SearchFiltersProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filters?: SearchFilter[];
    onSearch: () => void;
    onReset: () => void;
    totalResults?: number;
    className?: string;
    children?: ReactNode;
}

export default function SearchFilters({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Axtar...",
    filters = [],
    onSearch,
    onReset,
    totalResults,
    className = "",
    children
}: SearchFiltersProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Search and Filters */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 text-gray-900">
                    <div className="flex flex-col gap-4 mb-4">
                        {/* Search Bar */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchValue}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={searchPlaceholder}
                                        className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            
                            {/* Filter Dropdowns */}
                            {filters.map((filter) => (
                                <div key={filter.key} className={filter.className}>
                                    {filter.type === 'dropdown' && filter.options ? (
                                        <FilterDropdown
                                            value={filter.value}
                                            onChange={filter.onChange}
                                            options={filter.options}
                                            placeholder={filter.label}
                                        />
                                    ) : filter.type === 'date' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {filter.label}
                                            </label>
                                            <input
                                                type="date"
                                                value={filter.value}
                                                onChange={(e) => filter.onChange(e.target.value)}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {filter.label}
                                            </label>
                                            <input
                                                type="text"
                                                value={filter.value}
                                                onChange={(e) => filter.onChange(e.target.value)}
                                                placeholder={filter.placeholder}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Custom children filters */}
                        {children}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={onSearch}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Axtar
                            </button>
                            <button
                                onClick={onReset}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Sıfırla
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            {totalResults !== undefined && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-4 text-sm text-gray-600">
                        {totalResults} nəticə tapıldı
                    </div>
                </div>
            )}
        </div>
    );
}