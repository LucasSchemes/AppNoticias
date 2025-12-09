const webpush = require("web-push");
const fs = require("fs");

let publicVapidKey = "";
let privateVapidKey = "";

try {
    const chaves = require("../chaves.json");

    publicVapidKey = chaves.publicKey;
    privateVapidKey = chaves.privateKey;

    webpush.setVapidDetails(
        "mailto:admin@appnoticias.com",
        publicVapidKey,
        privateVapidKey
    );

    console.log("Chaves VAPID carregadas.");
} catch (e) {
    console.error("Arquivo chaves.json não encontrado ou inválido.");
    console.error('Rode "npm run gerar-chaves".');
}

module.exports = webpush;
