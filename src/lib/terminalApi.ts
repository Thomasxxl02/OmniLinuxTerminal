import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers le moteur de terminal Rust (source de vérité).
 * L'autocomplétion, la liste des commandes et l'aide viennent de Rust —
 * aucune duplication dans React. En mode navigateur, dégradation honnête
 * (retour vide / erreur) — jamais de liste simulée.
 */

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

export async function terminalComplete(input: string): Promise<string[]> {
  nativeBackend('terminal_complete');
  return tauriInvoke<string[]>('terminal_complete', { input });
}

export async function terminalSupportedCommands(): Promise<string[]> {
  nativeBackend('terminal_supported_commands');
  return tauriInvoke<string[]>('terminal_supported_commands');
}

export async function terminalHelp(): Promise<string> {
  nativeBackend('terminal_help');
  return tauriInvoke<string>('terminal_help');
}
