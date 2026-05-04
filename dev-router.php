<?php

declare(strict_types=1);
$uriRaw = $_SERVER['REQUEST_URI'] ?? '/';
$uri = rawurldecode((string) parse_url($uriRaw, PHP_URL_PATH)) ?: '/';

if (str_contains($uri, '..')) {
    http_response_code(400);
    exit('Bad request');
}

$publicRoot = realpath(__DIR__.'/public');
if ($publicRoot === false) {
    http_response_code(500);
    exit('Directorio public no encontrado');
}
$storagePublicRoot = realpath(__DIR__.'/storage/app/public');

if ($uri !== '/' && $uri !== '') {
    $relative = $uri[0] === '/' ? substr($uri, 1) : $uri;
    $candidate = $publicRoot.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);

    if (! str_ends_with(strtolower($candidate), '.php') && is_file($candidate)) {
        $real = realpath($candidate);
        $allowedRoots = [$publicRoot];
        if ($storagePublicRoot !== false) {
            $allowedRoots[] = $storagePublicRoot;
        }

        $isInsideAllowedRoot = false;
        if ($real !== false) {
            foreach ($allowedRoots as $root) {
                if ($real === $root || str_starts_with($real, $root.DIRECTORY_SEPARATOR)) {
                    $isInsideAllowedRoot = true;
                    break;
                }
            }
        }

        if ($real !== false && $isInsideAllowedRoot) {
            $ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
            $mime = [
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
                'css' => 'text/css',
                'js' => 'application/javascript',
                'json' => 'application/json',
                'ico' => 'image/x-icon',
                'woff2' => 'font/woff2',
                'woff' => 'font/woff',
                'ttf' => 'font/ttf',
                'txt' => 'text/plain',
                'map' => 'application/json',
            ];
            $mimeHeader = $mime[$ext] ?? 'application/octet-stream';
            header('Content-Type: '.$mimeHeader);
            header('Content-Length: '.(string) filesize($real));
            readfile($real);
            exit;
        }
    }
}

require_once $publicRoot.'/index.php';
