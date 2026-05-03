<?php

namespace App\Modules\WorkOrders\Domain\Models;

use App\Modules\Clients\Domain\Models\Cliente;
use App\Modules\Employees\Domain\Models\Usuario;
use Illuminate\Database\Eloquent\Model;

class Trabajo extends Model
{
    protected $table = 'trabajos';

    protected $primaryKey = 'id_trabajo';

    protected $fillable = [
        'id_cliente',
        'id_plantilla',
        'id_empleado',
        'fecha_inicio',
        'fecha_fin',
        'inicio_operativo',
        'fin_operativo',
        'descripcion_tarea',
        'duracion_minutos',
        'tiempo_estimado',
        'tiempo_real_efectivo',
        'personas_requeridas',
        'dia_semana',
        'ubicacion',
        'observaciones',
        'notas_empleado',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_fin' => 'datetime',
            'inicio_operativo' => 'datetime',
            'fin_operativo' => 'datetime',
            'id_plantilla' => 'integer',
            'duracion_minutos' => 'integer',
            'tiempo_estimado' => 'integer',
            'tiempo_real_efectivo' => 'integer',
            'personas_requeridas' => 'integer',
            'dia_semana' => 'integer',
        ];
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }

    public function empleado()
    {
        return $this->belongsTo(Usuario::class, 'id_empleado', 'id_usuario');
    }

    public function plantilla()
    {
        return $this->belongsTo(TrabajoPlantilla::class, 'id_plantilla', 'id_plantilla');
    }

    public function asignaciones()
    {
        return $this->hasMany(TrabajoAsignacion::class, 'id_trabajo', 'id_trabajo');
    }

    public function pausas()
    {
        return $this->hasMany(RegistroPausaTrabajo::class, 'id_trabajo', 'id_trabajo');
    }
}
