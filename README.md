# Treino 2×/semana

Site estático com o plano de treino (A/B) adaptado a hérnias e à anca, com:

- instruções e cuidados de cada exercício, links para vídeos de demonstração e a opção de fixar um vídeo do YouTube ou uma imagem/GIF em cada exercício;
- registo de peso e repetições por série, em cada data;
- sugestão automática de progressão dupla e cálculo do aquecimento (50% × 6, 70% × 3);
- cronómetro de descanso;
- gráfico e tabela de evolução por exercício;
- lista de compras semanal (adultos sem carne + criança que come carne), editável, com campo para acrescentar alimentos e custo estimado;
- ementa de 7 dias (~1550 kcal, ~130 g de proteína por adulto) feita com a lista de compras;
- exportar/importar cópia de segurança em JSON.

Os dados ficam guardados no `localStorage` do browser.

Fotos dos exercícios em `img/`, do [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense / domínio público).

## Usar

Abre `index.html` no browser, ou publica com GitHub Pages (Settings → Pages → Deploy from branch).

## Lembra-me (lembretes falados)

Em [`lembretes/`](lembretes/) há uma app à parte: carregas no microfone e dizes, por exemplo, *"lembra-me de hora a hora de ir à InPost até às 16h"*. A app percebe o que tens de fazer, de quanto em quanto tempo e até quando, e lembra-te **em voz alta** (avisa também 15 min antes do prazo e à hora limite). Depois do aviso podes responder por voz: *"feito"*, *"adia 15 minutos"* ou *"apaga"*. Também dá para escrever.

Funciona no Chrome, Edge e Safari, enquanto a página estiver aberta. Com GitHub Pages fica em `…/lembretes/`.

### App Android

Para os avisos tocarem **com o ecrã desligado**, há uma app Android em [`android/`](android/), que usa a mesma interface e junta-lhe alarmes do sistema, a voz do Android e o reconhecimento de voz da Google. O GitHub Actions compila-a sozinho a cada alteração e publica o APK em **Releases → lembra-me** (`…/releases/download/lembra-me/Lembra-me.apk`).
