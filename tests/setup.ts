import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

// jsdom não tem matchMedia
window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
