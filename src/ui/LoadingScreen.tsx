import mark from '../../brand/flint-mark.svg';
import { APP_NAME } from '../brand';
import { Mascot } from '../mascots/Mascot';

/** Tela de carregamento: bloco vermelho com a marca, uma barra correndo e os 3 mascotes subindo enquanto o banco abre. */
export function LoadingScreen({ leaving }: { leaving: boolean }) {
  return (
    <div className={`loading${leaving ? ' out' : ''}`} role="status" aria-label={`Carregando ${APP_NAME}`}>
      <div className="loading-brand">
        <span className="loading-mark"><img src={mark} alt="" width={64} height={64} /></span>
        <div className="loading-word">{APP_NAME}</div>
        <div className="loading-tag">treino · água · evolução</div>
        <div className="loading-bar"><i /></div>
      </div>
      <div className="loading-crew">
        <span style={{ animationDelay: '160ms' }}><Mascot kind="gota" size={64} interactive={false} /></span>
        <span style={{ animationDelay: '60ms' }}><Mascot kind="faisca" size={84} interactive={false} /></span>
        <span style={{ animationDelay: '260ms' }}><Mascot kind="pedra" size={64} interactive={false} /></span>
      </div>
    </div>
  );
}
