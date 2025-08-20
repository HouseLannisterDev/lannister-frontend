// Importaciones
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Inicialización de router y ruta de usuarios
const router = express.Router();
const usuariosPath = path.join(__dirname, '../../database/json/usuarios.json');

// Middleware para parsear JSON
router.use(express.json());

// Endpoint para registrar usuario
router.post('/api/registrar', async (req, res) => {
    const { usuario, email, nombre, apellido, telefono, contrasena, confirmarContrasena } = req.body;

    // Validaciones básicas
    if (!usuario || !email || !nombre || !apellido || !telefono || !contrasena || !confirmarContrasena) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (contrasena !== confirmarContrasena) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    }
    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Correo electrónico no válido.' });
    }

    // Leer usuarios desde archivo
    let usuarios = [];
    if (fs.existsSync(usuariosPath)) {
        usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
    }

    // Verificar si el usuario o email ya existe
    const existeUsuario = usuarios.find(u => u.usuario === usuario);
    if (existeUsuario) {
        return res.status(400).json({ error: 'El usuario ya está registrado.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Crear objeto usuario con campo 'foto' por defecto
    const nuevoUsuario = {
        usuario,
        email,
        nombre,
        apellido,
        telefono,
        contrasena: hashedPassword,
        foto: 'userIconDefault.png'
    };

    // Guardar usuario en el JSON
    usuarios.push(nuevoUsuario);
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

    return res.json({ message: '¡Usuario registrado con éxito!', usuario: nuevoUsuario.usuario });
});

// Exportar router
module.exports = router;
