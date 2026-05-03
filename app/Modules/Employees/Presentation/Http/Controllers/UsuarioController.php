<?php

declare(strict_types=1);

namespace App\Modules\Employees\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Employees\Application\UsuarioApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function __construct(private readonly UsuarioApplicationService $usuarios) {}

    public function index(Request $request): JsonResponse
    {
        return $this->usuarios->index($request);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->usuarios->show($request, $id);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->usuarios->store($request);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        return $this->usuarios->update($request, $id);
    }

    public function updatePerfil(Request $request, int $id): JsonResponse
    {
        return $this->usuarios->updatePerfil($request, $id);
    }

    public function destroy(int $id): JsonResponse
    {
        return $this->usuarios->destroy($id);
    }
}
