<?php

use App\Modules\Clients\Presentation\Http\Controllers\ClienteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::get('/clientes', [ClienteController::class, 'index']);
    Route::post('/clientes', [ClienteController::class, 'store']);
    Route::put('/clientes/{id}', [ClienteController::class, 'update']);
    Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);
});
