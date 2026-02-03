SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLA USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    tipo_documento ENUM(
        'Cédula de Ciudadanía',
        'Cédula de extranjería',
        'Pasaporte',
        'Tarjeta de Identidad'
    ) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    reset_password_token VARCHAR(255),
    reset_password_expires DATETIME,
    rol ENUM('administrador', 'cliente', 'empleado') DEFAULT 'cliente',
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_documento (documento),
    INDEX idx_rol (rol),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA CATEGORIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen LONGTEXT,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA PRODUCTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    precio_original DECIMAL(10,2),
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    imagen LONGTEXT,
    imagenes JSON,
    talla VARCHAR(50),
    tallas JSON,
    genero ENUM('Hombre', 'Mujer', 'Unisex') DEFAULT 'Unisex',
    categoria_id INT,
    stock INT NOT NULL DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 4.5,
    variantes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (categoria_id)
        REFERENCES categorias(id_categoria)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLA SOLICITUDES
-- =====================================================
CREATE TABLE IF NOT EXISTS solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM(
        'pendiente',
        'aceptada',
        'rechazada',
        'en_proceso',
        'enviada',
        'entregada',
        'cancelada'
    ) DEFAULT 'pendiente',
    motivo_rechazo TEXT,

    nombre_cliente VARCHAR(100) NOT NULL,
    documento_identificacion VARCHAR(50) NOT NULL,
    telefono_contacto VARCHAR(20) NOT NULL,
    correo_electronico VARCHAR(100),

    direccion_envio VARCHAR(255) NOT NULL,
    referencia_direccion VARCHAR(255),
    indicaciones_adicionales TEXT,
    horario_preferido VARCHAR(100),

    metodo_pago ENUM('Contra Entrega', 'Tarjeta', 'Transferencia', 'PSE') DEFAULT 'Contra Entrega',
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tiempo_estimado_entrega VARCHAR(100),
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    notas_internas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLA DETALLES SOLICITUD
-- =====================================================
CREATE TABLE IF NOT EXISTS detalles_solicitud (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    producto_id INT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    descripcion_producto TEXT,
    imagen_producto LONGTEXT,
    cantidad INT NOT NULL,
    talla VARCHAR(50),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (solicitud_id)
        REFERENCES solicitudes(id_solicitud)
        ON DELETE CASCADE,

    FOREIGN KEY (producto_id)
        REFERENCES productos(id_producto)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLA CARRITO
-- =====================================================
CREATE TABLE IF NOT EXISTS carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    talla VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (producto_id)
        REFERENCES productos(id_producto)
        ON DELETE CASCADE,

    UNIQUE KEY unique_user_product_size (usuario_id, producto_id, talla)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA RESEÑAS
-- =====================================================
CREATE TABLE IF NOT EXISTS reseñas (
    id_reseña INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    calificacion INT NOT NULL,
    comentario TEXT,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (producto_id)
        REFERENCES productos(id_producto)
        ON DELETE CASCADE,

    UNIQUE KEY unique_user_product_review (usuario_id, producto_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA CONFIGURACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS configuraciones (
    id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    descripcion TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLA LOGS ACTIVIDAD
-- =====================================================
CREATE TABLE IF NOT EXISTS logs_actividad (
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

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO usuarios (
    nombre,
    apellido,
    tipo_documento,
    documento,
    telefono,
    email,
    password_hash,
    password_salt,
    rol,
    estado
) VALUES (
    'Oscar',
    'Correa',
    'Cédula de Ciudadanía',
    '1005568473',
    '3024125502',
    'admin@nublack.com',
    '$2b$10$QWERTYUIOPASDFGHJKLZXCVBNM1234567890ABCDE', 
    'bcrypt',
    'administrador',
    'activo'
);
