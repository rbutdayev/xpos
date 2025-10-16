import { useMemo } from 'react';
import { ServiceItem, calculateServiceTotals, ServiceTotals } from '../Utils/serviceCalculations';

export const useServiceCalculations = (
    serviceItems: ServiceItem[],
    laborCost: number = 0
): ServiceTotals => {
    return useMemo(() => {
        return calculateServiceTotals(serviceItems, laborCost);
    }, [serviceItems, laborCost]);
};