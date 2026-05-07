<?php

use App\Modules\PublicSite\Presentation\Http\Controllers\FormularioController;
use Illuminate\Support\Facades\Route;

Route::post('/api/v1/formularios', [FormularioController::class, 'store'])->middleware('throttle:8,1');
