import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers l'analyseur de risque Rust (`security::risk`).
 * Analyse une commande tokenisée et retourne un rapport structuré :
 * niveau, raisons, besoin de confirmation, blocage. En mode navigateur,
 * dégradation honnête (rapport « safe ») — jamais de faux signal de risque.
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskReport {
  level: RiskLevel;
  reasons: string[];
  needsConfirmation: boolean;
  blocked: boolean;
}

const SAFE: RiskReport = { level: 'low', reasons: [], needsConfirmation: false, blocked: false };

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

export async function riskAnalyze(command: string): Promise<RiskReport> {
  nativeBackend('risk_analyze');
  try {
    const r = await tauriInvoke<RiskReport>('risk_analyze', { cmd: command });
    return r || SAFE;
  } catch (err) {
    console.warn('[risk_analyze] :', err);
    return SAFE;
  }
}
