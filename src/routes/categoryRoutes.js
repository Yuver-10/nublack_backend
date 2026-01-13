import express from 'express';
import { Categoria } from '../models/index.js';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';
import { logActivity } from '../middleware/loggerMiddleware.js';

const router = express.Router();

const getCategories = async (req, res) => {
    try {
        const categories = await Categoria.findAll({
            where: { estado: 'Activo' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Categories Error:', error);
        res.status(500).json({ message: 'Error al obtener categorías' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { nombre, descripcion, imagen, estado } = req.body;
        const category = await Categoria.create({
            nombre,
            descripcion,
            imagen,
            estado: estado || 'Activo'
        });

        await logActivity(req, {
            accion: 'CREAR_CATEGORIA',
            tabla: 'categorias',
            registroId: category.id_categoria,
            datosNuevos: category.toJSON()
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Create Category Error:', error);
        res.status(500).json({ message: 'Error al crear categoría', error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Categoria.findByPk(id);
        if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

        const datosAnteriores = category.toJSON();
        await category.update(req.body);

        await logActivity(req, {
            accion: 'ACTUALIZAR_CATEGORIA',
            tabla: 'categorias',
            registroId: id,
            datosAnteriores,
            datosNuevos: req.body
        });

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar categoría' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Categoria.findByPk(id);
        if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

        const datosAnteriores = category.toJSON();
        await category.update({ estado: 'Inactivo' });

        await logActivity(req, {
            accion: 'ELIMINAR_CATEGORIA_SOFT',
            tabla: 'categorias',
            registroId: id,
            datosAnteriores,
            datosNuevos: { estado: 'Inactivo' }
        });

        res.json({ message: 'Categoría desactivada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar categoría' });
    }
};

router.get('/', getCategories);
router.post('/', authMiddleware, isAdmin, createCategory);
router.put('/:id', authMiddleware, isAdmin, updateCategory);
router.delete('/:id', authMiddleware, isAdmin, deleteCategory);

export default router;
