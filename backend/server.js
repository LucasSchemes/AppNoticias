const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const webpush = require('web-push');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configuração de Middlewares
app.use(cors()); // Permite que o Frontend (porta 5173) acesse o Backend (porta 3000)
app.use(bodyParser.json());

// --- CONFIGURAÇÃO DO MONGODB ---
// Certifique-se de que o MongoDB está rodando na sua máquina
mongoose.connect('mongodb://127.0.0.1:27017/appnoticias')
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

// --- SCHEMAS E MODELS ---

// Modelo de Usuário (Armazena ID, Inscrição de Push e Preferências)
const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    subscription: { type: Object, required: true }, // Objeto gerado pelo navegador
    categorias: [String] // Ex: ['tecnologia', 'saude']
});
const User = mongoose.model('User', UserSchema);

// Modelo de Notícia (Para histórico)
const NoticiaSchema = new mongoose.Schema({
    categoria: String,
    conteudo: String,
    data: { type: Date, default: Date.now }
});
const Noticia = mongoose.model('Noticia', NoticiaSchema);

// --- CONFIGURAÇÃO WEB-PUSH ---
// Tenta ler as chaves do arquivo. Se não existir, avisa para gerar.
let publicVapidKey = '';
let privateVapidKey = '';

try {
    const chaves = require('./chaves.json');
    publicVapidKey = chaves.publicKey;
    privateVapidKey = chaves.privateKey;
    
    webpush.setVapidDetails(
        'mailto:admin@appnoticias.com',
        publicVapidKey,
        privateVapidKey
    );
    console.log('✅ Chaves VAPID carregadas.');
} catch (e) {
    console.error('⚠️ ALERTA: Arquivo chaves.json não encontrado ou inválido.');
    console.error('⚠️ Rode "npm run gerar-chaves" e copie a publicKey para o seu Frontend!');
}

// --- ROTAS DA API ---

// 1. Rota de Login/Inscrição (Salva o usuário e sua subscription)
app.post('/api/login', async (req, res) => {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
        return res.status(400).send({ error: 'Dados incompletos' });
    }

    try {
        // Usa upsert: se existe atualiza, se não existe cria
        let user = await User.findOneAndUpdate(
            { userId }, 
            { subscription }, // Atualiza subscription (caso tenha mudado de navegador)
            { new: true, upsert: true }
        );
        res.status(200).json({ 
            message: 'Login realizado', 
            categorias: user.categorias || [] 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar usuário' });
    }
});

// 2. Rota de Preferências (Atualiza categorias do usuário)
app.post('/api/preferencias', async (req, res) => {
    const { userId, categorias } = req.body;

    try {
        await User.findOneAndUpdate({ userId }, { categorias });
        res.status(200).json({ message: 'Preferências atualizadas' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar preferências' });
    }
});

// 3. Rota para Frontend buscar notícias (Baseado nas categorias do usuário)
app.get('/api/noticias/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Busca notícias apenas das categorias que o usuário segue
        const noticias = await Noticia.find({ 
            categoria: { $in: user.categorias } 
        }).sort({ data: -1 }).limit(20);

        res.json(noticias);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar notícias' });
    }
});

// 4. Rota ADMIN - Publicar Notícia e Disparar Push
// Esta é a rota que seu linhaComando.js chama
app.post('/admin/publicar', async (req, res) => {
    const { categoria, conteudo } = req.body;

    console.log(`📢 Admin publicando em [${categoria}]: ${conteudo}`);

    // 1. Salva a notícia no Banco
    const novaNoticia = new Noticia({ categoria, conteudo });
    await novaNoticia.save();

    // 2. Busca usuários interessados nessa categoria
    const usuarios = await User.find({ categorias: categoria });

    // 3. Envia Push Notification para cada um
    const notificacaoPayload = JSON.stringify({
        title: `Nova notícia de ${categoria}`,
        message: conteudo
    });

    // Dispara em paralelo
    usuarios.forEach(usuario => {
        webpush.sendNotification(usuario.subscription, notificacaoPayload)
            .catch(err => {
                console.error(`Falha ao enviar para ${usuario.userId}:`, err.statusCode);
                // Opcional: Se der erro 410 (Gone), deletar o usuário do banco
                if (err.statusCode === 410) {
                     User.deleteOne({ _id: usuario._id }).exec();
                }
            });
    });

    res.status(200).json({ 
        message: 'Notícia publicada e notificações enviadas', 
        enviadoPara: usuarios.length 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});