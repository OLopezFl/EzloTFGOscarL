<?php

namespace App\Modules\WorkOrders\Domain\Models;

use App\Modules\Employees\Domain\Models\Usuario;
use Illuminate\Database\Eloquent\Model;

class TrabajoAsignacion extends Model
{
    protected $table = 'trabajo_asignaciones';

    protected $primaryKey = 'id_asignacion';

    protected $fillable = [
        'id_trabajo',
        'id_empleado',
        'fecha_inicio',
        'fecha_fin',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_fin' => 'datetime',
        ];
    }

    public function trabajo()
    {
        return $this->belongsTo(Trabajo::class, 'id_trabajo', 'id_trabajo');
    }

    public function empleado()
    {
        return $this->belongsTo(Usuario::class, 'id_empleado', 'id_usuario');
    }
}
