import { memo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Product } from '@/types';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    searchResults: Product[];
    isSearching: boolean;
    onProductSelect: (product: Product) => void;
    selectedProducts: { [key: string]: boolean };
}

export const ProductSearchModal = memo(({
    isOpen,
    onClose,
    searchTerm,
    onSearchChange,
    searchResults,
    isSearching,
    onProductSelect,
    selectedProducts
}: ProductSearchModalProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Məhsul Axtarışı
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <TextInput
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                            placeholder="Məhsul adı və ya kodu ilə axtarın..."
                                            className="pl-10 w-full"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                                            Axtarılır...
                                        </div>
                                    ) : searchTerm.length >= 2 && searchResults.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            Heç bir məhsul tapılmadı
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="space-y-2">
                                            {searchResults.map((product) => {
                                                const isSelected = selectedProducts[product.id];
                                                const hasStockIssue = product.total_stock !== undefined && product.total_stock <= 0 && !product.allow_negative_stock;
                                                const isDisabled = hasStockIssue && !isSelected;
                                                
                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`p-3 border rounded-lg transition-colors ${
                                                            isSelected
                                                                ? 'bg-green-50 border-green-200 cursor-default'
                                                                : isDisabled
                                                                ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60'
                                                                : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-gray-900">
                                                                    {product.name}
                                                                </h4>
                                                                <div className="text-sm text-gray-600 space-y-1">
                                                                    <p>Kod: {product.barcode || product.sku}</p>
                                                                    <p>Qiymət: {product.sale_price} AZN</p>
                                                                    <p>
                                                                        Stok: {product.total_stock || 0} {product.unit}
                                                                        {product.total_stock !== undefined && product.total_stock <= 0 && !product.allow_negative_stock && (
                                                                            <span className="text-red-500 ml-2">(Kifayət etmir)</span>
                                                                        )}
                                                                        {product.total_stock !== undefined && product.total_stock <= 0 && product.allow_negative_stock && (
                                                                            <span className="text-orange-500 ml-2">(Mənfi stoka icazə var)</span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                {isSelected ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        Əlavə edilib
                                                                    </span>
                                                                ) : isDisabled ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        Əlavə edilə bilməz
                                                                    </span>
                                                                ) : (
                                                                    <PrimaryButton
                                                                        type="button"
                                                                        onClick={() => onProductSelect(product)}
                                                                        className="text-sm px-3 py-1"
                                                                    >
                                                                        Əlavə et
                                                                    </PrimaryButton>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Axtarmaq üçün ən azı 2 hərf daxil edin
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
});