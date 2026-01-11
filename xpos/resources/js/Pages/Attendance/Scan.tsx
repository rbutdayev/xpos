import { useEffect, useState, useRef } from 'react';
import { useForm, usePage, router, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import {
    MapPinIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ClockIcon,
    ArrowRightStartOnRectangleIcon,
    QrCodeIcon,
} from '@heroicons/react/24/outline';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
    userBranch: {
        id: number;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
    } | null;
    todayCheckIn: {
        id: number;
        recorded_at: string;
        distance_from_branch: number;
    } | null;
    todayCheckOut: {
        id: number;
        recorded_at: string;
        distance_from_branch: number;
    } | null;
    allowedRadius: number;
    locale?: string;
}

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    acquiring: boolean;
}

export default function Scan({ userBranch, todayCheckIn, todayCheckOut, allowedRadius, locale }: Props) {
    const { t, i18n } = useTranslation('attendance');
    const user = usePage().props.auth.user;
    const { locale: backendLocale } = usePage().props as any;

    // Use backend-determined locale (user → account → company → system default)
    const effectiveLocale = locale || backendLocale || 'az';

    // Initialize i18n with backend locale on mount
    useEffect(() => {
        if (i18n.language !== effectiveLocale) {
            i18n.changeLanguage(effectiveLocale);
        }
    }, [effectiveLocale, i18n]);
    const [scanMode, setScanMode] = useState<'gps' | 'qr'>('gps');
    const [qrScannerActive, setQrScannerActive] = useState(false);
    const [qrError, setQrError] = useState<string | null>(null);
    const [scannedBranchId, setScannedBranchId] = useState<number | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Location permission modal state
    const [showLocationModal, setShowLocationModal] = useState(true);
    const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
    const [showSettingsInstructions, setShowSettingsInstructions] = useState(false);

    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        acquiring: false,
    });

    const checkInForm = useForm({
        latitude: null as number | null,
        longitude: null as number | null,
        accuracy: null as number | null,
        branch_id: null as number | null,
        method: 'gps' as 'gps' | 'qr',
    });

    const checkOutForm = useForm({
        latitude: null as number | null,
        longitude: null as number | null,
        accuracy: null as number | null,
        branch_id: null as number | null,
        method: 'gps' as 'gps' | 'qr',
    });

    // Calculate distance between two coordinates in meters
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const distanceFromBranch =
        location.latitude && location.longitude && userBranch
            ? calculateDistance(
                  location.latitude,
                  location.longitude,
                  userBranch.latitude,
                  userBranch.longitude
              )
            : null;

    const isWithinRadius = distanceFromBranch !== null && distanceFromBranch <= allowedRadius;

    // Request GPS location only after permission is granted
    useEffect(() => {
        if (!locationPermissionGranted) {
            return;
        }

        if (!navigator.geolocation) {
            setLocation({
                latitude: null,
                longitude: null,
                accuracy: null,
                error: t('gpsNotSupported'),
                acquiring: false,
            });
            return;
        }

        setLocation(prev => ({ ...prev, acquiring: true }));

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    error: null,
                    acquiring: false,
                });
            },
            (error) => {
                let errorMessage = t('gpsError');
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = t('gpsPermissionDenied');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = t('gpsUnavailable');
                        break;
                    case error.TIMEOUT:
                        errorMessage = t('gpsTimeout');
                        break;
                }
                setLocation({
                    latitude: null,
                    longitude: null,
                    accuracy: null,
                    error: errorMessage,
                    acquiring: false,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [locationPermissionGranted, t]);

    // Check permission status on mount
    useEffect(() => {
        const checkPermission = async () => {
            if ('permissions' in navigator) {
                try {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    setPermissionStatus(result.state);

                    // If already granted, auto-enable
                    if (result.state === 'granted') {
                        setLocationPermissionGranted(true);
                        setShowLocationModal(false);
                    }

                    // Listen for permission changes
                    result.addEventListener('change', () => {
                        setPermissionStatus(result.state);
                        if (result.state === 'granted') {
                            setLocationPermissionGranted(true);
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
            setLocation(prev => ({
                ...prev,
                error: t('gpsNotSupported'),
            }));
            return;
        }

        // CRITICAL: Chrome 50+ requires HTTPS (except localhost)
        const isHTTPS = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '[::1]';

        console.log('🔍 Security check:', {
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            isSecureContext: window.isSecureContext,
            isHTTPS,
            isLocalhost
        });

        if (!window.isSecureContext && !isHTTPS && !isLocalhost) {
            console.error('❌ HTTPS required for geolocation in Chrome');
            setLocation(prev => ({
                ...prev,
                error: 'HTTPS tələb olunur! Chrome məkan üçün yalnız HTTPS saytlara icazə verir.',
            }));
            setShowSettingsInstructions(true);
            return;
        }

        // Detect Chrome browser
        const isChrome = /Chrome|Chromium/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const requestDelay = (isChrome && isAndroid) ? 100 : 0;

        console.log('📱 Browser:', { isChrome, isAndroid, requestDelay });

        setTimeout(() => {
            console.log('📍 Requesting geolocation permission...');

            // IMPORTANT: Directly call getCurrentPosition() to trigger browser permission prompt
            // This is the ONLY way to request location permission from the browser
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success - permission granted
                    console.log('✅ Location permission granted:', position.coords);
                    setShowLocationModal(false);
                    setLocationPermissionGranted(true);
                    setPermissionStatus('granted');
                    setShowSettingsInstructions(false);
                },
                (error) => {
                    console.error('❌ Geolocation error:', {
                        code: error.code,
                        message: error.message,
                        PERMISSION_DENIED: error.PERMISSION_DENIED,
                        POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                        TIMEOUT: error.TIMEOUT
                    });

                    // Check for Chrome HTTPS requirement error
                    if (error.message && error.message.toLowerCase().includes('only secure origins')) {
                        console.error('🔒 HTTPS required!');
                        setLocation(prev => ({
                            ...prev,
                            error: 'HTTPS tələb olunur!',
                        }));
                        setShowSettingsInstructions(true);
                        return;
                    }

                    if (error.code === error.PERMISSION_DENIED) {
                        // User denied permission - show settings instructions
                        console.log('🚫 Permission DENIED by user or browser');
                        setPermissionStatus('denied');
                        setShowSettingsInstructions(true);
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        // Position unavailable - but still close modal
                        console.log('⚠️ Position unavailable');
                        setShowLocationModal(false);
                        setLocationPermissionGranted(true);
                    } else if (error.code === error.TIMEOUT) {
                        // Timeout - but still close modal
                        console.log('⏱️ Position timeout');
                        setShowLocationModal(false);
                        setLocationPermissionGranted(true);
                    } else {
                        // Other error
                        console.log('❓ Unknown geolocation error');
                        setShowLocationModal(false);
                        setLocationPermissionGranted(true);
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

    // QR Scanner initialization and cleanup
    useEffect(() => {
        if (scanMode === 'qr' && !qrScannerActive) {
            startQrScanner();
        } else if (scanMode === 'gps' && qrScannerActive) {
            stopQrScanner();
        }

        return () => {
            if (qrScannerActive) {
                stopQrScanner();
            }
        };
    }, [scanMode]);

    const startQrScanner = async () => {
        try {
            setQrError(null);
            const html5QrCode = new Html5Qrcode('qr-reader');
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onQrCodeScanned,
                undefined
            );

            setQrScannerActive(true);
        } catch (err: any) {
            console.error('QR Scanner error:', err);
            if (err.toString().includes('NotAllowedError')) {
                setQrError(t('qrScanner.cameraPermissionDenied'));
            } else if (err.toString().includes('NotSupportedError')) {
                setQrError(t('qrScanner.cameraNotSupported'));
            } else {
                setQrError(t('qrScanner.cameraNotSupported'));
            }
        }
    };

    const stopQrScanner = async () => {
        if (html5QrCodeRef.current && qrScannerActive) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error('Error stopping QR scanner:', err);
            }
            html5QrCodeRef.current = null;
            setQrScannerActive(false);
            setScannedBranchId(null);
        }
    };

    const onQrCodeScanned = (decodedText: string) => {
        try {
            // Decode the QR data
            const qrData = JSON.parse(atob(decodedText));

            // Validate QR code
            if (qrData.type !== 'attendance') {
                setQrError(t('qrScanner.invalidQR'));
                return;
            }

            if (qrData.account_id !== user.account_id) {
                setQrError(t('qrScanner.wrongAccount'));
                return;
            }

            // QR codes are valid indefinitely (no expiration check)
            // Set the scanned branch ID
            setScannedBranchId(qrData.branch_id);
            setQrError(null);

            // Stop scanner after successful scan
            stopQrScanner();
        } catch (err) {
            console.error('QR decode error:', err);
            setQrError(t('qrScanner.invalidQR'));
        }
    };

    const handleCheckIn = () => {
        if (scanMode === 'gps') {
            checkInForm.setData({
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                branch_id: null,
                method: 'gps',
            });
        } else {
            // For QR mode, include location if available (optional)
            checkInForm.setData({
                latitude: location.latitude || null,
                longitude: location.longitude || null,
                accuracy: location.accuracy || null,
                branch_id: scannedBranchId,
                method: 'qr',
            });
        }

        checkInForm.post('/attendance/check-in', {
            preserveScroll: true,
            onSuccess: () => {
                checkInForm.reset();
                setScannedBranchId(null);
            },
        });
    };

    const handleCheckOut = () => {
        if (scanMode === 'gps') {
            checkOutForm.setData({
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                branch_id: null,
                method: 'gps',
            });
        } else {
            // For QR mode, include location if available (optional)
            checkOutForm.setData({
                latitude: location.latitude || null,
                longitude: location.longitude || null,
                accuracy: location.accuracy || null,
                branch_id: scannedBranchId,
                method: 'qr',
            });
        }

        checkOutForm.post('/attendance/check-out', {
            preserveScroll: true,
            onSuccess: () => {
                checkOutForm.reset();
                setScannedBranchId(null);
            },
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('az-AZ', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const canCheckIn = scanMode === 'gps'
        ? location.latitude && location.longitude && !todayCheckIn && isWithinRadius
        : scannedBranchId !== null && !todayCheckIn;
    const canCheckOut = scanMode === 'gps'
        ? location.latitude && location.longitude && todayCheckIn && !todayCheckOut && isWithinRadius
        : scannedBranchId !== null && todayCheckIn && !todayCheckOut;

    // Render page content
    const pageContent = (
        <div className="max-w-2xl mx-auto">
                {/* Location Permission Modal - only show in GPS mode */}
                {showLocationModal && scanMode === 'gps' && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                            {/* Header - Compact */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-white text-center flex-shrink-0">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <MapPinIcon className="w-8 h-8" />
                                    <h2 className="text-lg font-bold">{t('locationPermissionTitle', 'Məkan İcazəsi')}</h2>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                                {!showSettingsInstructions ? (
                                    <>
                                        <p className="text-sm text-slate-700 text-center leading-relaxed">
                                            {t('locationPermissionMessage', 'Davamiyyət qeydini təsdiq etmək üçün cari GPS məkanınıza ehtiyacımız var.')}
                                        </p>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <h3 className="font-semibold text-blue-900 mb-1.5 text-xs">
                                                {t('whyWeNeedLocation', 'Niyə məkan lazımdır?')}
                                            </h3>
                                            <ul className="space-y-1 text-xs text-blue-800">
                                                <li className="flex items-start">
                                                    <span className="mr-1.5">•</span>
                                                    <span>{t('locationReason1', 'Filialda olduğunuzu yoxlamaq')}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="mr-1.5">•</span>
                                                    <span>{t('locationReason2', 'Dəqiq davamiyyət qeydi')}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Settings Instructions */}
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h3 className="font-bold text-red-900 text-sm mb-0.5">
                                                        {t('locationDenied', 'Məkan İcazəsi Rədd Edildi')}
                                                    </h3>
                                                    <p className="text-xs text-red-800">
                                                        {t('locationDeniedMessage', 'İcazə vermək üçün cihaz parametrlərindən aktivləşdirin.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                                            <h3 className="font-bold text-slate-900 text-sm">{t('howToEnable', 'Necə aktivləşdirmək olar?')}</h3>

                                            {/* Chrome Desktop/Mobile Instructions */}
                                            <div className="space-y-1 bg-white p-2 rounded border border-orange-200">
                                                <p className="font-bold text-orange-900 text-sm">🌐 Chrome (Hamısı):</p>
                                                <div className="space-y-1 text-slate-700">
                                                    <p className="font-semibold">Variant 1 - Ünvan panelindən:</p>
                                                    <ol className="list-decimal list-inside space-y-0.5 ml-2">
                                                        <li>URL yanındakı 🔒 kilid ikonasına klikləyin</li>
                                                        <li>"Location" tapın → "Allow" seçin</li>
                                                        <li>Səhifəni yeniləyin</li>
                                                    </ol>

                                                    <p className="font-semibold mt-2">Variant 2 - Parametrlərdən:</p>
                                                    <ol className="list-decimal list-inside space-y-0.5 ml-2">
                                                        <li>chrome://settings/content/location</li>
                                                        <li>Bu saytı "Allowed" siyahısına əlavə edin</li>
                                                    </ol>
                                                </div>
                                            </div>

                                            {/* iOS Instructions */}
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-800">📱 iPhone (Safari):</p>
                                                <ol className="list-decimal list-inside space-y-0.5 text-slate-700 ml-2">
                                                    <li>Settings → Safari → Location</li>
                                                    <li>Allow (İcazə ver)</li>
                                                </ol>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                                <p className="text-xs text-blue-800 font-medium">
                                                    💡 {t('refreshAfterSettings', 'Dəyişdikdən sonra səhifəni yeniləyin')}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Buttons - Fixed at bottom */}
                            <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 space-y-2">
                                {!showSettingsInstructions ? (
                                    <>
                                        <button
                                            onClick={handleEnableLocation}
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <MapPinIcon className="w-5 h-5" />
                                            {t('enableLocation', 'İcazə ver')}
                                        </button>

                                        {userBranch && (
                                            <button
                                                onClick={() => {
                                                    setShowLocationModal(false);
                                                    setScanMode('qr');
                                                }}
                                                className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-lg font-medium active:scale-95 transition-all"
                                            >
                                                {t('useQrInstead', 'QR kod istifadə et')}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold shadow-lg active:scale-95 transition-all"
                                        >
                                            {t('refreshPage', 'Səhifəni Yenilə')}
                                        </button>

                                        {userBranch && (
                                            <button
                                                onClick={() => {
                                                    setShowLocationModal(false);
                                                    setShowSettingsInstructions(false);
                                                    setScanMode('qr');
                                                }}
                                                className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-lg font-medium active:scale-95 transition-all"
                                            >
                                                {t('useQrInstead', 'QR kod istifadə et')}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                        <p className="text-blue-100">{t('subtitle')}</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Mode Toggle */}
                        {userBranch && (
                            <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-lg">
                                <button
                                    onClick={() => {
                                        if (scanMode !== 'gps' && !locationPermissionGranted) {
                                            setShowLocationModal(true);
                                        }
                                        setScanMode('gps');
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all ${
                                        scanMode === 'gps'
                                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <MapPinIcon className="w-5 h-5" />
                                    <span>{t('gpsMode')}</span>
                                </button>
                                <button
                                    onClick={() => setScanMode('qr')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all ${
                                        scanMode === 'qr'
                                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <QrCodeIcon className="w-5 h-5" />
                                    <span>{t('qrMode')}</span>
                                </button>
                            </div>
                        )}

                        {/* QR Scanner Section */}
                        {scanMode === 'qr' && userBranch && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-900">{t('qrScanner.title')}</h3>

                                {/* QR Scanner Container */}
                                {!scannedBranchId && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <div id="qr-reader" className="w-full"></div>
                                        {!qrScannerActive && !qrError && (
                                            <div className="p-6 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                                <p className="text-slate-600">{t('qrScanner.scanning')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Scanner Instructions */}
                                {qrScannerActive && !scannedBranchId && (
                                    <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <QrCodeIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-700">{t('qrScanner.instruction')}</p>
                                    </div>
                                )}

                                {/* QR Error */}
                                {qrError && (
                                    <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-red-700 font-medium">{t('gpsErrorTitle')}</p>
                                            <p className="text-sm text-red-600 mt-1">{qrError}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Successful QR Scan */}
                                {scannedBranchId && (
                                    <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-green-700 font-medium">{t('qrScanner.scanSuccess')}</p>
                                            <button
                                                onClick={() => {
                                                    setScannedBranchId(null);
                                                    setScanMode('qr');
                                                }}
                                                className="text-sm text-green-600 hover:text-green-700 underline mt-1"
                                            >
                                                {t('qrScanner.scanning')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No Branch Error */}
                        {!userBranch && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                <div className="flex items-start space-x-3">
                                    <ExclamationCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-red-900 mb-2">
                                            {t('noBranchAssigned')}
                                        </h3>
                                        <p className="text-sm text-red-700">
                                            {t('noBranchMessage')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Branch Information */}
                        {userBranch && (
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                                <div className="flex items-start space-x-3">
                                    <MapPinIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 mb-1">
                                            {userBranch.name}
                                        </h3>
                                        <p className="text-sm text-slate-600">{userBranch.address}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GPS Status - only show if branch is assigned and in GPS mode */}
                        {userBranch && scanMode === 'gps' && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-900">{t('gpsStatus')}</h3>

                            {location.acquiring && (
                                <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    <span className="text-blue-700">{t('acquiringGPS')}</span>
                                </div>
                            )}

                            {location.error && (
                                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-red-700 font-medium">{t('gpsErrorTitle')}</p>
                                        <p className="text-sm text-red-600 mt-1">{location.error}</p>
                                    </div>
                                </div>
                            )}

                            {location.latitude && location.longitude && !location.error && (
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-green-700 font-medium">
                                                {t('gpsAcquired')}
                                            </p>
                                            <p className="text-sm text-green-600 mt-1">
                                                {t('accuracy')}: ±{Math.round(location.accuracy || 0)}m
                                            </p>
                                        </div>
                                    </div>

                                    {/* Distance from branch */}
                                    {distanceFromBranch !== null && (
                                        <div
                                            className={`p-4 rounded-lg border ${
                                                isWithinRadius
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-yellow-50 border-yellow-200'
                                            }`}
                                        >
                                            <p className="text-sm font-medium text-slate-700">
                                                {t('distanceFromBranch')}:{' '}
                                                <span
                                                    className={`font-bold ${
                                                        isWithinRadius
                                                            ? 'text-green-700'
                                                            : 'text-yellow-700'
                                                    }`}
                                                >
                                                    {Math.round(distanceFromBranch)}m
                                                </span>
                                            </p>
                                            {!isWithinRadius && (
                                                <p className="text-xs text-yellow-600 mt-1">
                                                    {t('mustBeWithinRadius', { radius: allowedRadius })}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}

                        {/* Today's Status */}
                        {userBranch && (todayCheckIn || todayCheckOut) && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-900">{t('todayStatus')}</h3>

                                {todayCheckIn && (
                                    <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <ClockIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-blue-700 font-medium">
                                                {t('checkedInAt', {
                                                    time: formatTime(todayCheckIn.recorded_at),
                                                })}
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                {t('distance')}: {Math.round(todayCheckIn.distance_from_branch)}m
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {todayCheckOut && (
                                    <div className="flex items-start space-x-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                        <ClockIcon className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-slate-700 font-medium">
                                                {t('checkedOutAt', {
                                                    time: formatTime(todayCheckOut.recorded_at),
                                                })}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-1">
                                                {t('distance')}: {Math.round(todayCheckOut.distance_from_branch)}m
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons - only show if branch is assigned */}
                        {userBranch && (
                            <div className="space-y-3 pt-4">
                            {/* Check In Button */}
                            <PrimaryButton
                                onClick={handleCheckIn}
                                disabled={!canCheckIn || checkInForm.processing}
                                className="w-full justify-center py-4 text-base"
                            >
                                {checkInForm.processing ? (
                                    <span className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>{t('processing')}</span>
                                    </span>
                                ) : (
                                    t('checkIn')
                                )}
                            </PrimaryButton>

                            {/* Check Out Button */}
                            <DangerButton
                                onClick={handleCheckOut}
                                disabled={!canCheckOut || checkOutForm.processing}
                                className="w-full justify-center py-4 text-base"
                            >
                                {checkOutForm.processing ? (
                                    <span className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>{t('processing')}</span>
                                    </span>
                                ) : (
                                    t('checkOut')
                                )}
                            </DangerButton>

                            {/* Helper Text */}
                            {!location.latitude && !location.error && !location.acquiring && (
                                <p className="text-sm text-slate-500 text-center">
                                    {t('waitingForGPS')}
                                </p>
                            )}

                            {todayCheckIn && !todayCheckOut && !isWithinRadius && (
                                <p className="text-sm text-yellow-600 text-center">
                                    {t('tooFarForCheckOut')}
                                </p>
                            )}

                            {todayCheckOut && (
                                <p className="text-sm text-slate-500 text-center">
                                    {t('alreadyCheckedOut')}
                                </p>
                            )}
                        </div>
                        )}

                        {/* Error Messages */}
                        {checkInForm.errors && Object.keys(checkInForm.errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-600">
                                    {Object.values(checkInForm.errors)[0]}
                                </p>
                            </div>
                        )}

                        {checkOutForm.errors && Object.keys(checkOutForm.errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-600">
                                    {Object.values(checkOutForm.errors)[0]}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debug Info (only in development) */}
                {process.env.NODE_ENV === 'development' && location.latitude && location.longitude && (
                    <div className="mt-4 bg-slate-800 text-slate-200 rounded-lg p-4 text-xs font-mono">
                        <p>Lat: {location.latitude.toFixed(6)}</p>
                        <p>Lng: {location.longitude.toFixed(6)}</p>
                        <p>Accuracy: {location.accuracy?.toFixed(2)}m</p>
                        {distanceFromBranch && (
                            <p>Distance: {distanceFromBranch.toFixed(2)}m</p>
                        )}
                    </div>
                )}
            </div>
    );

    // Conditional rendering based on user role
    if (user.role === 'attendance_user') {
        return (
            <>
                <Head title={t('title')} />
                <div className="min-h-screen bg-gray-100">
                    {/* Simple header with logout */}
                    <div className="bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between px-4 py-3">
                        <h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1>
                        <button
                            onClick={() => router.post('/logout')}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                            <span>Çıxış</span>
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="py-6 px-4">
                    {pageContent}
                </div>
            </div>
            </>
        );
    }

    // Regular users get full layout with sidebar
    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />
            {pageContent}
        </AuthenticatedLayout>
    );
}
