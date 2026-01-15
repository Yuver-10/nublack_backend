import { Usuario } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { Op } from 'sequelize';

const generateToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id_usuario, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Reducido de 7d a 1h para mayor seguridad
    );
};

export const register = async (req, res) => {
    try {
        let { nombre, apellido, tipo_documento, documento, telefono, email, password } = req.body;

        // Trim values (express-validator validates but doesn't modify req.body)
        if (password) password = password.trim();
        if (email) email = email.trim().toLowerCase();

        // Check if user exists
        const existingUser = await Usuario.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        const existingDoc = await Usuario.findOne({ where: { documento } });
        if (existingDoc) {
            return res.status(400).json({ message: 'El documento ya está registrado' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await Usuario.create({
            nombre,
            apellido,
            tipo_documento,
            documento,
            telefono,
            email,
            password_hash,
            password_salt: salt, // Storing salt just in case, though bcrypt hash includes it usually
            rol: 'cliente',
            estado: 'activo'
        });

        // Enviar Correo de Bienvenida (sin bloquear la respuesta)
        sendWelcomeEmail(newUser.email, newUser.nombre).catch(err => console.error('Error enviando mail de bienvenida:', err));

        const token = generateToken(newUser);

        // Return user without sensitive data
        const userResp = newUser.toJSON();
        delete userResp.password_hash;
        delete userResp.password_salt;

        res.status(201).json({
            success: true,
            data: {
                usuario: userResp,
                accessToken: token
            }
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Error en el registro', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Trim password (express-validator validates but doesn't modify req.body)
        if (password) password = password.trim();
        if (email) email = email.trim().toLowerCase();

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }

        const user = await Usuario.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        if (user.estado !== 'activo') {
            return res.status(403).json({ message: 'Usuario inactivo o suspendido' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.warn(`[AUTH] Intento de login fallido para: ${email}. Contraseña incorrecta.`);
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = generateToken(user);

        const userResp = user.toJSON();
        delete userResp.password_hash;
        delete userResp.password_salt;

        res.json({
            success: true,
            data: {
                usuario: userResp,
                accessToken: token
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Error en el login' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await Usuario.findByPk(req.usuarioId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const userResp = user.toJSON();
        delete userResp.password_hash;
        delete userResp.password_salt;

        res.json(userResp);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        let { nombre, apellido, tipo_documento, documento, telefono, password } = req.body;
        
        // Trim password
        if (password) password = password.trim();

        const user = await Usuario.findByPk(req.usuarioId);

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Update fields if provided
        if (nombre) user.nombre = nombre;
        if (apellido) user.apellido = apellido;
        if (tipo_documento) user.tipo_documento = tipo_documento;
        if (documento) user.documento = documento;
        if (telefono) user.telefono = telefono;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(password, salt);
            user.password_salt = salt;
        }

        await user.save();

        const userResp = user.toJSON();
        delete userResp.password_hash;
        delete userResp.password_salt;

        res.json({
            success: true,
            data: {
                usuario: userResp
            }
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Error al actualizar perfil' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await Usuario.findAll({
            attributes: { exclude: ['password_hash', 'password_salt'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Usuario.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'No existe un usuario con ese correo' });
        }

        // Generar un código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar token y expiración (1 hora)
        user.reset_password_token = await bcrypt.hash(code, 10);
        user.reset_password_expires = Date.now() + 3600000;
        await user.save();

        await sendPasswordResetEmail(user.email, code);

        res.json({ success: true, message: 'Código de recuperación enviado al correo' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Error al procesar solicitud' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        let { email, code, newPassword } = req.body;

        // Trim values
        if (newPassword) newPassword = newPassword.trim();
        if (email) email = email.trim().toLowerCase();

        const user = await Usuario.findOne({
            where: {
                email,
                reset_password_expires: { [Op.gt]: Date.now() }
            }
        });

        if (!user || !user.reset_password_token) {
            return res.status(400).json({ message: 'Código inválido o expirado' });
        }

        // Verificar el código
        const isValid = await bcrypt.compare(code, user.reset_password_token);
        if (!isValid) {
            return res.status(400).json({ message: 'Código de verificación incorrecto' });
        }

        // Actualizar contraseña
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(newPassword, salt);
        user.password_salt = salt;

        // Limpiar tokens
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await user.save();

        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Error al restablecer contraseña' });
    }
};
export const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await Usuario.findOne({
            where: {
                email,
                reset_password_expires: { [Op.gt]: Date.now() }
            }
        });

        if (!user || !user.reset_password_token) {
            return res.status(400).json({ message: 'Código inválido o expirado' });
        }

        const isValid = await bcrypt.compare(code, user.reset_password_token);
        if (!isValid) {
            return res.status(400).json({ message: 'Código de verificación incorrecto' });
        }

        res.json({ success: true, message: 'Código verificado correctamente' });
    } catch (error) {
        console.error('Verify Code Error:', error);
        res.status(500).json({ message: 'Error al verificar código' });
    }
};
