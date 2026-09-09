import { tauriInvoke, isTauriEnvironment } from './tauriBridge';
import { TerminalTab, DistroId, ShellType } from '../types';

/**
 * Adapter IPC vers le store de session Rust (source de vérité).
 * La session de terminal (onglets + onglet actif) est persistée en JSON sous
 * `app_data_dir/session.json`. On ne persiste PAS le scrollback (history) ni
 * les éditeurs/apps ouverts — uniquement l'état des onglets (distro, shell,
 * cwd, historique de commandes, env, paquets installés) pour un redémarrage propre.
 * En mode navigateur : dégradation honnête (chaîne vide / no-op).
 */

export interface PersistedTab {
  id: string;
  title: string;
  distroId: string;
  shell: string;
  cwd: string;
  commandHistory: string[];
  envVars: Record<string, string>;
  installedPackages: string[];
}

export interface SessionSnapshot {
  activeTabId: string;
  tabs: PersistedTab[];
}

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

export async function getSession(): Promise<string> {
  nativeBackend('session_get');
  try {
    return (await tauriInvoke<string>('session_get')) || '';
  } catch (err) {
    console.warn('[session_get] :', err);
    return '';
  }
}

export async function saveSession(payload: unknown): Promise<void> {
  nativeBackend('session_save');
  try {
    await tauriInvoke('session_save', { data: JSON.stringify(payload) });
  } catch (err) {
    console.warn('[session_save] :', err);
  }
}

export async function exportSession(): Promise<string> {
  nativeBackend('session_export');
  try {
    return (await tauriInvoke<string>('session_export')) || '';
  } catch (err) {
    console.warn('[session_export] :', err);
    return '';
  }
}

export async function importSession(json: string): Promise<void> {
  nativeBackend('session_import');
  try {
    await tauriInvoke('session_import', { json });
  } catch (err) {
    console.warn('[session_import] :', err);
  }
}

/** Construit un snapshot persistable à partir des onglets (sans le scrollback). */
export async function saveSessionFromTabs(tabs: TerminalTab[], activeTabId: string): Promise<void> {
  const snap: SessionSnapshot = {
    activeTabId,
    tabs: tabs.map((t) => ({
      id: t.id,
      title: t.title,
      distroId: t.distroId,
      shell: t.shell,
      cwd: t.cwd,
      commandHistory: t.commandHistory,
      envVars: t.envVars,
      installedPackages: t.installedPackages,
    })),
  };
  return saveSession(snap);
}

/** Recharge les onglets depuis la session persistée (scrollback vide). Null si aucune session. */
export async function loadSessionTabs(): Promise<{ tabs: TerminalTab[]; activeTabId: string } | null> {
  const raw = await getSession();
  if (!raw) return null;
  try {
    const snap = JSON.parse(raw) as SessionSnapshot;
    if (!snap || !Array.isArray(snap.tabs) || snap.tabs.length === 0) return null;
    const tabs: TerminalTab[] = snap.tabs.map((t) => ({
      id: t.id,
      title: t.title,
      distroId: t.distroId as DistroId,
      shell: t.shell as ShellType,
      cwd: t.cwd,
      history: [],
      commandHistory: t.commandHistory || [],
      historyIndex: -1,
      envVars: t.envVars || {},
      installedPackages: t.installedPackages || [],
      activeEditor: null,
      activeApp: 'none',
    }));
    const activeTabId =
      snap.activeTabId && tabs.some((t) => t.id === snap.activeTabId) ? snap.activeTabId : tabs[0].id;
    return { tabs, activeTabId };
  } catch {
    return null;
  }
}
