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
      id: "kb-goblet",
      vids: [{ id: "xxUok-bsgpQ", title: "Weighted Goblet Squats from a Chair" }, { id: "uzjfcTvgpoc", title: "Box Goblet Squat" }], name: "Goblet squat para uma cadeira", compound: true, home: true,
      load: "KB 12 kg", sets: sets3(10, 15),
      cues: ["Kettlebell de 12 kg agarrada pelos lados, junto ao peito.", "Senta-te devagar (3 s) numa cadeira firme e levanta sem balanço.", "A cadeira limita a descida: anca e joelho a ~90°.", "Tronco direito, lombar neutra."],
      next: "Passa a fazer uma pausa de 2 s sentado sem relaxar, ou usa os dois halteres de 9 kg aos lados (18 kg).",
      photoNote: "Na foto desce mais fundo do que deves: usa a cadeira para parar a ~90°.",
      video: "goblet box squat kettlebell",
    },
    {
      id: "kb-floor-press",
      vids: [{ id: "6ASauxpSmbA", title: "How to Do the Dumbbell Floor Press" }, { id: "-cpfMqSGxvg", title: "Dumbbell Floor Press: Perfect Technique Tutorial" }], name: "Floor press com halteres", compound: true, home: true,
      load: "2 × 9 kg", sets: sets3(10, 15),
      cues: ["Deitado no chão, joelhos fletidos, lombar apoiada.", "Desce até os cotovelos tocarem no chão, pausa 1 s.", "Pega neutra (palmas viradas uma para a outra) se os ombros reclamarem."],
      next: "Passa a 1 braço de cada vez com a kettlebell de 12 kg (o outro braço ajuda a estabilizar).",
      video: "dumbbell floor press technique",
    },
    {
      id: "kb-row",
      vids: [{ id: "eQLvFed1noc", title: "Single Arm Kettlebell Row Bench Supported" }, { id: "61H4-MgD4XM", title: "How To Do: Kettlebell Row - On Bench Single Arm" }], name: "Remada unilateral apoiada", compound: true, home: true, perSide: true,
      load: "KB 12 kg", sets: sets3(10, 15, "reps por lado"),
      cues: ["Mão e joelho numa cadeira ou sofá, coluna neutra e quieta.", "Puxa a kettlebell em direção à anca, sem rodar o tronco.", "Desce em 2–3 s."],
      next: "Faz pausa de 2 s em cima e descida em 4 s.",
      video: "supported one arm kettlebell row",
    },
    {
      id: "kb-split-squat",
      vids: [{ id: "5VG4UnfA7Bk", title: "Dumbbell Split Squat - Proper Form & Technique" }, { id: "u705lnY8CBc", title: "Exercise Tutorial: DB Split Squat" }], name: "Split squat com halteres", home: true, perSide: true,
      load: "2 × 9 kg ou 2 × KB", sets: sets3(8, 12, "reps por lado"),
      cues: ["Pé de trás no chão (não elevado), passada média.", "Desce na vertical até o joelho da frente a ~90°.", "Tronco direito, segura-te a uma parede se precisares."],
      next: "Desce em 3 s e faz pausa de 1 s em baixo.",
      photoNote: "Na foto o pé de trás está elevado: faz com os dois pés no chão.",
      video: "dumbbell split squat technique",
    },
    {
      id: "kb-hammer",
      vids: [{ id: "bdlqQAVdcEk", title: "Seated Dumbbell Hammer Curls (Tutorial + Tips)" }, { id: "obovFxPjXSM", title: "Exercise Tutorial: Seated Hammer Curl" }], name: "Curl martelo sentado", home: true,
      load: "2 × 9 kg", sets: sets3(10, 15),
      cues: ["Sentado com as costas apoiadas.", "Cotovelos parados, sem balanço.", "Descida de 2–3 s."],
      next: "Alterna os braços com pausa de 1 s em cima.",
      photoNote: "Na foto em pé; sentado poupa a lombar.",
      video: "seated hammer curl dumbbell",
    },
    {
      id: "kb-dead-bug",
      vids: [{ id: "Sa7msHujL3M", title: "Dead Bug With A Kettlebell Variation" }, { id: "oGasdDwUWSs", title: "The Kettlebell Deadbug For Less Lower Back Pain" }], name: "Dead bug com kettlebell", home: true, perSide: true,
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
      id: "kb-bridge",
      vids: [{ id: "pGnUzcsXbSw", title: "How To Do: Kettlebell Bridge" }, { id: "D7P26psrFcI", title: "Kettlebell Glute Bridges" }], name: "Glute bridge com kettlebell", compound: true, home: true,
      load: "KB 12 kg", sets: sets3(12, 20),
      cues: ["Deitado, kettlebell de 12 kg em cima da anca (com uma toalha).", "Sobe até a anca ficar alinhada, sem arquear a lombar.", "Pausa de 2 s em cima."],
      next: "Passa a uma perna de cada vez (como na foto), primeiro sem peso.",
      photoNote: "A foto mostra a versão a uma perna: é a progressão.",
      video: "kettlebell glute bridge",
    },
    {
      id: "kb-press",
      vids: [{ id: "DbubsKK0OVU", title: "Seated Neutral Grip Dumbbell Shoulder Press" }, { id: "IH39bk3AcCw", title: "Seated Single Arm Neutral Grip Dumbbell Press" }], name: "Press de ombros sentado, costas apoiadas", compound: true, home: true,
      load: "2 × 9 kg ou KB 6 kg", sets: sets3(8, 12),
      cues: ["Sentado com as costas encostadas a uma parede ou cadeira.", "Pega neutra, cotovelos ligeiramente à frente.", "Se o pescoço reclamar, faz só um braço de cada vez com a de 6 kg."],
      next: "Descida em 3 s e pausa de 1 s em baixo.",
      photoNote: "Na foto sem encosto: em casa encosta as costas.",
      video: "seated dumbbell shoulder press neutral grip",
    },
    {
      id: "kb-stepup",
      vids: [{ id: "Jyzc7eK74Ho", title: "How To Do A Dumbbell Low Box Step Up" }, { id: "qkkv25GsBus", title: "Dumbbell Step Up (Low) - Instructional Video" }], name: "Step-up para degrau baixo", compound: true, home: true, perSide: true,
      load: "2 × 9 kg", sets: sets3(8, 12, "reps por lado"),
      cues: ["Degrau ou caixa de 20–30 cm: o joelho não deve passar dos 90°.", "Empurra com o calcanhar da perna de cima, sem impulso da de baixo.", "Desce devagar."],
      next: "Desce em 3 s, ou segura a kettlebell de 12 kg em vez dos halteres.",
      photoNote: "Na foto o banco é alto: em casa usa um degrau baixo.",
      video: "dumbbell step up low step",
    },
    {
      id: "kb-pullover",
      vids: [{ id: "hbiDlO7VBxs", title: "Kettlebell Floor Pullover" }], name: "Pullover deitado no chão", home: true,
      load: "KB 12 kg ou halter 9 kg", sets: sets3(10, 15),
      cues: ["Deitado no chão, joelhos fletidos, lombar apoiada.", "Braços quase esticados, leva o peso para trás só até onde a lombar não arqueia.", "Puxa de volta até por cima do peito."],
      next: "Descida em 4 s.",
      photoNote: "Na foto num banco: no chão o movimento é mais curto e mais seguro.",
      video: "floor kettlebell pullover",
    },
    {
      id: "kb-lateral",
      vids: [{ id: "zjrtGQrCUJ8", title: "Seated Single Arm Lateral Raise" }, { id: "n25Em2K0iIE", title: "Single-arm Dumbbell Lateral Raise - Seated" }], name: "Elevação lateral sentado", home: true, perSide: true,
      load: "KB 6 kg", sets: sets3(10, 15, "reps por lado"),
      cues: ["Sentado, um braço de cada vez com a kettlebell de 6 kg.", "Sobe até à linha do ombro, sem encolher.", "Descida lenta."],
      next: "Faz 1 s de pausa em cima.",
      video: "seated one arm lateral raise",
    },
    {
      id: "kb-carry",
      vids: [{ id: "cF_CrM2eC4U", title: "How To Suitcase Carry" }, { id: "SXf6ePnQMJ8", title: "Kettlebell Suitcase Carry & Variations" }], name: "Suitcase carry (transporte com um braço)", home: true, perSide: true,
      load: "KB 12 kg", sets: sets3(30, 45, "s por lado"),
      cues: ["Kettlebell de 12 kg numa mão, de lado. Regista os segundos nas reps.", "Caminha devagar com o tronco direito: não deixes inclinar para o lado do peso.", "Ombros para baixo, abdominal ativo."],
      next: "Usa um halter de 9 kg em cada mão e depois volta à de 12 kg com mais tempo.",
      photoNote: "Na foto com dois pesos; aqui é com um, para treinar o core contra a inclinação.",
      video: "suitcase carry kettlebell",
    },
  ],
};

// ---------- Quarta: calistenia + kettlebell (uma kettlebell de cada vez: 6 ou 12 kg) ----------
// Circuito: corpo e kettlebell alternados, 3 voltas. Mesmas regras: nada de swings,
// peso morto, press de pé nem flexão da lombar com carga. "photo" reaproveita fotos de img/.
WORKOUTS.W = {
  name: "Quarta · Calistenia + kettlebell",
  short: "Quarta",
  day: "Quarta-feira",
  home: true,
  circuit: true,
  warmup:
    "<strong>Como fazer:</strong> 10 min de Animal Flow (vídeo no separador Semana) como aquecimento. Depois faz o circuito: 1 série de cada exercício seguida, com 20–30 s entre exercícios, e descansa 90 s no fim de cada volta. 3 voltas. Só precisas de uma kettlebell de cada vez.",
  exercises: [
    {
      id: "w-goblet", photo: "kb-goblet", name: "Goblet squat para uma cadeira", compound: true, home: true,
      vids: [{ id: "xxUok-bsgpQ", title: "Weighted Goblet Squats from a Chair" }],
      load: "KB 12 kg", sets: sets3(10, 15),
      cues: ["Kettlebell de 12 kg junto ao peito, agarrada pelos lados.", "Senta-te devagar (3 s) na cadeira e levanta sem balanço: anca e joelho a ~90°.", "Tronco direito, lombar neutra."],
      next: "Pausa de 2 s sentado sem relaxar, ou descida em 4 s.",
      photoNote: "Na foto desce mais fundo do que deves: usa a cadeira para parar a ~90°.",
      video: "goblet box squat kettlebell",
    },
    {
      id: "w-pushup", name: "Flexões inclinadas (mãos numa mesa ou bancada)", home: true,
      load: "Peso do corpo", sets: sets3(8, 15),
      cues: ["Mãos numa superfície firme à altura da anca, corpo em linha reta dos ombros aos calcanhares.", "Abdominal e glúteos contraídos: a lombar não cai.", "Pescoço neutro, olha para as mãos. Cotovelos a ~45° do corpo."],
      next: "Usa uma superfície mais baixa (cadeira, depois degrau) até chegares às flexões no chão.",
      photoNote: "Na foto numa barra; em casa usa uma mesa ou bancada.",
      video: "incline push up technique",
    },
    {
      id: "w-row", photo: "kb-row", name: "Remada unilateral apoiada", compound: true, home: true, perSide: true,
      vids: [{ id: "eQLvFed1noc", title: "Single Arm Kettlebell Row Bench Supported" }],
      load: "KB 12 kg", sets: sets3(10, 15, "reps por lado"),
      cues: ["Mão e joelho numa cadeira ou sofá, coluna neutra e quieta.", "Puxa a kettlebell em direção à anca, sem rodar o tronco.", "Desce em 2–3 s."],
      next: "Pausa de 2 s em cima e descida em 4 s.",
      video: "supported one arm kettlebell row",
    },
    {
      id: "w-bridge", photo: "kb-bridge", name: "Glute bridge a uma perna", home: true, perSide: true,
      load: "Peso do corpo", sets: sets3(8, 12, "reps por lado"),
      cues: ["Deitado, um pé no chão perto do glúteo, a outra perna esticada ou fletida no ar.", "Sobe empurrando com o calcanhar até a anca alinhar, sem arquear a lombar.", "Pausa de 2 s em cima."],
      next: "Põe a kettlebell de 6 kg em cima da anca (com uma toalha).",
      video: "single leg glute bridge",
    },
    {
      id: "w-beast", photo: false, name: "Beast hold → beast crawl (Animal Flow)", home: true,
      load: "Peso do corpo", sets: sets3(20, 40, "s"),
      cues: ["De gatas, mãos por baixo dos ombros e joelhos por baixo da anca; levanta os joelhos 2–3 cm do chão.", "Costas planas como uma mesa, pescoço neutro. Regista os segundos nas reps.", "Quando chegares aos 40 s, passa a andar devagar: mão e pé opostos ao mesmo tempo."],
      next: "Beast crawl: 4 passos para a frente e 4 para trás, sem a anca subir nem rodar.",
      video: "animal flow beast hold beast crawl beginner",
    },
    {
      id: "w-pullover", photo: "kb-pullover", name: "Pullover deitado no chão", home: true,
      vids: [{ id: "hbiDlO7VBxs", title: "Kettlebell Floor Pullover" }],
      load: "KB 6 kg", sets: sets3(12, 15),
      cues: ["Deitado no chão, joelhos fletidos, lombar apoiada.", "Kettlebell de 6 kg agarrada pelos lados, braços quase esticados.", "Leva-a para trás só até onde a lombar não arqueia e volta até por cima do peito."],
      next: "Descida em 4 s, ou passa à de 12 kg com 8–10 reps.",
      photoNote: "Na foto num banco: no chão o movimento é mais curto e mais seguro.",
      video: "floor kettlebell pullover",
    },
    {
      id: "w-carry", photo: "kb-carry", name: "Suitcase carry (transporte com um braço)", home: true, perSide: true,
      vids: [{ id: "cF_CrM2eC4U", title: "How To Suitcase Carry" }],
      load: "KB 12 kg", sets: sets3(30, 45, "s por lado"),
      cues: ["Kettlebell de 12 kg numa mão, de lado. Regista os segundos nas reps.", "Caminha devagar com o tronco direito: não deixes inclinar para o lado do peso.", "Ombros para baixo, abdominal ativo."],
      next: "Mais tempo (60 s por lado) ou passos mais lentos com pausa de 2 s em cada passo.",
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
// Manhã, todos os dias: caminhada (~6000 passos) e, em alguns dias, intervalos 3×3.
// Sugere os 3×3 em dias sem treino de força (terça, quinta, sábado) para recuperar bem.
const MORNING = {
  steps: 6000,
  intervals: "3 × (3 min a correr a 150–160 bpm + 3 min a andar)",
  intervalDays: [2, 4, 6],
};
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
  { dow: 3, type: "mixed", title: "Calistenia + kettlebell", workout: "W" },
  { dow: 4, type: "steps", title: `${STEPS_GOAL.toLocaleString("pt-PT")} passos` },
  { dow: 5, type: "workout", slot: 1 },
  { dow: 6, type: "rest", title: "Descanso" },
  { dow: 0, type: "rest", title: "Descanso" },
];

// Proteína: atalhos com valores aproximados (g de proteína e kcal por porção).
const PROTEIN_FACTORS = [1.6, 1.8, 2.0, 2.2]; // g por kg de peso corporal
const PROTEIN_FOODS = [
  { name: "1 ovo", g: 6, kcal: 70 },
  { name: "1 clara de ovo", g: 4, kcal: 17 },
  { name: "Claras líquidas (100 ml)", g: 11, kcal: 48 },
  { name: "Iogurte proteico / skyr (150 g)", g: 15, kcal: 95 },
  { name: "Frango ou peru (100 g cozinhado)", g: 30, kcal: 165 },
  { name: "Peixe (150 g cozinhado)", g: 30, kcal: 190 },
  { name: "Carne vermelha (100 g cozinhada)", g: 26, kcal: 250 },
  { name: "Atum em lata (1 lata escorrida)", g: 20, kcal: 90 },
  { name: "Whey (1 dose, 30 g)", g: 23, kcal: 120 },
  { name: "Queijo fresco (1 unidade, 100 g)", g: 10, kcal: 150 },
  { name: "Requeijão (100 g)", g: 10, kcal: 150 },
  { name: "Leite (1 copo, 250 ml)", g: 8, kcal: 115 },
  { name: "Leguminosas (1 chávena cozida)", g: 15, kcal: 200 },
];

// Lista de compras semanal: 2 adultos (comem peixe mas não carne, ~1600 kcal,
// proteína alta, baixo índice glicémico) + 1 criança de 5 anos que também come carne.
// Quantidades para 7 dias (as da ementa em MEAL_PLAN), numa só ida ao supermercado.
// price = custo estimado em € dessa quantidade (preços médios em Portugal, marca própria).
// Sobe SHOP_VERSION quando mudares a lista sugerida: as listas guardadas são atualizadas.
const SHOP_VERSION = 3;
const SHOP_CATEGORIES = [
  { id: "protein", name: "Proteína (peixe, ovos, lácteos, vegetal)" },
  { id: "veg", name: "Legumes e verduras" },
  { id: "fruit", name: "Fruta" },
  { id: "pantry", name: "Leguminosas, cereais e despensa" },
  { id: "fats", name: "Gorduras boas e sementes" },
  { id: "frozen", name: "Congelados (reserva para o fim da semana)" },
  { id: "drinks", name: "Bebidas" },
  { id: "kid", name: "Só para o filho" },
  { id: "other", name: "Outros" },
];
const SHOP_DEFAULT = [
  // proteína: base dos ~130 g/dia de cada adulto
  { cat: "protein", name: "Peixe fresco: salmão (dia 1) e pescada (dia 2)", qty: "1 kg", price: 12 },
  { cat: "protein", name: "Atum ao natural (lata)", qty: "6 latas", price: 6.6 },
  { cat: "protein", name: "Sardinha ou cavala em azeite (lata)", qty: "4 latas", price: 5.2 },
  { cat: "protein", name: "Ovos", qty: "3 dúzias", price: 8.7 },
  { cat: "protein", name: "Claras de ovo líquidas", qty: "2 × 500 ml", price: 5 },
  { cat: "protein", name: "Skyr ou iogurte grego natural 0%", qty: "22 unid.", price: 16.5 },
  { cat: "protein", name: "Queijo cottage", qty: "7 × 200 g", price: 10.5 },
  { cat: "protein", name: "Queijo fresco magro / batido 0%", qty: "4 × 200 g", price: 6.4 },
  { cat: "protein", name: "Requeijão", qty: "1 unid.", price: 1.6 },
  { cat: "protein", name: "Tofu firme", qty: "3 blocos", price: 6 },
  { cat: "protein", name: "Tempeh", qty: "1 unid.", price: 3 },
  { cat: "protein", name: "Seitan", qty: "1 unid.", price: 3 },
  { cat: "protein", name: "Bebida de soja sem açúcar", qty: "1 L", price: 1.2 },
  // legumes: os frágeis primeiro, os resistentes ficam para o fim da semana
  { cat: "veg", name: "Espinafres / rúcula / alface (comer até 3.º dia)", qty: "4 sacos", price: 5.2 },
  { cat: "veg", name: "Cogumelos (comer até 4.º dia)", qty: "750 g", price: 3.4 },
  { cat: "veg", name: "Brócolos", qty: "1 kg", price: 2.5 },
  { cat: "veg", name: "Couve-flor", qty: "1 unid.", price: 1.8 },
  { cat: "veg", name: "Curgete", qty: "4 unid.", price: 2.7 },
  { cat: "veg", name: "Pimentos", qty: "4 unid.", price: 2 },
  { cat: "veg", name: "Tomate", qty: "1,5 kg", price: 3 },
  { cat: "veg", name: "Pepino", qty: "3 unid.", price: 1.8 },
  { cat: "veg", name: "Beringela", qty: "2 unid.", price: 2 },
  { cat: "veg", name: "Couve lombarda ou repolho (aguenta a semana)", qty: "1 unid.", price: 1.5 },
  { cat: "veg", name: "Cenoura", qty: "1 kg", price: 0.9 },
  { cat: "veg", name: "Abóbora", qty: "1 kg", price: 1.5 },
  { cat: "veg", name: "Cebola", qty: "1 kg", price: 1.2 },
  { cat: "veg", name: "Alho", qty: "1 cabeça", price: 0.5 },
  { cat: "veg", name: "Limões", qty: "4 unid.", price: 1.2 },
  { cat: "veg", name: "Ervas frescas (salsa, coentros)", qty: "2 molhos", price: 1.6 },
  // fruta de índice glicémico baixo
  { cat: "fruit", name: "Maçãs", qty: "1,5 kg", price: 2.4 },
  { cat: "fruit", name: "Peras", qty: "1 kg", price: 1.8 },
  { cat: "fruit", name: "Kiwis", qty: "6 unid.", price: 2 },
  { cat: "fruit", name: "Laranjas ou tangerinas", qty: "1,5 kg", price: 2 },
  { cat: "fruit", name: "Abacates", qty: "3 unid.", price: 3 },
  // leguminosas e hidratos integrais, em porções controladas
  { cat: "pantry", name: "Grão-de-bico cozido (frasco)", qty: "3 frascos", price: 2.7 },
  { cat: "pantry", name: "Feijão preto ou vermelho cozido", qty: "2 frascos", price: 1.8 },
  { cat: "pantry", name: "Lentilhas vermelhas secas", qty: "500 g", price: 1.5 },
  { cat: "pantry", name: "Massa de leguminosas (lentilha ou grão)", qty: "1 × 250 g", price: 2.2 },
  { cat: "pantry", name: "Flocos de aveia", qty: "500 g", price: 1.3 },
  { cat: "pantry", name: "Quinoa", qty: "500 g", price: 3 },
  { cat: "pantry", name: "Pão 100% integral ou de centeio", qty: "1 pão", price: 2.5 },
  { cat: "pantry", name: "Tomate pelado / passata sem açúcar", qty: "3 unid.", price: 2.1 },
  { cat: "pantry", name: "Caldo de legumes (sem açúcar)", qty: "1 emb.", price: 1.5 },
  { cat: "pantry", name: "Especiarias (canela, cominhos, curcuma, paprika)", qty: "repor", price: 1 },
  { cat: "pantry", name: "Vinagre e mostarda", qty: "repor", price: 0.8 },
  // gorduras: pouca quantidade, muito valor
  { cat: "fats", name: "Azeite virgem extra", qty: "repor (≈1 L/mês)", price: 1.75 },
  { cat: "fats", name: "Nozes / amêndoas naturais", qty: "200 g", price: 3 },
  { cat: "fats", name: "Sementes de chia ou linhaça", qty: "250 g", price: 2 },
  { cat: "fats", name: "Manteiga de amendoim 100%", qty: "1 frasco", price: 3 },
  // congelados: a reserva para quando o fresco acaba (fica longe de tudo)
  { cat: "frozen", name: "Peixe congelado (bacalhau ou pescada)", qty: "≈600 g", price: 5 },
  { cat: "frozen", name: "Camarão ou miolo de marisco", qty: "400 g", price: 4.5 },
  { cat: "frozen", name: "Edamame", qty: "1 × 400 g", price: 2.5 },
  { cat: "frozen", name: "Mistura de legumes / salteado", qty: "2 × 1 kg", price: 3.6 },
  { cat: "frozen", name: "Espinafres em cubos", qty: "1 kg", price: 1.8 },
  { cat: "frozen", name: "Frutos vermelhos", qty: "2 × 500 g", price: 6 },
  // bebidas
  { cat: "drinks", name: "Refrigerante zero (garrafa de 1,5 L)", qty: "4 garrafas", price: 5.6 },
  // o filho come o mesmo que os pais, mais isto
  { cat: "kid", name: "Sumos em pacotinho (200 ml; melhor se 100% fruta)", qty: "8 unid.", price: 3.2 },
  { cat: "kid", name: "Peito de frango ou peru", qty: "600 g", price: 4.5 },
  { cat: "kid", name: "Carne picada (vaca ou peru)", qty: "400 g", price: 3.5 },
  { cat: "kid", name: "Fiambre de peru", qty: "1 emb.", price: 2 },
  { cat: "kid", name: "Leite meio-gordo", qty: "4 L", price: 3.4 },
  { cat: "kid", name: "Queijo flamengo", qty: "1 emb.", price: 2.2 },
  { cat: "kid", name: "Bananas", qty: "1 kg", price: 1.2 },
  { cat: "kid", name: "Arroz", qty: "1 kg", price: 1.3 },
  { cat: "kid", name: "Massa", qty: "500 g", price: 0.9 },
  { cat: "kid", name: "Batatas", qty: "1,5 kg", price: 1.8 },
];

// Ementa de 7 dias para cada adulto (~1550 kcal, ~130 g de proteína, sem carne),
// feita com a lista de compras. O peixe fresco e as folhas vêm primeiro.
// Valores aproximados; "kid" = o que muda para o filho ao jantar.
const MEAL_PLAN = [
  { day: "Segunda", kid: "Salmão com arroz e brócolos. Lanche: pacotinho de sumo e pão com fiambre.", meals: [
    { meal: "Pequeno-almoço", food: "Skyr (170 g) com aveia (30 g), frutos vermelhos (80 g) e nozes (10 g)", kcal: 320, p: 25 },
    { meal: "Almoço", food: "Salada de folhas, tomate e pepino com atum (1 lata), grão (100 g), ½ abacate e limão", kcal: 355, p: 31 },
    { meal: "Lanche", food: "Cottage (200 g) e 1 kiwi", kcal: 225, p: 22 },
    { meal: "Jantar", food: "Salmão no forno (150 g), brócolos (250 g) e quinoa (40 g), 1 c. chá de azeite", kcal: 565, p: 40 },
    { meal: "Ceia", food: "Iogurte grego 0% (120 g)", kcal: 65, p: 12 },
  ] },
  { day: "Terça", kid: "Pescada com batata cozida e cenoura. Lanche: banana e leite.", meals: [
    { meal: "Pequeno-almoço", food: "Omelete de 2 ovos + 100 ml de claras com espinafres, 1 fatia de pão integral (40 g)", kcal: 305, p: 29 },
    { meal: "Almoço", food: "Tofu salteado (200 g) com curgete e pimento (250 g), quinoa (40 g), 1 c. sopa de azeite", kcal: 560, p: 35 },
    { meal: "Lanche", food: "Skyr (170 g) e 1 maçã", kcal: 185, p: 19 },
    { meal: "Jantar", food: "Pescada no forno (180 g) com cogumelos e couve-flor (300 g), grão (80 g), 1 c. chá de azeite", kcal: 360, p: 43 },
    { meal: "Ceia", food: "Iogurte grego 0% (120 g) e nozes (10 g)", kcal: 130, p: 14 },
  ] },
  { day: "Quarta", kid: "Frango aos cubos com arroz (o caril dele sem picante). Lanche: pacotinho de sumo e queijo.", meals: [
    { meal: "Pequeno-almoço", food: "Skyr (170 g) com aveia (30 g), chia (10 g) e 1 kiwi", kcal: 315, p: 25 },
    { meal: "Almoço", food: "Taça de quinoa (40 g), edamame (100 g), cenoura ralada, pepino e 2 ovos cozidos", kcal: 460, p: 31 },
    { meal: "Lanche", food: "Queijo fresco magro (100 g) com tomate, 1 fatia de pão integral e 1 laranja", kcal: 260, p: 16 },
    { meal: "Jantar", food: "Caril de camarão (150 g) e grão (100 g) com tomate pelado e espinafres, 1 c. chá de azeite", kcal: 345, p: 38 },
    { meal: "Ceia", food: "Cottage (150 g)", kcal: 135, p: 17 },
  ] },
  { day: "Quinta", kid: "Frango salteado com massa e cenoura. Lanche: iogurte e fruta.", meals: [
    { meal: "Pequeno-almoço", food: "Panquecas de aveia (30 g), 1 ovo e 100 ml de claras, com skyr (100 g) e frutos vermelhos (100 g)", kcal: 335, p: 33 },
    { meal: "Almoço", food: "Salada de lentilhas vermelhas (40 g secas) com sardinhas (1 lata), tomate, pepino, cebola e salsa", kcal: 370, p: 32 },
    { meal: "Lanche", food: "Iogurte grego 0% (170 g), manteiga de amendoim (15 g) e 1 maçã", kcal: 265, p: 21 },
    { meal: "Jantar", food: "Tempeh salteado (100 g) com couve lombarda e cenoura (300 g), quinoa (30 g), 1 c. sopa de azeite", kcal: 470, p: 28 },
    { meal: "Ceia", food: "Queijo fresco batido 0% (200 g)", kcal: 95, p: 16 },
  ] },
  { day: "Sexta", kid: "Peixe com batata e abóbora assada. Lanche: pacotinho de sumo e pão com queijo.", meals: [
    { meal: "Pequeno-almoço", food: "2 ovos mexidos + 100 ml de claras, 1 fatia de pão integral e ½ abacate", kcal: 400, p: 29 },
    { meal: "Almoço", food: "Massa de lentilha (60 g) com molho de tomate, atum (1 lata) e curgete", kcal: 370, p: 37 },
    { meal: "Lanche", food: "Cottage (200 g) e 1 pera", kcal: 265, p: 22 },
    { meal: "Jantar", food: "Bacalhau ou pescada congelada (180 g) no forno com abóbora e beringela (300 g), 1 c. sopa de azeite", kcal: 325, p: 36 },
    { meal: "Ceia", food: "Iogurte grego 0% (120 g) e nozes (10 g)", kcal: 130, p: 14 },
  ] },
  { day: "Sábado", kid: "Hambúrguer de carne picada no pão com batata assada. Lanche: banana e leite.", meals: [
    { meal: "Pequeno-almoço", food: "Skyr (170 g) com aveia (30 g), maçã ralada e canela", kcal: 300, p: 23 },
    { meal: "Almoço", food: "Omelete de forno (3 ovos + 100 ml de claras) com cogumelos e espinafres, salada, 1 fatia de pão integral", kcal: 415, p: 36 },
    { meal: "Lanche", food: "Queijo fresco magro (100 g), 1 kiwi e amêndoas (10 g)", kcal: 190, p: 13 },
    { meal: "Jantar", food: "Hambúrguer caseiro de feijão preto (100 g), tofu (100 g) e aveia (15 g), salada e edamame (100 g)", kcal: 465, p: 33 },
    { meal: "Ceia", food: "Cottage (200 g)", kcal: 180, p: 22 },
  ] },
  { day: "Domingo", kid: "Frango assado com arroz e a mesma sopa. Lanche: pacotinho de sumo e fruta.", meals: [
    { meal: "Pequeno-almoço", food: "Omelete de 2 ovos + 100 ml de claras com tomate, 1 fatia de pão integral", kcal: 300, p: 28 },
    { meal: "Almoço", food: "Seitan grelhado (120 g) com legumes salteados congelados (300 g), feijão (80 g), 1 c. sopa de azeite e 1 laranja", kcal: 445, p: 39 },
    { meal: "Lanche", food: "Skyr (170 g) com frutos vermelhos (80 g) e chia (10 g)", kcal: 190, p: 21 },
    { meal: "Jantar", food: "Sopa de abóbora, cenoura e couve com cavala (1 lata) e 1 fatia de pão integral", kcal: 390, p: 26 },
    { meal: "Ceia", food: "Iogurte grego 0% (170 g) e manteiga de amendoim (15 g)", kcal: 185, p: 21 },
  ] },
];
