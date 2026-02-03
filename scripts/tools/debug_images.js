const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

async function checkImages() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const [products] = await sequelize.query("SELECT id, nombre, imagen, imagenes FROM Productos WHERE nombre LIKE '%Pantalon Clasico%' OR nombre LIKE '%Falda%' OR nombre LIKE '%Short%'");

        console.log(`Found ${products.length} products to check.`);

        for (const p of products) {
            console.log(`\nProduct: ${p.nombre} (ID: ${p.id})`);
            console.log(`  Imagen (DB): ${p.imagen}`);

            let imagePath = p.imagen;
            if (imagePath) {
                // Remove URL part if exists to check local file
                if (imagePath.startsWith('http')) {
                    const urlParts = imagePath.split('/images/');
                    if (urlParts.length > 1) {
                        imagePath = urlParts[1];
                    }
                }

                // Try to find where this file might be
                // Usual path: public/images/products or public/images/categories or just public/images

                const possiblePaths = [
                    path.join(__dirname, '../public/images', imagePath),
                    path.join(__dirname, '../public/images/products', imagePath),
                    path.join(__dirname, '../public', imagePath),
                    path.join(__dirname, '../public/images/categories', imagePath)
                ];

                let found = false;
                for (const pPath of possiblePaths) {
                    if (fs.existsSync(pPath)) {
                        console.log(`  [OK] File exists at: ${pPath}`);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.log(`  [MISSING] File NOT found. Checked in:`);
                    possiblePaths.forEach(pp => console.log(`    - ${pp}`));
                }
            } else {
                console.log('  [NULL] No image set.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkImages();
