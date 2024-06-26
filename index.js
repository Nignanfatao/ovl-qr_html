const express = require('express');
const app = express();
__path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
require('events').EventEmitter.defaultMaxListeners = 500;
const dataStore = require('./dataStore'); // Importer le module
const qr =require('./qr');
// Exemple d'utilisation
const data = dataStore.getQRData();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/qr', qr);

app.use('/', async (req, res, next) => {
    res.sendFile(__path + '/qr.html');
});

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

module.exports = app;
