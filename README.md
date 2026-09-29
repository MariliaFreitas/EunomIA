# EunomIA

Protótipo de um agente de agenda que reúne calendário, contexto de e-mails e pendências numa única interface. A primeira versão segue a arquitetura monolítica definida: React, FastAPI, SQLite, Gemini e integrações OAuth com Gmail e Google Calendar. A agenda e as regras de conflito ficam no backend; o Gemini interpreta mensagens e consolida conversas quando uma chave está configurada.

## Requisitos

- Python 3.10 ou superior
- Node.js 20 ou superior e npm
- Para integrações reais: credenciais OAuth do Google
- Opcional: chave da Gemini API

## Iniciar localmente

Abra dois terminais na raiz do projeto.

### API

```powershell
cd backend
Copy-Item .env.example .env
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

A API e a documentação interativa ficam em <http://localhost:8000> e <http://localhost:8000/docs>. O banco SQLite `backend/eunomia.db` e alguns registros demonstrativos são criados no primeiro início.

### Interface

```powershell
cd frontend
npm install
npm run dev
```

Abra <http://localhost:5173>.

## Testes

Com as dependências de desenvolvimento instaladas:

```powershell
cd backend
python -m unittest discover -s tests -v
```

## Google OAuth

1. No Google Cloud Console, habilite Gmail API e Google Calendar API e configure a tela de consentimento OAuth.
2. Crie um OAuth Client ID do tipo **Web application**.
3. Cadastre `http://localhost:8000/api/integrations/google/callback` como URI de redirecionamento autorizada.
4. Informe `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `backend/.env`.
5. Reinicie a API, use **Conectar** na interface e autorize a conta. Use **Sincronizar** para importar os eventos dos últimos 30 dias/próximos 90 dias e os e-mails recentes.

O consentimento solicita leitura do Gmail e acesso de leitura e escrita ao Google Calendar. O token OAuth é armazenado no SQLite local; mantenha o arquivo do banco fora do controle de versão.

## Gemini

Preencha `GEMINI_API_KEY` em `backend/.env` para interpretação de mensagens e consolidação de threads. Sem essa chave, a aplicação continua demonstrável com interpretação local básica para consultas, criação e alteração de compromissos. A extração automática a partir de e-mails usa a Gemini API.

## O que já funciona

- Visão semanal, cartões de compromissos detectados, pendências e conflitos.
- Detecção de sobreposição de horários e priorização por regras explícitas do backend.
- Criação de compromissos por formulário ou chatbot; alteração pelo chatbot.
- Consultas conversacionais sobre agenda, pendências, compromissos detectados e conflitos.
- Conexão OAuth, sincronização Gmail/Google Calendar, agrupamento por thread e associação de e-mails a compromissos.
- SQLite com usuários, eventos, pendências, mensagens e relacionamento entre e-mails e eventos.

## Limites desta versão

O protótipo usa um usuário local demonstrativo; login próprio, isolamento multiusuário, remoção/desconexão de credenciais, atualização incremental em segundo plano, notificações e voz ainda não fazem parte do MVP. A interpretação sem Gemini cobre apenas comandos e consultas comuns e serve como fallback de demonstração. As decisões de conflito e prioridade são sempre tomadas por regras no backend.
