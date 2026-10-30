import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

// jsdom não tem matchMedia
window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;

// o Blob do jsdom não sobrevive ao structuredClone do fake-indexeddb; o do Node sim (como no navegador)
// @ts-expect-error -- tipos do Node não entram no tsconfig do app
import { Blob as NodeBlob } from 'node:buffer';
globalThis.Blob = NodeBlob as unknown as typeof Blob;
