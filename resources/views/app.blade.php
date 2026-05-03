<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Ezlo Limpiezas</title>
    <link rel="icon" type="image/png" href="{{ asset('images/logoh.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
    <link rel="preload" as="image" href="{{ asset('images/lobby-main.jpg') }}">
    <link rel="preload" as="image" href="{{ asset('images/cubes-bg.jpg') }}">
    @viteReactRefresh
    @vite(['src/styles/app.css', 'src/app.jsx'])
</head>
<body>
    <div id="root"></div>
</body>
</html>
