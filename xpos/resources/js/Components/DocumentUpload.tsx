import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { 
    DocumentArrowUpIcon, 
    XMarkIcon, 
    DocumentIcon,
    PhotoIcon,
    EyeIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface DocumentData {
    id: number;
    original_name: string;
    file_type: string;
    file_size: number;
    document_type: string;
    description?: string;
    uploaded_at: string;
    uploaded_by?: string;
    download_url: string;
    thumbnail_url?: string;
}

interface Props {
    productId: number;
    documents: DocumentData[];
    onDocumentsUpdated?: (documents: DocumentData[]) => void;
    maxFiles?: number;
    allowedTypes?: string[];
}

const DOCUMENT_TYPES = {
    'qaimə': 'Qaimə',
    'warranty': 'Zəmanət',
    'certificate': 'Sertifikat',
    'manual': 'İstifadə təlimatı',
    'photo': 'Şəkil',
    'invoice': 'Faktura',
    'receipt': 'Qəbz',
    'other': 'Digər'
};

export default function DocumentUpload({ 
    productId, 
    documents = [], 
    onDocumentsUpdated,
    maxFiles = 10,
    allowedTypes = Object.keys(DOCUMENT_TYPES)
}: Props) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [documentType, setDocumentType] = useState<string>('qaimə');
    const [description, setDescription] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedMimeTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain', 'text/csv'
            ];
            
            return file.size <= maxSize && allowedMimeTypes.includes(file.type);
        });

        const totalFiles = selectedFiles.length + validFiles.length;
        if (totalFiles > maxFiles) {
            alert(`Maksimum ${maxFiles} fayl seçə bilərsiniz`);
            return;
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files[]', file);
        });
        formData.append('document_type', documentType);
        if (description.trim()) {
            formData.append('description', description.trim());
        }

        try {
            const response = await fetch(route('documents.store', productId), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setSelectedFiles([]);
                setDescription('');
                if (onDocumentsUpdated && data.documents) {
                    onDocumentsUpdated(data.documents as DocumentData[]);
                }
                // Refresh the page to show new documents
                window.location.reload();
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Fayl yükləmə zamanı xəta baş verdi: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const deleteDocument = async (documentId: number) => {
        if (!confirm('Bu sənədi silmək istədiyinizə əminsiniz?')) return;

        router.delete(route('documents.destroy', documentId), {
            onSuccess: () => {
                if (onDocumentsUpdated) {
                    const updatedDocs = documents.filter(doc => doc.id !== documentId);
                    onDocumentsUpdated(updatedDocs);
                }
                // Refresh the page to show updated documents
                window.location.reload();
            },
            onError: () => {
                alert('Sənəd silinərkən xəta baş verdi');
            }
        });
    };

    const getFileIcon = (fileType: string) => {
        if (fileType === 'image') {
            return <PhotoIcon className="w-5 h-5 text-blue-500" />;
        }
        return <DocumentIcon className="w-5 h-5 text-gray-500" />;
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Sənəd Yüklə
                </h3>
                
                {/* Document Type Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sənəd Növü
                    </label>
                    <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        {allowedTypes.map(type => (
                            <option key={type} value={type}>
                                {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Təsvir (İxtiyari)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Sənəd haqqında qısa məlumat..."
                    />
                </div>

                {/* Drag & Drop Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            Faylları buraya sürükləyin və ya 
                            <button
                                type="button"
                                className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                seçin
                            </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, PDF, DOC, XLS - maksimum 10MB
                        </p>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">
                            Seçilmiş fayllar ({selectedFiles.length})
                        </h4>
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center">
                                    {getFileIcon(file.type.startsWith('image/') ? 'image' : 'document')}
                                    <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({formatFileSize(file.size)})
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSelectedFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        
                        <div className="flex justify-end space-x-2 pt-2">
                            <SecondaryButton
                                type="button"
                                onClick={() => setSelectedFiles([])}
                            >
                                Hamısını Təmizlə
                            </SecondaryButton>
                            <PrimaryButton
                                type="button"
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? 'Yüklənir...' : 'Yüklə'}
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </div>

            {/* Existing Documents */}
            {documents.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Mövcud Sənədlər ({documents.length})
                    </h3>
                    
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center">
                                    {doc.thumbnail_url ? (
                                        <img 
                                            src={doc.thumbnail_url} 
                                            alt={doc.original_name}
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    ) : (
                                        getFileIcon(doc.file_type)
                                    )}
                                    <div className="ml-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {doc.original_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {DOCUMENT_TYPES[doc.document_type as keyof typeof DOCUMENT_TYPES]} • 
                                            {formatFileSize(doc.file_size)} • 
                                            {formatDate(doc.uploaded_at)}
                                            {doc.uploaded_by && ` • ${doc.uploaded_by}`}
                                        </div>
                                        {doc.description && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                {doc.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <a
                                        href={doc.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-500"
                                        title="Görüntülə"
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                    </a>
                                    <a
                                        href={`${doc.download_url}?download=1`}
                                        className="text-green-600 hover:text-green-500"
                                        title="Yüklə"
                                    >
                                        <DocumentArrowUpIcon className="w-4 h-4" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => deleteDocument(doc.id)}
                                        className="text-red-600 hover:text-red-500"
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
        </div>
    );
}