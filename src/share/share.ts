import { APP_NAME } from '../brand';

/** Compartilha pelo menu do sistema (Web Share); sem suporte, baixa o arquivo. */
export async function shareFile(blob: Blob, filename: string, title = APP_NAME) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const shareImage = (blob: Blob, filename: string) => shareFile(blob, filename);
