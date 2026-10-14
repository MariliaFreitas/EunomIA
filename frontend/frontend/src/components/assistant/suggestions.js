import { CalendarSearch, CircleCheckBig, Clock, TriangleAlert } from "lucide-react";

/** Sugestões de comandos do assistente (texto enviado como mensagem). */
export const SUGGESTIONS = [
  { id: "week", label: "Resumir minha semana", icon: CalendarSearch },
  { id: "tasks", label: "Organizar minhas pendências", icon: CircleCheckBig },
  { id: "free", label: "Encontrar horários livres", icon: Clock },
  { id: "conflicts", label: "Quais conflitos tenho?", icon: TriangleAlert },
];
