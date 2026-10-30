# Flint (notificações dos mascotes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer os mascotes mandarem notificações push no iPhone com o app fechado, usando um Cloudflare Worker que só guarda a inscrição, as preferências e um mini-estado.

**Architecture:** O PWA (plano 1, já pronto) cria a inscrição Web Push (VAPID) e envia ao Worker a inscrição, as preferências e um estado pequeno. Um cron do Worker roda a cada 15 min e chama `decide()`, uma função pura e testada, para cada inscrição; quando há o que mandar, envia o push. O service worker do app mostra a notificação com o ícone do mascote.

**Tech Stack:**
- Cloudflare Workers + D1 + Cron Triggers, wrangler
- TypeScript, Vitest
- Biblioteca de Web Push compatível com Workers (WebCrypto, sem Node `crypto`), por exemplo `@block65/webcrypto-web-push`
- vite-plugin-pwa no modo `injectManifest`

**Spec:** `docs/superpowers/specs/2026-10-30-flint-design.md` §9. Depende de `docs/superpowers/plans/2026-10-30-flint-app.md` estar concluído.

## Global Constraints

- O Worker guarda apenas: a inscrição, o fuso (IANA), as preferências e o estado `{ nextWorkout: string | null; trainedToday: boolean; waterMl: number; waterGoalMl: number; missedTrainDays: number; trainDays: number[]; trainTime: string; day: string }`. Nunca guarda cargas, exercícios, fotos ou peso.
- No máximo 4 notificações por dia por inscrição (`RULES.notif.maxPerDay`).
- Silêncio padrão das 22:00 às 08:00, no fuso do usuário. O intervalo pode atravessar a meia-noite.
- Não dá para ativar notificações com `settings.demo === true`. O app mostra "Comece do zero e instale para ativar".
- Fora do modo standalone (Safari sem instalar), o app mostra o passo a passo de "Adicionar à Tela de Início" e não pede permissão.
- A permissão só é pedida a partir de um toque.
- O estado só é enviado quando muda, com no máximo 1 envio a cada 5 min (debounce). Usar D1, não KV.
- O CORS do Worker aceita só a origem do GitHub Pages do app e `http://localhost:5173`.
- Falas em pt-BR, curtas, no tom dos mascotes, com pelo menos 5 variações por tipo e sem repetir a mesma fala duas vezes seguidas.

## Review Focus

1. **Inscrição expirada:** quando o push volta 404/410 (o usuário removeu o app), a linha é apagada e o cron continua para os outros (Task 2).
2. **Silêncio atravessando a meia-noite:** com o intervalo 22:00–08:00, às 23:30 e às 07:45 nada é enviado (Task 1).
3. **Cron sobreposto ou repetido** no mesmo slot de 15 min: a mesma notificação não sai duas vezes (Task 2).
4. **Estado velho:** se o último estado é de ontem (`state.day ≠ hoje` no fuso), o Worker não assume "não bebeu água" nem "não treinou" e só manda o lembrete genérico de treino (Task 1).
5. **Usuário desativa as notificações** no app ou no iOS: o app chama `DELETE` e a linha some. Uma inscrição recusada pelo navegador deixa a UI em "desativado", sem travar (Task 3).

---

### Task 1: Decisão pura do que enviar

**Files:**
- Create: `worker/src/decide.ts`, `worker/src/lines.ts`, `worker/package.json`, `worker/tsconfig.json`
- Test: `worker/test/decide.test.ts`

**Interfaces:**
- `type Kind = 'water' | 'train' | 'miss' | 'pedra'`
- `interface Sub { id; tz; prefs: { water: boolean; train: boolean; pedra: boolean; quietStart: string; quietEnd: string }; state: State; sentDay: string; sentCount: number; sentKeys: string[]; lastLine: Record<Kind, number> }`
- `decide(sub: Sub, now: Date): { kind: Kind; key: string; title: string; body: string; mascot: 'faisca' | 'gota' | 'pedra' } | null`
  - `key` é único por dia e por slot (ex.: `2026-10-30:water:14`), para deduplicar.
  - Regras, todas no fuso `sub.tz`:
    - **water (Gota):** nos slots 10, 12, 14, 16, 18 e 20h, se `prefs.water` estiver ligado e `waterMl < waterGoalMl × (hora − 8) / 14`.
    - **train (Faísca):** no `trainTime`, se hoje for dia marcado e `!trainedToday`. O texto usa `nextWorkout`.
    - **miss (Faísca):** às 19h, se `missedTrainDays >= 2`.
    - **pedra (Pedra):** às 20:30 da véspera de um dia marcado, se `prefs.pedra` estiver ligado.
    - Nenhuma notificação no silêncio. Nada se `sentCount >= 4` ou se `key ∈ sentKeys`.
  - Se houver mais de uma candidata no mesmo slot, vale a ordem `train > miss > water > pedra`.
- `pickLine(kind, last: number, rand: () => number): { index: number; title: string; body: string }` em `lines.ts`. Exemplos: Gota "Tô com sede 💧" / "Faltam ${x} ml pra meta". Faísca "Hoje é treino ${n}!" / "Bora, a chama não se acende sozinha 🔥".

- [ ] **Step 1: Write the failing tests**

```ts
const base = sub({ tz: 'America/Sao_Paulo', state: { day: '2026-10-30', waterMl: 500, waterGoalMl: 2750, trainedToday: false, nextWorkout: 'D', trainDays: [1,2,3,4,5,6], trainTime: '18:00', missedTrainDays: 0 } });
test('Gota avisa às 14h se atrasado', () => { expect(decide(base, at('2026-10-30T14:00', base.tz))!.kind).toBe('water'); });
test('silêncio atravessando meia-noite', () => {
  expect(decide(base, at('2026-10-30T23:30', base.tz))).toBeNull();
  expect(decide(base, at('2026-10-31T07:45', base.tz))).toBeNull();
});
test('máximo 4 por dia e sem repetir key', () => {
  expect(decide({ ...base, sentCount: 4, sentDay: '2026-10-30' }, at('2026-10-30T14:00', base.tz))).toBeNull();
  expect(decide({ ...base, sentKeys: ['2026-10-30:water:14'], sentDay: '2026-10-30' }, at('2026-10-30T14:05', base.tz))).toBeNull();
});
test('treino às 18h vence água e cita o treino', () => {
  const n = decide(base, at('2026-10-30T18:00', base.tz))!; expect(n.kind).toBe('train'); expect(n.body).toContain('D');
});
test('estado de ontem: sem água/miss, treino genérico', () => {
  const old = { ...base, state: { ...base.state, day: '2026-10-29' } };
  expect(decide(old, at('2026-10-30T14:00', old.tz))).toBeNull();
  expect(decide(old, at('2026-10-30T18:00', old.tz))!.body).not.toContain('D');
});
```

- [ ] **Step 2:** Rodar `cd worker && npx vitest run`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. A hora local vem de `Intl.DateTimeFormat(…, { timeZone })`. Um slot casa quando `now` está dentro dos 15 min seguintes ao horário do slot.
- [ ] **Step 4:** Rodar o mesmo comando. Esperado: PASS.
- [ ] **Step 5: Commit** `feat(push): pure notification decision and mascot lines`

---

### Task 2: Worker — API, D1, cron e envio

**Files:**
- Create: `worker/wrangler.toml`, `worker/schema.sql`, `worker/src/index.ts`, `worker/src/send.ts`
- Test: `worker/test/index.test.ts` (com `@cloudflare/vitest-pool-workers` ou um mock de `env.DB`)

**Interfaces:**
- D1 `subs`:
  ```sql
  CREATE TABLE subs (
    id TEXT PRIMARY KEY, endpoint TEXT UNIQUE, keys TEXT, tz TEXT, prefs TEXT, state TEXT,
    sent_day TEXT, sent_count INTEGER DEFAULT 0, sent_keys TEXT DEFAULT '[]',
    last_line TEXT DEFAULT '{}', updated_at INTEGER
  );
  ```
- Rotas, todas JSON:
  - `POST /subscribe {subscription, tz, prefs, state}` → `{ id }`. É um upsert por endpoint. O `id` é um `crypto.randomUUID()` e funciona como segredo.
  - `PUT /subs/:id/state {state}` e `PUT /subs/:id/prefs {prefs}` → 204.
  - `DELETE /subs/:id` → 204.
  - Rate limit simples: no máximo 30 requisições/min por `id`.
- `scheduled()`, com cron `*/15 * * * *`:
  - para cada linha, chama `decide()`;
  - se houver resultado, `sendPush(sub, payload, env)` envia um payload `{ title, body, mascot, url: '/#/' }`;
  - depois atualiza `sent_*` e `last_line`;
  - em 404/410, apaga a linha;
  - erros de uma linha não param o loop.
- `sendPush(row, payload, env): Promise<number>` devolve o status HTTP. Os segredos `VAPID_PUBLIC`, `VAPID_PRIVATE` e `VAPID_SUBJECT` (`mailto:` do dono) vêm por `wrangler secret`.

- [ ] **Step 1: Write the failing tests**

```ts
test('410 apaga a inscrição e segue para a próxima', async () => { /* 2 linhas; sendPush mock: 410, 201 → 1 linha resta, 2ª enviada */ });
test('cron duas vezes no mesmo slot envia uma vez', async () => { /* scheduled() x2 → sendPush chamado 1x */ });
test('CORS recusa origem estranha', async () => { /* Origin: https://evil.example → 403 */ });
```

- [ ] **Step 2:** Rodar `cd worker && npx vitest run`. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Rodar o mesmo comando. Esperado: PASS.
- [ ] **Step 5: Commit** `feat(push): Cloudflare Worker with D1, cron and web push`

---

### Task 3: App — ativar notificações, sincronizar estado e service worker

**Files:**
- Create: `src/push/push.ts`, `src/sw.ts`, `public/notif/faisca.png`, `public/notif/gota.png`, `public/notif/pedra.png`
- Modify: `vite.config.ts` (para `strategies: 'injectManifest'`, `srcDir: 'src'`, `filename: 'sw.ts'`), `src/screens/team/Settings.tsx` (a seção Notificações substitui o "Em breve"), `src/db/repo.ts` (chama `queueStateSync()` após gravações)
- Test: `tests/push/push.test.ts`

**Interfaces:**
- `pushAvailability(settings): 'demo' | 'not-installed' | 'unsupported' | 'denied' | 'ready'`
  - `'not-installed'` quando `!matchMedia('(display-mode: standalone)').matches && !navigator.standalone`.
- `enableNotifications(): Promise<'on' | 'denied' | 'error'>`
  - pede `Notification.requestPermission()` e faz `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC })`;
  - faz `POST /subscribe` e grava `kv.pushId`.
- `disableNotifications()` faz `unsubscribe` + `DELETE` e limpa `kv.pushId`.
- `buildState(data, today): State` reutiliza `nextTemplate`, `waterGoalMl` e `missedTrainDays` (plano 1, Tasks 4–5).
- `queueStateSync()` usa debounce de 5 min e só envia se o JSON mudou desde o último envio (`kv.lastState`).
- `sw.ts` faz o precache do Workbox e trata:
  - `push`: `showNotification(title, { body, icon: '/notif/${mascot}.png', badge, data: { url } })`;
  - `notificationclick`: foca ou abre o app.
- `Settings`, seção Notificações, conforme `pushAvailability`:
  - `demo`: mostra "Comece do zero e instale para ativar";
  - `not-installed`: passo a passo com ícone de Compartilhar → "Adicionar à Tela de Início";
  - `ready`: chaves para Gota, Faísca e Pedra e campos de silêncio. As mudanças vão por `PUT /prefs`.
- O endereço do Worker vem de `VITE_PUSH_URL`, e a chave pública de `VITE_VAPID_PUBLIC`.

- [ ] **Step 1: Write the failing tests**

```ts
test('demo bloqueia; fora do standalone pede instalação', () => {
  expect(pushAvailability({ ...settings, demo: true })).toBe('demo');
  expect(pushAvailability({ ...settings, demo: false })).toBe('not-installed'); // jsdom não é standalone
});
test('state sync só envia quando muda', async () => { /* fetch mock; 2 chamadas com mesmo estado → 1 fetch */ });
test('buildState: treino de hoje e água', async () => { /* seed → nextWorkout letra, waterGoalMl 35ml/kg */ });
```

- [ ] **Step 2:** Rodar `npx vitest run tests/push`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. Gerar os 3 PNGs (192 px) dos mascotes com screenshot headless da página `/#/dev` (Task 6 do plano 1).
- [ ] **Step 4:** Rodar `npx vitest run` e `npm run build`. Esperado: PASS e build ok.
- [ ] **Step 5: Commit** `feat(push): enable notifications, state sync and push service worker`

---

### Task 4: Publicar o Worker e testar no iPhone

- [ ] **Step 1:** **Pedir ao usuário** para criar a conta grátis na Cloudflare e rodar `! npx wrangler login` no prompt (o login é interativo).
- [ ] **Step 2:** Rodar `npx web-push generate-vapid-keys` (ou a função equivalente da lib escolhida). Gravar os segredos com `wrangler secret put VAPID_PUBLIC`, `VAPID_PRIVATE` e `VAPID_SUBJECT`.
- [ ] **Step 3:** Rodar `wrangler d1 create flint-push`, depois `wrangler d1 execute flint-push --remote --file schema.sql` e `wrangler deploy`. Anotar a URL.
- [ ] **Step 4:** Colocar `VITE_PUSH_URL` e `VITE_VAPID_PUBLIC` como variáveis do workflow do Pages (não são segredos) e fazer redeploy do app.
- [ ] **Step 5:** Teste real com o usuário no iPhone:
  1. Começar do zero.
  2. Adicionar à Tela de Início.
  3. Ativar as notificações.
  4. Disparar uma notificação de teste por uma rota `POST /subs/:id/test`, que só funciona com o header `X-Admin` igual ao segredo `ADMIN_KEY`.
  5. Confirmar que a notificação chega com o app fechado e que tocar nela abre o app.
- [ ] **Step 6:** Acrescentar ao README a seção "Notificações sem servidor de dados".
- [ ] **Step 7: Commit** `docs(push): deploy notes and README section`
