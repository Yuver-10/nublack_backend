import express from 'express';
import { Carrito, Producto } from '../models/index.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Get current user's cart
 */
const getCart = async (req, res) => {
    try {
        const usuario_id = req.usuarioId;
        const cartItems = await Carrito.findAll({
            where: { usuario_id },
            include: [{ model: Producto, as: 'producto' }]
        });
        res.json(cartItems);
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ message: 'Error al obtener el carrito' });
    }
};

/**
 * Add or Update item in cart
 */
const addToCart = async (req, res) => {
    try {
        const usuario_id = req.usuarioId;
        const { producto_id, cantidad, talla } = req.body;

        // Check product availability first
        const producto = await Producto.findByPk(producto_id);
        if (!producto) {
            return res.status(400).json({ message: 'Producto no encontrado', code: 'PRODUCT_NOT_FOUND', item: { id: producto_id } });
        }

        // Parse tallas JSON if needed
        let tallasObj = producto.tallas || {};
        if (typeof tallasObj === 'string') {
            try { tallasObj = JSON.parse(tallasObj); } catch (e) { tallasObj = {}; }
        }

        // Determine available stock
        let available = producto.stock || 0;
        if (talla && tallasObj) {
            // Check if tallasObj is an array of objects [{talla: 'M', stock: 5}]
            if (Array.isArray(tallasObj) && tallasObj.length > 0) {
                const tallaObj = tallasObj.find(t => String(t.talla) === String(talla));
                if (tallaObj && typeof tallaObj.stock !== 'undefined') {
                    available = parseInt(tallaObj.stock, 10) || 0;
                }
            }
            // Or if it's an object {M: 5, L: 3}
            else if (typeof tallasObj === 'object' && Object.keys(tallasObj).length > 0) {
                available = parseInt(tallasObj[talla] || 0, 10);
            }
        }

        const isUpdate = !!req.body.isUpdate;

        let cartItem = await Carrito.findOne({ where: { usuario_id, producto_id, talla } });
        const currentQty = cartItem ? cartItem.cantidad : 0;
        const incomingQty = cantidad || 1;
        const totalRequested = isUpdate ? incomingQty : (currentQty + incomingQty);

        if (totalRequested > available) {
            return res.status(400).json({ message: 'Stock insuficiente', code: 'INSUFFICIENT_STOCK', item: { id: producto_id, talla: talla || null, available, requested: totalRequested } });
        }

        if (cartItem) {
            if (isUpdate) cartItem.cantidad = incomingQty; else cartItem.cantidad = currentQty + incomingQty;
            await cartItem.save();
        } else {
            cartItem = await Carrito.create({
                usuario_id,
                producto_id,
                cantidad: incomingQty,
                talla: talla || 'N/A'
            });
        }

        res.json({ success: true, data: cartItem });
    } catch (error) {
        console.error('Add To Cart Error:', error);
        res.status(500).json({ message: 'Error al añadir al carrito' });
    }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
    try {
        const usuario_id = req.usuarioId;
        const { id } = req.params;

        const deleted = await Carrito.destroy({
            where: { id_carrito: id, usuario_id }
        });

        if (deleted) {
            res.json({ success: true, message: 'Producto eliminado del carrito' });
        } else {
            res.status(404).json({ message: 'Item no encontrado en el carrito' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar del carrito' });
    }
};

const clearCart = async (req, res) => {
    try {
        const usuario_id = req.usuarioId;
        await Carrito.destroy({ where: { usuario_id } });
        res.json({ success: true, message: 'Carrito vaciado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al vaciar el carrito' });
    }
};

router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.delete('/:id', authMiddleware, removeFromCart);
router.delete('/', authMiddleware, clearCart);

export default router;
