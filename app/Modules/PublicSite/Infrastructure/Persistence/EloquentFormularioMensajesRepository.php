<?php

declare(strict_types=1);

namespace App\Modules\PublicSite\Infrastructure\Persistence;

use App\Modules\PublicSite\Domain\Models\Formulario;
use App\Modules\PublicSite\Domain\Ports\FormularioMensajesPort;
use Illuminate\Support\Collection;

final class EloquentFormularioMensajesRepository implements FormularioMensajesPort
{
    public function filteredList(?string $estado, ?string $searchQuery): Collection
    {
        $query = Formulario::query();

        if ($estado !== null && $estado !== '') {
            $query->where('estado', $estado);
        }

        if ($searchQuery !== null && $searchQuery !== '') {
            $q = $searchQuery;
            $query->where(function ($builder) use ($q) {
                $builder->where('remitente_nombre', 'like', '%'.$q.'%')
                    ->orWhere('remitente_email', 'like', '%'.$q.'%')
                    ->orWhere('cuerpo_mensaje', 'like', '%'.$q.'%');
            });
        }

        return $query->orderBy('fecha_recepcion', 'desc')->get();
    }

    public function create(array $attributes): Formulario
    {
        return Formulario::create($attributes);
    }

    public function updateEstado(int $id, string $estado): Formulario
    {
        $formulario = Formulario::findOrFail($id);
        $formulario->update([
            'estado' => $estado,
        ]);

        return $formulario->fresh();
    }

    public function deleteById(int $id): void
    {
        Formulario::findOrFail($id)->delete();
    }
}
