
import sequelize from './config/database.js';
import { Solicitud } from './models/index.js';

async function testOrder() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Check Columns again just to be sure
        const [desc] = await sequelize.query("DESCRIBE solicitudes");
        const fields = desc.map(d => d.Field);
        console.log('Solicitud Columns:', fields);

        if (!fields.includes('envio')) {
            console.error('CRITICAL: envio column is STILL missing!');
        } else {
            console.log('envio column is present.');
        }

        // Try to create a dummy order
        console.log('Attempting to create a dummy order...');
        const dummyId = 'TEST-' + Date.now();
        try {
            const order = await Solicitud.create({
                numero_pedido: dummyId,
                usuario_id: 1, // Assuming admin exists or some user. If FK fails, we'll see.
                nombre_cliente: 'Test User',
                documento_identificacion: '123',
                telefono_contacto: '123',
                direccion_envio: 'Calle Test',
                metodo_pago: 'Contra Entrega',
                total: 10000,
                subtotal: 10000,
                envio: 5000, // This caused the error before
                estado: 'pendiente'
            });
            console.log('Order created successfully with ID:', order.id_solicitud);

            // Cleanup
            await order.destroy();
            console.log('Dummy order deleted.');

        } catch (createError) {
            console.error('Failed to create order:');
            console.error(createError.message);
            console.error(createError.original ? createError.original.sqlMessage : 'No sqlMessage');
        }

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        process.exit(0);
    }
}

testOrder();
