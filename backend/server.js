// Servidor Node.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

//SERVIR DE ARCHIVOS DATBASE COMO FOTOS

//RUTA DINAMICA PARA CUANDO MONTEN EN LA NUBE NO BORREN ESTA MADRE
app.get('/fotos/:nombreArchivo', (req, res) => {
    const nombreArchivo = req.params.nombreArchivo;
    const rutaAbsoluta = path.join(__dirname, '../database/photoprofile', nombreArchivo);

    //console.log('Sirviendo imagen desde:', rutaAbsoluta);  

    res.sendFile(rutaAbsoluta, (err) => {
        if (err) {
            // console.error('Error al enviar archivo:', err);
            res.status(404).send('Archivo no encontrado');
        }
    });
});



// Importar rutas
const registroRoute = require('./routes/registro');
const suscripcionesRoute = require('./routes/suscripciones');
const loginRoutes = require('./routes/entrada');
const editarPerfilRoute = require('./routes/editarPerfil');

//Rutas opciones admin
const pqrsfRoute = require('./routes/pqrsf');
const usuariosRoute = require('./routes/traerUsuarios');


// Usar rutas
app.use(registroRoute);
app.use(suscripcionesRoute);
app.use(loginRoutes);
app.use(editarPerfilRoute);
app.use(pqrsfRoute);
app.use(usuariosRoute);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
