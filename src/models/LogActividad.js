import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LogActividad = sequelize.define('LogActividad', {
    id_log: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    accion: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tabla_afectada: {
        type: DataTypes.STRING(50)
    },
    registro_id: {
        type: DataTypes.INTEGER
    },
    datos_anteriores: {
        type: DataTypes.JSON
    },
    datos_nuevos: {
        type: DataTypes.JSON
    },
    ip_address: {
        type: DataTypes.STRING(45)
    },
    user_agent: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'logs_actividad',
    timestamps: false
});

export default LogActividad;
