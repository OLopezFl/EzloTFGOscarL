<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure\Auth;

use App\Modules\Auth\Domain\Ports\ApiTokenIssuerPort;
use App\Modules\Employees\Domain\Models\Usuario;
use App\Shared\Support\ApiToken;

final class LaravelApiTokenIssuer implements ApiTokenIssuerPort
{
    public function issueFor(Usuario $usuario): string
    {
        return ApiToken::issue($usuario);
    }
}