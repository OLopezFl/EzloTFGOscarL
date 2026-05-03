<?php

namespace App\Modules\Employees\Application;

use App\Modules\Employees\Domain\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UsuarioApplicationService
{
    private function authenticatedUser(Request $request): ?Usuario
    {
        return $request->attributes->get('auth_user');
    }

    private function forbidIfNotSelfOrAdmin(Request $request, int $targetUserId): ?JsonResponse
    {
        $current = $this->authenticatedUser($request);
        if (! $current) {
            return response()->json([
                'message' => 'No autenticado.',
            ], 401);
        }

        if ($current->rol === 'Admin' || (int) $current->id_usuario === $targetUserId) {
            return null;
        }

        return response()->json([
            'message' => 'No autorizado.',
        ], 403);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Usuario::query();

        if ($request->filled('rol')) {
            $query->where('rol', $request->string('rol'));
        }

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('username', 'like', '%'.$q.'%')
                    ->orWhere('nombre', 'like', '%'.$q.'%')
                    ->orWhere('apellidos', 'like', '%'.$q.'%');
            });
        }

        return response()->json(
            $query->orderBy('username')->get(['id_usuario', 'nombre', 'apellidos', 'username', 'avatar_url', 'rol', 'created_at'])
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $forbidden = $this->forbidIfNotSelfOrAdmin($request, $id);
        if ($forbidden) {
            return $forbidden;
        }

        $usuario = Usuario::findOrFail($id);

        return response()->json([
            'id_usuario' => $usuario->id_usuario,
            'nombre' => $usuario->nombre,
            'apellidos' => $usuario->apellidos,
            'username' => $usuario->username,
            'avatar_url' => $usuario->avatar_url,
            'rol' => $usuario->rol,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'apellidos' => ['required', 'string', 'max:160'],
            'username' => ['required', 'string', 'max:80', 'unique:usuarios,username'],
            'password' => ['required', 'string', 'min:6', 'max:72'],
            'rol' => ['required', 'in:Admin,Empleado'],
        ]);

        $usuario = Usuario::create([
            'nombre' => $validated['nombre'],
            'apellidos' => $validated['apellidos'],
            'username' => $validated['username'],
            'password_hash' => Hash::make($validated['password']),
            'rol' => $validated['rol'],
        ]);

        return response()->json([
            'id_usuario' => $usuario->id_usuario,
            'nombre' => $usuario->nombre,
            'apellidos' => $usuario->apellidos,
            'username' => $usuario->username,
            'avatar_url' => $usuario->avatar_url,
            'rol' => $usuario->rol,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $usuario = Usuario::findOrFail($id);

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'apellidos' => ['required', 'string', 'max:160'],
            'username' => [
                'required',
                'string',
                'max:80',
                Rule::unique('usuarios', 'username')->ignore($usuario->id_usuario, 'id_usuario'),
            ],
            'password' => ['nullable', 'string', 'min:6', 'max:72'],
            'rol' => ['required', 'in:Admin,Empleado'],
        ]);

        $payload = [
            'nombre' => $validated['nombre'],
            'apellidos' => $validated['apellidos'],
            'username' => $validated['username'],
            'rol' => $validated['rol'],
        ];

        if (! empty($validated['password'])) {
            $payload['password_hash'] = Hash::make($validated['password']);
        }

        $usuario->update($payload);

        return response()->json([
            'id_usuario' => $usuario->id_usuario,
            'nombre' => $usuario->nombre,
            'apellidos' => $usuario->apellidos,
            'username' => $usuario->username,
            'avatar_url' => $usuario->avatar_url,
            'rol' => $usuario->rol,
        ]);
    }

    public function updatePerfil(Request $request, int $id): JsonResponse
    {
        $forbidden = $this->forbidIfNotSelfOrAdmin($request, $id);
        if ($forbidden) {
            return $forbidden;
        }

        $usuario = Usuario::findOrFail($id);

        $validated = $request->validate(
            [
                'nombre' => ['required', 'string', 'max:120'],
                'apellidos' => ['required', 'string', 'max:160'],
                'username' => [
                    'required',
                    'string',
                    'max:80',
                    Rule::unique('usuarios', 'username')->ignore($usuario->id_usuario, 'id_usuario'),
                ],
                'password' => ['nullable', 'string', 'min:6', 'max:72'],
                'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
                'remove_avatar' => ['nullable', 'boolean'],
            ],
            [
                'avatar.image' => 'El archivo seleccionado no es una imagen valida.',
                'avatar.mimes' => 'La imagen debe estar en formato JPG, PNG o WEBP.',
                'avatar.max' => 'La imagen no puede superar los 2MB.',
            ]
        );

        $payload = [
            'nombre' => $validated['nombre'],
            'apellidos' => $validated['apellidos'],
            'username' => $validated['username'],
        ];

        if (! empty($validated['password'])) {
            $payload['password_hash'] = Hash::make($validated['password']);
        }

        $removeAvatar = ! empty($validated['remove_avatar']);
        if ($removeAvatar && ! empty($usuario->avatar_url)) {
            $oldPath = ltrim(str_replace('/storage/', '', $usuario->avatar_url), '/');
            if ($oldPath !== '') {
                Storage::disk('public')->delete($oldPath);
            }
            $payload['avatar_url'] = null;
        }

        if ($request->hasFile('avatar')) {
            if (! empty($usuario->avatar_url)) {
                $oldPath = ltrim(str_replace('/storage/', '', $usuario->avatar_url), '/');
                if ($oldPath !== '') {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $storedPath = $request->file('avatar')->store('avatars', 'public');
            $payload['avatar_url'] = '/storage/'.$storedPath;
        }

        $usuario->update($payload);

        return response()->json([
            'id_usuario' => $usuario->id_usuario,
            'nombre' => $usuario->nombre,
            'apellidos' => $usuario->apellidos,
            'username' => $usuario->username,
            'avatar_url' => $usuario->avatar_url,
            'rol' => $usuario->rol,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $usuario = Usuario::findOrFail($id);

        if ($usuario->rol === 'Admin') {
            $adminsCount = Usuario::where('rol', 'Admin')->count();
            if ($adminsCount <= 1) {
                return response()->json([
                    'message' => 'No puedes eliminar el unico administrador del sistema.',
                ], 422);
            }
        }

        DB::transaction(function () use ($usuario) {
            DB::table('trabajos')
                ->where('id_empleado', $usuario->id_usuario)
                ->update([
                    'id_empleado' => null,
                    'updated_at' => now(),
                ]);

            DB::table('trabajo_asignaciones')
                ->where('id_empleado', $usuario->id_usuario)
                ->delete();

            DB::table('registro_jornadas')
                ->where('empleado_id', $usuario->id_usuario)
                ->delete();

            $usuario->delete();
        });

        return response()->json([
            'message' => 'Usuario eliminado',
        ]);
    }
}