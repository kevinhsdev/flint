import { useNavigate } from 'react-router';

/** Aviso do modo demo: o app abre cheio de exemplo; daqui a pessoa monta o plano dela (a pesquisa apaga o exemplo). */
export function DemoBanner() {
  const nav = useNavigate();
  return (
    <div className="demo">
      <span>Dados de exemplo</span>
      <button onClick={() => nav('/bem-vindo')}>Montar meu plano</button>
    </div>
  );
}
