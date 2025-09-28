// Servidor Node.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para JSON (por si más adelante lo necesitas)
app.use(express.json());

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, '..')));

// Ruta principal -> devuelve el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://127.0.0.1:${PORT}`);
});
