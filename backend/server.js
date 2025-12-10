const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');

// Config
const connectDB = require("./config/database");
require("./config/webpush");

// Rotas
const authRoutes = require("./routes/authRoutes");
const preferenciasRoutes = require("./routes/preferenciasRoutes");
const noticiasRoutes = require("./routes/noticiasRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Serve os arquivos do Frontend (pasta dist gerada pelo build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Conectar ao banco
connectDB();

// Usar rotas
app.use("/api", authRoutes);
app.use("/api", preferenciasRoutes);
app.use("/api", noticiasRoutes);
app.use("/admin", adminRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
