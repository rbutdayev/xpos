import { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import {
    MapPinIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MapIcon,
    QrCodeIcon,
    PrinterIcon,
    ExclamationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface Branch {
    id: number;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    is_active: boolean;
}

interface Props {
    branches: Branch[];
    allowedRadius: number;
}

export default function Settings({ branches, allowedRadius }: Props) {
    const { t } = useTranslation(['attendance', 'common']);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [showSettingsInstructions, setShowSettingsInstructions] = useState(false);

    // Form for radius
    const radiusForm = useForm({
        radius: allowedRadius,
    });

    // Form for branch location
    const locationForm = useForm({
        latitude: selectedBranch?.latitude || '',
        longitude: selectedBranch?.longitude || '',
    });

    const handleRadiusUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        radiusForm.post('/attendance/settings/radius', {
            preserveScroll: true,
        });
    };

    const handleLocationUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBranch) return;

        locationForm.post(`/attendance/settings/branch/${selectedBranch.id}/location`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingLocation(false);
                setSelectedBranch(null);
            },
        });
    };

    const openLocationEditor = (branch: Branch) => {
        setSelectedBranch(branch);
        locationForm.setData({
            latitude: branch.latitude?.toString() || '',
            longitude: branch.longitude?.toString() || '',
        });
        setIsEditingLocation(true);
    };

    const closeLocationEditor = () => {
        setIsEditingLocation(false);
        setSelectedBranch(null);
        setLocationError(null);
        locationForm.reset();
        locationForm.clearErrors();
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError(t('attendance:settings.geolocationNotSupported'));
            return;
        }

        setGettingLocation(true);
        setLocationError(null);

        // IMPORTANT: Directly call getCurrentPosition() to trigger browser permission prompt
        // This is the ONLY way to request location permission from the browser
        navigator.geolocation.getCurrentPosition(
            (position) => {
                locationForm.setData({
                    latitude: position.coords.latitude.toFixed(8),
                    longitude: position.coords.longitude.toFixed(8),
                });
                setGettingLocation(false);
                setShowSettingsInstructions(false);
            },
            (error) => {
                setGettingLocation(false);
                console.error('Geolocation error:', error);

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        // Show detailed settings instructions instead of just an error
                        setShowSettingsInstructions(true);
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError(t('attendance:settings.geolocationUnavailable'));
                        break;
                    case error.TIMEOUT:
                        setLocationError(t('attendance:settings.geolocationTimeout'));
                        break;
                    default:
                        setLocationError(t('attendance:settings.geolocationError'));
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const getBranchStatus = (branch: Branch) => {
        if (!branch.is_active) {
            return { type: 'inactive', text: t('common:status.inactive'), color: 'text-gray-500' };
        }
        if (!branch.latitude || !branch.longitude) {
            return { type: 'warning', text: t('attendance:settings.noLocation'), color: 'text-yellow-600' };
        }
        return { type: 'ready', text: t('attendance:settings.ready'), color: 'text-green-600' };
    };

    return (
        <AuthenticatedLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{t('attendance:settings.title')}</h1>
                    <p className="text-sm text-gray-600 mt-1">{t('attendance:settings.description')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* QR Codes Card */}
                        <Link href="/attendance/qr-codes">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6 hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex items-start gap-4">
                                    <div className="bg-slate-700 rounded-lg p-3 group-hover:scale-110 transition-transform">
                                        <QrCodeIcon className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                                            {t('attendance:qr_codes.title')}
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {t('attendance:qr_codes.description')}
                                        </p>
                                        <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                                            <PrinterIcon className="w-4 h-4" />
                                            <span>{t('attendance:qr_codes.info')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Radius Settings Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {t('attendance:settings.allowedRadius')}
                            </h2>

                            <form onSubmit={handleRadiusUpdate} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="radius">
                                        {t('attendance:settings.radiusInMeters')}
                                    </InputLabel>
                                    <TextInput
                                        id="radius"
                                        type="number"
                                        min="10"
                                        max="1000"
                                        value={radiusForm.data.radius}
                                        onChange={(e) => radiusForm.setData('radius', parseInt(e.target.value))}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={radiusForm.errors.radius} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t('attendance:settings.radiusDescription')}
                                    </p>
                                </div>

                                <PrimaryButton disabled={radiusForm.processing}>
                                    {t('common:actions.save')}
                                </PrimaryButton>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - Branches List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPinIcon className="w-6 h-6 text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {t('attendance:settings.branchLocations')}
                                </h2>
                            </div>

                            {branches.length === 0 ? (
                                <div className="text-center py-12">
                                    <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">{t('attendance:settings.noBranches')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {branches.map((branch) => {
                                        const status = getBranchStatus(branch);
                                        return (
                                            <div
                                                key={branch.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-gray-900">
                                                                {branch.name}
                                                            </h3>
                                                            <span className={`text-xs ${status.color}`}>
                                                                {status.text}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">{branch.address}</p>

                                                        {branch.latitude && branch.longitude ? (
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span>Lat: {branch.latitude}</span>
                                                                <span>Lng: {branch.longitude}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-sm text-yellow-600">
                                                                <ExclamationTriangleIcon className="w-4 h-4" />
                                                                <span>{t('attendance:settings.locationNotSet')}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <SecondaryButton
                                                        onClick={() => openLocationEditor(branch)}
                                                        className="ml-4"
                                                    >
                                                        {branch.latitude && branch.longitude
                                                            ? t('common:actions.edit')
                                                            : t('attendance:settings.setLocation')}
                                                    </SecondaryButton>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings Instructions Modal */}
                {showSettingsInstructions && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <ExclamationCircleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-bold text-lg">
                                                {t('attendance:locationDenied', 'Məkan İcazəsi Rədd Edildi')}
                                            </h3>
                                            <p className="text-sm text-blue-100 mt-1">
                                                {t('attendance:locationDeniedMessage', 'Məkan icazəsini əvvəl rədd etmisiniz.')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSettingsInstructions(false)}
                                        className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
                                    <h3 className="font-bold text-slate-900">{t('attendance:howToEnable', 'Necə aktivləşdirmək olar?')}</h3>

                                    {/* iOS Instructions */}
                                    <div className="space-y-2">
                                        <p className="font-semibold text-slate-800">📱 iPhone/iPad (Safari):</p>
                                        <ol className="list-decimal list-inside space-y-1 text-slate-700 ml-2">
                                            <li>Settings (Parametrlər) → Safari</li>
                                            <li>Location (Məkan) → Allow (İcazə ver)</li>
                                            <li>Və ya Settings → Privacy (Məxfilik) → Location Services</li>
                                            <li>Safari Websites → Allow (İcazə ver)</li>
                                        </ol>
                                    </div>

                                    {/* Android Chrome Instructions */}
                                    <div className="space-y-2">
                                        <p className="font-semibold text-slate-800">🤖 Android (Chrome):</p>
                                        <ol className="list-decimal list-inside space-y-1 text-slate-700 ml-2">
                                            <li>Chrome → ⋮ (Menyu) → Settings</li>
                                            <li>Site Settings → Location</li>
                                            <li>Bu saytı tapın və "Allow" seçin</li>
                                            <li>Və ya URL-in yanındakı kilid ikonasına toxunun</li>
                                            <li>Permissions → Location → Allow</li>
                                        </ol>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                        <p className="text-xs text-blue-800 font-medium">
                                            💡 {t('attendance:refreshAfterSettings', 'Parametrləri dəyişdirdikdən sonra səhifəni yeniləyin')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                                    >
                                        {t('attendance:refreshPage', 'Səhifəni Yenilə')}
                                    </button>
                                    <button
                                        onClick={() => setShowSettingsInstructions(false)}
                                        className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        {t('common:actions.close', 'Bağla')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Editor Modal */}
                {isEditingLocation && selectedBranch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {t('attendance:settings.editLocation')} - {selectedBranch.name}
                            </h3>

                            <form onSubmit={handleLocationUpdate} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="latitude">
                                        {t('attendance:settings.latitude')}
                                    </InputLabel>
                                    <TextInput
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        min="-90"
                                        max="90"
                                        value={locationForm.data.latitude}
                                        onChange={(e) => locationForm.setData('latitude', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="40.409264"
                                    />
                                    <InputError message={locationForm.errors.latitude} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="longitude">
                                        {t('attendance:settings.longitude')}
                                    </InputLabel>
                                    <TextInput
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        min="-180"
                                        max="180"
                                        value={locationForm.data.longitude}
                                        onChange={(e) => locationForm.setData('longitude', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="49.867092"
                                    />
                                    <InputError message={locationForm.errors.longitude} className="mt-2" />
                                </div>

                                {/* Get Current Location Button */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={gettingLocation}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {gettingLocation ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>{t('attendance:settings.gettingLocation')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <MapIcon className="w-5 h-5" />
                                                <span>{t('attendance:settings.useCurrentLocation')}</span>
                                            </>
                                        )}
                                    </button>

                                    {locationError && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-xs text-red-700">{locationError}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-800">
                                        {t('attendance:settings.locationHint')}
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <PrimaryButton
                                        type="submit"
                                        disabled={locationForm.processing}
                                        className="flex-1"
                                    >
                                        {t('common:actions.save')}
                                    </PrimaryButton>
                                    <SecondaryButton
                                        type="button"
                                        onClick={closeLocationEditor}
                                        className="flex-1"
                                    >
                                        {t('common:actions.cancel')}
                                    </SecondaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
