<?php

namespace App\Modules\Admin\Application;

use App\Modules\Clients\Domain\Models\Cliente;
use App\Modules\Employees\Domain\Models\Usuario;
use App\Modules\PublicSite\Domain\Models\Formulario;
use App\Modules\WorkOrders\Domain\Models\Trabajo;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardApplicationService
{
    public function summary(): JsonResponse
    {
        $today = Carbon::today();

        $serviciosHoy = Trabajo::whereDate('fecha_inicio', $today)->count();
        $pendientes = Trabajo::whereIn('estado', ['pendiente', 'en_curso', 'pausado', 'Programado'])->count();
        $completados = Trabajo::whereIn('estado', ['finalizado', 'Completado'])->count();
        $clientesActivos = Cliente::count();
        $mensajesPendientes = Formulario::where('estado', 'Pendiente')->count();

        $upcomingJobs = Trabajo::with(['cliente', 'empleado'])
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio asc')
            ->limit(8)
            ->get()
            ->map(function (Trabajo $trabajo) {
                return [
                    'id_trabajo' => $trabajo->id_trabajo,
                    'cliente' => $trabajo->cliente?->nombre,
                    'direccion' => $trabajo->cliente?->direccion,
                    'empleado' => $trabajo->empleado?->username,
                    'fecha_inicio' => optional($trabajo->fecha_inicio)?->toIso8601String(),
                    'fecha_fin' => optional($trabajo->fecha_fin)?->toIso8601String(),
                    'descripcion_tarea' => $trabajo->descripcion_tarea,
                    'estado' => $trabajo->estado,
                ];
            });

        return response()->json([
            'kpis' => [
                'servicios_hoy' => $serviciosHoy,
                'pendientes' => $pendientes,
                'completados' => $completados,
                'clientes_activos' => $clientesActivos,
                'mensajes_pendientes' => $mensajesPendientes,
            ],
            'proximos_trabajos' => $upcomingJobs,
        ]);
    }

    public function stats(): JsonResponse
    {
        $startMonth = Carbon::now()->startOfMonth();
        $endMonth = Carbon::now()->endOfMonth();
        $prevStartMonth = Carbon::now()->subMonth()->startOfMonth();
        $prevEndMonth = Carbon::now()->subMonth()->endOfMonth();

        $completadosMes = Trabajo::whereIn('estado', ['finalizado', 'Completado'])
            ->whereBetween('fecha_inicio', [$startMonth, $endMonth])
            ->count();

        $completadosMesAnterior = Trabajo::whereIn('estado', ['finalizado', 'Completado'])
            ->whereBetween('fecha_inicio', [$prevStartMonth, $prevEndMonth])
            ->count();

        $delta = $completadosMes - $completadosMesAnterior;
        $ratio = $completadosMesAnterior > 0
            ? round(($delta / $completadosMesAnterior) * 100, 1)
            : ($completadosMes > 0 ? 100 : 0);

        return response()->json([
            'completados_mes' => $completadosMes,
            'completados_mes_anterior' => $completadosMesAnterior,
            'diferencia' => $delta,
            'porcentaje' => $ratio,
            'total_trabajadores' => Usuario::where('rol', 'Empleado')->count(),
            'total_clientes' => Cliente::count(),
            'total_mensajes' => Formulario::count(),
        ]);
    }

    public function calendar(): JsonResponse
    {
        $events = Trabajo::with(['cliente', 'empleado'])
            ->whereNotNull('fecha_inicio')
            ->orderBy('fecha_inicio')
            ->get()
            ->map(function (Trabajo $trabajo) {
                return [
                    'id' => $trabajo->id_trabajo,
                    'title' => $trabajo->cliente?->nombre.' - '.($trabajo->estado ?? ''),
                    'start' => optional($trabajo->fecha_inicio)?->toIso8601String(),
                    'end' => optional($trabajo->fecha_fin)?->toIso8601String(),
                    'estado' => $trabajo->estado,
                    'empleado' => $trabajo->empleado?->username,
                    'descripcion' => $trabajo->descripcion_tarea,
                ];
            });

        return response()->json($events);
    }
}