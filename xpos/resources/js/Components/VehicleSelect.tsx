import { Vehicle } from '@/types';
import { MagnifyingGlassIcon, TruckIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';

interface Props {
    vehicles: Vehicle[];
    value: string;
    onChange: (vehicleId: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    showSearch?: boolean;
    customerId?: string; // Filter vehicles by customer
}

export default function VehicleSelect({ 
    vehicles, 
    value, 
    onChange, 
    placeholder = "Nəqliyyat vasitəsi seçin...",
    required = false,
    disabled = false,
    className = "",
    showSearch = true,
    customerId
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filteredVehicles, setFilteredVehicles] = useState(vehicles);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedVehicle = vehicles.find(vehicle => vehicle.id.toString() === value);

    useEffect(() => {
        let vehiclesToFilter = vehicles;
        
        // Filter by customer if provided
        if (customerId) {
            vehiclesToFilter = vehicles.filter(vehicle => 
                vehicle.customer_id?.toString() === customerId
            );
        }

        if (search.trim() === '') {
            setFilteredVehicles(vehiclesToFilter);
        } else {
            const filtered = vehiclesToFilter.filter(vehicle =>
                vehicle.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
                vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
                vehicle.plate_number.toLowerCase().includes(search.toLowerCase()) ||
                vehicle.formatted_plate?.toLowerCase().includes(search.toLowerCase()) ||
                vehicle.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
                vehicle.engine_type_text?.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredVehicles(filtered);
        }
    }, [search, vehicles, customerId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen && showSearch) {
                setTimeout(() => searchRef.current?.focus(), 100);
            }
        }
    };

    const handleSelect = (vehicle: Vehicle) => {
        onChange(vehicle.id.toString());
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
        setSearch('');
    };

    const getEngineTypeColor = (engineType: string) => {
        switch (engineType) {
            case 'petrol': return 'text-blue-600';
            case 'diesel': return 'text-green-600';
            case 'electric': return 'text-yellow-600';
            case 'hybrid': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
                    disabled ? 'bg-gray-50 text-gray-500' : ''
                }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="flex items-center">
                    <TruckIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <span className="ml-3 block truncate">
                        {selectedVehicle ? (
                            <span>
                                <span className="font-medium">{selectedVehicle.full_name}</span>
                                <span className="text-gray-500 ml-2">- {selectedVehicle.formatted_plate}</span>
                            </span>
                        ) : (
                            <span className="text-gray-500">{placeholder}</span>
                        )}
                    </span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {showSearch && (
                        <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
                            <div className="relative">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    className="w-full rounded-md border-gray-300 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Nəqliyyat vasitəsi axtar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Clear option */}
                    {!required && (
                        <div
                            className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
                            onClick={handleClear}
                        >
                            <span className="font-normal block truncate text-gray-500 italic">
                                Nəqliyyat vasitəsi seçməyin
                            </span>
                        </div>
                    )}

                    {filteredVehicles.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900">
                            <span className="font-normal block truncate text-gray-500">
                                {customerId ? 
                                    "Bu müştərinin nəqliyyat vasitəsi tapılmadı" :
                                    "Nəqliyyat vasitəsi tapılmadı"
                                }
                            </span>
                        </div>
                    ) : (
                        filteredVehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                    vehicle.id.toString() === value
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-900 hover:bg-indigo-600 hover:text-white'
                                }`}
                                onClick={() => handleSelect(vehicle)}
                            >
                                <div className="flex items-center">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className={`block truncate ${
                                            vehicle.id.toString() === value ? 'font-semibold' : 'font-normal'
                                        }`}>
                                            {vehicle.full_name} - {vehicle.formatted_plate}
                                        </span>
                                        <span className="block truncate text-xs opacity-75">
                                            <span className={getEngineTypeColor(vehicle.engine_type)}>
                                                {vehicle.engine_type_text}
                                            </span>
                                            {vehicle.customer && !customerId && (
                                                <span className="ml-2">• {vehicle.customer.name}</span>
                                            )}
                                            {vehicle.mileage && (
                                                <span className="ml-2">• {vehicle.mileage.toLocaleString('az-AZ')} km</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-xs opacity-75">
                                         {vehicle.total_tailor_services !== undefined && vehicle.total_tailor_services > 0 && (
                                            <span>🔧 {vehicle.total_tailor_services}</span>
                                        )}
                                        {!vehicle.is_active && (
                                            <span className="text-red-400">●</span>
                                        )}
                                    </div>
                                </div>

                                {vehicle.id.toString() === value && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}