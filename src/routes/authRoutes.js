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
import bcrypt from 'bcryptjs';

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

// Debug endpoint - diagnosticar login
router.post('/debug/test-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('=== DEBUG LOGIN ===');
        console.log('Email:', email);
        console.log('Password:', password);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y password requeridos' });
        }

        const user = await Usuario.findOne({ where: { email } });
        console.log('User encontrado:', !!user);

        if (!user) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado',
                email
            });
        }

        console.log('User data:', {
            id: user.id_usuario,
            email: user.email,
            estado: user.estado,
            hasHash: !!user.password_hash
        });

        if (user.estado !== 'activo') {
            return res.status(403).json({ message: 'Usuario inactivo' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log('Password match:', isMatch);

        res.json({
            message: 'Debug complete',
            userExists: true,
            estadoOK: user.estado === 'activo',
            passwordMatch: isMatch,
            user: {
                id: user.id_usuario,
                email: user.email,
                rol: user.rol,
                estado: user.estado
            }
        });

    } catch (error) {
        console.error('Debug error:', error);
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

