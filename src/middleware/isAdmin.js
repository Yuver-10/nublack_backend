
const isAdmin = (req, res, next) => {
    if (req.usuarioRol === 'administrador') {
        return next();
    }
    return res.status(403).json({ message: 'Acceso denegado: Requiere permisos de administrador' });
};

export default isAdmin;
