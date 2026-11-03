# Auditor SEO de Textos (Lidl / Esmara)

Site estático para auditar textos de **categorias** e **produtos** (pt-PT) e melhorá-los segundo as boas práticas de SEO.

## O que faz

- **Análise SEO automática** (sem IA, corre no browser) com pontuação de 0 a 100, por grupo:
  - Palavra-chave: presença nas primeiras 100 palavras, densidade, keywords secundárias, keyword em subtítulos;
  - Metadados: meta title (comprimento, keyword, "| Lidl"), meta description (comprimento, keyword, CTA), slug;
  - Estrutura: H1, subtítulos H2/H3, links internos e âncoras, listas;
  - Legibilidade: índice Flesch adaptado ao português, frases longas, parágrafos, voz passiva, conectores;
  - Conteúdo: comprimento por tipo de página, informação essencial (materiais, tamanhos, cuidados…), cobertura semântica do domínio, FAQ;
  - Marca e linguagem: grafia consistente da marca (ex.: Esmara), termos de português do Brasil, superlativos e alegações arriscadas.
- **Pré-visualização no Google** e lista de prioridades ("o que mudar primeiro").
- **Texto corrigido**: rascunho automático, ou versão completa reescrita por IA (metadados, H1, slug, corpo com H2/listas/links e FAQ), com comparação lado a lado com o original. Podes guardá-la como nova versão e ver a pontuação a subir.
- **Concorrência**: cola textos de concorrentes para comparar estrutura e comprimento e ver os termos que eles usam e tu não. Com IA, a ferramenta pesquisa na web quem aparece no Google Portugal para a keyword e o que está a fazer bem.
- **Visão geral** de todos os textos: pontuações, problemas mais frequentes, conteúdo duplicado, canibalização de keywords, títulos repetidos, plano de melhoria priorizado e relatório global com IA. Também exporta o relatório em CSV.
- **Importar CSV** (vários textos de uma vez), exportar e importar cópia de segurança em JSON. Os dados ficam no `localStorage` do browser.

## IA (opcional)

Em **Definições**, coloca uma chave da API da Anthropic. Usa o modelo Claude Opus 5.5 por defeito (podes escolher Sonnet 5.5 ou Fable 5.1). A chave fica só no teu browser e é enviada diretamente para a API da Anthropic. A pesquisa da concorrência usa a ferramenta de pesquisa web, que tem de estar ativa na consola da Anthropic.

## Usar

Publica com GitHub Pages e abre `/seo-lidl/`. Em local, serve a pasta com `python3 -m http.server` e abre `http://localhost:8000/seo-lidl/` (os módulos ES não funcionam abrindo o ficheiro diretamente).
