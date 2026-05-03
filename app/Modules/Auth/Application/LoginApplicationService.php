<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application;

use App\Modules\Auth\Domain\Ports\ApiTokenIssuerPort;
use App\Modules\Auth\Domain\Ports\UsuarioCredentialVerifierPort;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LoginApplicationService
{
    public function __construct(
        private readonly UsuarioCredentialVerifierPort $credentialVerifier,
        private readonly ApiTokenIssuerPort $tokens,
    ) {}

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:80'],
            'password' => ['required', 'string', 'max:72'],
        ]);

        $usuario = $this->credentialVerifier->verify($validated['username'], $validated['password']);

        if (! $usuario) {
            return response()->json([
                'message' => 'Usuario o contrasena incorrectos.',
            ], 401);
        }

        $token = $this->tokens->issueFor($usuario);

        return response()->json([
            'message' => 'Login correcto.',
            'token' => $token,
            'usuario' => [
                'id_usuario' => $usuario->id_usuario,
                'nombre' => $usuario->nombre,
                'apellidos' => $usuario->apellidos,
                'username' => $usuario->username,
                'avatar_url' => $usuario->avatar_url,
                'rol' => $usuario->rol,
            ],
        ]);
    }
}