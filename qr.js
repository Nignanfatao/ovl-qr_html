const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const { toDataURL } = require('qrcode');
const { default: OvlWASocket, useMultiFileAuthState, Browsers, delay, DisconnectReason } = require('@sampandey001/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');

const authInfoPath = __dirname + '/auth_info_baileys';

// Vérifier si le répertoire existe déjà
if (!fs.existsSync(authInfoPath)) {
    try {
        fs.mkdirSync(authInfoPath);
        console.log('Répertoire auth_info_baileys créé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la création du répertoire auth_info_baileys :', error);
    }
} else {
    console.log('Le répertoire auth_info_baileys existe déjà.');
}

// Utiliser fs.emptyDirSync après avoir vérifié ou créé le répertoire
try {
    fs.emptyDirSync(authInfoPath);
    console.log('Contenu du répertoire auth_info_baileys vidé avec succès.');
} catch (error) {
    console.error('Erreur lors du vidage du répertoire auth_info_baileys :', error);
}

router.get('/', async (req, res) => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(authInfoPath);
        let ovl = OvlWASocket({
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.baileys('Desktop'),
            auth: state
        });

        ovl.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s;
            if (qr) {
                const qrDataURL = await toDataURL(qr); // Convertir le QR code en base64
                const data = qrDataURL.split(',')[1]; // Envoyer seulement la partie base64 de l'URL
                res.send(data);
            }

            if (connection == 'open') {
                await delay(3000);
                let user = ovl.user.id;

                let CREDS = fs.readFileSync(authInfoPath + '/creds.json');
                var Scan_Id = Buffer.from(CREDS).toString('base64');
                await ovl.sendMessage(user, { text: `Ovl;;; ${Scan_Id}` });
                await ovl.sendMessage(user, { image: { url: 'https://telegra.ph/file/0d81626ca4a81fe93303a.jpg' }, caption: "Merci d'avoir choisi OVL-MD" });
                await delay(1000);
                try {
                    await fs.emptyDirSync(authInfoPath);
                } catch (e) {}
            }

            ovl.ev.on('creds.update', saveCreds);

            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                if (reason === DisconnectReason.connectionClosed) {
                    console.log('Connection fermée');
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log('Connection perdue depuis le serveur !');
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log('Redémarrage requis, redémarrage en cours...');
                    ovls().catch((err) => console.log(err));
                } else if (reason === DisconnectReason.timedOut) {
                    console.log('Connexion expirée !');
                } else {
                    console.log('Connexion fermée avec le bot. Veuillez exécuter à nouveau.');
                    console.log(reason);
                }
            }
        });
    } catch (err) {
        console.log(err);
        await fs.emptyDirSync(authInfoPath);
        res.status(500).send('Erreur lors de la génération du QR code');
    }
});

module.exports = router;
