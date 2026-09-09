import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers le trousseau de secrets Rust (`security::secrets`).
 * Stocke/récupère un secret via le trousseau système (fallback mémoire).
 * Les secrets ne sont jamais écrits en localStorage ni dans les logs.
 * En mode navigateur : dégradation honnête (échec silencieux).
 */

const SERVICE = 'com.omnilinux.terminal';

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

export async function secretSave(namespace: string, key: string, value: string): Promise<void> {
  nativeBackend('secret_save');
  await tauriInvoke('secret_save', { service: SERVICE, key: `${namespace}/${key}`, value });
}

export async function secretGet(namespace: string, key: string): Promise<string | null> {
  nativeBackend('secret_get');
  try {
    return await tauriInvoke<string>('secret_get', { service: SERVICE, key: `${namespace}/${key}` });
  } catch (err) {
    console.warn('[secret_get] :', err);
    return null;
  }
}

export async function secretDelete(namespace: string, key: string): Promise<void> {
  nativeBackend('secret_delete');
  await tauriInvoke('secret_delete', { service: SERVICE, key: `${namespace}/${key}` });
}

/**
 * Expurge d'un texte les secrets en clair courants (mot de passe inline, clés…)
 * afin de ne jamais laisser fuiter un secret dans une commande copiée ou un log.
 */
export function redactSecrets(text: string): string {
  if (!text) return text;
  let out = text;
  // password=pwd / --password pwd / -p pwd / PASS=pwd / TOKEN=pwd / KEY=pwd / Bearer xxx
  out = out.replace(/((?:--?password|-p|passwd|PASSWORD=|PASS=|TOKEN=|SECRET=|API_?KEY=|auth_token=)\s*[:=]?\s*)([^\s'"]+)/gi, '$1***');
  out = out.replace(/Authorization:\s*(?:Bearer|Basic)\s+[\w.-]+/gi, 'Authorization: ***');
  return out;
}
