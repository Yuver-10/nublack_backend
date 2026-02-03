import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            console.warn('[AUTH] Request missing Authorization header');
            return res.status(401).json({ message: 'No token provided' });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2) {
            return res.status(401).json({ message: 'Token error' });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({ message: 'Token malformatted' });
        }

        jwt.verify(token, config.jwtSecret || 'default_jwt_secret_key_please_change_in_production', (err, decoded) => {
            if (err) {
                console.error(`[AUTH] Token verification failed: ${err.message}`);
                return res.status(401).json({ message: 'Token invalid', error: err.message });
            }

            req.usuarioId = decoded.id;
            req.usuarioRol = decoded.rol;
            return next();
        });
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(401).json({ message: 'Token invalid or malformed', error: err.message });
    }
};

export default authMiddleware;
