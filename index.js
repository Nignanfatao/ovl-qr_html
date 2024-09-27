const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Servir le fichier HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'code.html'));
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Le serveur tourne sur http://localhost:${port}`);
});
