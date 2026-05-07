<?php

use App\Modules\Admin\Presentation\Http\Controllers\AnaliticaController;
use App\Modules\Admin\Presentation\Http\Controllers\DashboardController;
use App\Modules\Employees\Presentation\Http\Controllers\UsuarioController;
use App\Modules\PublicSite\Presentation\Http\Controllers\FormularioController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::get('/api/v1/dashboard/resumen', [DashboardController::class, 'summary']);
    Route::get('/api/v1/dashboard/estadisticas', [DashboardController::class, 'stats']);
    Route::get('/api/v1/dashboard/calendario', [DashboardController::class, 'calendar']);

    Route::get('/api/v1/usuarios', [UsuarioController::class, 'index']);
    Route::post('/api/v1/usuarios', [UsuarioController::class, 'store']);
    Route::put('/api/v1/usuarios/{id}', [UsuarioController::class, 'update']);
    Route::delete('/api/v1/usuarios/{id}', [UsuarioController::class, 'destroy']);

    Route::get('/api/v1/analiticas/eficiencia-empleados', [AnaliticaController::class, 'eficienciaPorEmpleado']);
    Route::get('/api/v1/analiticas/desviacion-clientes', [AnaliticaController::class, 'desviacionPorClienteUbicacion']);

    Route::get('/api/v1/formularios', [FormularioController::class, 'index']);
    Route::patch('/api/v1/formularios/{id}/estado', [FormularioController::class, 'updateEstado']);
    Route::delete('/api/v1/formularios/{id}', [FormularioController::class, 'destroy']);
});
