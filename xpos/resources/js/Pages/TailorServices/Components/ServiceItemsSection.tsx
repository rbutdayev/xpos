import { memo, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Product, Service } from '@/types';
import { ServiceItem } from '../Utils/serviceCalculations';
import { useProductSearch } from '../Hooks/useProductSearch';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { ServiceItemRow } from './ServiceItemRow';
import { ProductSearchModal } from './ProductSearchModal';

interface ServiceItemsSectionProps {
    serviceItems: ServiceItem[];
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    onUpdateItem: (index: number, field: keyof ServiceItem, value: string | number) => void;
    onAddProduct: (product: Product) => void;
    products: Product[];
    services: Service[];
    selectedProducts: { [key: string]: boolean };
    branchId?: string;
    processing?: boolean;
}

export const ServiceItemsSection = memo(({
    serviceItems,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onAddProduct,
    products,
    services,
    selectedProducts,
    branchId,
    processing = false
}: ServiceItemsSectionProps) => {
    const [showProductSearch, setShowProductSearch] = useState(false);
    
    const { 
        searchTerm, 
        setSearchTerm, 
        searchResults, 
        isSearching, 
        clearSearch, 
        selectProduct 
    } = useProductSearch((product) => {
        onAddProduct(product);
        setShowProductSearch(false);
    }, branchId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex space-x-2">
                    <PrimaryButton
                        type="button"
                        onClick={onAddItem}
                        disabled={processing}
                        className="text-sm"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Məhsul/Xidmət əlavə et
                    </PrimaryButton>
                    
                    <SecondaryButton
                        type="button"
                        onClick={() => setShowProductSearch(true)}
                        disabled={processing}
                        className="text-sm"
                    >
                        <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                        Məhsul axtar
                    </SecondaryButton>
                </div>
            </div>

            {serviceItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p>Hələ heç bir məhsul və ya xidmət əlavə edilməyib</p>
                    <p className="text-sm mt-1">Yuxarıdakı düymələrdən istifadə edərək məhsul əlavə edin</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {serviceItems.map((item, index) => (
                        <ServiceItemRow
                            key={index}
                            item={item}
                            index={index}
                            products={products}
                            services={services}
                            onUpdate={onUpdateItem}
                            onRemove={onRemoveItem}
                            disabled={processing}
                        />
                    ))}
                </div>
            )}

            {/* Product Search Modal */}
            <ProductSearchModal
                isOpen={showProductSearch}
                onClose={() => {
                    setShowProductSearch(false);
                    clearSearch();
                }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchResults={searchResults}
                isSearching={isSearching}
                onProductSelect={selectProduct}
                selectedProducts={selectedProducts}
            />
        </div>
    );
});