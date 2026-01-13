import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter para rutas de autenticación
 * Previene ataques de fuerza bruta limitando el número de intentos
 */

// Limiter para login - 5 intentos por 15 minutos
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // 1000 intentos (Temp fix)
    message: {
        message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        console.warn(`[SECURITY] Rate limit exceeded for login from IP: ${req.ip}`);
        res.status(429).json({
            message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Limiter para registro - 3 intentos por hora
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 intentos
    message: {
        message: 'Demasiados intentos de registro. Por favor, intenta de nuevo en 1 hora.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[SECURITY] Rate limit exceeded for register from IP: ${req.ip}`);
        res.status(429).json({
            message: 'Demasiados intentos de registro. Por favor, intenta de nuevo en 1 hora.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Limiter para recuperación de contraseña - 3 intentos por hora
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 intentos
    message: {
        message: 'Demasiados intentos de recuperación de contraseña. Por favor, intenta de nuevo en 1 hora.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[SECURITY] Rate limit exceeded for forgot-password from IP: ${req.ip}`);
        res.status(429).json({
            message: 'Demasiados intentos de recuperación de contraseña. Por favor, intenta de nuevo en 1 hora.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Limiter para verificación de código - 5 intentos por 15 minutos
export const verifyCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: {
        message: 'Demasiados intentos de verificación. Por favor, intenta de nuevo en 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[SECURITY] Rate limit exceeded for verify-code from IP: ${req.ip}`);
        res.status(429).json({
            message: 'Demasiados intentos de verificación. Por favor, intenta de nuevo en 15 minutos.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Limiter general para API - 100 requests por 15 minutos
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests
    message: {
        message: 'Demasiadas peticiones. Por favor, intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
