<?php

use App\Modules\Employees\Presentation\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.auth')->group(function () {
    Route::get('/v1/usuarios/{id}', [UsuarioController::class, 'show']);
    Route::match(['post', 'patch'], '/v1/usuarios/{id}/perfil', [UsuarioController::class, 'updatePerfil']);
});
