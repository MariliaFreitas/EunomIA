# EunomIA — Frontend

Interface React (Vite) da EunomIA.

## Executar

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve o build
```

Configuração opcional: copie `.env.example` para `.env.local`.

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Endereço da API FastAPI |
| `VITE_USE_MOCKS` | `false` | `true` ativa o modo demonstração |

Variáveis `VITE_*` ficam visíveis no navegador: nunca coloque segredos nelas.

## Modo demonstração

```bash
VITE_USE_MOCKS=true npm run dev
```

No PowerShell: `$env:VITE_USE_MOCKS="true"; npm run dev`.

Usa dados fictícios locais (`src/mocks/`). Nenhuma requisição é feita ao backend e as ações
(concluir pendência, confirmar compromisso, varredura, chat) são simuladas em memória.
A interface mostra o selo **Modo demonstração**. Recarregar a página restaura os dados.

## Estrutura

```
src/
├── App.jsx              provedores + roteamento por hash (#agenda/<id> abre um evento)
├── config.js            variáveis de ambiente
├── routes.js            as seis páginas da sidebar
├── components/
│   ├── ui/              Button, Badge, Panel, EmptyState, UnavailableState, Skeleton, StatusDot,
│   │                    Modal, Alert, SegmentedControl, ProgressBar
│   ├── layout/          AppShell, Sidebar, Topbar, SearchBox, Brand
│   ├── agenda/          EventBlock, WeekStrip, DayTimeline, WeekGrid, MiniMonth, EventDetails, CategoryLegend
│   ├── tasks/           TaskItem (lista), TaskBoard (quadro)
│   ├── conflicts/       ConflictCard
│   ├── assistant/       ChatThread, ChatComposer, AssistantQuick, sugestões
│   ├── dashboard/       StatStrip, WeekSummary, GoogleSyncCard
│   └── domain/          PageHeader, ResourceState, ScanDialog
├── context/             AppDataContext (dados compartilhados) e ToastContext
├── hooks/               useHashRoute, useResource
├── services/            endpoints.js, http.js, realApi.js, index.js
├── mocks/               dados e API simulados do modo demonstração
├── pages/               Dashboard, Assistente, Agenda, Pendências, Conflitos, Configurações
├── styles/              tokens.css (identidade visual) e base.css
└── utils/               datas, semanas, pares de conflito, prioridade e seções de pendências
```

## Identidade visual

Todas as cores, fontes, espaçamentos e sombras estão em `src/styles/tokens.css`.
Dark Green (#0A3323) na sidebar e no assistente; Midnight Green (#105666) em ações e links;
fundo creme (#FFFAF0) com superfícies brancas. Moss, Rust, Rosy Brown, Bleu Porcelaine e
Miel Doré são usadas apenas com função (categorias de evento, prioridade, estados).
Moss Green não tem contraste suficiente como texto: aparece só como preenchimento.

## Dados derivados no frontend

- **Prioridade da pendência:** usa `priority` quando a API enviar; senão é estimada pelo prazo
  (vencida ou em até 24h = alta, até 3 dias = média, depois = baixa) e sinalizada como estimada.
- **Status "Em andamento":** enviado como `in_progress` (contrato a confirmar com o backend).
- **Última varredura:** a API não informa; o frontend registra a última varredura feita neste navegador.
- **Pares de conflito:** montados a partir de `conflicts_with` de cada compromisso.

## Integração com o backend

`src/services/endpoints.js` lista cada rota com `available: true/false`.
Rotas indisponíveis **não são chamadas**; as telas mostram "Aguardando integração com o backend".
Quando uma rota for publicada, confirme o contrato e troque `available` para `true`.
