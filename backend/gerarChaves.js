const webpush = require('web-push');
const fs = require('fs');

// Gera as chaves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

// Salva em um arquivo JSON
fs.writeFileSync('chaves.json', JSON.stringify(vapidKeys, null, 2));

console.log('Chaves geradas com sucesso no arquivo chaves.json!');
console.log('---');
console.log('COPIE ESTA PUBLIC KEY PARA O SEU FRONTEND (App.vue):');
console.log(vapidKeys.publicKey);
console.log('---');
