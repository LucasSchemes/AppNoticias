<template>
  <div class="app-container">
    <h1>📰 AppNotícias T3</h1>

    <div v-if="!logado" class="card">
      <h3>{{ modoLogin ? 'Fazer Login' : 'Criar Conta' }}</h3>
      
      <input v-model="userId" placeholder="Usuário (ID)" class="input-full" />
      <input v-model="password" type="password" placeholder="Senha" class="input-full" />
      
      <div v-if="!modoLogin">
        <p>Escolha suas categorias:</p>
        <div class="cats">
          <label v-for="cat in opcoes" :key="cat">
            <input type="checkbox" :value="cat" v-model="selecionadas"> {{ cat }}
          </label>
        </div>
      </div>

      <button @click="autenticar" :disabled="!userId || !password" class="btn-primary">
        {{ modoLogin ? 'Entrar' : 'Cadastrar' }}
      </button>
      
      <p style="text-align:center; margin-top:10px;">
        <small @click="modoLogin = !modoLogin" style="cursor:pointer; color:blue;">
          {{ modoLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login' }}
        </small>
      </p>
      
      <p v-if="erro" class="error">{{ erro }}</p>
    </div>

    <div v-else class="card">

      <div class="header">
        <span>Olá, {{ userId }} <small v-if="isAdmin"> (ADMIN)</small></span>
        <div>
          <button @click="carregarNoticias">↻</button>
          <button @click="sair" style="background:#d9534f; margin-left:5px">Sair</button>
        </div>
      </div>

      <h4>Suas categorias:</h4>
      <div class="cats">
        <label v-for="cat in opcoes" :key="cat">
          <input type="checkbox" :value="cat" v-model="selecionadas" @change="atualizarCategorias"> 
          {{ cat }}
        </label>
      </div>

      <div v-if="noticias.length === 0">Nenhuma notícia encontrada.</div>

      <div v-for="n in noticias" :key="n._id" class="news-item">
        <small class="badge">{{ n.categoria }}</small>
        <p>{{ n.conteudo }}</p>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      publicKey: "BJuvu6hmr3W8zFcOTob8ZgU6TnC6BtIwdFImQTJK8MvPG0XFlqQVqIqrXGMZGg74I6TwXJ5EwyQZEV850PQXFog",
      
      userId: "",
      password: "",
      selecionadas: [],
      
      opcoes: ['tecnologia', 'saúde', 'negócios', 'natureza', 'política'],
      
      logado: false,
      modoLogin: true,
      isAdmin: false,

      noticias: [],
      erro: ""
    };
  },

  async mounted() {
    const token = localStorage.getItem("token");
    if (token) {
      this.userId = localStorage.getItem("userId");
      this.isAdmin = localStorage.getItem("role") === "admin";
      this.logado = true;
      this.carregarNoticias();
    }
  },

  methods: {
    urlB64ToUint8Array(base64String) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    },

    async getSubscription() {
      if (!("serviceWorker" in navigator)) return null;

      const reg = await navigator.serviceWorker.register("/service-worker.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlB64ToUint8Array(this.publicKey)
        });
      }

      return sub;
    },

    async autenticar() {
      this.erro = "";

      try {
        const sub = await this.getSubscription();

        const endpoint = this.modoLogin ? "/auth/login" : "/auth/register";

        const payload = {
          userId: this.userId,
          password: this.password,
          subscription: sub
        };

        if (!this.modoLogin) {
          payload.categorias = this.selecionadas;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
          this.logado = true;
          this.isAdmin = data.role === "admin";

          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", this.userId);
          localStorage.setItem("role", data.role);

          this.carregarNoticias();

        } else {
          this.erro = data.error;
        }

      } catch (err) {
        this.erro = "Erro de conexão com servidor.";
      }
    },

    async atualizarCategorias() {
      await fetch("/auth/updateCategorias", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId: this.userId,
          categorias: this.selecionadas
        })
      });

      this.carregarNoticias();
    },

    async carregarNoticias() {
      const res = await fetch(`/noticias/${this.userId}`);
      this.noticias = await res.json();
    },

    sair() {
      this.logado = false;
      this.userId = "";
      this.password = "";
      this.noticias = [];
      localStorage.clear();
    }
  }
};
</script>

<style>
.error { color: red; font-size: 0.9em; text-align: center; }
</style>
