import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Configuracion = sequelize.define('Configuracion', {
    id_configuracion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    clave: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    valor: {
        type: DataTypes.TEXT
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    tipo: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string'
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
    tableName: 'configuraciones',
    timestamps: false
});

export default Configuracion;
