const express = require("express");
const router = express.Router();

const Noticia = require("../models/Noticia");
const User = require("../models/User");
const webpush = require("../config/webpush");

router.post("/publicar", async (req, res) => {
    const { categoria, conteudo } = req.body;

    console.log(`Admin publicando em [${categoria}]: ${conteudo}`);

    const novaNoticia = new Noticia({ categoria, conteudo });
    await novaNoticia.save();

    const usuarios = await User.find({ categorias: categoria });

    const payload = JSON.stringify({
        title: `Nova notícia de ${categoria}`,
        message: conteudo
    });

    usuarios.forEach(usuario => {
        webpush.sendNotification(usuario.subscription, payload)
            .catch(err => {
                console.error(`Erro ao enviar para ${usuario.userId}`, err.statusCode);

                if (err.statusCode === 410) {
                    User.deleteOne({ _id: usuario._id }).exec();
                }
            });
    });

    res.status(200).json({
        message: "Notícia publicada e notificações enviadas",
        enviadoPara: usuarios.length
    });
});

module.exports = router;
