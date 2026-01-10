import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { PhotoIcon, XMarkIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PhotoViewerModal from '@/Components/PhotoViewerModal';

interface PhotoData {
  id: number;
  original_url: string;
  medium_url: string;
  thumbnail_url: string;
  is_primary: boolean;
  alt_text?: string;
  sort_order: number;
}

export default function ImageUploadSection({ productId, photos = [] }: { productId: number; photos?: PhotoData[] }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [altTexts, setAltTexts] = useState<Record<number, string>>({});
  const [primaryIndex, setPrimaryIndex] = useState<number>(0);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxPhotos = 5;
  const maxFileSize = 2 * 1024 * 1024; // 2MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

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

    const totalPhotos = photos.length + selectedFiles.length + validFiles.length;
    if (totalPhotos > maxPhotos) {
      alert(`Maksimum ${maxPhotos} şəkil yükləyə bilərsiniz`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const newAltTexts = { ...altTexts };
    delete newAltTexts[index];
    setAltTexts(newAltTexts);
    if (primaryIndex === index) {
      setPrimaryIndex(0);
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append('photos[]', file);
      if (altTexts[index]) {
        formData.append(`alt_texts[${index}]`, altTexts[index]);
      }
    });
    formData.append('primary_index', primaryIndex.toString());

    router.post(route('products.photos.store', productId), formData, {
      onSuccess: () => {
        setSelectedFiles([]);
        setAltTexts({});
        setPrimaryIndex(0);
        setUploading(false);
      },
      onError: (errors) => {
        console.error('Upload errors:', errors);
        alert('Fayl yükləmə zamanı xəta baş verdi');
        setUploading(false);
      },
    });
  };

  const deletePhoto = (photoId: number) => {
    if (!confirm('Bu şəkli silmək istədiyinizə əminsiniz?')) return;

    router.delete(route('products.photos.destroy', { product: productId, photo: photoId }));
  };

  const setPrimaryPhoto = (photoId: number) => {
    router.post(route('products.photos.set-primary', { product: productId, photo: photoId }));
  };

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setPhotoViewerOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-8">
      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Şəkillər</h2>
          <p className="text-sm text-gray-500 mt-1">
            Maksimum {maxPhotos} şəkil (hər biri max. 2MB)
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Photos */}
          {photos && photos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Yüklənmiş şəkillər</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.thumbnail_url}
                      alt={photo.alt_text || 'Product photo'}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer"
                      onClick={() => openPhotoViewer(index)}
                    />
                    {photo.is_primary && (
                      <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Əsas
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPhotoViewer(index);
                        }}
                        className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                        title="Böyük göstər"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {!photo.is_primary && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimaryPhoto(photo.id);
                          }}
                          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600"
                        >
                          Əsas et
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhoto(photo.id);
                        }}
                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                        title="Sil"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Section */}
          {photos && photos.length < maxPhotos && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Yeni şəkil yüklə</h3>

              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Fayl seçin
                    </span>
                    <span className="text-gray-600"> və ya buraya sürüyün</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
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

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Seçilmiş fayllar:</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <PhotoIcon className="w-5 h-5 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center text-xs">
                          <input
                            type="radio"
                            name="primary"
                            checked={primaryIndex === index}
                            onChange={() => setPrimaryIndex(index)}
                            className="mr-1"
                          />
                          Əsas
                        </label>
                        <button
                          onClick={() => removeSelectedFile(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <PrimaryButton onClick={handleUpload} disabled={uploading}>
                      {uploading ? 'Yüklənir...' : 'Yüklə'}
                    </PrimaryButton>
                    <SecondaryButton onClick={() => setSelectedFiles([])}>
                      Ləğv et
                    </SecondaryButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        photos={photos}
        initialPhotoIndex={selectedPhotoIndex}
      />
    </div>
  );
}

