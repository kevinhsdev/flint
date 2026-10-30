# Flint — documento de design

Data: 2026-10-30 · Status: aprovado (2026-10-30)

## 1. O que é e por quê

Flint é um app pessoal de academia para iPhone, feito como PWA (app web instalável). O dono (Kevin) quer acompanhar toda a sua trajetória na academia — treinos, cargas, repetições, recordes, água, peso, IMC — com o nível de acabamento dos apps nº 1 da App Store. O diferencial é um **time de três mascotes animados** que motivam o uso dentro do app e por notificações.

O app também é **peça de portfólio**: vai para o GitHub (repositório público) e para um post no LinkedIn com link de demo. Por isso, quem abrir o link precisa ver o app "cheio" e bonito em segundos.

Nome: "Flint" (pederneira — a pedra que solta faísca). Escolhido "por enquanto": o nome deve estar centralizado num único lugar (manifest, título, textos) para trocar fácil.

## 2. Objetivos

- Registrar treinos de uma rotina criada pelo próprio usuário, com carga e reps por série, o mais rápido possível no meio do treino.
- Mostrar progresso: PRs automáticos, gráficos por exercício, calendário de constância, mapa muscular, peso/IMC, fotos de progresso.
- Controle diário de água com a "água natural" do mockup.
- Medalhas diárias e evolução do mascote Faísca pela constância.
- Notificações dos mascotes no iPhone, mesmo com o app fechado.
- Funcionar 100% offline na academia (exceto notificações).
- Visual premium fiel ao mockup aprovado.

## 3. Não-objetivos

- Nutrição/calorias (recusado explicitamente).
- Contas, login, sincronização na nuvem, social, ranking.
- App nativo / App Store. Integração com Apple Saúde (PWA não acessa).
- Planos de treino prontos ou IA de treino.

## 4. Anti-objetivos (seria fracasso mesmo funcionando)

- Qualquer tema de coração/batimento/eletrocardiograma (nome antigo "Pulse" foi escolhido só pelo som; o usuário rejeitou isso duas vezes).
- Água com cara artificial (onda CSS em loop). Tem que ser a simulação com molas do mockup.
- Mascotes com animação "de loop de CSS" ou corpo com tronco/membros emendados — o usuário rejeitou várias versões até chegar na aprovada.
- Visual de template genérico / "cara de IA".
- Perder dados do usuário.
- Mascotes chatos: notificações demais.

## 5. Plataforma e restrições (decididas com o usuário)

- **PWA para iPhone.** Instalada via Safari → "Adicionar à Tela de Início". Notificações push exigem iOS 16.4+ e o app instalado na tela inicial; a permissão só pode ser pedida a partir de um toque do usuário.
- **Dados só no aparelho** (IndexedDB). Sem servidor de dados. Pedir `navigator.storage.persist()`. Backup: exportar/importar um arquivo JSON (fotos incluídas ou opcionais — ver §12).
- **Hospedagem: GitHub Pages** (HTTPS grátis), no repositório público do projeto.
- **Notificações: Cloudflare Workers** (conta grátis que o usuário vai criar; o builder configura o resto). O Worker guarda apenas a inscrição de push e os horários/lembretes — nunca treinos, cargas ou fotos.
- **Abertura:** tela de carregamento com os mascotes → direto no app. Sem onboarding/cadastro/tutorial.
- **Idioma:** interface em português do Brasil. Unidades: kg e ml.
- **Público da demo:** qualquer pessoa no link do LinkedIn, provavelmente no celular ou no desktop. No desktop, o app deve aparecer centralizado com largura de celular (não precisa layout desktop próprio).

## 6. Identidade visual (aprovada)

**Logo oficial (fornecida pelo usuário):** chama com olhos bravos. Arquivos: `brand/flint-logo.svg` (ícone do app: chama carmesim `#E5163E` sobre cinza escuro `#1C1B20`) e `brand/flint-mark.svg` (só a marca, fundo transparente). Original: `download.jpg`. Usar esses arquivos tal como estão para ícone do app, favicon, splash e README.

Referência viva: `docs/reference/mockup-v16.html` (abrir no navegador) e `docs/reference/mascots.js`. O app final deve parecer com esse mockup.

- **Paleta "Sangue Real":** fundo `#0E0A12`, superfície `#17111D`, superfície 2 `#211929`, linhas `rgba(255,235,245,.07)`, texto `#F5F0F7`, texto secundário `#A193AA`, apagado `#6E6177`, carmesim `#E5163E` (hi `#FF4D6D`, lo `#8E0B26`), ouro `#F5B700` (hi `#FFE38A`), água `#3B82F6` (hi `#8CB8FF`). Cada métrica tem sua cor: treino = carmesim, água = azul, conquistas/PR = ouro.
- **Fonte:** Archivo (variável, larguras 62–125, pesos 400–900), auto-hospedada para funcionar offline.
- **Movimento:** springs interrompíveis, resposta no toque (pointer-down), `:active` com leve scale, respeitar `prefers-reduced-motion` (mascotes ficam calmos, sem squash exagerado).
- **Água:** card com canvas de superfície por molas acopladas, bolhas, cáusticas e brilho do menisco; tocar soma água com respingo (já implementado no mockup).

### 6.1 Mascotes (aprovados)

Três personagens 2D em SVG com rig 2.5D, implementados em `docs/reference/mascots.js` (portar, não redesenhar):

- **Faísca** (fogo) — mascote da constância. Evolui Faísca → Chama → Fogueira → Forja; estágios bloqueados aparecem como silhueta. Murcha/fica triste quando o usuário some.
- **Gota** (água) — cuida da hidratação; fica com sede quando a meta atrasa.
- **Pedra** (pedra low-poly com brotinho) — cuida das cargas e recordes; comemora PR fazendo muque.

Estilo do corpo aprovado: **o elemento é o próprio corpo** (estilo Kirby/Slime Rancher), com bracinhos "nub" e pés em feijão que saem de trás da silhueta. Sem tronco.

Comportamentos já existentes no rig: olhar em volta, piscar, dormir após inatividade, cócegas no toque, arrastar e arremessar (fica tonto), carinho esfregando, dançar, acenar, comemorar, bravo, triste, falar com balão (boca sincronizada), especiais (Faísca: boxe, polichinelo; Gota: pegar gotinha, balançar; Pedra: rosca direta, muque).

Os estágios Chama/Fogueira/Forja da Faísca ainda não têm arte: o builder cria variações da Faísca (maior, mais línguas de fogo, cores mais intensas, Forja com brilho dourado) no mesmo sistema procedural. **Essa arte passa por aprovação do usuário logo no início da construção** (mockup no navegador), antes de a demo depender dela.

## 7. Estrutura do app

Barra de abas inferior com 4 abas + tela de carregamento.

### 7.0 Carregamento
Os três mascotes aparecem com uma animação curta (≤1,5 s) e o logo Flint, enquanto o banco local abre. Depois, direto na aba Hoje.

### 7.1 Hoje
Como a tela "Hoje" do mockup:
- Faísca como coach com balão de fala contextual ("Hoje é treino D — costas e bíceps. Bora?").
- Metas do dia em barrinhas: Treino, Água, (check-in de peso opcional).
- CTA grande do próximo treino da sequência, com opção de trocar.
- Card de água interativo (toque = +250 ml; segurar = escolher quantidade: 150/250/500 ml ou personalizado; desfazer o último).
- Card de peso (último registro + tendência) e card de PR recente com a Pedra.
- Medalhas do dia.

### 7.2 Treino
- **Rotina:** lista de treinos criados pelo usuário (ex.: A a F). Criar, renomear, reordenar, duplicar, excluir. Cada treino tem nome e lista ordenada de exercícios; cada exercício tem nº de séries, faixa de reps (ex.: 8–12) e descanso (s).
- **Biblioteca de exercícios** embutida (~80–120 exercícios comuns em português, cada um com grupo muscular primário/secundário e equipamento). O usuário pode criar exercícios próprios.
- **Sequência:** o app sugere o treino seguinte ao último feito (rotação A→B→…→F→A). O usuário pode escolher outro ou fazer **treino livre** (começa vazio).
- **Treino em andamento** (como no mockup): tabela de séries com "última vez" ao lado, campo atual em destaque, marcar série concluída com um toque, timer de descanso automático flutuante (−15/+15/Pular), sugestão de sobrecarga progressiva da Pedra ("Bateu 12 reps em todas — tenta 2,5 kg a mais"), calculadora de anilhas, PR detectado na hora (dourado + Pedra comemora). Adicionar/remover/trocar exercício durante o treino. O treino em andamento sobrevive a fechar o app.
- **Finalizar:** resumo (duração, volume total, PRs, músculos trabalhados) com celebração dos mascotes.
- **Histórico:** lista de treinos feitos; abrir, editar e excluir um treino passado.

### 7.3 Progresso
- Calendário de constância (mapa de calor por dia).
- Por exercício: gráfico de carga máxima / 1RM estimado (Epley) / volume ao longo do tempo, e lista de PRs.
- Mapa muscular (frente/costas) colorido pelo volume da semana.
- Peso corporal: registrar, gráfico com tendência; IMC calculado com altura (altura informada uma vez em Ajustes) e faixa da OMS.
- Fotos de progresso: tirar/escolher foto, data, comparar duas lado a lado. Guardadas localmente.

### 7.4 Time
Como a tela "Time" do mockup: Faísca grande com barra de XP e trilha de evolução, Gota e Pedra, galeria de medalhas conquistadas, e Ajustes (ver 7.5). Os mascotes aqui são interativos (cócegas, arremessar etc.).

### 7.5 Ajustes (dentro de Time)
Altura, meta de água, dias e horário de treino, notificações (ligar/desligar por mascote, horários, horário de silêncio), backup (exportar/importar), "Começar do zero" (apaga tudo, com confirmação), sobre/créditos com link do GitHub.

## 8. Regras de jogo (decisões do builder/designer — ver §13)

- **Meta de água:** padrão 35 ml × peso corporal (arredondado a 250 ml); editável.
- **Agenda de treino:** o usuário escolhe os **dias da semana em que treina** e um horário (padrão seg–sex, 18h). A meta semanal = nº de dias escolhidos. Treinar num dia de folga também conta; faltar num dia marcado não "pula" a rotação (o próximo treino continua sendo o seguinte ao último feito). Nos dados de exemplo: seg–sáb.
- **Constância:** a "sequência" da Faísca conta **semanas** em que a meta foi batida. Dias de descanso não quebram nada.
- **XP da Faísca:** treino concluído +100, PR +25 cada, meta de água do dia +20, medalha +10. Estágios: Faísca (0), Chama (1.500), Fogueira (5.000), Forja (12.000). o humor (feliz/triste) é o que reflete sumiço: 2+ dias marcados seguidos sem treinar → Faísca triste e murcha até o próximo treino.
- **Medalhas diárias** (no máximo uma de cada por dia): Treino do dia, Hidratado (meta de água), Recorde (≥1 PR), Dia completo (treino + água). **Marcos** (uma vez): 1º treino, 10/50/100/250 treinos, 4/12/26/52 semanas de meta batida, volume acumulado (10 t, 100 t, 1.000 t), 7 dias seguidos de água.
- **PR:** maior carga para um nº de reps já feito, ou maior 1RM estimado (Epley: carga × (1 + reps/30)) por exercício. Só séries concluídas contam.
- **Sobrecarga progressiva:** se todas as séries de um exercício atingiram o topo da faixa de reps no último treino, sugerir +2,5 kg (ou +1 kg/+2 kg para exercícios com halteres/máquina pequena — o builder define por equipamento); senão, sugerir repetir a carga e buscar +1 rep.

- **Tudo é derivado do histórico:** XP, PRs, medalhas, marcos e sequências são recalculados a partir dos registros (treinos, água, peso). Editar ou excluir um treino passado atualiza tudo; não existe "conquista órfã". Todas as regras e números desta seção ficam num único módulo de configuração.

## 9. Notificações (Cloudflare Worker)

- O app, ao ativar notificações (toque do usuário, só no app instalado), cria a inscrição Web Push (VAPID) e envia ao Worker: inscrição, fuso horário, preferências (lembretes de água e de treino, horários, silêncio) e um pequeno "estado" atualizado sempre que o app é usado: nome do próximo treino, se já treinou hoje, ml de água de hoje e meta. Nada além disso sai do aparelho.
- O Worker roda num cron (ex.: a cada 15 min), decide quem deve receber o quê e envia o push com a fala do mascote.
- Tipos: **Gota** — lembretes de água em horários espaçados, só se a meta estiver atrasada; **Faísca** — "hoje é treino D" no horário de treino escolhido, e "saudade" após dias sem treinar; **Pedra** — lembrete na véspera de um treino com sugestão de aumento de carga (opcional).
- Limite: no máximo 4 notificações por dia, nunca no horário de silêncio (padrão 22h–8h).
- Falas com variações para não repetir, no tom dos mascotes (curtas, divertidas, PT-BR).
- No Safari sem estar instalado, a tela de notificações explica como adicionar à tela de início.
- **Demo × uso real:** enquanto o app estiver com dados de exemplo, não dá para ativar notificações — a tela explica "Comece do zero e instale para ativar". Assim só usuários reais (como o Kevin) se inscrevem, e nenhuma notificação se baseia em dados falsos.
- O estado só é enviado ao Worker quando muda (e no máximo a cada poucos minutos), para caber com folga no plano grátis da Cloudflare; preferir D1 a KV pelo limite de escritas.

## 10. Dados de exemplo (demo)

- Na **primeira abertura**, o app vem preenchido com dados de exemplo: rotina A–F, ~6 semanas de treinos com cargas subindo de forma realista, PRs, água diária, registros de peso, medalhas e XP (Faísca já em "Chama").
- Aviso discreto no topo: "Dados de exemplo · Começar do zero". "Começar do zero" apaga tudo (com confirmação) e leva ao app vazio com estados vazios bem desenhados (o mascote convida a criar a primeira rotina).
- Datas dos dados de exemplo são relativas a hoje (sempre parecem recentes).
- Sem fotos reais de pessoas nos dados de exemplo (usar ilustração/placeholder ou nenhuma foto).

## 11. Portfólio

- README no GitHub com GIFs dos mascotes, screenshots, link da demo, stack e decisões técnicas interessantes (água por molas, rig 2.5D dos mascotes, push sem servidor de dados).
- Código limpo e organizado, porque recrutadores vão ler.
- Imagem de preview para o link (Open Graph) bonita, para o post do LinkedIn.

## 12. Deixado para o builder

- Stack do front-end (sugestão: Vite + React + TypeScript, IndexedDB com Dexie, vite-plugin-pwa; gráficos e mapa muscular em SVG próprio para manter o visual), estrutura de pastas, testes.
- Como portar `mascots.js` para o app (mantendo o comportamento).
- Conteúdo exato da biblioteca de exercícios e do mapa muscular.
- Splash do iOS e tamanhos do ícone, a partir da logo oficial.
- Formato do backup e se fotos entram nele (pode ser opcional, por tamanho).
- Detalhes do Worker (armazenamento KV/D1, biblioteca de Web Push compatível com Workers).
- Pequenos ajustes de UX dentro do espírito do mockup.

## 13. Decisões tomadas pelo designer (não pelo usuário) — conferir

1. Demo com dados de exemplo + botão "Começar do zero" no mesmo link (em vez de um link separado de demo).
2. Usuário escolhe dias da semana + horário de treino (escolhido pelo designer a pedido do usuário); constância medida em semanas com a meta batida.
3. Valores de XP, limiares de evolução e lista de medalhas da §8.
4. Meta de água padrão 35 ml/kg.
5. 4 abas: Hoje, Treino, Progresso, Time (Ajustes dentro de Time).
6. No máximo 4 notificações/dia, silêncio padrão 22h–8h.
7. O Worker recebe um pequeno estado (próximo treino, água de hoje) para personalizar as falas.
8. No desktop, app centralizado com largura de celular.
