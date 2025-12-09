const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Noticia = require("../models/Noticia");

router.get("/noticias/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

        const noticias = await Noticia.find({
            categoria: { $in: user.categorias }
        })
            .sort({ data: -1 })
            .limit(20);

        res.json(noticias);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar notícias" });
    }
});

module.exports = router;
