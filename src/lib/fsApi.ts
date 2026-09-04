import { FileNode } from '../types';
import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers le VFS Rust (source de vérité unique).
 * Toutes les opérations système de fichiers passent par les commandes Tauri ;
 * aucun état n'est conservé côté TypeScript. En mode navigateur (pas de backend
 * Rust), on dégrade honnêtement avec un message — jamais de données simulées.
 */

export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return String(e);
}

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

export async function fsRead(path: string): Promise<string> {
  nativeBackend('fs_read');
  const r = await tauriInvoke<string | null>('fs_read', { path });
  if (r == null) throw new Error('fs_read: backend natif non disponible');
  return r;
}

export async function fsWrite(path: string, content: string, append = false): Promise<FileNode> {
  nativeBackend('fs_write');
  const r = await tauriInvoke<FileNode | null>('fs_write', { path, content, append });
  if (r == null) throw new Error('fs_write: backend natif non disponible');
  return r;
}

export async function fsReset(): Promise<void> {
  nativeBackend('fs_reset');
  await tauriInvoke('fs_reset');
}

export async function fsExport(): Promise<string> {
  nativeBackend('fs_export');
  const r = await tauriInvoke<string | null>('fs_export');
  if (r == null) throw new Error('fs_export: backend natif non disponible');
  return r;
}

export async function fsImport(json: string): Promise<void> {
  nativeBackend('fs_import');
  await tauriInvoke('fs_import', { json });
}

export async function fsUpdateOSRelease(name: string, version: string): Promise<void> {
  nativeBackend('fs_update_os_release');
  await tauriInvoke('fs_update_os_release', { name, version });
}
