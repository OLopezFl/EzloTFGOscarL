<?php

namespace App\Modules\PublicSite\Domain\Models;

use Illuminate\Database\Eloquent\Model;

class Formulario extends Model
{
    protected $table = 'formularios';

    protected $primaryKey = 'id_mensaje';

    protected $fillable = [
        'remitente_nombre',
        'remitente_email',
        'cuerpo_mensaje',
        'fecha_recepcion',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_recepcion' => 'datetime',
        ];
    }
}
