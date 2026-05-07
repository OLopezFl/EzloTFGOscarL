<?php

use App\Modules\Clients\Presentation\Http\Controllers\ClienteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::get('/v1/clientes', [ClienteController::class, 'index']);
    Route::post('/v1/clientes', [ClienteController::class, 'store']);
    Route::put('/v1/clientes/{id}', [ClienteController::class, 'update']);
    Route::delete('/v1/clientes/{id}', [ClienteController::class, 'destroy']);
});
