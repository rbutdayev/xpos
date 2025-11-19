import { Head, router, usePage } from '@inertiajs/react';
import { useState, FormEvent, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon, TrashIcon, CameraIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowRightIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from '@/Components/BarcodeScanner';
import RentalAgreementSection from '@/Components/RentalAgreementSection';
import PhotoUpload from '@/Components/PhotoUpload';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
}

interface Branch {
    id: number;
    name: string;
}

interface InventoryItem {
    id: number;
    inventory_number: string;
    barcode: string;
    product_id: number;
    product_name: string;
    product_sku: string;
    status: string;
    daily_rate: number | null;
    weekly_rate: number | null;
    monthly_rate: number | null;
    is_available: boolean;
}

interface RentalItem {
    product_id: string;
    rental_inventory_id: string;
    rate_type: 'daily' | 'weekly' | 'monthly';
    unit_price: string;
    duration: number;
    total_price: number;
    notes: string;
    inventoryItem?: InventoryItem | null;
    searchQuery?: string;
    [key: string]: string | number | InventoryItem | null | undefined;
}

interface AgreementTemplate {
    id: number;
    name: string;
    rental_category: string;
    terms_and_conditions_az: string;
    terms_and_conditions_en: string;
    damage_liability_terms_az: string;
    damage_liability_terms_en: string;
    condition_checklist: any[];
    require_photos: boolean;
    min_photos: number;
}

interface RentalCategory {
    slug: string;
    name_az: string;
    name_en: string;
    description_az?: string;
    description_en?: string;
    color?: string;
}

interface Props {
    customers: Customer[];
    branches: Branch[];
    templates?: Record<string, AgreementTemplate | null>;
    categories?: RentalCategory[];
}

export default function Create({ customers, branches, templates, categories = [] }: Props) {
    const { flash } = usePage<any>().props as { flash?: { success?: string; error?: string } };
    const [showFlashMessage, setShowFlashMessage] = useState(true);
    const [currentStep, setCurrentStep] = useState<'basic' | 'agreement'>('basic');
    const [rentalCategory, setRentalCategory] = useState<string>(categories.length > 0 ? categories[0].slug : 'general');
    const [agreementData, setAgreementData] = useState<any>(null);

    const initialFormData = {
        customer_id: '',
        branch_id: '',
        rental_start_date: '',
        rental_end_date: '',
        collateral_type: 'deposit_cash',
        collateral_amount: '',
        collateral_document_type: '',
        collateral_document_number: '',
        collateral_photo: '',
        collateral_notes: '',
        status: 'reserved',
        payment_status: 'credit',
        paid_amount: '',
        notes: '',
        internal_notes: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [items, setItems] = useState<RentalItem[]>([
        {
            product_id: '',
            rental_inventory_id: '',
            rate_type: 'daily',
            unit_price: '',
            duration: 0,
            total_price: 0,
            notes: '',
        },
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const [showQuickCustomerForm, setShowQuickCustomerForm] = useState(false);
    const [quickCustomerData, setQuickCustomerData] = useState({
        name: '',
        phone: '',
        birthday: '',
    });
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
    const [itemAvailability, setItemAvailability] = useState<Record<number, any>>({});

    // Barcode scanner state
    const [showScanner, setShowScanner] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');
    const [inventorySearchResults, setInventorySearchResults] = useState<InventoryItem[]>([]);
    const [isSearchingInventory, setIsSearchingInventory] = useState(false);
    const [searchTimeoutId, setSearchTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [customerSearchTimeoutId, setCustomerSearchTimeoutId] = useState<NodeJS.Timeout | null>(null);

    // Use searched customers if available, otherwise filter pre-loaded customers
    const filteredCustomers = customerSearchTerm.trim().length >= 2 
        ? searchedCustomers 
        : customers.filter(
            (customer) =>
                customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                customer.phone.includes(customerSearchTerm) ||
                (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
        );

    // Reset flash message visibility when flash changes
    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowFlashMessage(true);
        }
    }, [flash]);

    // Cleanup search timeouts on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutId) {
                clearTimeout(searchTimeoutId);
            }
            if (customerSearchTimeoutId) {
                clearTimeout(customerSearchTimeoutId);
            }
        };
    }, [searchTimeoutId, customerSearchTimeoutId]);

    // Reset form function
    const resetForm = () => {
        setFormData(initialFormData);
        setItems([
            {
                product_id: '',
                rental_inventory_id: '',
                rate_type: 'daily',
                unit_price: '',
                duration: 0,
                total_price: 0,
                notes: '',
            },
        ]);
        setSelectedCustomer(null);
        setCustomerSearchTerm('');
        setErrors({});
    };

    // Recheck availability when dates change (with debounce to wait for user to finish)
    useEffect(() => {
        if (!formData.rental_start_date || !formData.rental_end_date || !formData.branch_id) {
            return;
        }

        // Check if all items have valid durations (not just default 1)
        const hasValidItems = items.some(item =>
            (item.rental_inventory_id || item.product_id) && item.duration > 0
        );

        if (!hasValidItems) {
            return;
        }

        // Debounce the availability check by 1500ms to give user time to set durations
        const timeoutId = setTimeout(() => {
            // Recheck availability for all selected items
            items.forEach((item, index) => {
                if (item.rental_inventory_id) {
                    checkItemAvailability(index, item.rental_inventory_id, null);
                } else if (item.product_id) {
                    checkItemAvailability(index, null, item.product_id);
                }
            });
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [formData.rental_start_date, formData.rental_end_date, formData.branch_id, items]);

    // Auto-calculate end date based on rental items
    useEffect(() => {
        if (!formData.rental_start_date || items.length === 0) {
            return;
        }

        // Calculate maximum duration in days from all items
        const maxDurationInDays = items.reduce((max, item) => {
            let daysForItem = 0;
            if (item.duration > 0) {
                switch (item.rate_type) {
                    case 'daily':
                        daysForItem = item.duration;
                        break;
                    case 'weekly':
                        daysForItem = item.duration * 7;
                        break;
                    case 'monthly':
                        daysForItem = item.duration * 30;
                        break;
                }
            }
            return Math.max(max, daysForItem);
        }, 0);

        // Calculate end date
        if (maxDurationInDays > 0) {
            const startDate = new Date(formData.rental_start_date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + maxDurationInDays);

            const formattedEndDate = endDate.toISOString().split('T')[0];

            if (formattedEndDate !== formData.rental_end_date) {
                setFormData((prev) => ({
                    ...prev,
                    rental_end_date: formattedEndDate,
                }));
            }
        }
    }, [formData.rental_start_date, items]);

    const handleInputChange = (field: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleItemChange = (index: number, field: keyof RentalItem, value: string | number) => {
        setItems((prev) => {
            const newItems = [...prev];
            
            // Update price when rate_type changes based on inventory item's rates
            if (field === 'rate_type' && newItems[index].inventoryItem) {
                const inventoryItem = newItems[index].inventoryItem;
                let newPrice = '0';
                
                if (value === 'daily' && inventoryItem.daily_rate !== null && inventoryItem.daily_rate !== undefined) {
                    newPrice = inventoryItem.daily_rate.toString();
                } else if (value === 'weekly' && inventoryItem.weekly_rate !== null && inventoryItem.weekly_rate !== undefined) {
                    newPrice = inventoryItem.weekly_rate.toString();
                } else if (value === 'monthly' && inventoryItem.monthly_rate !== null && inventoryItem.monthly_rate !== undefined) {
                    newPrice = inventoryItem.monthly_rate.toString();
                }
                
                newItems[index] = {
                    ...newItems[index],
                    rate_type: value as 'daily' | 'weekly' | 'monthly',
                    unit_price: newPrice,
                    total_price: calculateItemTotal(newPrice, newItems[index].duration)
                };
            } else {
                newItems[index] = {
                    ...newItems[index],
                    [field]: value,
                };
                
                // Recalculate total if unit_price or duration changed
                if (field === 'unit_price' || field === 'duration') {
                    const unitPrice = field === 'unit_price' ? value as string : newItems[index].unit_price;
                    const duration = field === 'duration' ? value as number : newItems[index].duration;
                    newItems[index].total_price = calculateItemTotal(unitPrice, duration);
                }
            }

            return newItems;
        });

        // Clear availability when duration or rate type changes (will be rechecked by debounced effect)
        if (field === 'duration' || field === 'rate_type') {
            setItemAvailability(prev => {
                const newAvailability = { ...prev };
                delete newAvailability[index];
                return newAvailability;
            });
        }
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                product_id: '',
                rental_inventory_id: '',
                rate_type: 'daily',
                unit_price: '',
                duration: 0,
                total_price: 0,
                notes: '',
            },
        ]);
    };

    const calculateItemTotal = (unitPrice: string, duration: number): number => {
        const price = parseFloat(unitPrice) || 0;
        return price * duration;
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleInventorySelect = (index: number, inventoryItem: InventoryItem) => {
        setItems((prev) => {
            const newItems = [...prev];
            // Keep the current rate_type if it's already set and the inventory item has that rate
            // Otherwise, default to the first available rate type
            let defaultRateType: 'daily' | 'weekly' | 'monthly' = newItems[index].rate_type || 'daily';
            let defaultRate = 0;

            // Check if the current rate type is available for this inventory item
            if (defaultRateType === 'daily' && inventoryItem.daily_rate) {
                defaultRate = inventoryItem.daily_rate;
            } else if (defaultRateType === 'weekly' && inventoryItem.weekly_rate) {
                defaultRate = inventoryItem.weekly_rate;
            } else if (defaultRateType === 'monthly' && inventoryItem.monthly_rate) {
                defaultRate = inventoryItem.monthly_rate;
            } else {
                // Current rate type not available, choose first available
                if (inventoryItem.daily_rate) {
                    defaultRateType = 'daily';
                    defaultRate = inventoryItem.daily_rate;
                } else if (inventoryItem.weekly_rate) {
                    defaultRateType = 'weekly';
                    defaultRate = inventoryItem.weekly_rate;
                } else if (inventoryItem.monthly_rate) {
                    defaultRateType = 'monthly';
                    defaultRate = inventoryItem.monthly_rate;
                }
            }

            newItems[index] = {
                ...newItems[index],
                rental_inventory_id: inventoryItem.id.toString(),
                product_id: inventoryItem.product_id.toString(),
                inventoryItem: inventoryItem,
                rate_type: defaultRateType,
                unit_price: defaultRate.toString(),
                total_price: defaultRate * newItems[index].duration,
                searchQuery: '',
            };
            return newItems;
        });
        setInventorySearchQuery('');
        setInventorySearchResults([]);
        setActiveItemIndex(null);

        // Availability will be checked automatically by the debounced useEffect
    };

    const checkItemAvailability = async (index: number, rentalInventoryId: string | null, productId: string | null) => {
        if (!formData.branch_id || !formData.rental_start_date || !formData.rental_end_date) {
            return;
        }

        try {
            const response = await fetch(route('rentals.check-availability'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    rental_inventory_id: rentalInventoryId,
                    product_id: productId,
                    start_date: formData.rental_start_date,
                    end_date: formData.rental_end_date,
                    branch_id: formData.branch_id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setItemAvailability(prev => ({
                    ...prev,
                    [index]: data.data
                }));
            }
        } catch (error) {
            console.error('Availability check error:', error);
        }
    };

    // Debounced search for inventory items
    const searchInventoryItems = async (query: string, itemIndex: number | null = null) => {
        if (!query || query.trim().length < 2 || !formData.branch_id) {
            setInventorySearchResults([]);
            return;
        }

        setIsSearchingInventory(true);

        try {
            const response = await fetch(route('rentals.search-barcode'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    query: query.trim(),
                    branch_id: formData.branch_id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Inventory search failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    errors: errorData.errors || errorData.message || 'Unknown error'
                });
                throw new Error(`Server error ${response.status}: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data.inventory_items) {
                const results = data.data.inventory_items;
                setInventorySearchResults(results);

                // Auto-select ONLY if:
                // 1. Exactly 1 result found
                // 2. Search term is specific enough (not just "INV" or short terms)
                // 3. Search term looks like a barcode (numbers) or complete inventory number
                const isSpecificSearch = query.length >= 8 || /^\d+$/.test(query.trim());

                if (results.length === 1 && itemIndex !== null && isSpecificSearch) {
                    handleInventorySelect(itemIndex, results[0]);
                    setInventorySearchQuery('');
                    setInventorySearchResults([]);
                }
            } else {
                setInventorySearchResults([]);
            }
        } catch (error) {
            console.error('Inventory search error:', error);
            setInventorySearchResults([]);
            // Don't show alert to user, just clear results silently
        } finally {
            setIsSearchingInventory(false);
        }
    };

    // Handle search query change with debouncing
    const handleInventorySearchChange = (query: string, itemIndex: number) => {
        setInventorySearchQuery(query);

        // Clear previous timeout
        if (searchTimeoutId) {
            clearTimeout(searchTimeoutId);
        }

        // Set new timeout for debounced search
        if (query.trim().length >= 2) {
            const timeoutId = setTimeout(() => {
                searchInventoryItems(query, itemIndex);
            }, 300);
            setSearchTimeoutId(timeoutId);
        } else {
            setInventorySearchResults([]);
        }
    };

    const handleBarcodeScan = async (code: string) => {
        if (activeItemIndex === null || !formData.branch_id) return;

        try {
            const response = await fetch(route('rentals.search-barcode'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    barcode: code,
                    branch_id: formData.branch_id,
                }),
            });

            const data = await response.json();

            if (data.success && data.found) {
                // Only select inventory items
                if (data.data.inventory_items.length > 0) {
                    handleInventorySelect(activeItemIndex, data.data.inventory_items[0]);
                    setShowScanner(false);
                    setInventorySearchQuery('');
                    setInventorySearchResults([]);
                } else {
                    alert('İnventar elementi tapılmadı');
                }
            } else {
                alert('Tapılmadı');
            }
        } catch (error) {
            console.error('Barcode search error:', error);
            alert('Axtarışda xəta baş verdi');
        }
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData((prev) => ({
            ...prev,
            customer_id: customer.id.toString(),
        }));
        setCustomerSearchTerm('');
        setShowCustomerResults(false);
        setSearchedCustomers([]); // Clear search results
    };

    const searchCustomers = async (query: string) => {
        if (!query || query.trim().length < 2) {
            setSearchedCustomers([]);
            return;
        }

        setIsSearchingCustomers(true);

        try {
            const response = await fetch(route('customers.search') + `?q=${encodeURIComponent(query)}`);
            const customers = await response.json();
            
            if (Array.isArray(customers)) {
                setSearchedCustomers(customers);
            } else {
                setSearchedCustomers([]);
            }
        } catch (error) {
            console.error('Customer search error:', error);
            setSearchedCustomers([]);
        } finally {
            setIsSearchingCustomers(false);
        }
    };

    const handleCustomerSearchChange = (query: string) => {
        setCustomerSearchTerm(query);
        setShowCustomerResults(true);

        // Clear previous timeout
        if (customerSearchTimeoutId) {
            clearTimeout(customerSearchTimeoutId);
        }

        // Set new timeout for debounced search
        if (query.trim().length >= 2) {
            const timeoutId = setTimeout(() => {
                searchCustomers(query);
            }, 300);
            setCustomerSearchTimeoutId(timeoutId);
        } else {
            setSearchedCustomers([]);
        }
    };

    const handleQuickCustomerCreate = async () => {
        if (!quickCustomerData.name.trim() || !quickCustomerData.phone.trim()) {
            alert('Ad və telefon nömrəsi tələb olunur');
            return;
        }

        try {
            const response = await fetch(route('customers.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: quickCustomerData.name,
                    phone: quickCustomerData.phone,
                    birthday: quickCustomerData.birthday || null,
                    customer_type: 'individual',
                }),
            });

            const data = await response.json();

            if (data.success) {
                const newCustomer = data.customer;
                // Add to searched customers array so it appears in search results
                setSearchedCustomers(prev => [newCustomer, ...prev]);
                handleCustomerSelect(newCustomer);
                setShowQuickCustomerForm(false);
                setQuickCustomerData({ name: '', phone: '', birthday: '' });
                // Show success message
                alert('Müştəri uğurla yaradıldı!');
            } else {
                alert(data.message || 'Müştəri yaradılarkən xəta baş verdi');
            }
        } catch (error) {
            console.error('Quick customer creation error:', error);
            alert('Müştəri yaradılarkən xəta baş verdi');
        }
    };

    const handleProceedToAgreement = () => {
        // Validate basic form first
        if (!formData.customer_id || !formData.branch_id || !formData.rental_start_date || items.length === 0) {
            alert('Zəhmət olmasa bütün tələb olunan sahələri doldurun');
            return;
        }

        // Check if all items have inventory selected
        const allItemsComplete = items.every(item =>
            item.rental_inventory_id && item.unit_price && item.duration
        );
        if (!allItemsComplete) {
            alert('Bütün inventar elementləri tam doldurulmalıdır');
            return;
        }

        // Check if all items are available
        const hasUnavailableItems = items.some((item, index) => {
            const availability = itemAvailability[index];
            return availability && !availability.is_available;
        });
        if (hasUnavailableItems) {
            alert('Bəzi inventar elementləri mövcud deyil. Zəhmət olmasa yalnız mövcud olan elementləri seçin.');
            return;
        }

        setCurrentStep('agreement');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAgreementComplete = (agreementFormData: any) => {
        console.log('handleAgreementComplete called with data:', agreementFormData);
        setAgreementData(agreementFormData);
        // Submit the complete rental with agreement
        submitRental(agreementFormData);
    };

    const handleAgreementCancel = () => {
        setCurrentStep('basic');
        setAgreementData(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submitRental = (agreementFormData: any) => {
        setProcessing(true);

        router.post(
            route('rentals.store'),
            {
                ...formData,
                items: items.map(item => ({
                    product_id: item.product_id,
                    rental_inventory_id: item.rental_inventory_id,
                    rate_type: item.rate_type,
                    unit_price: item.unit_price,
                    duration: item.duration,
                    total_price: item.total_price,
                    notes: item.notes,
                })),
                agreement: agreementFormData,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    resetForm();
                    setCurrentStep('basic');
                    setAgreementData(null);
                    setProcessing(false);
                    // Scroll to top to show success message
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                onError: (errors) => {
                    setErrors(errors);
                    setProcessing(false);
                    // Scroll to top to show errors
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // If we have templates, proceed to agreement step
        if (templates && templates[rentalCategory]) {
            handleProceedToAgreement();
        } else {
            // No template, submit directly
            submitRental(null);
        }
    };


    return (
        <AuthenticatedLayout>
            <Head title="Yeni Kirayə" />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Yeni Kirayə</h1>
                    <p className="mt-1 text-sm sm:text-base text-gray-600">
                        {currentStep === 'basic'
                            ? 'Yeni kirayə yaratmaq üçün aşağıdakı məlumatları doldurun'
                            : 'Kirayə müqaviləsini tamamlayın'
                        }
                    </p>
                </div>

                {/* Flash Messages */}
                {showFlashMessage && flash?.success && (
                    <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowFlashMessage(false)}
                                        className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                                    >
                                        <span className="sr-only">Bağla</span>
                                        <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showFlashMessage && flash?.error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowFlashMessage(false)}
                                        className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                    >
                                        <span className="sr-only">Bağla</span>
                                        <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'agreement' && selectedCustomer && templates && templates[rentalCategory] ? (
                    <RentalAgreementSection
                        rentalCategory={rentalCategory}
                        template={templates[rentalCategory]!}
                        customer={selectedCustomer}
                        onComplete={handleAgreementComplete}
                        onCancel={handleAgreementCancel}
                    />
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">Əsas Məlumat</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Müştəri <span className="text-red-500">*</span>
                                </label>

                                {!selectedCustomer ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={customerSearchTerm}
                                                onChange={(e) => handleCustomerSearchChange(e.target.value)}
                                                onFocus={() => setShowCustomerResults(true)}
                                                onBlur={() => {
                                                    // Delay hiding results to allow click
                                                    setTimeout(() => setShowCustomerResults(false), 200);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Müştəri adı, telefon və ya email ilə axtar..."
                                            />
                                            {isSearchingCustomers && customerSearchTerm.length >= 2 && (
                                                <div className="absolute right-3 top-2.5 text-xs text-gray-400">Axtarılır...</div>
                                            )}

                                            {/* Search Results */}
                                            {showCustomerResults && customerSearchTerm && filteredCustomers.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {filteredCustomers.map((customer) => (
                                                        <div
                                                            key={customer.id}
                                                            onClick={() => handleCustomerSelect(customer)}
                                                            className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                                                        >
                                                            <div className="font-medium text-gray-900">{customer.name}</div>
                                                            <div className="text-sm text-gray-500">{customer.phone}</div>
                                                            {customer.email && (
                                                                <div className="text-sm text-gray-500">{customer.email}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* No results found message */}
                                            {showCustomerResults && customerSearchTerm && filteredCustomers.length === 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                                                    <div className="text-gray-500 text-center">Müştəri tapılmadı</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Customer Creation Button */}
                                        <div className="flex items-center justify-center">
                                            <div className="text-sm text-gray-500">və ya</div>
                                        </div>
                                        
                                        {!showQuickCustomerForm ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowQuickCustomerForm(true)}
                                                className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <UserPlusIcon className="h-4 w-4 mr-2" />
                                                Yeni müştəri yarat
                                            </button>
                                        ) : (
                                            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-blue-900">Yeni Müştəri</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowQuickCustomerForm(false);
                                                            setQuickCustomerData({ name: '', phone: '', birthday: '' });
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                                            Ad <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={quickCustomerData.name}
                                                            onChange={(e) => setQuickCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                                            className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Müştəri adı"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                                            Telefon <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={quickCustomerData.phone}
                                                            onChange={(e) => setQuickCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                                            className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Telefon nömrəsi"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-xs font-medium text-blue-700 mb-1">
                                                            Doğum günü
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={quickCustomerData.birthday}
                                                            onChange={(e) => setQuickCustomerData(prev => ({ ...prev, birthday: e.target.value }))}
                                                            className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex space-x-2 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleQuickCustomerCreate}
                                                            disabled={!quickCustomerData.name.trim() || !quickCustomerData.phone.trim()}
                                                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Yarat
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowQuickCustomerForm(false);
                                                                setQuickCustomerData({ name: '', phone: '', birthday: '' });
                                                            }}
                                                            className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                                                        >
                                                            Ləğv et
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex-1">
                                            <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                                            <div className="text-sm text-blue-700">{selectedCustomer.phone}</div>
                                            {selectedCustomer.email && (
                                                <div className="text-sm text-blue-700">{selectedCustomer.email}</div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setFormData((prev) => ({ ...prev, customer_id: '' }));
                                                setCustomerSearchTerm('');
                                                setSearchedCustomers([]);
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="hidden"
                                    value={formData.customer_id}
                                    required
                                />
                                {errors.customer_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                                )}
                            </div>

                            {/* Branch - MANDATORY */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filial <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.branch_id}
                                    onChange={(e) => {
                                        handleInputChange('branch_id', e.target.value);
                                        // Clear search when branch changes
                                        setInventorySearchQuery('');
                                        setInventorySearchResults([]);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Filial seçin *</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.branch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                                )}
                                {!formData.branch_id && (
                                    <p className="mt-1 text-xs text-amber-600">Məhsul axtarmaq üçün filial seçilməlidir</p>
                                )}
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Başlama Tarixi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.rental_start_date}
                                    onChange={(e) => handleInputChange('rental_start_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {errors.rental_start_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.rental_start_date}</p>
                                )}
                            </div>

                            {/* End Date - Auto-calculated */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bitmə Tarixi (avtomatik hesablanır)
                                </label>
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                    {formData.rental_end_date
                                        ? new Date(formData.rental_end_date).toLocaleDateString('az-AZ', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })
                                        : 'Məhsul əlavə edin'}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Kirayə məhsullarının müddətinə əsasən avtomatik hesablanır
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rental Items */}
                    <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg sm:text-xl font-medium text-gray-900">Kirayə Məhsulları</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                Məhsul Əlavə Et
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Məhsul {index + 1}
                                        </h3>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Inventory Search */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    İnventar Elementi <span className="text-red-500">*</span>
                                                </label>
                                                {formData.branch_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveItemIndex(index);
                                                            setShowScanner(true);
                                                        }}
                                                        className="rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        title="Kamera ilə skan et"
                                                    >
                                                        <CameraIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                )}
                                            </div>

                                            {!item.inventoryItem ? (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={activeItemIndex === index ? inventorySearchQuery : ''}
                                                        onChange={(e) => {
                                                            setActiveItemIndex(index);
                                                            handleInventorySearchChange(e.target.value, index);
                                                        }}
                                                        onFocus={() => setActiveItemIndex(index)}
                                                        onBlur={() => {
                                                            // Delay to allow clicking on results
                                                            setTimeout(() => {
                                                                if (activeItemIndex === index) {
                                                                    setInventorySearchResults([]);
                                                                }
                                                            }, 200);
                                                        }}
                                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!formData.branch_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                        placeholder={formData.branch_id ? "İnventar #, barkod və ya məhsul adı ilə axtar..." : "Əvvəlcə filial seçin"}
                                                        disabled={!formData.branch_id}
                                                    />
                                                    {isSearchingInventory && activeItemIndex === index && (
                                                        <div className="absolute right-3 top-2.5 text-xs text-gray-400">Axtarılır...</div>
                                                    )}

                                                    {/* Inventory Search Results Dropdown */}
                                                    {inventorySearchResults.length > 0 && activeItemIndex === index && formData.branch_id && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                            {inventorySearchResults.map((inventoryItem) => (
                                                                <div
                                                                    key={`inventory-${inventoryItem.id}`}
                                                                    onClick={() => {
                                                                        handleInventorySelect(index, inventoryItem);
                                                                        setInventorySearchQuery('');
                                                                        setInventorySearchResults([]);
                                                                    }}
                                                                    className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-gray-900">{inventoryItem.product_name}</div>
                                                                            <div className="text-sm text-gray-600 mt-1">
                                                                                İnventar: {inventoryItem.inventory_number}
                                                                            </div>
                                                                            {inventoryItem.barcode && (
                                                                                <div className="text-xs text-gray-500">
                                                                                    Barkod: {inventoryItem.barcode}
                                                                                </div>
                                                                            )}
                                                                            {inventoryItem.product_sku && (
                                                                                <div className="text-xs text-gray-500">
                                                                                    SKU: {inventoryItem.product_sku}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-right ml-4">
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                                inventoryItem.status === 'available' ? 'bg-green-100 text-green-800' :
                                                                                inventoryItem.status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                                {inventoryItem.status === 'available' ? 'Mövcud' :
                                                                                 inventoryItem.status === 'rented' ? 'Kirayədə' :
                                                                                 inventoryItem.status}
                                                                            </span>
                                                                            {inventoryItem.daily_rate && (
                                                                                <div className="text-sm text-gray-600 mt-1">
                                                                                    {inventoryItem.daily_rate} AZN/gün
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-green-900">{item.inventoryItem.product_name}</div>
                                                        <div className="text-sm text-green-700">İnventar #: {item.inventoryItem.inventory_number}</div>
                                                        {item.inventoryItem.product_sku && (
                                                            <div className="text-sm text-green-700">SKU: {item.inventoryItem.product_sku}</div>
                                                        )}
                                                        <div className="flex items-center mt-1 space-x-2">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                item.inventoryItem.status === 'available' ? 'bg-green-100 text-green-800' :
                                                                item.inventoryItem.status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {item.inventoryItem.status === 'available' ? 'Mövcud' :
                                                                 item.inventoryItem.status === 'rented' ? 'Kirayədə' :
                                                                 item.inventoryItem.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setItems((prev) => {
                                                                const newItems = [...prev];
                                                                newItems[index] = {
                                                                    ...newItems[index],
                                                                    rental_inventory_id: '',
                                                                    inventoryItem: null,
                                                                    unit_price: '',
                                                                    total_price: 0,
                                                                };
                                                                return newItems;
                                                            });
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Availability Information */}
                                            {itemAvailability[index] && item.inventoryItem && (
                                                <div className={`mt-3 p-3 rounded-md border ${
                                                    itemAvailability[index].is_available
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className={`text-sm font-medium ${
                                                                itemAvailability[index].is_available
                                                                    ? 'text-green-800'
                                                                    : 'text-red-800'
                                                            }`}>
                                                                {itemAvailability[index].message}
                                                            </div>
                                                            <div className="text-xs text-gray-600 mt-1">
                                                                Cari status: {itemAvailability[index].current_status}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bookings List */}
                                                    {itemAvailability[index].bookings && itemAvailability[index].bookings.length > 0 && (
                                                        <div className="mt-3 border-t border-gray-200 pt-2">
                                                            <div className="text-xs font-medium text-gray-700 mb-2">
                                                                Rezervasiyalar:
                                                            </div>
                                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                                {itemAvailability[index].bookings.map((booking: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded border border-gray-200">
                                                                        <div>
                                                                            <span className="font-medium">{booking.rental_number}</span>
                                                                            <span className="text-gray-500 mx-1">-</span>
                                                                            <span>{booking.customer_name}</span>
                                                                        </div>
                                                                        <div className="text-gray-600">
                                                                            {new Date(booking.start_date).toLocaleDateString('az-AZ')} - {new Date(booking.end_date).toLocaleDateString('az-AZ')}
                                                                            {booking.quantity && <span className="ml-1">({booking.quantity} ədəd)</span>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Qiymət Növü <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={item.rate_type}
                                                onChange={(e) =>
                                                    handleItemChange(index, 'rate_type', e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="daily">Günlük</option>
                                                <option value="weekly">Həftəlik</option>
                                                <option value="monthly">Aylıq</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vahid Qiymət (AZN) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) =>
                                                    handleItemChange(index, 'unit_price', e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Müddət ({item.rate_type === 'daily' ? 'Gün' : item.rate_type === 'weekly' ? 'Həftə' : 'Ay'}) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.duration || ''}
                                                onChange={(e) =>
                                                    handleItemChange(index, 'duration', parseInt(e.target.value) || 0)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="1"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cəmi (AZN)
                                            </label>
                                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-medium">
                                                {Number(item.total_price || 0).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Qeydlər
                                            </label>
                                            <textarea
                                                value={item.notes}
                                                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={2}
                                                placeholder="Məhsul haqqında qeydlər..."
                                            />
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.items && <p className="mt-2 text-sm text-red-600">{errors.items}</p>}
                    </div>

                    {/* Collateral Information */}
                    <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">Girov Məlumatı</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Collateral Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Girov Növü <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.collateral_type}
                                    onChange={(e) => handleInputChange('collateral_type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="deposit_cash">Nağd Depozit</option>
                                    <option value="passport">Pasport</option>
                                    <option value="id_card">Şəxsiyyət Vəsiqəsi</option>
                                    <option value="drivers_license">Sürücülük Vəsiqəsi</option>
                                    <option value="other_document">Digər Sənəd</option>
                                </select>
                                {errors.collateral_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.collateral_type}</p>
                                )}
                            </div>

                            {/* Collateral Amount - Show only if deposit_cash */}
                            {formData.collateral_type === 'deposit_cash' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Depozit Məbləği (AZN) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.collateral_amount}
                                        onChange={(e) => handleInputChange('collateral_amount', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                        required
                                    />
                                    {errors.collateral_amount && (
                                        <p className="mt-1 text-sm text-red-600">{errors.collateral_amount}</p>
                                    )}
                                </div>
                            )}

                            {/* Document Type - Show only if not deposit_cash */}
                            {formData.collateral_type !== 'deposit_cash' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sənəd Növü
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.collateral_document_type}
                                            onChange={(e) =>
                                                handleInputChange('collateral_document_type', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Sənəd növünü daxil edin"
                                        />
                                        {errors.collateral_document_type && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.collateral_document_type}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sənəd Nömrəsi
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.collateral_document_number}
                                            onChange={(e) =>
                                                handleInputChange('collateral_document_number', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Sənəd nömrəsini daxil edin"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Collateral Photo */}
                            {formData.collateral_type !== 'deposit_cash' && (
                                <div className="md:col-span-2">
                                    <PhotoUpload
                                        photos={formData.collateral_photo ? [formData.collateral_photo] : []}
                                        onPhotosChange={(photos) => handleInputChange('collateral_photo', photos[0] || '')}
                                        maxPhotos={1}
                                        minPhotos={0}
                                        label="Girov Sənədinin Şəkli"
                                        required={false}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Sənədin hər iki tərəfinin şəklini çəkə bilərsiniz
                                    </p>
                                </div>
                            )}

                            {/* Collateral Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Girov Qeydləri
                                </label>
                                <textarea
                                    value={formData.collateral_notes}
                                    onChange={(e) => handleInputChange('collateral_notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Girov haqqında əlavə qeydlər..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment & Status */}
                    <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">Ödəniş və Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="reserved">Rezerv edilib</option>
                                    <option value="active">Aktiv</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ödəniş Statusu
                                </label>
                                <select
                                    value={formData.payment_status}
                                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="credit">Borclu</option>
                                    <option value="partial">Qismən ödənilib</option>
                                    <option value="paid">Ödənilib</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ödənilmiş Məbləğ (AZN)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.paid_amount}
                                    onChange={(e) => handleInputChange('paid_amount', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">Qeydlər</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ümumi Qeydlər
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Kirayə haqqında ümumi qeydlər..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Daxili Qeydlər
                                </label>
                                <textarea
                                    value={formData.internal_notes}
                                    onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Yalnız daxili istifadə üçün qeydlər..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rental Category - For Agreement Template Selection */}
                    {templates && categories && categories.length > 0 && (
                        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">Kirayə Kateqoriyası</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Müqavilə şablonunu müəyyən etmək üçün kirayə kateqoriyasını seçin
                            </p>
                            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(categories.length, 3)} gap-4`}>
                                {categories.map((category) => (
                                    templates[category.slug] && (
                                        <button
                                            key={category.slug}
                                            type="button"
                                            onClick={() => setRentalCategory(category.slug)}
                                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                                rentalCategory === category.slug
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            style={category.color && rentalCategory === category.slug ? {
                                                borderColor: category.color,
                                                backgroundColor: `${category.color}15`
                                            } : {}}
                                        >
                                            <div className="font-medium text-gray-900">{category.name_az}</div>
                                            {category.description_az && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {category.description_az}
                                                </div>
                                            )}
                                        </button>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form Validation Status */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">FORM VƏZİYYƏT YOXLAMASI</h2>
                        <div className="space-y-3">
                            {/* Customer Check */}
                            <div className="flex items-center">
                                {formData.customer_id ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                ) : (
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                                )}
                                <span className={formData.customer_id ? 'text-green-700' : 'text-red-700'}>
                                    Müştəri seçildi: {formData.customer_id ? '✓' : '✗ Müştəri seçin'}
                                </span>
                            </div>

                            {/* Branch Check */}
                            <div className="flex items-center">
                                {formData.branch_id ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                ) : (
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                                )}
                                <span className={formData.branch_id ? 'text-green-700' : 'text-red-700'}>
                                    Filial seçildi: {formData.branch_id ? '✓' : '✗ Filial seçin'}
                                </span>
                            </div>

                            {/* Start Date Check */}
                            <div className="flex items-center">
                                {formData.rental_start_date ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                ) : (
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                                )}
                                <span className={formData.rental_start_date ? 'text-green-700' : 'text-red-700'}>
                                    Başlama tarixi: {formData.rental_start_date ? '✓' : '✗ Tarix seçin'}
                                </span>
                            </div>

                            {/* Items Check */}
                            <div className="flex items-center">
                                {items.length > 0 ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                ) : (
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                                )}
                                <span className={items.length > 0 ? 'text-green-700' : 'text-red-700'}>
                                    Məhsullar əlavə edildi: {items.length > 0 ? `✓ (${items.length} ədəd)` : '✗ Məhsul əlavə edin'}
                                </span>
                            </div>

                            {/* Individual Item Checks */}
                            {items.map((item, index) => (
                                <div key={index} className="ml-6 space-y-2">
                                    <div className="text-sm font-medium text-gray-700">Məhsul {index + 1}:</div>
                                    
                                    {/* Inventory Selection */}
                                    <div className="flex items-center ml-4">
                                        {item.rental_inventory_id ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                        ) : (
                                            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                        )}
                                        <span className={`text-sm ${item.rental_inventory_id ? 'text-green-600' : 'text-red-600'}`}>
                                            İnventar: {item.rental_inventory_id ? '✓' : '✗ İnventar seçin'}
                                        </span>
                                    </div>

                                    {/* Unit Price */}
                                    <div className="flex items-center ml-4">
                                        {item.unit_price ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                        ) : (
                                            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                        )}
                                        <span className={`text-sm ${item.unit_price ? 'text-green-600' : 'text-red-600'}`}>
                                            Qiymət: {item.unit_price ? `✓ (${item.unit_price} AZN)` : '✗ Qiymət daxil edin'}
                                        </span>
                                    </div>

                                    {/* Duration */}
                                    <div className="flex items-center ml-4">
                                        {item.duration > 0 ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                        ) : (
                                            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                        )}
                                        <span className={`text-sm ${item.duration > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Müddət: {item.duration > 0 ? `✓ (${item.duration} ${item.rate_type === 'daily' ? 'gün' : item.rate_type === 'weekly' ? 'həftə' : 'ay'})` : '✗ Müddət daxil edin'}
                                        </span>
                                    </div>

                                    {/* Availability Status */}
                                    {item.rental_inventory_id && (
                                        <div className="flex items-center ml-4">
                                            {itemAvailability[index] ? (
                                                itemAvailability[index].is_available ? (
                                                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                ) : (
                                                    <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                                )
                                            ) : (
                                                <div className="h-4 w-4 mr-2 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            <span className={`text-sm ${
                                                itemAvailability[index] 
                                                    ? itemAvailability[index].is_available ? 'text-green-600' : 'text-red-600'
                                                    : 'text-yellow-600'
                                            }`}>
                                                Mövcudluq: {
                                                    itemAvailability[index] 
                                                        ? itemAvailability[index].is_available ? '✓ Mövcud' : '✗ Mövcud deyil'
                                                        : '⏳ Yoxlanılır...'
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => router.visit(route('rentals.index'))}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={processing}
                        >
                            Ləğv et
                        </button>
                        <button
                            type="submit"
                            disabled={processing || 
                                !formData.customer_id || 
                                !formData.branch_id || 
                                !formData.rental_start_date || 
                                items.length === 0 ||
                                !items.every(item => item.rental_inventory_id && item.unit_price && item.duration) ||
                                items.some((item, index) => {
                                    const availability = itemAvailability[index];
                                    return availability && !availability.is_available;
                                })
                            }
                            className="w-full sm:w-auto inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Yaradılır...' : (
                                templates && templates[rentalCategory] ? (
                                    <>
                                        Müqaviləyə Keç
                                        <ArrowRightIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    </>
                                ) : 'Kirayə Yarat'
                            )}
                        </button>
                    </div>
                </form>
                )}

                {/* Barcode Scanner Modal */}
                <BarcodeScanner
                    isOpen={showScanner}
                    onClose={() => {
                        setShowScanner(false);
                        setActiveItemIndex(null);
                    }}
                    onScan={handleBarcodeScan}
                />
            </div>
        </AuthenticatedLayout>
    );
}
