const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'yehouenou_token';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || 'votre_token_meta';
const PORT = process.env.PORT || 3000;

/**
 * Envoi d’un message texte via l’API Messenger Graph
 */
function sendMessage(recipientId, messageText) {
  const postData = JSON.stringify({
    recipient: { id: recipientId },
    message: { text: messageText }
  });

  const options = {
    hostname: 'graph.facebook.com',
    path: `/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () => {
      console.log(`✅ Réponse Messenger API : ${res.statusCode} - ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Erreur : ${e.message}`);
  });

  req.write(postData);
  req.end();
}

/**
 * Vérification du webhook (appel GET par Meta lors de l’ajout)
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('🔐 Webhook vérifié par Facebook.');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * Réception des messages (appel POST par Meta quand un utilisateur envoie un message)
 */
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const messagingEvents = entry.messaging;

      messagingEvents.forEach(event => {
        const senderId = event.sender.id;

        // Si c’est un message texte
        if (event.message && event.message.text) {
          const userMessage = event.message.text;

          // Réponse d’accueil personnalisée
          const welcome = `👋 Bonjour et bienvenue dans YEHOUENOU CITY 🌆 ! Je suis Polycarpe YEHOUENOU, ton guide familial. Prêt à commencer ton enregistrement ?`;

          sendMessage(senderId, welcome);
        }

        // Si c’est un postback (par exemple, bouton "Continuer")
        if (event.postback && event.postback.payload === 'START_REGISTRATION') {
          sendMessage(senderId, '📋 Super ! Commençons par ton nom de famille. Quel est-il ?');
        }

        // 👉 Tu pourras ajouter ici la logique pour enchaîner les étapes (prénom, date, etc.)
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 YEHOUENOU CITY Webhook lancé sur le port ${PORT}`);
});
