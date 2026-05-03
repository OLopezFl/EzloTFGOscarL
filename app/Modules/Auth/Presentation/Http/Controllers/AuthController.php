<?php

declare(strict_types=1);

namespace App\Modules\Auth\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Application\LoginApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly LoginApplicationService $loginApplication) {}

    public function login(Request $request): JsonResponse
    {
        return $this->loginApplication->login($request);
    }
}
