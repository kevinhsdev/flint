import type { ReactNode } from 'react';
import { photoUrl, type PhotoId } from '../domain/photos';

interface Props {
  /** sem foto, o cartão é vermelho */
  photo?: PhotoId;
  eyebrow: string;
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  /** mascote espiando por cima do canto direito */
  peek?: ReactNode;
  children?: ReactNode;
}

/** Cartão-destaque estilo App Store: foto com zoom lento, título grande em branco e ação embaixo. */
export function FeatureCard({ photo, eyebrow, title, meta, action, peek, children }: Props) {
  return (
    <div className={`feat-wrap${peek ? ' has-peek' : ''}`} data-photo={photo ?? 'none'}>
      {peek && <div className="feat-peek">{peek}</div>}
      <section className={`feat${photo ? '' : ' red'}`}>
        {photo && <div className="feat-ph" aria-hidden="true" style={{ backgroundImage: `url(${photoUrl(photo)})` }} />}
        <div className="feat-top">
          <div className="feat-eyb">{eyebrow}</div>
          <h2>{title}</h2>
          {children}
        </div>
        {(meta || action) && <div className="feat-bot"><div className="feat-meta">{meta}</div>{action}</div>}
      </section>
    </div>
  );
}
