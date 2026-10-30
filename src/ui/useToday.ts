import { useEffect, useState } from 'react';
import { localDay } from '../domain/dates';

/** Dia local que vira sozinho: à meia-noite com o app aberto e quando o PWA volta do segundo plano. */
export function useToday(): string {
  const [day, setDay] = useState(() => localDay(new Date()));
  useEffect(() => {
    const sync = () => setDay(localDay(new Date()));
    const now = new Date();
    const timer = setTimeout(sync, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime() + 1000);
    document.addEventListener('visibilitychange', sync);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', sync); };
  }, [day]);
  return day;
}
