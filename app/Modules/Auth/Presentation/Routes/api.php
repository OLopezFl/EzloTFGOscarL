<?php

use App\Modules\Auth\Presentation\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/v1/sesiones', [AuthController::class, 'login'])->middleware('throttle:login');
