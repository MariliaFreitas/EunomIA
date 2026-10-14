/**
 * Dados FICTÍCIOS do modo demonstração (VITE_USE_MOCKS=true).
 * Inspirados no exemplo `extracted_events_deadlines.json` do repositório.
 * As datas são relativas ao dia atual para que a demonstração esteja sempre "em dia".
 * Os formatos seguem MeetingRecord e TaskDeadlineRecord de backend/app/models.py.
 */

function at(dayOffset, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function createMockUser() {
  return { name: "Ana Martins", firstName: "Ana", email: "demo@eunomia.app" };
}

export function createMockGoogleStatus() {
  return { connected: true, email: "demo@eunomia.app" };
}

// [dia, início, duração em min (null = sem término), título, status, origem, local, link, participantes]
const EVENT_ROWS = [
  [-6, "10:00", 60, "Planejamento da sprint", "confirmed", "calendar", null, "meet", ["Equipe EunomIA"]],
  [-3, "15:00", 45, "Revisão de requisitos com o cliente", "confirmed", "calendar", null, "meet", ["Ana Martins", "Diego Alves"]],
  [-1, "09:00", 15, "Daily da equipe", "confirmed", "calendar", null, "meet", ["Equipe EunomIA"]],
  [0, "09:00", 15, "Daily da equipe", "confirmed", "calendar", null, "meet", ["Equipe EunomIA"]],
  [0, "10:00", 60, "Revisão do material — Projeto Aurora", "confirmed", "calendar", "Sala 2 — Bloco A", null, ["Bruno Lima", "Camila Rocha"]],
  [0, "16:30", 60, "Alinhamento da integração — Projeto Aurora", "confirmed", "calendar", null, "meet", ["Ana Martins", "Bruno Lima", "Camila Rocha", "Fernanda Costa"]],
  [0, "17:00", null, "Comitê de Segurança", "confirmed", "calendar", "Sala 3 — Bloco B", null, ["Camila Rocha"]],
  [1, "09:00", 15, "Daily da equipe", "confirmed", "calendar", null, "meet", ["Equipe EunomIA"]],
  [1, "14:00", 60, "Revisão do roteiro de homologação", "detected", "email", null, "meet", ["Bruno Lima", "Camila Rocha"]],
  [1, "14:30", 60, "Mentoria do TCC", "confirmed", "calendar", "Laboratório 2", null, ["Profa. Helena Souza"]],
  [2, "09:00", 15, "Daily da equipe", "confirmed", "calendar", null, "meet", ["Equipe EunomIA"]],
  [2, "11:15", 45, "Reunião com a orientadora", "confirmed", "calendar", "Sala dos professores", null, ["Profa. Helena Souza"]],
  [3, "10:00", 60, "Entrega parcial do projeto acadêmico", "detected", "email", "Auditório principal", null, ["Turma de Engenharia de Software"]],
  [3, "13:00", 60, "Planejamento da próxima semana", "confirmed", "calendar", null, null, ["Ana Martins"]],
  [6, "10:00", 90, "Workshop de estratégia", "confirmed", "calendar", "Coworking central", null, ["Equipe EunomIA", "Diego Alves"]],
  [9, "14:00", 60, "Apresentação para a banca", "detected", "email", "Sala de defesas", null, ["Banca avaliadora"]],
  [12, "09:30", 60, "Retrospectiva da sprint", "confirmed", "calendar", null, "meet", ["Equipe EunomIA"]],
];

/**
 * Preenche `conflict` e `conflicts_with` como a API faria
 * (mesma convenção de backend/app/features/conflict_management.py:
 * sem término → 60 minutos e conflito "possível").
 */
function withConflicts(events) {
  const interval = (event) => {
    const start = new Date(event.starts_at);
    const known = event.ends_at || event.duration_minutes;
    const end = event.ends_at
      ? new Date(event.ends_at)
      : new Date(start.getTime() + (event.duration_minutes || 60) * 60000);
    return { start, end, known: Boolean(known) };
  };
  const active = events.filter((event) => event.status !== "cancelled");
  for (const event of events) event.conflicts_with = [];
  active.forEach((first, index) => {
    const a = interval(first);
    for (const second of active.slice(index + 1)) {
      const b = interval(second);
      if (a.start < b.end && b.start < a.end) {
        const certainty = a.known && b.known ? "confirmed" : "possible";
        first.conflicts_with.push({ id: second.id, title: second.title, certainty });
        second.conflicts_with.push({ id: first.id, title: first.title, certainty });
      }
    }
  });
  for (const event of events) event.conflict = event.conflicts_with.length > 0;
  return events;
}

export function createMockEvents() {
  const events = EVENT_ROWS.map(([day, time, duration, title, status, source, location, link, participants], index) => {
    const start = at(day, time);
    return {
      id: `demo-evt-${index + 1}`,
      title,
      starts_at: start.toISOString(),
      ends_at: duration ? new Date(start.getTime() + duration * 60000).toISOString() : null,
      duration_minutes: duration,
      status,
      source,
      location,
      link: link ? `https://meet.google.com/demo-${index + 1}` : null,
      participants,
    };
  });
  return withConflicts(events);
}

// [dia, hora | null, título, responsável, referência de prazo, prioridade, status, evento]
const TASK_ROWS = [
  [0, "16:30", "Revisar seções 4.2 e 4.5 do Plano de Integração", "Você", "Antes da reunião de alinhamento", "alta", "pending", "demo-evt-6"],
  [0, "10:00", "Confirmar participação na reunião de alinhamento", "Fernanda Costa", null, null, "pending", "demo-evt-6"],
  [null, null, "Discutir defeito crítico em arquivos acima de 20 MB", "Equipe da reunião", "Durante a reunião", "alta", "pending", "demo-evt-6"],
  [2, "18:00", "Enviar relatório de testes ao cliente", "Você", null, "media", "in_progress", null],
  [4, "12:00", "Atualizar a documentação do frontend", "Você", null, "baixa", "pending", null],
  [8, "18:00", "Preparar slides da apresentação para a banca", "Você", null, null, "in_progress", "demo-evt-16"],
  [-1, "12:00", "Consolidar evidências dos testes críticos", "Camila Rocha", null, null, "done", null],
  [-1, "11:00", "Disponibilizar versão candidata para homologação", "Bruno Lima", null, null, "done", null],
];

export function createMockTasks() {
  return TASK_ROWS.map(([day, time, title, responsible, reference, priority, status, eventId], index) => ({
    id: `demo-task-${index + 1}`,
    title,
    responsible,
    due_at: day === null ? null : at(day, time).toISOString(),
    deadline_reference: reference,
    priority,
    status,
    source: "email",
    event_id: eventId,
  }));
}

/** Respostas prontas do assistente simulado (sem IA real). */
export const MOCK_REPLIES = [
  {
    keywords: ["livre", "horário", "horario", "disponív", "disponiv"],
    reply:
      "Amanhã você tem janelas livres das 10h às 14h e depois das 15h30. Na sexta, a manhã está livre até as 10h.",
  },
  {
    keywords: ["semana", "resum"],
    reply:
      "Resumo da semana: o ponto de maior atenção é hoje à tarde, quando o Alinhamento do Projeto Aurora pode se sobrepor ao Comitê de Segurança. Amanhã há um conflito confirmado entre a Revisão do roteiro e a Mentoria do TCC.",
  },
  {
    keywords: ["conflito", "sobrepo", "choque"],
    reply:
      "Encontrei 2 conflitos: hoje, o Alinhamento do Projeto Aurora pode se sobrepor ao Comitê de Segurança; amanhã, a Revisão do roteiro coincide com a Mentoria do TCC. Veja os detalhes em Conflitos.",
  },
  {
    keywords: ["pendên", "penden", "tarefa", "fazer", "organiz"],
    reply:
      "Sugiro começar pela revisão das seções 4.2 e 4.5 do Plano de Integração, que vence hoje às 16h30. Em seguida, finalize o relatório de testes, previsto para depois de amanhã.",
  },
  {
    keywords: ["hoje", "agenda", "compromisso", "reuni"],
    reply:
      "Hoje você tem a Daily às 9h, a Revisão do material às 10h, o Alinhamento da integração às 16h30 e o Comitê de Segurança às 17h.",
  },
];

export const MOCK_FALLBACK_REPLY =
  "Esta é uma resposta simulada do modo demonstração. Experimente perguntar sobre sua semana, pendências, conflitos ou horários livres.";
