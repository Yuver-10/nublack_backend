-- =====================================================
-- BASE DE DATOS COMPLETA PARA PROYECTO NUBLACK
-- =====================================================
-- Este archivo contiene la estructura completa de la base de datos
-- para el proyecto NUblack, incluyendo todas las tablas, relaciones,
-- índices, triggers y datos de ejemplo.

USE NUblack;

-- =====================================================
-- TABLA USUARIOS
-- =====================================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL CHECK (LENGTH(nombre) >= 2),
    apellido VARCHAR(100) NOT NULL CHECK (LENGTH(apellido) >= 2),
    tipo_documento ENUM('Cédula de Ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'Tarjeta de Identidad') NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE CHECK (LENGTH(documento) >= 8),
    telefono VARCHAR(20) NOT NULL CHECK (LENGTH(telefono) >= 10),
    email VARCHAR(150) NOT NULL UNIQUE CHECK (email LIKE '%@%.__%'),
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'cliente', 'empleado') DEFAULT 'cliente',
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para optimizar consultas
    INDEX idx_email (email),
    INDEX idx_documento (documento),
    INDEX idx_rol (rol),
    INDEX idx_estado (estado)
);

-- =====================================================
-- TABLA CATEGORÍAS
-- =====================================================
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE CHECK (LENGTH(nombre) >= 3),
    descripcion TEXT,
    imagen VARCHAR(255),
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado)
);

-- =====================================================
-- TABLA PRODUCTOS
-- =====================================================
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL CHECK (LENGTH(nombre) >= 3),
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    precio_original DECIMAL(10,2) CHECK (precio_original >= 0),
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    imagen VARCHAR(255),
    imagenes JSON, -- Para múltiples imágenes
    talla VARCHAR(50),
    tallas JSON, -- Para múltiples tallas disponibles
    genero ENUM('Hombre', 'Mujer', 'Unisex') DEFAULT 'Unisex',
    categoria_id INT,
    stock INT NOT NULL DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    variantes JSON, -- Para variantes del producto
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id_categoria)
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_nombre (nombre),
    INDEX idx_precio (precio),
    INDEX idx_estado (estado),
    INDEX idx_genero (genero),
    INDEX idx_categoria (categoria_id),
    INDEX idx_rating (rating)
);

-- =====================================================
-- TABLA SOLICITUDES (PEDIDOS)
-- =====================================================
CREATE TABLE solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aceptada', 'rechazada', 'en_proceso', 'enviada', 'entregada', 'cancelada') DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    
    -- Información Personal
    nombre_cliente VARCHAR(100) NOT NULL,
    documento_identificacion VARCHAR(50) NOT NULL,
    telefono_contacto VARCHAR(20) NOT NULL,
    correo_electronico VARCHAR(100),
    
    -- Información de Entrega
    direccion_envio VARCHAR(255) NOT NULL,
    referencia_direccion VARCHAR(255),
    indicaciones_adicionales TEXT,
    horario_preferido VARCHAR(100),
    
    -- Preferencias y Pago
    metodo_pago ENUM('Contra Entrega', 'Tarjeta', 'Transferencia', 'PSE') DEFAULT 'Contra Entrega',
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tiempo_estimado_entrega VARCHAR(100),
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    notas_internas TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relación
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_numero_pedido (numero_pedido),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_solicitud (fecha_solicitud),
    INDEX idx_metodo_pago (metodo_pago)
);

-- =====================================================
-- TABLA DETALLES DE SOLICITUD (PRODUCTOS EN EL PEDIDO)
-- =====================================================
CREATE TABLE detalles_solicitud (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    producto_id INT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    descripcion_producto TEXT,
    imagen_producto VARCHAR(255),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    talla VARCHAR(50),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_solicitud (solicitud_id),
    INDEX idx_producto (producto_id)
);

-- =====================================================
-- TABLA CARRITO DE COMPRAS
-- =====================================================
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
    
    -- Índices
    INDEX idx_usuario (usuario_id),
    INDEX idx_producto (producto_id),
    UNIQUE KEY unique_user_product_size (usuario_id, producto_id, talla)
);

-- =====================================================
-- TABLA RESEÑAS DE PRODUCTOS
-- =====================================================
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
    
    -- Índices
    INDEX idx_usuario (usuario_id),
    INDEX idx_producto (producto_id),
    INDEX idx_calificacion (calificacion),
    INDEX idx_estado (estado),
    UNIQUE KEY unique_user_product_review (usuario_id, producto_id)
);

-- =====================================================
-- TABLA CONFIGURACIONES DEL SISTEMA
-- =====================================================
CREATE TABLE configuraciones (
    id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    descripcion TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clave (clave)
);

-- =====================================================
-- TABLA LOGS DE ACTIVIDAD
-- =====================================================
CREATE TABLE logs_actividad (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_fecha (created_at)
);

-- =====================================================
-- TRIGGERS PARA AUDITORÍA
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
DELIMITER $$

CREATE TRIGGER tr_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER tr_categorias_updated_at
    BEFORE UPDATE ON categorias
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER tr_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER tr_solicitudes_updated_at
    BEFORE UPDATE ON solicitudes
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER tr_carrito_updated_at
    BEFORE UPDATE ON carrito
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER tr_reseñas_updated_at
    BEFORE UPDATE ON reseñas
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER tr_configuraciones_updated_at
    BEFORE UPDATE ON configuraciones
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- =====================================================
-- DATOS DE EJEMPLO
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

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, apellido, tipo_documento, documento, telefono, email, password_hash, password_salt, rol, estado) VALUES
('Administrador', 'NUBLACK', 'Cédula de Ciudadanía', '12345678', '3001234567', 'admin@nublack.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6u', 'salt123', 'administrador', 'activo');

-- Insertar algunos productos de ejemplo
INSERT INTO productos (nombre, precio, precio_original, descripcion, estado, imagen, genero, categoria_id, stock, rating) VALUES
('Jordan Air 1', 450000, 500000, 'Zapatillas deportivas de alta calidad con tecnología Air', 'activo', '/images/jordan1.jpg', 'Unisex', 1, 50, 4.8),
('Nike Air Max 270', 380000, 420000, 'Zapatillas cómodas para running con amortiguación Max Air', 'activo', '/images/nike270.jpg', 'Unisex', 1, 30, 4.6),
('Mochila Nike Heritage', 120000, 150000, 'Mochila resistente y espaciosa para uso diario', 'activo', '/images/mochila-nike.jpg', 'Unisex', 2, 25, 4.5),
('Camiseta Básica Algodón', 45000, 60000, 'Camiseta 100% algodón, cómoda y fresca', 'activo', '/images/camiseta-basica.jpg', 'Unisex', 3, 100, 4.3),
('Jeans Slim Fit', 180000, 220000, 'Jeans de corte slim con elastano para mayor comodidad', 'activo', '/images/jeans-slim.jpg', 'Hombre', 4, 40, 4.4);

-- Insertar configuraciones del sistema
INSERT INTO configuraciones (clave, valor, descripcion, tipo) VALUES
('tienda_nombre', 'NUblack', 'Nombre de la tienda', 'string'),
('tienda_descripcion', 'Tienda de ropa y calzado deportivo', 'Descripción de la tienda', 'string'),
('tienda_telefono', '3001234567', 'Teléfono de contacto de la tienda', 'string'),
('tienda_email', 'contacto@nublack.com', 'Email de contacto de la tienda', 'string'),
('tienda_direccion', 'Calle 123 #45-67, Bogotá', 'Dirección de la tienda', 'string'),
('envio_gratis_desde', '200000', 'Monto mínimo para envío gratis', 'number'),
('costo_envio', '15000', 'Costo de envío estándar', 'number'),
('moneda', 'COP', 'Moneda de la tienda', 'string'),
('impuestos_habilitados', 'true', 'Si los impuestos están habilitados', 'boolean'),
('reservas_habilitadas', 'true', 'Si las reservas están habilitadas', 'boolean');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para productos con información de categoría
CREATE VIEW vista_productos_completos AS
SELECT 
    p.id_producto,
    p.nombre,
    p.precio,
    p.precio_original,
    p.descripcion,
    p.estado,
    p.imagen,
    p.genero,
    p.stock,
    p.rating,
    c.nombre as categoria_nombre,
    c.descripcion as categoria_descripcion,
    p.created_at,
    p.updated_at
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id_categoria;

-- Vista para solicitudes con información del cliente
CREATE VIEW vista_solicitudes_completas AS
SELECT 
    s.id_solicitud,
    s.numero_pedido,
    s.fecha_solicitud,
    s.estado,
    s.total,
    s.metodo_pago,
    u.nombre as cliente_nombre,
    u.apellido as cliente_apellido,
    u.email as cliente_email,
    u.telefono as cliente_telefono,
    s.created_at,
    s.updated_at
FROM solicitudes s
LEFT JOIN usuarios u ON s.usuario_id = u.id_usuario;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

-- Procedimiento para obtener estadísticas de ventas
DELIMITER $$
CREATE PROCEDURE sp_estadisticas_ventas(IN fecha_inicio DATE, IN fecha_fin DATE)
BEGIN
    SELECT 
        COUNT(*) as total_solicitudes,
        SUM(total) as ventas_totales,
        AVG(total) as promedio_venta,
        COUNT(CASE WHEN estado = 'entregada' THEN 1 END) as solicitudes_entregadas,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as solicitudes_pendientes
    FROM solicitudes 
    WHERE DATE(fecha_solicitud) BETWEEN fecha_inicio AND fecha_fin;
END$$
DELIMITER ;

-- Procedimiento para obtener productos más vendidos
DELIMITER $$
CREATE PROCEDURE sp_productos_mas_vendidos(IN limite INT)
BEGIN
    SELECT 
        p.id_producto,
        p.nombre,
        p.precio,
        SUM(ds.cantidad) as total_vendido,
        SUM(ds.subtotal) as ingresos_totales
    FROM productos p
    INNER JOIN detalles_solicitud ds ON p.id_producto = ds.producto_id
    INNER JOIN solicitudes s ON ds.solicitud_id = s.id_solicitud
    WHERE s.estado = 'entregada'
    GROUP BY p.id_producto, p.nombre, p.precio
    ORDER BY total_vendido DESC
    LIMIT limite;
END$$
DELIMITER ;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_solicitudes_fecha_estado ON solicitudes(fecha_solicitud, estado);
CREATE INDEX idx_productos_categoria_estado ON productos(categoria_id, estado);
CREATE INDEX idx_detalles_solicitud_producto ON detalles_solicitud(solicitud_id, producto_id);

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================
/*
ESTRUCTURA COMPLETA DE LA BASE DE DATOS NUBLACK

Esta base de datos incluye:

1. TABLAS PRINCIPALES:
   - usuarios: Gestión de usuarios del sistema
   - categorias: Categorías de productos
   - productos: Catálogo de productos
   - solicitudes: Pedidos/solicitudes de compra
   - detalles_solicitud: Productos específicos en cada pedido
   - carrito: Carrito de compras de usuarios
   - reseñas: Reseñas de productos
   - configuraciones: Configuraciones del sistema
   - logs_actividad: Auditoría del sistema

2. CARACTERÍSTICAS:
   - Triggers automáticos para updated_at
   - Índices optimizados para consultas frecuentes
   - Vistas para consultas complejas
   - Procedimientos almacenados para estadísticas
   - Datos de ejemplo para testing
   - Validaciones de integridad con CHECK constraints

3. RELACIONES:
   - Integridad referencial con FOREIGN KEYS
   - Cascada en eliminaciones apropiadas
   - Restricciones de unicidad donde corresponde

4. SEGURIDAD:
   - Campos de contraseña con hash y salt
   - Validaciones de formato de email y teléfono
   - Estados de usuario para control de acceso

Para usar esta base de datos:
1. Ejecutar el script completo en MySQL
2. Verificar que todas las tablas se crearon correctamente
3. Los datos de ejemplo están listos para usar
4. Ajustar configuraciones según necesidades específicas
*/
