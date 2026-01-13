import express from 'express';
import { Solicitud, DetalleSolicitud, Producto, Usuario, Carrito } from '../models/index.js';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';
import sequelize from '../config/database.js';
import { Transaction } from 'sequelize';
import { sendOrderStatusEmail, sendOrderConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

const createOrder = async (req, res) => {
    const t = await sequelize.transaction();
    let idempotencyKey = null;
    try {
        const usuario_id = req.usuarioId;
        const {
            items = [],
            personalInfo = {},
            deliveryInfo = {},
            paymentInfo = {},
            totals = {}
        } = req.body;

        // Idempotency: allow client to send Idempotency-Key header
        idempotencyKey = req.headers['idempotency-key'] || req.headers['idempotency_key'] || req.body.idempotencyKey || null;
        if (idempotencyKey) {
            const existing = await Solicitud.findOne({ where: { idempotency_key: idempotencyKey, usuario_id } });
            if (existing) {
                return res.status(200).json({ success: true, message: 'Pedido ya procesado (idempotency key).', orderId: existing.numero_pedido });
            }
        }

        console.log('--- Creando Pedido ---');
        console.log('Body:', JSON.stringify(req.body, null, 2));

        const numero_pedido = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Map frontend payment method to DB enum values
        const paymentMethodMap = {
            'contraEntrega': 'Contra Entrega',
            'transferencia': 'Transferencia',
            'tarjeta': 'Tarjeta',
            'PSE': 'PSE',
            'Contra Entrega': 'Contra Entrega',
            'Tarjeta': 'Tarjeta',
            'Transferencia': 'Transferencia'
        };
        const metodoPagoDb = paymentMethodMap[(paymentInfo.metodo || '').toString()] || paymentInfo.metodo || 'Contra Entrega';

        const solicitud = await Solicitud.create({
            numero_pedido,
            usuario_id,
            nombre_cliente: personalInfo.nombre || 'Cliente',
            documento_identificacion: personalInfo.documento || '0000',
            telefono_contacto: personalInfo.telefono || '0000',
            correo_electronico: personalInfo.email,
            direccion_envio: deliveryInfo.direccion || 'No especificada',
            referencia_direccion: deliveryInfo.referencia,
            indicaciones_adicionales: deliveryInfo.indicaciones,
            horario_preferido: deliveryInfo.horario,
            metodo_pago: metodoPagoDb,
            total: totals.total || 0,
            subtotal: totals.subtotal || 0,
            envio: totals.envio || 0,
            idempotency_key: idempotencyKey || null,
            estado: 'pendiente'
        }, { transaction: t });

        // Create Details
        // Validate stock availability for all items first (supports size-specific stock in producto.tallas JSON)
        for (const item of items) {
            const prodId = item?.id_producto || item?.id;
            const qty = parseInt(item?.cantidad || item?.quantity || 1, 10) || 1;
            const producto = await Producto.findByPk(prodId, { transaction: t, lock: Transaction.LOCK.UPDATE });
            if (!producto) {
                await t.rollback();
                return res.status(400).json({ message: `Producto ${prodId} no encontrado`, code: 'PRODUCT_NOT_FOUND', item: { id: prodId } });
            }

            // If the product has size-level stock info, check that first
            let tallasObj = producto.tallas || {};
            if (typeof tallasObj === 'string') {
                try { tallasObj = JSON.parse(tallasObj); } catch (e) { tallasObj = {}; }
            }

            const requestedSize = item?.talla || item?.size || null;
            if (requestedSize && tallasObj && ((Array.isArray(tallasObj) && tallasObj.length > 0) || Object.keys(tallasObj).length > 0)) {
                let availableForSize = 0;
                if (Array.isArray(tallasObj)) {
                    const found = tallasObj.find(t => String(t.talla) === String(requestedSize));
                    availableForSize = found ? parseInt(found.stock || 0, 10) : 0;
                } else {
                    availableForSize = parseInt(tallasObj[requestedSize] || 0, 10);
                }

                if (availableForSize < qty) {
                    await t.rollback();
                    return res.status(400).json({
                        message: `Stock insuficiente para ${producto.nombre} talla ${requestedSize}. Disponible: ${availableForSize}, solicitado: ${qty}`,
                        code: 'INSUFFICIENT_STOCK',
                        item: { id: prodId, talla: requestedSize, available: availableForSize, requested: qty }
                    });
                }
            } else {
                // Fallback to global stock
                if (producto.stock < qty) {
                    await t.rollback();
                    return res.status(400).json({
                        message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, solicitado: ${qty}`,
                        code: 'INSUFFICIENT_STOCK',
                        item: { id: prodId, available: producto.stock, requested: qty }
                    });
                }
            }
        }

        // Create Details and decrement stock (update tallas JSON when needed)
        for (const item of items) {
            const quantity = item?.cantidad || item?.quantity || 1;
            const size = item?.talla || item?.size || null;

            await DetalleSolicitud.create({
                solicitud_id: solicitud.id_solicitud,
                producto_id: item?.id_producto || item?.id,
                nombre_producto: item?.nombre || 'Producto',
                descripcion_producto: item?.descripcion || '',
                imagen_producto: item?.imagen || '',
                cantidad: quantity,
                talla: size || 'N/A',
                precio_unitario: item?.precio || 0,
                subtotal: (item?.precio || 0) * quantity
            }, { transaction: t });

            // Decrement Stock
            if (size) {
                const prodId = item?.id_producto || item?.id;
                const producto = await Producto.findByPk(prodId, { transaction: t, lock: Transaction.LOCK.UPDATE });
                let tallasObj = producto.tallas || {};
                if (typeof tallasObj === 'string') {
                    try { tallasObj = JSON.parse(tallasObj); } catch (e) { tallasObj = {}; }
                }

                // Update size-specific stock whether tallas is array or map
                if (Array.isArray(tallasObj)) {
                    const idx = tallasObj.findIndex(t => String(t.talla) === String(size));
                    if (idx >= 0) {
                        const availableForSize = parseInt(tallasObj[idx].stock || 0, 10);
                        const newSizeStock = Math.max(0, availableForSize - quantity);
                        tallasObj[idx].stock = newSizeStock;
                    } else {
                        // If size entry missing, ignore and rely on global stock decrement
                    }
                } else {
                    const availableForSize = parseInt(tallasObj[size] || 0, 10);
                    const newSizeStock = Math.max(0, availableForSize - quantity);
                    tallasObj[size] = newSizeStock;
                }

                await producto.update({
                    tallas: tallasObj,
                    stock: Math.max(0, producto.stock - quantity)
                }, { transaction: t });
            } else {
                await Producto.decrement('stock', {
                    by: quantity,
                    where: { id_producto: item.id_producto || item.id },
                    transaction: t
                });
            }
        }

        await t.commit();

        // Limpiar el carrito del usuario después de crear la orden exitosamente
        try {
            await Carrito.destroy({ where: { usuario_id } });
            console.log(`Carrito limpiado para usuario ${usuario_id} después de crear orden ${solicitud.numero_pedido}`);
        } catch (cartError) {
            // No fallar la orden si hay error al limpiar el carrito, solo loguear
            console.error('Error al limpiar carrito después de crear orden:', cartError);
        }

        // Enviar email de confirmación
        const cliente = await Usuario.findByPk(usuario_id);
        if (cliente) {
            sendOrderConfirmationEmail(cliente.email, solicitud).catch(err => console.error('Error email confirmación:', err));
        }

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            orderId: solicitud.numero_pedido
        });


    } catch (error) {
        await t.rollback();
        console.error('Order Creation Error:', error);
        // If we had an idempotency key, try to return the existing resource instead of failing
        if (idempotencyKey) {
            try {
                const existing = await Solicitud.findOne({ where: { idempotency_key: idempotencyKey, usuario_id: req.usuarioId } });
                if (existing) {
                    return res.status(200).json({ success: true, message: 'Pedido ya procesado (idempotency key).', orderId: existing.numero_pedido });
                }
            } catch (e) {
                console.error('Error fetching existing order during idempotency fallback:', e);
            }
        }
        const safeMessage = process.env.NODE_ENV === 'production' ? 'Error al procesar el pedido' : `Error al procesar el pedido: ${error.message}`;
        res.status(500).json({ message: safeMessage, error: error.message, stack: error.stack });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const usuario_id = req.usuarioId;
        const orders = await Solicitud.findAll({
            where: { usuario_id },
            include: [{ model: DetalleSolicitud, as: 'detalles' }],
            order: [['created_at', 'DESC']]
        });
        const mappedOrders = orders.map(mapOrder);
        res.json(mappedOrders);
    } catch (error) {
        console.error('Get My Orders Error:', error);
        res.status(500).json({ message: 'Error al obtener mis pedidos' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Solicitud.findAll({
            include: [{ model: DetalleSolicitud, as: 'detalles' }],
            order: [['created_at', 'DESC']]
        });
        const mappedOrders = orders.map(mapOrder);
        res.json(mappedOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener pedidos' });
    }
};

// Mapeo de estados Frontend -> Backend (Base de Datos)
const statusMapFEtoBE = {
    'aprobada': 'aceptada',
    'en_camino': 'enviada',
    'entregada': 'entregada',
    'cancelada': 'cancelada',
    'pendiente': 'pendiente'
};

// Mapeo de estados Backend (Base de Datos) -> Frontend
const statusMapBEtoFE = {
    'aceptada': 'aprobada',
    'enviada': 'en_camino',
    'entregada': 'entregada',
    'cancelada': 'cancelada',
    'pendiente': 'pendiente'
};

const mapOrder = (order) => {
    const rawOrder = order.toJSON ? order.toJSON() : order;
    return {
        ...rawOrder,
        estado: statusMapBEtoFE[rawOrder.estado] || rawOrder.estado
    };
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, motivo_rechazo } = req.body;

        console.log(`--- Actualizando Estado Pedido ${id} ---`);
        console.log('Nuevo estado (FE):', estado);

        // Mapear estado si es necesario para la DB
        const dbEstado = statusMapFEtoBE[estado] || estado;
        console.log('Estado a guardar en DB:', dbEstado);

        const order = await Solicitud.findByPk(id);
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

        await order.update({ estado: dbEstado, motivo_rechazo });

        const cliente = await Usuario.findByPk(order.usuario_id);
        if (cliente) {
            sendOrderStatusEmail(cliente.email, order.numero_pedido, dbEstado).catch(err => console.error('Error email estado pedido:', err));
        }

        res.json({ success: true, message: 'Estado del pedido actualizado', nuevoEstado: estado });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({ message: 'Error al actualizar pedido', error: error.message });
    }
};

const cancelOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const usuario_id = req.usuarioId;
        const { motivo } = req.body;

        const order = await Solicitud.findOne({
            where: { id_solicitud: id, usuario_id },
            include: [{ model: DetalleSolicitud, as: 'detalles' }]
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Pedido no encontrado o no tienes permiso' });
        }

        if (order.estado !== 'pendiente') {
            await t.rollback();
            return res.status(400).json({ message: 'Solo se pueden cancelar pedidos en estado pendiente' });
        }

        // Restore Stock
        for (const item of (order.detalles || [])) {
            await Producto.increment('stock', {
                by: item.cantidad,
                where: { id_producto: item.producto_id },
                transaction: t
            });
        }

        await order.update({
            estado: 'cancelada',
            motivo_rechazo: motivo || 'Cancelado por el cliente'
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Pedido cancelado exitosamente' });

    } catch (error) {
        await t.rollback();
        console.error('Cancel Order Error:', error);
        res.status(500).json({ message: 'Error al cancelar el pedido' });
    }
};

router.post('/', authMiddleware, createOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/all', authMiddleware, isAdmin, getAllOrders);
router.put('/:id/status', authMiddleware, isAdmin, updateOrderStatus);
router.put('/:id/cancel', authMiddleware, cancelOrder);

export default router;
