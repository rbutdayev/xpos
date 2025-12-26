import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeftIcon, PhoneIcon, ShoppingCartIcon, SparklesIcon, CheckCircleIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useState, FormEvent, useEffect } from 'react';

interface Account {
    company_name: string;
    shop_slug: string;
    phone: string | null;
    email: string | null;
    address: string | null;
}

interface ProductImage {
    id: number;
    url: string;
    thumbnail: string | null;
    product_id: number;
    variant_id: number | null;
    variant_size?: string | null;
    variant_color?: string | null;
}

interface ProductVariant {
    id: number;
    size: string | null;
    color: string | null;
    color_code: string | null;
    sale_price: number | string; // Can be string from Laravel decimal cast
    stock_quantity: number;
    sku?: string;
    barcode?: string;
}

interface VariantProduct {
    id: number;
    product_id: number;
    size: string | null;
    color: string | null;
    color_code: string | null;
    sale_price: number | string;
    stock_quantity: number;
    sku?: string;
    barcode?: string;
}

interface ChildProduct {
    id: number;
    name: string;
    brand?: string | null;
    model?: string | null;
    attributes?: Record<string, string>;
    sale_price: number | string;
    total_stock: number;
    sku?: string;
    barcode?: string;
    orderedPhotos?: any[];
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    sale_price: number | string; // Can be string from Laravel decimal cast
    brand?: string | null;
    model?: string | null;
    attributes?: Record<string, string>;
    images: ProductImage[];
    category?: {
        name: string;
    };
    activeVariants?: ProductVariant[];
    variant_products?: VariantProduct[];  // Child products (separate Product records)
    activeChildProducts?: ChildProduct[];  // Full child product data
}

interface Props {
    account: Account;
    product: Product;
}

export default function ProductPage({ account, product }: Props) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        city: '',
        address: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Use variant_products (child products) or activeVariants (ProductVariants table)
    const variants = product.variant_products || product.activeVariants || [];
    const hasVariants = variants.length > 0;

    // Update selectedVariant when size and color are both selected
    useEffect(() => {
        if (selectedSize && selectedColor) {
            const matchingVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
            if (matchingVariant) {
                setSelectedVariant(matchingVariant.id);
            }
        } else if (selectedSize && !selectedColor) {
            // Only size selected - pick first available color for this size
            const sizeVariants = variants.filter(v => v.size === selectedSize && v.stock_quantity > 0);
            if (sizeVariants.length > 0) {
                setSelectedVariant(sizeVariants[0].id);
            }
        } else if (selectedColor && !selectedSize) {
            // Only color selected - pick first available size for this color
            const colorVariants = variants.filter(v => v.color === selectedColor && v.stock_quantity > 0);
            if (colorVariants.length > 0) {
                setSelectedVariant(colorVariants[0].id);
            }
        }
    }, [selectedSize, selectedColor, variants]);

    // Get the selected variant's full product data (for child products)
    const selectedVariantProduct = selectedVariant && product.variant_products
        ? product.activeChildProducts?.find(child => child.id === selectedVariant)
        : null;

    const currentPrice = selectedVariant
        ? variants.find(v => v.id === selectedVariant)?.sale_price || product.sale_price
        : product.sale_price;

    // Current display info (either selected variant or parent product)
    const displayProduct = selectedVariantProduct || product;

    // Filter images based on selected variant
    const displayImages = selectedVariant
        ? product.images.filter(img =>
            img.variant_id === null || // Parent product images (always show)
            img.variant_id === selectedVariant // Selected variant images
          )
        : product.images; // Show all images if no variant selected

    // Reset selected image when variant changes
    useEffect(() => {
        setSelectedImage(0);
    }, [selectedVariant]);

    const handleOrder = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // If variant_products exist, use product_id directly (child product)
        // If activeVariants exist, use variant_id (ProductVariant)
        const isChildProduct = !!product.variant_products;

        router.post(route('shop.order', account.shop_slug), {
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            items: [{
                product_id: isChildProduct && selectedVariant
                    ? selectedVariant  // Use child product ID
                    : product.id,       // Use parent product ID
                variant_id: !isChildProduct ? selectedVariant : null,  // Use variant ID only for ProductVariants
                quantity: quantity,
                sale_price: currentPrice
            }],
            city: formData.city,
            address: formData.address,
            notes: formData.notes
        }, {
            onSuccess: () => {
                alert('Sifarişiniz qəbul edildi! Tezliklə sizinlə əlaqə saxlanılacaq.');
                setShowOrderForm(false);
                setFormData({ customer_name: '', customer_phone: '', city: '', address: '', notes: '' });
                setQuantity(1);
            },
            onError: (errors) => {
                alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
                console.error(errors);
            },
            onFinish: () => setSubmitting(false)
        });
    };

    return (
        <>
            <Head title={`${product.name} - ${account.company_name}`} />

            <div className="min-h-screen bg-white">
                {/* Clean Professional Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Back Button + Logo */}
                            <Link
                                href={route('shop.home', account.shop_slug)}
                                className="flex items-center gap-3 hover:opacity-60 transition-opacity"
                            >
                                <ArrowLeftIcon className="w-5 h-5 text-gray-900" />
                                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                                    {account.company_name}
                                </h1>
                            </Link>

                            {/* Contact Button */}
                            {account.phone && (
                                <a
                                    href={`tel:${account.phone}`}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium text-gray-700"
                                >
                                    <PhoneIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">Əlaqə</span>
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* Breadcrumb */}
                <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 border-b border-gray-200">
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('shop.home', account.shop_slug)} className="hover:text-gray-900">
                            Ana səhifə
                        </Link>
                        <span>/</span>
                        {product.category && (
                            <>
                                <span>{product.category.name}</span>
                                <span>/</span>
                            </>
                        )}
                        <span className="text-gray-900 truncate">{product.name}</span>
                    </nav>
                </div>

                {/* Product Detail */}
                <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">
                    <div className="grid lg:grid-cols-2 gap-12">
                            {/* Product Images */}
                            <div className="space-y-4">
                                {displayImages && displayImages.length > 0 ? (
                                    <>
                                        <div className="aspect-square bg-gray-100 overflow-hidden">
                                            <img
                                                src={displayImages[selectedImage]?.url || displayImages[0]?.url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {displayImages.length > 1 && (
                                            <div className="grid grid-cols-4 gap-3">
                                                {displayImages.map((img, idx) => (
                                                    <button
                                                        key={img.id}
                                                        onClick={() => setSelectedImage(idx)}
                                                        className={`aspect-square overflow-hidden border transition-colors ${
                                                            selectedImage === idx
                                                                ? 'border-gray-900'
                                                                : 'border-gray-200 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        <img
                                                            src={img.thumbnail || img.url}
                                                            alt={`${product.name} ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                        <ShoppingCartIcon className="w-32 h-32 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex flex-col space-y-6">
                                {product.category && (
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                                            {product.category.name}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-3xl font-medium text-gray-900 mb-3">
                                        {product.name}
                                    </h1>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        ₼{Number(currentPrice).toFixed(2)}
                                    </p>
                                </div>

                                {product.description && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                {/* Product Details */}
                                {(displayProduct.brand || displayProduct.model || (displayProduct.attributes && Object.keys(displayProduct.attributes).length > 0)) && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Texniki Məlumatlar</h3>
                                        <div className="space-y-2">
                                            {displayProduct.brand && (
                                                <div className="flex">
                                                    <span className="text-sm text-gray-500 w-32">Marka</span>
                                                    <span className="text-sm text-gray-900">{displayProduct.brand}</span>
                                                </div>
                                            )}
                                            {displayProduct.model && (
                                                <div className="flex">
                                                    <span className="text-sm text-gray-500 w-32">Model</span>
                                                    <span className="text-sm text-gray-900">{displayProduct.model}</span>
                                                </div>
                                            )}
                                            {displayProduct.attributes && Object.entries(displayProduct.attributes)
                                                .filter(([key]) => !['size', 'color', 'color_code'].includes(key))
                                                .map(([key, value]) => {
                                                    const attributeLabels: Record<string, string> = {
                                                        'material': 'Material',
                                                        'season': 'Mövsüm',
                                                        'gender': 'Cins',
                                                        'style': 'Stil',
                                                        'collection': 'Kolleksiya',
                                                        'country_of_origin': 'İstehsal ölkəsi',
                                                        'care_instructions': 'Təmizlik təlimatları',
                                                        'additional_notes': 'Əlavə qeydlər',
                                                    };
                                                    const label = attributeLabels[key] || key.replace(/_/g, ' ');

                                                    return (
                                                        <div key={key} className="flex">
                                                            <span className="text-sm text-gray-500 w-32">{label}</span>
                                                            <span className="text-sm text-gray-900">{value}</span>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* Variants */}
                                {hasVariants && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <label className="block text-sm font-medium text-gray-900 mb-4">
                                            Seçimlər
                                        </label>

                                        {/* Group by Size then Color */}
                                        <div className="space-y-4">
                                            {/* Available Sizes */}
                                            {variants.some(v => v.size) && (
                                                <div>
                                                    <p className="text-xs text-gray-600 mb-2">Ölçü:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[...new Set(variants.filter(v => v.size).map(v => v.size))].map(size => {
                                                            const allSizeVariants = variants.filter(v => v.size === size);
                                                            const hasStockWithAnyColor = allSizeVariants.some(v => v.stock_quantity > 0);

                                                            const sizeVariants = selectedColor
                                                                ? variants.filter(v => v.size === size && v.color === selectedColor)
                                                                : allSizeVariants;
                                                            const hasStock = sizeVariants.some(v => v.stock_quantity > 0);
                                                            const isSelected = selectedSize === size;

                                                            return (
                                                                <button
                                                                    key={size}
                                                                    onClick={() => {
                                                                        setSelectedSize(size);
                                                                        if (selectedColor && !hasStock) {
                                                                            setSelectedColor(null);
                                                                        }
                                                                    }}
                                                                    disabled={!hasStockWithAnyColor}
                                                                    className={`min-w-[50px] px-3 py-2 border text-sm transition-colors ${
                                                                        isSelected
                                                                            ? 'border-gray-900 bg-gray-900 text-white'
                                                                            : hasStockWithAnyColor
                                                                            ? 'border-gray-300 hover:border-gray-900 bg-white'
                                                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                                                                    }`}
                                                                >
                                                                    {size}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Available Colors */}
                                            {variants.some(v => v.color) && (
                                                <div>
                                                    <p className="text-xs text-gray-600 mb-2">Rəng:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[...new Map(variants.filter(v => v.color).map(v => [v.color, v])).values()].map(variant => {
                                                            const allColorVariants = variants.filter(v => v.color === variant.color);
                                                            const totalStockWithAnySize = allColorVariants.reduce((sum, v) => sum + Number(v.stock_quantity), 0);
                                                            const hasStockWithAnySize = totalStockWithAnySize > 0;

                                                            const colorVariants = selectedSize
                                                                ? variants.filter(v => v.color === variant.color && v.size === selectedSize)
                                                                : allColorVariants;
                                                            const totalStock = colorVariants.reduce((sum, v) => sum + Number(v.stock_quantity), 0);
                                                            const hasStock = totalStock > 0;
                                                            const isSelected = selectedColor === variant.color;

                                                            return (
                                                                <button
                                                                    key={variant.color}
                                                                    onClick={() => {
                                                                        setSelectedColor(variant.color);
                                                                        if (selectedSize && !hasStock) {
                                                                            setSelectedSize(null);
                                                                        }
                                                                    }}
                                                                    disabled={selectedSize ? !hasStock : !hasStockWithAnySize}
                                                                    className={`flex items-center gap-2 px-3 py-2 border text-sm transition-colors ${
                                                                        isSelected
                                                                            ? 'border-gray-900 bg-gray-50'
                                                                            : (selectedSize ? hasStock : hasStockWithAnySize)
                                                                            ? 'border-gray-300 hover:border-gray-900 bg-white'
                                                                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    {variant.color_code && (
                                                                        <div
                                                                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                                                            style={{ backgroundColor: variant.color_code }}
                                                                        />
                                                                    )}
                                                                    <span className={`${(selectedSize ? !hasStock : !hasStockWithAnySize) ? 'line-through text-gray-400' : ''}`}>
                                                                        {variant.color}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* All Variants List (if no size/color grouping) */}
                                            {!variants.some(v => v.size || v.color) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {variants.map(variant => (
                                                        <button
                                                            key={variant.id}
                                                            onClick={() => setSelectedVariant(variant.id)}
                                                            className={`px-4 py-3 rounded-xl border-2 transition-all ${
                                                                selectedVariant === variant.id
                                                                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md scale-105'
                                                                    : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                                                            }`}
                                                        >
                                                            <div className="text-sm font-medium">Variant #{variant.id}</div>
                                                            <div className="text-xs mt-1 font-semibold">
                                                                {Number(variant.sale_price).toFixed(2)} ₼
                                                            </div>
                                                            {variant.stock_quantity > 0 ? (
                                                                <div className="text-xs text-green-600 mt-1">
                                                                    Stokda var ({variant.stock_quantity})
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-red-500 mt-1">Stokda yoxdur</div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Selected variant info */}
                                            {selectedVariant && (
                                                <div className="mt-2 p-2.5 bg-orange-50 rounded-md border border-orange-200">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-orange-900 font-medium text-xs">Seçilmiş:</span>
                                                        <span className="text-orange-700 font-medium">
                                                            {variants.find(v => v.id === selectedVariant)?.size || ''}
                                                            {variants.find(v => v.id === selectedVariant)?.size &&
                                                             variants.find(v => v.id === selectedVariant)?.color && ' • '}
                                                            {variants.find(v => v.id === selectedVariant)?.color || ''}
                                                        </span>
                                                    </div>
                                                    {(() => {
                                                        const variant = variants.find(v => v.id === selectedVariant);
                                                        return variant && variant.stock_quantity > 0 ? (
                                                            <div className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                                                <CheckCircleIcon className="w-3 h-3" />
                                                                Stokda mövcuddur ({variant.stock_quantity} ədəd)
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-red-600 mt-1">
                                                                ⚠ Stokda yoxdur
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity */}
                                <div className="border-t border-gray-200 pt-6">
                                    <label className="block text-sm font-medium text-gray-900 mb-3">
                                        Miqdar
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-colors"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 text-center border border-gray-300 py-2 font-medium focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 border border-gray-300 hover:border-gray-900 flex items-center justify-center transition-colors"
                                        >
                                            +
                                        </button>
                                        <div className="ml-auto">
                                            <p className="text-xs text-gray-500">Cəmi</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                ₼{(Number(currentPrice) * quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Buttons */}
                                {!showOrderForm ? (
                                    <div className="mt-8 space-y-3">
                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={() => {
                                                // Add to cart in localStorage
                                                const cartKey = `shop_cart_${account.shop_slug}`;
                                                const savedCart = localStorage.getItem(cartKey);
                                                const cart = savedCart ? JSON.parse(savedCart) : {};

                                                const productToAdd = {
                                                    id: selectedVariantProduct?.id || product.id,
                                                    name: selectedVariantProduct?.name || product.name,
                                                    sale_price: currentPrice,
                                                    image_url: displayImages[0]?.url || null,
                                                    brand: displayProduct.brand,
                                                    variant_info: selectedVariant ? {
                                                        variant_id: selectedVariant,
                                                        size: variants.find(v => v.id === selectedVariant)?.size || null,
                                                        color: variants.find(v => v.id === selectedVariant)?.color || null,
                                                    } : null
                                                };

                                                const productKey = selectedVariantProduct?.id || product.id;

                                                if (cart[productKey]) {
                                                    cart[productKey].quantity += quantity;
                                                } else {
                                                    cart[productKey] = {
                                                        product: productToAdd,
                                                        quantity: quantity
                                                    };
                                                }

                                                localStorage.setItem(cartKey, JSON.stringify(cart));

                                                // Redirect to home page with cart open
                                                router.visit(route('shop.home', account.shop_slug) + '?cart=open');
                                            }}
                                            className="w-full border-2 border-gray-900 text-gray-900 py-4 hover:bg-gray-900 hover:text-white font-medium text-base transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCartIcon className="w-5 h-5" />
                                            Səbətə at
                                        </button>

                                        {/* Buy Now Button */}
                                        <button
                                            onClick={() => setShowOrderForm(true)}
                                            className="w-full bg-gray-900 text-white py-4 hover:bg-gray-800 font-medium text-base transition-colors flex items-center justify-center gap-2"
                                        >
                                            İndi al
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleOrder} className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                                        <h3 className="text-base font-medium text-gray-900 mb-4">Sifariş məlumatları</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ad Soyad *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.customer_name}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                placeholder="Adınızı daxil edin"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Telefon *
                                            </label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-300 text-gray-700 font-medium">
                                                    +994
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={formData.customer_phone}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setFormData({ ...formData, customer_phone: value });
                                                    }}
                                                    required
                                                    maxLength={9}
                                                    className="flex-1 px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                    placeholder="501234567"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Şəhər *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                placeholder="Bakı, Gəncə, Sumqayıt..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ünvan (istəyə bağlı)
                                            </label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                                placeholder="Ünvan..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Qeyd (istəyə bağlı)
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                                placeholder="Əlavə məlumat..."
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowOrderForm(false)}
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
                                                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                        Göndərilir...
                                                    </>
                                                ) : (
                                                    'Təsdiq et'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                </main>

                {/* Footer */}
                <footer className="bg-gray-50 border-t border-gray-200 mt-24">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                &copy; {new Date().getFullYear()} {account.company_name}. Bütün hüquqlar qorunur.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                Powered by{' '}
                                <a href="https://xpos.az" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">
                                    XPOS
                                </a>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
