<?php

use App\Modules\Employees\Presentation\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.auth')->group(function () {
    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
    Route::post('/usuarios/{id}/perfil', [UsuarioController::class, 'updatePerfil']);
});
