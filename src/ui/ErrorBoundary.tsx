import { Component, type ReactNode } from 'react';
import { wipeAll } from '../db/repo';

/** Erro de renderização vira uma saída (recarregar ou recomeçar), nunca tela branca. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="screen pad">
        <h1>Algo deu errado.</h1>
        <p className="muted">Recarregar costuma resolver. Se não resolver, apagar os dados recomeça o app do zero.</p>
        <button className="btn wide" onClick={() => location.reload()}>Recarregar</button>
        <button className="btn ghost wide" onClick={async () => { await wipeAll(); location.reload(); }}>Apagar dados e recomeçar</button>
      </main>
    );
  }
}
