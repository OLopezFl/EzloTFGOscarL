<?php

use App\Modules\Admin\Presentation\Http\Controllers\AnaliticaController;
use App\Modules\Admin\Presentation\Http\Controllers\DashboardController;
use App\Modules\Employees\Presentation\Http\Controllers\UsuarioController;
use App\Modules\PublicSite\Presentation\Http\Controllers\FormularioController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/calendar', [DashboardController::class, 'calendar']);

    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::post('/usuarios', [UsuarioController::class, 'store']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);

    Route::get('/analitica/eficiencia-empleados', [AnaliticaController::class, 'eficienciaPorEmpleado']);
    Route::get('/analitica/desviacion-clientes', [AnaliticaController::class, 'desviacionPorClienteUbicacion']);

    Route::get('/formularios', [FormularioController::class, 'index']);
    Route::patch('/formularios/{id}/estado', [FormularioController::class, 'updateEstado']);
    Route::delete('/formularios/{id}', [FormularioController::class, 'destroy']);
});
