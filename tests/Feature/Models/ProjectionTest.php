<?php

use App\Models\Projection;
use App\Models\ProjectionDetail;
use App\Models\Scenario;

test('projection belongs to scenario', function () {
    $scenario = Scenario::factory()->create();
    $projection = Projection::factory()->forScenario($scenario)->create();

    expect($projection->scenario)->toBeInstanceOf(Scenario::class)
        ->and($projection->scenario->id)->toBe($scenario->id);
});

test('projection has many monthly details', function () {
    $projection = Projection::factory()->create();

    foreach (range(1, 12) as $month) {
        ProjectionDetail::factory()->forProjection($projection)->forMonth($month)->create();
    }

    expect($projection->details)->toHaveCount(12)
        ->and($projection->details->first())->toBeInstanceOf(ProjectionDetail::class);
});

test('projection detail month must be unique per projection', function () {
    $projection = Projection::factory()->create();
    ProjectionDetail::factory()->forProjection($projection)->forMonth(1)->create();

    expect(fn () => ProjectionDetail::factory()->forProjection($projection)->forMonth(1)->create())
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('deleting projection cascades to projection details', function () {
    $projection = Projection::factory()->create();
    $detail = ProjectionDetail::factory()->forProjection($projection)->create();
    $detailId = $detail->id;

    $projection->delete();

    expect(ProjectionDetail::find($detailId))->toBeNull();
});

test('projection uses soft deletes', function () {
    $projection = Projection::factory()->create();
    $id = $projection->id;

    $projection->delete();

    expect(Projection::find($id))->toBeNull()
        ->and(Projection::withTrashed()->find($id))->not->toBeNull();
});
