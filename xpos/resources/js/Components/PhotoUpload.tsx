import { useState, useRef, ChangeEvent } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface PhotoUploadProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    maxPhotos?: number;
    minPhotos?: number;
    label?: string;
    required?: boolean;
}

export default function PhotoUpload({
    photos,
    onPhotosChange,
    maxPhotos = 10,
    minPhotos = 0,
    label = 'Şəkillər',
    required = false
}: PhotoUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (photos.length + files.length > maxPhotos) {
            alert(`Maksimum ${maxPhotos} şəkil yükləyə bilərsiniz`);
            return;
        }

        setUploading(true);

        const newPhotos: string[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} şəkil faylı deyil`);
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} çox böyükdür (max 5MB)`);
                continue;
            }

            // Convert to base64
            const base64 = await fileToBase64(file);
            newPhotos.push(base64);
        }

        onPhotosChange([...photos, ...newPhotos]);
        setUploading(false);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
    };

    const canAddMore = photos.length < maxPhotos;
    const meetsMinimum = photos.length >= minPhotos;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <span className="text-xs text-gray-500">
                    {photos.length} / {maxPhotos}
                    {minPhotos > 0 && ` (min: ${minPhotos})`}
                </span>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img
                                src={photo}
                                alt={`Şəkil ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Buttons */}
            {canAddMore && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Gallery Upload */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <PhotoIcon className="h-5 w-5 mr-2" />
                        Qalereya
                    </button>

                    {/* Camera Upload (Mobile) */}
                    <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploading}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <CameraIcon className="h-5 w-5 mr-2" />
                        Kamera
                    </button>

                    {/* Hidden file inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}

            {uploading && (
                <div className="text-center py-2">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 mt-2">Yüklənir...</p>
                </div>
            )}

            {/* Validation Messages */}
            {required && !meetsMinimum && photos.length > 0 && (
                <p className="text-sm text-red-600">
                    Minimum {minPhotos} şəkil tələb olunur
                </p>
            )}
        </div>
    );
}
