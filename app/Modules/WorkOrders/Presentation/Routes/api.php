<?php

use App\Modules\WorkOrders\Presentation\Http\Controllers\TrabajoController;
use App\Modules\WorkOrders\Presentation\Http\Controllers\TrabajoPlantillaController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.auth')->group(function () {
    Route::get('/api/v1/trabajos', [TrabajoController::class, 'index']);
    Route::patch('/api/v1/trabajos/{id}/estado', [TrabajoController::class, 'cambiarEstado']);
    Route::patch('/api/v1/trabajos/{id}/agenda', [TrabajoController::class, 'updateAgenda']);
});

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::post('/api/v1/trabajos', [TrabajoController::class, 'store']);
    Route::post('/api/v1/trabajos-plantillas/{plantillaId}/trabajos', [TrabajoController::class, 'storeFromPlantilla']);
    Route::get('/api/v1/trabajos/auditorias', [TrabajoController::class, 'auditoriaAjustes']);
    Route::put('/api/v1/trabajos/{id}', [TrabajoController::class, 'update']);
    Route::patch('/api/v1/trabajos/{id}/retraso', [TrabajoController::class, 'updateRetraso']);
    Route::delete('/api/v1/trabajos/{id}', [TrabajoController::class, 'destroy']);

    Route::get('/api/v1/trabajos-plantillas', [TrabajoPlantillaController::class, 'index']);
    Route::post('/api/v1/trabajos-plantillas', [TrabajoPlantillaController::class, 'store']);
    Route::put('/api/v1/trabajos-plantillas/{id}', [TrabajoPlantillaController::class, 'update']);
    Route::delete('/api/v1/trabajos-plantillas/{id}', [TrabajoPlantillaController::class, 'destroy']);
});
