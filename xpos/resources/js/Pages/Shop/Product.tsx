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
                                {/* Back Button + Logo */}
                                <Link
                                    href={route('shop.home', account.shop_slug)}
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                        <ArrowLeftIcon className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <h1 className="text-xl md:text-2xl font-bold text-orange-500">
                                        {account.company_name}
                                    </h1>
                                </Link>

                                {/* Spacer */}
                                <div className="flex-1"></div>

                                {/* Contact Button */}
                                {account.phone && (
                                    <a
                                        href={`tel:${account.phone}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <PhoneIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Əlaqə</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Breadcrumb */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('shop.home', account.shop_slug)} className="hover:text-orange-500">
                            Ana səhifə
                        </Link>
                        <span>/</span>
                        {product.category && (
                            <>
                                <span className="text-gray-500">{product.category.name}</span>
                                <span>/</span>
                            </>
                        )}
                        <span className="text-gray-900 font-medium truncate">{product.name}</span>
                    </nav>
                </div>

                {/* Product Detail */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
                            {/* Product Images */}
                            <div>
                                {displayImages && displayImages.length > 0 ? (
                                    <>
                                        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden mb-4 shadow-md">
                                            <img
                                                src={displayImages[selectedImage]?.url || displayImages[0]?.url}
                                                alt={product.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        {displayImages.length > 1 && (
                                            <div className="grid grid-cols-4 gap-3">
                                                {displayImages.map((img, idx) => (
                                                    <button
                                                        key={img.id}
                                                        onClick={() => setSelectedImage(idx)}
                                                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                            selectedImage === idx
                                                                ? 'border-orange-500 shadow-md scale-105'
                                                                : 'border-gray-200 hover:border-orange-300'
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
                                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                        <ShoppingCartIcon className="w-32 h-32 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex flex-col">
                                {product.category && (
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                                            {product.category.name}
                                        </span>
                                    </div>
                                )}
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    {product.name}
                                </h2>

                                {/* Mock Rating */}
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600">(0 rəy)</span>
                                </div>

                                {/* Product Details */}
                                {(displayProduct.brand || displayProduct.model || (displayProduct.attributes && Object.keys(displayProduct.attributes).length > 0)) && (
                                    <div className="mb-6 border-t border-gray-200 pt-6">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Texniki Məlumatlar</h3>
                                        <div className="space-y-2">
                                            {displayProduct.brand && (
                                                <div className="flex items-start">
                                                    <span className="text-sm text-gray-500 w-48 flex-shrink-0">Marka:</span>
                                                    <span className="text-sm text-gray-900 font-medium">{displayProduct.brand}</span>
                                                </div>
                                            )}
                                            {displayProduct.model && (
                                                <div className="flex items-start">
                                                    <span className="text-sm text-gray-500 w-48 flex-shrink-0">Model:</span>
                                                    <span className="text-sm text-gray-900 font-medium">{displayProduct.model}</span>
                                                </div>
                                            )}
                                            {displayProduct.attributes && Object.entries(displayProduct.attributes)
                                                .filter(([key]) => !['size', 'color', 'color_code'].includes(key))
                                                .map(([key, value]) => {
                                                    // Translate attribute labels to Azerbaijani
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
                                                        <div key={key} className="flex items-start">
                                                            <span className="text-sm text-gray-500 w-48 flex-shrink-0">
                                                                {label}:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">{value}</span>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                )}

                                {product.description && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Məhsul haqqında</h3>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <p className="text-xs text-gray-600 mb-0.5">Qiymət</p>
                                    <p className="text-2xl font-bold text-orange-500">
                                        {Number(currentPrice).toFixed(2)}
                                        <span className="text-lg text-gray-600 ml-1">₼</span>
                                    </p>
                                </div>

                                {/* Trust Badges */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span>Keyfiyyət zəmanəti</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span>Sürətli çatdırılma</span>
                                    </div>
                                </div>

                                {/* Variants */}
                                {hasVariants && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                                            Seçimlər
                                        </label>

                                        {/* Group by Size then Color */}
                                        <div className="space-y-4">
                                            {/* Available Sizes */}
                                            {variants.some(v => v.size) && (
                                                <div>
                                                    <p className="text-xs text-gray-600 mb-2 font-medium">Ölçü seçin:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[...new Set(variants.filter(v => v.size).map(v => v.size))].map(size => {
                                                            // Check if this size has stock (with any color or the selected color)
                                                            const allSizeVariants = variants.filter(v => v.size === size);
                                                            const hasStockWithAnyColor = allSizeVariants.some(v => v.stock_quantity > 0);

                                                            // If color is selected, check if this size is available with that color
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
                                                                        // If selecting a new size and current color combo is not available, clear color
                                                                        if (selectedColor && !hasStock) {
                                                                            setSelectedColor(null);
                                                                        }
                                                                    }}
                                                                    disabled={!hasStockWithAnyColor}
                                                                    className={`min-w-[50px] px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                                                                        isSelected
                                                                            ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                                                                            : hasStockWithAnyColor
                                                                            ? 'border-gray-300 hover:border-orange-400 bg-white hover:bg-orange-50'
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
                                                    <p className="text-xs text-gray-600 mb-2 font-medium">Rəng seçin:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[...new Map(variants.filter(v => v.color).map(v => [v.color, v])).values()].map(variant => {
                                                            // Check if this color has stock (with any size or the selected size)
                                                            const allColorVariants = variants.filter(v => v.color === variant.color);
                                                            const totalStockWithAnySize = allColorVariants.reduce((sum, v) => sum + Number(v.stock_quantity), 0);
                                                            const hasStockWithAnySize = totalStockWithAnySize > 0;

                                                            // If size is selected, check if this color is available with that size
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
                                                                        // If selecting a new color and current size combo is not available, clear size
                                                                        if (selectedSize && !hasStock) {
                                                                            setSelectedSize(null);
                                                                        }
                                                                    }}
                                                                    disabled={selectedSize ? !hasStock : !hasStockWithAnySize}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all ${
                                                                        isSelected
                                                                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                                                                            : (selectedSize ? hasStock : hasStockWithAnySize)
                                                                            ? 'border-gray-300 hover:border-orange-400 bg-white hover:bg-orange-50'
                                                                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    {variant.color_code && (
                                                                        <div
                                                                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                                                            style={{ backgroundColor: variant.color_code }}
                                                                        />
                                                                    )}
                                                                    <span className={`font-medium ${(selectedSize ? !hasStock : !hasStockWithAnySize) ? 'line-through text-gray-400' : ''}`}>
                                                                        {variant.color}
                                                                    </span>
                                                                    {(selectedSize ? hasStock : hasStockWithAnySize) && (
                                                                        <span className="text-xs text-gray-500">
                                                                            ({selectedSize ? totalStock : totalStockWithAnySize})
                                                                        </span>
                                                                    )}
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
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                                        Miqdar
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-9 h-9 rounded-lg border border-gray-300 hover:border-orange-500 hover:bg-orange-50 font-bold text-lg transition-all"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 text-center border border-gray-300 rounded-lg py-2 font-semibold focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-9 h-9 rounded-lg border border-gray-300 hover:border-orange-500 hover:bg-orange-50 font-bold text-lg transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="mb-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-700">Cəmi məbləğ:</span>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {(Number(currentPrice) * quantity).toFixed(2)} ₼
                                        </span>
                                    </div>
                                </div>

                                {/* Order Button */}
                                {!showOrderForm ? (
                                    <button
                                        onClick={() => setShowOrderForm(true)}
                                        className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 font-bold text-lg transition-all hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCartIcon className="w-6 h-6" />
                                        Sifariş ver
                                    </button>
                                ) : (
                                    <form onSubmit={handleOrder} className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-4">Sifariş məlumatları</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Adınız *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.customer_name}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Adınızı daxil edin"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Telefon nömrəsi *
                                            </label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-700 font-medium">
                                                    +994
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={formData.customer_phone}
                                                    onChange={(e) => {
                                                        // Only allow digits
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setFormData({ ...formData, customer_phone: value });
                                                    }}
                                                    required
                                                    maxLength={9}
                                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Məsələn: Bakı, Gəncə, Sumqayıt..."
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                                placeholder="Dəqiq ünvan (küçə, bina, mənzil...)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Əlavə qeydlər (istəyə bağlı)
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                                placeholder="Əlavə məlumat..."
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowOrderForm(false)}
                                                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                                            >
                                                Ləğv et
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 font-semibold disabled:opacity-50 transition-all hover:shadow-lg flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                        Göndərilir...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                        Təsdiq et
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                </footer>
            </div>
        </>
    );
}
