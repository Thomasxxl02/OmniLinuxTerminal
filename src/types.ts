import { ReactNode } from 'react';

export type DistroId = 
  | 'ubuntu'
  | 'debian'
  | 'arch'
  | 'fedora'
  | 'alpine'
  | 'kali'
  | 'centos'
  | 'opensuse'
  | 'void'
  | 'nixos';

export type PackageManagerName = 'apt' | 'pacman' | 'dnf' | 'apk' | 'zypper' | 'xbps' | 'nix';

export interface LinuxDistro {
  id: DistroId;
  name: string;
  version: string;
  tagline: string;
  kernel: string;
  packageManager: PackageManagerName;
  pkgCommand: string;
  defaultUser: string;
  hostName: string;
  promptSymbol: string;
  themeColor: string; // Tailwind color or hex
  accentBg: string;
  badgeBorder: string;
  asciiArt: string;
  description: string;
  defaultPackages: string[];
  specialTools: string[];
}

export type FileType = 'file' | 'dir' | 'link';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  path: string; // Full path e.g. /home/user/document.txt
  parentId: string | null;
  content?: string;
  size: number;
  permissions: string; // e.g. -rw-r--r-- or drwxr-xr-x
  owner: string;
  group: string;
  updatedAt: string; // ISO date or formatted
}

export interface TerminalTheme {
  id: string;
  name: string;
  bg: string;
  fg: string;
  promptUser: string;
  promptHost: string;
  promptPath: string;
  selectionBg: string;
  cursorColor: string;
  accent: string;
  cardBg: string;
}

export type ShellType = 'bash' | 'zsh' | 'fish' | 'sh';

export type TerminalSoundStyle = 'mechanical' | 'synth' | 'arcade';

export interface HistoryLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'custom';
  content: string | ReactNode;
  timestamp?: string;
  distroId?: DistroId;
  cwd?: string;
  commandExecuted?: string;
  durationMs?: number;
  exitCode?: number;
}

export interface ActiveEditorState {
  type: 'nano' | 'vim';
  filePath: string;
  fileContent: string;
  mode?: 'normal' | 'insert' | 'command'; // for vim
  vimCommandInput?: string;
  isNewFile?: boolean;
}

export interface TerminalTab {
  id: string;
  title: string;
  distroId: DistroId;
  shell: ShellType;
  cwd: string;
  history: HistoryLine[];
  commandHistory: string[];
  historyIndex: number;
  envVars: Record<string, string>;
  installedPackages: string[];
  activeEditor: ActiveEditorState | null;
  activeApp: 'none' | 'htop' | 'matrix' | 'sl';
}

export interface AiCommandGenResponse {
  command: string;
  explanation: string;
  tips?: string;
}

export interface AiExplainResponse {
  summary: string;
  breakdown: Array<{ part: string; description: string }>;
  safety: 'Faible' | 'Moyen' | 'Élevé';
  example: string;
}

export interface AiDebugResponse {
  cause: string;
  solution: string;
  correctedCommand: string;
}

export interface AiConfig {
  model: string;
  provider?: 'google' | 'deepseek' | 'mistral' | 'anthropic' | 'openai' | 'opensource' | 'custom';
  customApiKey?: string;
  isCustomKeyEnabled: boolean;
  customEndpoint?: string;
  apiKeys?: Record<string, string>;
  temperature?: number;
  persona?: 'sysadmin' | 'educational' | 'security';
  safetyFilter?: boolean;
}

// Maps an app model id to the provider that actually serves it (mirror of the Rust AI provider registry in src-tauri/src/ai/service.rs).
export type BackendProviderId =
  | 'google' | 'deepseek' | 'mistral' | 'anthropic' | 'openai'
  | 'qwen' | 'llama' | 'ollama' | 'custom';

export function backendProviderIdForModel(modelId?: string): BackendProviderId {
  const id = (modelId || '').trim();
  if (!id) return 'google';
  if (id.startsWith('gemini-')) return 'google';
  if (id.startsWith('deepseek-')) return 'deepseek';
  if (id.startsWith('codestral') || id.startsWith('mistral-')) return 'mistral';
  if (id.startsWith('claude-')) return 'anthropic';
  if (id === 'gpt-4o' || id === 'o3-mini') return 'openai';
  if (id === 'qwen2.5-coder-32b') return 'qwen';
  if (id.includes('llama')) return 'llama';
  if (id === 'ollama-local') return 'ollama';
  return 'custom';
}

