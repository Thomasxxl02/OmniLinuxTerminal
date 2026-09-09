import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers l'historique de commandes Rust (`history`).
 * Historique local persisté en JSONL (source de vérité Rust) : les commandes
 * exécutées (distro/cwd/cmd/code de sortie) sont tracées côté backend.
 * En mode navigateur : dégradation honnête (tableau vide / no-op).
 */

/** Entrée d'historique telle que renvoyée par le backend (camelCase). */
export interface HistoryEntry {
  ts: string;
  distro: string;
  cwd: string;
  cmd: string;
  exitCode: number;
}

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

/** Liste les commandes récentes (les plus récentes d'abord, `limit` max). */
export async function historyList(limit = 200): Promise<HistoryEntry[]> {
  if (!isTauriEnvironment()) return [];
  return tauriInvoke<HistoryEntry[]>('history_list', { limit });
}

/** Ajoute une entrée d'historique (horodatage posé côté Rust). */
export async function historyAdd(
  cmd: string,
  distro: string,
  cwd: string,
  exitCode: number
): Promise<void> {
  nativeBackend('history_add');
  await tauriInvoke('history_add', { cmd, distro, cwd, exitCode });
}

/** Efface tout l'historique. */
export async function historyClear(): Promise<void> {
  nativeBackend('history_clear');
  await tauriInvoke('history_clear');
}
