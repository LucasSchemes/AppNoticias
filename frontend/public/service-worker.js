self.addEventListener("install", (event) => {
  console.log("[SW] Instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Ativo");
  return self.clients.claim();
});

// Recebe push do servidor
self.addEventListener("push", (event) => {
  console.log("[SW] Push recebido");

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Nova notícia", message: event.data.text() };
  }

  const options = {
    body: data.message,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ao clicar na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientsList) => {
      // Se já existe uma aba aberta, focar nela
      for (let client of clientsList) {
        if (client.url.includes("/") && "focus" in client) {
          return client.focus();
        }
      }
      // Senão, abrir nova
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
