<template>
  <div class="app-container">
    <header>
      <h1>AppNotícias</h1>
    </header>

    <div v-if="!logado" class="card login-card">
      <h2>Bem-vindo</h2>
      <p>Digite seu ID para entrar ou criar conta.</p>
      
      <input v-model="userId" placeholder="Seu ID (ex: aluno123)" class="input-full" />
      
      <button @click="entrar" :disabled="!userId" class="btn-primary">
        Acessar / Cadastrar
      </button>
      <p v-if="erro" class="error">{{ erro }}</p>
    </div>

    <div v-else class="main-content">
      
      <div class="top-bar">
        <span>Usuário: <strong>{{ userId }}</strong></span>
        <button @click="sair" class="btn-small">Sair</button>
      </div>

      <div class="card preferences">
        <h3>Suas Preferências</h3>
        <div class="cats-grid">
          <label v-for="cat in opcoes" :key="cat" class="cat-item">
            <input type="checkbox" :value="cat" v-model="selecionadas">
            {{ capitalize(cat) }}
          </label>
        </div>
        <button @click="salvarPreferencias" class="btn-action">
          Salvar Preferências
        </button>
      </div>

      <div class="news-feed">
        <h3>Últimas Notícias</h3>
        
        <button @click="carregarNoticias" class="btn-refresh">Atualizar</button>

        <div v-if="noticias.length === 0" class="empty-state">
          Nenhuma notícia encontrada para suas categorias.
        </div>

        <div v-for="(n, index) in noticias" :key="index" class="news-card">
          <span class="badge" :class="n.categoria">{{ n.categoria }}</span>
          <p class="news-content">{{ n.conteudo }}</p>
          
          <small class="news-date">
            {{ new Date(n.data).toLocaleString() }}
          </small>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // Modifique a chave quando for criada uma nova chave VAPID
      publicKey: "BNBvVa8gacdP1D7CPP7-1lJpy73FndzRC4UNW247yrRtXgPzscJGVWPuYLcfdmG14HSwrW4zVjrNFblgKBDN8GA", 
      
      userId: "",
      selecionadas: [],
      opcoes: ['tecnologia', 'saude', 'negocios', 'natureza', 'politica'],
      logado: false,
      noticias: [],
      erro: ""
    };
  },

  // Verifica se já existe usuário salvo no localStorage
  async mounted() {
    const salvo = localStorage.getItem("userId");
    if (salvo) {
      this.userId = salvo;
      this.logado = true;
      this.carregarNoticias();
    }
  },

  methods: {
    capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); },

    // Converte chave pública VAPID de base64 para Uint8Array
    urlB64ToUint8Array(base64String) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    },

    // Registra service worker e obtém inscrição para push
    async getSubscription() {
      // Verifica suporte a service workers
      if (!("serviceWorker" in navigator)) return null;

      // Registra service worker
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      await navigator.serviceWorker.ready;
      
      // Obtém inscrição existente
      let sub = await reg.pushManager.getSubscription();
      // Se não existir, cria nova inscrição
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlB64ToUint8Array(this.publicKey)
        });
      }
      return sub;
    },

    // Realiza login ou cadastro do usuário
    async entrar() {
      this.erro = "";
      try {
        // Obtém inscrição para push
        const sub = await this.getSubscription();
        // Envia dados ao servidor
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: this.userId,
            subscription: sub
          })
        });

        if (res.ok) {
          const data = await res.json();
          this.logado = true;
          // Carrega categorias salvas se houver
          if(data.categorias) this.selecionadas = data.categorias;
          localStorage.setItem("userId", this.userId);
          this.carregarNoticias();
        } else {
          this.erro = "Erro ao conectar com servidor.";
        }
      } catch (e) {
        console.error(e);
        this.erro = "Servidor offline.";
      }
    },

    // Salva as preferências de categorias do usuário
    async salvarPreferencias() {
      try {
        // Envia categorias selecionadas ao servidor
        await fetch("/api/preferencias", {
          method: "POST",
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId: this.userId,
            categorias: this.selecionadas
          })
        });
        alert("Preferências salvas! Você receberá notícias dessas categorias.");
        this.carregarNoticias(); // Atualiza notícias após salvar
      } catch (e) {
        alert("Erro ao salvar preferências.");
      }
    },

    // Filtra e carrega notícias do servidor
    async carregarNoticias() {
      try {
        // Solicita notícias ao servidor
        const res = await fetch(`/api/noticias/${this.userId}`);
        if(res.ok) {
          this.noticias = await res.json();
        }
      } catch(e) {
        console.log("Servidor offline ou sem notícias.");
      }
    },

    sair() {
      this.logado = false;
      this.userId = "";
      this.noticias = [];
      this.selecionadas = [];
      localStorage.removeItem("userId");
    }
  }
};
</script>

<style>
:root { --primary: #4dba87; --dark: #2c3e50; --bg: #f4f4f4; }
body { font-family: 'Avenir', sans-serif; background: var(--bg); margin: 0; color: var(--dark); }
.app-container { max-width: 600px; margin: 0 auto; padding: 20px; }
header { text-align: center; margin-bottom: 20px; }

.card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
.input-full { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;}

.cats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
.cat-item { background: #eee; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px;}

.btn-primary { background: var(--primary); color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem;}
.btn-action { background: var(--dark); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%;}
.btn-small { background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }

.btn-refresh { 
    background: #ffffff; 
    color: #000000; 
    border: 1px solid #ccc; 
    padding: 5px 10px; 
    cursor: pointer; 
    margin-bottom: 10px; 
    border-radius: 4px;
    font-weight: bold;
}

.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }

.news-card { background: white; border-left: 5px solid var(--primary); padding: 15px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: left;}
.badge { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; text-transform: uppercase; font-weight: bold; color: #555;}
.badge.tecnologia { background: #e3f2fd; color: #1565c0; }
.badge.saúde { background: #e8f5e9; color: #2e7d32; }

.error { color: red; margin-top: 10px; font-size: 0.9em; }
</style>