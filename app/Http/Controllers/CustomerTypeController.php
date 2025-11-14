<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerTypeRequest;
use App\Http\Requests\UpdateCustomerTypeRequest;
use App\Http\Resources\CustomerTypeResource;
use App\Models\CustomerType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CustomerTypeController extends Controller
{
    /**
     * Display a listing of customer types.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = CustomerType::query()->withCount('customers');

        // Filters
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'sort_order');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $customerTypes = $query->paginate($perPage);

        return CustomerTypeResource::collection($customerTypes);
    }

    /**
     * Store a newly created customer type.
     */
    public function store(StoreCustomerTypeRequest $request): CustomerTypeResource
    {
        $customerType = CustomerType::create([
            ...$request->validated(),
            'organization_id' => auth()->user()->organization_id,
        ]);

        return new CustomerTypeResource($customerType);
    }

    /**
     * Display the specified customer type.
     */
    public function show(CustomerType $customerType): CustomerTypeResource
    {
        $customerType->loadCount('customers');

        return new CustomerTypeResource($customerType);
    }

    /**
     * Update the specified customer type.
     */
    public function update(UpdateCustomerTypeRequest $request, CustomerType $customerType): CustomerTypeResource
    {
        $customerType->update($request->validated());

        return new CustomerTypeResource($customerType);
    }

    /**
     * Remove the specified customer type.
     */
    public function destroy(CustomerType $customerType): Response
    {
        $customerType->delete();

        return response()->noContent();
    }
}
