// Importaciones
const express = require('express');
const fs = require('fs');
const path = require('path');

// Inicialización de router y ruta de suscripciones
const router = express.Router();
const suscripcionesPath = path.join(__dirname, '../../database/json/suscripciones.json');

// Middleware para parsear JSON
router.use(express.json());

// Endpoint para suscribirse
router.post('/api/suscribirse', (req, res) => {
    const { email } = req.body;

    // Validación de correo
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Correo inválido' });
    }

    // Leer suscripciones desde archivo
    let suscripciones = [];
    if (fs.existsSync(suscripcionesPath)) {
        suscripciones = JSON.parse(fs.readFileSync(suscripcionesPath, 'utf8'));
    }

    // Agregar nueva suscripción
    suscripciones.push({ email, fecha: new Date().toISOString() });

    // Guardar suscripciones en el JSON
    fs.writeFileSync(suscripcionesPath, JSON.stringify(suscripciones, null, 2));

    return res.json({ message: '¡Suscripción guardada con éxito!' });
});

// Exportar router
module.exports = router;