import express from 'express';
import { Configuracion } from '../models/index.js';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';
import { logActivity } from '../middleware/loggerMiddleware.js';

const router = express.Router();

// Get all configs (Public or Admin?) 
// Mostly public for the site settings, but update is Admin.
const getAllConfigs = async (req, res) => {
    try {
        const configs = await Configuracion.findAll();
        res.json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener configuraciones' });
    }
};

const updateConfig = async (req, res) => {
    try {
        const { clave } = req.params;
        const { valor, descripcion } = req.body;

        const config = await Configuracion.findOne({ where: { clave } });
        if (!config) {
            // Create if it doesn't exist? For now, only update.
            return res.status(404).json({ message: 'Configuración no encontrada' });
        }

        const datosAnteriores = config.toJSON();
        await config.update({ valor, descripcion });

        await logActivity(req, {
            accion: 'ACTUALIZAR_CONFIG',
            tabla: 'configuraciones',
            registroId: config.id_configuracion,
            datosAnteriores,
            datosNuevos: { valor, descripcion }
        });

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar configuración' });
    }
};

router.get('/', getAllConfigs);
router.put('/:clave', authMiddleware, isAdmin, updateConfig);

export default router;
