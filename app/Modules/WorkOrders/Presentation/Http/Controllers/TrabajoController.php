<?php

declare(strict_types=1);

namespace App\Modules\WorkOrders\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\WorkOrders\Application\TrabajoApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrabajoController extends Controller
{
    public function __construct(private readonly TrabajoApplicationService $trabajos) {}

    public function index(Request $request): JsonResponse
    {
        return $this->trabajos->index($request);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->trabajos->store($request);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->update($request, $id);
    }

    public function updateEstado(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->updateEstado($request, $id);
    }

    public function updateAgenda(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->updateAgenda($request, $id);
    }

    public function storeFromPlantilla(Request $request): JsonResponse
    {
        return $this->trabajos->storeFromPlantilla($request);
    }

    public function destroy(int $id): JsonResponse
    {
        return $this->trabajos->destroy($id);
    }

    public function updateRetraso(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->updateRetraso($request, $id);
    }

    public function auditoriaAjustes(Request $request): JsonResponse
    {
        return $this->trabajos->auditoriaAjustes($request);
    }

    public function iniciarTrabajo(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->iniciarTrabajo($request, $id);
    }

    public function pausarTrabajo(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->pausarTrabajo($request, $id);
    }

    public function reanudarTrabajo(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->reanudarTrabajo($request, $id);
    }

    public function finalizarTrabajo(Request $request, int $id): JsonResponse
    {
        return $this->trabajos->finalizarTrabajo($request, $id);
    }
}