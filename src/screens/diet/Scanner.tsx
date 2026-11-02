import { useEffect, useRef, useState } from 'react';
import { lookupBarcode, type Product } from '../../domain/foodfacts';

/** O leitor (wasm de ~1 MB) só baixa quando a câmera abre, e vem do próprio app, sem CDN. */
async function loadDetector() {
  const [{ BarcodeDetector, prepareZXingModule }, { default: wasm }] = await Promise.all([
    import('barcode-detector/ponyfill'), import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]);
  prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasm : prefix + path) } });
  return new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
}

const MSG = { offline: 'A busca precisa de internet. Anote à mão ou tente de novo.', invalid: 'Esse código não parece um código de barras.', missing: 'Produto não encontrado no Open Food Facts. Anote à mão.' };

/** Câmera traseira lendo o código; digitar o código é o plano B (sem câmera ou sem permissão). */
export function Scanner({ onProduct }: { onProduct(p: Product): void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async (c: string) => {
    setBusy(true); setMsg(null);
    const r = await lookupBarcode(c);
    setBusy(false);
    if (r === 'offline' || r === 'invalid') setMsg(MSG[r]);
    else if (!r) setMsg(MSG.missing);
    else onProduct(r);
  };

  useEffect(() => {
    let stop = false, timer = 0, stream: MediaStream | undefined;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setCamera('Câmera indisponível aqui. Digite o código.'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stop) return;
        const v = video.current!;
        v.srcObject = stream; await v.play();
        const det = await loadDetector();
        const tick = async () => {
          if (stop) return;
          const found = await det.detect(v).catch(() => []);
          if (found[0]?.rawValue) { setCode(found[0].rawValue); void search(found[0].rawValue); return; }
          timer = window.setTimeout(tick, 250);
        };
        void tick();
      } catch { setCamera('Sem acesso à câmera. Libere nos ajustes do Safari ou digite o código.'); }
    })();
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="scanner">
      {camera ? <p className="muted">{camera}</p> : <div className="scan-view"><video ref={video} playsInline muted /><i aria-hidden="true" /></div>}
      <form className="scan-code" onSubmit={e => { e.preventDefault(); void search(code); }}>
        <label className="field"><span>Código</span><input inputMode="numeric" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} placeholder="7891000…" /></label>
        <button className="btn" disabled={busy || !code.trim()}>{busy ? 'Buscando…' : 'Buscar'}</button>
      </form>
      {msg && <p className="scan-msg" role="status">{msg}</p>}
      <p className="muted small">Dados do Open Food Facts, por 100 g. Confira antes de salvar.</p>
    </div>
  );
}
