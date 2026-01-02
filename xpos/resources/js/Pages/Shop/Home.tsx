import { Head, Link, router } from '@inertiajs/react';
import {
    ShoppingCartIcon,
    PhoneIcon,
    MapPinIcon,
    EnvelopeIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    PlusIcon,
    MinusIcon,
    TagIcon,
    SparklesIcon,
    Bars3Icon,
    ChevronRightIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface Account {
    company_name: string;
    shop_slug: string;
    phone: string | null;
    email: string | null;
    address: string | null;
}

interface Category {
    id: number;
    name: string;
    children?: Category[];
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    sale_price: number | string; // Can be string from Laravel decimal cast
    brand?: string | null;
    model?: string | null;
    image_url: string | null;
    category?: {
        id: number;
        name: string;
    };
    available_sizes?: string[];
    available_colors?: Array<{ name: string; code: string | null }>;
    price_range?: {
        min: number;
        max: number;
        has_range: boolean;
    };
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    account: Account;
    products: PaginatedProducts;
    categories: Category[];
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface OrderFormData {
    customer_name: string;
    customer_phone: string;
    city: string;
    address: string;
    notes: string;
}

export default function Home({ account, products, categories }: Props) {
    // Load cart from localStorage on mount
    const [cart, setCart] = useState<{ [key: number]: CartItem }>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`shop_cart_${account.shop_slug}`);
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });
    const [showCart, setShowCart] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [showCartCheckout, setShowCartCheckout] = useState(false);
    const [orderFormData, setOrderFormData] = useState<OrderFormData>({
        customer_name: '',
        customer_phone: '',
        city: '',
        address: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showAddedToast, setShowAddedToast] = useState(false);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`shop_cart_${account.shop_slug}`, JSON.stringify(cart));
        }
    }, [cart, account.shop_slug]);

    // Open cart if URL has ?cart=open parameter
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('cart') === 'open') {
                setShowCart(true);
                // Clean up the URL
                window.history.replaceState({}, '', route('shop.home', account.shop_slug));
            }
        }
    }, []);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev[product.id];
            if (existing) {
                return {
                    ...prev,
                    [product.id]: {
                        ...existing,
                        quantity: existing.quantity + 1
                    }
                };
            } else {
                return {
                    ...prev,
                    [product.id]: {
                        product,
                        quantity: 1
                    }
                };
            }
        });

        // Show toast notification
        setShowAddedToast(true);
        setTimeout(() => setShowAddedToast(false), 2000);
    };

    const updateCartQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            const newCart = { ...cart };
            delete newCart[productId];
            setCart(newCart);
        } else {
            setCart(prev => ({
                ...prev,
                [productId]: {
                    ...prev[productId],
                    quantity
                }
            }));
        }
    };

    const removeFromCart = (productId: number) => {
        const newCart = { ...cart };
        delete newCart[productId];
        setCart(newCart);
    };

    const openOrderModal = (product: Product) => {
        setSelectedProduct(product);
        setOrderQuantity(1);
        setShowOrderModal(true);
    };

    const handleQuickOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        setSubmitting(true);
        router.post(route('shop.order', account.shop_slug), {
            customer_name: orderFormData.customer_name,
            customer_phone: orderFormData.customer_phone,
            items: [{
                product_id: selectedProduct.id,
                variant_id: null,
                quantity: orderQuantity,
                sale_price: selectedProduct.sale_price
            }],
            city: orderFormData.city,
            address: orderFormData.address,
            notes: orderFormData.notes
        }, {
            onSuccess: () => {
                alert('Sifarişiniz qəbul edildi! Tezliklə sizinlə əlaqə saxlanılacaq.');
                setShowOrderModal(false);
                setOrderFormData({ customer_name: '', customer_phone: '', city: '', address: '', notes: '' });
                setOrderQuantity(1);
                setSelectedProduct(null);
            },
            onError: (errors) => {
                alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
                console.error(errors);
            },
            onFinish: () => setSubmitting(false)
        });
    };

    const handleCartCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (cartItems.length === 0) return;

        setSubmitting(true);
        const items = cartItems.map(item => ({
            product_id: item.product.id,
            variant_id: null,
            quantity: item.quantity,
            sale_price: item.product.sale_price
        }));

        router.post(route('shop.order', account.shop_slug), {
            customer_name: orderFormData.customer_name,
            customer_phone: orderFormData.customer_phone,
            items: items,
            city: orderFormData.city,
            address: orderFormData.address,
            notes: orderFormData.notes
        }, {
            onSuccess: () => {
                alert('Sifarişiniz qəbul edildi! Tezliklə sizinlə əlaqə saxlanılacaq.');
                setShowCart(false);
                setShowCartCheckout(false);
                setCart({});
                setOrderFormData({ customer_name: '', customer_phone: '', city: '', address: '', notes: '' });
            },
            onError: (errors) => {
                alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
                console.error(errors);
            },
            onFinish: () => setSubmitting(false)
        });
    };

    const cartItems = Object.values(cart);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) =>
        sum + (Number(item.product.sale_price) * item.quantity), 0
    );

    // Filter and sort products
    const filteredProducts = products.data
        .filter(p => {
            if (selectedCategory && p.category?.id !== selectedCategory) return false;
            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'price-asc') return Number(a.sale_price) - Number(b.sale_price);
            if (sortBy === 'price-desc') return Number(b.sale_price) - Number(a.sale_price);
            return 0;
        });

    return (
        <>
            <Head title={account.company_name} />

            <div className="min-h-screen bg-white">
                {/* Clean Professional Header - Single Layer */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                                    {account.company_name}
                                </h1>
                            </div>

                            {/* Desktop Navigation */}
                            <nav className="hidden lg:flex items-center gap-8">
                                <button
                                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
                                >
                                    Kateqoriyalar
                                    <ChevronRightIcon className={`w-4 h-4 transition-transform ${showCategoryMenu ? 'rotate-90' : ''}`} />
                                </button>
                            </nav>

                            {/* Search Bar */}
                            <div className="flex-1 max-w-xl mx-8 hidden md:block">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Axtar..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Cart */}
                            <button
                                onClick={() => setShowCart(true)}
                                className="relative flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <ShoppingCartIcon className="w-6 h-6 text-gray-700" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setShowMobileMenu(true)}
                                className="lg:hidden text-gray-700"
                            >
                                <Bars3Icon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </header>


                {/* Main Content */}
                <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">
                    {/* Category Filter Pills */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    selectedCategory === null
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Hamısı
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedCategory === category.id
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toolbar: Results & Sort */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-sm text-gray-600">
                                {filteredProducts.length > 0 ? (
                                    <>{filteredProducts.length} məhsul</>
                                ) : (
                                    'Məhsul tapılmadı'
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Sırala:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm bg-white"
                            >
                                <option value="name">Ad (A-Z)</option>
                                <option value="price-asc">Qiymət: Aşağıdan</option>
                                <option value="price-desc">Qiymət: Yuxarıdan</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid - Clean Minimal Design */}
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="group block">
                                    <Link
                                        href={route('shop.product', { shop_slug: account.shop_slug, id: product.id })}
                                    >
                                        {/* Product Image */}
                                        <div className="aspect-square bg-gray-100 overflow-hidden mb-3 relative">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ShoppingCartIcon className="w-16 h-16" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <Link
                                        href={route('shop.product', { shop_slug: account.shop_slug, id: product.id })}
                                        className="space-y-1 block"
                                    >
                                        {/* Brand */}
                                        {product.brand && (
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                {product.brand}
                                            </p>
                                        )}

                                        {/* Product Name */}
                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                            {product.name}
                                        </h3>

                                        {/* Variant Info - Compact */}
                                        {((product.available_sizes?.length || 0) > 0 || (product.available_colors?.length || 0) > 0) && (
                                            <p className="text-xs text-gray-500">
                                                {product.available_sizes && product.available_sizes?.length > 0 && `${product.available_sizes.length} ölçü`}
                                                {product.available_sizes && product.available_sizes?.length > 0 && product.available_colors && product.available_colors?.length > 0 && ' • '}
                                                {product.available_colors && product.available_colors?.length > 0 && `${product.available_colors.length} rəng`}
                                            </p>
                                        )}

                                        {/* Price */}
                                        {product.price_range?.has_range ? (
                                            <p className="text-base font-semibold text-gray-900">
                                                ₼{Number(product.price_range.min).toFixed(2)} - ₼{Number(product.price_range.max).toFixed(2)}
                                            </p>
                                        ) : (
                                            <p className="text-base font-semibold text-gray-900">
                                                ₼{Number(product.sale_price).toFixed(2)}
                                            </p>
                                        )}
                                    </Link>

                                    {/* Action Buttons */}
                                    <div className="mt-3 flex gap-2">
                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // If product has variants, redirect to product page for selection
                                                if ((product.available_sizes?.length || 0) > 0 || (product.available_colors?.length || 0) > 0) {
                                                    router.visit(route('shop.product', { shop_slug: account.shop_slug, id: product.id }));
                                                } else {
                                                    addToCart(product);
                                                }
                                            }}
                                            className="flex-1 border-2 border-gray-900 text-gray-900 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-1"
                                        >
                                            <ShoppingCartIcon className="w-4 h-4" />
                                            <span className="hidden sm:inline">Səbətə</span>
                                        </button>

                                        {/* Buy Now Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // If product has variants, redirect to product page for selection
                                                if ((product.available_sizes?.length || 0) > 0 || (product.available_colors?.length || 0) > 0) {
                                                    router.visit(route('shop.product', { shop_slug: account.shop_slug, id: product.id }));
                                                } else {
                                                    // Otherwise open quick order modal
                                                    openOrderModal(product);
                                                }
                                            }}
                                            className="flex-1 bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
                                        >
                                            {((product.available_sizes?.length || 0) > 0 || (product.available_colors?.length || 0) > 0) ? 'Seçim et' : 'Al'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32">
                            <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-1">Məhsul tapılmadı</p>
                            <p className="text-sm text-gray-500">Axtarış və ya filtr parametrlərini dəyişdirin</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="mt-12 flex justify-center gap-1">
                            {Array.from({ length: products.last_page }, (_, i) => i + 1).map(page => (
                                <Link
                                    key={page}
                                    href={`?page=${page}`}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        page === products.current_page
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>
                    )}
                </main>

                {/* Category Menu Modal */}
                {showCategoryMenu && categories.length > 0 && (
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCategoryMenu(false)}>
                        <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Menu Header */}
                            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200">
                                <h2 className="text-base font-semibold text-gray-900">
                                    Kateqoriyalar
                                </h2>
                                <button
                                    onClick={() => setShowCategoryMenu(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Category List */}
                            <nav className="py-2">
                                {/* All Products */}
                                <button
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        setShowCategoryMenu(false);
                                    }}
                                    className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
                                        selectedCategory === null
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Bütün məhsullar
                                </button>

                                {/* Categories */}
                                {categories.map(category => {
                                    const hasChildren = category.children && category.children.length > 0;
                                    const isActive = selectedCategory === category.id;

                                    return (
                                        <div key={category.id}>
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(category.id);
                                                    if (!hasChildren) setShowCategoryMenu(false);
                                                }}
                                                className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors flex items-center justify-between ${
                                                    isActive
                                                        ? 'bg-gray-100 text-gray-900'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span>{category.name}</span>
                                                {hasChildren && (
                                                    <ChevronRightIcon className={`w-4 h-4 ${isActive ? 'rotate-90' : ''} transition-transform`} />
                                                )}
                                            </button>

                                            {/* Subcategories */}
                                            {hasChildren && isActive && (
                                                <div className="bg-gray-50">
                                                    {category.children!.map(child => (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => {
                                                                setSelectedCategory(child.id);
                                                                setShowCategoryMenu(false);
                                                            }}
                                                            className="w-full text-left px-12 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
                                                        >
                                                            {child.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer className="bg-gray-50 border-t border-gray-200 mt-24">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-16">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                            {/* Company Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {account.company_name}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Keyfiyyətli məhsullar və xidmətlər. Online mağazamızdan istədiyiniz məhsulu sifariş edə bilərsiniz.
                                </p>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Kateqoriyalar</h3>
                                <ul className="space-y-2">
                                    {categories.slice(0, 5).map(category => (
                                        <li key={category.id}>
                                            <button
                                                onClick={() => setSelectedCategory(category.id)}
                                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                                {category.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Əlaqə</h3>
                                <ul className="space-y-3">
                                    {account.phone && (
                                        <li className="flex items-start gap-2">
                                            <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <a href={`tel:${account.phone}`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                                {account.phone}
                                            </a>
                                        </li>
                                    )}
                                    {account.email && (
                                        <li className="flex items-start gap-2">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <a href={`mailto:${account.email}`} className="text-sm text-gray-600 hover:text-gray-900 break-all transition-colors">
                                                {account.email}
                                            </a>
                                        </li>
                                    )}
                                    {account.address && (
                                        <li className="flex items-start gap-2">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-gray-600">
                                                {account.address}
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="border-t border-gray-200 pt-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-sm text-gray-600">
                                    &copy; {new Date().getFullYear()} {account.company_name}. Bütün hüquqlar qorunur.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Powered by{' '}
                                    <a href="https://xpos.az" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">
                                        XPOS
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Shopping Cart Modal */}
                {showCart && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                            {/* Cart Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {showCartCheckout ? 'Sifariş məlumatları' : `Səbət (${cartCount})`}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCart(false);
                                        setShowCartCheckout(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Cart Content */}
                            <div className="flex-1 overflow-y-auto">
                                {!showCartCheckout ? (
                                    <div className="p-6">
                                        {cartItems.length > 0 ? (
                                            <div className="space-y-4">
                                                {cartItems.map(item => (
                                                    <div key={item.product.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                                                        <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                                                            {item.product.image_url ? (
                                                                <img
                                                                    src={item.product.image_url}
                                                                    alt={item.product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ShoppingCartIcon className="w-8 h-8 text-gray-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-gray-900 mb-1">{item.product.name}</h3>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                ₼{Number(item.product.sale_price).toFixed(2)}
                                                            </p>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                                                    className="w-8 h-8 border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-colors"
                                                                >
                                                                    <MinusIcon className="w-4 h-4" />
                                                                </button>
                                                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                                                    className="w-8 h-8 border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-colors"
                                                                >
                                                                    <PlusIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end justify-between">
                                                            <button
                                                                onClick={() => removeFromCart(item.product.id)}
                                                                className="text-gray-400 hover:text-gray-900"
                                                            >
                                                                <XMarkIcon className="w-5 h-5" />
                                                            </button>
                                                            <p className="font-semibold text-gray-900">
                                                                ₼{(Number(item.product.sale_price) * item.quantity).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16">
                                                <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-600">Səbətiniz boşdur</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleCartCheckout} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ad Soyad *
                                            </label>
                                            <input
                                                type="text"
                                                value={orderFormData.customer_name}
                                                onChange={(e) => setOrderFormData({ ...orderFormData, customer_name: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                placeholder="Adınızı daxil edin"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Telefon nömrəsi *
                                            </label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-300 text-gray-700 font-medium">
                                                    +994
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={orderFormData.customer_phone}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setOrderFormData({ ...orderFormData, customer_phone: value });
                                                    }}
                                                    required
                                                    maxLength={9}
                                                    className="flex-1 px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                    placeholder="501234567"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Nümunə: 501234567 və ya 551234567</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Şəhər *
                                            </label>
                                            <input
                                                type="text"
                                                value={orderFormData.city}
                                                onChange={(e) => setOrderFormData({ ...orderFormData, city: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                placeholder="Məsələn: Bakı, Gəncə, Sumqayıt..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ünvan (istəyə bağlı)
                                            </label>
                                            <textarea
                                                value={orderFormData.address}
                                                onChange={(e) => setOrderFormData({ ...orderFormData, address: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                                placeholder="Dəqiq ünvan (küçə, bina, mənzil...)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Əlavə qeydlər (istəyə bağlı)
                                            </label>
                                            <textarea
                                                value={orderFormData.notes}
                                                onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                                placeholder="Əlavə məlumat..."
                                            />
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Cart Footer */}
                            {cartItems.length > 0 && (
                                <div className="border-t border-gray-200 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-medium text-gray-700">Cəmi</span>
                                        <span className="text-2xl font-semibold text-gray-900">
                                            ₼{cartTotal.toFixed(2)}
                                        </span>
                                    </div>
                                    {!showCartCheckout ? (
                                        <button
                                            onClick={() => setShowCartCheckout(true)}
                                            className="w-full bg-gray-900 text-white py-3.5 hover:bg-gray-800 font-medium transition-colors"
                                        >
                                            Sifarişi tamamla
                                        </button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowCartCheckout(false)}
                                                className="flex-1 border border-gray-300 text-gray-700 py-3 hover:bg-gray-50 font-medium transition-colors"
                                            >
                                                Geri
                                            </button>
                                            <button
                                                onClick={handleCartCheckout}
                                                disabled={submitting}
                                                className="flex-1 bg-gray-900 text-white py-3 hover:bg-gray-800 font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                        Göndərilir...
                                                    </>
                                                ) : (
                                                    'Sifarişi təsdiq et'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Order Modal */}
                {showOrderModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Sürətli Sifariş
                                </h2>
                                <button
                                    onClick={() => setShowOrderModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Product Preview */}
                                <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                                    <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                                        {selectedProduct.image_url ? (
                                            <img
                                                src={selectedProduct.image_url}
                                                alt={selectedProduct.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingCartIcon className="w-10 h-10 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        {selectedProduct.brand && (
                                            <p className="text-xs text-gray-500 uppercase mb-1">{selectedProduct.brand}</p>
                                        )}
                                        <h3 className="font-medium text-gray-900 mb-2">{selectedProduct.name}</h3>
                                        <p className="text-xl font-semibold text-gray-900">
                                            ₼{Number(selectedProduct.sale_price).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Miqdar
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                                            className="w-10 h-10 border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-colors"
                                        >
                                            <MinusIcon className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="number"
                                            value={orderQuantity}
                                            onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 text-center border border-gray-300 py-2 font-medium focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        />
                                        <button
                                            onClick={() => setOrderQuantity(orderQuantity + 1)}
                                            className="w-10 h-10 border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-colors"
                                        >
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                        <div className="ml-auto text-right">
                                            <p className="text-xs text-gray-500">Cəmi</p>
                                            <p className="text-xl font-semibold text-gray-900">
                                                ₼{(Number(selectedProduct.sale_price) * orderQuantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Form */}
                                <form onSubmit={handleQuickOrder} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ad Soyad *
                                        </label>
                                        <input
                                            type="text"
                                            value={orderFormData.customer_name}
                                            onChange={(e) => setOrderFormData({ ...orderFormData, customer_name: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                            placeholder="Adınızı daxil edin"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Telefon nömrəsi *
                                        </label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-300 text-gray-700 font-medium">
                                                +994
                                            </span>
                                            <input
                                                type="tel"
                                                value={orderFormData.customer_phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    setOrderFormData({ ...orderFormData, customer_phone: value });
                                                }}
                                                required
                                                maxLength={9}
                                                className="flex-1 px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                placeholder="501234567"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">Nümunə: 501234567 və ya 551234567</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Şəhər *
                                        </label>
                                        <input
                                            type="text"
                                            value={orderFormData.city}
                                            onChange={(e) => setOrderFormData({ ...orderFormData, city: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                            placeholder="Məsələn: Bakı, Gəncə, Sumqayıt..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ünvan (istəyə bağlı)
                                        </label>
                                        <textarea
                                            value={orderFormData.address}
                                            onChange={(e) => setOrderFormData({ ...orderFormData, address: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                            placeholder="Dəqiq ünvan (küçə, bina, mənzil...)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Əlavə qeydlər (istəyə bağlı)
                                        </label>
                                        <textarea
                                            value={orderFormData.notes}
                                            onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                            placeholder="Əlavə məlumat..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowOrderModal(false)}
                                            className="flex-1 border border-gray-300 text-gray-700 py-3 hover:bg-gray-50 font-medium transition-colors"
                                        >
                                            Ləğv et
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 bg-gray-900 text-white py-3 hover:bg-gray-800 font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    Göndərilir...
                                                </>
                                            ) : (
                                                <>
                                                    Sifarişi təsdiq et
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notification - Added to Cart */}
                {showAddedToast && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                        <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                            <span className="font-medium">Səbətə əlavə edildi</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
