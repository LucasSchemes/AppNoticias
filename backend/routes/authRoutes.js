const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.post("/login", async (req, res) => {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
        return res.status(400).send({ error: "Dados incompletos" });
    }

    try {
        const user = await User.findOneAndUpdate(
            { userId },
            { subscription },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: "Login realizado",
            categorias: user.categorias || []
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao salvar usuário" });
    }
});

module.exports = router;
