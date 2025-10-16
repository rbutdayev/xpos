import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '@/types';

export const useCustomerVehicles = (
    vehicles: Vehicle[],
    selectedCustomerId: string,
    initialVehicleId?: string
) => {
    const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);

    const filterVehiclesByCustomer = useCallback((customerId: string) => {
        if (!customerId) {
            setCustomerVehicles([]);
            return;
        }
        
        const filtered = vehicles.filter(vehicle => 
            vehicle.customer_id?.toString() === customerId
        );
        setCustomerVehicles(filtered);
    }, [vehicles]);

    useEffect(() => {
        filterVehiclesByCustomer(selectedCustomerId);
    }, [selectedCustomerId, filterVehiclesByCustomer]);

    // Set initial vehicle if provided
    useEffect(() => {
        if (initialVehicleId && customerVehicles.length > 0) {
            const vehicleExists = customerVehicles.some(
                v => v.id.toString() === initialVehicleId
            );
            if (!vehicleExists) {
                // Vehicle doesn't belong to selected customer, clear it
                setCustomerVehicles(prev => prev);
            }
        }
    }, [initialVehicleId, customerVehicles]);

    return {
        customerVehicles,
        hasVehicles: customerVehicles.length > 0
    };
};