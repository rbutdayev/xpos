import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrintModal from '@/Components/PrintModal';
import LocationInput, { LocationData } from '@/Components/LocationInput';
import SearchableCustomerSelect from '@/Components/SearchableCustomerSelect';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ShoppingCartIcon,
    Squares2X2Icon,
    ListBulletIcon,
    MapPinIcon,
    ClockIcon,
    XMarkIcon,
    UserPlusIcon,
    CheckCircleIcon,
    PrinterIcon,
    MinusIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
}

interface Branch {
    id: number;
    name: string;
}

interface Warehouse {
    id: number;
    name: string;
    type: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string;
    description: string;
    image: string | null;
    sale_price: number;
    original_price: number | null;
    discount_percentage: number | null;
    has_discount: boolean;
    stock_quantity: number;
    has_variants: boolean;
    variants: ProductVariant[];
    category: string | null;
}

interface ProductVariant {
    id: number;
    size: string | null;
    color: string | null;
    color_code: string | null;
    display_name: string;
    final_price: number;
    original_price: number | null;
    discount_percentage: number | null;
    has_discount: boolean;
    stock_quantity: number;
}

interface CartItem {
    product_id: number;
    variant_id: number | null;
    product_name: string;
    variant_display: string | null;
    quantity: number;
    unit_price: number;
    image: string | null;
}

interface PreviousOrder {
    sale_id: number;
    sale_number: string;
    sale_date: string;
    total: number;
    items: {
        product_id: number;
        variant_id: number | null;
        product_name: string;
        variant_display: string | null;
        quantity: number;
        unit_price: number;
    }[];
}

interface Props {
    branches: Branch[];
    warehouses?: Warehouse[];
    initialProducts: Product[];
    defaultBranch: number | null;
    defaultWarehouse?: number | null;
    auth: {
        user: {
            role: string;
            branch_id: number | null;
        };
    };
}

export default function Index({ branches, initialProducts, defaultBranch, auth }: Props) {
    const { t } = useTranslation();

    // View mode state
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Customer state
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '' });

    // Location permission modal state
    const [showLocationModal, setShowLocationModal] = useState(true);
    const [locationPermissionDismissed, setLocationPermissionDismissed] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
    const [showSettingsInstructions, setShowSettingsInstructions] = useState(false);

    // Location state
    const [locationData, setLocationData] = useState<LocationData>({
        latitude: null,
        longitude: null,
        address: '',
        timestamp: null,
    });

    // Notes state
    const [notes, setNotes] = useState<string>('');

    // Branch state
    const [selectedBranch, setSelectedBranch] = useState<number>(defaultBranch || 0);

    // Product search state
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);

    // Previous orders state
    const [previousOrders, setPreviousOrders] = useState<PreviousOrder[]>([]);
    const [showPreviousOrders, setShowPreviousOrders] = useState(false);

    // Sale completion and print state
    const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);

    // Collapsible sections state
    const [showFilters, setShowFilters] = useState(false);

    // Load products when branch changes or when searching
    useEffect(() => {
        const timer = setTimeout(() => {
            loadProducts(true); // Reset to page 1
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedBranch]);

    // Load customer's previous orders when customer is selected
    useEffect(() => {
        if (selectedCustomer) {
            loadCustomerOrders();
        } else {
            setPreviousOrders([]);
        }
    }, [selectedCustomer]);

    const loadProducts = async (reset = false, pageOverride?: number) => {
        if (!selectedBranch) {
            setProducts([]);
            return;
        }

        const pageToLoad = reset ? 1 : (pageOverride || currentPage);

        if (reset) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const params = new URLSearchParams({
                branch_id: selectedBranch.toString(),
                page: pageToLoad.toString(),
            });

            if (searchQuery) {
                params.append('q', searchQuery);
            }

            const response = await fetch(`/expeditor/products?${params.toString()}`);
            const data = await response.json();

            if (reset) {
                setProducts(data);
                setCurrentPage(1);
                setHasMore(data.length >= 30); // 30 is the perPage value from backend
            } else {
                setProducts(prev => [...prev, ...data]);
                setCurrentPage(pageToLoad);
                setHasMore(data.length >= 30);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Load more products (for infinite scroll)
    const loadMoreProducts = () => {
        if (!isLoadingMore && hasMore && !isLoading) {
            const nextPage = currentPage + 1;
            loadProducts(false, nextPage);
        }
    };

    // Infinite scroll: detect when user scrolls near bottom
    useEffect(() => {
        const handleScroll = () => {
            // Check if user has scrolled near the bottom (within 300px)
            const scrollPosition = window.innerHeight + window.scrollY;
            const bottomPosition = document.documentElement.scrollHeight - 300;

            if (scrollPosition >= bottomPosition && hasMore && !isLoadingMore && !isLoading) {
                loadMoreProducts();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoadingMore, isLoading, currentPage]);

    const loadCustomerOrders = async () => {
        if (!selectedCustomer) return;

        try {
            const response = await fetch(`/expeditor/customers/${selectedCustomer}/orders`);
            const data = await response.json();
            setPreviousOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to load customer orders:', error);
        }
    };

    const addToCart = (product: Product, variant: ProductVariant | null = null) => {
        const existingItemIndex = cart.findIndex(
            item => item.product_id === product.id && item.variant_id === (variant?.id || null)
        );

        if (existingItemIndex >= 0) {
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity += 1;
            setCart(updatedCart);
        } else {
            const newItem: CartItem = {
                product_id: product.id,
                variant_id: variant?.id || null,
                product_name: product.name,
                variant_display: variant?.display_name || null,
                quantity: 1,
                unit_price: variant ? variant.final_price : product.sale_price,
                image: product.image,
            };
            setCart([...cart, newItem]);
        }
    };

    const updateCartQuantity = (index: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(index);
            return;
        }

        const updatedCart = [...cart];
        updatedCart[index].quantity = quantity;
        setCart(updatedCart);
    };

    const removeFromCart = (index: number) => {
        const updatedCart = cart.filter((_, i) => i !== index);
        setCart(updatedCart);
    };

    const reorderFromPrevious = (order: PreviousOrder) => {
        const newItems: CartItem[] = order.items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_display: item.variant_display,
            quantity: item.quantity,
            unit_price: item.unit_price,
            image: null,
        }));

        setCart([...cart, ...newItems]);
        setShowPreviousOrders(false);
    };

    const createCustomer = async () => {
        try {
            const response = await fetch('/expeditor/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(newCustomerData),
            });

            const data = await response.json();

            if (data.success) {
                setSelectedCustomer(data.customer.id.toString());
                setShowNewCustomerModal(false);
                setNewCustomerData({ name: '', phone: '', email: '' });
            }
        } catch (error) {
            console.error('Failed to create customer:', error);
        }
    };

    const completeSale = () => {
        if (cart.length === 0) {
            alert('Səbət boşdur');
            return;
        }

        if (!selectedBranch) {
            alert('Filial seçin');
            return;
        }

        // Always include "Expeditor Satışı" prefix in notes
        const expeditorPrefix = 'Expeditor Satışı';
        const finalNotes = notes.trim()
            ? `${expeditorPrefix} - ${notes.trim()}`
            : expeditorPrefix;

        const saleData: any = {
            customer_id: selectedCustomer,
            branch_id: selectedBranch,
            items: cart.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_amount: 0,
            })),
            payment_status: 'paid',
            payment_method: 'cash',
            notes: finalNotes,
        };

        if (locationData.address) {
            saleData.visit_address = locationData.address;
        }
        if (locationData.latitude && locationData.longitude) {
            saleData.visit_latitude = locationData.latitude;
            saleData.visit_longitude = locationData.longitude;
            saleData.visit_timestamp = locationData.timestamp;
        }

        router.post('/pos/sale', saleData, {
            onSuccess: (page: any) => {
                const saleId = page.props?.flash?.sale_id || page.props?.sale?.sale_id;

                setCart([]);
                setNotes('');
                setLocationData({
                    latitude: null,
                    longitude: null,
                    address: '',
                    timestamp: null,
                });
                setShowCart(false);

                if (saleId) {
                    setCompletedSaleId(saleId);
                    setShowSuccessModal(true);
                }
            },
            onError: (errors) => {
                console.error('Sale failed:', errors);
                alert('Satış zamanı xəta baş verdi');
            },
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Check permission status on mount
    useEffect(() => {
        const checkPermission = async () => {
            if ('permissions' in navigator) {
                try {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    setPermissionStatus(result.state);

                    // If already granted, auto-dismiss modal
                    if (result.state === 'granted') {
                        setShowLocationModal(false);
                        setLocationPermissionDismissed(true);
                    }

                    // Listen for permission changes
                    result.addEventListener('change', () => {
                        setPermissionStatus(result.state);
                        if (result.state === 'granted') {
                            setShowSettingsInstructions(false);
                        }
                    });
                } catch (error) {
                    console.error('Permission check error:', error);
                    setPermissionStatus('unknown');
                }
            }
        };
        checkPermission();
    }, []);

    // Handle location permission request
    const handleEnableLocation = () => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            alert('GPS bu cihazda mövcud deyil');
            return;
        }

        // Check if running on secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
            console.warn('Geolocation requires secure context (HTTPS)');
        }

        // Detect if Chrome on Android - Chrome needs special handling
        const isChrome = /Chrome/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);
        const requestDelay = isChrome ? 100 : 0;

        setTimeout(() => {
            // IMPORTANT: Directly call getCurrentPosition() to trigger browser permission prompt
            // This is the ONLY way to request location permission from the browser
            navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const timestamp = new Date().toISOString();
                setLocationData({
                    latitude,
                    longitude,
                    address: `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    timestamp,
                });
                setShowLocationModal(false);
                setLocationPermissionDismissed(true);
                setPermissionStatus('granted');
                setShowSettingsInstructions(false);
                setShowFilters(true); // Expand filters to show captured location
            },
            (error) => {
                console.error('Location error:', error);

                if (error.code === error.PERMISSION_DENIED) {
                    // User denied permission - show settings instructions
                    setPermissionStatus('denied');
                    setShowSettingsInstructions(true);
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    // Position unavailable - still dismiss modal
                    setShowLocationModal(false);
                    setLocationPermissionDismissed(true);
                    setShowFilters(true);
                } else if (error.code === error.TIMEOUT) {
                    // Timeout - still dismiss modal
                    setShowLocationModal(false);
                    setLocationPermissionDismissed(true);
                    setShowFilters(true);
                } else {
                    // Other error - still dismiss modal
                    setShowLocationModal(false);
                    setLocationPermissionDismissed(true);
                    setShowFilters(true);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Increased timeout for Chrome
                maximumAge: 0,
            }
        );
        }, requestDelay);
    };

    const handleDismissLocationModal = () => {
        setShowLocationModal(false);
        setLocationPermissionDismissed(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Expeditor - Field Sales" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');

                .expeditor-page {
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                }

                .expeditor-title {
                    font-family: 'Syne', sans-serif;
                }

                .product-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .product-card:active {
                    transform: scale(0.97);
                }

                .bottom-sheet {
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }

                .pulse-ring {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .gradient-border {
                    position: relative;
                    background: linear-gradient(white, white) padding-box,
                                linear-gradient(135deg, #FF6B35, #F7931E) border-box;
                    border: 2px solid transparent;
                }
            `}</style>

            <div className="expeditor-page min-h-screen bg-gradient-to-b from-slate-50 to-white pb-32">
                {/* Location Permission Modal */}
                {showLocationModal && !locationPermissionDismissed && !locationData.latitude && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 px-6 py-8 text-white text-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPinIcon className="w-12 h-12" />
                                </div>
                                <h2 className="expeditor-title text-2xl font-extrabold mb-2">
                                    {t('expeditor.locationPermissionTitle', 'Məkan İcazəsi')}
                                </h2>
                                <p className="text-orange-100 text-sm font-medium">
                                    {t('expeditor.locationPermissionSubtitle', 'Sahə satışları üçün')}
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {!showSettingsInstructions ? (
                                    <>
                                        <p className="text-slate-700 text-center leading-relaxed font-medium">
                                            {t('expeditor.locationPermissionMessage', 'Sahə satışlarını qeyd etmək və müştəri ziyarətlərini izləmək üçün məkan məlumatınıza ehtiyacımız var.')}
                                        </p>

                                        <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-2xl p-4">
                                            <h3 className="font-black text-orange-900 mb-3 text-sm uppercase tracking-wide">
                                                {t('expeditor.whyWeNeedLocation', 'Niyə məkan lazımdır?')}
                                            </h3>
                                            <ul className="space-y-2 text-sm text-orange-800 font-semibold">
                                                <li className="flex items-start">
                                                    <span className="mr-2 text-orange-500">•</span>
                                                    <span>{t('expeditor.locationReason1', 'Müştəri ziyarətlərini qeyd etmək')}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="mr-2 text-orange-500">•</span>
                                                    <span>{t('expeditor.locationReason2', 'Satış yerini təyin etmək')}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="mr-2 text-orange-500">•</span>
                                                    <span>{t('expeditor.locationReason3', 'Dəqiq hesabatlama və təhlil')}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="pt-2 space-y-3">
                                            <button
                                                onClick={handleEnableLocation}
                                                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white py-4 rounded-2xl font-black text-base shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
                                            >
                                                <MapPinIcon className="w-5 h-5" />
                                                {t('expeditor.enableLocation', 'Məkanı Aktivləşdir')}
                                            </button>

                                            <button
                                                onClick={handleDismissLocationModal}
                                                className="w-full bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold transition-colors active:scale-95"
                                            >
                                                {t('expeditor.maybeLater', 'Sonra')}
                                            </button>

                                            <p className="text-xs text-center text-slate-500 font-medium">
                                                {t('expeditor.locationOptionalNote', 'Məkan məlumatı vacib deyil, lakin tövsiyə olunur')}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Settings Instructions */}
                                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                                            <div className="flex items-start gap-3">
                                                <ExclamationCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h3 className="font-black text-red-900 mb-1">
                                                        {t('locationDenied', 'Məkan İcazəsi Rədd Edildi')}
                                                    </h3>
                                                    <p className="text-sm text-red-800 font-semibold">
                                                        {t('locationDeniedMessage', 'Məkan icazəsini əvvəl rədd etmisiniz. İcazə vermək üçün cihaz parametrlərindən aktivləşdirməlisiniz.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                                            <h3 className="font-black text-slate-900 uppercase tracking-wide">
                                                {t('howToEnable', 'Necə aktivləşdirmək olar?')}
                                            </h3>

                                            {/* iOS Instructions */}
                                            <div className="space-y-2 bg-white p-3 rounded-xl">
                                                <p className="font-extrabold text-slate-900">📱 iPhone/iPad (Safari):</p>
                                                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 ml-2 font-medium">
                                                    <li>Settings (Parametrlər) → Safari</li>
                                                    <li>Location (Məkan) → Allow (İcazə ver)</li>
                                                    <li className="text-orange-600 font-bold">Və ya:</li>
                                                    <li>Settings → Privacy (Məxfilik) → Location Services</li>
                                                    <li>Safari Websites → Allow (İcazə ver)</li>
                                                </ol>
                                            </div>

                                            {/* Android Chrome Instructions */}
                                            <div className="space-y-2 bg-white p-3 rounded-xl">
                                                <p className="font-extrabold text-slate-900">🤖 Android (Chrome):</p>
                                                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 ml-2 font-medium">
                                                    <li>Chrome → ⋮ (Menyu) → Settings</li>
                                                    <li>Site Settings → Location</li>
                                                    <li>Bu saytı tapın və "Allow" seçin</li>
                                                    <li className="text-orange-600 font-bold">Və ya:</li>
                                                    <li>URL-in yanındakı kilid ikonasına toxunun</li>
                                                    <li>Permissions → Location → Allow</li>
                                                </ol>
                                            </div>

                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 mt-3">
                                                <p className="text-xs text-blue-900 font-bold flex items-start gap-2">
                                                    <span>💡</span>
                                                    <span>{t('refreshAfterSettings', 'Parametrləri dəyişdirdikdən sonra səhifəni yeniləyin')}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 space-y-3">
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white py-4 rounded-2xl font-black text-base shadow-2xl active:scale-98 transition-all"
                                            >
                                                {t('refreshPage', 'Səhifəni Yenilə')}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowLocationModal(false);
                                                    setShowSettingsInstructions(false);
                                                    setLocationPermissionDismissed(true);
                                                }}
                                                className="w-full bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold transition-colors active:scale-95"
                                            >
                                                {t('expeditor.maybeLater', 'Sonra')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Compact Mobile Header */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
                    <div className="px-4 py-3">
                        {/* Title Row */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h1 className="expeditor-title text-2xl font-extrabold bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent">
                                    {t('expeditor.title', 'Expeditor')}
                                </h1>
                            </div>

                            {/* View Toggle - Compact */}
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    <Squares2X2Icon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === 'list'
                                            ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    <ListBulletIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('expeditor.searchProducts', 'Məhsul axtar...')}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-base font-medium transition-all bg-white"
                            />
                        </div>

                        {/* Collapsible Filters */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full mt-3 flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl text-sm font-semibold text-slate-700 active:scale-98 transition-all"
                        >
                            <span>Filterlər və Detallar</span>
                            {showFilters ? (
                                <ChevronUpIcon className="w-5 h-5" />
                            ) : (
                                <ChevronDownIcon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Expandable Filter Section */}
                        {showFilters && (
                            <div className="mt-3 space-y-3 animate-in slide-in-from-top duration-300">
                                {/* Branch Selector */}
                                {branches.length > 1 && (
                                    <div>
                                        <label className="block text-xs font-bold text-orange-600 mb-1.5 uppercase tracking-wider">
                                            {t('expeditor.branch', 'Filial')}
                                        </label>
                                        <select
                                            value={selectedBranch || ''}
                                            onChange={(e) => setSelectedBranch(parseInt(e.target.value))}
                                            className="w-full rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 py-2.5 px-3 font-semibold text-slate-800 bg-white"
                                        >
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Customer Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 mb-1.5 uppercase tracking-wider">
                                        {t('expeditor.selectCustomer', 'Müştəri')}
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <SearchableCustomerSelect
                                                value={selectedCustomer}
                                                onChange={(customerId) => setSelectedCustomer(customerId)}
                                                placeholder={t('expeditor.searchCustomer', 'Müştəri seçin...')}
                                                className="w-full"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowNewCustomerModal(true)}
                                            className="px-4 py-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                                        >
                                            <UserPlusIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Location & Notes Grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                            <MapPinIcon className="w-3.5 h-3.5" />
                                            {t('expeditor.locationPlaceholder', 'Məkan')}
                                        </label>
                                        <LocationInput
                                            value={locationData}
                                            onChange={setLocationData}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-amber-600 mb-1.5 uppercase tracking-wider">
                                            {t('fields.notes', 'Qeydlər')}
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder={t('expeditor.notesPlaceholder', 'Əlavə qeydlər...')}
                                            className="w-full px-3 py-2.5 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 resize-none font-medium"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                {/* Quick Reorder Button */}
                                {selectedCustomer && previousOrders.length > 0 && (
                                    <button
                                        onClick={() => setShowPreviousOrders(true)}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ClockIcon className="w-5 h-5" />
                                        {t('expeditor.quickReorder', 'Əvvəlki sifarişlər')} ({previousOrders.length})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="px-4 py-6">
                    {!selectedBranch ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <MagnifyingGlassIcon className="h-12 w-12 text-orange-500" />
                            </div>
                            <p className="text-lg font-bold text-slate-700">
                                {t('expeditor.selectBranch', 'Filial seçin')}
                            </p>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-20">
                            <div className="relative w-20 h-20 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 opacity-25 animate-ping"></div>
                                <div className="relative w-20 h-20 rounded-full border-4 border-t-orange-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin"></div>
                            </div>
                            <p className="text-base font-bold text-slate-600">{t('common.loading', 'Yüklənir...')}</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <MagnifyingGlassIcon className="h-12 w-12 text-slate-400" />
                            </div>
                            <p className="text-lg font-bold text-slate-700">
                                {searchQuery
                                    ? t('expeditor.noResults', 'Məhsul tapılmadı')
                                    : t('expeditor.noProductsInWarehouse', 'Məhsul yoxdur')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
                                {products.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        viewMode={viewMode}
                                        onAddToCart={addToCart}
                                    />
                                ))}
                            </div>

                            {/* Loading More Indicator */}
                            {isLoadingMore && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-lg border-2 border-slate-200">
                                        <div className="w-5 h-5 rounded-full border-2 border-t-orange-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin"></div>
                                        <span className="text-sm font-bold text-slate-600">Daha çox məhsul yüklənir...</span>
                                    </div>
                                </div>
                            )}

                            {/* End of List Indicator */}
                            {!hasMore && products.length > 0 && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100 to-slate-50 px-6 py-3 rounded-2xl border-2 border-slate-200">
                                        <span className="text-sm font-bold text-slate-500">Bütün məhsullar göstərildi</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Floating Cart Button - Bottom Right (Thumb Zone) */}
                {cart.length > 0 && (
                    <button
                        onClick={() => setShowCart(true)}
                        className="fixed bottom-6 right-4 z-20"
                    >
                        <div className="relative">
                            {/* Pulsing Ring */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl opacity-25 pulse-ring"></div>

                            {/* Main Button */}
                            <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 active:scale-95 transition-transform">
                                <div className="relative">
                                    <ShoppingCartIcon className="w-7 h-7" />
                                    <span className="absolute -top-2 -right-2 bg-white text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-lg">
                                        {cartItemCount}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold opacity-90">Səbət</div>
                                    <div className="text-xl font-black">₼{cartTotal.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </button>
                )}
            </div>

            {/* Bottom Sheet Cart Modal */}
            {showCart && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowCart(false)}>
                    <div className="bottom-sheet w-full max-h-[85vh] bg-white rounded-t-3xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Handle Bar */}
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="px-5 pb-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Səbət</h2>
                                    <p className="text-sm font-semibold text-slate-500 mt-0.5">{cart.length} məhsul</p>
                                </div>
                                <button
                                    onClick={() => setShowCart(false)}
                                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
                                >
                                    <XMarkIcon className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Cart Items - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {cart.map((item, index) => (
                                <div key={index} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100">
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl flex-shrink-0 overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">📦</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{item.product_name}</h3>
                                        {item.variant_display && (
                                            <p className="text-xs text-slate-600 font-medium mb-2">{item.variant_display}</p>
                                        )}
                                        <p className="text-lg font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                                            ₼{item.unit_price.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex flex-col justify-between items-end">
                                        <button
                                            onClick={() => removeFromCart(index)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>

                                        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border-2 border-slate-200">
                                            <button
                                                onClick={() => updateCartQuantity(index, item.quantity - 1)}
                                                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center font-black text-slate-700 transition-colors active:scale-95"
                                            >
                                                <MinusIcon className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-black text-slate-900">{item.quantity}</span>
                                            <button
                                                onClick={() => updateCartQuantity(index, item.quantity + 1)}
                                                className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-lg flex items-center justify-center font-black transition-colors active:scale-95"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer - Fixed at Bottom */}
                        <div className="px-5 py-5 bg-slate-50 border-t-2 border-slate-200">
                            {/* Total */}
                            <div className="flex items-center justify-between mb-4 px-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-slate-200">
                                <span className="text-base font-bold text-slate-600">Cəmi:</span>
                                <span className="text-3xl font-black bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent">
                                    ₼{cartTotal.toFixed(2)}
                                </span>
                            </div>

                            {/* Complete Sale Button */}
                            <button
                                onClick={completeSale}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon className="w-6 h-6" />
                                Satışı tamamla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Customer Modal - Bottom Sheet */}
            {showNewCustomerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowNewCustomerModal(false)}>
                    <div className="bottom-sheet w-full bg-white rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
                        {/* Handle Bar */}
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                        </div>

                        <div className="px-5 pb-5">
                            <h2 className="text-2xl font-black text-slate-900 mb-1">Yeni Müştəri</h2>
                            <p className="text-sm font-semibold text-slate-500 mb-5">Müştəri məlumatlarını daxil edin</p>

                            <div className="space-y-4 mb-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Ad *</label>
                                    <input
                                        type="text"
                                        value={newCustomerData.name}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                        className="w-full rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 py-3 px-4 font-semibold"
                                        placeholder="Müştəri adı"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Telefon</label>
                                    <input
                                        type="text"
                                        value={newCustomerData.phone}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                                        className="w-full rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 py-3 px-4 font-semibold"
                                        placeholder="+994"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={newCustomerData.email}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                                        className="w-full rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 py-3 px-4 font-semibold"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowNewCustomerModal(false)}
                                    className="flex-1 px-6 py-3.5 border-2 border-slate-300 rounded-xl font-bold text-slate-700 transition-colors active:scale-95 bg-white"
                                >
                                    Ləğv et
                                </button>
                                <button
                                    onClick={createCustomer}
                                    disabled={!newCustomerData.name}
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-all"
                                >
                                    Yarat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Previous Orders Modal - Bottom Sheet */}
            {showPreviousOrders && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowPreviousOrders(false)}>
                    <div className="bottom-sheet w-full max-h-[85vh] bg-white rounded-t-3xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Handle Bar */}
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                        </div>

                        <div className="px-5 pb-4 border-b border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900">Əvvəlki Sifarişlər</h2>
                            <p className="text-sm font-semibold text-slate-500 mt-0.5">{previousOrders.length} sifariş</p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {previousOrders.map(order => (
                                <div key={order.sale_id} className="border-2 border-slate-200 rounded-2xl p-4 bg-gradient-to-br from-white to-slate-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-black text-lg text-slate-900">#{order.sale_number}</h3>
                                            <p className="text-sm font-semibold text-slate-600 mt-0.5">{order.sale_date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-2xl bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                                                ₼{order.total.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-200 mb-3">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-slate-700 font-semibold">
                                                    {item.product_name}
                                                    {item.variant_display && <span className="text-slate-500"> ({item.variant_display})</span>}
                                                    <span className="text-slate-500"> × {item.quantity}</span>
                                                </span>
                                                <span className="font-bold text-slate-900">₼{(item.quantity * item.unit_price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => reorderFromPrevious(order)}
                                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                                    >
                                        Yenidən sifariş et
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && completedSaleId && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-5 shadow-2xl animate-bounce">
                                    <CheckCircleIcon className="h-14 w-14 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">
                                    {t('expeditor.saleCompleted', 'Satış tamamlandı!')}
                                </h3>
                                <p className="text-sm font-semibold text-slate-600">
                                    {t('expeditor.saleCompletedMessage', 'Qəbz çap edə bilərsiniz')}
                                </p>
                            </div>
                        </div>

                        <div className="p-5 space-y-3">
                            <button
                                onClick={() => {
                                    setShowPrintModal(true);
                                    setShowSuccessModal(false);
                                }}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                {t('actions.print', 'Çap et')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setCompletedSaleId(null);
                                }}
                                className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold transition-colors active:scale-95"
                            >
                                {t('actions.close', 'Bağla')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            {showPrintModal && completedSaleId && (
                <PrintModal
                    isOpen={showPrintModal}
                    onClose={() => {
                        setShowPrintModal(false);
                        setCompletedSaleId(null);
                    }}
                    resourceType="sale"
                    resourceId={completedSaleId}
                    title={t('expeditor.printReceipt', 'Qəbz çap et')}
                />
            )}
        </AuthenticatedLayout>
    );
}

// Mobile-Optimized Product Card
function ProductCard({
    product,
    viewMode,
    onAddToCart
}: {
    product: Product;
    viewMode: 'grid' | 'list';
    onAddToCart: (product: Product, variant: ProductVariant | null) => void;
}) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    if (viewMode === 'grid') {
        return (
            <div className="product-card bg-white rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 hover:border-orange-300 hover:shadow-xl">
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">📦</div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                        {/* Stock Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-lg ${
                            product.stock_quantity > 10
                                ? 'bg-emerald-500 text-white'
                                : product.stock_quantity > 0
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-red-500 text-white'
                        }`}>
                            {product.stock_quantity}
                        </span>

                        {/* Discount Badge */}
                        {product.has_discount && product.discount_percentage && (
                            <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-lg">
                                -{product.discount_percentage}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="p-3.5">
                    {product.category && (
                        <p className="text-xs font-black text-orange-600 mb-1 uppercase tracking-wide">{product.category}</p>
                    )}
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 text-sm leading-tight">{product.name}</h3>

                    {/* Price */}
                    <div className="mb-3">
                        {product.has_discount ? (
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                                    ₼{product.sale_price}
                                </span>
                                <span className="text-xs text-slate-400 line-through font-semibold">₼{product.original_price}</span>
                            </div>
                        ) : (
                            <span className="text-xl font-black text-slate-900">₼{product.sale_price}</span>
                        )}
                    </div>

                    {/* Variants */}
                    {product.has_variants && product.variants.length > 0 && (
                        <select
                            value={selectedVariant?.id || ''}
                            onChange={(e) => {
                                const variant = product.variants.find(v => v.id === parseInt(e.target.value));
                                setSelectedVariant(variant || null);
                            }}
                            className="w-full text-xs rounded-lg border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 mb-3 py-2 px-2 font-semibold"
                        >
                            <option value="">Variant seçin...</option>
                            {product.variants.map(variant => (
                                <option key={variant.id} value={variant.id}>
                                    {variant.display_name} - ₼{variant.final_price} ({variant.stock_quantity})
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Add Button - Large Touch Target */}
                    <button
                        onClick={() => {
                            if (product.has_variants && !selectedVariant) {
                                alert('Variant seçin');
                                return;
                            }
                            onAddToCart(product, selectedVariant);
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white py-3 rounded-xl font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Əlavə et
                    </button>
                </div>
            </div>
        );
    }

    // List View - Horizontal Card
    return (
        <div className="product-card bg-white rounded-2xl p-3.5 flex gap-3 shadow-md border-2 border-slate-100 hover:border-orange-300 hover:shadow-xl">
            {/* Image */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex-shrink-0 overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
                )}

                {/* Discount Badge */}
                {product.has_discount && product.discount_percentage && (
                    <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-0.5 rounded-lg text-xs font-black shadow-lg">
                        -{product.discount_percentage}%
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    {product.category && <p className="text-xs font-black text-orange-600 mb-0.5 uppercase tracking-wide">{product.category}</p>}
                    <h3 className="font-bold text-slate-900 mb-1.5 text-base leading-tight line-clamp-2">{product.name}</h3>

                    {/* Stock Badge */}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                        product.stock_quantity > 10
                            ? 'bg-emerald-100 text-emerald-700'
                            : product.stock_quantity > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                    }`}>
                        Stok: {product.stock_quantity}
                    </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div>
                        {product.has_discount ? (
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                                    ₼{product.sale_price}
                                </span>
                                <span className="text-xs text-slate-400 line-through font-semibold">₼{product.original_price}</span>
                            </div>
                        ) : (
                            <span className="text-xl font-black text-slate-900">₼{product.sale_price}</span>
                        )}
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={() => onAddToCart(product, null)}
                        className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg active:scale-95 transition-all flex items-center gap-1.5 text-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Əlavə
                    </button>
                </div>
            </div>
        </div>
    );
}
