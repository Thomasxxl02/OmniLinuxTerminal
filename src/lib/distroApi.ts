import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers la liste des distributions Rust (source de vérité).
 * Le catalogue des distributions (quelles distros existent + identité) vient
 * de Rust via `distro_list` — aucune duplication dans React.
 * En mode navigateur, dégradation honnête (liste vide) — jamais de données simulées.
 */

export interface DistroInfo {
  id: string;
  name: string;
  version: string;
  kernel: string;
  defaultUser: string;
  packageManager: string;
  colorTheme: string;
  asciiLogo: string;
  description: string;
  defaultPackages: string[];
}

export async function listDistros(): Promise<DistroInfo[]> {
  if (!isTauriEnvironment()) {
    throw new Error(
      '[distro_list] Backend natif non disponible (mode navigateur). Lancez l\'application via Tauri.'
    );
  }
  try {
    const res = await tauriInvoke<DistroInfo[]>('distro_list', {});
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn('[distro_list] Échec de récupération des distributions :', err);
    return [];
  }
}
