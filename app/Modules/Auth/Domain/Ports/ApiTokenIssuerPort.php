<?php

declare(strict_types=1);

namespace App\Modules\Auth\Domain\Ports;

use App\Modules\Employees\Domain\Models\Usuario;

interface ApiTokenIssuerPort
{
    public function issueFor(Usuario $usuario): string;
}
