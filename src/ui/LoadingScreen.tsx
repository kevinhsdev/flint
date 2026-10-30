import mark from '../../brand/flint-mark.svg';
import { APP_NAME } from '../brand';
import { Mascot } from '../mascots/Mascot';

/** Tela de carregamento: a marca e os 3 mascotes entrando enquanto o banco abre. */
export function LoadingScreen({ leaving }: { leaving: boolean }) {
  return (
    <div className={`loading${leaving ? ' out' : ''}`} role="status" aria-label={`Carregando ${APP_NAME}`}>
      <img src={mark} alt="" width={88} height={88} className="loading-mark" />
      <div className="loading-word">{APP_NAME}</div>
      <div className="loading-crew">
        <span style={{ animationDelay: '120ms' }}><Mascot kind="gota" size={58} interactive={false} /></span>
        <span style={{ animationDelay: '0ms' }}><Mascot kind="faisca" size={74} interactive={false} /></span>
        <span style={{ animationDelay: '240ms' }}><Mascot kind="pedra" size={58} interactive={false} /></span>
      </div>
    </div>
  );
}
