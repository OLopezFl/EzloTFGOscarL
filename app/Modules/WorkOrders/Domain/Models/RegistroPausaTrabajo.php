<?php

namespace App\Modules\WorkOrders\Domain\Models;

use Illuminate\Database\Eloquent\Model;

class RegistroPausaTrabajo extends Model
{
    protected $table = 'registro_pausas_trabajo';

    protected $primaryKey = 'id_registro_pausa';

    protected $fillable = [
        'id_trabajo',
        'inicio_pausa',
        'fin_pausa',
    ];

    protected function casts(): array
    {
        return [
            'inicio_pausa' => 'datetime',
            'fin_pausa' => 'datetime',
        ];
    }

    public function trabajo()
    {
        return $this->belongsTo(Trabajo::class, 'id_trabajo', 'id_trabajo');
    }
}
