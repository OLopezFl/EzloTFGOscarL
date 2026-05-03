<?php

namespace App\Providers;

use App\Modules\Auth\Domain\Ports\ApiTokenIssuerPort;
use App\Modules\Auth\Domain\Ports\UsuarioCredentialVerifierPort;
use App\Modules\Auth\Infrastructure\Auth\EloquentUsuarioCredentialVerifier;
use App\Modules\Auth\Infrastructure\Auth\LaravelApiTokenIssuer;
use App\Modules\PublicSite\Domain\Ports\FormularioMensajesPort;
use App\Modules\PublicSite\Infrastructure\Persistence\EloquentFormularioMensajesRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(FormularioMensajesPort::class, EloquentFormularioMensajesRepository::class);
        $this->app->bind(UsuarioCredentialVerifierPort::class, EloquentUsuarioCredentialVerifier::class);
        $this->app->bind(ApiTokenIssuerPort::class, LaravelApiTokenIssuer::class);
    }

    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $username = (string) $request->input('username', 'guest');
            $ip = (string) $request->ip();

            return [
                Limit::perMinute(5)->by(strtolower($username).'|'.$ip),
            ];
        });
    }
}