<?php

declare(strict_types=1);

namespace App\Modules\PublicSite\Domain\Ports;

use App\Modules\PublicSite\Domain\Models\Formulario;
use Illuminate\Support\Collection;

interface FormularioMensajesPort
{
    public function filteredList(?string $estado, ?string $searchQuery): Collection;

    public function create(array $attributes): Formulario;

    public function updateEstado(int $id, string $estado): Formulario;

    public function deleteById(int $id): void;
}