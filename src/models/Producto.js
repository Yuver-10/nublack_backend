import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Producto = sequelize.define('Producto', {
    id_producto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    precio_original: {
        type: DataTypes.DECIMAL(10, 2)
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        defaultValue: 'activo'
    },
    imagen: {
        type: DataTypes.TEXT
    },
    imagenes: {
        type: DataTypes.JSON
    },
    talla: {
        type: DataTypes.STRING(50)
    },
    tallas: {
        type: DataTypes.JSON
    },
    genero: {
        type: DataTypes.ENUM('Hombre', 'Mujer', 'Unisex'),
        defaultValue: 'Unisex'
    },
    categoria_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'categorias',
            key: 'id_categoria'
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 4.5
    },
    variantes: {
        type: DataTypes.JSON
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'productos',
    timestamps: false
});

export default Producto;
