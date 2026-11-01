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
    'https://www.instagram.com/p/DZkZVB2j1v9/',
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
    id: 'tina-anca',
    name: 'Tina · Anca & Adutores',
    emoji: '🎬',
    color: '#d9467a',
    focus: 'Kettlebell · Força e mobilidade da anca',
    minutes: 40,
    kit: ['KB 12 kg', 'Caixa, banco ou sofá'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: força da anca e dos adutores, mobilidade e controlo do movimento. Só precisas de uma kettlebell. 3–4 séries de cada exercício, descanso o que precisares. Foco no controlo, na amplitude e na qualidade.',
    video: 'https://www.instagram.com/p/DfHtkg5kYlt/',
    blocks: [
      {
        title: 'Agachamento sumo com KB à frente', info: 'Suitcase Front-Hold Sumo Squats · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento sumo com KB à frente', d: '8 reps', l: 'KB 12 kg (a Tina usa 16 kg)', tip: 'KB segura pela pega, à frente do corpo. Pés afastados e virados para fora, desce devagar com o peito aberto e joelhos para fora.', q: 'kettlebell sumo squat' },
        ],
      },
      {
        title: 'Agachamento cossaco com apoio', info: 'Box-Assisted Cossack Squats · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento cossaco com apoio', d: '6 × 6 (6 de cada lado)', l: 'Apoio numa caixa, banco ou sofá · peso do corpo ou KB 6 kg', tip: 'Pernas bem afastadas, desce para um lado com a outra perna esticada e o pé a apontar para cima. Usa o apoio para controlar a descida e ir mais fundo.', q: 'box assisted cossack squat' },
        ],
      },
      {
        title: 'Peso morto escalonado + rotação', info: 'Staggered Deadlift + Rotation · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Peso morto escalonado + rotação', d: '6 × 6 (6 de cada lado)', l: 'KB 12 kg', tip: 'Um pé ligeiramente atrás (só o calcanhar levantado). Anca para trás com a KB junto à perna da frente, e ao subir roda o tronco com controlo.', q: 'kettlebell staggered stance deadlift rotation' },
        ],
      },
      {
        title: 'World\'s greatest stretch com apoio', info: 'Box-Assisted Greatest Hip Stretch · 3–4 séries', rounds: 4, rest: 0,
        ex: [
          { n: 'World\'s greatest stretch com apoio', d: '6 × 6 (6 de cada lado)', l: 'Mãos numa caixa, banco ou sofá', tip: 'Afundo grande, mãos no apoio, desce a anca e roda o tronco abrindo o braço para o teto. Movimento lento.', q: 'box assisted worlds greatest stretch' },
        ],
      },
      {
        title: 'Hip airplane com rotação', info: 'Hip Airplane Rotations · 3–4 séries', rounds: 4, rest: 0,
        ex: [
          { n: 'Hip airplane com rotação', d: '4–5 por perna (sugestão: a legenda não diz)', l: 'Peso do corpo · apoio na parede se for preciso', tip: 'Em equilíbrio numa perna, tronco inclinado à frente, abre e fecha a anca rodando o tronco. É difícil — até a Tina diz que precisa de praticar.', q: 'hip airplane exercise' },
        ],
      },
      {
        title: 'Final: animal flow', info: 'Para acabar · 3–5 min (sugestão: a legenda não diz quanto)', rounds: 1, rest: 0,
        ex: [
          { n: 'Animal flow', d: '3–5 min a fluir', l: 'Peso do corpo', tip: 'Movimentos no chão: beast (4 apoios com joelhos no ar), crab reach, rastejar. Calma e controlo, como no vídeo.', q: 'animal flow beginner' },
        ],
      },
    ],
  },
  {
    id: 'tina-bracos',
    name: 'Tina · Braços & Core',
    emoji: '🎬',
    color: '#9d4edd',
    focus: 'Kettlebell · Braços, ombros e core',
    minutes: 40,
    kit: ['KB 12 kg', 'KB 6 kg', 'Halteres 9 kg', 'Halteres 5 kg', 'Sofá ou banco'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: tronco superior e core, com foco no controlo e na qualidade do movimento. 3–4 séries de cada exercício, descanso o que precisares. A Tina usa 2 KB de 12 kg — onde ela usa duas KB, aqui usas um par de halteres.',
    video: 'https://www.instagram.com/p/DeEg3Dtnx1f/',
    blocks: [
      {
        title: 'Curl de bíceps ajoelhada com uma KB', info: 'One KB Kneeling Biceps Curl · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Curl de bíceps ajoelhada com uma KB', d: '10 reps', l: 'KB 6 kg (ou KB 12 kg segura com as duas mãos, se conseguires)', tip: 'Ajoelhada, glúteos apertados e tronco direito, para não balançar. Cotovelos colados ao corpo, desce devagar.', q: 'kneeling kettlebell biceps curl' },
        ],
      },
      {
        title: 'Flexões declinadas numa perna, mãos nos pesos', info: 'Dual KB Decline Single Leg Push-ups · 3–4 séries · descanso o necessário', rounds: 4, rest: 0,
        ex: [
          { n: 'Flexões declinadas numa perna', d: '5 × 5 (5 com cada perna no ar)', l: 'Mãos nos halteres de 9 kg (ou no chão) · pés no sofá', tip: 'É o exercício mais difícil 🔥. Pés em cima do sofá, uma perna no ar, corpo em prancha. Para facilitar: pés no chão, ou joelhos no chão, e vai subindo de nível.', q: 'decline single leg push up kettlebell' },
        ],
      },
      {
        title: 'Arnold press', info: 'Dual KB Arnold Press · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Arnold press', d: '8–10 reps', l: '2 halteres de 5 kg', tip: 'Começa com os pesos à frente do peito e as palmas viradas para ti. Ao subir, roda as palmas para a frente. Barriga firme, sem arquear as costas.', q: 'arnold press form' },
        ],
      },
      {
        title: 'Prancha Copenhagen', info: 'KB Copenhagen Plank · 3–4 séries', rounds: 4, rest: 0,
        ex: [
          { n: 'Prancha Copenhagen', d: '15–20 s por lado (sugestão: a legenda não diz)', l: 'Pé de cima no sofá ou banco · a Tina usa uma KB, vê no vídeo como', tip: 'Prancha lateral com a perna de cima apoiada no sofá e a de baixo no ar — trabalha os adutores e o core. Mais fácil: apoia o joelho em vez do pé.', q: 'copenhagen plank beginner' },
        ],
      },
      {
        title: 'Ponte de glúteos com press', info: 'Dual KB Glute Bridge Press · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Ponte de glúteos com press', d: '10 reps', l: '2 halteres de 5 kg (ou 9 kg)', tip: 'Fica em ponte com a anca alta e os glúteos apertados, e faz o press com os pesos acima do peito sem deixar a anca descer.', q: 'glute bridge dumbbell floor press' },
        ],
      },
      {
        title: 'Remada em avião com uma KB', info: 'Airplane Single KB Row · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Remada em avião com uma KB', d: '6 × 6 (6 de cada lado)', l: 'KB 6 kg para começar · KB 12 kg como a Tina', tip: 'Em equilíbrio numa perna, tronco à frente e a outra perna esticada atrás (como um avião). Puxa a KB para a anca. Mão livre na parede se for preciso.', q: 'single leg kettlebell row airplane' },
        ],
      },
      {
        title: 'Extra da Tina (opcional)', info: 'Ela acabou com peso morto e elevações na barra', rounds: 3, rest: 0, load: true,
        ex: [
          { n: 'Peso morto com KB', d: '8–10 reps (sugestão)', l: 'KB 12 kg', tip: 'Anca para trás, costas direitas, KB entre os pés. As elevações na barra ficam de fora porque não há barra em casa.', q: 'kettlebell deadlift form' },
        ],
      },
    ],
  },
  {
    id: 'tina-pernas',
    name: 'Tina · Legendary Legday',
    emoji: '🎬',
    color: '#e8505b',
    focus: 'Kettlebell · Pernas e glúteos',
    minutes: 40,
    kit: ['KB 12 kg', 'Halteres 9 kg'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: pernas com uma só kettlebell pesada, simples e eficaz, para quem tem pouco tempo. 4 séries de cada exercício, descanso o que precisares. Foco na forma e na execução. A Tina usa uma KB de 32 kg; aqui usas a de 12 kg com descida lenta.',
    video: 'https://www.instagram.com/p/DdRnHK2DWlz/',
    blocks: [
      {
        title: 'Agachamento com KB à frente', info: 'Front Suitcase Rack Squats · 4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento com KB à frente', d: '10 reps', l: 'KB 12 kg', tip: 'KB segura à frente do peito. Desce em 3 s, peito aberto, joelhos na direção dos pés, e sobe a empurrar o chão.', q: 'kettlebell front rack squat' },
        ],
      },
      {
        title: 'Peso morto escalonado', info: 'Staggered Stance Deadlift · 4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Peso morto escalonado', d: '8 × 8 (8 de cada lado)', l: 'KB 12 kg', tip: 'Um pé ligeiramente atrás (só o calcanhar levantado), quase todo o peso na perna da frente. Anca para trás, costas direitas, sobe a apertar o glúteo.', q: 'kettlebell staggered stance deadlift' },
        ],
      },
      {
        title: 'Afundo atrás alternado com KB à frente', info: 'Alternate Front Rack Reverse Lunges · 4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Afundo atrás alternado com KB à frente', d: '10 reps (alternadas)', l: 'KB 12 kg à frente do peito', tip: 'Passo grande para trás, joelho de trás quase a tocar no chão, peso no calcanhar da frente. Tronco direito.', q: 'kettlebell front rack reverse lunge' },
        ],
      },
      {
        title: 'Sumo high pull', info: 'Sumo High Pull · 4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Sumo high pull', d: '10 reps', l: 'KB 12 kg', tip: 'Pés afastados como no sumo, KB entre os pés. Estica as pernas com força e puxa a KB até ao peito com os cotovelos altos. A força vem das pernas e da anca.', q: 'kettlebell sumo high pull' },
        ],
      },
      {
        title: 'Peso morto', info: 'Deadlifts · 4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Peso morto', d: '10 reps', l: 'KB 12 kg (ou 2 halteres de 9 kg para mais peso)', tip: 'Anca para trás, costas direitas, KB entre os pés. Se for fácil, desce em 3–4 s ou usa os dois halteres de 9 kg.', q: 'kettlebell deadlift form' },
        ],
      },
      {
        title: 'Kettlebell swing', info: 'Swing · 4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Kettlebell swing', d: '10 reps', l: 'KB 12 kg', tip: 'Anca para trás como a fechar uma porta com o rabo, depois estala a anca. A KB flutua até à altura do peito — os braços só guiam.', q: 'russian kettlebell swing form' },
        ],
      },
    ],
  },
  {
    id: 'tina-pernas-solidas',
    name: 'Tina · Pernas Sólidas',
    emoji: '🎬',
    color: '#f97316',
    focus: 'Kettlebell · Pernas, glúteos e core',
    minutes: 40,
    kit: ['KB 12 kg', 'Halteres 9 kg', 'Parede ou cadeira'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: trabalho sólido de pernas com uma só kettlebell. Escolhe um peso desafiante e só repetições de qualidade. 3–4 séries de cada exercício, descanso o que precisares. A Tina usa uma KB de 24 kg; aqui usas a de 12 kg com descida lenta.',
    video: 'https://www.instagram.com/p/Db00kIfiEXB/',
    blocks: [
      {
        title: 'Agachamento escalonado com KB num ombro', info: 'Single KB Rack Staggered Squat · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento escalonado com KB num ombro', d: '8 × 8 (8 de cada lado)', l: 'KB 12 kg num ombro (rack)', tip: 'Um pé ligeiramente atrás (calcanhar levantado), KB apoiada no ombro do mesmo lado do pé da frente. A Tina diz: pernas e core a arder! Não deixes o tronco inclinar para o lado da KB.', q: 'kettlebell single rack staggered squat' },
        ],
      },
      {
        title: 'Agachamento + curtsy alternado', info: 'Squats + Alternate Curtsy Squat · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento + curtsy alternado', d: '10 reps (cada agachamento conta 1)', l: 'KB 12 kg ao peito', tip: 'Agachamento normal, depois um curtsy (perna de trás cruza na diagonal), alternando os lados. Como diz a Tina: cada agachamento conta como 1 repetição.', q: 'squat to curtsy lunge kettlebell' },
        ],
      },
      {
        title: 'Agachamento sumo com KB à frente', info: 'Front Suitcase Sumo Squats · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento sumo com KB à frente', d: '10 reps', l: 'KB 12 kg', tip: 'KB segura pela pega, à frente do corpo. Pés afastados e virados para fora, desce devagar com o peito aberto e joelhos para fora.', q: 'kettlebell sumo squat' },
        ],
      },
      {
        title: 'Peso morto romeno', info: 'Romanian Deadlifts · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Peso morto romeno com KB', d: '10 reps', l: 'KB 12 kg (ou 2 halteres de 9 kg para mais peso)', tip: 'Joelhos ligeiramente fletidos, anca para trás, KB junto às pernas. Sente o alongamento atrás da coxa e sobe a apertar os glúteos.', q: 'kettlebell romanian deadlift' },
        ],
      },
      {
        title: 'Shrimp squat', info: 'Shrimp Squat · movimento do dia · 3–4 séries · descanso o necessário', rounds: 4, rest: 0,
        ex: [
          { n: 'Shrimp squat', d: '5 × 5 (5 com cada perna)', l: 'Peso do corpo · mão na parede ou numa cadeira', tip: 'Numa perna, agarra o pé da outra perna atrás e desce devagar até o joelho de trás tocar no chão (põe uma almofada). Desafia equilíbrio, mobilidade e força — a Tina também está a praticar. Mais fácil: desce só até meio, com apoio.', q: 'shrimp squat beginner progression' },
        ],
      },
      {
        title: 'Swing com paragem', info: 'Dead Stop Swing · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Swing com paragem', d: '10 reps', l: 'KB 12 kg', tip: 'Cada swing começa com a KB parada no chão à tua frente. Puxa-a para trás entre as pernas, estala a anca, e volta a pousá-la no chão. Recomeça do zero em cada repetição.', q: 'dead stop kettlebell swing' },
        ],
      },
    ],
  },
  {
    id: 'tina-core',
    name: 'Tina · Core de Kettlebell',
    emoji: '🎬',
    color: '#0d9488',
    focus: 'Kettlebell · Corpo inteiro e core',
    minutes: 40,
    kit: ['KB 12 kg', 'KB 6 kg', 'Tapete'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: corpo inteiro com o core a trabalhar em todos os movimentos. A Tina usa uma KB de 12 kg — igual à vossa — e avisa que "esta pequena KB de 12 kg vai deixar-te humilde". 3–4 séries de cada exercício, descanso o que precisares. Movimentos técnicos: aprende-os primeiro com a KB de 6 kg.',
    video: 'https://www.instagram.com/p/Dbv23UACAI4/',
    blocks: [
      {
        title: 'Snatch com um braço + afundo atrás alternado', info: 'Single Arm KB Snatch into Alt Reverse Lunge · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Snatch com um braço + afundo atrás', d: '10 reps (cada snatch conta 1)', l: 'KB 12 kg como a Tina · KB 6 kg para aprender', tip: 'Snatch: a KB sobe numa só ação desde entre as pernas até ao braço esticado por cima da cabeça, sem bater no antebraço. Com a KB lá em cima, faz um afundo atrás e alterna a perna. Cotovelo trancado e olhar para a frente.', q: 'kettlebell snatch to reverse lunge' },
        ],
      },
      {
        title: 'Around the world', info: 'KB Around the World · estabilidade do core · 3–4 séries', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Around the world com KB', d: '10 × 10 (10 para cada lado)', l: 'KB 12 kg ou KB 6 kg', tip: 'De pé, passa a KB de uma mão para a outra à volta da cintura. Anca e ombros parados, barriga firme — é o core que trabalha.', q: 'kettlebell around the world' },
        ],
      },
      {
        title: 'Swing horizontal por cima da cabeça', info: 'Horizontal Overhead Swing · o mais difícil do dia · 3–4 séries', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Swing horizontal por cima da cabeça', d: '10 reps', l: 'KB 6 kg para começar · KB 12 kg como a Tina', tip: 'É o movimento mais desafiante do dia, segundo a Tina — vê o vídeo com atenção antes de tentar. Começa leve, com espaço livre à tua volta e a pega bem segura.', q: 'kettlebell overhead swing' },
        ],
      },
      {
        title: 'Half iron cross + swing com rotação', info: 'Half Iron Cross into Rotational Swing · 3–4 séries', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Half iron cross + swing com rotação', d: '10 reps', l: 'KB 6 kg para começar · KB 12 kg como a Tina', tip: 'Movimento técnico — até a Tina diz que precisa de praticar. Segue o vídeo, começa devagar e com pouco peso. A força vem da anca, não dos braços.', q: 'kettlebell half iron cross' },
        ],
      },
      {
        title: 'Windmill ajoelhada', info: 'Half Kneeling Windmill · 3–4 séries', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Windmill ajoelhada', d: '8 × 8 (8 de cada lado)', l: 'KB 6 kg (por cima da cabeça)', tip: 'Meio ajoelhada, KB esticada por cima da cabeça. Inclina o tronco para o lado até a mão livre tocar no chão, sempre a olhar para a KB. Braço de cima trancado.', q: 'half kneeling kettlebell windmill' },
        ],
      },
      {
        title: 'Extensão por cima da cabeça + halo', info: 'Overhead Extension into Halo · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Extensão por cima da cabeça + halo', d: '10 reps', l: 'KB 6 kg ou KB 12 kg', tip: 'Segura a KB pelas "orelhas": extensão de tríceps atrás da cabeça e depois uma volta completa à volta da cabeça (halo). Barriga firme, sem arquear a lombar.', q: 'kettlebell overhead extension halo' },
        ],
      },
      {
        title: 'Antes deste treino, a Tina fez (opcional)', info: '3 × 10 · elevações de pernas e agachamento à frente pesado', rounds: 3, rest: 0, load: true,
        ex: [
          { n: 'Elevação de pernas deitada', d: '10 reps', l: 'Peso do corpo', tip: 'A Tina faz pendurada numa barra. Sem barra em casa, faz deitada: lombar colada ao chão, sobe as pernas esticadas e desce devagar.', q: 'lying leg raise' },
          { n: 'Agachamento à frente', d: '10 reps', l: 'KB 12 kg', tip: 'O exercício favorito da Tina. KB ao peito, desce devagar e sobe com força.', q: 'kettlebell front squat' },
        ],
      },
    ],
  },
  {
    id: 'tina-kb-legday',
    name: 'Tina · KB Legday',
    emoji: '🎬',
    color: '#dc2626',
    focus: 'Kettlebell · Pernas e glúteos',
    minutes: 40,
    kit: ['KB 12 kg', 'KB 6 kg'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: "Legendary KB Legday", pernas com uma só kettlebell pesada. 3–4 séries de cada exercício, descanso o que precisares. Foco na forma e na execução. A Tina usa uma KB de 32 kg; aqui usas a de 12 kg com descida lenta. Bom para alternar com os outros dias de pernas.',
    video: 'https://www.instagram.com/p/DbdpSE1iNMF/',
    blocks: [
      {
        title: 'Agachamento sumo com KB à frente', info: 'Front Suitcase Hold Sumo Squats · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento sumo com KB à frente', d: '10 reps', l: 'KB 12 kg', tip: 'KB segura pela pega, à frente do corpo. Pés afastados e virados para fora, desce devagar com o peito aberto e joelhos para fora.', q: 'kettlebell sumo squat' },
        ],
      },
      {
        title: 'Agachamento com KB num ombro', info: 'Single Arm Front Rack Squats · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento com KB num ombro', d: '8 × 8 (8 de cada lado)', l: 'KB 12 kg num ombro (rack)', tip: 'KB apoiada num ombro, cotovelo junto ao corpo. Desce a direito sem deixar o tronco inclinar para o lado da KB — o core trabalha muito.', q: 'single arm kettlebell front rack squat' },
        ],
      },
      {
        title: 'Peso morto escalonado', info: 'Staggered Deadlift · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Peso morto escalonado', d: '8 × 8 (8 de cada lado)', l: 'KB 12 kg', tip: 'Um pé ligeiramente atrás (só o calcanhar levantado), quase todo o peso na perna da frente. Anca para trás, costas direitas, sobe a apertar o glúteo.', q: 'kettlebell staggered stance deadlift' },
        ],
      },
      {
        title: 'Agachamento cossaco alternado', info: 'Alt Lateral Cossack Squat · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento cossaco alternado', d: '10 reps (alternadas)', l: 'KB 6 kg ao peito, ou peso do corpo para começar', tip: 'Pernas bem afastadas, desce para um lado com a outra perna esticada e o pé a apontar para cima, e passa para o outro lado. Desce só até onde mantiveres o calcanhar no chão.', q: 'kettlebell cossack squat' },
        ],
      },
      {
        title: 'Afundo atrás', info: 'Reverse Lunges · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Afundo atrás com KB', d: '8 × 8 (8 com cada perna)', l: 'KB 12 kg ao peito', tip: 'Passo grande para trás, joelho de trás quase a tocar no chão, peso no calcanhar da frente. Tronco direito.', q: 'kettlebell reverse lunge' },
        ],
      },
      {
        title: 'Kettlebell swing', info: 'Swing · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Kettlebell swing', d: '10 reps', l: 'KB 12 kg', tip: 'Anca para trás como a fechar uma porta com o rabo, depois estala a anca. A KB flutua até à altura do peito — os braços só guiam.', q: 'russian kettlebell swing form' },
        ],
      },
    ],
  },
  {
    id: 'tina-mobilidade',
    name: 'Tina · Mobilidade Primeiro',
    emoji: '🎬',
    color: '#0891b2',
    focus: 'Kettlebell · Mobilidade, coordenação e força',
    minutes: 35,
    kit: ['KB 12 kg', 'KB 6 kg', 'Tapete'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: "mobilidade primeiro, ganhos depois". Músculos fortes não servem de nada se o corpo não se mexer bem. Circuito de 2–3 voltas, descanso o que precisares — sem pressa, a qualidade do movimento vale mais do que a velocidade. A Tina usa uma KB de 12 kg, igual à vossa.',
    video: 'https://www.instagram.com/p/DZSFut0mMs_/',
    blocks: [
      {
        title: 'Circuito', info: '2–3 voltas · faz os 6 exercícios seguidos · descanso o necessário entre voltas', rounds: 3, rest: 0, load: true,
        ex: [
          { n: 'Halo alternado + bottoms-up Z press', d: '10 reps (alternadas)', l: 'KB 6 kg para começar · KB 12 kg como a Tina', tip: 'Sentada no chão com as pernas esticadas (Z press). Halo à volta da cabeça e depois press com a KB de pernas para o ar (fundo para cima), alternando os braços. Pulso direito e aperta bem a pega.', q: 'kettlebell halo bottoms up z press' },
          { n: 'Afundo estático alternado + press', d: '10 reps (alternadas)', l: 'KB 6 kg ou KB 12 kg', tip: 'Exercício de coordenação "super desafiante", diz a Tina. Em posição de afundo, desce e sobe e faz o press por cima da cabeça, trocando de lado. Devagar e controlado.', q: 'kettlebell static lunge press' },
          { n: 'Crab reach alternado', d: '10 reps (alternadas)', l: 'Peso do corpo', tip: 'Sentada, mãos atrás e pés no chão. Sobe a anca e leva um braço por cima da cabeça para o lado oposto, a abrir o peito e o ombro. Alterna.', q: 'crab reach exercise' },
          { n: 'Cossack profundo com KB por cima da cabeça', d: '10 reps (alternadas)', l: 'KB 6 kg (ou peso do corpo para começar)', tip: 'Agachamento cossaco fundo com a KB esticada por cima da cabeça — é o mais difícil 💀. Desce só até onde mantiveres o calcanhar no chão e o braço esticado.', q: 'overhead cossack squat kettlebell' },
          { n: 'Flexões pike fechadas', d: '5–8 reps', l: 'Peso do corpo', tip: 'Anca bem alta (V invertido), mãos juntas. Desce a cabeça em direção ao chão entre as mãos e empurra. Trabalha ombros e tríceps. A Tina também está a praticar.', q: 'narrow pike push up' },
          { n: 'Windmill de pé', d: '6 × 6 (6 de cada lado)', l: 'KB 6 kg (por cima da cabeça)', tip: 'KB esticada por cima da cabeça, pés virados para o lado oposto. Inclina o tronco até a mão livre descer pela perna, sempre a olhar para a KB. Braço de cima trancado.', q: 'standing kettlebell windmill' },
        ],
      },
    ],
  },
  {
    id: 'tina-full-body',
    name: 'Tina · Full Body KB',
    emoji: '🎬',
    color: '#ca8a04',
    focus: 'Kettlebell · Corpo inteiro',
    minutes: 35,
    kit: ['KB 12 kg', 'KB 6 kg'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: "Monday grind", corpo inteiro com uma só kettlebell. 3–4 séries de cada exercício. A legenda não fala de descanso: descansa o que precisares. A Tina usa uma KB de 16 kg; aqui usas a de 12 kg.',
    video: 'https://www.instagram.com/reel/DDoxJoqhsGZ/',
    blocks: [
      {
        title: 'Swing lateral + swing com paragem', info: 'Alt Lateral to Dead Stop Swing · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Swing lateral alternado + swing com paragem', d: '10 reps (cada paragem conta 1)', l: 'KB 12 kg', tip: 'Alterna swings para um lado e para o outro, e termina com um swing que volta a pousar a KB no chão (paragem). Cada paragem conta como 1 repetição. Força da anca, braços só guiam.', q: 'kettlebell lateral swing dead stop swing' },
        ],
      },
      {
        title: 'Agachamento sumo + clean sumo', info: 'Sumo Squat into Sumo Clean · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento sumo + clean sumo', d: '12 reps', l: 'KB 12 kg', tip: 'Pés afastados e virados para fora. Agachamento sumo com a KB pela pega, e ao subir puxa-a até ao peito (clean), com os cotovelos para baixo. Desce-a com controlo.', q: 'kettlebell sumo squat to clean' },
        ],
      },
      {
        title: 'Swing lateral + clean com rotação', info: 'Lateral Swing into Rotational Clean · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Swing lateral + clean com rotação', d: '10 reps', l: 'KB 6 kg para aprender · KB 12 kg', tip: 'Swing para o lado e, a rodar o tronco e os pés, traz a KB ao ombro (clean). Movimento técnico: segue o vídeo e começa com a KB de 6 kg.', q: 'kettlebell rotational clean' },
        ],
      },
      {
        title: 'Afundo atrás alternado com KB por cima da cabeça', info: 'OH Alt Reverse Lunges · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Afundo atrás com KB por cima da cabeça', d: '10 reps (alternadas)', l: 'KB 6 kg (por cima da cabeça)', tip: 'KB esticada por cima da cabeça, braço trancado e barriga firme. Passo grande para trás e alterna as pernas. A Tina põe 🔥😮‍💨 — é duro.', q: 'overhead kettlebell reverse lunge' },
        ],
      },
      {
        title: 'Swing agachado com um braço + swing russo', info: 'SA Squat Swing into Russian Swing · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Swing agachado com um braço + swing russo', d: '10 reps', l: 'KB 12 kg', tip: 'Swing com um braço a partir de uma posição mais agachada, seguido de um swing russo (KB até à altura do peito). Troca de braço a meio ou na série seguinte. Costas direitas sempre.', q: 'single arm squat swing russian swing kettlebell' },
        ],
      },
    ],
  },
  {
    id: 'tina-legday-ofegante',
    name: 'Tina · Legday Sem Fôlego',
    emoji: '🎬',
    color: '#be123c',
    focus: 'Kettlebell · Pernas e glúteos com cardio',
    minutes: 40,
    kit: ['KB 12 kg', 'KB 6 kg', 'Degrau ou livro grosso'],
    by: 'tina',
    intro: 'Treino da @tinalovefitness, tal como está na publicação: "não é um legday normal — é treino de força, mas a deixar-te sem fôlego". 3–4 séries de cada exercício, descanso o que precisares. A Tina usa uma KB de 24 kg; aqui usas a de 12 kg.',
    video: 'https://www.instagram.com/p/DZkZVB2j1v9/',
    blocks: [
      {
        title: 'Agachamento com KB num ombro', info: 'Single Arm Rack Squats · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento com KB num ombro', d: '10 reps (troca de lado em cada série)', l: 'KB 12 kg num ombro (rack)', tip: 'KB apoiada num ombro, cotovelo junto ao corpo. Desce a direito sem deixar o tronco inclinar para o lado da KB.', q: 'single arm kettlebell rack squat' },
        ],
      },
      {
        title: 'Afundo alternado + swing', info: 'Alt Lunges Swing · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Afundo alternado + swing', d: '12 reps', l: 'KB 12 kg (KB 6 kg para aprender)', tip: 'Combina afundos alternados com swings — é aqui que fica "sem fôlego". Vê no vídeo a sequência da Tina. Costas direitas no swing, joelho de trás quase a tocar no chão no afundo.', q: 'kettlebell lunge swing' },
        ],
      },
      {
        title: 'Peso morto escalonado', info: 'Staggered Deadlift · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Peso morto escalonado', d: '8 × 8 (8 de cada lado)', l: 'KB 12 kg', tip: 'Um pé ligeiramente atrás (só o calcanhar levantado), quase todo o peso na perna da frente. Anca para trás, costas direitas, sobe a apertar o glúteo.', q: 'kettlebell staggered stance deadlift' },
        ],
      },
      {
        title: 'Agachamento sumo Zercher', info: 'Zercher Sumo Squat · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Agachamento sumo Zercher', d: '10 reps', l: 'KB 12 kg abraçada na dobra dos cotovelos', tip: 'Segura a KB junto ao peito, apoiada na dobra dos cotovelos (posição Zercher). Pés afastados e virados para fora, desce com o tronco direito e joelhos para fora.', q: 'kettlebell zercher sumo squat' },
        ],
      },
      {
        title: 'Curtsy em défice', info: 'Deficit Curtsy Lunges · 3–4 séries · descanso o necessário', rounds: 4, rest: 0, load: true,
        ex: [
          { n: 'Curtsy em défice', d: '8 × 8 (8 com cada perna)', l: 'KB 12 kg ou KB 6 kg ao peito · pé da frente num degrau ou livro', tip: 'Pé da frente em cima de um degrau baixo (défice = desces mais fundo). A perna de trás cruza na diagonal, como numa vénia. Joelho da frente alinhado com o pé.', q: 'deficit curtsy lunge' },
        ],
      },
      {
        title: 'Shrimp squat', info: 'Shrimp Squat · 3–4 séries · descanso o necessário', rounds: 4, rest: 0,
        ex: [
          { n: 'Shrimp squat', d: '3–5 por perna', l: 'Peso do corpo · mão na parede ou numa cadeira', tip: 'Numa perna, agarra o pé da outra atrás e desce devagar até o joelho de trás tocar no chão (põe uma almofada). A Tina também está a praticar. Mais fácil: desce só até meio, com apoio.', q: 'shrimp squat beginner progression' },
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
const DEFAULT_PLAN = ['tina-pernas', 'tina-bracos', 'corrida-turbo', 'tina-anca', 'tina-pernas-solidas', 'corrida-zen', 'tina-mobilidade'];

const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const PROFILE = { born: 1983, weightKg: 68, crossfitPerWeek: 2 };
