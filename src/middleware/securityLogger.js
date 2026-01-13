/**
 * Security Logger Middleware
 * Registra eventos de seguridad importantes para auditoría y monitoreo
 */

const logSecurityEvent = (event, details = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        event,
        ...details
    };

    // En producción, esto debería escribirse a un archivo o servicio de logging
    console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
};

/**
 * Middleware para registrar intentos de login
 */
export const logLoginAttempt = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
        const success = res.statusCode === 200;

        logSecurityEvent('LOGIN_ATTEMPT', {
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            success,
            statusCode: res.statusCode
        });

        return originalJson(data);
    };

    next();
};

/**
 * Middleware para registrar registros de usuario
 */
export const logRegistration = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
        const success = res.statusCode === 201;

        if (success) {
            logSecurityEvent('USER_REGISTRATION', {
                email: req.body.email,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
        }

        return originalJson(data);
    };

    next();
};

/**
 * Middleware para registrar cambios de contraseña
 */
export const logPasswordChange = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
        const success = res.statusCode === 200;

        if (success && req.body.password) {
            logSecurityEvent('PASSWORD_CHANGE', {
                userId: req.usuarioId,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
        }

        return originalJson(data);
    };

    next();
};

/**
 * Middleware para registrar recuperación de contraseña
 */
export const logPasswordRecovery = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
        const success = res.statusCode === 200;

        logSecurityEvent('PASSWORD_RECOVERY_REQUEST', {
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            success
        });

        return originalJson(data);
    };

    next();
};

/**
 * Middleware para registrar accesos no autorizados
 */
export const logUnauthorizedAccess = (req, res, next) => {
    const originalStatus = res.status.bind(res);

    res.status = function (code) {
        if (code === 401 || code === 403) {
            logSecurityEvent('UNAUTHORIZED_ACCESS', {
                path: req.path,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                statusCode: code,
                userId: req.usuarioId || 'anonymous'
            });
        }

        return originalStatus(code);
    };

    next();
};

/**
 * Middleware general de seguridad para todas las rutas
 */
export const securityLogger = (req, res, next) => {
    // Log de requests sospechosos
    const suspiciousPatterns = [
        /(\.\.|\/etc\/|\/bin\/|\/usr\/)/i,  // Path traversal
        /<script|javascript:|onerror=/i,     // XSS attempts
        /union.*select|insert.*into|drop.*table/i  // SQL injection
    ];

    const url = req.url.toLowerCase();
    const body = JSON.stringify(req.body).toLowerCase();

    const isSuspicious = suspiciousPatterns.some(pattern =>
        pattern.test(url) || pattern.test(body)
    );

    if (isSuspicious) {
        logSecurityEvent('SUSPICIOUS_REQUEST', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            body: req.body
        });
    }

    next();
};
