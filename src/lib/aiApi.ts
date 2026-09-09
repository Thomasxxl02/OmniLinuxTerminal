import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers le moteur IA Rust (source de vérité).
 * Les 4 opérations (test / générer / expliquer / déboguer) sont exécutées par
 * des commandes Tauri async réelles et multi-provider dans le backend natif.
 * La clé API est transmise par requête, en-mémoire — jamais persistée ni retournée.
 * En mode navigateur : dégradation honnête (erreur) — aucune donnée simulée.
 */

export interface AiGeneratePayload {
  prompt: string;
  distro?: string;
  currentDir?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
  persona?: string;
  customEndpoint?: string;
}
export interface AiGenerateResponse {
  command: string;
  explanation: string;
  tips?: string | null;
  warnings?: string | null;
}

export interface AiExplainPayload {
  command: string;
  distro?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
  persona?: string;
  customEndpoint?: string;
}
export interface AiExplainResponse {
  summary: string;
  breakdown: Array<{ part: string; description: string }>;
  safety: string;
  example: string;
}

export interface AiDebugPayload {
  command: string;
  errorOutput?: string;
  distro?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
  customEndpoint?: string;
}
export interface AiDebugResponse {
  cause: string;
  solution: string;
  correctedCommand: string;
}

export interface AiTestPayload {
  model?: string;
  apiKey?: string;
  samplePrompt?: string;
  customEndpoint?: string;
}
export interface AiTestResponse {
  status: string;
  model: string;
  engineModel: string;
  provider: string;
  providerId: string;
  latencyMs: number;
  message: string;
  sampleResponse: string;
}

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

/** Extrait le message d'une erreur d'appel IPC (AppError ou erreur native). */
export function aiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m) return m;
  }
  return String(err);
}

export async function aiTest(payload: AiTestPayload): Promise<AiTestResponse> {
  nativeBackend('ai_test');
  return tauriInvoke<AiTestResponse>('ai_test', { request: payload });
}

export async function aiGenerate(payload: AiGeneratePayload): Promise<AiGenerateResponse> {
  nativeBackend('ai_generate');
  return tauriInvoke<AiGenerateResponse>('ai_generate', { request: payload });
}

export async function aiExplain(payload: AiExplainPayload): Promise<AiExplainResponse> {
  nativeBackend('ai_explain');
  return tauriInvoke<AiExplainResponse>('ai_explain', { request: payload });
}

export async function aiDebug(payload: AiDebugPayload): Promise<AiDebugResponse> {
  nativeBackend('ai_debug');
  return tauriInvoke<AiDebugResponse>('ai_debug', { request: payload });
}
