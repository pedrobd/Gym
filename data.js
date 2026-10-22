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
        alt: "landmine press",
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
      },
      {
        id: "hip-thrust",
        name: "Hip thrust em máquina ou glute bridge",
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
        photoNote: "Foto com barra; na máquina o movimento é o mesmo.",
        alt: "glute bridge",
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
        alt: "seated cable row",
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
      },
    ],
  },
};

// Semana: 0 = domingo … 6 = sábado (como Date.getDay()).
const STEPS_GOAL = 11000;
const FLOW_CHANNEL = "https://www.youtube.com/@strengthsidefollowalongs";
const WEEK = [
  { dow: 1, type: "workout", workout: "A", title: "Treino A" },
  { dow: 2, type: "steps", title: `${STEPS_GOAL.toLocaleString("pt-PT")} passos` },
  { dow: 3, type: "flow", title: "Animal Flow" },
  { dow: 4, type: "steps", title: `${STEPS_GOAL.toLocaleString("pt-PT")} passos` },
  { dow: 5, type: "workout", workout: "B", title: "Treino B" },
  { dow: 6, type: "rest", title: "Descanso" },
  { dow: 0, type: "rest", title: "Descanso" },
];
