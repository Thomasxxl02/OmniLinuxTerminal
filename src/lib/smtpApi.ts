import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers le client SMTP Rust (source de vérité unique).
 * React transmet un objet `SmtpConfig` typé et affiche le résultat Rust.
 * En mode navigateur, dégradation honnête (erreur) — jamais de données simulées.
 */

export type SmtpSecurity = 'none' | 'startTls' | 'ssl';

export interface SmtpConfig {
  host: string;
  port: number;
  security: SmtpSecurity;
  user?: string;
  password?: string;
  fromAddress: string;
  fromName?: string;
  toAddress?: string;
}

export interface SmtpTestResult {
  ok: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  serverGreeting?: string;
  message: string;
}

export interface SmtpSendResult {
  ok: boolean;
  to: string;
  responseCode?: string;
  message: string;
}

export interface SmtpProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  security: SmtpSecurity;
  user?: string;
  fromAddress: string;
  fromName?: string;
  updatedAt: string;
}

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

export async function smtpValidateConfig(config: SmtpConfig): Promise<void> {
  nativeBackend('smtp_validate_config');
  await tauriInvoke('smtp_validate_config', { config });
}

export async function smtpTestConnection(config: SmtpConfig): Promise<SmtpTestResult> {
  nativeBackend('smtp_test_connection');
  return tauriInvoke<SmtpTestResult>('smtp_test_connection', { config });
}

export async function smtpSendTest(config: SmtpConfig): Promise<SmtpSendResult> {
  nativeBackend('smtp_send_test');
  return tauriInvoke<SmtpSendResult>('smtp_send_test', { config });
}

export async function smtpListProfiles(): Promise<SmtpProfile[]> {
  nativeBackend('smtp_list_profiles');
  return tauriInvoke<SmtpProfile[]>('smtp_list_profiles');
}

export async function smtpSaveProfile(profile: SmtpProfile): Promise<SmtpProfile> {
  nativeBackend('smtp_save_profile');
  return tauriInvoke<SmtpProfile>('smtp_save_profile', { profile });
}

export async function smtpDeleteProfile(id: string): Promise<void> {
  nativeBackend('smtp_delete_profile');
  await tauriInvoke('smtp_delete_profile', { id });
}
