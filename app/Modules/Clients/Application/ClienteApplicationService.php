<?php

namespace App\Modules\Clients\Application;

use App\Modules\Clients\Domain\Models\Cliente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteApplicationService
{
    public function index(Request $request): JsonResponse
    {
        $query = Cliente::query();

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('nombre', 'like', '%'.$q.'%')
                    ->orWhere('email', 'like', '%'.$q.'%')
                    ->orWhere('telefono', 'like', '%'.$q.'%')
                    ->orWhere('direccion', 'like', '%'.$q.'%');
            });
        }

        return response()->json($query->orderBy('nombre')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:120'],
            'direccion' => ['nullable', 'string', 'max:200'],
        ]);

        $cliente = Cliente::create($validated);

        return response()->json($cliente, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $cliente = Cliente::findOrFail($id);

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:120'],
            'direccion' => ['nullable', 'string', 'max:200'],
        ]);

        $cliente->update($validated);

        return response()->json($cliente);
    }

    public function destroy(int $id): JsonResponse
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->delete();

        return response()->json(['message' => 'Cliente eliminado']);
    }
}