<?php

declare(strict_types=1);

namespace App\Modules\Admin\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admin\Application\AnaliticaApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnaliticaController extends Controller
{
    public function __construct(private readonly AnaliticaApplicationService $analitica) {}

    public function eficienciaPorEmpleado(Request $request): JsonResponse
    {
        return $this->analitica->eficienciaPorEmpleado($request);
    }

    public function desviacionPorClienteUbicacion(Request $request): JsonResponse
    {
        return $this->analitica->desviacionPorClienteUbicacion($request);
    }
}
