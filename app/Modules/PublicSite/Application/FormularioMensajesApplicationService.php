<?php

declare(strict_types=1);

namespace App\Modules\PublicSite\Application;

use App\Modules\PublicSite\Domain\Ports\FormularioMensajesPort;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class FormularioMensajesApplicationService
{
    public function __construct(private readonly FormularioMensajesPort $mensajes) {}

    public function index(Request $request): JsonResponse
    {
        $estado = $request->filled('estado') ? (string) $request->input('estado') : null;
        $q = $request->filled('q') ? (string) $request->input('q') : null;

        return response()->json($this->mensajes->filteredList($estado, $q));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'remitente_nombre' => ['required', 'string', 'max:120'],
            'remitente_email' => ['required', 'email', 'max:120'],
            'cuerpo_mensaje' => ['required', 'string', 'max:3000'],
            'fecha_recepcion' => ['nullable', 'date'],
            'estado' => ['nullable', 'in:Leído,Pendiente'],
        ]);

        $formulario = $this->mensajes->create($validated);

        return response()->json($formulario, 201);
    }

    public function updateEstado(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'estado' => ['required', 'in:Leído,Pendiente'],
        ]);

        $formulario = $this->mensajes->updateEstado($id, $validated['estado']);

        return response()->json($formulario);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->mensajes->deleteById($id);

        return response()->json([
            'message' => 'Mensaje eliminado.',
        ]);
    }
}
