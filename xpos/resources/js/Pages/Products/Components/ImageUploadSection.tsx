import DocumentUpload from '@/Components/DocumentUpload';

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

export default function ImageUploadSection({ productId, documents }: { productId: number; documents: DocumentData[] }) {
  return (
    <div className="mt-8">
      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Şəkillər</h2>
        </div>
        <div className="p-6">
          <DocumentUpload productId={productId} documents={documents} allowedTypes={["photo"]} />
        </div>
      </div>
    </div>
  );
}

