<?php

use App\Modules\Scheduling\Presentation\Http\Controllers\JornadaController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.auth')->group(function () {
    Route::post('/jornada/iniciar', [JornadaController::class, 'iniciarJornada']);
    Route::post('/jornada/finalizar', [JornadaController::class, 'finalizarJornada']);
    Route::get('/jornada/actual', [JornadaController::class, 'actual']);
});

Route::middleware(['api.auth', 'role:Admin'])->group(function () {
    Route::put('/jornada/{id}/admin', [JornadaController::class, 'editarJornadaAdmin']);
    Route::get('/jornada/auditoria', [JornadaController::class, 'auditoria']);
});
