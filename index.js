const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
require('events').EventEmitter.defaultMaxListeners = 500;
const router = require('./qr'); // Importer le fichier de routes

// Configurer le middleware body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route pour servir le fichier HTML
app.use('/', (req, res) => {
    res.sendFile(__dirname + '/code.html');
});

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

module.exports = app;
