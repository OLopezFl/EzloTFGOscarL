<?php

namespace App\Modules\WorkOrders\Application;

use App\Modules\WorkOrders\Domain\Models\RegistroAuditoriaTrabajo;
use App\Modules\WorkOrders\Domain\Models\RegistroPausaTrabajo;
use App\Modules\WorkOrders\Domain\Models\Trabajo;
use App\Modules\WorkOrders\Domain\Models\TrabajoAsignacion;
use App\Modules\WorkOrders\Domain\Models\TrabajoPlantilla;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrabajoApplicationService
{
    private function authenticatedUser(Request $request)
    {
        return $request->attributes->get('auth_user');
    }

    private function trabajoRelations(): array
    {
        return [
            'cliente:id_cliente,nombre,direccion',
            'plantilla:id_plantilla,nombre',
            'empleado:id_usuario,username,rol',
            'asignaciones' => function ($builder) {
                $builder->select(['id_asignacion', 'id_trabajo', 'id_empleado', 'fecha_inicio', 'fecha_fin'])
                    ->orderBy('fecha_inicio');
            },
            'asignaciones.empleado:id_usuario,username,rol',
            'pausas' => function ($builder) {
                $builder->select(['id_registro_pausa', 'id_trabajo', 'inicio_pausa', 'fin_pausa'])
                    ->orderBy('inicio_pausa');
            },
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $authUser = $this->authenticatedUser($request);

        $query = Trabajo::query()
            ->select([
                'id_trabajo',
                'id_cliente',
                'id_plantilla',
                'id_empleado',
                'fecha_inicio',
                'fecha_fin',
                'inicio_operativo',
                'fin_operativo',
                'descripcion_tarea',
                'duracion_minutos',
                'tiempo_estimado',
                'tiempo_real_efectivo',
                'personas_requeridas',
                'dia_semana',
                'ubicacion',
                'observaciones',
                'notas_empleado',
                'estado',
            ])
            ->with([
                'cliente:id_cliente,nombre,direccion',
                'plantilla:id_plantilla,nombre',
                'empleado:id_usuario,username,rol',
                'asignaciones' => function ($builder) {
                    $builder->select(['id_asignacion', 'id_trabajo', 'id_empleado', 'fecha_inicio', 'fecha_fin'])
                        ->orderBy('fecha_inicio');
                },
                'asignaciones.empleado:id_usuario,username,rol',
                'pausas' => function ($builder) {
                    $builder->select(['id_registro_pausa', 'id_trabajo', 'inicio_pausa', 'fin_pausa'])
                        ->orderBy('inicio_pausa');
                },
            ]);

        if ($authUser && $authUser->rol === 'Empleado') {
            $employeeId = (int) $authUser->id_usuario;
            $query->where(function ($builder) use ($employeeId) {
                $builder->where('id_empleado', $employeeId)
                    ->orWhereHas('asignaciones', function ($asignaciones) use ($employeeId) {
                        $asignaciones->where('id_empleado', $employeeId);
                    });
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $this->normalizeEstado((string) $request->string('estado')));
        }

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->whereHas('cliente', function ($builder) use ($q) {
                $builder->where('nombre', 'like', '%'.$q.'%');
            });
        }

        $trabajos = $query->orderByRaw('fecha_inicio IS NULL, fecha_inicio asc')->get();

        $payload = $trabajos->map(function (Trabajo $trabajo) {
            $requeridas = $trabajo->personas_requeridas ?? 1;
            $asignadas = $trabajo->asignaciones->count();

            return [
                'id_trabajo' => $trabajo->id_trabajo,
                'id_cliente' => $trabajo->id_cliente,
                'id_plantilla' => $trabajo->id_plantilla,
                'id_empleado' => $trabajo->id_empleado,
                'fecha_inicio' => optional($trabajo->fecha_inicio)?->toIso8601String(),
                'fecha_fin' => optional($trabajo->fecha_fin)?->toIso8601String(),
                'inicio_operativo' => optional($trabajo->inicio_operativo)?->toIso8601String(),
                'fin_operativo' => optional($trabajo->fin_operativo)?->toIso8601String(),
                'descripcion_tarea' => $trabajo->descripcion_tarea,
                'duracion_minutos' => $trabajo->duracion_minutos,
                'tiempo_estimado' => $trabajo->tiempo_estimado,
                'tiempo_real_efectivo' => $trabajo->tiempo_real_efectivo,
                'personas_requeridas' => $trabajo->personas_requeridas,
                'dia_semana' => $trabajo->dia_semana,
                'ubicacion' => $trabajo->ubicacion,
                'observaciones' => $trabajo->observaciones,
                'notas_empleado' => $trabajo->notas_empleado,
                'personas_requeridas_resuelta' => $requeridas,
                'personas_asignadas' => $asignadas,
                'pendiente_asignacion' => $asignadas < $requeridas,
                'estado' => $this->normalizeEstado($trabajo->estado),
                'cliente' => $trabajo->cliente,
                'plantilla' => $trabajo->plantilla,
                'empleado' => $trabajo->empleado,
                'asignaciones' => $trabajo->asignaciones,
                'pausas' => $trabajo->pausas,
            ];
        });

        return response()->json($payload);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_cliente' => ['required', 'exists:clientes,id_cliente'],
            'id_plantilla' => ['nullable', 'exists:trabajo_plantillas,id_plantilla'],
            'id_empleado' => ['nullable', 'exists:usuarios,id_usuario'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'descripcion_tarea' => ['required', 'string', 'max:1000'],
            'duracion_minutos' => ['nullable', 'integer', 'min:15', 'max:720'],
            'tiempo_estimado' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'personas_requeridas' => ['nullable', 'integer', 'min:1', 'max:10'],
            'dia_semana' => ['nullable', 'integer', 'between:0,6'],
            'ubicacion' => ['nullable', 'string', 'max:180'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'estado' => ['nullable', 'in:pendiente,en_curso,pausado,finalizado,Programado,Completado'],
        ]);

        $duration = $validated['duracion_minutos'] ?? 60;
        if ($duration % 15 !== 0) {
            return response()->json([
                'message' => 'La duracion debe ser multiplo de 15 minutos.',
            ], 422);
        }

        $trabajo = Trabajo::create([
            'id_cliente' => $validated['id_cliente'],
            'id_plantilla' => $validated['id_plantilla'] ?? null,
            'id_empleado' => $validated['id_empleado'] ?? null,
            'fecha_inicio' => $validated['fecha_inicio'] ?? null,
            'fecha_fin' => $validated['fecha_fin'] ?? null,
            'descripcion_tarea' => $validated['descripcion_tarea'],
            'duracion_minutos' => $duration,
            'tiempo_estimado' => (int) ($validated['tiempo_estimado'] ?? $duration),
            'personas_requeridas' => $validated['personas_requeridas'] ?? null,
            'dia_semana' => array_key_exists('dia_semana', $validated) ? $validated['dia_semana'] : null,
            'ubicacion' => $validated['ubicacion'] ?? null,
            'observaciones' => $validated['observaciones'] ?? null,
            'estado' => $this->normalizeEstado($validated['estado'] ?? 'pendiente'),
        ]);

        if (! empty($validated['id_empleado']) && ! empty($validated['fecha_inicio'])) {
            $start = Carbon::parse($validated['fecha_inicio']);
            $end = ! empty($validated['fecha_fin'])
                ? Carbon::parse($validated['fecha_fin'])
                : (clone $start)->addMinutes($duration);

            TrabajoAsignacion::create([
                'id_trabajo' => $trabajo->id_trabajo,
                'id_empleado' => $validated['id_empleado'],
                'fecha_inicio' => $start,
                'fecha_fin' => $end,
            ]);
            $this->syncLegacyFields($trabajo);
        }

        return response()->json($trabajo->load($this->trabajoRelations()), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);

        $validated = $request->validate([
            'id_cliente' => ['required', 'exists:clientes,id_cliente'],
            'id_plantilla' => ['nullable', 'exists:trabajo_plantillas,id_plantilla'],
            'id_empleado' => ['nullable', 'exists:usuarios,id_usuario'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'descripcion_tarea' => ['required', 'string', 'max:1000'],
            'duracion_minutos' => ['nullable', 'integer', 'min:15', 'max:720'],
            'tiempo_estimado' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'personas_requeridas' => ['nullable', 'integer', 'min:1', 'max:10'],
            'dia_semana' => ['nullable', 'integer', 'between:0,6'],
            'ubicacion' => ['nullable', 'string', 'max:180'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'notas_empleado' => ['nullable', 'string', 'max:2000'],
            'estado' => ['required', 'in:pendiente,en_curso,pausado,finalizado,Programado,Completado'],
        ]);

        $duration = $validated['duracion_minutos'] ?? $trabajo->duracion_minutos ?? 60;
        if ($duration % 15 !== 0) {
            return response()->json([
                'message' => 'La duracion debe ser multiplo de 15 minutos.',
            ], 422);
        }

        $trabajo->update([
            'id_cliente' => $validated['id_cliente'],
            'id_plantilla' => $validated['id_plantilla'] ?? null,
            'id_empleado' => $validated['id_empleado'] ?? null,
            'fecha_inicio' => $validated['fecha_inicio'] ?? null,
            'fecha_fin' => $validated['fecha_fin'] ?? null,
            'descripcion_tarea' => $validated['descripcion_tarea'],
            'duracion_minutos' => $duration,
            'tiempo_estimado' => (int) ($validated['tiempo_estimado'] ?? $trabajo->tiempo_estimado ?? $duration),
            'personas_requeridas' => $validated['personas_requeridas'] ?? null,
            'dia_semana' => array_key_exists('dia_semana', $validated) ? $validated['dia_semana'] : null,
            'ubicacion' => $validated['ubicacion'] ?? null,
            'observaciones' => $validated['observaciones'] ?? null,
            'notas_empleado' => $validated['notas_empleado'] ?? $trabajo->notas_empleado,
            'estado' => $this->normalizeEstado($validated['estado']),
        ]);

        return response()->json($trabajo->load($this->trabajoRelations()));
    }

    public function updateEstado(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);

        $validated = $request->validate([
            'estado' => ['required', 'in:pendiente,en_curso,pausado,finalizado,Programado,Completado'],
        ]);

        $trabajo->update([
            'estado' => $this->normalizeEstado($validated['estado']),
        ]);

        return response()->json($trabajo->load(['cliente:id_cliente,nombre,direccion', 'plantilla:id_plantilla,nombre', 'empleado:id_usuario,username,rol']));
    }

    public function updateAgenda(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);

        $validated = $request->validate([
            'id_asignacion' => ['nullable', 'integer'],
            'id_empleado' => ['nullable', 'exists:usuarios,id_usuario'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
        ]);

        if (empty($validated['id_empleado'])) {
            if (empty($validated['id_asignacion'])) {
                return response()->json([
                    'message' => 'Para desasignar es necesario indicar id_asignacion.',
                ], 422);
            }

            $asignacion = TrabajoAsignacion::where('id_trabajo', $trabajo->id_trabajo)
                ->where('id_asignacion', $validated['id_asignacion'])
                ->firstOrFail();

            $asignacion->delete();
            $this->syncLegacyFields($trabajo);

            return response()->json($trabajo->fresh()->load($this->trabajoRelations()));
        }

        if (empty($validated['fecha_inicio'])) {
            return response()->json([
                'message' => 'fecha_inicio es obligatoria para asignar agenda.',
            ], 422);
        }

        $start = Carbon::parse($validated['fecha_inicio']);
        $end = ! empty($validated['fecha_fin'])
            ? Carbon::parse($validated['fecha_fin'])
            : (clone $start)->addMinutes($trabajo->duracion_minutos ?? 60);

        $asignacion = null;
        if (! empty($validated['id_asignacion'])) {
            $asignacion = TrabajoAsignacion::where('id_trabajo', $trabajo->id_trabajo)
                ->where('id_asignacion', $validated['id_asignacion'])
                ->first();
        }

        if ($asignacion) {
            $asignacion->update([
                'id_empleado' => $validated['id_empleado'],
                'fecha_inicio' => $start,
                'fecha_fin' => $end,
            ]);
        } else {
            $existing = TrabajoAsignacion::where('id_trabajo', $trabajo->id_trabajo)
                ->where('id_empleado', $validated['id_empleado'])
                ->first();

            if ($existing) {
                $existing->update([
                    'fecha_inicio' => $start,
                    'fecha_fin' => $end,
                ]);
            } else {
                TrabajoAsignacion::create([
                    'id_trabajo' => $trabajo->id_trabajo,
                    'id_empleado' => $validated['id_empleado'],
                    'fecha_inicio' => $start,
                    'fecha_fin' => $end,
                ]);
            }
        }

        $this->syncLegacyFields($trabajo);

        return response()->json($trabajo->fresh()->load($this->trabajoRelations()));
    }

    public function storeFromPlantilla(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_plantilla' => ['required', 'exists:trabajo_plantillas,id_plantilla'],
            'fecha_base' => ['nullable', 'date'],
            'dia_semana' => ['nullable', 'integer', 'between:0,6'],
            'hora_inicio' => ['nullable', 'regex:/^([01]\d|2[0-3]):([0-5]\d)$/'],
            'dias_consecutivos' => ['nullable', 'integer', 'min:1', 'max:30'],
        ]);

        $plantilla = TrabajoPlantilla::findOrFail((int) $validated['id_plantilla']);
        if (! $plantilla->activa) {
            return response()->json([
                'message' => 'La plantilla seleccionada esta inactiva.',
            ], 422);
        }

        $dias = (int) ($validated['dias_consecutivos'] ?? 1);
        $createdIds = [];
        $duration = max((int) ($plantilla->duracion_minutos ?? 60), 15);
        $diaSemanaBase = array_key_exists('dia_semana', $validated)
            ? $validated['dia_semana']
            : $plantilla->dia_semana;

        if (! empty($validated['fecha_base'])) {
            $horaInicio = $validated['hora_inicio'] ?? '08:00';
            [$hour, $minute] = explode(':', $horaInicio);
            $base = Carbon::parse($validated['fecha_base'])->startOfDay();

            for ($i = 0; $i < $dias; $i += 1) {
                $start = (clone $base)->addDays($i)->setTime((int) $hour, (int) $minute, 0);
                $end = (clone $start)->addMinutes($duration);

                $trabajo = Trabajo::create([
                    'id_cliente' => $plantilla->id_cliente,
                    'id_plantilla' => $plantilla->id_plantilla,
                    'id_empleado' => null,
                    'fecha_inicio' => $start,
                    'fecha_fin' => $end,
                    'descripcion_tarea' => $plantilla->descripcion_tarea,
                    'duracion_minutos' => $duration,
                    'tiempo_estimado' => $duration,
                    'personas_requeridas' => $plantilla->personas_requeridas,
                    'dia_semana' => $start->dayOfWeek,
                    'ubicacion' => $plantilla->ubicacion,
                    'observaciones' => $plantilla->observaciones,
                    'estado' => 'pendiente',
                ]);
                $createdIds[] = $trabajo->id_trabajo;
            }
        } else {
            for ($i = 0; $i < $dias; $i += 1) {
                $trabajo = Trabajo::create([
                    'id_cliente' => $plantilla->id_cliente,
                    'id_plantilla' => $plantilla->id_plantilla,
                    'id_empleado' => null,
                    'fecha_inicio' => null,
                    'fecha_fin' => null,
                    'descripcion_tarea' => $plantilla->descripcion_tarea,
                    'duracion_minutos' => $duration,
                    'tiempo_estimado' => $duration,
                    'personas_requeridas' => $plantilla->personas_requeridas,
                    'dia_semana' => $diaSemanaBase,
                    'ubicacion' => $plantilla->ubicacion,
                    'observaciones' => $plantilla->observaciones,
                    'estado' => 'pendiente',
                ]);
                $createdIds[] = $trabajo->id_trabajo;
            }
        }

        return response()->json([
            'message' => sprintf('Se han creado %d trabajo(s) desde plantilla.', count($createdIds)),
            'created_ids' => $createdIds,
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);
        $trabajo->delete();

        return response()->json(['message' => 'Trabajo eliminado']);
    }

    public function updateRetraso(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);
        $authUser = $this->authenticatedUser($request);

        if ($this->normalizeEstado($trabajo->estado) !== 'finalizado') {
            return response()->json([
                'message' => 'Solo puedes ajustar trabajos finalizados.',
            ], 422);
        }

        if (! $authUser || $authUser->rol !== 'Admin') {
            return response()->json([
                'message' => 'No autorizado.',
            ], 403);
        }

        $validated = $request->validate([
            'tiempo_estimado' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'tiempo_real_efectivo' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'notas_empleado' => ['nullable', 'string', 'max:2000'],
            'motivo_ajuste' => ['required', 'string', 'min:6', 'max:2000'],
        ]);

        $tiempoEstimadoAnterior = (int) ($trabajo->tiempo_estimado ?? $trabajo->duracion_minutos ?? 60);
        $tiempoRealAnterior = (int) ($trabajo->tiempo_real_efectivo ?? 0);
        $notasAnterior = $trabajo->notas_empleado;

        $tiempoEstimadoNuevo = array_key_exists('tiempo_estimado', $validated)
            ? (int) $validated['tiempo_estimado']
            : $tiempoEstimadoAnterior;
        $tiempoRealNuevo = array_key_exists('tiempo_real_efectivo', $validated)
            ? (int) $validated['tiempo_real_efectivo']
            : $tiempoRealAnterior;
        $notasNueva = array_key_exists('notas_empleado', $validated)
            ? $validated['notas_empleado']
            : $notasAnterior;

        $trabajo->update([
            'tiempo_estimado' => $tiempoEstimadoNuevo,
            'tiempo_real_efectivo' => $tiempoRealNuevo,
            'notas_empleado' => $notasNueva,
        ]);

        RegistroAuditoriaTrabajo::create([
            'id_trabajo' => $trabajo->id_trabajo,
            'id_admin' => (int) $authUser->id_usuario,
            'tiempo_estimado_anterior' => $tiempoEstimadoAnterior,
            'tiempo_estimado_nuevo' => $tiempoEstimadoNuevo,
            'tiempo_real_anterior' => $tiempoRealAnterior,
            'tiempo_real_nuevo' => $tiempoRealNuevo,
            'notas_anterior' => $notasAnterior,
            'notas_nueva' => $notasNueva,
            'motivo_ajuste' => $validated['motivo_ajuste'],
        ]);

        return response()->json($trabajo->fresh()->load($this->trabajoRelations()));
    }

    public function auditoriaAjustes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date', 'after_or_equal:desde'],
        ]);

        $query = RegistroAuditoriaTrabajo::query()
            ->with([
                'trabajo:id_trabajo,id_cliente,id_empleado,descripcion_tarea,tiempo_estimado,tiempo_real_efectivo,notas_empleado,estado',
                'trabajo.cliente:id_cliente,nombre',
                'trabajo.empleado:id_usuario,nombre,apellidos,username',
                'admin:id_usuario,nombre,apellidos,username',
            ])
            ->orderByDesc('created_at');

        if (! empty($validated['desde'])) {
            $query->whereDate('created_at', '>=', $validated['desde']);
        }

        if (! empty($validated['hasta'])) {
            $query->whereDate('created_at', '<=', $validated['hasta']);
        }

        $rows = $query->limit(500)->get()->map(function (RegistroAuditoriaTrabajo $row) {
            return [
                'id_registro_auditoria_trabajo' => $row->id_registro_auditoria_trabajo,
                'id_trabajo' => $row->id_trabajo,
                'id_admin' => $row->id_admin,
                'tiempo_estimado_anterior' => $row->tiempo_estimado_anterior,
                'tiempo_estimado_nuevo' => $row->tiempo_estimado_nuevo,
                'tiempo_real_anterior' => $row->tiempo_real_anterior,
                'tiempo_real_nuevo' => $row->tiempo_real_nuevo,
                'notas_anterior' => $row->notas_anterior,
                'notas_nueva' => $row->notas_nueva,
                'motivo_ajuste' => $row->motivo_ajuste,
                'fecha_registro' => optional($row->created_at)?->toIso8601String(),
                'trabajo' => $row->trabajo,
                'admin' => $row->admin,
            ];
        });

        return response()->json($rows);
    }

    public function iniciarTrabajo(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);
        $empleadoId = $this->resolveEmpleadoFromRequest($request);
        if (! $this->isEmpleadoAsignado($trabajo, $empleadoId)) {
            return response()->json(['message' => 'El empleado no esta asignado a este trabajo.'], 403);
        }

        if ($this->normalizeEstado($trabajo->estado) === 'finalizado') {
            return response()->json(['message' => 'El trabajo ya esta finalizado.'], 422);
        }

        $trabajo->update([
            'estado' => 'en_curso',
            'inicio_operativo' => $trabajo->inicio_operativo ?? Carbon::now(),
            'fin_operativo' => null,
        ]);

        return response()->json($trabajo->fresh()->load($this->trabajoRelations()));
    }

    public function pausarTrabajo(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);
        $empleadoId = $this->resolveEmpleadoFromRequest($request);
        if (! $this->isEmpleadoAsignado($trabajo, $empleadoId)) {
            return response()->json(['message' => 'El empleado no esta asignado a este trabajo.'], 403);
        }

        if ($this->normalizeEstado($trabajo->estado) !== 'en_curso') {
            return response()->json(['message' => 'Solo se puede pausar un trabajo en curso.'], 422);
        }

        $openPause = $trabajo->pausas()->whereNull('fin_pausa')->first();
        if (! $openPause) {
            RegistroPausaTrabajo::create([
                'id_trabajo' => $trabajo->id_trabajo,
                'inicio_pausa' => Carbon::now(),
            ]);
        }

        $trabajo->update(['estado' => 'pausado']);

        return response()->json($trabajo->fresh()->load($this->trabajoRelations()));
    }

    public function reanudarTrabajo(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);
        $empleadoId = $this->resolveEmpleadoFromRequest($request);
        if (! $this->isEmpleadoAsignado($trabajo, $empleadoId)) {
            return response()->json(['message' => 'El empleado no esta asignado a este trabajo.'], 403);
        }

        if ($this->normalizeEstado($trabajo->estado) !== 'pausado') {
            return response()->json(['message' => 'Solo se puede reanudar un trabajo pausado.'], 422);
        }

        $openPause = $trabajo->pausas()->whereNull('fin_pausa')->orderByDesc('inicio_pausa')->first();
        if ($openPause) {
            $openPause->update(['fin_pausa' => Carbon::now()]);
        }

        $trabajo->update(['estado' => 'en_curso']);

        return response()->json($trabajo->fresh()->load($this->trabajoRelations()));
    }

    public function finalizarTrabajo(Request $request, int $id): JsonResponse
    {
        $trabajo = Trabajo::findOrFail($id);
        $empleadoId = $this->resolveEmpleadoFromRequest($request);
        if (! $this->isEmpleadoAsignado($trabajo, $empleadoId)) {
            return response()->json(['message' => 'El empleado no esta asignado a este trabajo.'], 403);
        }

        $validated = $request->validate([
            'notas_empleado' => ['nullable', 'string', 'max:2000'],
        ]);

        if (! $trabajo->inicio_operativo) {
            return response()->json(['message' => 'Debes iniciar el trabajo antes de finalizarlo.'], 422);
        }

        $openPause = $trabajo->pausas()->whereNull('fin_pausa')->orderByDesc('inicio_pausa')->first();
        if ($openPause) {
            $openPause->update(['fin_pausa' => Carbon::now()]);
        }

        $fin = Carbon::now();
        $effectiveMinutes = $this->calculateEffectiveMinutes($trabajo->fresh(['pausas']), $fin);
        $tiempoEstimado = (int) ($trabajo->tiempo_estimado ?? $trabajo->duracion_minutos ?? 60);

        if ($effectiveMinutes > $tiempoEstimado && empty($validated['notas_empleado'])) {
            return response()->json([
                'message' => 'Debes justificar la demora en notas_empleado para finalizar.',
                'requires_notas_empleado' => true,
                'tiempo_estimado' => $tiempoEstimado,
                'tiempo_real_efectivo' => $effectiveMinutes,
            ], 422);
        }

        $trabajo->update([
            'estado' => 'finalizado',
            'fin_operativo' => $fin,
            'tiempo_real_efectivo' => $effectiveMinutes,
            'notas_empleado' => $validated['notas_empleado'] ?? $trabajo->notas_empleado,
        ]);

        return response()->json($trabajo->fresh()->load($this->trabajoRelations()));
    }

    private function syncLegacyFields(Trabajo $trabajo): void
    {
        $first = $trabajo->asignaciones()->orderBy('fecha_inicio')->first();

        $trabajo->update([
            'id_empleado' => $first?->id_empleado,
            'fecha_inicio' => $first?->fecha_inicio,
            'fecha_fin' => $first?->fecha_fin,
        ]);
    }

    private function normalizeEstado(?string $estado): string
    {
        return match ($estado) {
            'Programado' => 'pendiente',
            'Completado' => 'finalizado',
            default => $estado ?: 'pendiente',
        };
    }

    private function resolveEmpleadoFromRequest(Request $request): int
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

    private function isEmpleadoAsignado(Trabajo $trabajo, int $empleadoId): bool
    {
        $assignedIds = $trabajo->asignaciones()->pluck('id_empleado')->map(fn ($id) => (int) $id)->all();

        return in_array($empleadoId, $assignedIds, true) || (int) $trabajo->id_empleado === $empleadoId;
    }

    private function calculateEffectiveMinutes(Trabajo $trabajo, Carbon $fin): int
    {
        $inicio = Carbon::parse($trabajo->inicio_operativo);
        $totalMinutes = max(0, $inicio->diffInMinutes($fin));

        $pausedMinutes = $trabajo->pausas->reduce(function ($carry, RegistroPausaTrabajo $pause) use ($fin, $inicio) {
            $pauseStart = Carbon::parse($pause->inicio_pausa);
            if ($pauseStart->lt($inicio)) {
                $pauseStart = (clone $inicio);
            }

            $pauseEnd = $pause->fin_pausa ? Carbon::parse($pause->fin_pausa) : (clone $fin);
            if ($pauseEnd->gt($fin)) {
                $pauseEnd = (clone $fin);
            }

            if ($pauseEnd->lte($pauseStart)) {
                return $carry;
            }

            return $carry + $pauseStart->diffInMinutes($pauseEnd);
        }, 0);

        return max(0, $totalMinutes - $pausedMinutes);
    }
}