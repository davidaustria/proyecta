<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBusinessGroupRequest;
use App\Http\Requests\UpdateBusinessGroupRequest;
use App\Http\Resources\BusinessGroupResource;
use App\Models\BusinessGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class BusinessGroupController extends Controller
{
    /**
     * Display a listing of business groups.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = BusinessGroup::query()->withCount('customers');

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
        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $businessGroups = $query->paginate($perPage);

        return BusinessGroupResource::collection($businessGroups);
    }

    /**
     * Store a newly created business group.
     */
    public function store(StoreBusinessGroupRequest $request): BusinessGroupResource
    {
        $businessGroup = BusinessGroup::create([
            ...$request->validated(),
            'organization_id' => auth()->user()->organization_id,
        ]);

        return new BusinessGroupResource($businessGroup);
    }

    /**
     * Display the specified business group.
     */
    public function show(BusinessGroup $businessGroup): BusinessGroupResource
    {
        $businessGroup->loadCount('customers');

        return new BusinessGroupResource($businessGroup);
    }

    /**
     * Update the specified business group.
     */
    public function update(UpdateBusinessGroupRequest $request, BusinessGroup $businessGroup): BusinessGroupResource
    {
        $businessGroup->update($request->validated());

        return new BusinessGroupResource($businessGroup);
    }

    /**
     * Remove the specified business group.
     */
    public function destroy(BusinessGroup $businessGroup): Response
    {
        $businessGroup->delete();

        return response()->noContent();
    }
}
