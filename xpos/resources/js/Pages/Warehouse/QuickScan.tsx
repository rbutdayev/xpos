import { useState, useEffect, useRef, FormEvent } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Warehouse } from '@/types';
import axios from 'axios';
import {
    QrCodeIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

interface QuickScanProps {
    warehouse: Warehouse;
}

interface ScanData {
    product_id: number;
    product_name: string;
    barcode: string;
    sku?: string;
    count: number;
    db_quantity: number;
    difference: number;
    first_scanned_at: string;
    last_scanned_at: string;
}

interface Stats {
    total_scans: number;
    unique_products: number;
}

export default function QuickScan({ warehouse }: QuickScanProps) {
    const [barcode, setBarcode] = useState('');
    const [scans, setScans] = useState<ScanData[]>([]);
    const [stats, setStats] = useState<Stats>({ total_scans: 0, unique_products: 0 });
    const [loading, setLoading] = useState(false);
    const [lastScanProduct, setLastScanProduct] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const autoScanTimeout = useRef<NodeJS.Timeout | null>(null);

    // Auto-focus input on mount and after each scan
    useEffect(() => {
        inputRef.current?.focus();
    }, [scans]);

    // Load existing session data on mount
    useEffect(() => {
        loadSessionData();
    }, []);

    // Auto-scan: Detect when barcode is complete (scanner types very fast)
    useEffect(() => {
        // Clear previous timeout
        if (autoScanTimeout.current) {
            clearTimeout(autoScanTimeout.current);
        }

        // If barcode has minimum length (typically barcodes are 8+ characters)
        if (barcode.trim().length >= 8) {
            // Wait 100ms after last character - if no more input, auto-submit
            // Barcode scanners type all characters within ~50ms
            // So 100ms pause means scan is complete
            autoScanTimeout.current = setTimeout(() => {
                handleAutoScan();
            }, 100);
        }

        return () => {
            if (autoScanTimeout.current) {
                clearTimeout(autoScanTimeout.current);
            }
        };
    }, [barcode]);

    const loadSessionData = async () => {
        try {
            const response = await axios.get(route('warehouses.quick-scan-session', warehouse.id));
            setScans(response.data.scans);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error loading session:', error);
        }
    };

    const handleAutoScan = async () => {
        if (!barcode.trim() || loading) return;

        setLoading(true);
        setLastScanProduct(null);

        try {
            const response = await axios.post(
                route('warehouses.quick-scan', warehouse.id),
                { barcode: barcode.trim() }
            );

            if (response.data.success) {
                // Update state with new data
                setScans(response.data.scans);
                setStats(response.data.stats);
                setLastScanProduct(response.data.product.name);

                // Play success sound
                playBeep();

                // Clear input
                setBarcode('');
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Show error but don't alert - just display in UI
                setLastScanProduct(`❌ Tapılmadı: ${barcode}`);
                // Clear input after 2 seconds
                setTimeout(() => {
                    setBarcode('');
                    setLastScanProduct(null);
                }, 2000);
            } else {
                alert('Xəta baş verdi!');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (e: FormEvent) => {
        e.preventDefault();
        await handleAutoScan();
    };

    const playBeep = () => {
        // Simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };

    const handleClear = async () => {
        if (!confirm('Bütün scan məlumatlarını silmək istədiyinizdən əminsiniz?')) {
            return;
        }

        try {
            await axios.delete(route('warehouses.clear-quick-scan-session', warehouse.id));
            setScans([]);
            setStats({ total_scans: 0, unique_products: 0 });
            setLastScanProduct(null);
            setBarcode('');
        } catch (error) {
            alert('Xəta baş verdi!');
        }
    };

    const handleExport = () => {
        if (scans.length === 0) {
            alert('Export etmək üçün scan məlumatı yoxdur!');
            return;
        }

        // Create a form and submit to download Excel
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('warehouses.quick-scan-export', warehouse.id);

        // Add CSRF token
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        form.appendChild(csrfInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Sürətli Sayım - ${warehouse.name}`} />

            <div className="space-y-6">
                {/* Header with Back Button */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Link
                                href={route('warehouses.index')}
                                className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                                Geri
                            </Link>
                            <div className="flex items-center">
                                <BuildingStorefrontIcon className="w-8 h-8 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
                                    <p className="text-sm text-gray-600">Sürətli Sayım</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-600">Barcode scanner ilə məhsulları scan edin və sayını hesablayın</p>
                </div>

            {/* Last Scan Success/Error Message */}
            {lastScanProduct && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${
                    lastScanProduct.startsWith('❌')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                }`}>
                    <CheckCircleIcon className={`w-6 h-6 mr-3 ${
                        lastScanProduct.startsWith('❌') ? 'text-red-600' : 'text-green-600'
                    }`} />
                    <div>
                        <div className={`font-semibold ${
                            lastScanProduct.startsWith('❌') ? 'text-red-900' : 'text-green-900'
                        }`}>
                            {lastScanProduct.startsWith('❌') ? 'Məhsul tapılmadı' : 'Scan uğurlu!'}
                        </div>
                        <div className={`text-sm ${
                            lastScanProduct.startsWith('❌') ? 'text-red-700' : 'text-green-700'
                        }`}>
                            {lastScanProduct}
                        </div>
                    </div>
                </div>
            )}

            {/* Scan Input - Auto-submits on Enter (barcode scanner sends Enter automatically) */}
            <form onSubmit={handleScan} className="mb-8">
                <div className="relative">
                    <QrCodeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Barcode scanner ilə scan edin..."
                        className={`
                            w-full pl-16 pr-4 py-6 text-2xl font-mono border-4 rounded-xl
                            transition-all duration-200
                            ${loading
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-blue-500 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-200'
                            }
                        `}
                        autoFocus
                        disabled={loading}
                        autoComplete="off"
                    />
                    {loading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                    <p className="text-gray-600 flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Avtomatik rejim: Scan edin, sistem dərhal axtaracaq
                    </p>
                    {barcode && barcode.length < 8 && !loading && (
                        <span className="text-gray-500 text-xs">
                            {barcode.length}/8 simvol
                        </span>
                    )}
                </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                        {stats.total_scans}
                    </div>
                    <div className="text-gray-700 font-medium">Cəmi Scan</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="text-5xl font-bold text-green-600 mb-2">
                        {stats.unique_products}
                    </div>
                    <div className="text-gray-700 font-medium">Unikal Məhsul</div>
                </div>
            </div>

            {/* Scanned Items Table */}
            {scans.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-gray-900">Scan Edilmiş Məhsullar</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-600 transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                Excel Export
                            </button>
                            <button
                                onClick={handleClear}
                                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Təmizlə
                            </button>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-x-auto overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Məhsul
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Barcode
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Sayılmış
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Sistem Sayı
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Fərq
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Son Scan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {scans.slice().reverse().map((scan, index) => (
                                    <tr key={scan.barcode} className={index === 0 ? 'bg-green-50' : ''}>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{scan.product_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                            {scan.barcode}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {scan.sku || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-12 h-12 text-2xl font-bold text-blue-600 bg-blue-100 rounded-full">
                                                {scan.count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-12 h-12 text-2xl font-bold text-gray-600 bg-gray-100 rounded-full">
                                                {scan.db_quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-12 h-12 text-2xl font-bold rounded-full ${
                                                scan.difference > 0
                                                    ? 'text-green-700 bg-green-100'
                                                    : scan.difference < 0
                                                        ? 'text-red-700 bg-red-100'
                                                        : 'text-gray-600 bg-gray-100'
                                            }`}>
                                                {scan.difference > 0 ? '+' : ''}{scan.difference}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(scan.last_scanned_at).toLocaleString('az-AZ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {scans.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <QrCodeIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Hələ scan edilməyib</h3>
                    <p className="text-gray-600">Barcode scanner ilə məhsulları scan etməyə başlayın</p>
                </div>
            )}
            </div>
        </AuthenticatedLayout>
    );
}
