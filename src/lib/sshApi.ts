import { tauriInvoke, isTauriEnvironment } from './tauriBridge';

/**
 * Adapter IPC vers le client SSH Rust (source de vérité unique).
 * React transmet un objet `SshConfig` typé et affiche le résultat Rust.
 * Les mots de passe ne sont ni persistés ni renvoyés : ils vont au backend
 * pour la connexion uniquement. En mode navigateur (pas de backend Rust),
 * on dégrade honnêtement avec une erreur — jamais de données simulées.
 */

export type SshAuthType = 'key' | 'password';

export interface SshConfig {
  host: string;
  port: number;
  user: string;
  authType: SshAuthType;
  password?: string;
  keyPath?: string;
  keepAlive: number;
  portForwarding?: string;
}

export interface SshConnectionInfo {
  ok: boolean;
  host: string;
  port: number;
  user: string;
  authType: SshAuthType;
  serverBanner?: string;
  message: string;
}

export interface SshProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  authType: SshAuthType;
  keyPath?: string;
  keepAlive: number;
  portForwarding?: string;
  updatedAt: string;
}

function nativeBackend(desc: string): void {
  if (!isTauriEnvironment()) {
    throw new Error(
      `[${desc}] Backend natif non disponible (mode navigateur). Lancez l'application via Tauri.`
    );
  }
}

export async function sshValidateConfig(config: SshConfig): Promise<void> {
  nativeBackend('ssh_validate_config');
  await tauriInvoke('ssh_validate_config', { config });
}

export async function sshTestConnection(config: SshConfig): Promise<SshConnectionInfo> {
  nativeBackend('ssh_test_connection');
  return tauriInvoke<SshConnectionInfo>('ssh_test_connection', { config });
}

export async function sshConnect(config: SshConfig): Promise<SshConnectionInfo> {
  nativeBackend('ssh_connect');
  return tauriInvoke<SshConnectionInfo>('ssh_connect', { config });
}

export async function sshDisconnect(): Promise<void> {
  nativeBackend('ssh_disconnect');
  await tauriInvoke('ssh_disconnect');
}

export async function sshIsConnected(): Promise<boolean> {
  nativeBackend('ssh_is_connected');
  return tauriInvoke<boolean>('ssh_is_connected');
}

export async function sshListProfiles(): Promise<SshProfile[]> {
  nativeBackend('ssh_list_profiles');
  return tauriInvoke<SshProfile[]>('ssh_list_profiles');
}

export async function sshSaveProfile(profile: SshProfile): Promise<SshProfile> {
  nativeBackend('ssh_save_profile');
  return tauriInvoke<SshProfile>('ssh_save_profile', { profile });
}

export async function sshDeleteProfile(id: string): Promise<void> {
  nativeBackend('ssh_delete_profile');
  await tauriInvoke('ssh_delete_profile', { id });
}
