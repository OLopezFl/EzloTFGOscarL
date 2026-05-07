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

    public function storeFromPlantilla(Request $request, int $plantillaId): JsonResponse
    {
        $request->merge(['id_plantilla' => $plantillaId]);

        return $this->trabajos->storeFromPlantilla($request);
    }

    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        if ($user && $user->rol === 'Admin') {
            return $this->trabajos->updateEstado($request, $id);
        }

        $validated = $request->validate([
            'estado' => ['required', 'string', 'in:en_curso,pausado,finalizado'],
        ]);

        $estadoNuevo = $validated['estado'];
        $trabajo = \App\Modules\WorkOrders\Domain\Models\Trabajo::findOrFail($id);
        $estadoActual = strtolower((string) $trabajo->estado);

        if ($estadoNuevo === 'en_curso') {
            if ($estadoActual === 'pausado') {
                return $this->trabajos->reanudarTrabajo($request, $id);
            }

            return $this->trabajos->iniciarTrabajo($request, $id);
        }

        if ($estadoNuevo === 'pausado') {
            return $this->trabajos->pausarTrabajo($request, $id);
        }

        return $this->trabajos->finalizarTrabajo($request, $id);
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