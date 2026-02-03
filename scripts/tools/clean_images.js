
import { Producto } from './models/index.js';
import sequelize from './config/database.js';
import { Op } from 'sequelize';

async function checkBase64Images() {
    try {
        await sequelize.authenticate();
        // Look for images starting with 'data:image' or just very long strings
        const products = await Producto.findAll({
            where: {
                [Op.or]: [
                    { imagen: { [Op.like]: 'data:image%' } },
                    sequelize.where(sequelize.fn('CHAR_LENGTH', sequelize.col('imagen')), '>', 255) // Assume paths > 255 chars might be data URIs
                ]
            },
            attributes: ['id_producto', 'nombre', 'imagen']
        });

        console.log(`Found ${products.length} products with potential base64 images.`);

        if (products.length > 0) {
            console.log('Sample IDs:', products.map(p => p.id_producto).slice(0, 5));
            // Resetting them to default
            console.log('Resetting these to default placeholder...');
            await Producto.update(
                { imagen: '/images/products/shirt_default.jpg' },
                {
                    where: {
                        [Op.or]: [
                            { imagen: { [Op.like]: 'data:image%' } },
                            sequelize.where(sequelize.fn('CHAR_LENGTH', sequelize.col('imagen')), '>', 255)
                        ]
                    }
                }
            );
            console.log('Reset complete.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkBase64Images();
