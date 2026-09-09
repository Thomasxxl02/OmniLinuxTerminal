import { useEffect, useState } from 'react';
import { LinuxDistro, DistroId } from '../types';
import { listDistros } from './distroApi';
import { mergeDistroInfo, EMPTY_DISTRO } from '../data/distros';

/**
 * Store des distributions alimenté par Rust (`distro_list`).
 * - `loadDistros()` : charge une seule fois la liste canonique depuis Rust et
 *   la fusionne avec la couche présentation React.
 * - `useDistros()` : hook React exposant la liste courante (re-render au chargement).
 * - `resolveDistro()` : résout une distro par id (fallback = première / placeholder).
 * En mode navigateur, dégradation honnête : la liste reste vide, aucune donnée simulée.
 */

let cache: LinuxDistro[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of [...listeners]) fn();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getDistros(): LinuxDistro[] {
  return cache;
}

export async function loadDistros(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const infos = await listDistros();
    cache = (infos || []).map(mergeDistroInfo);
  } catch (err) {
    console.warn('[distros] Aucune donnée de distribution disponible (mode navigateur) :', err);
    cache = [];
  }
  emit();
}

/** Résout la distro active : par id, sinon la première, sinon placeholder inerte. */
export function resolveDistro(distros: LinuxDistro[], id?: DistroId | string): LinuxDistro {
  if (!distros || distros.length === 0) return EMPTY_DISTRO;
  const found = distros.find((d) => d.id === id);
  return found || distros[0];
}

/** Hook React : liste des distributions (déclenche le chargement Rust au montage). */
export function useDistros(): LinuxDistro[] {
  const [, force] = useState(0);
  useEffect(() => {
    let mounted = true;
    const unsub = subscribe(() => {
      if (mounted) force((x) => x + 1);
    });
    loadDistros();
    return () => {
      mounted = false;
      unsub();
    };
  }, []);
  return cache;
}
