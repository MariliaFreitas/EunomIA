import { dayKey, minutesOfDay } from "../../utils/date.js";
import { eventEnd, sortByStart } from "../../utils/records.js";

export const HOUR_HEIGHT = 56; // px por hora nas grades

/** Agrupa eventos por dia (AAAA-MM-DD). */
export function groupByDay(events) {
  const map = new Map();
  for (const event of sortByStart(events)) {
    const key = dayKey(event.starts_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  }
  return map;
}

/** Janela de horas a exibir: pelo menos 8h–18h, ampliada pelos eventos. */
export function hourRange(events, { min = 8, max = 18, minSpan = 0 } = {}) {
  let start = min;
  let end = max;
  for (const event of events) {
    start = Math.min(start, Math.floor(minutesOfDay(event.starts_at) / 60));
    const finish = eventEnd(event).end;
    const finishHour = Math.ceil(minutesOfDay(finish) / 60) || 24;
    end = Math.max(end, Math.min(24, finishHour));
  }
  if (end - start < minSpan) end = Math.min(24, start + minSpan);
  return { start, end };
}

/**
 * Posiciona os eventos de um dia: topo/altura em px e "faixas" lado a lado
 * quando há sobreposição (para nada ficar escondido).
 */
export function layoutDay(events, startHour, hourHeight = HOUR_HEIGHT) {
  const items = sortByStart(events).map((event) => {
    const { end, estimated } = eventEnd(event);
    const startMin = minutesOfDay(event.starts_at);
    let endMin = minutesOfDay(end);
    if (endMin <= startMin) endMin = 24 * 60; // termina depois da meia-noite
    return { event, startMin, endMin, estimated };
  });

  const lanesEnd = [];
  const clusters = [];
  let cluster = null;
  let clusterEnd = -1;

  for (const item of items) {
    if (!cluster || item.startMin >= clusterEnd) {
      cluster = [];
      clusters.push(cluster);
      lanesEnd.length = 0;
      clusterEnd = -1;
    }
    let lane = lanesEnd.findIndex((laneEnd) => laneEnd <= item.startMin);
    if (lane === -1) {
      lane = lanesEnd.length;
      lanesEnd.push(item.endMin);
    } else {
      lanesEnd[lane] = item.endMin;
    }
    item.lane = lane;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }

  for (const group of clusters) {
    const lanes = Math.max(...group.map((item) => item.lane)) + 1;
    for (const item of group) item.lanes = lanes;
  }

  return items.map((item) => ({
    ...item,
    top: ((item.startMin - startHour * 60) / 60) * hourHeight,
    height: Math.max(((item.endMin - item.startMin) / 60) * hourHeight, 24),
  }));
}
