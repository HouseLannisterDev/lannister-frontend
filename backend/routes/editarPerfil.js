const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const router = express.Router();

const usuariosPath = path.join(__dirname, '../../database/json/usuarios.json');
const photoDir = path.join(__dirname, '../../database/photoprofile');

// Configuración de multer para subir la imagen
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, photoDir);
    },
    filename: function (req, file, cb) {
        const username = req.body.usuario;
        const ext = path.extname(file.originalname);
        cb(null, `${username}${ext}`);
    }
});
const upload = multer({ storage });

// Endpoint POST para guardar cambios
router.post('/api/editar-perfil', upload.single('foto'), async (req, res) => {

    const { usuario, email, nombre, apellido, telefono, currentPassword, newPassword, confirmNewPassword } = req.body;

    let usuarios = [];
    if (fs.existsSync(usuariosPath)) {
        usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
    }

    const index = usuarios.findIndex(u => u.usuario === usuario);
    if (index === -1) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    //Revisar contraseña
    const user = usuarios[index];
    const match = await bcrypt.compare(currentPassword, user.contrasena);

    if(!match){
        return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    //revisar y hashear si se cambia la contraseña

    if(newPassword || confirmNewPassword){

        if(newPassword !== confirmNewPassword){
            return res.status(400).json({ error: 'La nueva contraseña no coincide' }); 
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        usuarios[index].contrasena = hashed;

    }

    // Actualizar campos
    
    usuarios[index].email = email;
    usuarios[index].nombre = nombre;
    usuarios[index].apellido = apellido;
    usuarios[index].telefono = telefono;

    // Si hay foto, actualizar la ruta
    if (req.file) {
        usuarios[index].foto = req.file.filename;
    }

    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

    return res.json({ message: 'Perfil actualizado correctamente', usuario: usuarios[index] });
});

module.exports = router;
