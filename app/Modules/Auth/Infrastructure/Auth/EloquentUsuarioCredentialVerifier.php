<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure\Auth;

use App\Modules\Auth\Domain\Ports\UsuarioCredentialVerifierPort;
use App\Modules\Employees\Domain\Models\Usuario;
use Illuminate\Support\Facades\Hash;

final class EloquentUsuarioCredentialVerifier implements UsuarioCredentialVerifierPort
{
    public function verify(string $username, string $plainPassword): ?Usuario
    {
        $usuario = Usuario::where('username', $username)->first();

        if (! $usuario || ! Hash::check($plainPassword, $usuario->password_hash)) {
            return null;
        }

        return $usuario;
    }
}