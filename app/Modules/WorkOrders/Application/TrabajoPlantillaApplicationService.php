<?php

namespace App\Modules\WorkOrders\Application;

use App\Modules\WorkOrders\Domain\Models\TrabajoPlantilla;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrabajoPlantillaApplicationService
{
    public function index(): JsonResponse
    {
        $plantillas = TrabajoPlantilla::query()
            ->select([
                'id_plantilla',
                'nombre',
                'id_cliente',
                'descripcion_tarea',
                'duracion_minutos',
                'personas_requeridas',
                'dia_semana',
                'ubicacion',
                'observaciones',
                'activa',
            ])
            ->with('cliente:id_cliente,nombre')
            ->orderBy('nombre')
            ->get();

        return response()->json($plantillas);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:140'],
            'id_cliente' => ['required', 'exists:clientes,id_cliente'],
            'descripcion_tarea' => ['required', 'string', 'max:1000'],
            'duracion_minutos' => ['nullable', 'integer', 'min:15', 'max:720'],
            'personas_requeridas' => ['nullable', 'integer', 'min:1', 'max:10'],
            'dia_semana' => ['nullable', 'integer', 'between:0,6'],
            'ubicacion' => ['nullable', 'string', 'max:180'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'activa' => ['nullable', 'boolean'],
        ]);

        $duration = (int) ($validated['duracion_minutos'] ?? 60);
        if ($duration % 15 !== 0) {
            return response()->json([
                'message' => 'La duracion debe ser multiplo de 15 minutos.',
            ], 422);
        }

        $plantilla = TrabajoPlantilla::create([
            'nombre' => $validated['nombre'],
            'id_cliente' => $validated['id_cliente'],
            'descripcion_tarea' => $validated['descripcion_tarea'],
            'duracion_minutos' => $duration,
            'personas_requeridas' => $validated['personas_requeridas'] ?? null,
            'dia_semana' => array_key_exists('dia_semana', $validated) ? $validated['dia_semana'] : null,
            'ubicacion' => $validated['ubicacion'] ?? null,
            'observaciones' => $validated['observaciones'] ?? null,
            'activa' => array_key_exists('activa', $validated) ? (bool) $validated['activa'] : true,
        ]);

        return response()->json($plantilla->load('cliente:id_cliente,nombre'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $plantilla = TrabajoPlantilla::findOrFail($id);

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:140'],
            'id_cliente' => ['required', 'exists:clientes,id_cliente'],
            'descripcion_tarea' => ['required', 'string', 'max:1000'],
            'duracion_minutos' => ['nullable', 'integer', 'min:15', 'max:720'],
            'personas_requeridas' => ['nullable', 'integer', 'min:1', 'max:10'],
            'dia_semana' => ['nullable', 'integer', 'between:0,6'],
            'ubicacion' => ['nullable', 'string', 'max:180'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'activa' => ['nullable', 'boolean'],
        ]);

        $duration = (int) ($validated['duracion_minutos'] ?? $plantilla->duracion_minutos ?? 60);
        if ($duration % 15 !== 0) {
            return response()->json([
                'message' => 'La duracion debe ser multiplo de 15 minutos.',
            ], 422);
        }

        $plantilla->update([
            'nombre' => $validated['nombre'],
            'id_cliente' => $validated['id_cliente'],
            'descripcion_tarea' => $validated['descripcion_tarea'],
            'duracion_minutos' => $duration,
            'personas_requeridas' => $validated['personas_requeridas'] ?? null,
            'dia_semana' => array_key_exists('dia_semana', $validated) ? $validated['dia_semana'] : null,
            'ubicacion' => $validated['ubicacion'] ?? null,
            'observaciones' => $validated['observaciones'] ?? null,
            'activa' => array_key_exists('activa', $validated) ? (bool) $validated['activa'] : $plantilla->activa,
        ]);

        return response()->json($plantilla->load('cliente:id_cliente,nombre'));
    }

    public function destroy(int $id): JsonResponse
    {
        $plantilla = TrabajoPlantilla::findOrFail($id);
        $plantilla->delete();

        return response()->json(['message' => 'Plantilla eliminada']);
    }
}