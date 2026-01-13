
import sequelize from './config/database.js';
import fs from 'fs';
import path from 'path';

async function auditImages() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const [products] = await sequelize.query("SELECT id_producto, nombre, imagen, categoria_id FROM Productos");

        console.log(`Auditing ${products.length} products...`);

        const missing = [];

        for (const p of products) {
            let imagePath = p.imagen;
            if (!imagePath) {
                missing.push({ id: p.id_producto, name: p.nombre, reason: 'NULL/Empty' });
                continue;
            }

            if (imagePath.startsWith('http')) {
                try {
                    const url = new URL(imagePath);
                    imagePath = url.pathname;
                } catch (e) {
                    // ignore
                }
            }

            if (imagePath.startsWith('/')) imagePath = imagePath.substring(1);

            // Normalize path separators
            imagePath = imagePath.replace(/\//g, path.sep);

            const possiblePaths = [
                path.resolve(process.cwd(), 'public', imagePath),
                path.resolve(process.cwd(), 'public/images', imagePath),
                path.resolve(process.cwd(), 'public', 'images', imagePath),
                // Try just filename in various folders
                path.resolve(process.cwd(), 'public/images/products', path.basename(imagePath)),
                path.resolve(process.cwd(), 'public/images/categories', path.basename(imagePath))
            ];

            let found = false;
            for (const pPath of possiblePaths) {
                if (fs.existsSync(pPath)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                missing.push({
                    id: p.id_producto,
                    name: p.nombre,
                    path: p.imagen,
                    reason: 'File Not Found'
                });
            }
        }

        if (missing.length > 0) {
            console.log(`\nFound ${missing.length} broken images:`);
            missing.forEach(m => {
                console.log(`- ID ${m.id}: ${m.name} (${m.path || 'NULL'}) -> ${m.reason}`);
            });
        } else {
            console.log('\nAll product images exist!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

auditImages();
