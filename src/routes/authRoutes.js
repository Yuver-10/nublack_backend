import express from 'express';
import { register, login, getProfile, updateProfile, getAllUsers, forgotPassword, resetPassword, verifyCode } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';
import { loginLimiter, registerLimiter, forgotPasswordLimiter, verifyCodeLimiter } from '../middleware/rateLimiter.js';
import {
    registerValidator,
    loginValidator,
    updateProfileValidator,
    forgotPasswordValidator,
    verifyCodeValidator,
    resetPasswordValidator
} from '../middleware/validators.js';
import {
    logLoginAttempt,
    logRegistration,
    logPasswordChange,
    logPasswordRecovery
} from '../middleware/securityLogger.js';
import ensureDemoAdmin from '../utils/createDemoAdmin.js';
import { Usuario } from '../models/index.js';

const router = express.Router();

// Rutas públicas con rate limiting, validación y logging
router.post('/register', registerLimiter, registerValidator, logRegistration, register);
router.post('/login', loginLimiter, loginValidator, logLoginAttempt, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, logPasswordRecovery, forgotPassword);
router.post('/verify-code', verifyCodeLimiter, verifyCodeValidator, verifyCode);
router.post('/reset-password', resetPasswordValidator, resetPassword);

// Debug endpoint - crear/verificar admin
router.get('/debug/ensure-admin', async (req, res) => {
    try {
        const result = await ensureDemoAdmin();
        const adminUser = await Usuario.findOne({ where: { email: 'admin@demo.local.com' } });
        res.json({
            ensureAdminResult: result,
            adminExists: !!adminUser,
            adminData: adminUser ? {
                id: adminUser.id_usuario,
                email: adminUser.email,
                nombre: adminUser.nombre,
                rol: adminUser.rol,
                estado: adminUser.estado,
                hasPasswordHash: !!adminUser.password_hash
            } : null
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Rutas protegidas
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfileValidator, logPasswordChange, updateProfile);
router.get('/users', authMiddleware, isAdmin, getAllUsers);

export default router;

