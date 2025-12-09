const mongoose = require("mongoose");

const NoticiaSchema = new mongoose.Schema({
    categoria: String,
    conteudo: String,
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Noticia", NoticiaSchema);
