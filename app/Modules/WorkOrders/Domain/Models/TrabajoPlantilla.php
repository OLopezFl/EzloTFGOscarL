<?php

namespace App\Modules\WorkOrders\Domain\Models;

use App\Modules\Clients\Domain\Models\Cliente;
use Illuminate\Database\Eloquent\Model;

class TrabajoPlantilla extends Model
{
    protected $table = 'trabajo_plantillas';

    protected $primaryKey = 'id_plantilla';

    protected $fillable = [
        'nombre',
        'id_cliente',
        'descripcion_tarea',
        'duracion_minutos',
        'personas_requeridas',
        'dia_semana',
        'ubicacion',
        'observaciones',
        'activa',
    ];

    protected function casts(): array
    {
        return [
            'duracion_minutos' => 'integer',
            'personas_requeridas' => 'integer',
            'dia_semana' => 'integer',
            'activa' => 'boolean',
        ];
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }
}
