<?php

namespace App\Shared\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $usuario = $request->attributes->get('auth_user');

        if (! $usuario) {
            return new JsonResponse([
                'message' => 'No autenticado.',
            ], 401);
        }

        if (! in_array((string) $usuario->rol, $roles, true)) {
            return new JsonResponse([
                'message' => 'No autorizado.',
            ], 403);
        }

        return $next($request);
    }
}
