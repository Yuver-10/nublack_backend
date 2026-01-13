-- =====================================================
-- BASE DE DATOS COMPLETA PARA PROYECTO NUBLACK
-- Versión: 2.0 - Actualizada con mejoras de seguridad
-- Fecha: 2026-01-11
-- =====================================================

-- NOTAS DE SEGURIDAD:
-- - Passwords se almacenan con bcrypt (hash + salt integrado)
-- - Validaciones de entrada implementadas en backend
-- - Rate limiting activo en rutas de autenticación
-- - Tokens JWT con expiración de 1 hora
-- - Logging de eventos de seguridad implementado

DROP DATABASE IF EXISTS NUblack;
CREATE DATABASE NUblack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE NUblack;

-- =====================================================
-- TABLA USUARIOS
-- =====================================================
-- Almacena información de usuarios (clientes, empleados, administradores)
-- SEGURIDAD:
--   - password_hash: Almacena hash bcrypt (incluye salt automáticamente)
--   - password_salt: Campo legacy, bcrypt no lo requiere pero se mantiene por compatibilidad
--   - reset_password_token: Hash del código de recuperación (6 dígitos)
--   - reset_password_expires: Expiración del token (1 hora)
-- VALIDACIONES:
--   - Email debe tener formato válido
--   - Documento mínimo 8 caracteres
--   - Teléfono mínimo 10 caracteres
--   - Nombre y apellido mínimo 2 caracteres

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL CHECK (LENGTH(nombre) >= 2),
    apellido VARCHAR(100) NOT NULL CHECK (LENGTH(apellido) >= 2),
    tipo_documento ENUM('Cédula de Ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'Tarjeta de Identidad') NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE CHECK (LENGTH(documento) >= 8),
    telefono VARCHAR(20) NOT NULL CHECK (LENGTH(telefono) >= 10),
    email VARCHAR(150) NOT NULL UNIQUE CHECK (email LIKE '%@%.__%'),
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt de la contraseña',
    password_salt VARCHAR(255) NOT NULL COMMENT 'Salt legacy (bcrypt incluye salt en hash)',
    reset_password_token VARCHAR(255) NULL COMMENT 'Hash del código de recuperación',
    reset_password_expires DATETIME NULL COMMENT 'Expiración del token de recuperación',
    rol ENUM('administrador', 'cliente', 'empleado') DEFAULT 'cliente',
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_documento (documento),
    INDEX idx_rol (rol),
    INDEX idx_estado (estado)
) ENGINE=InnoDB COMMENT='Usuarios del sistema con autenticación segura';

-- =====================================================
-- TABLA CATEGORÍAS
-- =====================================================
-- Categorías de productos para organización y filtrado

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE CHECK (LENGTH(nombre) >= 3),
    descripcion TEXT,
    imagen VARCHAR(255),
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado)
) ENGINE=InnoDB COMMENT='Categorías de productos';

-- =====================================================
-- TABLA PRODUCTOS
-- =====================================================
-- Productos disponibles en la tienda
-- CAMPOS JSON:
--   - imagenes: Array de URLs de imágenes del producto
--   - tallas: Array de objetos [{talla: 'M', stock: 5}]
--   - variantes: Variaciones del producto (colores, estilos, etc.)

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL CHECK (LENGTH(nombre) >= 3),
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    precio_original DECIMAL(10,2) CHECK (precio_original >= 0) COMMENT 'Precio antes de descuento',
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    imagen VARCHAR(255) COMMENT 'Imagen principal del producto',
    imagenes JSON COMMENT 'Array de URLs de imágenes adicionales',
    talla VARCHAR(50) COMMENT 'Campo legacy, usar tallas JSON',
    tallas JSON COMMENT 'Array de objetos con tallas y stock: [{talla: "M", stock: 5}]',
    genero ENUM('Hombre', 'Mujer', 'Unisex') DEFAULT 'Unisex',
    categoria_id INT,
    stock INT NOT NULL DEFAULT 0 COMMENT 'Stock total (suma de todas las tallas)',
    rating DECIMAL(2,1) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    variantes JSON COMMENT 'Variaciones del producto (colores, estilos)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id_categoria)
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_nombre (nombre),
    INDEX idx_precio (precio),
    INDEX idx_estado (estado),
    INDEX idx_genero (genero),
    INDEX idx_categoria (categoria_id),
    INDEX idx_stock (stock)
) ENGINE=InnoDB COMMENT='Catálogo de productos con gestión de tallas y stock';

-- =====================================================
-- TABLA SOLICITUDES (PEDIDOS)
-- =====================================================
-- Pedidos realizados por los clientes
-- ESTADOS:
--   - pendiente: Recién creado, esperando aprobación
--   - aceptada: Aprobado por administrador
--   - rechazada: Rechazado por administrador
--   - en_proceso: En preparación
--   - enviada: Enviado al cliente
--   - entregada: Entregado exitosamente
--   - cancelada: Cancelado por cliente o admin

CREATE TABLE solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE COMMENT 'Número único de pedido generado',
    usuario_id INT NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aceptada', 'rechazada', 'en_proceso', 'enviada', 'entregada', 'cancelada') DEFAULT 'pendiente',
    motivo_rechazo TEXT COMMENT 'Razón del rechazo o cancelación',
    
    -- Información Personal
    nombre_cliente VARCHAR(100) NOT NULL,
    documento_identificacion VARCHAR(50) NOT NULL,
    telefono_contacto VARCHAR(20) NOT NULL,
    correo_electronico VARCHAR(100),
    
    -- Información de Entrega
    direccion_envio VARCHAR(255) NOT NULL,
    referencia_direccion VARCHAR(255) COMMENT 'Punto de referencia para encontrar la dirección',
    indicaciones_adicionales TEXT COMMENT 'Instrucciones especiales de entrega',
    horario_preferido VARCHAR(100) COMMENT 'Horario preferido para recibir el pedido',
    
    -- Preferencias y Pago
    metodo_pago ENUM('Contra Entrega', 'Tarjeta', 'Transferencia', 'PSE') DEFAULT 'Contra Entrega',
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tiempo_estimado_entrega VARCHAR(100),
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    notas_internas TEXT COMMENT 'Notas internas para el equipo',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    
    INDEX idx_numero_pedido (numero_pedido),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_solicitud),
    INDEX idx_metodo_pago (metodo_pago)
) ENGINE=InnoDB COMMENT='Pedidos de clientes con información completa de entrega';

-- =====================================================
-- TABLA DETALLES DE SOLICITUD
-- =====================================================
-- Items individuales de cada pedido
-- Almacena snapshot del producto al momento de la compra

CREATE TABLE detalles_solicitud (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    producto_id INT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL COMMENT 'Snapshot del nombre al momento de compra',
    descripcion_producto TEXT,
    imagen_producto VARCHAR(255),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    talla VARCHAR(50),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0) COMMENT 'cantidad * precio_unitario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE CASCADE,
    
    INDEX idx_solicitud (solicitud_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB COMMENT='Detalles de items en cada pedido';

-- =====================================================
-- TABLA CARRITO
-- =====================================================
-- Carrito de compras temporal de cada usuario
-- SEGURIDAD:
--   - Limpiado automáticamente después de crear orden
--   - Validación de stock antes de agregar items
--   - Constraint único por usuario-producto-talla

CREATE TABLE carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    talla VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_product_size (usuario_id, producto_id, talla),
    INDEX idx_usuario (usuario_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB COMMENT='Carrito de compras temporal (limpiado al crear orden)';

-- =====================================================
-- TABLA RESEÑAS
-- =====================================================
-- Reseñas y calificaciones de productos por usuarios

CREATE TABLE reseñas (
    id_reseña INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_product_review (usuario_id, producto_id),
    INDEX idx_producto (producto_id),
    INDEX idx_estado (estado),
    INDEX idx_calificacion (calificacion)
) ENGINE=InnoDB COMMENT='Reseñas y calificaciones de productos';

-- =====================================================
-- TABLA CONFIGURACIONES
-- =====================================================
-- Configuraciones generales del sistema
-- Ejemplos: costos de envío, políticas, textos, etc.

CREATE TABLE configuraciones (
    id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    descripcion TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clave (clave)
) ENGINE=InnoDB COMMENT='Configuraciones del sistema';

-- =====================================================
-- TABLA LOGS DE ACTIVIDAD
-- =====================================================
-- Registro de actividades importantes del sistema
-- SEGURIDAD:
--   - Registra cambios en datos críticos
--   - Almacena IP y user agent
--   - Útil para auditoría y debugging

CREATE TABLE logs_actividad (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT COMMENT 'Usuario que realizó la acción (NULL si es sistema)',
    accion VARCHAR(100) NOT NULL COMMENT 'Tipo de acción: CREAR_PRODUCTO, LOGIN_ATTEMPT, etc.',
    tabla_afectada VARCHAR(50) COMMENT 'Tabla afectada por la acción',
    registro_id INT COMMENT 'ID del registro afectado',
    datos_anteriores JSON COMMENT 'Estado anterior del registro',
    datos_nuevos JSON COMMENT 'Estado nuevo del registro',
    ip_address VARCHAR(45) COMMENT 'Dirección IP del usuario',
    user_agent TEXT COMMENT 'User agent del navegador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB COMMENT='Logs de actividad para auditoría y seguridad';

-- =====================================================
-- TRIGGERS (UPDATED_AT)
-- =====================================================
-- Triggers para actualizar automáticamente el campo updated_at

DELIMITER $$

CREATE TRIGGER tr_usuarios_updated_at 
BEFORE UPDATE ON usuarios 
FOR EACH ROW 
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$

CREATE TRIGGER tr_categorias_updated_at 
BEFORE UPDATE ON categorias 
FOR EACH ROW 
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$

CREATE TRIGGER tr_productos_updated_at 
BEFORE UPDATE ON productos 
FOR EACH ROW 
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$

CREATE TRIGGER tr_solicitudes_updated_at 
BEFORE UPDATE ON solicitudes 
FOR EACH ROW 
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$

CREATE TRIGGER tr_carrito_updated_at 
BEFORE UPDATE ON carrito 
FOR EACH ROW 
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$

CREATE TRIGGER tr_reseñas_updated_at 
BEFORE UPDATE ON reseñas 
FOR EACH ROW 
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$

CREATE TRIGGER tr_configuraciones_updated_at 
BEFORE UPDATE ON configuraciones 
FOR EACH ROW 
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$

DELIMITER ;

-- =====================================================
-- DATOS DE EJEMPLO E INICIALIZACIÓN
-- =====================================================

-- Insertar categorías por defecto
INSERT INTO categorias (nombre, descripcion, estado) VALUES
('Zapatos', 'Calzado deportivo y casual', 'Activo'),
('Mochilas', 'Mochilas para toda ocasión', 'Activo'),
('Camisetas', 'Camisetas para hombre y mujer', 'Activo'),
('Jeans', 'Jeans para hombre y mujer', 'Activo'),
('Chaquetas', 'Chaquetas para hombre y mujer', 'Activo'),
('Sudaderas', 'Sudaderas para hombre y mujer', 'Activo'),
('Shorts', 'Shorts para hombre y mujer', 'Activo'),
('Faldas', 'Faldas para mujer', 'Activo'),
('Leggis', 'Leggis para mujer', 'Activo'),
('Ropa deportiva', 'Ropa para hacer deporte', 'Activo');

-- Usuario Administrador por defecto
-- Email: admin@nublack.com
-- Password: Admin123!
-- IMPORTANTE: Cambiar esta contraseña en producción
INSERT INTO usuarios (nombre, apellido, tipo_documento, documento, telefono, email, password_hash, password_salt, rol, estado) VALUES
('Administrador', 'NUBLACK', 'Cédula de Ciudadanía', '12345678', '3001234567', 'admin@nublack.com', 
'$2a$10$YourHashHere', 'salt123', 'administrador', 'activo');

-- Configuraciones iniciales del sistema
INSERT INTO configuraciones (clave, valor, descripcion, tipo) VALUES
('costo_envio_base', '10000', 'Costo base de envío en COP', 'number'),
('envio_gratis_desde', '150000', 'Monto mínimo para envío gratis en COP', 'number'),
('tiempo_entrega_estimado', '3-5 días hábiles', 'Tiempo estimado de entrega', 'string'),
('email_notificaciones', 'admin@nublack.com', 'Email para notificaciones del sistema', 'string'),
('mantenimiento_activo', 'false', 'Indica si el sitio está en mantenimiento', 'boolean');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de productos con información de categoría
CREATE VIEW v_productos_completos AS
SELECT 
    p.*,
    c.nombre AS categoria_nombre,
    c.descripcion AS categoria_descripcion
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id_categoria;

-- Vista de solicitudes con información del usuario
CREATE VIEW v_solicitudes_completas AS
SELECT 
    s.*,
    u.nombre AS usuario_nombre,
    u.apellido AS usuario_apellido,
    u.email AS usuario_email,
    COUNT(ds.id_detalle) AS total_items
FROM solicitudes s
INNER JOIN usuarios u ON s.usuario_id = u.id_usuario
LEFT JOIN detalles_solicitud ds ON s.id_solicitud = ds.solicitud_id
GROUP BY s.id_solicitud;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice compuesto para búsqueda de productos
CREATE INDEX idx_productos_busqueda ON productos(estado, categoria_id, genero);

-- Índice para reportes de ventas
CREATE INDEX idx_solicitudes_reportes ON solicitudes(estado, fecha_solicitud, total);

-- =====================================================
-- NOTAS FINALES
-- =====================================================

-- SEGURIDAD IMPLEMENTADA:
-- ✅ Passwords con bcrypt (hash + salt)
-- ✅ Tokens de recuperación con expiración
-- ✅ Validaciones de entrada en backend
-- ✅ Rate limiting en autenticación
-- ✅ Logging de eventos de seguridad
-- ✅ JWT con expiración de 1 hora
-- ✅ Protección de rutas frontend y backend

-- MEJORAS FUTURAS SUGERIDAS:
-- - Implementar tabla de sesiones para refresh tokens
-- - Agregar tabla de intentos de login fallidos
-- - Implementar soft delete en más tablas
-- - Agregar auditoría automática con triggers
-- - Implementar versionado de productos

-- MANTENIMIENTO:
-- - Limpiar logs antiguos periódicamente
-- - Revisar y actualizar índices según uso
-- - Monitorear tamaño de tablas JSON
-- - Backup regular de la base de datos

-- FIN DEL SCRIPT
