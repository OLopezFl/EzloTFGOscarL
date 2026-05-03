<?php

declare(strict_types=1);

namespace App\Modules\Admin\Presentation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admin\Application\DashboardApplicationService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardApplicationService $dashboard) {}

    public function summary(): JsonResponse
    {
        return $this->dashboard->summary();
    }

    public function stats(): JsonResponse
    {
        return $this->dashboard->stats();
    }

    public function calendar(): JsonResponse
    {
        return $this->dashboard->calendar();
    }
}
