<?php

namespace App\Modules\Employees\Domain\Models;

use App\Modules\Scheduling\Domain\Models\RegistroJornada;
use App\Modules\WorkOrders\Domain\Models\RegistroAuditoriaTrabajo;
use App\Modules\WorkOrders\Domain\Models\TrabajoAsignacion;
use Illuminate\Database\Eloquent\Model;

class Usuario extends Model
{
    protected $table = 'usuarios';

    protected $primaryKey = 'id_usuario';

    protected $fillable = [
        'nombre',
        'apellidos',
        'username',
        'password_hash',
        'avatar_url',
        'rol',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function asignacionesTrabajo()
    {
        return $this->hasMany(TrabajoAsignacion::class, 'id_empleado', 'id_usuario');
    }

    public function jornadas()
    {
        return $this->hasMany(RegistroJornada::class, 'empleado_id', 'id_usuario');
    }

    public function auditoriasTrabajoAdmin()
    {
        return $this->hasMany(RegistroAuditoriaTrabajo::class, 'id_admin', 'id_usuario');
    }
}
