<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportInvoicesRequest;
use App\Http\Resources\ImportBatchResource;
use App\Models\ImportBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ImportController extends Controller
{
    /**
     * Upload and preview an import file.
     */
    public function upload(ImportInvoicesRequest $request): JsonResponse
    {
        $file = $request->file('file');

        // Store file temporarily
        $path = $file->store('imports/temp');

        // TODO: Implement actual Excel parsing logic
        // This is a placeholder that should use maatwebsite/excel or similar

        return response()->json([
            'message' => 'Archivo cargado exitosamente',
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
        ]);
    }

    /**
     * Preview data before importing.
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'file_path' => ['required', 'string'],
        ]);

        // TODO: Implement preview logic
        // This should parse the Excel file and return a preview of the data
        // with validation results

        return response()->json([
            'message' => 'Vista previa generada',
            'preview' => [
                'total_rows' => 0,
                'valid_rows' => 0,
                'invalid_rows' => 0,
                'errors' => [],
                'sample_data' => [],
            ],
        ]);
    }

    /**
     * Execute the import.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file_path' => ['required', 'string'],
            'source_system' => ['nullable', 'string', 'max:100'],
            'skip_duplicates' => ['boolean'],
        ]);

        // Create import batch
        $batch = ImportBatch::create([
            'user_id' => auth()->id(),
            'filename' => basename($request->file_path),
            'source_system' => $request->source_system,
            'import_type' => 'invoices',
            'status' => 'processing',
            'started_at' => now(),
            'total_records' => 0,
            'successful_records' => 0,
            'failed_records' => 0,
        ]);

        // TODO: Implement actual import logic
        // This should:
        // 1. Parse the Excel file
        // 2. Validate each row
        // 3. Create Invoice records
        // 4. Handle duplicates based on skip_duplicates flag
        // 5. Update the batch status

        $batch->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Importación completada',
            'batch' => new ImportBatchResource($batch),
        ]);
    }

    /**
     * Get import history.
     */
    public function history(Request $request): AnonymousResourceCollection
    {
        $query = ImportBatch::query()->with('user');

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('import_type')) {
            $query->where('import_type', $request->import_type);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $batches = $query->paginate($perPage);

        return ImportBatchResource::collection($batches);
    }

    /**
     * Show import batch details.
     */
    public function show(ImportBatch $batch): ImportBatchResource
    {
        $batch->load('user')->loadCount('invoices');

        return new ImportBatchResource($batch);
    }
}
