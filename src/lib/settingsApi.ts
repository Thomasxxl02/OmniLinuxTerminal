import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers le store de réglages Rust (source de vérité).
 * Les réglages (thème, son, CRT, taille de police, config IA non sensible)
 * sont persistés dans `settings.json` sous l'app-data-dir, via le backend natif.
 * En mode navigateur : dégradation honnête (objets vides / no-op) — jamais de données factices.
 */

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

/** Récupère toutes les réglages persistés (objet plat clé/valeur). */
export async function getSettings(): Promise<Record<string, unknown>> {
  nativeBackend('settings_get');
  try {
    const text = await tauriInvoke<string>('settings_get');
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch (err) {
    console.warn('[settings_get] :', err);
    return {};
  }
}

/** Upsert d'un réglage : persiste la valeur JSON (jamais de secret). */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  nativeBackend('settings_update');
  await tauriInvoke('settings_update', { key, value: JSON.stringify(value) });
}
