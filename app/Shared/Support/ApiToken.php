<?php

namespace App\Shared\Support;

use App\Modules\Employees\Domain\Models\Usuario;

class ApiToken
{
    private const TTL_SECONDS = 43200;

    public static function issue(Usuario $usuario): string
    {
        $payload = [
            'uid' => (int) $usuario->id_usuario,
            'rol' => (string) $usuario->rol,
            'iat' => time(),
            'exp' => time() + self::TTL_SECONDS,
            'rnd' => bin2hex(random_bytes(8)),
        ];

        $encodedPayload = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signature = hash_hmac('sha256', $encodedPayload, self::signingKey());

        return $encodedPayload.'.'.$signature;
    }

    public static function resolveUser(?string $token): ?Usuario
    {
        if (! $token || ! str_contains($token, '.')) {
            return null;
        }

        [$encodedPayload, $signature] = explode('.', $token, 2);
        $expected = hash_hmac('sha256', $encodedPayload, self::signingKey());

        if (! hash_equals($expected, $signature)) {
            return null;
        }

        $decoded = json_decode(self::base64UrlDecode($encodedPayload), true);
        if (! is_array($decoded)) {
            return null;
        }

        $uid = isset($decoded['uid']) ? (int) $decoded['uid'] : 0;
        $rol = isset($decoded['rol']) ? (string) $decoded['rol'] : '';
        $exp = isset($decoded['exp']) ? (int) $decoded['exp'] : 0;

        if ($uid <= 0 || $exp < time()) {
            return null;
        }

        $usuario = Usuario::find($uid);
        if (! $usuario) {
            return null;
        }

        if ((string) $usuario->rol !== $rol) {
            return null;
        }

        return $usuario;
    }

    private static function signingKey(): string
    {
        $rawKey = (string) config('app.key', '');

        if (str_starts_with($rawKey, 'base64:')) {
            $decoded = base64_decode(substr($rawKey, 7), true);
            if ($decoded !== false) {
                return $decoded;
            }
        }

        return $rawKey;
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder > 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        return (string) base64_decode(strtr($value, '-_', '+/'));
    }
}
