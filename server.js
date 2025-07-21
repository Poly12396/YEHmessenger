const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); // Charge les variables depuis .env

const https = require('https');

function sendMessage(recipientId, messageText) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

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
      console.log(`Réponse Messenger : ${res.statusCode} - ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Erreur : ${e.message}`);
  });

  req.write(postData);
  req.end();
}

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mon_token";
const PORT = process.env.PORT || 3000;

// ✅ Vérification du webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Vérification réussie !");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 📩 Réception des messages
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      console.log('Message reçu :', webhookEvent);

      // Réponse automatique (exemple)
      if (webhookEvent.message && webhookEvent.sender) {
        const senderId = webhookEvent.sender.id;
        const messageText = webhookEvent.message.text;

        // Tu pourrais répondre ici via l'API Send de Facebook
        console.log(`Utilisateur ${senderId} a dit : ${messageText}`);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur webhook lancé sur le port ${PORT}`);
});
