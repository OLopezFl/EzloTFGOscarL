<?php

namespace App\Shared\Http\Middleware;

use App\Shared\Support\ApiToken;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): mixed
    {
        $token = $request->bearerToken();
        $usuario = ApiToken::resolveUser($token);

        if (! $usuario) {
            return new JsonResponse([
                'message' => 'No autenticado.',
            ], 401);
        }

        $request->attributes->set('auth_user', $usuario);
        $request->setUserResolver(fn () => $usuario);

        return $next($request);
    }
}
