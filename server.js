const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); // Si tu veux utiliser .env

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "YEHOUENOU123";
const PORT = process.env.PORT || 3000;

// Vérification du webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Vérification webhook réussie.');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Réception des messages
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const event = entry.messaging[0];
      console.log('📩 Message reçu :', event);
      // Tu peux ajouter une réponse ici
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => console.log(`🚀 Webhook actif sur le port ${PORT}`));
