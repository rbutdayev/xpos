import { useState, useCallback, useMemo } from 'react';
import { Product, Service } from '@/types';
import { ServiceItem, parseServiceItemFromProduct, parseServiceItemFromService } from '../Utils/serviceCalculations';

export const useServiceItems = (initialItems: ServiceItem[] = []) => {
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>(initialItems);
    const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: boolean }>({});

    const addServiceItem = useCallback(() => {
        const newItem: ServiceItem = {
            item_type: 'product',
            quantity: 1,
            unit_price: 0
        };
        setServiceItems(prev => [...prev, newItem]);
    }, []);

    const removeServiceItem = useCallback((index: number) => {
        setServiceItems(prev => {
            const itemToRemove = prev[index];
            const newItems = prev.filter((_, i) => i !== index);
            
            // Remove from selectedProducts if it's a product item
            if (itemToRemove?.item_type === 'product' && itemToRemove.product_id) {
                setSelectedProducts(prevSelected => {
                    const updated = { ...prevSelected };
                    delete updated[itemToRemove.product_id!];
                    return updated;
                });
            }
            
            return newItems;
        });
    }, []);

    const updateServiceItem = useCallback((index: number, field: keyof ServiceItem, value: string | number) => {
        setServiceItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            
            if (field === 'item_type') {
                // Reset fields when type changes
                newItems[index] = {
                    ...item,
                    item_type: value as 'product' | 'service',
                    product_id: '',
                    service_id_ref: '',
                    item_name: '',
                    unit_price: 0
                };
            } else {
                newItems[index] = {
                    ...item,
                    [field]: value
                };
            }
            
            return newItems;
        });
    }, []);

    const addProductToServiceItems = useCallback((product: Product) => {
        if (selectedProducts[product.id]) return;

        const productItem = parseServiceItemFromProduct(product);
        setServiceItems(prev => [...prev, productItem as ServiceItem]);
        setSelectedProducts(prev => ({ ...prev, [product.id]: true }));
    }, [selectedProducts]);

    const addServiceToServiceItems = useCallback((service: Service) => {
        const serviceItem = parseServiceItemFromService(service);
        setServiceItems(prev => [...prev, serviceItem as ServiceItem]);
    }, []);

    const isProductSelected = useCallback((productId: string | number) => {
        return !!selectedProducts[productId.toString()];
    }, [selectedProducts]);

    return {
        serviceItems,
        setServiceItems,
        selectedProducts,
        addServiceItem,
        removeServiceItem,
        updateServiceItem,
        addProductToServiceItems,
        addServiceToServiceItems,
        isProductSelected
    };
};