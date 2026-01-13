import express from 'express';
import { Usuario } from '../models/index.js';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';
import bcrypt from 'bcryptjs';
import { logActivity } from '../middleware/loggerMiddleware.js';

const router = express.Router();

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await Usuario.findAll({
            attributes: { exclude: ['password_hash', 'password_salt', 'reset_password_token'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// Create user (Admin)
const createUser = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password || '123456', salt);

        const newUser = await Usuario.create({
            ...rest,
            password_hash,
            password_salt: salt,
            estado: 'activo'
        });

        await logActivity(req, {
            accion: 'CREAR_USUARIO_ADMIN',
            tabla: 'usuarios',
            registroId: newUser.id_usuario,
            datosNuevos: { ...rest, rol: rest.rol || 'cliente' }
        });

        const userResp = newUser.toJSON();
        delete userResp.password_hash;
        delete userResp.password_salt;
        res.status(201).json(userResp);
    } catch (error) {
        console.error('Create User Error:', error);

        // Manejar errores de validación de Sequelize
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Ya existe un usuario con ese correo o documento',
                errors: error.errors.map(e => ({ field: e.path, message: e.message }))
            });
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Error de validación en los datos del usuario',
                errors: error.errors.map(e => ({ field: e.path, message: e.message }))
            });
        }

        res.status(500).json({
            message: 'Error al crear usuario',
            error: error.message
        });
    }
};

// Update user (Admin)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...rest } = req.body;

        const user = await Usuario.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const datosAnteriores = user.toJSON();
        delete datosAnteriores.password_hash;
        delete datosAnteriores.password_salt;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(password, salt);
            user.password_salt = salt;
        }

        // Update other fields
        Object.assign(user, rest);
        await user.save();

        await logActivity(req, {
            accion: 'ACTUALIZAR_USUARIO_ADMIN',
            tabla: 'usuarios',
            registroId: id,
            datosAnteriores,
            datosNuevos: rest
        });

        const userResp = user.toJSON();
        delete userResp.password_hash;
        delete userResp.password_salt;
        res.json(userResp);
    } catch (error) {
        console.error('Update User Error:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Ya existe un usuario con ese correo o documento',
                errors: error.errors.map(e => ({ field: e.path, message: e.message }))
            });
        }

        res.status(500).json({
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// Delete user (Admin) - Soft Delete
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Usuario.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const datosAnteriores = user.toJSON();
        delete datosAnteriores.password_hash;

        await user.update({ estado: 'inactivo' });

        await logActivity(req, {
            accion: 'ELIMINAR_USUARIO_SOFT',
            tabla: 'usuarios',
            registroId: id,
            datosAnteriores,
            datosNuevos: { estado: 'inactivo' }
        });

        res.json({ success: true, message: 'Usuario inactivado correctamente' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

router.get('/', authMiddleware, isAdmin, getAllUsers);
router.post('/', authMiddleware, isAdmin, createUser);
router.put('/:id', authMiddleware, isAdmin, updateUser);
router.delete('/:id', authMiddleware, isAdmin, deleteUser);

export default router;
