const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const connectURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/appnoticias";
        await mongoose.connect(connectURI);
        console.log("Conectado ao MongoDB");
    } catch (err) {
        console.error("Erro ao conectar no MongoDB:", err);
        process.exit(1);
    }
};

module.exports = connectDB;
