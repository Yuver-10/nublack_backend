import { Usuario } from '../../src/models/index.js';
import sequelize from '../../src/config/database.js';

async function test() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');
        const users = await Usuario.findAll({
            attributes: { exclude: ['password_hash', 'password_salt'] }
        });
        console.log(`Found ${users.length} users`);
        process.exit(0);
    } catch (error) {
        console.error('FAILED TO FIND USERS:');
        console.error(error);
        process.exit(1);
    }
}

test();
