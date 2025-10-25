import React, { useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  photos: File[];
  primaryIndex: number;
  onPhotosChange: (photos: File[]) => void;
  onPrimaryChange: (index: number) => void;
  errors?: Record<string, string>;
}

export default function PhotoUploadSection({ photos, primaryIndex, onPhotosChange, onPrimaryChange, errors }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxPhotos = 5;
  const maxFileSize = 2 * 1024 * 1024; // 2MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      return file.size <= maxFileSize && allowedTypes.includes(file.type);
    });

    const totalPhotos = photos.length + validFiles.length;
    if (totalPhotos > maxPhotos) {
      alert(`Maksimum ${maxPhotos} şəkil yükləyə bilərsiniz`);
      return;
    }

    onPhotosChange([...photos, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);

    // Adjust primary index if needed
    if (primaryIndex === index) {
      onPrimaryChange(0);
    } else if (primaryIndex > index) {
      onPrimaryChange(primaryIndex - 1);
    }
  };

  const formatFileSize = (bytes: number): string => {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Şəkillər (İxtiyari)</h3>
        <p className="text-sm text-gray-500 mt-1">
          Maksimum {maxPhotos} şəkil (hər biri max. 2MB) yükləyə bilərsiniz
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Fayl seçin
              </span>
              <span className="text-gray-600"> və ya buraya sürüyün</span>
            </label>
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              className="hidden"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            JPEG, PNG, GIF, WebP (max. 2MB)
          </p>
        </div>

        {/* Selected Photos */}
        {photos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Seçilmiş şəkillər: ({photos.length}/{maxPhotos})
            </h4>
            <div className="space-y-2">
              {photos.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <PhotoIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="flex items-center text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="primary_photo"
                        checked={primaryIndex === index}
                        onChange={() => onPrimaryChange(index)}
                        className="mr-1"
                      />
                      Əsas
                    </label>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors && Object.keys(errors).length > 0 && (
          <div className="text-sm text-red-600">
            {Object.values(errors).map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
