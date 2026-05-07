<?php

use App\Modules\Scheduling\Presentation\Http\Controllers\JornadaController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.auth')->group(function () {
    Route::post('/api/v1/jornadas', [JornadaController::class, 'iniciarJornada']);
    Route::patch('/api/v1/jornadas/activa', [JornadaController::class, 'finalizarJornada']);
    Route::get('/api/v1/jornadas/activa', [JornadaController::class, 'actual']);
});

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::put('/api/v1/jornadas/{id}', [JornadaController::class, 'editarJornadaAdmin']);
    Route::get('/api/v1/jornadas/auditorias', [JornadaController::class, 'auditoria']);
});
