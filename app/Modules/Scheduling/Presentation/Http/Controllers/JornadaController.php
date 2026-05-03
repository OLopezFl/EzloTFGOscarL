<?php

declare(strict_types=1);

namespace App\Modules\Scheduling\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Scheduling\Application\JornadaApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JornadaController extends Controller
{
    public function __construct(private readonly JornadaApplicationService $jornadas) {}

    public function iniciarJornada(Request $request): JsonResponse
    {
        return $this->jornadas->iniciarJornada($request);
    }

    public function finalizarJornada(Request $request): JsonResponse
    {
        return $this->jornadas->finalizarJornada($request);
    }

    public function editarJornadaAdmin(Request $request, int $id): JsonResponse
    {
        return $this->jornadas->editarJornadaAdmin($request, $id);
    }

    public function actual(Request $request): JsonResponse
    {
        return $this->jornadas->actual($request);
    }

    public function auditoria(Request $request): JsonResponse
    {
        return $this->jornadas->auditoria($request);
    }
}
