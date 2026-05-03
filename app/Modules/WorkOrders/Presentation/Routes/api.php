<?php

use App\Modules\WorkOrders\Presentation\Http\Controllers\TrabajoController;
use App\Modules\WorkOrders\Presentation\Http\Controllers\TrabajoPlantillaController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.auth')->group(function () {
    Route::get('/trabajos', [TrabajoController::class, 'index']);
    Route::post('/trabajos/{id}/iniciar', [TrabajoController::class, 'iniciarTrabajo']);
    Route::post('/trabajos/{id}/pausar', [TrabajoController::class, 'pausarTrabajo']);
    Route::post('/trabajos/{id}/reanudar', [TrabajoController::class, 'reanudarTrabajo']);
    Route::post('/trabajos/{id}/finalizar', [TrabajoController::class, 'finalizarTrabajo']);
});

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::post('/trabajos', [TrabajoController::class, 'store']);
    Route::post('/trabajos/desde-plantilla', [TrabajoController::class, 'storeFromPlantilla']);
    Route::get('/trabajos/auditoria-ajustes', [TrabajoController::class, 'auditoriaAjustes']);
    Route::put('/trabajos/{id}', [TrabajoController::class, 'update']);
    Route::patch('/trabajos/{id}/estado', [TrabajoController::class, 'updateEstado']);
    Route::patch('/trabajos/{id}/retraso', [TrabajoController::class, 'updateRetraso']);
    Route::patch('/trabajos/{id}/agenda', [TrabajoController::class, 'updateAgenda']);
    Route::delete('/trabajos/{id}', [TrabajoController::class, 'destroy']);

    Route::get('/trabajos-plantillas', [TrabajoPlantillaController::class, 'index']);
    Route::post('/trabajos-plantillas', [TrabajoPlantillaController::class, 'store']);
    Route::put('/trabajos-plantillas/{id}', [TrabajoPlantillaController::class, 'update']);
    Route::delete('/trabajos-plantillas/{id}', [TrabajoPlantillaController::class, 'destroy']);
});
