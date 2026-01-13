import { LogActividad } from '../models/index.js';

/**
 * Utility to log activities manually in controllers
 */
export const logActivity = async (req, { accion, tabla, registroId, datosAnteriores, datosNuevos }) => {
    try {
        await LogActividad.create({
            usuario_id: req.usuarioId || null,
            accion,
            tabla_afectada: tabla,
            registro_id: registroId,
            datos_anteriores: datosAnteriores,
            datos_nuevos: datosNuevos,
            ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
        });
    } catch (error) {
        console.error('Logging Error:', error);
    }
};

/**
 * Middleware factory for simple logging
 */
export const activityLogger = (accion, tabla) => {
    return async (req, res, next) => {
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logActivity(req, {
                    accion,
                    tabla,
                    datosNuevos: req.body
                });
            }
        });
        next();
    };
};
