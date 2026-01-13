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

const router = express.Router();

// Rutas públicas con rate limiting, validación y logging
router.post('/register', registerLimiter, registerValidator, logRegistration, register);
router.post('/login', loginLimiter, loginValidator, logLoginAttempt, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, logPasswordRecovery, forgotPassword);
router.post('/verify-code', verifyCodeLimiter, verifyCodeValidator, verifyCode);
router.post('/reset-password', resetPasswordValidator, resetPassword);

// Rutas protegidas
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfileValidator, logPasswordChange, updateProfile);
router.get('/users', authMiddleware, isAdmin, getAllUsers);

export default router;

