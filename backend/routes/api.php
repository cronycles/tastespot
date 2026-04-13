<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\ActivityTypeController;
use App\Http\Controllers\Api\GeoController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\PhotoController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── Health check ───────────────────────────────────────────────────────────
    Route::get('/ping', fn () => response()->json(['status' => 'ok', 'version' => '1.0.4']));
    Route::get('/photos/{user}/{filename}', [PhotoController::class, 'show'])
        ->whereNumber('user')
        ->where('filename', '.*');

    // ── Auth pubblico ──────────────────────────────────────────────────────────
    Route::get('/auth/settings', [AuthController::class, 'settings']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login',    [AuthController::class, 'login']);
    Route::get('/geo/search', [GeoController::class, 'search']);
    Route::get('/geo/reverse', [GeoController::class, 'reverse']);

    // ── Route protette ─────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

        // Tipologie
        Route::get('/types',           [ActivityTypeController::class, 'index']);
        Route::post('/types',          [ActivityTypeController::class, 'store']);
        Route::post('/types/reorder',  [ActivityTypeController::class, 'reorder']); // prima di {type}
        Route::put('/types/{type}',    [ActivityTypeController::class, 'update']);
        Route::delete('/types/{type}', [ActivityTypeController::class, 'destroy']);

        // Attività
        Route::get('/activities',                        [ActivityController::class, 'index']);
        Route::post('/activities',                       [ActivityController::class, 'store']);
        Route::get('/activities/{activity}',             [ActivityController::class, 'show']);
        Route::put('/activities/{activity}',             [ActivityController::class, 'update']);
        Route::delete('/activities/{activity}',          [ActivityController::class, 'destroy']);
        Route::post('/activities/{activity}/favorite',   [ActivityController::class, 'toggleFavorite']);
        Route::put('/activities/{activity}/viewed',      [ActivityController::class, 'markViewed']);

        // Recensioni
        Route::get('/activities/{activity}/reviews', [ReviewController::class, 'forActivity']);
        Route::post('/reviews',                      [ReviewController::class, 'upsert']);

        // Foto
        Route::post('/activities/{activity}/photos', [PhotoController::class, 'store']);
        Route::delete('/photos/{photo}',             [PhotoController::class, 'destroy']);
    });
});
