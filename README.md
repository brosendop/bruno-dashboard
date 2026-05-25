# Bruno Dashboard

Dashboard diário pessoal com objetivos, notícias, agendas e treinos.

## Deploy na Vercel

### 1. GitHub
1. Vai a github.com → "New repository" → nome: `bruno-dashboard`
2. Faz upload de todos estes ficheiros (arrasta a pasta)
3. Clica "Commit changes"

### 2. Vercel
1. Vai a vercel.com → "Add New Project"
2. Importa o repositório `bruno-dashboard` do GitHub
3. Em **Environment Variables**, adiciona:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (a tua chave da Anthropic)
4. Clica "Deploy"

### 3. Resultado
O dashboard fica disponível em `https://bruno-dashboard.vercel.app` (ou nome personalizado).

## Estrutura
```
bruno-dashboard/
├── public/
│   └── index.html        # Dashboard principal
├── api/
│   └── noticias.js       # Proxy seguro para a Anthropic API
├── vercel.json           # Configuração Vercel
└── README.md
```

## Calendários incluídos
- **Pessoal**: brosendop@gmail.com + 4 calendários de grupo
- **SOLVE**: bruno@solve.pt
- **FITGOLFE**: geral@fitgolfe.pt + calendário de grupo

## Funcionalidades
- ✦ Objetivos de vida editáveis (checks reiniciam todos os dias)
- 📰 Notícias do dia via Claude AI (Mundo, Geopolítica, Portugal)
- 📅 7 calendários Google integrados com vista por empresa
- 🏃 Registo de treinos semanal com histórico
