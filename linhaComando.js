const categoria = process.argv[2];
const conteudo = process.argv[3];

if (!categoria || !conteudo) {
    console.log("Uso: node linhaComando.js <categoria> <conteudo>");
    console.log("Exemplo: node linhaComando.js tecnologia 'Nova CPU lançada'");
    process.exit(1);
}

// URL do Backend
const SERVER_URL = "http://localhost:3000/admin/publicar";

async function enviarNoticia() {
    try {
        console.log(`Enviando notícia para categoria: [${categoria}]...`);
        
        // Faz requisição HTTP para o servidor
        const response = await fetch(SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                categoria: categoria,
                conteudo: conteudo
            })
        });

        if (response.ok) {
            console.log("Sucesso! O servidor recebeu a ordem de envio.");
        } else {
            console.error(`Erro no servidor: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error("Erro de conexão.", error.message);
    }
}

enviarNoticia();