<?php

namespace App\Modules\Clients\Domain\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $primaryKey = 'id_cliente';

    protected $fillable = [
        'nombre',
        'telefono',
        'email',
        'direccion',
    ];
}
