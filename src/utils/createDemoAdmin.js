import bcrypt from 'bcryptjs';
import { Usuario } from '../models/index.js';

const DEMO_ADMIN = {
    nombre: process.env.DEMO_ADMIN_NOMBRE || 'Admin',
    apellido: process.env.DEMO_ADMIN_APELLIDO || 'Demo',
    tipo_documento: process.env.DEMO_ADMIN_TIPO_DOC || 'Pasaporte',
    documento: process.env.DEMO_ADMIN_DOCUMENTO || '0000000000',
    telefono: process.env.DEMO_ADMIN_TELEFONO || '0000000000',
    email: process.env.DEMO_ADMIN_EMAIL || 'admin@demo.local',
    password: process.env.DEMO_ADMIN_PASSWORD || 'admin1234'
};

export async function ensureDemoAdmin() {
    try {
        const existing = await Usuario.findOne({ where: { email: DEMO_ADMIN.email } });
        if (existing) {
            console.log(`Demo admin already exists: ${DEMO_ADMIN.email}`);
            return { created: false, reason: 'exists' };
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(DEMO_ADMIN.password, salt);

        const newAdmin = await Usuario.create({
            nombre: DEMO_ADMIN.nombre,
            apellido: DEMO_ADMIN.apellido,
            tipo_documento: DEMO_ADMIN.tipo_documento,
            documento: DEMO_ADMIN.documento,
            telefono: DEMO_ADMIN.telefono,
            email: DEMO_ADMIN.email,
            password_hash,
            password_salt: salt,
            rol: 'administrador',
            estado: 'activo'
        });

        console.log(`Demo admin created: ${DEMO_ADMIN.email} (id ${newAdmin.id_usuario})`);
        return { created: true, id: newAdmin.id_usuario };
    } catch (error) {
        console.error('Error ensuring demo admin:', error.message || error);
        return { created: false, reason: 'error', error };
    }
}

export default ensureDemoAdmin;
