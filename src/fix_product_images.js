
import { Producto, Categoria } from './models/index.js';
import sequelize from './config/database.js';
import { Op } from 'sequelize';

async function fixProductImages() {
    try {
        await sequelize.authenticate();

        // 1. Zapatos
        await Producto.update(
            { imagen: '/images/products/shoes_default.png', imagenes: ['/images/products/shoes_default.png'] },
            {
                include: [{ model: Categoria, as: 'categoria', where: { nombre: 'Zapatos' } }],
                where: {}
            }
        );
        // Direct update for safety if include update fails or is complex in this sequelize version
        const zapatoCat = await Categoria.findOne({ where: { nombre: 'Zapatos' } });
        if (zapatoCat) {
            await Producto.update(
                { imagen: '/images/products/shoes_default.png', imagenes: ['/images/products/shoes_default.png'] },
                { where: { categoria_id: zapatoCat.id_categoria } }
            );
        }

        // 2. Mochilas
        const mochilaCat = await Categoria.findOne({ where: { nombre: 'Mochilas' } });
        if (mochilaCat) {
            await Producto.update(
                { imagen: '/images/products/backpack_default.png', imagenes: ['/images/products/backpack_default.png'] },
                { where: { categoria_id: mochilaCat.id_categoria } }
            );
        }

        // 3. Camisetas and others (Default to shirt for now as it's clothing)
        const otherCats = await Categoria.findAll({
            where: {
                nombre: { [Op.notIn]: ['Zapatos', 'Mochilas'] }
            }
        });

        for (const cat of otherCats) {
            await Producto.update(
                { imagen: '/images/products/shirt_default.jpg', imagenes: ['/images/products/shirt_default.jpg'] },
                { where: { categoria_id: cat.id_categoria } }
            );
        }

        console.log('✅ Product images updated.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixProductImages();
