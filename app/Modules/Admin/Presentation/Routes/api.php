<?php

use App\Modules\Admin\Presentation\Http\Controllers\AnaliticaController;
use App\Modules\Admin\Presentation\Http\Controllers\DashboardController;
use App\Modules\Employees\Presentation\Http\Controllers\UsuarioController;
use App\Modules\PublicSite\Presentation\Http\Controllers\FormularioController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::get('/v1/dashboard/resumen', [DashboardController::class, 'summary']);
    Route::get('/v1/dashboard/estadisticas', [DashboardController::class, 'stats']);
    Route::get('/v1/dashboard/calendario', [DashboardController::class, 'calendar']);

    Route::get('/v1/usuarios', [UsuarioController::class, 'index']);
    Route::post('/v1/usuarios', [UsuarioController::class, 'store']);
    Route::put('/v1/usuarios/{id}', [UsuarioController::class, 'update']);
    Route::delete('/v1/usuarios/{id}', [UsuarioController::class, 'destroy']);

    Route::get('/v1/analiticas/eficiencia-empleados', [AnaliticaController::class, 'eficienciaPorEmpleado']);
    Route::get('/v1/analiticas/desviacion-clientes', [AnaliticaController::class, 'desviacionPorClienteUbicacion']);

    Route::get('/v1/formularios', [FormularioController::class, 'index']);
    Route::patch('/v1/formularios/{id}/estado', [FormularioController::class, 'updateEstado']);
    Route::delete('/v1/formularios/{id}', [FormularioController::class, 'destroy']);
});
