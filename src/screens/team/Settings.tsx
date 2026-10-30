import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getSettings, saveSettings, startFresh } from '../../db/repo';
import { exportBackup, importBackup } from '../../domain/backup';
import { waterGoalMl } from '../../domain/body';
import { localDay } from '../../domain/dates';
import { APP_NAME, REPO_URL, VERSION } from '../../brand';
import { Icon } from '../../ui/Icon';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';
import { shareFile } from '../../share/share';
import { play, setSoundEnabled } from '../../ui/sound';

const DAYS: [number, string][] = [[1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom']];

export default function Settings() {
  const nav = useNavigate();
  const d = useLiveQuery(async () => ({ s: await getSettings(), lastKg: (await db.weights.orderBy('day').last())?.kg }), []);
  const [photos, setPhotos] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [reset, setReset] = useState(false);
  const [redo, setRedo] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  if (!d) return <main className="screen" />;
  const { s } = d;
  const auto = waterGoalMl({ ...s, waterGoalMl: null }, d.lastKg);

  return (
    <main className="screen settings">
      <header className="screen-head">
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav('/time')}><Icon name="back" /></button>
        <h1 className="title sm">Ajustes</h1>
        <span />
      </header>

      <section className="card">
        <h2>Corpo</h2>
        <label className="field"><span>Altura (cm)</span>
          <NumberField value={s.heightCm} placeholder="Ex.: 175" onValue={n => { if (n === null || (n >= 100 && n <= 250)) void saveSettings({ heightCm: n === null ? null : Math.round(n) }); }} />
        </label>
        <div className="field"><span>Meta de água</span>
          <div className="seg">
            <button className={s.waterGoalMl === null ? 'on' : ''} onClick={() => saveSettings({ waterGoalMl: null })}>Automática</button>
            <button className={s.waterGoalMl !== null ? 'on' : ''} onClick={() => saveSettings({ waterGoalMl: s.waterGoalMl ?? auto })}>Manual</button>
          </div>
        </div>
        {s.waterGoalMl === null
          ? <p className="muted">{fmtNum(auto / 1000)} L por dia{d.lastKg ? ` (35 ml por kg, com ${fmtNum(d.lastKg)} kg)` : ' (registre seu peso pra calcular)'}.</p>
          : <label className="field"><span>Mililitros por dia</span>
              <NumberField value={s.waterGoalMl} onValue={n => { if (n && n >= 500 && n <= 8000) void saveSettings({ waterGoalMl: Math.round(n) }); }} />
            </label>}
      </section>

      <section className="card">
        <h2>Treino</h2>
        <div className="field"><span>Dias de treino</span>
          <div className="days">
            {DAYS.map(([n, l]) => {
              const on = s.trainDays.includes(n);
              return <button key={n} className={`pill${on ? ' on' : ''}`} aria-pressed={on}
                onClick={() => saveSettings({ trainDays: on ? s.trainDays.filter(x => x !== n) : [...s.trainDays, n].sort() })}>{l}</button>;
            })}
          </div>
        </div>
        <label className="field"><span>Horário</span>
          <input type="time" value={s.trainTime} onChange={e => e.target.value && saveSettings({ trainTime: e.target.value })} />
        </label>
        <button className="btn ghost" onClick={() => setRedo(true)}>Refazer pesquisa</button>
      </section>

      <section className="card">
        <div className="switch-row">
          <div><h2>Sons</h2><p className="muted">Série feita, recorde, água e fim de treino.</p></div>
          <button className="switch" role="switch" aria-checked={s.sound} aria-label="Sons"
            onClick={() => { setSoundEnabled(!s.sound); void saveSettings({ sound: !s.sound }); if (!s.sound) play('check'); }} />
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Notificações</h2><span className="soon">Em breve</span></div>
        <p className="muted">Lembretes da Gota, da Faísca e da Pedra chegam numa próxima versão.</p>
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p className="muted">Seus dados ficam só neste aparelho. Exporte de vez em quando pra não perder nada.</p>
        <label className="check-row"><input type="checkbox" checked={photos} onChange={e => setPhotos(e.target.checked)} /> Incluir fotos (arquivo maior)</label>
        <div className="row-2">
          <button className="btn ghost" onClick={async () => shareFile(await exportBackup(photos), `flint-backup-${localDay(new Date())}.json`, `Backup do ${APP_NAME}`)}>Exportar</button>
          <label className="btn ghost file-pick">Importar
            <input type="file" accept="application/json,.json" hidden onChange={async e => {
              const f = e.target.files?.[0]; e.target.value = '';
              if (f) setPending(f);
            }} />
          </label>
        </div>
        {msg && <p className="muted" role="status">{msg}</p>}
      </section>

      <section className="card">
        <h2>Dados</h2>
        <button className="btn ghost danger-text" onClick={() => setReset(true)}>Começar do zero</button>
      </section>

      <section className="card about">
        <h2>Sobre</h2>
        <p className="muted">{APP_NAME} {VERSION} · feito pra treinar, sem anúncios e sem conta.</p>
        <a className="inline-link" href={REPO_URL} target="_blank" rel="noreferrer">Código no GitHub</a>
      </section>

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Restaurar backup?">
        <p className="muted">O backup substitui os dados deste aparelho: treinos, água e peso. Fotos só são trocadas se o backup tiver fotos.</p>
        <div className="row-2">
          <button className="btn ghost" onClick={() => setPending(null)}>Cancelar</button>
          <button className="btn" onClick={async () => { const r = await importBackup(pending!); setPending(null); setMsg(r.ok ? 'Backup restaurado.' : r.error); }}>Substituir</button>
        </div>
      </Sheet>

      <Sheet open={redo} onClose={() => setRedo(false)} title="Refazer a pesquisa?">
        <p className="muted">Seus treinos atuais serão arquivados; o histórico continua. No fim você escolhe entre gerar um plano novo ou manter sua rotina.</p>
        <div className="row-2">
          <button className="btn ghost" onClick={() => setRedo(false)}>Cancelar</button>
          <button className="btn" onClick={() => nav('/bem-vindo?refazer=1')}>Começar</button>
        </div>
      </Sheet>

      <Sheet open={reset} onClose={() => setReset(false)} title="Começar do zero?">
        <p className="muted">Treinos, água, peso e fotos serão apagados deste aparelho. A biblioteca de exercícios continua.</p>
        <div className="row-2">
          <button className="btn ghost" onClick={() => setReset(false)}>Cancelar</button>
          <button className="btn" onClick={async () => { await startFresh(); setReset(false); nav('/bem-vindo'); }}>Apagar tudo</button>
        </div>
      </Sheet>
    </main>
  );
}
