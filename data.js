// Plano B: cada exercício tem "alts" (fotos em img/alt-<id>-0.jpg / -1.jpg).
// Fotos em img/<id>-0.jpg (início) e img/<id>-1.jpg (fim), de free-exercise-db (domínio público).
// Plano de treino: 2x/semana, 2 séries por exercício, adaptado a hérnias e anca.
const WORKOUTS = {
  A: {
    name: "Treino A",
    short: "Treino A",
    warmup: "<strong>Aquecimento:</strong> 5 min de bicicleta. Nos três primeiros exercícios: 1 série a 50% × 6 e 1 a 70% × 3 (valores calculados em cada cartão).",
    day: "Segunda-feira",
    exercises: [
      {
        id: "leg-press",
        name: "Leg press",
        compound: true,
        sets: [
          { label: "Top set", min: 8, max: 10 },
          { label: "Back-off (−10%)", min: 10, max: 12, backoff: true },
        ],
        cues: [
          "Pés altos e afastados na plataforma.",
          "Descer só até ~90° no joelho (flexão da anca limitada).",
          "Lombar sempre colada ao encosto — se descolar, desceste demais.",
        ],
        video: "leg press feet high wide technique",
        alts: [
          { id: "leg-extension", name: "Extensão de pernas na máquina", q: "leg extension machine technique",
            cues: ["Costas encostadas, pega nas pegas laterais.", "Sobe controlado e desce em 2–3 s.", "Se tiveres tempo, junta 2 séries de curl femoral sentado."] },
          { id: "seated-leg-curl", name: "Curl femoral sentado", q: "seated leg curl technique",
            cues: ["Lombar encostada, almofada por cima dos joelhos bem presa.", "Puxa os calcanhares para baixo sem levantar a anca do banco."] },
        ],
        photoNote: "Na foto a descida vai mais fundo do que deves: para a ~90° no joelho.",
      },
      {
        id: "puxada",
        name: "Puxada à frente (pega neutra ou supinada)",
        compound: true,
        sets: [
          { label: "Top set", min: 8, max: 10 },
          { label: "Back-off", min: 10, max: 12, backoff: true },
        ],
        cues: [
          "Sempre à frente, nunca atrás da nuca.",
          "Peito alto, puxar os cotovelos para baixo e para trás.",
          "Sem balanço do tronco.",
        ],
        video: "neutral grip lat pulldown technique",
        alts: [
          { id: "one-arm-pulldown", name: "Puxada unilateral na polia, sentado", q: "single arm lat pulldown seated technique",
            cues: ["Puxa à frente, cotovelo em direção à anca.", "Tronco quieto, sem rodar a coluna."] },
          { id: "straight-arm-pulldown", name: "Pullover na polia com corda", q: "straight arm rope pulldown technique",
            cues: ["Inclina ligeiramente o tronco a partir da anca, lombar neutra.", "Braços quase esticados, leva a corda até às coxas."] },
        ],
      },
      {
        id: "shoulder-press",
        name: "Shoulder press em máquina (sentado, pega neutra)",
        compound: true,
        sets: [
          { label: "Top set", min: 8, max: 10 },
          { label: "Back-off", min: 10, max: 12, backoff: true },
        ],
        cues: [
          "Costas apoiadas no encosto durante toda a série.",
          "Pega neutra para poupar ombros e cervical.",
          "Se o pescoço reclamar, troca por landmine press.",
        ],
        video: "machine shoulder press neutral grip",
        alts: [
          { id: "db-shoulder-press", name: "Press com halteres sentado, com encosto", q: "seated dumbbell shoulder press neutral grip",
            cues: ["Banco quase vertical, costas e cabeça apoiadas.", "Pega neutra (palmas viradas uma para a outra).", "Não bloqueies os cotovelos em cima."] },
          { id: "cable-shoulder-press", name: "Press de ombros na polia, sentado", q: "seated cable shoulder press",
            cues: ["Banco com encosto entre as duas polias.", "Empurra para cima e ligeiramente para a frente."] },
          { id: "landmine", name: "Landmine press", q: "landmine press technique", photo: false,
            cues: ["Ajoelhado ou em pé, barra apoiada no canto.", "Empurra na diagonal: poupa o pescoço e os ombros."] },
        ],
      },
      {
        id: "triceps-corda",
        name: "Tríceps na polia com corda",
        sets: [
          { label: "Série 1", min: 10, max: 15 },
          { label: "Série 2", min: 10, max: 15 },
        ],
        cues: [
          "Cotovelos fixos junto ao corpo.",
          "Abrir a corda no fim do movimento.",
          "Nada de extensões acima da cabeça (cervical).",
        ],
        video: "tricep rope pushdown technique",
        alts: [
          { id: "vbar-pushdown", name: "Tríceps na polia com barra em V", q: "v bar tricep pushdown technique",
            cues: ["Cotovelos fixos junto ao corpo.", "Estica completamente sem inclinar o tronco."] },
          { id: "dip-machine", name: "Tríceps na máquina de dips, sentado", q: "seated dip machine triceps",
            cues: ["Costas apoiadas, ombros para baixo.", "Desce só até os cotovelos a ~90°."] },
        ],
      },
      {
        id: "gemeos",
        name: "Gémeos sentado ou no leg press",
        sets: [
          { label: "Série 1", min: 12, max: 15 },
          { label: "Série 2", min: 12, max: 15 },
        ],
        cues: [
          "Evitar a máquina de pé: carrega a coluna pelos ombros.",
          "Amplitude completa, pausa de 1 s em baixo.",
        ],
        video: "seated calf raise technique",
        alts: [
          { id: "calf-leg-press", name: "Gémeos no leg press", q: "calf press on leg press machine",
            cues: ["Só a ponta dos pés na plataforma, joelhos quase esticados.", "Mantém os travões de segurança à mão."] },
          { id: "db-seated-calf", name: "Gémeos sentado com halter", q: "seated dumbbell calf raise",
            cues: ["Ponta do pé num disco ou degrau, halter sobre o joelho.", "Uma perna de cada vez, amplitude completa."] },
        ],
      },
      {
        id: "face-pull",
        name: "Face pull",
        sets: [
          { label: "Série 1", min: 12, max: 15 },
          { label: "Série 2", min: 12, max: 15 },
        ],
        cues: [
          "Polia à altura da cara, puxar a corda em direção à testa.",
          "Rodar os ombros para fora no final.",
        ],
        video: "face pull cable technique",
        alts: [
          { id: "reverse-fly", name: "Reverse fly na máquina (pec deck invertido)", q: "reverse pec deck fly technique",
            cues: ["Peito encostado ao apoio.", "Abre os braços sem encolher os ombros."] },
          { id: "rear-delt-row", name: "Remada alta para deltóide posterior na polia", q: "cable rope rear delt row",
            cues: ["Polia à altura do peito, corda.", "Puxa com os cotovelos abertos, em direção à cara."] },
        ],
      },
    ],
  },
  B: {
    name: "Treino B",
    short: "Treino B",
    warmup: "<strong>Aquecimento:</strong> 5 min de bicicleta. Nos três primeiros exercícios: 1 série a 50% × 6 e 1 a 70% × 3 (valores calculados em cada cartão).",
    day: "Sexta-feira",
    exercises: [
      {
        id: "supino-inclinado",
        name: "Supino inclinado em máquina",
        compound: true,
        sets: [
          { label: "Top set", min: 8, max: 10 },
          { label: "Back-off", min: 10, max: 12, backoff: true },
        ],
        cues: [
          "Costas e cabeça apoiadas.",
          "Omoplatas retraídas, descer controlado.",
        ],
        video: "incline chest press machine technique",
        alts: [
          { id: "incline-db-press", name: "Supino inclinado com halteres", q: "incline dumbbell press technique",
            cues: ["Banco a 30°, costas e cabeça apoiadas.", "Pega neutra se os ombros reclamarem."] },
          { id: "machine-chest-press", name: "Chest press em máquina (plano)", q: "machine chest press technique",
            cues: ["Costas apoiadas, pegas à altura do peito.", "Omoplatas para trás durante toda a série."] },
        ],
      },
      {
        id: "hip-thrust",
        name: "Hip thrust em máquina",
        compound: true,
        sets: [
          { label: "Top set", min: 8, max: 10 },
          { label: "Back-off", min: 10, max: 12, backoff: true },
        ],
        cues: [
          "Substitui o romanian deadlift.",
          "Sem arquear a lombar no topo — fechar com o glúteo, costelas para baixo.",
          "Queixo ligeiramente recolhido.",
        ],
        video: "hip thrust machine technique",
        alts: [
          { id: "glute-bridge", name: "Glute bridge no chão", q: "glute bridge technique",
            cues: ["Sem peso, com halter ou barra almofadada na anca.", "Sobe até a anca ficar alinhada, sem arquear a lombar.", "Pausa de 1–2 s em cima."] },
          { id: "cable-kickback", name: "Kickback de glúteo na polia", q: "cable glute kickback technique",
            cues: ["Mãos na máquina, abdominal ativo.", "Leva a perna para trás só até onde a lombar não arqueia.", "Uma perna de cada vez; regista o peso de uma perna."] },
        ],
        photoNote: "Foto com barra; na máquina o movimento é o mesmo.",
      },
      {
        id: "remada",
        name: "Remada em máquina com apoio no peito / remada sentado na polia",
        compound: true,
        sets: [
          { label: "Top set", min: 8, max: 10 },
          { label: "Back-off", min: 10, max: 12, backoff: true },
        ],
        cues: [
          "Peito apoiado (ou tronco estável na polia).",
          "Puxar com os cotovelos, sem balançar a lombar.",
        ],
        video: "chest supported machine row technique",
        alts: [
          { id: "machine-row", name: "Remada em máquina (outra máquina)", q: "seated machine row technique",
            cues: ["Peito no apoio, se a máquina tiver.", "Puxa com os cotovelos, sem balançar."] },
          { id: "db-row", name: "Remada unilateral com halter, apoiado no banco", q: "one arm dumbbell row bench supported",
            cues: ["Mão e joelho no banco, coluna neutra e quieta.", "Puxa o halter em direção à anca."] },
        ],
      },
      {
        id: "elevacoes-laterais",
        name: "Elevações laterais (polia ou halteres, sentado)",
        sets: [
          { label: "Série 1", min: 12, max: 15 },
          { label: "Série 2", min: 12, max: 15 },
        ],
        cues: [
          "Sentado para tirar a lombar da equação.",
          "Subir até à linha dos ombros, sem encolher.",
        ],
        video: "seated dumbbell lateral raise technique",
        alts: [
          { id: "cable-lateral", name: "Elevação lateral na polia, sentado", q: "seated cable lateral raise",
            cues: ["Um braço de cada vez se só houver uma polia.", "Sobe até à linha do ombro."] },
          { id: "lying-lateral", name: "Elevação lateral deitado de lado", q: "lying one arm lateral raise",
            cues: ["Deitado de lado num banco, coluna totalmente apoiada.", "Halter leve, movimento lento."] },
        ],
      },
      {
        id: "curl",
        name: "Curl de bíceps em máquina ou banco Scott",
        sets: [
          { label: "Série 1", min: 10, max: 15 },
          { label: "Série 2", min: 10, max: 15 },
        ],
        cues: ["Braço apoiado, sem impulso.", "Descida controlada de 2–3 s."],
        video: "preacher curl machine technique",
        alts: [
          { id: "machine-curl", name: "Curl de bíceps em máquina", q: "machine bicep curl technique",
            cues: ["Braços apoiados, costas direitas.", "Descida controlada de 2–3 s."] },
          { id: "incline-curl", name: "Curl com halteres em banco inclinado", q: "incline dumbbell curl technique",
            cues: ["Costas e cabeça apoiadas no banco.", "Cotovelos parados, sem impulso."] },
        ],
      },
      {
        id: "pallof",
        name: "Pallof press (anti-rotação)",
        perSide: true,
        sets: [
          { label: "Série 1 (por lado)", min: 10, max: 12 },
          { label: "Série 2 (por lado)", min: 10, max: 12 },
        ],
        cues: [
          "Substitui os crunches (sem flexão da coluna com carga).",
          "Braços estendidos à frente do peito, resistir à rotação.",
          "Abdominal e glúteos contraídos, coluna neutra.",
        ],
        video: "pallof press technique",
        alts: [
          { id: "dead-bug", name: "Dead bug", q: "dead bug exercise technique",
            cues: ["Lombar colada ao chão durante todo o movimento.", "Estende braço e perna opostos devagar."] },
          { id: "side-bridge", name: "Side plank", q: "side plank technique",
            cues: ["Corpo em linha reta, apoio no antebraço.", "Regista os segundos em vez das reps."] },
        ],
      },
    ],
  },
};

// ---------- Casa: kettlebell 6 kg + 12 kg e halteres de 9 kg ----------
// Sem swings, cleans, snatches nem peso morto (carga e flexão da lombar), sem press de pé
// e sem nada atrás da nuca. Cargas leves: progride com reps, tempo (descida em 3 s) e unilateral.
const HOME_WARMUP =
  "<strong>Aquecimento (5 min):</strong> marcha no lugar, 10 glute bridges sem peso, 10 bird dogs por lado e 1 série leve dos dois primeiros exercícios. Descansa 60–90 s entre séries.";
const sets3 = (min, max, unit = "reps") => [1, 2, 3].map((n) => ({ label: `Série ${n}`, min, max, unit }));

WORKOUTS.KA = {
  name: "Casa 1 · Kettlebell",
  short: "Casa 1",
  day: "Segunda-feira",
  home: true,
  warmup: HOME_WARMUP,
  exercises: [
    {
      id: "kb-goblet", name: "Goblet squat para uma cadeira", compound: true, home: true,
      load: "KB 12 kg", sets: sets3(10, 15),
      cues: ["Kettlebell de 12 kg agarrada pelos lados, junto ao peito.", "Senta-te devagar (3 s) numa cadeira firme e levanta sem balanço.", "A cadeira limita a descida: anca e joelho a ~90°.", "Tronco direito, lombar neutra."],
      next: "Passa a fazer uma pausa de 2 s sentado sem relaxar, ou usa os dois halteres de 9 kg aos lados (18 kg).",
      photoNote: "Na foto desce mais fundo do que deves: usa a cadeira para parar a ~90°.",
      video: "goblet box squat kettlebell",
    },
    {
      id: "kb-floor-press", name: "Floor press com halteres", compound: true, home: true,
      load: "2 × 9 kg", sets: sets3(10, 15),
      cues: ["Deitado no chão, joelhos fletidos, lombar apoiada.", "Desce até os cotovelos tocarem no chão, pausa 1 s.", "Pega neutra (palmas viradas uma para a outra) se os ombros reclamarem."],
      next: "Passa a 1 braço de cada vez com a kettlebell de 12 kg (o outro braço ajuda a estabilizar).",
      video: "dumbbell floor press technique",
    },
    {
      id: "kb-row", name: "Remada unilateral apoiada", compound: true, home: true, perSide: true,
      load: "KB 12 kg", sets: sets3(10, 15, "reps por lado"),
      cues: ["Mão e joelho numa cadeira ou sofá, coluna neutra e quieta.", "Puxa a kettlebell em direção à anca, sem rodar o tronco.", "Desce em 2–3 s."],
      next: "Faz pausa de 2 s em cima e descida em 4 s.",
      video: "supported one arm kettlebell row",
    },
    {
      id: "kb-split-squat", name: "Split squat com halteres", home: true, perSide: true,
      load: "2 × 9 kg ou 2 × KB", sets: sets3(8, 12, "reps por lado"),
      cues: ["Pé de trás no chão (não elevado), passada média.", "Desce na vertical até o joelho da frente a ~90°.", "Tronco direito, segura-te a uma parede se precisares."],
      next: "Desce em 3 s e faz pausa de 1 s em baixo.",
      photoNote: "Na foto o pé de trás está elevado: faz com os dois pés no chão.",
      video: "dumbbell split squat technique",
    },
    {
      id: "kb-hammer", name: "Curl martelo sentado", home: true,
      load: "2 × 9 kg", sets: sets3(10, 15),
      cues: ["Sentado com as costas apoiadas.", "Cotovelos parados, sem balanço.", "Descida de 2–3 s."],
      next: "Alterna os braços com pausa de 1 s em cima.",
      photoNote: "Na foto em pé; sentado poupa a lombar.",
      video: "seated hammer curl dumbbell",
    },
    {
      id: "kb-dead-bug", name: "Dead bug com kettlebell", home: true, perSide: true,
      load: "KB 6 kg", sets: sets3(6, 10, "reps por lado"),
      cues: ["Kettlebell de 6 kg segura com os braços esticados por cima do peito.", "Lombar colada ao chão durante todo o movimento.", "Estende uma perna de cada vez, devagar."],
      next: "Estende braço e perna opostos ao mesmo tempo.",
      video: "dead bug kettlebell",
    },
  ],
};

WORKOUTS.KB = {
  name: "Casa 2 · Kettlebell",
  short: "Casa 2",
  day: "Sexta-feira",
  home: true,
  warmup: HOME_WARMUP,
  exercises: [
    {
      id: "kb-bridge", name: "Glute bridge com kettlebell", compound: true, home: true,
      load: "KB 12 kg", sets: sets3(12, 20),
      cues: ["Deitado, kettlebell de 12 kg em cima da anca (com uma toalha).", "Sobe até a anca ficar alinhada, sem arquear a lombar.", "Pausa de 2 s em cima."],
      next: "Passa a uma perna de cada vez (como na foto), primeiro sem peso.",
      photoNote: "A foto mostra a versão a uma perna: é a progressão.",
      video: "kettlebell glute bridge",
    },
    {
      id: "kb-press", name: "Press de ombros sentado, costas apoiadas", compound: true, home: true,
      load: "2 × 9 kg ou KB 6 kg", sets: sets3(8, 12),
      cues: ["Sentado com as costas encostadas a uma parede ou cadeira.", "Pega neutra, cotovelos ligeiramente à frente.", "Se o pescoço reclamar, faz só um braço de cada vez com a de 6 kg."],
      next: "Descida em 3 s e pausa de 1 s em baixo.",
      photoNote: "Na foto sem encosto: em casa encosta as costas.",
      video: "seated dumbbell shoulder press neutral grip",
    },
    {
      id: "kb-stepup", name: "Step-up para degrau baixo", compound: true, home: true, perSide: true,
      load: "2 × 9 kg", sets: sets3(8, 12, "reps por lado"),
      cues: ["Degrau ou caixa de 20–30 cm: o joelho não deve passar dos 90°.", "Empurra com o calcanhar da perna de cima, sem impulso da de baixo.", "Desce devagar."],
      next: "Desce em 3 s, ou segura a kettlebell de 12 kg em vez dos halteres.",
      photoNote: "Na foto o banco é alto: em casa usa um degrau baixo.",
      video: "dumbbell step up low step",
    },
    {
      id: "kb-pullover", name: "Pullover deitado no chão", home: true,
      load: "KB 12 kg ou halter 9 kg", sets: sets3(10, 15),
      cues: ["Deitado no chão, joelhos fletidos, lombar apoiada.", "Braços quase esticados, leva o peso para trás só até onde a lombar não arqueia.", "Puxa de volta até por cima do peito."],
      next: "Descida em 4 s.",
      photoNote: "Na foto num banco: no chão o movimento é mais curto e mais seguro.",
      video: "floor kettlebell pullover",
    },
    {
      id: "kb-lateral", name: "Elevação lateral sentado", home: true, perSide: true,
      load: "KB 6 kg", sets: sets3(10, 15, "reps por lado"),
      cues: ["Sentado, um braço de cada vez com a kettlebell de 6 kg.", "Sobe até à linha do ombro, sem encolher.", "Descida lenta."],
      next: "Faz 1 s de pausa em cima.",
      video: "seated one arm lateral raise",
    },
    {
      id: "kb-carry", name: "Suitcase carry (transporte com um braço)", home: true, perSide: true,
      load: "KB 12 kg", sets: sets3(30, 45, "s por lado"),
      cues: ["Kettlebell de 12 kg numa mão, de lado. Regista os segundos nas reps.", "Caminha devagar com o tronco direito: não deixes inclinar para o lado do peso.", "Ombros para baixo, abdominal ativo."],
      next: "Usa um halter de 9 kg em cada mão e depois volta à de 12 kg com mais tempo.",
      photoNote: "Na foto com dois pesos; aqui é com um, para treinar o core contra a inclinação.",
      video: "suitcase carry kettlebell",
    },
  ],
};

// Programas: o plano da semana usa o treino do programa ativo em cada "slot".
const PROGRAMS = {
  gym: { label: "Ginásio", workouts: ["A", "B"] },
  home: { label: "Casa · kettlebell", workouts: ["KA", "KB"] },
};

// Semana: 0 = domingo … 6 = sábado (como Date.getDay()).
const STEPS_GOAL = 11000;
const FLOW_CHANNEL = "https://www.youtube.com/@strengthsidefollowalongs";
const FLOW_START = "2026-10-26"; // primeira quarta-feira conta a partir desta semana

// Vídeos de Animal Flow para iniciantes, por ordem de progressão.
// "weeks" = semanas do programa em que o vídeo é o recomendado.
const FLOW_VIDEOS = [
  { id: "IePHbQBJriQ", title: "ABC's of Animal Flow for beginners", level: "Fundamentos", length: "Técnica", weeks: [1, 2],
    note: "Aprende as posições base (beast, crab, ape) com calma antes de fazer sequências." },
  { id: "fNuhrglhdgI", title: "Animal Flow Workout for Beginners · Follow Along 1", level: "Iniciante", length: "30 s / 10 s", weeks: [3, 4],
    note: "Blocos de 30 s de trabalho e 10 s de descanso. Faz as pausas que precisares." },
  { id: "q-FYsDLuyEM", title: "Animal Flow Workout · 20 min Beginner Friendly", level: "Iniciante", length: "20 min", weeks: [5, 6],
    note: "Sem material. Ritmo controlado, foca-te na técnica." },
  { id: "r1YqcnkpLG8", title: "Follow Along Animal Flow Routine · 20 min for Beginners", level: "Iniciante", length: "20 min", weeks: [7, 8],
    note: "Explica cada movimento passo a passo." },
  { id: "wWnrgF3VA9w", title: "Animal Flow 30-Minute Beginner Level Class", level: "Aula completa", length: "30 min", weeks: [9],
    note: "Aula guiada com preparação dos pulsos, movimentos base e um flow para iniciantes." },
];
const WEEK = [
  { dow: 1, type: "workout", slot: 0 },
  { dow: 2, type: "steps", title: `${STEPS_GOAL.toLocaleString("pt-PT")} passos` },
  { dow: 3, type: "flow", title: "Animal Flow" },
  { dow: 4, type: "steps", title: `${STEPS_GOAL.toLocaleString("pt-PT")} passos` },
  { dow: 5, type: "workout", slot: 1 },
  { dow: 6, type: "rest", title: "Descanso" },
  { dow: 0, type: "rest", title: "Descanso" },
];

// Proteína: atalhos com valores aproximados (g de proteína por porção).
const PROTEIN_FACTORS = [1.6, 1.8, 2.0, 2.2]; // g por kg de peso corporal
const PROTEIN_FOODS = [
  { name: "1 ovo", g: 6 },
  { name: "1 clara de ovo", g: 4 },
  { name: "Claras líquidas (100 ml)", g: 11 },
  { name: "Iogurte proteico / skyr (150 g)", g: 15 },
  { name: "Frango ou peru (100 g cozinhado)", g: 30 },
  { name: "Peixe (150 g cozinhado)", g: 30 },
  { name: "Carne vermelha (100 g cozinhada)", g: 26 },
  { name: "Atum em lata (1 lata escorrida)", g: 20 },
  { name: "Whey (1 dose, 30 g)", g: 23 },
  { name: "Queijo fresco (1 unidade, 100 g)", g: 10 },
  { name: "Requeijão (100 g)", g: 10 },
  { name: "Leite (1 copo, 250 ml)", g: 8 },
  { name: "Leguminosas (1 chávena cozida)", g: 15 },
];
