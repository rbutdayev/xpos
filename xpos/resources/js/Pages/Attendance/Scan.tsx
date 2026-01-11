import { useEffect, useState, useRef } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
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
}

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    acquiring: boolean;
}

export default function Scan({ userBranch, todayCheckIn, todayCheckOut, allowedRadius }: Props) {
    const { t } = useTranslation('attendance');
    const user = usePage().props.auth.user;
    const [scanMode, setScanMode] = useState<'gps' | 'qr'>('gps');
    const [qrScannerActive, setQrScannerActive] = useState(false);
    const [qrError, setQrError] = useState<string | null>(null);
    const [scannedBranchId, setScannedBranchId] = useState<number | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Location permission modal state
    const [showLocationModal, setShowLocationModal] = useState(true);
    const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

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

    // Handle location permission request
    const handleEnableLocation = () => {
        setShowLocationModal(false);
        setLocationPermissionGranted(true);
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPinIcon className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">{t('locationPermissionTitle', 'Məkan İcazəsi Tələb olunur')}</h2>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <p className="text-slate-700 text-center leading-relaxed">
                                    {t('locationPermissionMessage', 'Davamiyyət qeydini təsdiq etmək üçün cari GPS məkanınıza ehtiyacımız var. Bu sizin filialda olduğunuzu təsdiq edir.')}
                                </p>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                                        {t('whyWeNeedLocation', 'Niyə məkan lazımdır?')}
                                    </h3>
                                    <ul className="space-y-1.5 text-sm text-blue-800">
                                        <li className="flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{t('locationReason1', 'Filialda olduğunuzu yoxlamaq')}</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{t('locationReason2', 'Dəqiq davamiyyət qeydi aparmaq')}</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{t('locationReason3', 'Təhlükəsizlik və hesabatlama')}</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <button
                                        onClick={handleEnableLocation}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        <MapPinIcon className="w-5 h-5" />
                                        {t('enableLocation', 'Məkanı Aktivləşdir')}
                                    </button>

                                    {userBranch && (
                                        <button
                                            onClick={() => {
                                                setShowLocationModal(false);
                                                setScanMode('qr');
                                            }}
                                            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                        >
                                            {t('useQrInstead', 'Əvəzinə QR kod istifadə et')}
                                        </button>
                                    )}
                                </div>
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
        );
    }

    // Regular users get full layout with sidebar
    return (
        <AuthenticatedLayout>
            {pageContent}
        </AuthenticatedLayout>
    );
}
