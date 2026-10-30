import { play, setSoundEnabled } from '../../src/ui/sound';

function fakeAudio() {
  const created: string[] = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const node = () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), gain: param(), frequency: param(), type: '' });
  class Ctx {
    currentTime = 0; state = 'running'; destination = {}; sampleRate = 44100;
    createOscillator() { created.push('osc'); return node(); }
    createGain() { return node(); }
    createBuffer(_c: number, n: number) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() { created.push('noise'); return { ...node(), buffer: null }; }
    createBiquadFilter() { return node(); }
    resume() { return Promise.resolve(); }
  }
  vi.stubGlobal('AudioContext', Ctx);
  return created;
}

afterEach(() => vi.unstubAllGlobals());

test('play não faz nada com som desligado', () => {
  const created = fakeAudio();
  setSoundEnabled(false);
  play('check');
  expect(created).toHaveLength(0);
});

test('play cria oscilador com som ligado', () => {
  const created = fakeAudio();
  setSoundEnabled(true);
  play('check');
  expect(created).toContain('osc');
});

test('sem AudioContext não quebra', () => {
  vi.stubGlobal('AudioContext', undefined);
  setSoundEnabled(true);
  expect(() => play('pr')).not.toThrow();
});
