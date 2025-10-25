import { Head, Link } from '@inertiajs/react';
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
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

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

export default function Home({ account, products, categories }: Props) {
    const [cart, setCart] = useState<{ [key: number]: CartItem }>({});
    const [showCart, setShowCart] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

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

            <div className="min-h-screen bg-gray-50">
                {/* Trendyol-Style Header */}
                <header className="bg-white shadow-sm sticky top-0 z-50">
                    {/* Top Bar */}
                    <div className="bg-orange-500">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
                            <div className="flex justify-between items-center text-white text-xs">
                                <div className="flex items-center gap-4">
                                    {account.phone && (
                                        <a href={`tel:${account.phone}`} className="hover:underline">
                                            {account.phone}
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {account.email && (
                                        <a href={`mailto:${account.email}`} className="hidden md:inline hover:underline">
                                            {account.email}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Navigation */}
                    <div className="border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-6 py-3">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                    <h1 className="text-xl md:text-2xl font-bold text-orange-500">
                                        {account.company_name}
                                    </h1>
                                </div>

                                {/* Search Bar */}
                                <div className="flex-1 max-w-3xl">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Axtardığınız məhsulu yazın"
                                            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                        />
                                        <button className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                                        </button>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-10 top-1/2 -translate-y-1/2"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-gray-400" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Cart Button */}
                                <button
                                    onClick={() => setShowCart(true)}
                                    className="relative flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <ShoppingCartIcon className="w-6 h-6 text-gray-700" />
                                    <span className="hidden md:inline text-sm font-medium text-gray-700">Səbət</span>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Category Navigation Bar */}
                    <div className="bg-gray-50 border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-2 py-2 overflow-x-auto">
                                {/* All Categories Button */}
                                <button
                                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex-shrink-0 text-sm font-medium"
                                >
                                    <Bars3Icon className="w-4 h-4" />
                                    <span>Bütün Kateqoriyalar</span>
                                </button>

                                {/* Quick Category Links */}
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                                        selectedCategory === null
                                            ? 'bg-white text-orange-500 shadow-sm'
                                            : 'text-gray-700 hover:bg-white hover:text-orange-500'
                                    }`}
                                >
                                    Hamısı
                                </button>
                                {categories.slice(0, 6).map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                                            selectedCategory === category.id
                                                ? 'bg-white text-orange-500 shadow-sm'
                                                : 'text-gray-700 hover:bg-white hover:text-orange-500'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>


                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Category Sidebar - Desktop (Hidden, using top nav instead) */}

                        {/* Products Section */}
                        <div className="flex-1 w-full lg:min-w-0">

                    {/* Toolbar: Results count & Sort */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {filteredProducts.length > 0 ? (
                                <>
                                    <span className="text-indigo-600">{filteredProducts.length}</span>
                                    {' '}məhsul tapıldı
                                </>
                            ) : (
                                'Məhsul tapılmadı'
                            )}
                        </h2>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Sırala:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            >
                                <option value="name">Ad (A-Z)</option>
                                <option value="price-asc">Qiymət (Aşağıdan yuxarı)</option>
                                <option value="price-desc">Qiymət (Yuxarıdan aşağı)</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid - Trendyol Style */}
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                            {filteredProducts.map(product => (
                                <Link
                                    key={product.id}
                                    href={route('shop.product', { shop_slug: account.shop_slug, id: product.id })}
                                    className="bg-white rounded-lg hover:shadow-lg transition-shadow duration-200 overflow-hidden group flex flex-col"
                                >
                                    {/* Product Image */}
                                    <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <ShoppingCartIcon className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-2 flex flex-col flex-1">
                                        {/* Brand/Category */}
                                        {product.brand && (
                                            <p className="text-xs font-semibold text-gray-900 mb-1 uppercase">
                                                {product.brand}
                                            </p>
                                        )}

                                        {/* Product Name */}
                                        <h3 className="text-xs text-gray-600 mb-2 line-clamp-2 leading-tight">
                                            {product.name}
                                        </h3>

                                        {/* Variant Info */}
                                        {((product.available_sizes?.length || 0) > 0 || (product.available_colors?.length || 0) > 0) && (
                                            <p className="text-xs text-gray-400 mb-2">
                                                {product.available_sizes && product.available_sizes?.length > 0
                                                    ? `${product.available_sizes.length} Ölçü`
                                                    : product.available_colors && product.available_colors?.length > 0
                                                    ? `${product.available_colors.length} Rəng`
                                                    : ''}
                                            </p>
                                        )}

                                        {/* Price Section */}
                                        <div className="mt-auto">
                                            {product.price_range?.has_range ? (
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-base font-bold text-orange-500">
                                                        {Number(product.price_range.min).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">-</span>
                                                    <span className="text-base font-bold text-orange-500">
                                                        {Number(product.price_range.max).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-gray-600">₼</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-base font-bold text-orange-500">
                                                        {Number(product.sale_price).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-gray-600">₼</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl">
                            <ShoppingCartIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg text-gray-600 mb-2">Məhsul tapılmadı</p>
                            <p className="text-sm text-gray-500">Axtarış və ya filtr parametrlərini dəyişdirin</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="mt-8 flex justify-center gap-2">
                            {Array.from({ length: products.last_page }, (_, i) => i + 1).map(page => (
                                <Link
                                    key={page}
                                    href={`?page=${page}`}
                                    className={`px-4 py-2 rounded-lg transition-all ${
                                        page === products.current_page
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>
                    )}
                        </div>
                    </div>
                </main>

                {/* Category Menu Modal - Trendyol Style */}
                {showCategoryMenu && categories.length > 0 && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCategoryMenu(false)}>
                        <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Menu Header */}
                            <div className="bg-orange-500 px-4 py-4 flex items-center justify-between sticky top-0">
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <Bars3Icon className="w-5 h-5" />
                                    Bütün Kateqoriyalar
                                </h2>
                                <button
                                    onClick={() => setShowCategoryMenu(false)}
                                    className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
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
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                        selectedCategory === null
                                            ? 'bg-orange-50 text-orange-500 font-medium'
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
                                                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                                                    isActive
                                                        ? 'bg-orange-50 text-orange-500 font-medium'
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
                                                            className="w-full text-left px-8 py-2.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-white transition-colors"
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
                <footer className="bg-white border-t border-gray-200 mt-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            {/* Company Info */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {account.company_name}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Keyfiyyətli məhsullar və xidmətlər. Online mağazamızdan istədiyiniz məhsulu sifariş edə bilərsiniz.
                                </p>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Sürətli keçidlər</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <Link href={route('shop.home', account.shop_slug)} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                                            Ana səhifə
                                        </Link>
                                    </li>
                                    {categories.slice(0, 4).map(category => (
                                        <li key={category.id}>
                                            <button
                                                onClick={() => setSelectedCategory(category.id)}
                                                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
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
                                            <PhoneIcon className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                            <a href={`tel:${account.phone}`} className="text-sm text-gray-600 hover:text-indigo-600">
                                                {account.phone}
                                            </a>
                                        </li>
                                    )}
                                    {account.email && (
                                        <li className="flex items-start gap-2">
                                            <EnvelopeIcon className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                            <a href={`mailto:${account.email}`} className="text-sm text-gray-600 hover:text-indigo-600 break-all">
                                                {account.email}
                                            </a>
                                        </li>
                                    )}
                                    {account.address && (
                                        <li className="flex items-start gap-2">
                                            <MapPinIcon className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
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
                            <div className="text-center">
                                <p className="text-gray-600">&copy; {new Date().getFullYear()} {account.company_name}. Bütün hüquqlar qorunur.</p>
                                <p className="mt-2 text-sm text-gray-500">
                                    <a href="https://xpos.az" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                                        XPOS
                                    </a>
                                    {' '}ilə hazırlanıb
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Shopping Cart Modal */}
                {showCart && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                            {/* Cart Header */}
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <ShoppingCartIcon className="w-6 h-6 text-indigo-600" />
                                    Səbətim
                                </h2>
                                <button
                                    onClick={() => setShowCart(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {cartItems.length > 0 ? (
                                    <div className="space-y-4">
                                        {cartItems.map(item => (
                                            <div key={item.product.id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                                                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.product.image_url ? (
                                                        <img
                                                            src={item.product.image_url}
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {Number(item.product.sale_price).toFixed(2)} ₼
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                                        >
                                                            <MinusIcon className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                                        >
                                                            <PlusIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end justify-between">
                                                    <button
                                                        onClick={() => removeFromCart(item.product.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <XMarkIcon className="w-5 h-5" />
                                                    </button>
                                                    <p className="font-bold text-gray-900">
                                                        {(Number(item.product.sale_price) * item.quantity).toFixed(2)} ₼
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">Səbətiniz boşdur</p>
                                    </div>
                                )}
                            </div>

                            {/* Cart Footer */}
                            {cartItems.length > 0 && (
                                <div className="border-t p-6 bg-gray-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-semibold text-gray-700">Cəmi:</span>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {cartTotal.toFixed(2)} ₼
                                        </span>
                                    </div>
                                    <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold text-lg transition-all hover:shadow-lg">
                                        Sifarişi tamamla
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
