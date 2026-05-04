SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `ezlo_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ezlo_db`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `formularios`
--

CREATE TABLE `formularios` (
  `id_mensaje` bigint(20) UNSIGNED NOT NULL,
  `remitente_nombre` varchar(255) NOT NULL,
  `remitente_email` varchar(255) NOT NULL,
  `cuerpo_mensaje` text NOT NULL,
  `fecha_recepcion` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('Leído','Pendiente') NOT NULL DEFAULT 'Pendiente',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_auditoria_trabajos`
--

CREATE TABLE `registro_auditoria_trabajos` (
  `id_registro_auditoria_trabajo` bigint(20) UNSIGNED NOT NULL,
  `id_trabajo` bigint(20) UNSIGNED NOT NULL,
  `id_admin` bigint(20) UNSIGNED NOT NULL,
  `tiempo_estimado_anterior` int(11) DEFAULT NULL,
  `tiempo_estimado_nuevo` int(11) DEFAULT NULL,
  `tiempo_real_anterior` int(11) DEFAULT NULL,
  `tiempo_real_nuevo` int(11) DEFAULT NULL,
  `notas_anterior` text DEFAULT NULL,
  `notas_nueva` text DEFAULT NULL,
  `motivo_ajuste` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_jornadas`
--

CREATE TABLE `registro_jornadas` (
  `id_registro_jornada` bigint(20) UNSIGNED NOT NULL,
  `empleado_id` bigint(20) UNSIGNED NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` datetime NOT NULL,
  `hora_fin` datetime DEFAULT NULL,
  `modificado_por_admin` tinyint(1) NOT NULL DEFAULT 0,
  `motivo_modificacion_admin` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_pausas_trabajo`
--

CREATE TABLE `registro_pausas_trabajo` (
  `id_registro_pausa` bigint(20) UNSIGNED NOT NULL,
  `id_trabajo` bigint(20) UNSIGNED NOT NULL,
  `inicio_pausa` datetime NOT NULL,
  `fin_pausa` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajos`
--

CREATE TABLE `trabajos` (
  `id_trabajo` bigint(20) UNSIGNED NOT NULL,
  `id_cliente` bigint(20) UNSIGNED NOT NULL,
  `id_plantilla` bigint(20) UNSIGNED DEFAULT NULL,
  `id_empleado` bigint(20) UNSIGNED DEFAULT NULL,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `inicio_operativo` datetime DEFAULT NULL,
  `fin_operativo` datetime DEFAULT NULL,
  `descripcion_tarea` text NOT NULL,
  `duracion_minutos` int(10) UNSIGNED NOT NULL DEFAULT 60,
  `tiempo_estimado` int(10) UNSIGNED DEFAULT NULL,
  `tiempo_real_efectivo` int(10) UNSIGNED DEFAULT NULL,
  `personas_requeridas` tinyint(3) UNSIGNED DEFAULT NULL,
  `dia_semana` tinyint(3) UNSIGNED DEFAULT NULL,
  `ubicacion` varchar(180) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `notas_empleado` text DEFAULT NULL,
  `estado` enum('pendiente','en_curso','pausado','finalizado') NOT NULL DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajo_asignaciones`
--

CREATE TABLE `trabajo_asignaciones` (
  `id_asignacion` bigint(20) UNSIGNED NOT NULL,
  `id_trabajo` bigint(20) UNSIGNED NOT NULL,
  `id_empleado` bigint(20) UNSIGNED NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajo_plantillas`
--

CREATE TABLE `trabajo_plantillas` (
  `id_plantilla` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(140) NOT NULL,
  `id_cliente` bigint(20) UNSIGNED NOT NULL,
  `descripcion_tarea` text NOT NULL,
  `duracion_minutos` int(10) UNSIGNED NOT NULL DEFAULT 60,
  `personas_requeridas` tinyint(3) UNSIGNED DEFAULT NULL,
  `dia_semana` tinyint(3) UNSIGNED DEFAULT NULL,
  `ubicacion` varchar(180) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(120) DEFAULT NULL,
  `apellidos` varchar(160) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('Admin','Empleado') NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `apellidos`, `username`, `password_hash`, `rol`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'Sistema', 'admin', '$2y$12$gNmrEECQ9yXoGrDtpD4BeusoCbYOMPOwQTb14NqX4RFGnYujc6wJS', 'Admin', NULL, '2026-04-16 10:00:00', '2026-04-25 07:13:29');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `formularios`
--
ALTER TABLE `formularios`
  ADD PRIMARY KEY (`id_mensaje`),
  ADD KEY `formularios_estado_fecha_recepcion_idx` (`estado`,`fecha_recepcion`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `registro_auditoria_trabajos`
--
ALTER TABLE `registro_auditoria_trabajos`
  ADD PRIMARY KEY (`id_registro_auditoria_trabajo`),
  ADD KEY `auditoria_trabajo_fecha_idx` (`id_trabajo`,`created_at`),
  ADD KEY `auditoria_admin_fecha_idx` (`id_admin`,`created_at`);

--
-- Indices de la tabla `registro_jornadas`
--
ALTER TABLE `registro_jornadas`
  ADD PRIMARY KEY (`id_registro_jornada`),
  ADD KEY `registro_jornadas_empleado_fecha_idx` (`empleado_id`,`fecha`),
  ADD KEY `registro_jornadas_modificado_idx` (`modificado_por_admin`);

--
-- Indices de la tabla `registro_pausas_trabajo`
--
ALTER TABLE `registro_pausas_trabajo`
  ADD PRIMARY KEY (`id_registro_pausa`),
  ADD KEY `registro_pausas_trabajo_idx` (`id_trabajo`,`inicio_pausa`);

--
-- Indices de la tabla `trabajos`
--
ALTER TABLE `trabajos`
  ADD PRIMARY KEY (`id_trabajo`),
  ADD KEY `trabajos_estado_fecha_inicio_idx` (`estado`,`fecha_inicio`),
  ADD KEY `trabajos_id_plantilla_idx` (`id_plantilla`),
  ADD KEY `trabajos_dia_semana_idx` (`dia_semana`),
  ADD KEY `trabajos_estado_operativo_idx` (`estado`),
  ADD KEY `trabajos_id_cliente_foreign` (`id_cliente`),
  ADD KEY `trabajos_id_empleado_foreign` (`id_empleado`);

--
-- Indices de la tabla `trabajo_asignaciones`
--
ALTER TABLE `trabajo_asignaciones`
  ADD PRIMARY KEY (`id_asignacion`),
  ADD UNIQUE KEY `trabajo_asignaciones_id_trabajo_id_empleado_unique` (`id_trabajo`,`id_empleado`),
  ADD KEY `trabajo_asig_trabajo_fecha_idx` (`id_trabajo`,`fecha_inicio`),
  ADD KEY `trabajo_asig_empleado_fecha_idx` (`id_empleado`,`fecha_inicio`);

--
-- Indices de la tabla `trabajo_plantillas`
--
ALTER TABLE `trabajo_plantillas`
  ADD PRIMARY KEY (`id_plantilla`),
  ADD KEY `trabajo_plantillas_dia_semana_idx` (`dia_semana`),
  ADD KEY `trabajo_plantillas_id_cliente_foreign` (`id_cliente`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `usuarios_username_unique` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `formularios`
--
ALTER TABLE `formularios`
  MODIFY `id_mensaje` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `registro_auditoria_trabajos`
--
ALTER TABLE `registro_auditoria_trabajos`
  MODIFY `id_registro_auditoria_trabajo` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `registro_jornadas`
--
ALTER TABLE `registro_jornadas`
  MODIFY `id_registro_jornada` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `registro_pausas_trabajo`
--
ALTER TABLE `registro_pausas_trabajo`
  MODIFY `id_registro_pausa` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `trabajos`
--
ALTER TABLE `trabajos`
  MODIFY `id_trabajo` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `trabajo_asignaciones`
--
ALTER TABLE `trabajo_asignaciones`
  MODIFY `id_asignacion` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `trabajo_plantillas`
--
ALTER TABLE `trabajo_plantillas`
  MODIFY `id_plantilla` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `registro_auditoria_trabajos`
--
ALTER TABLE `registro_auditoria_trabajos`
  ADD CONSTRAINT `auditoria_trabajos_id_admin_foreign` FOREIGN KEY (`id_admin`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `auditoria_trabajos_id_trabajo_foreign` FOREIGN KEY (`id_trabajo`) REFERENCES `trabajos` (`id_trabajo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `registro_jornadas`
--
ALTER TABLE `registro_jornadas`
  ADD CONSTRAINT `registro_jornadas_empleado_id_foreign` FOREIGN KEY (`empleado_id`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `registro_pausas_trabajo`
--
ALTER TABLE `registro_pausas_trabajo`
  ADD CONSTRAINT `registro_pausas_trabajo_id_trabajo_foreign` FOREIGN KEY (`id_trabajo`) REFERENCES `trabajos` (`id_trabajo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `trabajos`
--
ALTER TABLE `trabajos`
  ADD CONSTRAINT `trabajos_id_cliente_foreign` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE,
  ADD CONSTRAINT `trabajos_id_empleado_foreign` FOREIGN KEY (`id_empleado`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `trabajos_id_plantilla_foreign` FOREIGN KEY (`id_plantilla`) REFERENCES `trabajo_plantillas` (`id_plantilla`) ON DELETE SET NULL;

--
-- Filtros para la tabla `trabajo_asignaciones`
--
ALTER TABLE `trabajo_asignaciones`
  ADD CONSTRAINT `trabajo_asignaciones_id_empleado_foreign` FOREIGN KEY (`id_empleado`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `trabajo_asignaciones_id_trabajo_foreign` FOREIGN KEY (`id_trabajo`) REFERENCES `trabajos` (`id_trabajo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `trabajo_plantillas`
--
ALTER TABLE `trabajo_plantillas`
  ADD CONSTRAINT `trabajo_plantillas_id_cliente_foreign` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE;
COMMIT;
