<p align="center"><img src="public/og.png" alt="Flint — treino, água e evolução" width="720"></p>

> **English summary.** Flint is an offline-first gym tracker for iPhone, built as a PWA. You build your own routine (A, B, C…), log sets with a rest timer and plate calculator, track water and body weight, and watch three mascots react to how you train. Faísca, a little flame, evolves from orange to blue as you earn XP. Everything stays on the device in IndexedDB; there's no account and no server. React 19 + TypeScript + Dexie + Vite.

# Flint

App de academia feito para o iPhone, instalável pela tela de início. Ele é pensado para o meio do treino: abrir, marcar a série, descansar e seguir.

**Demo:** https://kevinhs07.github.io/flint/. No iPhone, abra no Safari e toque em *Compartilhar → Adicionar à Tela de Início*.

<p align="center">
  <img src="docs/media/hoje.png" width="200" alt="Tela Hoje">
  <img src="docs/media/sessao.png" width="200" alt="Treino em andamento">
  <img src="docs/media/progresso.png" width="200" alt="Progresso">
  <img src="docs/media/time.png" width="200" alt="Time de mascotes">
</p>

## O que tem

- **Rotina do seu jeito.** Você monta os treinos (A, B, C… quantos quiser) e reordena arrastando. O app sabe qual é o próximo da sequência.
- **Treino em andamento:**
  - séries com carga, reps e a coluna "última vez";
  - a Pedra sugere a próxima carga (sobrecarga progressiva);
  - descanso flutuante com −15/+15 s e vibração no fim;
  - calculadora de anilhas;
  - recorde destacado em ouro na hora.
- **Água.** Um toque soma 250 ml; segurar abre 150/250/500 ou um valor livre. A meta é automática (35 ml/kg) ou manual.
- **Progresso:**
  - mapa de calor de 6 meses;
  - músculos trabalhados na semana (frente e costas);
  - gráfico por exercício (carga máx, 1RM estimado e volume);
  - peso com média móvel e IMC;
  - fotos comparadas lado a lado.
- **Time de mascotes.** A Faísca evolui com o seu XP: laranja, vermelho, roxo e azul. A Gota fica triste se você não beber água e a Pedra comemora os seus recordes. Há medalhas diárias e marcos.
- **Seus dados, no seu celular.** Funciona offline e tem backup em JSON para exportar e importar. Não precisa de conta.

Na primeira abertura o app vem com 5 semanas de dados de exemplo. O botão **Começar do zero** limpa tudo.

## Decisões técnicas

- **Água com molas acopladas.** A superfície é uma fileira de 40 molas. Cada toque empurra algumas delas e a onda se espalha pelas vizinhas, como na "água dinâmica 2D" de jogos. Por cima entram bolhas, cáusticas e menisco, num `<canvas>` com `devicePixelRatio`. A animação pausa quando o card sai da tela (`IntersectionObserver`).
- **Mascotes num rig 2.5D em SVG.** Cada parte do corpo é um grupo com molas próprias: squash, stretch, yaw/pitch da cabeça e bracinhos. Os comportamentos (boxe, polichinelo, rosca, dança…) são curvas sobre essas molas. Um único `requestAnimationFrame` serve a todos os mascotes da tela. Dá para tocar (cócegas), arremessar e fazer carinho.
- **Conquistas derivadas do histórico.** XP, recordes, medalhas, sequência e humor dos mascotes não ficam gravados. São funções puras sobre as sessões salvas. Apagar ou editar um treino antigo recalcula tudo, sem estado para dessincronizar.
- **Dados locais.** IndexedDB via Dexie, com `navigator.storage.persist()`. O treino em andamento é gravado a cada série e sobrevive se o app fechar. O descanso conta a partir de um timestamp de fim, então continua certo com o app em segundo plano.
- **Datas pelo dia local.** "Hoje" é sempre o dia do relógio da pessoa, nunca UTC.

## Stack

React 19 · TypeScript · Vite · react-router (HashRouter) · Dexie · vite-plugin-pwa · Vitest + Testing Library · fonte Archivo. O deploy vai para o GitHub Pages via Actions.

## Rodando

```bash
npm i
npm run dev      # http://localhost:5173
npm test         # testes
npm run build    # gera dist/ com service worker
```

## Licença

MIT
