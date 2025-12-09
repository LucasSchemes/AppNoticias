const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/preferencias", async (req, res) => {
    const { userId, categorias } = req.body;

    try {
        await User.findOneAndUpdate({ userId }, { categorias });
        res.status(200).json({ message: "Preferências atualizadas" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar preferências" });
    }
});

module.exports = router;
