const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PORT = process.env.PORT || 3000;

// Mémoires temporaires en RAM
let userStep = {};
let userData = {};

// Fonction d’envoi de message via Messenger API
function sendMessage(userId, messageText) {
  const data = JSON.stringify({
    recipient: { id: userId },
    message: { text: messageText }
  });

  const options = {
    hostname: 'graph.facebook.com',
    path: `/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, res => {
    res.on('data', () => {});
    res.on('end', () => {});
  });

  req.on('error', e => console.error('Erreur Messenger API:', e));
  req.write(data);
  req.end();
}

// Vérification du webhook Facebook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Réception des messages utilisateur
app.post('/webhook', (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        const senderId = event.sender.id;

        // Démarrage du flux si aucun historique
        if (!userStep[senderId]) {
          userStep[senderId] = 'nom';
          userData[senderId] = {};
          sendMessage(senderId, '👋 Bienvenue dans YEHOUENOU CITY ! Quel est ton nom de famille ?');
        }
        else if (event.message && event.message.text) {
          const msg = event.message.text;
          const step = userStep[senderId];

          userData[senderId][step] = msg;

          switch (step) {
            case 'nom':
              userStep[senderId] = 'prenoms';
              sendMessage(senderId, '📝 Tes prénoms ?');
              break;
            case 'prenoms':
              userStep[senderId] = 'naissance';
              sendMessage(senderId, '📅 Ta date de naissance ?');
              break;
            case 'naissance':
              userStep[senderId] = 'lieuNaissance';
              sendMessage(senderId, '📍 Ton lieu de naissance ?');
              break;
            case 'lieuNaissance':
              userStep[senderId] = 'residence';
              sendMessage(senderId, '🏠 Ton lieu de résidence actuel ?');
              break;
            case 'residence':
              userStep[senderId] = 'travail';
              sendMessage(senderId, '💼 Ton métier ou occupation ?');
              break;
            case 'travail':
              userStep[senderId] = 'lienNicodeme';
              sendMessage(senderId, '🌳 Quel est ton lien avec YEHOUENOU NICODÈME (Fils, Petit-fils, Cousin, etc.) ?');
              break;
            case 'lienNicodeme':
              userStep[senderId] = null;

              // Sauvegarde locale
              const outputPath = path.join(__dirname, 'dataStore.json');
              fs.writeFileSync(outputPath, JSON.stringify(userData[senderId], null, 2));

              // Génération PDF
              const generatePDF = require('./pdfGenerator');
              generatePDF(userData[senderId]);

              sendMessage(senderId, '✅ Merci ! Ta fiche familiale a été générée 🧬. Bienvenue à YEHOUENOU CITY ✨');
              break;
          }
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => {
  console.log(`📡 Webhook YEHOUENOU CITY actif sur le port ${PORT}`);
});
