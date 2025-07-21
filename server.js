const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); // Charge les variables depuis .env

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
