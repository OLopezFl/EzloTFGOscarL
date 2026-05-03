<?php

namespace App\Modules\Scheduling\Domain\Models;

use App\Modules\Employees\Domain\Models\Usuario;
use Illuminate\Database\Eloquent\Model;

class RegistroJornada extends Model
{
    protected $table = 'registro_jornadas';

    protected $primaryKey = 'id_registro_jornada';

    protected $fillable = [
        'empleado_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'modificado_por_admin',
        'motivo_modificacion_admin',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'hora_inicio' => 'datetime',
            'hora_fin' => 'datetime',
            'modificado_por_admin' => 'boolean',
        ];
    }

    public function empleado()
    {
        return $this->belongsTo(Usuario::class, 'empleado_id', 'id_usuario');
    }
}
