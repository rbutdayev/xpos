<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductDocument;
use App\Services\DocumentUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    private DocumentUploadService $documentService;

    public function __construct(DocumentUploadService $documentService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->documentService = $documentService;
    }

    /**
     * Upload documents for a product
     */
    public function store(Request $request, Product $product)
    {
        Gate::authorize('update', $product);

        $request->validate([
            'files' => 'required|array|max:10',
            'files.*' => 'required|file|max:10240', // 10MB max per file
            'document_type' => 'required|string|in:qaimə,warranty,certificate,manual,photo,invoice,receipt,other',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $documents = $this->documentService->uploadMultipleDocuments(
                $product,
                $request->file('files'),
                $request->document_type
            );

            return redirect()->back()->with('success', __('app.documents_uploaded_successfully'));
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('app.upload_failed'));
        }
    }

    /**
     * Upload single document for a product
     */
    public function uploadSingle(Request $request, Product $product)
    {
        Gate::authorize('update', $product);

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'document_type' => 'required|string|in:qaimə,warranty,certificate,manual,photo,invoice,receipt,other',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $document = $this->documentService->uploadProductDocument(
                $product,
                $request->file('file'),
                $request->document_type,
                $request->description
            );

            return redirect()->back()->with('success', __('app.document_uploaded_successfully'));
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('app.upload_failed'));
        }
    }

    /**
     * Get documents for a product
     */
    public function index(Product $product)
    {
        Gate::authorize('view', $product);

        $documents = $product->documents()->with('uploader')->latest()->get();

        return response()->json([
            'documents' => $documents->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'original_name' => $doc->original_name,
                    'file_type' => $doc->file_type,
                    'file_size' => $doc->file_size,
                    'document_type' => $doc->document_type,
                    'description' => $doc->description,
                    'uploaded_at' => $doc->created_at,
                    'uploaded_by' => $doc->uploader?->name,
                    'download_url' => $this->documentService->getDocumentUrl($doc),
                    'thumbnail_url' => $this->documentService->getThumbnailUrl($doc),
                ];
            }),
        ]);
    }

    /**
     * Delete a document
     */
    public function destroy(ProductDocument $document)
    {
        Gate::authorize('update', $document->product);

        if ($this->documentService->deleteDocument($document)) {
            return redirect()->back()->with('success', __('app.document_deleted_successfully'));
        }

        return redirect()->back()->with('error', __('app.delete_failed'));
    }

    /**
     * Serve document file (for local storage)
     */
    public function serve(ProductDocument $document, Request $request)
    {
        Gate::authorize('view', $document->product);

        $download = $request->boolean('download', false);

        if (!Storage::disk('documents')->exists($document->file_path)) {
            abort(404, __('app.file_not_found'));
        }

        $headers = [
            'Content-Type' => $document->mime_type,
            'Content-Length' => $document->file_size,
        ];

        if ($download) {
            $headers['Content-Disposition'] = 'attachment; filename="' . $document->original_name . '"';
        } else {
            $headers['Content-Disposition'] = 'inline; filename="' . $document->original_name . '"';
        }

        return new StreamedResponse(function () use ($document) {
            $stream = Storage::disk('documents')->readStream($document->file_path);
            fpassthru($stream);
            fclose($stream);
        }, 200, $headers);
    }

    /**
     * Serve thumbnail image (for local storage)
     */
    public function thumbnail(ProductDocument $document)
    {
        Gate::authorize('view', $document->product);

        if (!$document->thumbnail_path || !Storage::disk('documents')->exists($document->thumbnail_path)) {
            abort(404, __('app.thumbnail_not_found'));
        }

        return new StreamedResponse(function () use ($document) {
            $stream = Storage::disk('documents')->readStream($document->thumbnail_path);
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Get supported document types
     */
    public function types()
    {
        return response()->json([
            'types' => $this->documentService->getSupportedTypes(),
        ]);
    }

    /**
     * Get account document statistics
     */
    public function statistics(Request $request)
    {
        Gate::authorize('access-account-data');

        $stats = $this->documentService->getAccountStatistics(
            auth()->user()->account_id
        );

        return response()->json($stats);
    }
}