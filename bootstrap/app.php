<?php

use App\Shared\Http\Middleware\ApiTokenAuth;
use App\Shared\Http\Middleware\RequireRole;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'api.auth' => ApiTokenAuth::class,
            'role' => RequireRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (QueryException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $sqlState = (string) ($exception->errorInfo[0] ?? '');
            $driverCode = (int) ($exception->errorInfo[1] ?? 0);
            $rawMessage = (string) $exception->getMessage();

            if ($sqlState === '23000' && $driverCode === 1062) {
                if (str_contains($rawMessage, 'trabajo_asignaciones_id_trabajo_id_empleado_unique')) {
                    return response()->json([
                        'message' => 'Ese empleado ya esta asignado a este trabajo.',
                    ], 409);
                }

                return response()->json([
                    'message' => 'Ya existe un registro con esos datos.',
                ], 409);
            }

            if ($sqlState === '23000' && $driverCode === 1452) {
                return response()->json([
                    'message' => 'No se puede guardar porque hay datos relacionados no validos.',
                ], 422);
            }

            if ($sqlState === '23000' && $driverCode === 1451) {
                return response()->json([
                    'message' => 'No se puede eliminar porque este registro esta siendo usado en otros datos.',
                ], 409);
            }

            return response()->json([
                'message' => 'Ha ocurrido un error al acceder a la base de datos.',
            ], 500);
        });
    })->create();