<?php

namespace App\Modules\Admin\Application;

use App\Modules\WorkOrders\Domain\Models\Trabajo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnaliticaApplicationService
{
    public function eficienciaPorEmpleado(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date', 'after_or_equal:desde'],
        ]);

        $rows = Trabajo::query()
            ->select([
                'trabajos.id_empleado',
                'usuarios.nombre as empleado_nombre',
                'usuarios.apellidos as empleado_apellidos',
                'usuarios.username as empleado_username',
                DB::raw('SUM(COALESCE(trabajos.tiempo_estimado, trabajos.duracion_minutos, 0)) as total_estimado_min'),
                DB::raw('SUM(COALESCE(trabajos.tiempo_real_efectivo, 0)) as total_real_efectivo_min'),
                DB::raw('COUNT(*) as total_trabajos_finalizados'),
            ])
            ->join('usuarios', 'usuarios.id_usuario', '=', 'trabajos.id_empleado')
            ->whereNotNull('trabajos.id_empleado')
            ->where('trabajos.estado', 'finalizado')
            ->groupBy('trabajos.id_empleado', 'usuarios.nombre', 'usuarios.apellidos', 'usuarios.username')
            ->orderByRaw('SUM(COALESCE(trabajos.tiempo_real_efectivo, 0) - COALESCE(trabajos.tiempo_estimado, trabajos.duracion_minutos, 0)) asc')
            ->get()
            ->map(function ($row) {
                $estimado = (int) $row->total_estimado_min;
                $real = (int) $row->total_real_efectivo_min;
                $eficiencia = $real > 0 ? round(($estimado / $real) * 100, 2) : null;

                return [
                    'empleado_id' => (int) $row->id_empleado,
                    'total_trabajos_finalizados' => (int) $row->total_trabajos_finalizados,
                    'total_estimado_min' => $estimado,
                    'total_real_efectivo_min' => $real,
                    'desviacion_total_min' => $real - $estimado,
                    'eficiencia_neta_pct' => $eficiencia,
                    'empleado' => [
                        'id_usuario' => (int) $row->id_empleado,
                        'nombre' => $row->empleado_nombre,
                        'apellidos' => $row->empleado_apellidos,
                        'username' => $row->empleado_username,
                    ],
                ];
            });

        if (! empty($validated['desde']) || ! empty($validated['hasta'])) {
            $query = Trabajo::query()
                ->select([
                    'trabajos.id_empleado',
                    'usuarios.nombre as empleado_nombre',
                    'usuarios.apellidos as empleado_apellidos',
                    'usuarios.username as empleado_username',
                    DB::raw('SUM(COALESCE(trabajos.tiempo_estimado, trabajos.duracion_minutos, 0)) as total_estimado_min'),
                    DB::raw('SUM(COALESCE(trabajos.tiempo_real_efectivo, 0)) as total_real_efectivo_min'),
                    DB::raw('COUNT(*) as total_trabajos_finalizados'),
                ])
                ->join('usuarios', 'usuarios.id_usuario', '=', 'trabajos.id_empleado')
                ->whereNotNull('trabajos.id_empleado')
                ->where('trabajos.estado', 'finalizado');

            if (! empty($validated['desde'])) {
                $query->whereDate(DB::raw('COALESCE(trabajos.fin_operativo, trabajos.fecha_fin, trabajos.updated_at)'), '>=', $validated['desde']);
            }

            if (! empty($validated['hasta'])) {
                $query->whereDate(DB::raw('COALESCE(trabajos.fin_operativo, trabajos.fecha_fin, trabajos.updated_at)'), '<=', $validated['hasta']);
            }

            $rows = $query
                ->groupBy('trabajos.id_empleado', 'usuarios.nombre', 'usuarios.apellidos', 'usuarios.username')
                ->orderByRaw('SUM(COALESCE(trabajos.tiempo_real_efectivo, 0) - COALESCE(trabajos.tiempo_estimado, trabajos.duracion_minutos, 0)) asc')
                ->get()
                ->map(function ($row) {
                    $estimado = (int) $row->total_estimado_min;
                    $real = (int) $row->total_real_efectivo_min;
                    $eficiencia = $real > 0 ? round(($estimado / $real) * 100, 2) : null;

                    return [
                        'empleado_id' => (int) $row->id_empleado,
                        'total_trabajos_finalizados' => (int) $row->total_trabajos_finalizados,
                        'total_estimado_min' => $estimado,
                        'total_real_efectivo_min' => $real,
                        'desviacion_total_min' => $real - $estimado,
                        'eficiencia_neta_pct' => $eficiencia,
                        'empleado' => [
                            'id_usuario' => (int) $row->id_empleado,
                            'nombre' => $row->empleado_nombre,
                            'apellidos' => $row->empleado_apellidos,
                            'username' => $row->empleado_username,
                        ],
                    ];
                });
        }

        return response()->json($rows);
    }

    public function desviacionPorClienteUbicacion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date', 'after_or_equal:desde'],
        ]);

        $query = Trabajo::query()
            ->select([
                'trabajos.id_cliente',
                'trabajos.ubicacion',
                'clientes.nombre as cliente_nombre',
                DB::raw('SUM(COALESCE(trabajos.tiempo_estimado, trabajos.duracion_minutos, 0)) as total_estimado_min'),
                DB::raw('SUM(COALESCE(trabajos.tiempo_real_efectivo, 0)) as total_real_efectivo_min'),
                DB::raw('COUNT(*) as total_trabajos_finalizados'),
            ])
            ->join('clientes', 'clientes.id_cliente', '=', 'trabajos.id_cliente')
            ->where('trabajos.estado', 'finalizado');

        if (! empty($validated['desde'])) {
            $query->whereDate(DB::raw('COALESCE(trabajos.fin_operativo, trabajos.fecha_fin, trabajos.updated_at)'), '>=', $validated['desde']);
        }

        if (! empty($validated['hasta'])) {
            $query->whereDate(DB::raw('COALESCE(trabajos.fin_operativo, trabajos.fecha_fin, trabajos.updated_at)'), '<=', $validated['hasta']);
        }

        $rows = $query
            ->groupBy('trabajos.id_cliente', 'trabajos.ubicacion', 'clientes.nombre')
            ->orderByRaw('ABS(SUM(COALESCE(trabajos.tiempo_real_efectivo, 0) - COALESCE(trabajos.tiempo_estimado, trabajos.duracion_minutos, 0))) desc')
            ->get()
            ->map(function ($row) {
                $estimado = (int) $row->total_estimado_min;
                $real = (int) $row->total_real_efectivo_min;

                return [
                    'cliente_id' => (int) $row->id_cliente,
                    'cliente_nombre' => $row->cliente_nombre,
                    'ubicacion' => $row->ubicacion ?: 'Sin ubicacion',
                    'total_trabajos_finalizados' => (int) $row->total_trabajos_finalizados,
                    'total_estimado_min' => $estimado,
                    'total_real_efectivo_min' => $real,
                    'desviacion_total_min' => $real - $estimado,
                ];
            });

        return response()->json($rows);
    }
}