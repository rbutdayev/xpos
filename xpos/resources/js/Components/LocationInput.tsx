import React, { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

export interface LocationData {
    latitude: number | null;
    longitude: number | null;
    address: string;
    timestamp: string | null;
}

interface LocationInputProps {
    value: LocationData;
    onChange: (location: LocationData) => void;
    className?: string;
}

export default function LocationInput({ value, onChange, className = '' }: LocationInputProps) {
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetCurrentLocation = () => {
        if (!('geolocation' in navigator)) {
            setError('GPS bu cihazda mövcud deyil');
            return;
        }

        setIsGettingLocation(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const timestamp = new Date().toISOString();

                onChange({
                    latitude,
                    longitude,
                    address: `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    timestamp,
                });

                setIsGettingLocation(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'GPS məkanı əldə edilə bilmədi';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'GPS icazəsi rədd edildi. Brauzer parametrlərindən icazə verin.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'GPS məlumatı əlçatan deyil';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'GPS sorğusu vaxt bitdi';
                        break;
                }

                setError(errorMessage);
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const handleManualLatChange = (lat: string) => {
        const latitude = lat ? parseFloat(lat) : null;
        onChange({
            ...value,
            latitude,
            address: latitude && value.longitude
                ? `GPS: ${latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`
                : value.address,
        });
    };

    const handleManualLngChange = (lng: string) => {
        const longitude = lng ? parseFloat(lng) : null;
        onChange({
            ...value,
            longitude,
            address: value.latitude && longitude
                ? `GPS: ${value.latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                : value.address,
        });
    };

    const handleAddressChange = (address: string) => {
        onChange({
            ...value,
            address,
        });
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Get Current Location Button */}
            <div>
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    <MapPinIcon className={`w-5 h-5 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                    <span>
                        {isGettingLocation ? 'GPS məkanı əldə edilir...' : 'Cari məkanı əldə et (GPS)'}
                    </span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Captured Location Display */}
            {value.latitude && value.longitude && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start gap-2">
                        <MapPinIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900">Məkan tutuldu</p>
                            <p className="text-xs text-green-700 mt-1">
                                Enlik: {value.latitude.toFixed(6)}° | Uzunluq: {value.longitude.toFixed(6)}°
                            </p>
                            {value.timestamp && (
                                <p className="text-xs text-green-600 mt-0.5">
                                    Vaxt: {new Date(value.timestamp).toLocaleString('az-AZ')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Address Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ünvan
                </label>
                <input
                    type="text"
                    value={value.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Məsələn: Nizami küç. 5, Bakı"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                    GPS koordinatları əldə etdikdən sonra bu sahəni redaktə edə bilərsiniz
                </p>
            </div>

            {/* Manual Coordinates Input (Fallback) */}
            <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Əl ilə koordinat daxil et (əlavə)
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Enlik (Latitude)
                        </label>
                        <input
                            type="number"
                            step="0.000001"
                            value={value.latitude ?? ''}
                            onChange={(e) => handleManualLatChange(e.target.value)}
                            placeholder="40.409264"
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Uzunluq (Longitude)
                        </label>
                        <input
                            type="number"
                            step="0.000001"
                            value={value.longitude ?? ''}
                            onChange={(e) => handleManualLngChange(e.target.value)}
                            placeholder="49.867092"
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                        />
                    </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    GPS olmadıqda və ya əl ilə koordinat daxil etmək istədikdə istifadə edin
                </p>
            </details>
        </div>
    );
}
