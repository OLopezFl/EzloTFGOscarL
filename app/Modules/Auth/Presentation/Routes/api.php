<?php

use App\Modules\Auth\Presentation\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/api/v1/sesiones', [AuthController::class, 'login'])->middleware('throttle:login');
