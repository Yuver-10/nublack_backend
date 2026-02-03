
import { Categoria } from './models/index.js';
import sequelize from './config/database.js';

async function updateCategoryImages() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const updates = [
            { nombre: 'Jeans', imagen: '/images/categories/jeans.png' },
            { nombre: 'Chaquetas', imagen: '/images/categories/chaquetas.png' },
            { nombre: 'Sudaderas', imagen: '/images/categories/sudaderas.png' },
            { nombre: 'Shorts', imagen: '/images/categories/shorts.png' },
            { nombre: 'Faldas', imagen: '/images/categories/faldas.png' },
            { nombre: 'Leggis', imagen: '/images/categories/leggis.png' }
        ];

        for (const update of updates) {
            const [affected] = await Categoria.update(
                { imagen: update.imagen },
                { where: { nombre: update.nombre } }
            );
            if (affected > 0) {
                console.log(`✅ Updated ${update.nombre}`);
            } else {
                console.warn(`⚠️ Category ${update.nombre} not found.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error updating categories:', error);
        process.exit(1);
    }
}

updateCategoryImages();
