# Flint — redesign visual completo

## Intenção

O Kevin achou o visual atual (escuro, "Sangue Real" sobre roxo-preto) genérico. Ele quer um app com cara de produto premium da Apple, chamativo e com animações suaves e limpas. Testamos várias direções no navegador:

- Vidro (iOS 26), Editorial e Cartões estilo Revolut: elegantes, mas "cara de banco".
- Pôster, Neon, Foto e a fusão Pôster+Foto: não agradaram.
- Ele escolheu a **G · Estilo App Store** com um pouco da **H · Blocos coloridos**.
- Aprovou a fusão aplicada a Hoje, Sessão e Progresso, com os mascotes atuais por cima e um modo escuro.

Os mockups aprovados ficam em `.superpowers/brainstorm/15028-1793391031/content/`, que é git-ignored. Eles são a referência visual desta mudança:

- `g-mais-h.html`: Hoje, Durante o treino e Progresso, no tema claro.
- `mascotes-atuais.html`: Hoje claro, Hoje escuro e Fim do treino com os mascotes reais.

## Objetivos

- **Todas as telas** ganham a nova linguagem:
  - Hoje, Treino (rotina, editor, picker, sessão, descanso, calculadora de anilhas, histórico, resumo);
  - Água;
  - Progresso (mapa muscular, peso, fotos, calendário, gráfico do exercício, retrospectiva);
  - Time (medalhas, ajustes);
  - pesquisa de boas-vindas, Seu plano, banner demo, sheets, tab bar, Dev, ErrorBoundary.
- **Mesmas funcionalidades.** Não muda rota, dado nem regra de domínio.
- **Tema claro e escuro.** Por padrão segue o iPhone (`prefers-color-scheme`). Em Ajustes há a opção Automático, Claro ou Escuro, salva em `Settings`.
- **Backup reversível.** A versão atual tem a tag git `v1-visual-sangue-real`. Voltar é fazer checkout ou revert para essa tag.
- **Nada é publicado sem o Kevin aprovar.** O trabalho fica num branch `feat/redesign` e ele vê tudo no navegador, local ou pelo celular na rede, antes do merge e do push.

## Linguagem visual (decidida)

- **Base clara Apple:**
  - fundo `#f2f2f7`, cartões brancos com sombra suave, raio 22px;
  - título grande de tela (34px, peso 800, tracking −0,03em) com a data em caixa alta cinza por cima, como na aba Hoje da App Store.
- **Cartão-destaque com foto.** O assunto principal da tela vira um cartão grande com foto, gradiente escuro em cima e embaixo, e texto branco:
  - em Hoje, o treino do dia;
  - na Sessão, o exercício atual.
  - A foto faz zoom lento (12s, alternado). O botão é uma pílula vermelha.
- **Blocos de cor forte** para números rápidos:
  - amarelo `#ffd43b` para sequência e descanso;
  - azul `#4dabf7` para água, que "enche" ao abrir;
  - preto `#111` e vermelho para recordes.
  - Os números usam Archivo estreito e pesado (wdth 75, peso 900).
- **Vermelho `#E5163E` continua a cor da marca:** botões principais, série concluída, aba ativa.
- **Tab bar:** translúcida (blur), ícone com rótulo embaixo, aba ativa em vermelho.
- **Modo escuro:**
  - fundo `#000` e cartões `#1c1c1e`;
  - blocos um pouco mais vivos: amarelo `#ffcc00`, azul `#0a84ff`;
  - o resto igual.
- **Animações:**
  - cartões entram em sequência (subir 16px e aparecer, 0,7s, `cubic-bezier(.2,.8,.2,1)`, atraso de ~0,12s entre eles);
  - barras de gráfico crescem e a água sobe;
  - tudo respeita `prefers-reduced-motion`.
- **Tela de comemoração (fim do treino):** fundo vermelho inteiro, os três mascotes comemorando, título gigante estreito em caixa alta e stats em blocos translúcidos.
- **Mascotes:** os atuais, com o mesmo motor (`src/mascots/engine.js`), sem redesenho.
  - Faísca espia por cima do cartão-destaque em Hoje.
  - Gota e Pedra moram nos blocos.
  - O Kevin achou horríveis os mascotes redesenhados à mão. Não redesenhar. Ajuste de cor só se algum sumir no tema claro.

## Tecnologia (escolha minha, informada ao Kevin)

- Mantém Vite 8, React 19, TS, Dexie e vite-plugin-pwa, que já são as versões atuais. Nenhuma lib de UI nova.
- Tokens em `src/styles/tokens.css` com dois temas via `[data-theme]` e `prefers-color-scheme`. `global.css` é reescrito em cima deles.
- Transições entre telas com a View Transitions API nativa, que o iOS 18+ suporta. Sem suporte, a troca é instantânea.
- `theme-color` por esquema de cor no `index.html`.
- Fotos locais em `public/photos/`, otimizadas (webp, ~800px), para funcionar offline no PWA.

## Fotos (decidido pelo Kevin)

- **Fonte:** Unsplash, sob a licença Unsplash, baixadas para o projeto.
- **Pessoas:** podem aparecer. Fica revogada a regra "sem fotos reais de pessoas" da spec original, mas só para estas fotos de capa.
- **Quantidade (minha decisão):** uma foto por grupo muscular, cerca de 8 imagens.
  - Os grupos são peito, costas, pernas, ombros, braços, abdômen, corpo todo, mais uma genérica.
  - A foto do treino vem do grupo predominante entre os exercícios.
  - A foto do exercício atual vem do grupo primário dele.
- **Créditos:** os autores ficam em `public/photos/CREDITS.md`.

## Casos sem mockup (decisões minhas)

- **Hoje sem treino** (dia de descanso, rotina vazia ou demo): o cartão-destaque vira um cartão vermelho sem foto, com a Faísca grande e a mensagem do dia. Ação: "Montar rotina" ou "Treino livre", conforme o caso.
- **Mascotes:** ficam nos mesmos lugares de hoje em cada tela, dentro dos blocos novos. A quantidade não aumenta.

## Backup

- A tag `v1-visual-sangue-real` marca o commit `6030d7c` e já foi enviada ao GitHub, com autorização do Kevin.

## Não-objetivos

- Nada de funcionalidade nova. Notificações via Cloudflare Worker ficam para depois.
- Não redesenhar os mascotes. Não trocar de framework.

## Anti-objetivos (seria fracasso mesmo funcionando)

- Parecer app de banco ou template genérico.
- Animação travando no iPhone.
- Texto ilegível sobre foto ou sobre bloco colorido, em qualquer um dos temas.
- Perder ou alterar dados do usuário.

## Restrições

- Os testes existentes continuam passando (157). Eles buscam por papel e texto acessível, então rótulos e nomes de botões não mudam. Se algum texto visível mudar, o teste muda junto, com justificativa.
- Nada de push, merge ou deploy sem o Kevin pedir.
- Respostas e textos do app em pt-BR.

## Fica para o construtor

- O desenho exato das telas sem mockup, seguindo a linguagem acima.
- A ordem de migração, tela por tela.
- Os nomes dos tokens.
