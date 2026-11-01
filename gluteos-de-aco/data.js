// Glúteos de Aço — biblioteca de treinos
// Material: kettlebells 12 kg e 6 kg · halteres 2×9 kg, 2×5 kg, 2×1 kg · perneiras 1 kg · elásticos

// Conta de inspiração. Para fixar um vídeo a um exercício para toda a gente,
// acrescenta ao exercício:  ig: 'https://www.instagram.com/reel/XXXXXXXX/'
const INSPIRATION = {
  name: 'Tina Love Fitness', handle: 'tinalovefitness', url: 'https://www.instagram.com/tinalovefitness/',
  videos: [
    'https://www.instagram.com/p/DeO86U8nxGB/',
    'https://www.instagram.com/p/DeEg3Dtnx1f/',
    'https://www.instagram.com/p/DdRnHK2DWlz/',
    'https://www.instagram.com/p/Db00kIfiEXB/',
    'https://www.instagram.com/p/Dbv23UACAI4/',
    'https://www.instagram.com/p/DbdpSE1iNMF/',
    'https://www.instagram.com/p/DZSFut0mMs_/',
    'https://www.instagram.com/reel/DDoxJoqhsGZ/',
    'https://www.instagram.com/p/DfHtkg5kYlt/',
  ],
};

const WORKOUTS = [
  {
    id: 'gluteos-aco',
    name: 'Glúteos Power',
    emoji: '🍑',
    color: '#e8505b',
    focus: 'Força · Glúteos e pernas',
    minutes: 40,
    kit: ['KB 12 kg', 'Halteres 9 kg', 'Halteres 5 kg', 'Perneiras', 'Elástico'],
    intro: 'O treino mais pesado da semana para os glúteos. Cargas altas, poucas repetições e descida controlada (3 s).',
    blocks: [
      {
        title: 'Aquecimento', info: '2 voltas seguidas · 6 min', rounds: 2, rest: 0,
        ex: [
          { n: 'Ponte de glúteos com elástico', d: '15 reps', l: 'Elástico acima dos joelhos', tip: 'Empurra os joelhos para fora contra o elástico. Aperta os glúteos 1 s em cima.', q: 'banded glute bridge' },
          { n: 'Agachamento livre', d: '10 reps', l: 'Peso do corpo', tip: 'Peito aberto, joelhos na direção dos pés, desce até onde a coluna se mantém neutra.', q: 'bodyweight squat form' },
          { n: 'Monster walk com elástico', d: '10 passos para cada lado', l: 'Elástico nos tornozelos ou joelhos', tip: 'Meio agachada, passos curtos, sem deixar os joelhos fugirem para dentro.', q: 'monster walk resistance band' },
        ],
      },
      {
        title: 'Bloco A · Superset', info: '4 séries · descanso 75 s no fim de cada série', rounds: 4, rest: 75,
        ex: [
          { n: 'Agachamento goblet', d: '10–12 reps', l: 'KB 12 kg', tip: 'Segura a KB junto ao peito pelas "orelhas". Desce 3 s, sobe com força a empurrar o chão.', q: 'kettlebell goblet squat form' },
          { n: 'Peso morto romeno', d: '10–12 reps', l: '2 halteres de 9 kg', tip: 'Joelhos ligeiramente fletidos, anca para trás, halteres junto às pernas. Sente o alongamento atrás da coxa e sobe a apertar os glúteos.', q: 'dumbbell romanian deadlift form' },
        ],
      },
      {
        title: 'Bloco B · Superset', info: '3 séries · descanso 60 s', rounds: 3, rest: 60,
        ex: [
          { n: 'Hip thrust apoiada no sofá', d: '12–15 reps + 2 s de pausa em cima', l: 'KB 12 kg sobre a anca + elástico nos joelhos', tip: 'Omoplatas no sofá, queixo ao peito, sobe até o tronco ficar alinhado com as coxas. Não arqueies a lombar.', q: 'kettlebell hip thrust couch' },
          { n: 'Agachamento búlgaro', d: '8–10 reps por perna', l: '2 halteres de 5 kg', tip: 'Pé de trás numa cadeira. Inclina ligeiramente o tronco para a frente para trabalhar mais o glúteo.', q: 'dumbbell bulgarian split squat glutes' },
        ],
      },
      {
        title: 'Finisher', info: '2 voltas sem descanso entre exercícios · 45 s no fim', rounds: 2, rest: 45,
        ex: [
          { n: 'Coice de glúteo em 4 apoios', d: '15 por perna', l: 'Perneiras de 1 kg', tip: 'Joelho a 90°, empurra a planta do pé para o teto. Barriga firme, sem rodar a anca.', q: 'donkey kicks ankle weights' },
          { n: 'Passada lateral com elástico', d: '12 passos para cada lado', l: 'Elástico', tip: 'Mantém a tensão no elástico o tempo todo.', q: 'banded lateral walk' },
          { n: 'Ponte em pulsos', d: '30 s', l: 'Peso do corpo', tip: 'Fica em cima e faz pequenos movimentos de 5 cm, sempre a apertar.', q: 'glute bridge pulses' },
        ],
      },
      {
        title: 'Retorno à calma', info: '4 min · 30–40 s cada lado', rounds: 1, rest: 0,
        ex: [
          { n: 'Alongamento do flexor da anca', d: '30 s por lado', l: '', tip: 'Em afundo com o joelho no chão, aperta o glúteo da perna de trás.', q: 'kneeling hip flexor stretch' },
          { n: 'Postura do pombo', d: '40 s por lado', l: '', tip: 'Respira fundo e deixa a anca descer.', q: 'pigeon pose stretch' },
        ],
      },
    ],
  },
  {
    id: 'bracos-rainha',
    name: 'Braços de Rainha',
    emoji: '💪',
    color: '#8b5cf6',
    focus: 'Força · Braços, ombros e costas',
    minutes: 40,
    kit: ['Halteres 9 kg', 'Halteres 5 kg', 'Halteres 1 kg', 'KB 6 kg', 'Elástico'],
    intro: 'Braços definidos fazem-se com costas e ombros fortes. Começa pelo pesado e acaba com repetições altas para "queimar".',
    blocks: [
      {
        title: 'Aquecimento', info: '2 voltas · 5 min', rounds: 2, rest: 0,
        ex: [
          { n: 'Círculos de braços', d: '10 para a frente + 10 para trás', l: '', tip: 'Começa pequeno e aumenta.', q: 'arm circles warm up' },
          { n: 'Band pull-apart', d: '15 reps', l: 'Elástico', tip: 'Braços esticados à altura do peito, junta as omoplatas.', q: 'band pull apart' },
          { n: 'Flexões na parede', d: '10 reps', l: 'Peso do corpo', tip: 'Corpo em prancha, cotovelos a 45°.', q: 'wall push up' },
        ],
      },
      {
        title: 'Bloco A · Superset', info: '4 séries · descanso 60 s', rounds: 4, rest: 60,
        ex: [
          { n: 'Remada curvada', d: '10–12 reps', l: '2 halteres de 9 kg', tip: 'Tronco a 45°, costas direitas. Puxa os cotovelos para a anca e aperta as omoplatas.', q: 'dumbbell bent over row form women' },
          { n: 'Press de ombros sentada', d: '10–12 reps', l: '2 halteres de 5 kg', tip: 'Sentada direita, barriga firme. Sobe sem arquear a lombar.', q: 'seated dumbbell shoulder press' },
        ],
      },
      {
        title: 'Bloco B · Tri-set', info: '3 séries · descanso 60 s', rounds: 3, rest: 60,
        ex: [
          { n: 'Flexões', d: '8–12 reps', l: 'Joelhos no chão se for preciso', tip: 'Peito vai ao chão em bloco com a anca. Quando fizeres 12 com joelhos, passa para pés.', q: 'push up progression women' },
          { n: 'Curl de bíceps', d: '10–12 reps', l: '2 halteres de 5 kg', tip: 'Cotovelos colados ao corpo, desce em 3 s.', q: 'dumbbell bicep curl form' },
          { n: 'Extensão de tríceps acima da cabeça', d: '12 reps', l: 'KB 6 kg (segura pelas "orelhas")', tip: 'Cotovelos a apontar para a frente, só o antebraço se mexe.', q: 'kettlebell overhead triceps extension' },
        ],
      },
      {
        title: 'Finisher · Queima', info: '2 voltas · descanso 45 s', rounds: 2, rest: 45,
        ex: [
          { n: 'Elevações laterais', d: '15 reps', l: '2 halteres de 1 kg (ou 5 kg para 8–10)', tip: 'Sobe até à altura dos ombros, mindinho ligeiramente para cima.', q: 'dumbbell lateral raise form' },
          { n: 'Curl martelo', d: '12 reps', l: '2 halteres de 5 kg', tip: 'Palmas viradas uma para a outra.', q: 'hammer curl form' },
          { n: 'Kickback de tríceps', d: '15 reps', l: '2 halteres de 1 kg', tip: 'Tronco inclinado, cotovelo fixo junto ao corpo, estica o braço todo para trás.', q: 'dumbbell triceps kickback' },
          { n: 'Band pull-apart', d: '20 reps', l: 'Elástico', tip: 'Postura direita, ótimo para a postura de quem trabalha sentada.', q: 'band pull apart' },
        ],
      },
      {
        title: 'Retorno à calma', info: '3 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Alongamento de peito na porta', d: '30 s por lado', l: '', tip: 'Antebraço na ombreira, roda o tronco para o lado oposto.', q: 'doorway chest stretch' },
          { n: 'Alongamento de tríceps', d: '30 s por lado', l: '', tip: 'Mão nas costas, puxa o cotovelo com a outra mão.', q: 'triceps stretch' },
        ],
      },
    ],
  },
  {
    id: 'corrida-turbo',
    name: 'Corrida Turbo + Core',
    emoji: '⚡',
    color: '#f59e0b',
    focus: 'Cardio · Intervalos e abdominais',
    minutes: 40,
    kit: ['Ténis', 'Tapete'],
    intro: 'Intervalos curtos e rápidos: muito eficazes para queimar gordura e melhorar o fôlego para o CrossFit. Usa o cronómetro de intervalos — ele avisa com som e voz.',
    blocks: [
      {
        title: 'Aquecimento', info: '8 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Caminhada rápida → corrida muito leve', d: '6 min', l: '', tip: 'Ritmo em que consegues falar à vontade.', q: 'running warm up' },
          { n: 'Mobilidade dinâmica', d: '2 min', l: '', tip: 'Skipping baixo, calcanhares ao rabo, balanço de pernas.', q: 'dynamic warm up running drills' },
        ],
      },
      {
        title: 'Intervalos', info: '8 × (1 min rápido + 1 min 30 lento) · 20 min', rounds: 1, rest: 0,
        interval: { work: 60, rest: 90, rounds: 8 },
        ex: [
          { n: 'Corrida rápida', d: '1 min', l: 'Esforço 8/10', tip: 'Rápido mas controlado: no fim do minuto já não consegues falar frases.', q: 'interval running beginners' },
          { n: 'Corrida lenta ou caminhada', d: '1 min 30 s', l: 'Esforço 3/10', tip: 'Recupera a respiração por completo.', q: '' },
        ],
      },
      {
        title: 'Volta à calma', info: '4 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Caminhada', d: '4 min', l: '', tip: 'Deixa o coração baixar antes do core.', q: '' },
        ],
      },
      {
        title: 'Core', info: '2 voltas · descanso 30 s', rounds: 2, rest: 30,
        ex: [
          { n: 'Prancha de antebraços', d: '30–40 s', l: '', tip: 'Glúteos e barriga apertados, não deixes a anca descer.', q: 'forearm plank form' },
          { n: 'Dead bug', d: '10 por lado', l: 'Halteres de 1 kg nas mãos (opcional)', tip: 'Lombar colada ao chão o tempo todo. Expira ao esticar.', q: 'dead bug exercise' },
          { n: 'Prancha lateral', d: '25 s por lado', l: '', tip: 'Joelho de baixo no chão para facilitar.', q: 'side plank' },
          { n: 'Ponte com marcha', d: '10 por perna', l: '', tip: 'Anca alta e estável enquanto levantas um pé de cada vez.', q: 'glute bridge march' },
        ],
      },
    ],
  },
  {
    id: 'kettlebell-fire',
    name: 'Kettlebell Fire',
    emoji: '🔥',
    color: '#ef7d1a',
    focus: 'Corpo inteiro · Metcon',
    minutes: 38,
    kit: ['KB 12 kg', 'KB 6 kg', 'Halteres 5 kg', 'Halteres 9 kg'],
    intro: 'Estilo CrossFit mas em casa, com intensidade moderada para não roubar energia às aulas da box. Técnica primeiro, velocidade depois.',
    blocks: [
      {
        title: 'Aquecimento', info: '2 voltas · 5 min', rounds: 2, rest: 0,
        ex: [
          { n: 'Halo com kettlebell', d: '6 para cada lado', l: 'KB 6 kg', tip: 'Roda a KB à volta da cabeça, barriga firme.', q: 'kettlebell halo' },
          { n: 'Agachamento goblet leve', d: '10 reps', l: 'KB 6 kg', tip: '', q: 'goblet squat' },
          { n: 'Swing leve', d: '10 reps', l: 'KB 6 kg', tip: 'Movimento de anca, não de braços.', q: 'kettlebell swing form' },
          { n: 'Inchworm', d: '5 reps', l: '', tip: 'Caminha com as mãos até prancha e volta.', q: 'inchworm exercise' },
        ],
      },
      {
        title: 'EMOM 12 min', info: 'No início de cada minuto faz o exercício e descansa o que sobrar', rounds: 1, rest: 0,
        interval: { work: 60, rest: 0, rounds: 12, labels: ['Minuto ímpar: swings', 'Minuto par: clean & press'] },
        ex: [
          { n: 'Minutos ímpares · Kettlebell swing', d: '12–15 reps', l: 'KB 12 kg', tip: 'Anca para trás como a fechar uma porta com o rabo, depois estala a anca. A KB flutua até à altura do peito.', q: 'russian kettlebell swing form women' },
          { n: 'Minutos pares · Clean & press', d: '5 por braço', l: 'KB 6 kg', tip: 'Traz a KB ao ombro sem bater no antebraço, depois empurra para cima.', q: 'kettlebell clean and press' },
        ],
      },
      {
        title: 'AMRAP 12 min', info: 'O máximo de voltas possível em 12 min · aponta as voltas', rounds: 1, rest: 0,
        interval: { work: 720, rest: 0, rounds: 1, labels: ['AMRAP'] },
        ex: [
          { n: 'Thrusters', d: '10 reps', l: '2 halteres de 5 kg', tip: 'Agachamento + press num só movimento, usa a força das pernas.', q: 'dumbbell thruster form' },
          { n: 'Remada renegada', d: '5 por braço', l: '2 halteres de 5 kg', tip: 'Pés afastados para não rodar a anca. Joelhos no chão se for preciso.', q: 'renegade row' },
          { n: 'Afundo atrás alternado', d: '6 por perna', l: '2 halteres de 5 kg', tip: '', q: 'dumbbell reverse lunge' },
          { n: 'Russian twist', d: '10 por lado', l: 'KB 6 kg', tip: 'Pés no chão se a lombar se queixar.', q: 'kettlebell russian twist' },
        ],
      },
      {
        title: 'Finisher', info: '3 × 40 s · descanso 20 s', rounds: 3, rest: 20,
        ex: [
          { n: 'Farmer carry', d: '40 s a caminhar', l: '2 halteres de 9 kg', tip: 'Ombros para baixo e para trás, passos curtos.', q: 'farmers carry' },
        ],
      },
    ],
  },
  {
    id: 'bumbum-tonificado',
    name: 'Bumbum Tonificado',
    emoji: '✨',
    color: '#ec4899',
    focus: 'Tonificar · Glúteos, pernas e anca',
    minutes: 40,
    kit: ['KB 12 kg', 'Halteres 5 kg', 'Perneiras', 'Elástico'],
    intro: 'Repetições altas e pouco descanso para sentir o glúteo "a arder". Complementa o treino pesado de segunda.',
    blocks: [
      {
        title: 'Aquecimento', info: '2 voltas · 5 min', rounds: 2, rest: 0,
        ex: [
          { n: 'Gato–vaca', d: '8 reps', l: '', tip: 'Mexe a coluna vértebra a vértebra.', q: 'cat cow stretch' },
          { n: 'Clamshell', d: '12 por lado', l: 'Elástico', tip: 'Pés juntos, abre o joelho sem rodar a anca para trás.', q: 'clamshell exercise band' },
          { n: 'Ponte de glúteos', d: '15 reps', l: '', tip: '', q: 'glute bridge' },
        ],
      },
      {
        title: 'Bloco A · Pernas', info: '3 voltas · descanso 45 s', rounds: 3, rest: 45,
        ex: [
          { n: 'Agachamento sumo', d: '15 reps', l: 'KB 12 kg', tip: 'Pés bem afastados e virados para fora. Desce a direito, empurra os joelhos para fora.', q: 'kettlebell sumo squat' },
          { n: 'Afundo atrás', d: '10 por perna', l: '2 halteres de 5 kg', tip: 'Passo grande para trás, peso no calcanhar da frente.', q: 'dumbbell reverse lunge glutes' },
          { n: 'Ponte a uma perna', d: '12 por perna', l: '', tip: 'Anca nivelada, não deixes cair para um lado.', q: 'single leg glute bridge' },
        ],
      },
      {
        title: 'Bloco B · Perneiras', info: '3 voltas · descanso 30 s · faz um lado inteiro e depois o outro', rounds: 3, rest: 30,
        ex: [
          { n: 'Fire hydrant', d: '15 por lado', l: 'Perneiras 1 kg', tip: 'Em 4 apoios, abre o joelho para o lado sem inclinar o tronco.', q: 'fire hydrant ankle weights' },
          { n: 'Coice com perna esticada', d: '15 por lado', l: 'Perneiras 1 kg', tip: 'Sobe até à altura da anca, sem arquear a lombar.', q: 'straight leg kickback ankle weights' },
          { n: 'Abdução deitada de lado', d: '15 por lado', l: 'Perneiras 1 kg', tip: 'Perna ligeiramente para trás e dedos virados para a frente.', q: 'side lying leg raise ankle weights' },
        ],
      },
      {
        title: 'Finisher', info: '2 voltas · sem descanso', rounds: 2, rest: 30,
        ex: [
          { n: 'Curtsy lunge (afundo cruzado)', d: '12 alternados', l: '2 halteres de 5 kg ou sem peso', tip: 'A perna de trás cruza na diagonal como numa vénia.', q: 'curtsy lunge' },
          { n: 'Frog pumps', d: '25 reps', l: '', tip: 'Plantas dos pés juntas, joelhos abertos, sobe a anca rápido.', q: 'frog pumps' },
          { n: 'Agachamento em pulsos com elástico', d: '30 s', l: 'Elástico acima dos joelhos', tip: 'Fica em baixo e faz pequenos movimentos.', q: 'squat pulses band' },
        ],
      },
      {
        title: 'Retorno à calma', info: '4 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Figura 4 deitada', d: '40 s por lado', l: '', tip: '', q: 'figure four stretch' },
          { n: 'Postura da criança', d: '1 min', l: '', tip: 'Respiração lenta pelo nariz.', q: 'child pose' },
        ],
      },
    ],
  },
  {
    id: 'corrida-zen',
    name: 'Corrida Zen',
    emoji: '🏃‍♀️',
    color: '#10b981',
    focus: 'Cardio leve · Resistência',
    minutes: 45,
    kit: ['Ténis'],
    intro: 'Corrida contínua e calma (zona 2): deves conseguir conversar. Faz crescer a resistência sem cansar demasiado para o treino seguinte. Se preferires, alterna 4 min corrida / 1 min caminhada.',
    blocks: [
      {
        title: 'Aquecimento', info: '5 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Caminhada rápida', d: '5 min', l: '', tip: '', q: '' },
        ],
      },
      {
        title: 'Corrida contínua', info: '25–35 min em ritmo de conversa', rounds: 1, rest: 0,
        interval: { work: 1800, rest: 0, rounds: 1, labels: ['Corrida leve'] },
        ex: [
          { n: 'Corrida leve', d: '25–35 min', l: 'Esforço 4–5/10', tip: 'Passos curtos e leves. Se não consegues falar, abranda. Acrescenta 5 min a cada 2 semanas até chegares aos 35.', q: 'zone 2 running beginners' },
        ],
      },
      {
        title: 'Mobilidade de anca', info: '5 min', rounds: 1, rest: 0,
        ex: [
          { n: '90/90 da anca', d: '6 trocas por lado', l: '', tip: '', q: '90 90 hip mobility' },
          { n: 'Alongamento de gémeos na parede', d: '30 s por perna', l: '', tip: '', q: 'calf stretch wall' },
          { n: 'Alongamento de quadríceps de pé', d: '30 s por perna', l: '', tip: '', q: 'standing quad stretch' },
        ],
      },
    ],
  },
  {
    id: 'domingo-leve',
    name: 'Domingo Leve',
    emoji: '🧘‍♀️',
    color: '#0ea5e9',
    focus: 'Recuperação · Mobilidade + braços express',
    minutes: 30,
    kit: ['Tapete', 'Halteres 1 kg', 'Elástico'],
    intro: 'Dia para o corpo recuperar: mobilidade para soltar ancas e costas, e 10 minutos leves de braços. Sai deste treino com mais energia do que entraste.',
    blocks: [
      {
        title: 'Fluxo de mobilidade', info: '1 volta lenta · 15 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Gato–vaca', d: '10 reps', l: '', tip: '', q: 'cat cow' },
          { n: 'World\'s greatest stretch', d: '5 por lado', l: '', tip: 'Afundo, mão no chão, roda o tronco e abre o braço para o teto.', q: 'worlds greatest stretch' },
          { n: 'Rotação torácica em 4 apoios', d: '8 por lado', l: '', tip: 'Mão atrás da cabeça, segue o cotovelo com o olhar.', q: 'quadruped thoracic rotation' },
          { n: 'Postura do pombo', d: '1 min por lado', l: '', tip: '', q: 'pigeon pose' },
          { n: 'Cão a olhar para baixo', d: '45 s', l: '', tip: 'Pedala os pés para soltar os gémeos.', q: 'downward dog' },
        ],
      },
      {
        title: 'Braços express', info: '2 voltas · 30 s de descanso', rounds: 2, rest: 30,
        ex: [
          { n: 'Pulsos laterais', d: '30 s', l: '2 halteres de 1 kg', tip: 'Braços esticados à altura dos ombros, pequenos movimentos.', q: 'lateral raise pulses' },
          { n: 'Curl com elástico', d: '15 reps', l: 'Elástico debaixo dos pés', tip: '', q: 'resistance band bicep curl' },
          { n: 'Extensão de tríceps com elástico', d: '15 reps', l: 'Elástico', tip: '', q: 'resistance band triceps extension' },
          { n: 'Círculos de braços', d: '30 s', l: '2 halteres de 1 kg', tip: '', q: 'arm circles dumbbells' },
        ],
      },
      {
        title: 'Respiração', info: '3 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Respiração 4–6 deitada', d: '3 min', l: '', tip: 'Inspira 4 s pelo nariz, expira 6 s. Prepara a semana com calma.', q: 'box breathing relax' },
        ],
      },
    ],
  },
  {
    id: 'kb-tina',
    name: 'KB com a Tina',
    emoji: '🎬',
    color: '#d9467a',
    focus: 'Kettlebell · Segue o vídeo',
    minutes: 40,
    kit: ['KB 12 kg', 'KB 6 kg'],
    intro: 'Treino de kettlebell a acompanhar os vídeos da @tinalovefitness. Cada semana há um vídeo sugerido (podes escolher outro). Faz o circuito do vídeo 3–4 vezes.',
    blocks: [
      {
        title: 'Aquecimento', info: '2 voltas · 5 min', rounds: 2, rest: 0,
        ex: [
          { n: 'Halo com kettlebell', d: '6 para cada lado', l: 'KB 6 kg', tip: 'Roda a KB à volta da cabeça, barriga firme.', q: 'kettlebell halo' },
          { n: 'Agachamento goblet leve', d: '10 reps', l: 'KB 6 kg', tip: '', q: 'goblet squat' },
          { n: 'Swing leve', d: '10 reps', l: 'KB 6 kg', tip: 'Movimento de anca, não de braços.', q: 'kettlebell swing form' },
        ],
      },
      {
        title: 'Treino da Tina', info: 'Vê o vídeo uma vez, depois faz o circuito 3–4 voltas · descanso 60–90 s entre voltas', rounds: 4, rest: 75,
        videos: true,
        ex: [
          { n: 'Exercícios do vídeo', d: 'Repetições ou tempo do vídeo', l: 'KB 12 kg para pernas, swings e peso morto · KB 6 kg para braços, ombros e por cima da cabeça', tip: 'Se a técnica se perder no fim da volta, passa para a KB de 6 kg ou faz menos repetições. Qualidade primeiro.', q: '' },
        ],
      },
      {
        title: 'Retorno à calma', info: '4 min', rounds: 1, rest: 0,
        ex: [
          { n: 'Postura do pombo', d: '40 s por lado', l: '', tip: '', q: 'pigeon pose stretch' },
          { n: 'Alongamento de peito na porta', d: '30 s por lado', l: '', tip: '', q: 'doorway chest stretch' },
          { n: 'Postura da criança', d: '1 min', l: '', tip: 'Respiração lenta pelo nariz.', q: 'child pose' },
        ],
      },
    ],
  },
];

// Opções extra para escolher num dia
const EXTRAS = [
  { id: 'crossfit', name: 'CrossFit na box', emoji: '🏋️‍♀️', color: '#334155', focus: 'Aula de CrossFit', minutes: 60, extra: true,
    intro: 'Dia de aula. Não precisas de treinar em casa — no máximo 5 min de alongamentos à noite.' },
  { id: 'descanso', name: 'Descanso', emoji: '😴', color: '#94a3b8', focus: 'Descanso total', minutes: 0, extra: true,
    intro: 'Descansar também é treinar: é aqui que o músculo cresce. Uma caminhada leve é bem-vinda.' },
];

// Plano base: Segunda → Domingo
const DEFAULT_PLAN = ['gluteos-aco', 'bracos-rainha', 'corrida-turbo', 'kb-tina', 'bumbum-tonificado', 'corrida-zen', 'domingo-leve'];

const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const PROFILE = { born: 1983, weightKg: 68, crossfitPerWeek: 2 };
