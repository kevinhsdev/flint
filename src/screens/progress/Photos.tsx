import { useEffect, useMemo, useState } from 'react';
import { addPhoto, deletePhoto } from '../../db/repo';
import { localDay, parseDay } from '../../domain/dates';
import type { Photo } from '../../domain/types';
import { Empty } from '../../ui/Empty';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';

const MAX_PX = 1600;

/** Reduz a foto pra no máximo 1600 px no lado maior, em JPEG 0,85. */
export async function shrink(file: Blob): Promise<Blob> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, MAX_PX / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  img.close();
  return new Promise((ok, fail) => c.toBlob(b => (b ? ok(b) : fail(new Error('falha ao converter a foto'))), 'image/jpeg', .85));
}

const day = (d: string) => parseDay(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: '2-digit' }).replace('.', '');

export function Photos({ photos }: { photos: Photo[] }) {
  const sorted = useMemo(() => [...photos].sort((a, b) => a.day.localeCompare(b.day)), [photos]);
  const urls = useMemo(() => new Map(sorted.map(p => [p.id, URL.createObjectURL(p.blob)])), [sorted]);
  useEffect(() => () => urls.forEach(u => URL.revokeObjectURL(u)), [urls]);
  const [sel, setSel] = useState<string[]>([]);
  const [split, setSplit] = useState(50);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<Photo | null>(null);
  const pair = sel.map(id => sorted.find(p => p.id === id)).filter((p): p is Photo => !!p).sort((a, b) => a.day.localeCompare(b.day));

  const toggle = (id: string) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s.slice(-1), id]));

  return (
    <section className="card">
      <div className="card-head">
        <h2>Fotos</h2>
        <label className="pill on file-pick">
          <Icon name="camera" /> {busy ? 'Salvando…' : 'Adicionar'}
          <input type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={async e => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (!f) return;
            setBusy(true);
            try { await addPhoto(await shrink(f), localDay(new Date())); } finally { setBusy(false); }
          }} />
        </label>
      </div>

      {!sorted.length && <Empty kind="gota" text="Tire uma foto por mês e compare lado a lado. Elas ficam só no seu celular." />}

      {pair.length === 2 && (
        <div className="compare" aria-label="Comparar fotos">
          <img src={urls.get(pair[0].id)} alt={`Foto de ${day(pair[0].day)}`} />
          <img src={urls.get(pair[1].id)} alt={`Foto de ${day(pair[1].day)}`} style={{ clipPath: `inset(0 0 0 ${split}%)` }} />
          <div className="split" style={{ left: `${split}%` }} />
          <span className="tag-l">{day(pair[0].day)}</span><span className="tag-r">{day(pair[1].day)}</span>
          <input type="range" min={0} max={100} value={split} aria-label="Divisão da comparação" onChange={e => setSplit(Number(e.target.value))} />
        </div>
      )}
      {sorted.length > 1 && pair.length < 2 && <p className="muted">Toque em duas fotos pra comparar.</p>}

      <div className="photo-grid">
        {sorted.map(p => (
          <button key={p.id} className={`thumb${sel.includes(p.id) ? ' on' : ''}`} aria-pressed={sel.includes(p.id)} onClick={() => toggle(p.id)}
            onContextMenu={e => { e.preventDefault(); setView(p); }}>
            <img src={urls.get(p.id)} alt="" loading="lazy" /><span>{day(p.day)}</span>
          </button>
        ))}
      </div>
      {sel.length > 0 && <button className="btn ghost" onClick={() => setView(sorted.find(p => p.id === sel.at(-1)) ?? null)}>Ver / apagar selecionada</button>}

      <Sheet open={!!view} onClose={() => setView(null)} title={view ? day(view.day) : ''}>
        {view && <img className="photo-full" src={urls.get(view.id)} alt={`Foto de ${day(view.day)}`} />}
        <button className="btn wide" onClick={async () => { await deletePhoto(view!.id); setSel(s => s.filter(x => x !== view!.id)); setView(null); }}>Apagar foto</button>
      </Sheet>
    </section>
  );
}
