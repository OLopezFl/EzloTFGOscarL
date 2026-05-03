<?php

declare(strict_types=1);

namespace App\Modules\WorkOrders\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\WorkOrders\Application\TrabajoPlantillaApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrabajoPlantillaController extends Controller
{
    public function __construct(private readonly TrabajoPlantillaApplicationService $plantillas) {}

    public function index(): JsonResponse
    {
        return $this->plantillas->index();
    }

    public function store(Request $request): JsonResponse
    {
        return $this->plantillas->store($request);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        return $this->plantillas->update($request, $id);
    }

    public function destroy(int $id): JsonResponse
    {
        return $this->plantillas->destroy($id);
    }
}
