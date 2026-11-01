# Flint Redesign Visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o visual inteiro do Flint pela linguagem "App Store + blocos coloridos" aprovada (tema claro e escuro), sem mudar nenhuma funcionalidade.

**Architecture:**
- Os tokens de cor viram dois temas em `tokens.css`, selecionados por `html[data-theme]`. `applyTheme()` resolve "auto" via `prefers-color-scheme`.
- `global.css` é reescrito tela a tela, em cima dos tokens.
- Dois componentes novos carregam a linguagem: `FeatureCard` (cartão-destaque com foto ou vermelho) e o modificador de bloco colorido em `.tile`.
- As fotos são estáticas em `public/photos/`, escolhidas por grupo muscular em `src/domain/photos.ts`.

**Tech Stack:**
- Vite 8, React 19, TS strict, react-router 8 (`viewTransition` nativo), Dexie 4, Vitest + Testing Library.
- Fonte `@fontsource-variable/archivo`, que já está instalada.

**Spec:** `docs/superpowers/specs/2026-10-30-flint-redesign-design.md`

**Referência visual:** os mockups `g-mais-h.html` e `mascotes-atuais.html`, em `.superpowers/brainstorm/15028-1793391031/content/`. Abra-os no navegador e copie valores (raios, tamanhos, sombras, curvas) de lá.

## Global Constraints

### Cores e tipografia
- Tema claro:
  - fundo `#f2f2f7`, cartão `#fff`, texto `#111`, secundário `#8e8e93`;
  - raio de cartão 22px;
  - sombra de cartão `0 4px 14px rgba(0,0,0,.05)`;
  - sombra do cartão-destaque `0 14px 34px rgba(0,0,0,.18)`.
- Tema escuro:
  - fundo `#000`, cartão `#1c1c1e`;
  - bloco amarelo `#ffcc00`, bloco azul `#0a84ff`.
- Blocos no tema claro: amarelo `#ffd43b` (texto `#111`), azul `#4dabf7` (texto `#fff`), preto `#111` (texto `#fff`).
- Marca: vermelho `#E5163E` em botões principais, série concluída e aba ativa.
- Título de tela: 34px, peso 800, `letter-spacing: -.03em`. Por cima, eyebrow com a data em caixa alta, 13px, peso 700, cor secundária.
- Números de bloco: Archivo `font-stretch: 75%`, peso 900.

### Movimento
- Entrada: `translateY(16px)` → 0 com opacidade, em 0,7s `cubic-bezier(.2,.8,.2,1)`, atraso de 0,12s entre irmãos.
- A foto do cartão-destaque faz zoom até `scale(1.06)` em 12s, `alternate infinite`.
- Tudo desliga com `prefers-reduced-motion: reduce`.

### Regras gerais
- Nenhuma dependência nova.
- Nenhuma rota, regra de domínio ou formato de dado muda, exceto o campo novo `Settings.theme`.
- Os textos acessíveis (nomes de botões e rótulos) que os testes usam não mudam. Se um texto visível precisar mudar, o teste muda no mesmo commit, e o ledger registra uma Ruling.
- Textos do app em pt-BR.
- Commits no branch `feat/redesign`. Nada de push, merge ou deploy sem o Kevin pedir.
- Patches por script preservam o fim de linha do arquivo (o repo mistura LF e CRLF).

## Review Focus

1. **Contraste nos dois temas:**
   - texto branco sobre foto clara precisa do gradiente em cima e embaixo;
   - texto sobre o amarelo é sempre `#111`;
   - os mascotes não podem sumir sobre o fundo claro.
2. **Trocar o tema com o app aberto:** "Automático" reage na hora à mudança do iPhone (listener de `matchMedia`). O `theme-color` da barra de status acompanha.
3. **Treino sem exercícios ou com exercício customizado:** um exercício próprio tem `primary` de qualquer músculo. `templatePhoto` de um treino vazio cai na foto genérica, sem quebrar.
4. **Restaurar um backup antigo sem o campo `theme`:** o tema cai em "auto" pelo merge com `DEFAULT_SETTINGS`, e `applyTheme` é chamado após a importação.
5. **Offline:** as fotos entram no precache do PWA. Elas não podem ficar de fora do `globPatterns`.

---

### Task 1: Tema claro/escuro (fundação)

**Files:**
- Modify: `src/domain/types.ts` (Settings), `src/domain/settings.ts`, `src/styles/tokens.css`, `index.html`, `src/App.tsx`, `src/screens/team/Settings.tsx`
- Create: `src/ui/theme.ts`
- Test: `tests/ui/theme.test.tsx`

**Interfaces:**
- Produces:
  - `type ThemePref = 'auto' | 'light' | 'dark'` em `types.ts`;
  - `Settings.theme: ThemePref`, com padrão `'auto'`;
  - `applyTheme(pref: ThemePref): void` em `src/ui/theme.ts`. Ela define `document.documentElement.dataset.theme` como `'light'` ou `'dark'`, já resolvido, e atualiza `meta[name=theme-color]` para `#f2f2f7` ou `#000000`. Com `'auto'`, também assina `matchMedia('(prefers-color-scheme: dark)')` e troca de listener a cada chamada.
- Consumes: nada.

- [ ] **Step 1: Write the failing tests** em `tests/ui/theme.test.tsx`:
  - `applyTheme('dark')` → `document.documentElement.dataset.theme === 'dark'`, e o meta theme-color tem content `#000000`. Crie o meta no teste se o jsdom não tiver.
  - `applyTheme('auto')`, com `matchMedia` stubado em `matches: true` → `'dark'`. Disparar o change com `matches: false` → `'light'`.
  - `DEFAULT_SETTINGS.theme === 'auto'`.
  - UI: `renderAt('/time/ajustes')` → clicar no botão `{ name: 'Escuro' }` → `getSettings().theme === 'dark'` e `dataset.theme === 'dark'`. Os botões Automático/Claro/Escuro usam `aria-pressed`.
- [ ] **Step 2:** `npx vitest run tests/ui/theme.test.tsx` → FAIL (módulo inexistente).
- [ ] **Step 3: Implement.**
  - `tokens.css`: `:root` passa a ser o tema claro. `html[data-theme=dark]` sobrescreve os valores.
    - Mantém os nomes que o CSS atual usa: `--bg`, `--surface`, `--surface-2`, `--line`, `--text`, `--muted`, `--faint`, `--crimson*`, `--gold*`, `--water*`.
    - Adiciona `--card-shadow`, `--feat-shadow`, `--yellow`, `--blue`, `--ink-on-yellow`.
    - `color-scheme` acompanha o tema.
  - `index.html`: theme-color inicial `#f2f2f7`, e `apple-mobile-web-app-status-bar-style` = `default`.
  - `App.tsx`: no boot, junto com `setSoundEnabled`, chama `applyTheme(s.theme)`. O mesmo vale após importar backup, em `Settings.tsx:117`.
  - Settings: linha "Tema" com três botões em segmento.
- [ ] **Step 4:** a mesma linha do Step 2 → PASS. Depois `npm test` → todos verdes.
- [ ] **Step 5:** commit `feat(tema): claro/escuro com preferência em Ajustes`.

### Task 2: Fotos por grupo muscular

**Files:**
- Create: `public/photos/{peito,costas,pernas,ombros,bracos,abdomen,corpo,geral}.webp`, `public/photos/CREDITS.md`, `src/domain/photos.ts`
- Modify: `vite.config.ts` (`globPatterns` inclui `webp`, se ainda não incluir)
- Test: `tests/domain/photos.test.ts`

**Interfaces:**
- Produces:
  - `type PhotoId = 'peito'|'costas'|'pernas'|'ombros'|'bracos'|'abdomen'|'corpo'|'geral'`;
  - `photoFor(m: Muscle | undefined): PhotoId`, com este mapeamento:
    - peito → peito;
    - costas e trapézio → costas;
    - quadríceps, posterior, glúteos e panturrilha → pernas;
    - ombros → ombros;
    - bíceps, tríceps e antebraço → braços;
    - abdômen → abdomen;
    - undefined → geral.
  - `templatePhoto(items: { exerciseId: string }[], lib: Map<string, Exercise>): PhotoId`: o grupo que mais aparece entre os `primary`. Empate fica com o grupo do primeiro item. Lista vazia → `'geral'`.
  - `photoUrl(id: PhotoId): string` = `` `${import.meta.env.BASE_URL}photos/${id}.webp` ``.
  - A foto `'corpo'` fica reservada para "Treino livre", na Task 5.

- [ ] **Step 1: Write the failing tests:**
  - `photoFor('gluteos') === 'pernas'`;
  - `photoFor('trapezio') === 'costas'`;
  - `photoFor(undefined) === 'geral'`;
  - `templatePhoto` com 2 itens de peito e 1 de tríceps → `'peito'`;
  - empate com 1 de peito e 1 de costas, peito primeiro → `'peito'`;
  - `templatePhoto([], lib) === 'geral'`;
  - um id fora do `lib` é ignorado.
- [ ] **Step 2:** `npx vitest run tests/domain/photos.test.ts` → FAIL.
- [ ] **Step 3: Implement `photos.ts`. Baixe as 8 fotos** (autorizado pelo Kevin: Unsplash, pessoas permitidas).
  - Use `curl -L "https://images.unsplash.com/photo-<id>?w=800&q=70&fm=webp" -o public/photos/<nome>.webp`, cada uma com menos de 150 KB.
  - Escolha fotos de academia escuras ou contrastadas, que combinem com cada grupo.
  - Registre autor e link de cada uma em `CREDITS.md`.
- [ ] **Step 4:** PASS. Depois `npm run build` e confirme as 8 webp listadas no `dist/sw.js`, com `grep -c photos/ dist/sw.js` ≥ 8.
- [ ] **Step 5:** commit `feat(fotos): capas por grupo muscular (Unsplash)`.

### Task 3: Base visual — primitivas, tab bar e transições

**Files:**
- Modify: `src/styles/global.css` (seções base, tab bar, tiles, botões e campos, sheet, comuns), `src/ui/TabBar.tsx`, `src/ui/Bar.tsx` (só se precisar de classes)
- Test: `tests/ui/tabbar.test.tsx` (já existe e deve continuar verde)

**Interfaces:**
- Produces, em classes CSS que as tasks seguintes usam:
  - `.eyebrow`: data em caixa alta;
  - `.title`: 34px;
  - `.card`: branco, raio 22;
  - `.tile.yellow` / `.tile.blue` / `.tile.black` / `.tile.red`, com os números `.tile .v` estreitos;
  - `.rise`: animação de entrada, com `--i` para o atraso, `animation-delay: calc(var(--i, 0) * .12s)`;
  - `.btn`: pílula vermelha;
  - `.sheet` no tema.
- Tab bar: fixa embaixo, fundo translúcido (`var(--bar)` + `backdrop-filter: blur(20px)`) e borda superior fina. Ícone de 24px com rótulo de 10px embaixo, e a ativa em `--crimson`. As animações de ícone atuais (tab-pop etc.) ficam.
- `NavLink`s da TabBar ganham a prop `viewTransition`. Em `global.css` entram `::view-transition-old(root)` e `::view-transition-new(root)` com crossfade de 0,25s.

- [ ] **Step 1:** reescreva as seções base de `global.css` usando os tokens da Task 1. Remova o `.screen::before` (o brilho do tema antigo) e todo `rgba(...)` fixo pensado para o fundo roxo.
- [ ] **Step 2:** `npm test` → todos verdes. É só CSS e uma prop, e `tabbar.test` continua achando a navegação "Principal" com 5 links.
- [ ] **Step 3:** confira visualmente com `npm run dev -- --host`, nos dois temas. Hoje e Água devem estar legíveis, mesmo antes do redesenho delas.
- [ ] **Step 4:** commit `style: base visual App Store (tokens, tab bar, blocos, transições)`.

### Task 4: FeatureCard + Hoje

**Files:**
- Create: `src/ui/FeatureCard.tsx`
- Modify: `src/screens/today/Today.tsx`, `src/water/WaterCard.tsx` (só classes), `global.css` (seção "hoje")
- Test: `tests/ui/feature-card.test.tsx`, `tests/ui/today.test.tsx` (acrescentar)

**Interfaces:**
- Consumes: `photoUrl`, `templatePhoto` (Task 2) e as classes da Task 3.
- Produces: `FeatureCard({ photo?: PhotoId; eyebrow: string; title: string; meta?: ReactNode; action?: ReactNode; peek?: ReactNode; children?: ReactNode })`.
  - Com `photo`: fundo com a foto (div `aria-hidden`, `background-image`), gradiente e texto branco.
  - Sem `photo`: cartão vermelho `#E5163E`.
  - `peek` (a Faísca) é renderizado acima do canto superior direito, saindo do cartão.
  - Expõe `data-photo={photo ?? 'none'}` no elemento raiz, para os testes.

- [ ] **Step 1: Write the failing tests:**
  - FeatureCard com `photo="peito"` → o raiz tem `data-photo="peito"`, o título é um heading com o texto passado e a ação é renderizada.
  - Sem photo → `data-photo="none"`.
  - Today com a rotina do seed (o próximo treino é de peito) → `container.querySelector('[data-photo]')` não é `"none"`, e o botão "Começar" existe.
  - Today com `wipeAll` + onboarded sem templates → `data-photo="none"` e o botão "Montar rotina" existe.
- [ ] **Step 2:** `npx vitest run tests/ui/feature-card.test.tsx tests/ui/today.test.tsx` → FAIL.
- [ ] **Step 3: Implement.** Today, em ordem:
  1. Eyebrow com a data + título com a saudação, e a sequência como chip à direita.
  2. FeatureCard:
     - em andamento: foto do treino ativo, eyebrow "Em andamento", ação "Continuar";
     - próximo treino: `templatePhoto(next.items, lib)`, eyebrow "Hoje"/"Próximo", meta com o número de exercícios, ação "Começar" e o "Trocar";
     - sem rotina: vermelho, "Montar rotina".
  3. A Faísca vai como `peek`, e a fala dela (coachLine) aparece como `.bubble` logo abaixo do cartão.
  4. Linha de recap (inalterada).
  5. `.pair` com água em `.tile.blue` (Gota dentro) e peso em `.tile` branco.
  6. PR em `.tile.black` com a Pedra.
  7. Medalhas.

  As barras "goals" saem do topo: a mesma informação já está nos blocos. Ledger: Ruling, e ajuste o teste que dependia delas, se houver.

  Classe `.rise` com `--i` crescente em cada bloco.
- [ ] **Step 4:** a mesma linha do Step 2 → PASS. Depois `npm test` → verde.
- [ ] **Step 5:** commit `feat(hoje): cartão-destaque com foto e blocos coloridos`.

### Task 5: Treino — sessão, descanso e fim do treino

**Files:**
- Modify: `src/screens/train/Session.tsx`, `RestTimer.tsx`, `Summary.tsx`, `global.css` (seções "sessão", "descanso", "resumo")
- Test: `tests/ui/session.test.tsx` (acrescentar)

**Interfaces:**
- Consumes: `FeatureCard`, `photoFor`, `photoUrl`.
- Produces: `currentEntryIndex(entries: SessionEntry[]): number` em `Session.tsx`, exportada. É o primeiro exercício com alguma série `done === false`. Se todos estiverem feitos, o último.

- [ ] **Step 1: Write the failing tests:**
  - `currentEntryIndex` com o 1º exercício completo e o 2º parcial → `1`; com todos completos → `entries.length - 1`; com `[]` → `0`.
  - Sessão `?start=livre` → `[data-photo="corpo"]` presente e heading "Treino livre".
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implement.**
  - O topo da sessão vira FeatureCard: foto do exercício atual (`photoFor(lib.get(e.exerciseId)?.primary)`), ou `'corpo'` no treino livre sem exercícios. Eyebrow "Exercício N de M" e título com o nome do treino, que mantém o heading que os testes procuram.
  - Séries em cartões brancos; o check fica vermelho quando concluído.
  - Descanso (RestTimer) num bloco amarelo com o número estreito grande.
  - Summary: tela vermelha cheia, os três mascotes comemorando, título "Treino concluído" grande estreito em caixa alta (o texto atual, se diferente, mantém o nome acessível) e stats em blocos `rgba(0,0,0,.18)`.
- [ ] **Step 4:** PASS. Depois `npm test` → verde.
- [ ] **Step 5:** commit `feat(treino): sessão com foto, descanso amarelo, fim do treino vermelho`.

### Task 6: Treino — rotina, editor, picker, histórico, anilhas

**Files:**
- Modify: `global.css` (seções "rotina", "editor", "picker", "histórico", "anilhas") e, só onde precisar de classe, `Routine.tsx`, `TemplateEditor.tsx`, `ExercisePicker.tsx`, `History.tsx`, `PlateCalc.tsx`
- Test: os existentes (`routine.test.tsx`, `history.test.tsx`, `hardening.test.tsx`)

- [ ] **Step 1:** restyle.
  - Rotina: cada treino é um cartão branco com miniatura de 44px da `templatePhoto` à esquerda, e o próximo treino tem contorno vermelho.
  - Editor e picker: cartões brancos e chips de músculo em pílula.
  - Histórico: lista em cartões.
  - Anilhas: blocos coloridos.
- [ ] **Step 2:** `npm test` → verde. Confira visualmente nos dois temas.
- [ ] **Step 3:** commit `style(treino): rotina, editor, picker, histórico`.

### Task 7: Água e Progresso

**Files:**
- Modify: `global.css` (seções "água", "progresso", "mapa", "peso", "fotos", "calendário", "gráfico", "retrospectiva"); `Water.tsx`, `Progress.tsx`, `ExerciseChart.tsx`, `MuscleMap.tsx`, `BodyWeight.tsx`, `Calendar.tsx`, `Photos.tsx`, `Wrapped.tsx`, só onde precisar de classe ou cor; `src/share/cards.ts` (cores)
- Test: os existentes (`water*.test.tsx`, `progress.test.tsx`, `muscle-map.test.tsx`, `insights.test.tsx`, `share.test.tsx`)

- [ ] **Step 1:** restyle.
  - Água: o hero é um bloco azul grande, com o líquido e a Gota.
  - Progresso:
    - gráfico de volume em cartão branco, com barras que crescem;
    - recordes em cartões coloridos com rolagem horizontal (`scroll-snap-type: x mandatory`);
    - mapa muscular com a escala vermelha sobre a silhueta cinza clara (no escuro, cinza `#2c2c2e`);
    - selo Platô em amarelo.
  - Wrapped e cards de compartilhar: fundo vermelho e blocos, como a tela de fim do treino.
  - Gráficos SVG usam `currentColor` e tokens no lugar de cores do tema antigo.
- [ ] **Step 2:** `npm test` → verde. Confira visualmente nos dois temas.
- [ ] **Step 3:** commit `style: água e progresso no visual novo`.

### Task 8: Time, boas-vindas e o resto

**Files:**
- Modify: `global.css` (seções "time", "medalhas", "ajustes", "pesquisa", "plano", "demo", "erro", "loading"); `Team.tsx`, `Medals.tsx`, `Settings.tsx`, `Survey.tsx`, `YourPlan.tsx`, `DemoBanner.tsx`, `ErrorBoundary.tsx`, `LoadingScreen.tsx`, `Dev.tsx`, só onde precisar de classe; `public/favicon.svg`, sem mudança
- Test: os existentes (`team.test.tsx`, `survey.test.tsx`, `app.test.tsx`)

- [ ] **Step 1:** restyle.
  - Time: a Faísca grande num FeatureCard vermelho, os estágios em cartões e Gota/Pedra em blocos azul e preto.
  - Ajustes: lista agrupada estilo iOS, em cartões brancos com separadores e switches verdes do iOS (`#34c759`).
  - Pesquisa e Seu plano: opções em cartões grandes, com a selecionada em contorno vermelho.
  - Banner demo em amarelo.
- [ ] **Step 2:** `npm test` → verde. Depois `npm run build` → sem erros nem avisos de tipo.
- [ ] **Step 3:** busque cores do tema antigo que tenham sobrado: `grep -rnE "#0E0A12|#17111D|#211929|#A193AA|rgba\(5,2,8" src` → nenhum resultado.
- [ ] **Step 4:** commit `style: time, ajustes, boas-vindas e telas auxiliares`.

### Task 9: Conferência final com o Kevin

- [ ] **Step 1:** `npm run dev -- --host`. Passe ao Kevin a URL da rede (`http://<ip-do-pc>:5173/`) para ele abrir no iPhone, e a URL local para o PC.
- [ ] **Step 2:** percorra com ele, nos dois temas: Hoje, sessão, fim do treino, água, progresso, time, ajustes e pesquisa. Anote os ajustes pedidos e aplique.
- [ ] **Step 3:** só com o "pode publicar" explícito dele, siga superpowers:finishing-a-development-branch (merge em main + push dispara o deploy).
