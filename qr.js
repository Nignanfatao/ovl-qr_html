const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const { toDataURL } = require('qrcode');
const { delay } = require('@adiwajshing/baileys/lib/Utils');

// Chemin pour stocker les informations d'authentification
const authInfoPath = './auth_info';

router.get('/', async (req, res) => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(authInfoPath);
        let ovl = makeWASocket({
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.baileys('Desktop'),
            auth: state
        });

        let sent = false; // Variable pour suivre si une réponse a déjà été envoyée

        ovl.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s;
            if (qr && !sent) {
                const qrDataURL = await toDataURL(qr); // Convertir le QR code en base64
                const data = qrDataURL.split(',')[1]; // Envoyer seulement la partie base64 de l'URL
                res.send(data);
                sent = true; // Marquer que la réponse a été envoyée
            }

            if (connection === 'open' && !sent) {
                await delay(3000);
                let user = ovl.user.id;

                let CREDS = fs.readFileSync(authInfoPath + '/creds.json');
                var Scan_Id = Buffer.from(CREDS).toString('base64');
                await ovl.sendMessage(user, { text: `Ovl;;; ${Scan_Id}` });
                await ovl.sendMessage(user, { image: { url: 'https://telegra.ph/file/0d81626ca4a81fe93303a.jpg' }, caption: "Merci d'avoir choisi OVL-MD" });
                await delay(1000);
                try {
                    await fs.emptyDirSync(authInfoPath);
                } catch (e) {
                    console.log('Erreur lors de la suppression des fichiers :', e);
                }
            }

            ovl.ev.on('creds.update', saveCreds);

            if (connection === 'close' && !sent) {
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
                res.status(500).send('Connexion fermée avec le bot. Veuillez exécuter à nouveau.');
                sent = true; // Marquer que la réponse a été envoyée
            }
        });

        // Gestion des erreurs
        ovl.ev.on('error', (err) => {
            console.error('Erreur de connexion :', err);
            if (!sent) {
                res.status(500).send('Erreur lors de la génération du QR code');
                sent = true; // Marquer que la réponse a été envoyée
            }
        });
    } catch (err) {
        console.log(err);
        await fs.emptyDirSync(authInfoPath);
        res.status(500).send('Erreur lors de la génération du QR code');
    }
});

module.exports = router;
