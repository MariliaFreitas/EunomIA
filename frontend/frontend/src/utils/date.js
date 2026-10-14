/**
 * Utilitários de data (fuso local do navegador, semana começando na segunda).
 */

const DAY_MS = 86400000;

/** Data local no formato AAAA-MM-DD (inputs type="date" e chaves de dia). */
export function localDateValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export const dayKey = (value) => localDateValue(new Date(value));

/** Data AAAA-MM-DD de `days` dias atrás. */
export function daysAgoValue(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateValue(date);
}

export function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function addMonths(value, amount) {
  const date = new Date(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return date;
}

/** Segunda-feira da semana de `value`. */
export function startOfWeek(value = new Date()) {
  const date = startOfDay(value);
  const weekday = (date.getDay() + 6) % 7; // 0 = segunda
  return addDays(date, -weekday);
}

export function isSameDay(a, b) {
  return dayKey(a) === dayKey(b);
}

export function isToday(value) {
  return isSameDay(value, new Date());
}

/** Dias da semana (segunda a domingo) a partir de uma data qualquer. */
export function weekDays(value) {
  const start = startOfWeek(value);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Grade do mês: semanas completas (segunda a domingo) que cobrem o mês. */
export function monthGrid(value) {
  const first = new Date(value);
  first.setDate(1);
  const start = startOfWeek(first);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const end = addDays(startOfWeek(last), 6);
  const days = Math.round((startOfDay(end) - start) / DAY_MS) + 1;
  return Array.from({ length: days }, (_, index) => addDays(start, index));
}

/** Minutos desde a meia-noite (para posicionar eventos na grade). */
export function minutesOfDay(value) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

export function diffInMinutes(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 60000);
}

// ---- Formatação (pt-BR) ---------------------------------------------------

const fmt = (options) => new Intl.DateTimeFormat("pt-BR", options);
const timeFormatter = fmt({ hour: "2-digit", minute: "2-digit" });
const dateTimeFormatter = fmt({ weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const shortDateFormatter = fmt({ weekday: "short", day: "2-digit", month: "2-digit" });
const longDateFormatter = fmt({ weekday: "long", day: "numeric", month: "long" });
const fullDateFormatter = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const monthYearFormatter = fmt({ month: "long", year: "numeric" });
const weekdayShortFormatter = fmt({ weekday: "short" });
const dayMonthFormatter = fmt({ day: "numeric", month: "short" });

const valid = (value) => value && !Number.isNaN(new Date(value).getTime());
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const clean = (text) => text.replace(/\./g, "");

/** Ex.: "qua., 14 de out., 16:30". */
export function formatDate(value) {
  return valid(value) ? dateTimeFormatter.format(new Date(value)) : "";
}

/** Ex.: "16:30". */
export function formatTime(value) {
  return valid(value) ? timeFormatter.format(new Date(value)) : "";
}

/** Ex.: "16:30 – 17:30"; sem término, só o início. */
export function formatTimeRange(start, end) {
  if (!valid(start)) return "";
  return end && valid(end) ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** Ex.: "Quarta-feira, 14 de outubro". */
export function formatLongToday(date = new Date()) {
  return capitalize(longDateFormatter.format(date));
}

/** Ex.: "Quarta-feira, 14 de outubro de 2026". */
export function formatFullDate(value) {
  return valid(value) ? capitalize(fullDateFormatter.format(new Date(value))) : "";
}

/** Ex.: "Outubro de 2026". */
export function formatMonthYear(value) {
  return capitalize(monthYearFormatter.format(new Date(value)));
}

/** Ex.: "Seg". */
export function formatWeekdayShort(value) {
  return capitalize(clean(weekdayShortFormatter.format(new Date(value))));
}

/** Ex.: "14 out". */
export function formatDayMonth(value) {
  return clean(dayMonthFormatter.format(new Date(value)));
}

/** "Hoje", "Amanhã", "Ontem" ou "sex., 16/10". */
export function formatRelativeDay(value) {
  if (!valid(value)) return "";
  const days = Math.round((startOfDay(value) - startOfDay(new Date())) / DAY_MS);
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  if (days === -1) return "Ontem";
  return shortDateFormatter.format(new Date(value));
}

/** "Hoje, 16:30" / "Amanhã, 09:00" / "sex., 16/10, 18:00". */
export function formatRelativeDateTime(value) {
  return valid(value) ? `${formatRelativeDay(value)}, ${formatTime(value)}` : "";
}

/** Saudação neutra pelo horário. */
export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Boa noite";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
