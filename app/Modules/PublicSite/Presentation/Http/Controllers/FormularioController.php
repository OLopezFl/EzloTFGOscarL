<?php

declare(strict_types=1);

namespace App\Modules\PublicSite\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PublicSite\Application\FormularioMensajesApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FormularioController extends Controller
{
    public function __construct(private readonly FormularioMensajesApplicationService $mensajes) {}

    public function index(Request $request): JsonResponse
    {
        return $this->mensajes->index($request);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->mensajes->store($request);
    }

    public function updateEstado(Request $request, int $id): JsonResponse
    {
        return $this->mensajes->updateEstado($request, $id);
    }

    public function destroy(int $id): JsonResponse
    {
        return $this->mensajes->destroy($id);
    }
}
