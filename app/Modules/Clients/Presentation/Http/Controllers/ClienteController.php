<?php

declare(strict_types=1);

namespace App\Modules\Clients\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Clients\Application\ClienteApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function __construct(private readonly ClienteApplicationService $clientes) {}

    public function index(Request $request): JsonResponse
    {
        return $this->clientes->index($request);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->clientes->store($request);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        return $this->clientes->update($request, $id);
    }

    public function destroy(int $id): JsonResponse
    {
        return $this->clientes->destroy($id);
    }
}
