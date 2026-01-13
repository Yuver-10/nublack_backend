import Usuario from './Usuario.js';
import Categoria from './Categoria.js';
import Producto from './Producto.js';
import Solicitud from './Solicitud.js';
import DetalleSolicitud from './DetalleSolicitud.js';
import Carrito from './Carrito.js';
import LogActividad from './LogActividad.js';
import Configuracion from './Configuracion.js';

// Definir relaciones

// Categoría tiene muchos Productos
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

// Usuario tiene muchas Solicitudes
Usuario.hasMany(Solicitud, { foreignKey: 'usuario_id', as: 'solicitudes' });
Solicitud.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Solicitud tiene muchos Detalles
Solicitud.hasMany(DetalleSolicitud, { foreignKey: 'solicitud_id', as: 'detalles' });
DetalleSolicitud.belongsTo(Solicitud, { foreignKey: 'solicitud_id', as: 'solicitud' });

// Detalle pertenece a Producto
Producto.hasMany(DetalleSolicitud, { foreignKey: 'producto_id', as: 'ventas' });
DetalleSolicitud.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Relaciones del Carrito
Usuario.hasMany(Carrito, { foreignKey: 'usuario_id', as: 'items_carrito' });
Carrito.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Producto.hasMany(Carrito, { foreignKey: 'producto_id', as: 'carritos' });
Carrito.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Relaciones de Logs
Usuario.hasMany(LogActividad, { foreignKey: 'usuario_id', as: 'logs' });
LogActividad.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

export {
    Usuario,
    Categoria,
    Producto,
    Solicitud,
    DetalleSolicitud,
    Carrito,
    LogActividad,
    Configuracion
};
