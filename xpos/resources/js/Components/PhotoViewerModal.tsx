import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PhotoData {
  id: number;
  original_url: string;
  medium_url: string;
  thumbnail_url: string;
  is_primary: boolean;
  alt_text?: string;
  sort_order: number;
}

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoData[];
  initialPhotoIndex: number;
}

export default function PhotoViewerModal({ isOpen, onClose, photos, initialPhotoIndex }: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      goToPrevious();
    } else if (event.key === 'ArrowRight') {
      goToNext();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!photos || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={onClose}
        onKeyDown={handleKeyDown}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-90" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl mx-auto relative">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute -top-12 right-0 text-white hover:text-gray-300 z-10"
                >
                  <span className="sr-only">Bağla</span>
                  <XMarkIcon className="h-8 w-8" />
                </button>

                {/* Image counter */}
                <div className="absolute -top-12 left-0 text-white text-sm">
                  {currentIndex + 1} / {photos.length}
                </div>

                {/* Main image */}
                <div className="relative bg-white rounded-lg overflow-hidden">
                  <img
                    src={currentPhoto.original_url}
                    alt={currentPhoto.alt_text || 'Product photo'}
                    className="w-full max-h-[80vh] object-contain mx-auto"
                  />
                  
                  {/* Primary badge */}
                  {currentPhoto.is_primary && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                        Əsas şəkil
                      </span>
                    </div>
                  )}

                  {/* Navigation arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Photo info */}
                {currentPhoto.alt_text && (
                  <div className="mt-4 text-center text-white">
                    <p className="text-sm">{currentPhoto.alt_text}</p>
                  </div>
                )}

                {/* Thumbnail strip */}
                {photos.length > 1 && (
                  <div className="mt-6 flex justify-center space-x-2 overflow-x-auto pb-2">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentIndex 
                            ? 'border-blue-500' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={photo.thumbnail_url}
                          alt={photo.alt_text || 'Thumbnail'}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}