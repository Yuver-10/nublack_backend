import { body, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Errores de validación',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validador para registro de usuario
 */
export const registerValidator = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo debe contener letras'),

    body('apellido')
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo debe contener letras'),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('El email no es válido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 7 }).withMessage('La contraseña debe tener al menos 7 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('La contraseña debe contener al menos un carácter especial'),

    body('tipo_documento')
        .notEmpty().withMessage('El tipo de documento es requerido')
        .isIn(['Cédula de Ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'Tarjeta de Identidad'])
        .withMessage('Tipo de documento inválido'),

    body('documento')
        .trim()
        .notEmpty().withMessage('El número de documento es requerido')
        .isLength({ min: 5, max: 50 }).withMessage('El documento debe tener entre 5 y 50 caracteres'),

    body('telefono')
        .trim()
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^\d{10}$/).withMessage('El teléfono debe tener exactamente 10 dígitos'),

    handleValidationErrors
];

/**
 * Validador para login
 */
export const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('El email no es válido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),

    handleValidationErrors
];

/**
 * Validador para actualización de perfil
 */
export const updateProfileValidator = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo debe contener letras'),

    body('apellido')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo debe contener letras'),

    body('password')
        .optional()
        .isLength({ min: 7 }).withMessage('La contraseña debe tener al menos 7 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('La contraseña debe contener al menos un carácter especial'),

    body('tipo_documento')
        .optional()
        .isIn(['Cédula de Ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'Tarjeta de Identidad'])
        .withMessage('Tipo de documento inválido'),

    body('documento')
        .optional()
        .trim()
        .isLength({ min: 5, max: 50 }).withMessage('El documento debe tener entre 5 y 50 caracteres'),

    body('telefono')
        .optional()
        .trim()
        .matches(/^\d{10}$/).withMessage('El teléfono debe tener exactamente 10 dígitos'),

    handleValidationErrors
];

/**
 * Validador para recuperación de contraseña
 */
export const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('El email no es válido')
        .normalizeEmail(),

    handleValidationErrors
];

/**
 * Validador para verificación de código
 */
export const verifyCodeValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('El email no es válido')
        .normalizeEmail(),

    body('code')
        .trim()
        .notEmpty().withMessage('El código es requerido')
        .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos'),

    handleValidationErrors
];

/**
 * Validador para reset de contraseña
 */
export const resetPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('El email no es válido')
        .normalizeEmail(),

    body('code')
        .trim()
        .notEmpty().withMessage('El código es requerido')
        .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos'),

    body('newPassword')
        .notEmpty().withMessage('La nueva contraseña es requerida')
        .isLength({ min: 7 }).withMessage('La contraseña debe tener al menos 7 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('La contraseña debe contener al menos un carácter especial'),

    handleValidationErrors
];
