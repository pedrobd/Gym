// Plano B: cada exercício tem "alts" (fotos em img/alt-<id>-0.jpg / -1.jpg).
// Fotos em img/<id>-0.jpg (início) e img/<id>-1.jpg (fim), de free-exercise-db (domínio público).
// Plano de treino: 2x/semana, 2 séries por exercício, adaptado a hérnias e anca.
const WORKOUTS = {
  A: {
    name: "Treino A",
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
  { dow: 1, type: "workout", workout: "A", title: "Treino A" },
  { dow: 2, type: "steps", title: `${STEPS_GOAL.toLocaleString("pt-PT")} passos` },
  { dow: 3, type: "flow", title: "Animal Flow" },
  { dow: 4, type: "steps", title: `${STEPS_GOAL.toLocaleString("pt-PT")} passos` },
  { dow: 5, type: "workout", workout: "B", title: "Treino B" },
  { dow: 6, type: "rest", title: "Descanso" },
  { dow: 0, type: "rest", title: "Descanso" },
];
