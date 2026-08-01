/** Soma minutos a um horário "HH:MM" e devolve "HH:MM". */
export const addMinutes = (start: string, minutes: number) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(start.trim());
  if (!m || !minutes) return null;
  const total = Number(m[1]) * 60 + Number(m[2]) + minutes;
  const h = Math.floor((total % 1440) / 60);
  const mi = total % 60;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
};

/** Mostra a duração de forma amigável: 180 -> "3h", 90 -> "1h30". */
export const formatDuration = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};
