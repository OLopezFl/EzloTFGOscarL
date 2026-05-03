<?php

namespace App\Modules\WorkOrders\Domain\Models;

use App\Modules\Employees\Domain\Models\Usuario;
use Illuminate\Database\Eloquent\Model;

class RegistroAuditoriaTrabajo extends Model
{
    protected $table = 'registro_auditoria_trabajos';

    protected $primaryKey = 'id_registro_auditoria_trabajo';

    protected $fillable = [
        'id_trabajo',
        'id_admin',
        'tiempo_estimado_anterior',
        'tiempo_estimado_nuevo',
        'tiempo_real_anterior',
        'tiempo_real_nuevo',
        'notas_anterior',
        'notas_nueva',
        'motivo_ajuste',
    ];

    public function trabajo()
    {
        return $this->belongsTo(Trabajo::class, 'id_trabajo', 'id_trabajo');
    }

    public function admin()
    {
        return $this->belongsTo(Usuario::class, 'id_admin', 'id_usuario');
    }
}
