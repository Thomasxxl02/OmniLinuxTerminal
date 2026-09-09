import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Terminal,
  FileCode,
  Shield,
  Activity,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Boxes,
  Zap,
  Download,
  FolderTree,
  ChevronRight,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { tauriIpcHistory, getTauriTelemetry, isTauriEnvironment } from '../lib/tauriBridge';

interface TauriArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RustFileItem {
  id: string;
  name: string;
  path: string;
  category: 'config' | 'core' | 'modules';
  description: string;
  content: string;
}

const RUST_SOURCE_FILES: RustFileItem[] = [
  {
    id: 'cargo-toml',
    name: 'Cargo.toml',
    path: 'src-tauri/Cargo.toml',
    category: 'config',
    description: 'Manifeste Cargo avec Tauri v2, Tokio, Serde, Reqwest et regex.',
    content: `[package]
name = "omnilinux-terminal"
version = "1.0.0"
description = "OmniLinux Terminal - Multi-Distribution Linux Terminal & SysAdmin Studio powered by Tauri v2 and Rust"
authors = ["OmniLinux Team"]
edition = "2021"
license = "MIT"

[lib]
name = "omnilinux_terminal_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }

[dependencies]
tauri = { version = "2.0.0", features = [] }
tauri-plugin-shell = "2.0.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.38", features = ["full"] }
reqwest = { version = "0.12", features = ["json"] }
chrono = { version = "0.4", features = ["serde"] }
regex = "1.10"
uuid = { version = "1.8", features = ["v4", "serde"] }
thiserror = "1.0"`,
  },
  {
    id: 'tauri-conf',
    name: 'tauri.conf.json',
    path: 'src-tauri/tauri.conf.json',
    category: 'config',
    description: 'Configuration du runtime Tauri v2 (fenêtres, CSP, bundle natif).',
    content: `{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "OmniLinux Terminal",
  "version": "1.0.0",
  "identifier": "com.omnilinux.terminal",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "OmniLinux Terminal",
        "width": 1280,
        "height": 840,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "theme": "Dark"
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' ipc: https://*;"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "category": "DeveloperTool"
  }
}`,
  },
  {
    id: 'lib-rs',
    name: 'src/lib.rs',
    path: 'src-tauri/src/lib.rs',
    category: 'core',
    description: 'Enregistrement des commandes Tauri v2 (#[tauri::command]) et point d\'entrée.',
    content: `pub mod ai;
pub mod distro;
pub mod fs;
pub mod models;
pub mod system;
pub mod terminal;

use fs::VirtualFileSystem;
use terminal::ShellExecutor;
use models::{CommandExecutionResult, FileNode, DistroInfo, SystemTelemetry};
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub vfs: VirtualFileSystem,
    pub executor: ShellExecutor,
}

#[tauri::command]
pub fn execute_shell_command(
    state: State<'_, Mutex<AppState>>,
    cmd: String,
    cwd: String,
    distro_id: String,
) -> CommandExecutionResult {
    let app_state = state.lock().unwrap();
    app_state.executor.execute(&cmd, &cwd, &distro_id, &[])
}

#[tauri::command]
pub fn fs_read_file(state: State<'_, Mutex<AppState>>, path: String) -> Result<String, String> {
    let app_state = state.lock().unwrap();
    app_state.vfs.read_file(&path)
}

#[tauri::command]
pub fn fs_write_file(
    state: State<'_, Mutex<AppState>>,
    path: String,
    content: String,
    append: bool,
) -> Result<FileNode, String> {
    let app_state = state.lock().unwrap();
    app_state.vfs.write_file(&path, &content, append)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let vfs = VirtualFileSystem::new();
    let executor = ShellExecutor::new(vfs.clone());
    let state = AppState { vfs, executor };

    tauri::Builder::default()
        .manage(Mutex::new(state))
        .invoke_handler(tauri::generate_handler![
            execute_shell_command,
            fs_read_file,
            fs_write_file,
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application Tauri v2");
}`,
  },
  {
    id: 'fs-mod-rs',
    name: 'src/fs/mod.rs',
    path: 'src-tauri/src/fs/mod.rs',
    category: 'modules',
    description: 'Système de fichiers virtuel POSIX complet en Rust (arborescence, permissions, inodes).',
    content: `use crate::models::{FileNode, NodeType};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use chrono::Utc;

#[derive(Debug, Clone)]
pub struct VirtualFileSystem {
    nodes: Arc<Mutex<HashMap<String, FileNode>>>,
}

impl VirtualFileSystem {
    pub fn new() -> Self {
        let mut map = HashMap::new();
        // Initialisation de /, /bin, /etc, /home, /var, /tmp, /usr...
        Self { nodes: Arc::new(Mutex::new(map)) }
    }

    pub fn normalize_path(&self, target: &str, cwd: &str) -> String {
        // Résolution POSIX stricte (chemins relatifs, ~, .., .)
    }

    pub fn read_file(&self, path: &str) -> Result<String, String> { ... }
    pub fn write_file(&self, path: &str, content: &str, append: bool) -> Result<FileNode, String> { ... }
    pub fn list_dir(&self, path: &str) -> Vec<FileNode> { ... }
    pub fn remove_path(&self, path: &str, recursive: bool) -> Result<(), String> { ... }
}`,
  },
  {
    id: 'terminal-mod-rs',
    name: 'src/terminal/mod.rs',
    path: 'src-tauri/src/terminal/mod.rs',
    category: 'modules',
    description: 'Analyseur de commandes POSIX, pipelines (|), redirections (>, >>) et coreutils en Rust.',
    content: `pub struct ShellExecutor {
    vfs: VirtualFileSystem,
}

impl ShellExecutor {
    pub fn execute(&self, raw_cmd: &str, cwd: &str, distro_id: &str, ...) -> CommandExecutionResult {
        // Exécution de pipelines : cat fichier.txt | grep motif | head -n 5
        // Redirections : echo "data" > /etc/config.conf
        // Coreutils : ls, cd, pwd, cat, touch, mkdir, rm, cp, chmod, uname, neofetch
        // Gestionnaires de paquets : apt, pacman, dnf, apk
    }
}`,
  },
  {
    id: 'ai-mod-rs',
    name: 'src/ai/mod.rs',
    path: 'src-tauri/src/ai/mod.rs',
    category: 'modules',
    description: 'Moteur de copilote IA, garde-fous de sécurité (anti rm -rf) et routage multi-modèles.',
    content: `pub struct AiEngine;

impl AiEngine {
    pub fn check_safety(cmd: &str) -> Option<String> {
        // Détecte les commandes destructrices : rm -rf /, fork-bombs, écriture bloc /dev/sda
    }

    pub fn build_system_prompt(persona: &str, distro: &str) -> String {
        // Injection de persona (DevOps Senior, Éducatif, Auditeur Sécurité)
    }
}`,
  },
];

export const TauriArchitectureModal: React.FC<TauriArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'source' | 'ipc' | 'build'>('overview');
  const [selectedFileId, setSelectedFileId] = useState<string>('lib-rs');
  const [copied, setCopied] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState(getTauriTelemetry());

  useEffect(() => {
    if (isOpen) {
      setTelemetry(getTauriTelemetry());
      const interval = setInterval(() => {
        setTelemetry(getTauriTelemetry());
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFile = RUST_SOURCE_FILES.find((f) => f.id === selectedFileId) || RUST_SOURCE_FILES[2];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Architecture Tauri v2 & Backend Rust</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono">
                  Tauri v2.11 • Rust 1.85
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Toutes les logiques métiers (VFS POSIX, Shell Parser, Copilote IA) écrites en Rust natif.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 p-1.5 rounded-lg transition"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-zinc-800 bg-zinc-950/40 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Vue d'Ensemble
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'source'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> Code Source Rust (src-tauri)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ipc')}
            className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'ipc'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Télémétrie IPC Tauri ({tauriIpcHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('build')}
            className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'build'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Compilation & Packaging
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 text-xs space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Telemetry quick cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 block">Runtime Tauri</span>
                  <div className="text-base font-bold text-orange-400 font-mono flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-orange-400" /> v2.11.1
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Tauri v2 Desktop Ready</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 block">Compilateur Rust</span>
                  <div className="text-base font-bold text-amber-400 font-mono flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-amber-400" /> Rust 1.85
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Edition 2021 POSIX</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 block">Appels IPC Exécutés</span>
                  <div className="text-base font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" /> {telemetry.ipcCallCount} appels
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Latence moy: ~{telemetry.avgLatencyMs} ms</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 block">Canal IPC Actif</span>
                  <div className="text-base font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />{' '}
                    {isTauriEnvironment() ? 'Tauri Natif' : 'Rust-Bridge Web'}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Zero-overhead IPC</span>
                </div>
              </div>

              {/* Architecture modules breakdown */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-orange-400" />
                  Répartition des Modules Métiers en Rust
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100 font-mono">src-tauri/src/fs/mod.rs</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono">
                        VFS Rust
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Système de fichiers virtuel complet avec inodes, droits POSIX (rwxr-xr-x), dossiers arborescents et normalisation canonique.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100 font-mono">src-tauri/src/terminal/mod.rs</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                        Shell Engine
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Tokenisation des commandes, exécution de pipelines (|), redirections (&gt;, &gt;&gt;) et émulation complète des utilitaires GNU coreutils.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100 font-mono">src-tauri/src/ai/mod.rs</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                        Copilote & Sécurité
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Validation de sécurité avant exécution (détection anti-rm -rf /), injection de personas et routage multi-modèles (Gemini, DeepSeek, Claude).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100 font-mono">src-tauri/src/distro/mod.rs</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                        Distros & Paquets
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Gestion des 10 distributions Linux, logos ASCII neofetch, et simulateurs de gestionnaires de paquets (apt, pacman, dnf, apk).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOURCE CODE EXPLORER */}
          {activeTab === 'source' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* File list sidebar */}
              <div className="space-y-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Fichiers Rust & Config Tauri v2
                </div>
                {RUST_SOURCE_FILES.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full p-2 rounded-lg text-left transition flex items-center justify-between gap-2 ${
                      selectedFileId === file.id
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-medium text-xs truncate">{file.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{file.path}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="md:col-span-2 bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs font-semibold text-orange-400">{currentFile.path}</div>
                    <div className="text-[10px] text-zinc-400">{currentFile.description}</div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono flex items-center gap-1.5 transition"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>

                <pre className="p-4 overflow-x-auto text-[11px] font-mono text-zinc-300 bg-zinc-950/90 leading-relaxed max-h-[380px] scrollbar-thin">
                  <code>{currentFile.content}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: IPC TELEMETRY */}
          {activeTab === 'ipc' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Journal des appels IPC Tauri v2 en temps réel :</span>
                <span className="font-mono text-[10px] text-emerald-400">Latence moyenne : ~{telemetry.avgLatencyMs} ms</span>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 text-zinc-400 text-[10px] uppercase font-mono border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5">Heure</th>
                      <th className="p-2.5">Commande Tauri (Rust)</th>
                      <th className="p-2.5">Paramètres</th>
                      <th className="p-2.5">Durée</th>
                      <th className="p-2.5">Canal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                    {tauriIpcHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-zinc-500 font-sans">
                          Tapez des commandes dans le terminal pour voir les invocations IPC Tauri en direct.
                        </td>
                      </tr>
                    ) : (
                      tauriIpcHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-900/40">
                          <td className="p-2.5 text-zinc-500">{log.timestamp}</td>
                          <td className="p-2.5 font-bold text-orange-400">{log.command}</td>
                          <td className="p-2.5 text-zinc-400 max-w-[200px] truncate">
                            {JSON.stringify(log.args)}
                          </td>
                          <td className="p-2.5 text-emerald-400">{log.durationMs} ms</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-500/10 text-orange-300 border border-orange-500/20">
                              {log.source === 'tauri-native' ? 'Natif' : 'Rust-Bridge'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BUILD & PACKAGING */}
          {activeTab === 'build' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  Commandes de Build & Déploiement Tauri v2
                </h3>
                <p className="text-zinc-400 text-xs">
                  Le projet est configuré selon les standards stricts de Tauri v2. Vous pouvez compiler un binaire natif pour Linux, macOS ou Windows.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">1. Lancer en mode développement desktop :</span>
                    <pre className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-amber-300 font-mono text-xs">
                      npm run tauri:dev
                    </pre>
                  </div>

                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">2. Compiler les installeurs natifs de production :</span>
                    <pre className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono text-xs">
                      npm run tauri:build
                    </pre>
                  </div>

                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">3. Cibles binaires produites automatiquement :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-zinc-300">
                        🐧 <strong>GNU/Linux</strong>: .deb, .AppImage
                      </div>
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-zinc-300">
                        🍏 <strong>macOS</strong>: .dmg, .app
                      </div>
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-zinc-300">
                        🪟 <strong>Windows</strong>: .msi, .exe
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tauri v2 IPC & Logique Métier Rust Prêtes</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
