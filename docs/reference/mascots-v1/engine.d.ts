import type { StageId } from '../domain/rules';

export type MascotKind = 'faisca' | 'gota' | 'pedra';
export type MascotAct = 'danca' | 'acenar' | 'comemorar' | 'bravo' | 'dormir' | 'boxe' | 'polichinelo' | 'gotinha' | 'balanco' | 'rosca' | 'flex';

export interface MascotHandle {
  act(name: MascotAct): void;
  say(ms?: number): void;
  setMood(m: 'happy' | 'sad'): void;
  setStage(s: StageId): void;
  destroy(): void;
}

export function mountMascot(el: HTMLElement, kind: MascotKind, opts?: { stage?: StageId; interactive?: boolean }): MascotHandle;
export function activeMascotCount(): number;
