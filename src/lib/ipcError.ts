// ===========================================================================
// Classification des erreurs IPC (Priorité 5 — gestion des erreurs).
// Distingue validation / réseau / authentification pour donner à l'utilisateur
// un message d'erreur actionnable plutôt qu'un texte technique brut.
// ===========================================================================

export type ErrorKind = 'validation' | 'network' | 'auth' | 'unknown';

export interface ClassifiedError {
  kind: ErrorKind;
  label: string;
  message: string;
}

/** Classe un message d'erreur selon sa nature (heuristique sur le texte). */
export function classifyError(raw: unknown): ClassifiedError {
  const msg = raw instanceof Error ? raw.message : String(raw ?? '');
  const m = msg.toLowerCase();

  if (/invalid|validation|requis|manquant|invalide|format|schema|obligatoire/.test(m)) {
    return { kind: 'validation', label: 'Erreur de validation', message: msg };
  }
  if (/auth|authenticat|mot de passe|password|credential|identifiant|401|403|refus|forbidden|unauthorized/.test(m)) {
    return { kind: 'auth', label: 'Erreur d\u2019authentification', message: msg };
  }
  if (/timeout|r\u00e9seau|network|connexion|connect|refused|host|reachable|d\u00e9lai|socket|smtp|ssh|dns/.test(m)) {
    return { kind: 'network', label: 'Erreur r\u00e9seau', message: msg };
  }

  return { kind: 'unknown', label: 'Erreur', message: msg };
}

/** Formate une erreur pour l'utilisateur, avec icône/action selon la nature. */
export function formatError(raw: unknown): string {
  const c = classifyError(raw);
  const prefix =
    c.kind === 'validation'
      ? 'Validation'
      : c.kind === 'auth'
      ? 'Authentification'
      : c.kind === 'network'
      ? 'R\u00e9seau'
      : 'Erreur';
  return `${c.message.trim()}` + (c.kind === 'unknown' ? '' : ` [${prefix}]`);
}
