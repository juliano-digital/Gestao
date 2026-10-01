/// <reference types="vite-plugin-pwa/client" />

/**
 * Registro manual do Service Worker do PWA.
 *
 * Por que isso existe: o registro automático embutido do vite-plugin-pwa
 * (injectRegister: 'auto') só instala a versão nova do Service Worker em
 * segundo plano — ele NÃO recarrega sozinho as abas que já estavam
 * abertas. Resultado: mesmo com o build novo publicado, quem já tinha o
 * app aberto (ou aberto há pouco tempo) continua vendo a versão antiga
 * até fechar e abrir o app de novo manualmente.
 *
 * Este arquivo resolve isso: assim que a versão nova assume o controle
 * (evento "controllerchange"), a página recarrega sozinha, buscando o
 * app atualizado — sem o usuário precisar fazer nada.
 *
 * Import necessário no topo do seu src/main.tsx:
 *   import './registerServiceWorker';
 */

import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  // Evita recarregar mais de uma vez caso o evento dispare de novo
  let jaRecarregando = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (jaRecarregando) return;
    jaRecarregando = true;
    window.location.reload();
  });
}

// immediate: true -> registra o Service Worker assim que o app carrega,
// sem esperar nenhuma interação do usuário.
// onNeedRefresh -> chamado quando existe uma versão nova disponível;
// como registerType já é 'autoUpdate', a atualização já acontece sozinha
// nos bastidores — aqui só garantimos que a aba recarregue via o listener
// de "controllerchange" acima.
registerSW({
  immediate: true,
  onRegisterError(error) {
    console.error('Erro ao registrar o Service Worker:', error);
  },
});
