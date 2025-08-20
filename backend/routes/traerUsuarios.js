const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router(); // <<--- Aquí declaramos el router
const dataPath = path.resolve(__dirname , '../../database/json/usuarios.json');

// Ruta GET para traer usuarios
router.get('/api/usuarios', (req, res) => {

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error leyendo el archivo de usuarios' });
        }

        try {
            const usuarios = JSON.parse(data);

            // Filtrar campos
            const usuariosFiltrados = usuarios.map(u => ({
                usuario: u.usuario,
                email: u.email,
                nombre: u.nombre,
                apellido: u.apellido,
                telefono: u.telefono,
                foto: u.foto
            }));

            res.json(usuariosFiltrados);
        } catch (parseError) {
            res.status(500).json({ error: 'Error parseando el archivo de usuarios' });
        }
    });
});


//RUTA DELETE PARA ELIMINAR USUARIOS 
router.delete('/api/usuarios/:usuario', (req,res) => {

    const usuarioAEliminar = req.params.usuario;

    fs.readFile(dataPath, 'utf-8', (err, data) => {

        if(err) return res.status(500).json({error: "Error leyendo archivo"});

        let usuarios;

        try{

            usuarios = JSON.parse(data);

        }catch{
            return res.status(500).json({error: "Error parseando archivo json"});
        }

        const indice = usuarios.findIndex(u => u.usuario === usuarioAEliminar);

        if(indice === -1){
            return res.status(404).json({error: "Usuario no encontrado"});
        }

        usuarios.splice(indice, 1);

        fs.writeFile(dataPath, JSON.stringify(usuarios, null, 2), 'utf8', (err) => {

            if(err) return res.status(500).json({error: "Error escribiendo archivo"});

            res.json({ mensaje: `Usuario ${usuarioAEliminar} eliminado correctamente` });

        });

    });

});


//Ruta Put
router.put('/api/usuarios/:usuario', (req, res) => {

    const usuarioId = req.params.usuario;
    const {email, nombre, apellido, telefono} = req.body;

    if(!email || !nombre || !apellido || !telefono) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    //Leer usuarios 
    let usuarios = [];
    if(fs.existsSync(dataPath)){
        usuarios = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    const index = usuarios.findIndex(u => u.usuario === usuarioId);
    if(index === -1){
        return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    //actualizar datos
    usuarios[index].email = email;
    usuarios[index].nombre = nombre;
    usuarios[index].apellido = apellido;
    usuarios[index].telefono = telefono;

    //Guardar cambios
    fs.writeFileSync(dataPath, JSON.stringify(usuarios, null, 2));

    res.json({ message: 'Usuario actualizado correctamente.' });
    

});



module.exports = router; 
