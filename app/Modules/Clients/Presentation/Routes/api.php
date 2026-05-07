<?php

use App\Modules\Clients\Presentation\Http\Controllers\ClienteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::get('/api/v1/clientes', [ClienteController::class, 'index']);
    Route::post('/api/v1/clientes', [ClienteController::class, 'store']);
    Route::put('/api/v1/clientes/{id}', [ClienteController::class, 'update']);
    Route::delete('/api/v1/clientes/{id}', [ClienteController::class, 'destroy']);
});
