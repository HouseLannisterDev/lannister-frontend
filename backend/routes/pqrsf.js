const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ruta absoluta a chatbot_data.json
const rutaJSON = path.join(__dirname, '../../database/seeds/chatbot_data.json');

// POST - Guardar nueva entrada
router.post('/pqrsf', (req, res) => {
    const { entrada, salida } = req.body;

    if (!entrada || !salida) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    try {
        // Leer archivo existente
        let datos = [];
        if (fs.existsSync(rutaJSON)) {
            const contenido = fs.readFileSync(rutaJSON, 'utf8');
            datos = contenido ? JSON.parse(contenido) : [];
        }

        // Normalizar la entrada para que siempre sea un array de frases
        const nuevasEntradas = entrada.split(',').map(txt => txt.trim()).filter(Boolean);

        // Crear nuevo objeto con el formato requerido
        const nuevoDato = {
            input: nuevasEntradas,
            response: salida
        };

        datos.push(nuevoDato);

        // Guardar en el archivo con formato bonito
        fs.writeFileSync(rutaJSON, JSON.stringify(datos, null, 2), 'utf8');

        res.status(200).json({ mensaje: 'Guardado con éxito' });
    } catch (error) {
        console.error('Error al guardar PQRSF:', error);
        res.status(500).json({ error: 'Error al guardar los datos' });
    }
});

// GET - Ver todo el diccionario
router.get('/chatbot-data', (req, res) => {
    try {
        if (!fs.existsSync(rutaJSON)) {
            return res.json([]);
        }
        const contenido = fs.readFileSync(rutaJSON, 'utf8');
        const datos = contenido ? JSON.parse(contenido) : [];
        res.json(datos);
    } catch (error) {
        console.error('Error al leer PQRSF:', error);
        res.status(500).json({ error: 'Error al leer los datos' });
    }
});

module.exports = router;
