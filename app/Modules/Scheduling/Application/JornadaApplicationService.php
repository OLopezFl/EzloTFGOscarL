<?php

namespace App\Modules\Scheduling\Application;

use App\Modules\Scheduling\Domain\Models\RegistroJornada;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JornadaApplicationService
{
    private function authenticatedUser(Request $request)
    {
        return $request->attributes->get('auth_user');
    }

    private function resolveEmpleadoId(Request $request): int
    {
        $authUser = $this->authenticatedUser($request);
        if ($authUser && $authUser->rol === 'Empleado') {
            return (int) $authUser->id_usuario;
        }

        $validated = $request->validate([
            'empleado_id' => ['required', 'exists:usuarios,id_usuario'],
        ]);

        return (int) $validated['empleado_id'];
    }

    public function iniciarJornada(Request $request): JsonResponse
    {
        $empleadoId = $this->resolveEmpleadoId($request);

        $now = Carbon::now();
        $today = $now->toDateString();

        $open = RegistroJornada::query()
            ->where('empleado_id', $empleadoId)
            ->where('fecha', $today)
            ->whereNull('hora_fin')
            ->first();

        if ($open) {
            return response()->json([
                'message' => 'Ya existe una jornada abierta para hoy.',
                'registro' => $this->toPayload($open),
            ], 422);
        }

        $registro = RegistroJornada::create([
            'empleado_id' => $empleadoId,
            'fecha' => $today,
            'hora_inicio' => $now,
            'hora_fin' => null,
            'modificado_por_admin' => false,
            'motivo_modificacion_admin' => null,
        ]);

        return response()->json([
            'message' => 'Jornada iniciada correctamente.',
            'registro' => $this->toPayload($registro->load('empleado:id_usuario,nombre,apellidos,username')),
        ], 201);
    }

    public function finalizarJornada(Request $request): JsonResponse
    {
        $empleadoId = $this->resolveEmpleadoId($request);

        $registro = RegistroJornada::query()
            ->where('empleado_id', $empleadoId)
            ->whereNull('hora_fin')
            ->orderByDesc('hora_inicio')
            ->first();

        if (! $registro) {
            return response()->json([
                'message' => 'No hay una jornada abierta para finalizar.',
            ], 422);
        }

        $registro->update([
            'hora_fin' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Jornada finalizada correctamente.',
            'registro' => $this->toPayload($registro->fresh()->load('empleado:id_usuario,nombre,apellidos,username')),
        ]);
    }

    public function editarJornadaAdmin(Request $request, int $id): JsonResponse
    {
        $registro = RegistroJornada::findOrFail($id);

        $validated = $request->validate([
            'hora_inicio' => ['required', 'date'],
            'hora_fin' => ['nullable', 'date', 'after_or_equal:hora_inicio'],
            'motivo_modificacion_admin' => ['required', 'string', 'min:6', 'max:2000'],
        ]);

        $inicio = Carbon::parse($validated['hora_inicio']);
        $fin = ! empty($validated['hora_fin']) ? Carbon::parse($validated['hora_fin']) : null;

        $registro->update([
            'fecha' => $inicio->toDateString(),
            'hora_inicio' => $inicio,
            'hora_fin' => $fin,
            'modificado_por_admin' => true,
            'motivo_modificacion_admin' => $validated['motivo_modificacion_admin'],
        ]);

        return response()->json([
            'message' => 'Jornada editada por administrador.',
            'registro' => $this->toPayload($registro->fresh()->load('empleado:id_usuario,nombre,apellidos,username')),
        ]);
    }

    public function actual(Request $request): JsonResponse
    {
        $empleadoId = $this->resolveEmpleadoId($request);

        $registro = RegistroJornada::query()
            ->where('empleado_id', $empleadoId)
            ->whereNull('hora_fin')
            ->orderByDesc('hora_inicio')
            ->first();

        return response()->json([
            'registro' => $registro ? $this->toPayload($registro) : null,
        ]);
    }

    public function auditoria(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date', 'after_or_equal:desde'],
            'empleado_id' => ['nullable', 'exists:usuarios,id_usuario'],
        ]);

        $query = RegistroJornada::query()
            ->with('empleado:id_usuario,nombre,apellidos,username')
            ->orderByDesc('fecha')
            ->orderByDesc('hora_inicio');

        if (! empty($validated['desde'])) {
            $query->whereDate('fecha', '>=', $validated['desde']);
        }

        if (! empty($validated['hasta'])) {
            $query->whereDate('fecha', '<=', $validated['hasta']);
        }

        if (! empty($validated['empleado_id'])) {
            $query->where('empleado_id', $validated['empleado_id']);
        }

        $rows = $query->limit(500)->get()->map(function (RegistroJornada $registro) {
            return $this->toPayload($registro);
        });

        return response()->json($rows);
    }

    private function toPayload(RegistroJornada $registro): array
    {
        return [
            'id_registro_jornada' => $registro->id_registro_jornada,
            'empleado_id' => $registro->empleado_id,
            'fecha' => optional($registro->fecha)?->toDateString(),
            'hora_inicio' => optional($registro->hora_inicio)?->toIso8601String(),
            'hora_fin' => optional($registro->hora_fin)?->toIso8601String(),
            'modificado_por_admin' => (bool) $registro->modificado_por_admin,
            'motivo_modificacion_admin' => $registro->motivo_modificacion_admin,
            'empleado' => $registro->empleado,
        ];
    }
}