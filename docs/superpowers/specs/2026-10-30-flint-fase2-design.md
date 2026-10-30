# Flint — fase 2: documento de design

Base: `docs/superpowers/specs/2026-10-30-flint-design.md` (fase 1, entregue no branch `feat/app`). Tudo o que não é dito aqui continua valendo de lá: PWA iPhone, dados locais (IndexedDB/Dexie), GitHub Pages, paleta Sangue Real, fundo escuro, sem nutrição, sem conta.

## 1. Intenção e porquê

O Kevin quer um app pelo qual as pessoas **pagariam**. O motivo de pagar, nas palavras dele: **design confortável e bonito, junto com utilidade**. Os dois juntos, não um ou outro.

Referências que ele usa: **Apple Fitness, Duolingo, Revolut**. Lidas assim (e confirmadas por ele):
- **Apple Fitness:** números grandes, anéis e gráficos que enchem com animação macia, cor viva só nos dados.
- **Duolingo:** mascote com personalidade que reage, comemoração exagerada, sequência que dá vontade de manter, onboarding de perguntas rápidas, uma por tela.
- **Revolut:** acabamento caro, transições sem corte, tab bar flutuante de vidro, resposta física a cada toque.

A fase 2 deixa o Flint nesse cruzamento.

## 2. Objetivos

1. Mascotes ligados à logo (**já feito e aprovado**, ver §4).
2. Pesquisa inicial que já monta o treino pelo objetivo e a meta de água pelo peso, seguida de uma sequência de telas "seu plano".
3. Tela exclusiva de água.
4. Barra de navegação moderna, animada e suave.
5. Corpo anatômico refeito.
6. Seis recursos premium (§9), todos aprovados pelo Kevin ("todas").

## 3. Não-objetivos e anti-objetivos

- **Não-objetivos:** cobrança/paywall real (o app continua gratuito; "premium" é nível de qualidade); conta, nuvem, nutrição; notificações (continuam no plano 2, Cloudflare Worker).
- **Anti-objetivos (fracasso mesmo funcionando):**
  - onboarding longo ou chato: mais de ~90 s para responder, ou perguntas sem uso visível depois;
  - plano gerado que um praticante experiente acharia errado (volume absurdo, exercício perigoso para iniciante);
  - animação que atrasa uma ação repetida (registrar série, beber água);
  - visual "template": precisa parecer feito à mão, coerente com a logo.

## 4. Mascotes (feito, aprovado)

Commits `84e685c`, `2d2657f`, `5e1aa0a`. Backup do estilo anterior em `docs/reference/mascots-v1/`. Comparação em `docs/reference/mascots-v2.html`.

- **Faísca:** silhueta da logo (escudo com ponta embaixo e 3 pontas em cima), cor chapada, sombra de duas cores, olhos brancos recortados como na logo. Rosto em repouso igual à logo, sem boca; a boca só aparece com emoção. Os estágios mantêm sempre 3 pontas: crescem em altura e mudam de cor (laranja → vermelho da logo → roxo → azul).
- **Gota:** água ciano com linha d'água ondulando dentro do corpo e brilho branco. Não pode se confundir com a Forja azul.
- **Pedra:** seixo liso com musgo no topo, rachadura e brotinho. Versão "B", escolhida pelo Kevin.
- A física, os comportamentos e as interações da fase 1 continuam.

## 5. Pesquisa inicial (onboarding)

Isto substitui a decisão da fase 1 de "sem onboarding", por pedido do Kevin.

**Quando aparece:** na primeira abertura, logo após a tela de carregamento.
- O `boot()` deixa de carregar a demo sozinho: sem ajustes salvos, abre a pesquisa. A demo só é carregada por "Só quero explorar".
- Quem está na demo (`demo: true`) vê, no banner da demo, o botão "Montar meu plano", que abre a pesquisa. "Começar do zero" também leva à pesquisa.
- Ajustes ganham `onboarded: true` ao terminar a pesquisa ou ao escolher "montar eu mesmo".
- O app ainda não foi publicado, então não há instalações antigas para migrar.

**Refazer pesquisa (em Ajustes):** antes de começar, uma confirmação explica o que acontece. Os treinos atuais são **arquivados**, não apagados (o histórico continua intacto), e os novos entram no lugar. A meta de água volta para automática pelo novo peso. Peso e altura informados viram um novo registro de peso, e a altura é atualizada. Na última tela existe "Manter minha rotina", que atualiza só as metas e os ajustes, sem gerar treinos.

**Formato:** uma pergunta por tela, no estilo Duolingo, com a Faísca conduzindo e reagindo às respostas. Barra de progresso no topo e "voltar" sempre disponível. Respostas por toque em cartões grandes; números (peso, altura, idade) em campos com teclado numérico.

**Perguntas (nesta ordem):**
1. Objetivo: ganhar massa, emagrecer, condicionamento/saúde, força.
2. Experiência: começando (< 6 meses), intermediário (6 m–2 anos), avançado (> 2 anos).
3. Dias por semana disponíveis (2 a 6) e quais dias. Alimenta `trainDays` (sequência, humor dos mascotes, lembretes). Os dias **não** ficam presos a treinos específicos: o próximo treino continua sendo o seguinte da sequência, como na fase 1.
4. Tempo por treino: 30, 45, 60 ou 90 min.
5. Onde treina, filtrando os exercícios pelo equipamento:
   - academia completa: tudo;
   - academia básica: barra, halteres, máquinas e peso corporal, sem polia;
   - em casa: halteres e peso corporal.
6. Já tem um treino? "Tenho meu treino, quero montar eu mesmo" pula a geração e leva para a rotina vazia.
7. Peso, altura e idade. O peso gera a meta de água e o primeiro registro de peso. Peso e altura dão o IMC. A idade aparece no diagnóstico e, a partir de 50 anos, faz a geração preferir máquinas e reduzir uma série nos compostos. Sexo não é perguntado: nenhuma fórmula do app usaria essa resposta.
8. Horário em que costuma treinar. Alimenta `trainTime`, que o plano 2 usa nos lembretes.

**Saída na tela de entrada da pesquisa:** um link discreto "Só quero explorar" carrega os dados de exemplo da fase 1 (demo), como hoje.

**"Seu plano" (sequência após a última resposta):** 4 a 5 telas animadas, com a Faísca narrando e "continuar" em cada uma:
1. **Diagnóstico:** IMC com a faixa explicada sem julgamento, num medidor animado.
2. **Sua estratégia:** a divisão gerada (ex.: "ABC, 3x por semana, foco em hipertrofia") e por quê, em uma frase, com a lista dos treinos.
3. **Sua água:** meta calculada (35 ml/kg, arredondada a 250 ml, regra da fase 1), com a Gota apresentando e um copo enchendo até a meta.
4. **O que esperar:** marcos de 4, 8 e 12 semanas, adequados ao objetivo, e como o app ajuda (sobrecarga progressiva, recordes, sequência).
5. **Começar:** botão "Começar meu primeiro treino" (abre a sessão do treino A) e um secundário "Ver minha rotina".

**Geração do treino:** regras locais e determinísticas (sem IA), a partir de objetivo, experiência, dias, tempo e equipamento, usando a biblioteca de exercícios existente. Os treinos gerados são templates comuns, editáveis como qualquer outro.
- Divisão por dias: 2 → Full body A/B; 3 → ABC (ou Full body A/B/C para iniciante); 4 → Superior/Inferior ×2; 5 → ABCDE; 6 → PPL ×2.
- Faixa de reps e descanso por objetivo: massa 8–12, 90 s; força 3–6, 180 s; emagrecer/condicionamento 12–15, 60 s.
- Número de exercícios pelo tempo: 30 min ≈ 4, 45 ≈ 5, 60 ≈ 6, 90 ≈ 7–8. Séries: iniciante 3, demais 3–4.
- Iniciante: prioriza máquinas e exercícios guiados; evita levantamentos técnicos (terra convencional, agachamento livre pesado) como primeiro exercício.
- Respeita o equipamento: em casa, só halteres e peso corporal.

## 6. Tela de água

Nova rota e nova aba (§7).
- **Copo grande no centro**, enchendo com a mesma simulação de onda do card de água (`src/water/waterSim.ts`), proporcional à meta. Mostra ml bebidos / meta e a porcentagem.
- **Adicionar:** botões rápidos 150, 250 e 500 ml, mais valor livre. Desfazer o último. Lista dos registros do dia com horário, cada um removível.
- **Meta diária editável:** automática (pelo peso) ou manual, com o mesmo campo numérico da fase 1.
- **Frequência:** mapa de calor igual ao de treino (`Calendar`), com dia batido, parcial e sem registro. Mostra também a sequência de dias batendo a meta.
- **Gota** ao lado, reagindo: comemora ao bater a meta, fica triste quando está atrasada (regra `expectedWaterFraction` da fase 1).
- O card de água em Hoje continua (toque soma 250) e ganha atalho para esta tela.

## 7. Barra de navegação

- **Abas (5):** Hoje, Treino, Água, Progresso, Time.
- **Visual:** pílula flutuante acima da área segura inferior, com vidro fosco (`backdrop-filter`) sobre o conteúdo e borda sutil.
- **Movimento:**
  - o destaque da aba ativa desliza com mola até o ícone tocado;
  - cada ícone tem uma micro-animação própria ao ser tocado (halteres giram, gráfico sobe, gota balança, chama tremula);
  - feedback imediato no toque (escala no press);
  - a barra recua ao rolar para baixo e volta ao rolar para cima ou ao parar.
- Respeita `prefers-reduced-motion`. Some durante a sessão de treino, como hoje.

## 8. Corpo anatômico

Substitui o `MuscleMap` de elipses.
- Silhueta anatômica, frente e costas, com cada grupo desenhado no formato real e separado por linhas finas. Cobre todos os 12 músculos do modelo (`MUSCLES` em `src/domain/types.ts`).
- Intensidade pelo volume da semana (séries feitas), em escala da paleta (base neutra → carmesim → mais claro no máximo).
- Tocar num músculo mostra o nome e as séries da semana. A legenda explica a escala.
- Os SVGs são desenhados à mão, sem biblioteca, coerentes com o estilo chapado dos mascotes.

## 9. Recursos premium (todos aprovados)

1. **Retrospectiva mensal ("Wrapped"):** sequência de telas animadas no início de cada mês (e sob demanda em Progresso) com volume total, treinos, recordes, maior sequência, água e músculo mais treinado. A última tela gera uma imagem 1080×1920 para os Stories.
2. **Cartão de recorde:** ao bater um recorde (na sessão ou no resumo), botão "Compartilhar" gera uma imagem com o mascote, o exercício, a carga × reps e a data. Usa a Web Share API, com fallback para download.
3. **Aquecimento automático:** no primeiro exercício composto do treino (e sob demanda em qualquer exercício com carga), sugere séries de aquecimento pela carga de trabalho: barra vazia ×10, 50% ×8, 75% ×3, arredondadas pelas anilhas. Elas entram como séries marcadas "aquecimento" e não contam para volume, recordes ou XP.
4. **Detector de platô:** se a melhor série (1RM estimado) de um exercício não sobe em 3 semanas com pelo menos 3 sessões, a Pedra avisa no exercício e em Progresso e sugere deload (−10% por uma semana) ou trocar por uma variação.
5. **Previsão de meta:** no gráfico do exercício, a pessoa define uma carga-alvo. O app projeta pela tendência recente e mostra "no ritmo atual, ~N semanas", com a linha tracejada no gráfico. Se não houver dados suficientes ou a tendência for plana, diz isso em vez de inventar.
6. **Sons sutis:** check de série, fogo ao bater recorde, gota ao beber, comemoração ao terminar o treino. Gerados com Web Audio (sem arquivos pesados), volume baixo, desligáveis em Ajustes. Ligados por padrão.

## 10. Restrições

- PWA no iPhone: sem vibração (o iOS não suporta `navigator.vibrate`), sem widgets e sem Live Activities. O feedback físico é visual e sonoro.
- **Offline:** tudo continua funcionando sem rede, inclusive as imagens geradas (canvas local).
- **Sem novas dependências pesadas.** Animações em CSS e na engine de molas existente.
- **Qualidade da fase 1:** TDD, testes Vitest, TS estrito, `localDay()` para datas.
- **Dados novos:**
  - respostas da pesquisa nos ajustes;
  - séries de aquecimento com uma flag na `SetLog`;
  - alvos de previsão por exercício;
  - preferência de som.
  - O backup JSON inclui tudo isso, mantém compatibilidade com backups da fase 1 e sobe a versão do backup.

## 11. Deixado para o builder

- Desenho exato dos SVGs do corpo e dos ícones animados (coerentes com §8 e §4).
- Escolha de exercícios por slot na geração, dentro das regras de §5.
- Curvas, durações e molas das animações, dentro das referências de §1.
- Layout interno das telas de "Seu plano", da tela de água e da retrospectiva.
- Ordem de implementação (sugestão: barra de navegação → tela de água → corpo → pesquisa e plano → aquecimento, platô e previsão → cartão, retrospectiva e sons).

## 12. Decisões que eu (Claude) tomei — conferir

- **Água como 5ª aba** na barra, em vez de só um atalho no card. Custo se errado: uma aba a menos para remover.
- **"Só quero explorar"** na entrada da pesquisa mantém a demo da fase 1 acessível, porque o README promete dados de exemplo.
- **Quem já tem dados não vê a pesquisa;** ela pode ser refeita em Ajustes.
- **Geração de treino por regras locais, sem IA:** é offline e previsível.
- As tabelas de §5 (divisão, reps, descanso, número de exercícios) e de §9.3 (aquecimento) e o critério de 3 semanas do platô são escolhas minhas, baseadas em prática comum de musculação.
- **Retrospectiva no início de cada mês;** recordes e retrospectiva compartilhados como imagem 1080×1920.
- **Sons ligados por padrão.**
- **A pesquisa substitui o carregamento automático da demo;** a demo fica atrás de "Só quero explorar".
- **Refazer a pesquisa arquiva os treinos antigos,** em vez de apagar ou somar.
- **Sexo não é perguntado.** A idade fica, com uso visível (diagnóstico e escolha de exercícios a partir de 50 anos).
- **Dias da semana não ficam presos a treinos;** o próximo treino segue a sequência.
- **Academia básica:** barra, halteres, máquinas e peso corporal, sem polia.
- **Sem paywall:** "premium" é qualidade, não cobrança. Se você quiser cobrar de verdade, isso é um projeto à parte (pagamento, conta, servidor).
