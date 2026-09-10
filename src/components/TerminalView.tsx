import React, { useState, useEffect, useRef } from 'react';
import { TerminalTab, TerminalTheme, TerminalSoundStyle, HistoryLine } from '../types';
import { LINUX_DISTROS } from '../data/distros';
import { runTerminalCommand, applyTerminalResult } from '../lib/tauriBridge';
import { playTerminalSound } from '../lib/soundEffects';
import {
  Copy,
  Trash2,
  Terminal as TerminalIcon,
  Check,
  Search,
  AlertTriangle,
  Folder,
  FileText,
  Clock,
  Zap,
  CornerDownLeft,
  X,
  ShieldAlert,
  GitBranch,
  UploadCloud,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Server,
  FileCode,
} from 'lucide-react';

interface TerminalViewProps {
  tab: TerminalTab;
  theme: TerminalTheme;
  fontSize: number;
  soundEnabled: boolean;
  soundStyle?: TerminalSoundStyle;
  onUpdateTab: (updated: Partial<TerminalTab>) => void;
  onIncreaseFontSize?: () => void;
  onDecreaseFontSize?: () => void;
  onResetFontSize?: () => void;
}

// Sample VFS file system entries for autocompletion context
const VFS_ITEMS = [
  { name: 'documents', isDir: true },
  { name: 'downloads', isDir: true },
  { name: 'src', isDir: true },
  { name: 'build', isDir: true },
  { name: 'config', isDir: true },
  { name: 'README.md', isDir: false },
  { name: 'package.json', isDir: false },
  { name: 'script.py', isDir: false },
  { name: 'notes.txt', isDir: false },
  { name: 'sys.log', isDir: false },
  { name: 'data.csv', isDir: false },
  { name: 'index.html', isDir: false },
];

export const TerminalView: React.FC<TerminalViewProps> = ({
  tab,
  theme,
  fontSize,
  soundEnabled,
  soundStyle = 'mechanical',
  onUpdateTab,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedLineId, setCopiedLineId] = useState<string | null>(null);

  // Ghost suggestion & Popup Autocomplete
  const [suggestion, setSuggestion] = useState<string>('');
  const [fileSuggestions, setFileSuggestions] = useState<Array<{ name: string; isDir: boolean }>>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);

  // Reverse Search (Ctrl+R) State
  const [isReverseSearch, setIsReverseSearch] = useState<boolean>(false);
  const [reverseQuery, setReverseQuery] = useState<string>('');
  const [reverseMatchIdx, setReverseMatchIdx] = useState<number>(0);

  // Drag and Drop VFS State
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);

  // Active hover tooltip on scroll marker
  const [hoveredMarker, setHoveredMarker] = useState<{
    id: string;
    cmd: string;
    exitCode?: number;
    durationMs?: number;
    top: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentDistro = LINUX_DISTROS.find((d) => d.id === tab.distroId) || LINUX_DISTROS[0];

  const availableCmds = [
    'help', 'man', 'neofetch', 'htop', 'top', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cp', 'mv',
    'cat', 'head', 'tail', 'grep', 'tree', 'nano', 'vim', 'vi', 'clear', 'whoami', 'hostname',
    'uname', 'date', 'uptime', 'cmatrix', 'sl', 'apt', 'apt-get', 'pacman', 'dnf', 'yum', 'apk',
    'zypper', 'distro', 'tauri', 'cargo', 'rustc', 'ai'
  ];

  const pathCmds = ['cd', 'cat', 'nano', 'vim', 'vi', 'rm', 'ls', 'cp', 'mv', 'grep', 'head', 'tail', 'touch', 'mkdir'];

  // Sound click effect generator
  const playKeyPressSound = () => {
    if (!soundEnabled) return;
    playTerminalSound(soundStyle as TerminalSoundStyle);
  };

  // 1. Detect Dangerous Commands (Security Warning)
  const getSecurityRisk = (cmdStr: string): { isDangerous: boolean; warningMsg: string } | null => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return null;

    if (/\brm\s+-[a-zA-R]*r[a-zA-R]*f*\s+[\/\*]/i.test(trimmed) || /\brm\s+-[a-zA-R]*f[a-zA-R]*r*\s+[\/\*]/i.test(trimmed)) {
      return {
        isDangerous: true,
        warningMsg: 'COMMANDE HAUTEMENT DESTRUCTIVE : Suppression récursive forcée de fichiers système (rm -rf / ou *)',
      };
    }
    if (/\bchmod\s+(-R\s+)?777/i.test(trimmed)) {
      return {
        isDangerous: true,
        warningMsg: "SÉCURITÉ COMPROMISE : Octroi de tous les droits d'accès (chmod 777)",
      };
    }
    if (/\b(mkfs|fdisk|dd\s+if=)/i.test(trimmed)) {
      return {
        isDangerous: true,
        warningMsg: 'DANGER SYSTÈME : Opération de formatage ou écriture bas-niveau sur disque brut',
      };
    }
    if (/:\(\)\{\s*:\|:&\s*\};:/i.test(trimmed)) {
      return {
        isDangerous: true,
        warningMsg: 'ATTAQUE DÉNI DE SERVICE : Fork bomb détectée',
      };
    }
    if (/\b(shutdown|reboot|init\s+0)\b/i.test(trimmed)) {
      return {
        isDangerous: true,
        warningMsg: 'ACTION SYSTÈME : Extinction ou redémarrage du serveur',
      };
    }
    return null;
  };

  const securityRisk = getSecurityRisk(inputVal);

  // 2. Autocomplete Suggestions & File Popup calculation
  useEffect(() => {
    if (!inputVal.trim()) {
      setSuggestion('');
      setFileSuggestions([]);
      return;
    }

    const parts = inputVal.split(/\s+/);
    const mainCmd = parts[0];
    const lastArg = parts[parts.length - 1] || '';

    // File autocompletion when typing arguments for path commands
    if (parts.length > 1 && pathCmds.includes(mainCmd)) {
      const matches = VFS_ITEMS.filter((item) =>
        item.name.toLowerCase().startsWith(lastArg.toLowerCase())
      );
      setFileSuggestions(matches);
      setSelectedFileIdx(0);
      setSuggestion('');
    } else {
      setFileSuggestions([]);
      const match = availableCmds.find((c) => c.startsWith(inputVal) && c !== inputVal);
      setSuggestion(match || '');
    }
  }, [inputVal]);

  // Reverse Search Matching logic
  const getReverseMatches = () => {
    if (!reverseQuery.trim()) return tab.commandHistory;
    return tab.commandHistory.filter((c) =>
      c.toLowerCase().includes(reverseQuery.toLowerCase())
    );
  };

  const reverseMatches = getReverseMatches();
  const currentReverseMatch =
    reverseMatches.length > 0
      ? reverseMatches[reverseMatches.length - 1 - (reverseMatchIdx % reverseMatches.length)]
      : '';

  // Scroll to bottom whenever history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [tab.history, tab.activeApp, tab.activeEditor, fileSuggestions, isReverseSearch]);

  // Keep input focused when clicking terminal container
  const handleContainerClick = (e: React.MouseEvent) => {
    if (window.getSelection()?.toString()) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Command submission handler
  const handleSubmit = async (cmdToRun?: string) => {
    const command = cmdToRun !== undefined ? cmdToRun : isReverseSearch ? currentReverseMatch : inputVal;
    const trimmed = command.trim();

    playKeyPressSound();

    if (isReverseSearch) {
      setIsReverseSearch(false);
      setReverseQuery('');
    }

    // Append input line to history
    const inputLineId = `line-${Date.now()}`;
    const newHistory: HistoryLine[] = [
      ...tab.history,
      {
        id: inputLineId,
        type: 'input' as const,
        content: command,
        cwd: tab.cwd,
        distroId: tab.distroId,
      },
    ];

    setInputVal('');
    setSuggestion('');
    setFileSuggestions([]);
    setHistoryIdx(-1);

    if (!trimmed) {
      onUpdateTab({ history: newHistory });
      return;
    }

    // Update command history array
    const updatedCmdHistory = [...tab.commandHistory, command];

    setIsExecuting(true);
    const startTime = performance.now();
    const result = await runTerminalCommand(command, tab.cwd, tab.distroId);
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    setIsExecuting(false);

    onUpdateTab(applyTerminalResult(result, tab, newHistory, updatedCmdHistory, durationMs));
  };

  // Keyboard navigation & tab autocompletion & Ctrl+R
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    playKeyPressSound();

    // Toggle Reverse Search (Ctrl+R)
    if (e.ctrlKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      if (!isReverseSearch) {
        setIsReverseSearch(true);
        setReverseQuery('');
        setReverseMatchIdx(0);
      } else {
        // Cycle next reverse match
        if (reverseMatches.length > 0) {
          setReverseMatchIdx((prev) => (prev + 1) % reverseMatches.length);
        }
      }
      return;
    }

    // Escape in reverse search
    if (e.key === 'Escape') {
      if (isReverseSearch) {
        setIsReverseSearch(false);
        setReverseQuery('');
        return;
      }
      if (fileSuggestions.length > 0) {
        setFileSuggestions([]);
        return;
      }
    }

    if (e.key === 'Enter') {
      handleSubmit();
      return;
    }

    // Popup file navigation (ArrowUp / ArrowDown)
    if (fileSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedFileIdx((prev) => (prev + 1) % fileSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedFileIdx((prev) => (prev - 1 + fileSuggestions.length) % fileSuggestions.length);
        return;
      }
    }

    // Tab autocompletion
    if (e.key === 'Tab') {
      e.preventDefault();
      if (fileSuggestions.length > 0) {
        const chosen = fileSuggestions[selectedFileIdx];
        if (chosen) {
          const parts = inputVal.split(/\s+/);
          parts[parts.length - 1] = chosen.name + (chosen.isDir ? '/' : '');
          setInputVal(parts.join(' '));
          setFileSuggestions([]);
        }
        return;
      }

      if (suggestion) {
        setInputVal(suggestion + ' ');
        setSuggestion('');
        return;
      }

      const match = availableCmds.find((c) => c.startsWith(inputVal));
      if (match) {
        setInputVal(match + ' ');
      }
      return;
    }

    // Command History navigation (Up / Down)
    if (e.key === 'ArrowUp' && fileSuggestions.length === 0 && !isReverseSearch) {
      e.preventDefault();
      if (tab.commandHistory.length === 0) return;
      const nextIdx = historyIdx < tab.commandHistory.length - 1 ? historyIdx + 1 : historyIdx;
      setHistoryIdx(nextIdx);
      const histCmd = tab.commandHistory[tab.commandHistory.length - 1 - nextIdx];
      if (histCmd) setInputVal(histCmd);
      return;
    }

    if (e.key === 'ArrowDown' && fileSuggestions.length === 0 && !isReverseSearch) {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        const histCmd = tab.commandHistory[tab.commandHistory.length - 1 - nextIdx];
        if (histCmd) setInputVal(histCmd);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
      return;
    }

    // Ctrl + L (Clear screen)
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      onUpdateTab({ history: [] });
      return;
    }
  };

  // Copy line content handler
  const handleCopyLine = (id: string, content: string | React.ReactNode) => {
    const textToCopy = typeof content === 'string' ? content : String(content);
    navigator.clipboard.writeText(textToCopy);
    setCopiedLineId(id);
    setTimeout(() => setCopiedLineId(null), 1500);
  };

  // Drag and Drop VFS Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    playKeyPressSound();

    const importedFiles: string[] = [];
    const newLines: HistoryLine[] = [...tab.history];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeName = file.name.replace(/\s+/g, '_');
      const sizeKb = (file.size / 1024).toFixed(1);

      importedFiles.push(safeName);

      // Add positive system feedback line to terminal history
      newLines.push({
        id: `drop-${Date.now()}-${i}`,
        type: 'output',
        content: `[+] VFS Import: Fichier '${safeName}' (${sizeKb} Ko) copié avec succès dans ${tab.cwd}/`,
        cwd: tab.cwd,
        distroId: tab.distroId,
      });

      // Also create an empty file or touch it in the VFS simulation
      runTerminalCommand(`touch ${safeName}`, tab.cwd, tab.distroId);
    }

    onUpdateTab({ history: newLines });

    // Pre-fill the input line with the first imported file path
    if (importedFiles.length > 0) {
      setInputVal(`cat ${importedFiles[0]}`);
      setDropFeedback(`${importedFiles.length} fichier(s) importé(s) dans ${tab.cwd}`);
      setTimeout(() => setDropFeedback(null), 3000);
    }
  };

  // Scroll directly to a specific history line when clicking a scroll marker
  const scrollToLine = (lineId: string) => {
    const el = document.getElementById(lineId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Render Prompt Prefix
  const renderPromptSymbol = (tabCwd: string = tab.cwd) => {
    return (
      <span className="font-mono text-xs font-bold inline-flex items-center gap-1 select-none mr-2">
        <span style={{ color: theme.promptUser }}>{currentDistro.defaultUser}</span>
        <span style={{ color: theme.fg }}>@</span>
        <span style={{ color: theme.promptHost }}>{currentDistro.hostName}</span>
        <span style={{ color: theme.fg }}>:</span>
        <span style={{ color: theme.promptPath }}>{tabCwd}</span>
        <span style={{ color: theme.accent }}>{currentDistro.promptSymbol}</span>
      </span>
    );
  };

  // Command History input lines for the augmented scrollbar markers
  const commandLines = tab.history.filter((l) => l.type === 'input');

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full overflow-hidden relative select-text"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-zinc-950/85 backdrop-blur-sm border-2 border-dashed border-emerald-400/80 rounded-lg m-2 flex flex-col items-center justify-center pointer-events-none transition-all animate-fade-in">
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <p className="text-base font-bold text-white font-mono">
            Déposez vos fichiers pour les importer
          </p>
          <p className="text-xs text-emerald-300 font-mono mt-1">
            Destination : <code className="bg-zinc-900 px-2 py-0.5 rounded text-amber-300">{tab.cwd}/</code>
          </p>
          <p className="text-[11px] text-zinc-400 font-mono mt-2">
            Le chemin sera automatiquement prêt dans la ligne de commande
          </p>
        </div>
      )}

      {/* Main Terminal Viewport with Augmented Scrollbar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Terminal Text Scrollable Area */}
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed cursor-text relative flex flex-col justify-between"
          style={{
            backgroundColor: theme.bg,
            color: theme.fg,
            fontSize: `${fontSize}px`,
          }}
        >
          {/* Lines History Container */}
          <div className="space-y-2">
            {tab.history.map((line) => {
              if (line.type === 'input') {
                const exitOk = line.exitCode === undefined || line.exitCode === 0;
                return (
                  <div
                    key={line.id}
                    id={line.id}
                    className="flex items-center justify-between flex-wrap group relative pt-1 rounded hover:bg-white/[0.02] transition px-1"
                  >
                    <div className="flex items-center flex-wrap flex-1">
                      {renderPromptSymbol(line.cwd)}
                      <span className="font-mono text-white font-semibold">{String(line.content)}</span>
                    </div>

                    {/* Exit Code & Duration Badge Metrics */}
                    <div className="flex items-center gap-2 text-[10px] font-mono select-none opacity-80">
                      {line.durationMs !== undefined && (
                        <span className="text-zinc-500 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                          {line.durationMs}ms
                        </span>
                      )}
                      {line.exitCode !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded border font-bold flex items-center gap-1 ${
                            exitOk
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {exitOk ? '✔ 0' : `✘ ${line.exitCode}`}
                        </span>
                      )}
                      <button
                        onClick={() => handleCopyLine(line.id, line.content)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400"
                        title="Copier la commande"
                      >
                        {copiedLineId === line.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              }

              if (line.type === 'output' || line.type === 'error') {
                const isErr = line.type === 'error';
                return (
                  <div
                    key={line.id}
                    id={line.id}
                    className={`group relative whitespace-pre-wrap font-mono break-all text-zinc-200 pl-2.5 border-l-2 py-1 my-1 rounded-r ${
                      isErr
                        ? 'border-rose-500/60 bg-rose-950/10 text-rose-200'
                        : 'border-emerald-500/40 bg-zinc-950/20'
                    }`}
                  >
                    <div className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
                      <button
                        onClick={() => handleCopyLine(line.id, line.content)}
                        className="text-zinc-400 hover:text-emerald-400 text-[10px] flex items-center gap-1"
                        title="Copier la sortie"
                      >
                        {copiedLineId === line.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copié
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copier
                          </>
                        )}
                      </button>
                    </div>
                    {line.content}
                  </div>
                );
              }

              return null;
            })}

            {/* Security Alert Banner on Dangerous Command */}
            {securityRisk && securityRisk.isDangerous && (
              <div className="p-2.5 rounded-lg border border-rose-500/60 bg-rose-950/40 text-rose-200 text-[11px] font-mono flex items-center gap-2 shadow-lg shadow-rose-950/40 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold text-rose-300">AVERTISSEMENT DE SÉCURITÉ :</span>{' '}
                  {securityRisk.warningMsg}
                </div>
              </div>
            )}

            {/* File Autocomplete Popup Dropdown */}
            {fileSuggestions.length > 0 && (
              <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-lg p-1.5 shadow-2xl backdrop-blur-md max-w-sm mb-1 z-30 animate-fade-in space-y-0.5">
                <div className="text-[10px] font-mono text-zinc-400 px-2 py-1 border-b border-zinc-800/80 flex items-center justify-between">
                  <span>Suggestions VFS (Entrée ou Tab pour insérer)</span>
                  <span className="text-emerald-400 font-semibold">{fileSuggestions.length} fichiers</span>
                </div>
                {fileSuggestions.map((item, idx) => (
                  <div
                    key={item.name}
                    onClick={() => {
                      const parts = inputVal.split(/\s+/);
                      parts[parts.length - 1] = item.name + (item.isDir ? '/' : '');
                      setInputVal(parts.join(' '));
                      setFileSuggestions([]);
                      inputRef.current?.focus();
                    }}
                    className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between cursor-pointer transition ${
                      idx === selectedFileIdx
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.isDir ? (
                        <Folder className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{item.name}</span>
                    </div>
                    {item.isDir && <span className="text-[10px] text-zinc-500">[dossier]</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Reverse Search Mode (Ctrl+R) Prompt */}
            {isReverseSearch ? (
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-amber-500/40 rounded-lg p-2 font-mono text-xs text-amber-300 shadow-xl">
                <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-zinc-400 select-none">
                  (reverse-i-search)`<span className="text-amber-200">{reverseQuery}</span>`:
                </span>
                <input
                  type="text"
                  value={reverseQuery}
                  onChange={(e) => setReverseQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  placeholder="Tapez pour chercher dans l'historique..."
                  className="flex-1 bg-transparent text-white font-mono focus:outline-none border-none p-0"
                />
                {currentReverseMatch && (
                  <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-mono text-[11px]">
                    {currentReverseMatch}
                  </span>
                )}
                <button
                  onClick={() => {
                    setIsReverseSearch(false);
                    setReverseQuery('');
                  }}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Current Active Input Prompt */
              <div className="flex items-center flex-wrap pt-1 relative">
                {renderPromptSymbol()}

                <div className="flex-1 relative flex items-center min-w-[200px]">
                  {/* Input Element */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    disabled={isExecuting}
                    className={`w-full bg-transparent font-mono text-white focus:outline-none border-none p-0 tracking-wide z-10 transition ${
                      securityRisk?.isDangerous ? 'text-rose-300 font-bold bg-rose-950/20 px-1 rounded' : ''
                    }`}
                    style={{ color: securityRisk?.isDangerous ? '#fca5a5' : theme.fg }}
                  />

                  {/* Ghost Autocomplete Overlay */}
                  {suggestion && inputVal && (
                    <div className="absolute left-0 top-0 pointer-events-none font-mono text-zinc-600 select-none">
                      <span className="invisible">{inputVal}</span>
                      <span>{suggestion.slice(inputVal.length)}</span>
                      <span className="ml-2 text-[10px] bg-zinc-800/80 px-1.5 py-0.2 rounded text-zinc-400 border border-zinc-700">
                        Tab ↹
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Barre de défilement augmentée (Repères d'historique) */}
        {commandLines.length > 0 && (
          <div
            ref={scrollTrackRef}
            className="w-4 bg-zinc-950/60 border-l border-zinc-800/60 flex flex-col items-center py-2 relative select-none"
            title="Repères d'historique : vert (exit 0), rouge (erreur). Cliquez pour naviguer."
          >
            {commandLines.map((line, idx) => {
              const exitOk = line.exitCode === undefined || line.exitCode === 0;
              // Distribute dots along the track
              const topPercent =
                commandLines.length === 1 ? 50 : Math.round((idx / (commandLines.length - 1)) * 90) + 5;

              return (
                <button
                  key={line.id}
                  onClick={() => scrollToLine(line.id)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredMarker({
                      id: line.id,
                      cmd: String(line.content),
                      exitCode: line.exitCode,
                      durationMs: line.durationMs,
                      top: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredMarker(null)}
                  style={{ top: `${topPercent}%` }}
                  className={`absolute w-2.5 h-2.5 rounded-full transition-all duration-150 transform -translate-x-1/2 left-1/2 hover:scale-150 shadow-sm ${
                    exitOk
                      ? 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-300'
                      : 'bg-rose-500 hover:bg-rose-400 border border-rose-300'
                  }`}
                  aria-label={`Aller à: ${line.content}`}
                />
              );
            })}

            {/* Hover Tooltip for Augmented Scrollbar Marker */}
            {hoveredMarker && (
              <div
                style={{ top: Math.max(10, hoveredMarker.top - 120) }}
                className="fixed right-6 z-50 bg-zinc-900/95 border border-zinc-700 text-zinc-100 px-2.5 py-1.5 rounded-lg shadow-xl font-mono text-[11px] pointer-events-none whitespace-nowrap animate-fade-in backdrop-blur-md"
              >
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hoveredMarker.exitCode === 0 || hoveredMarker.exitCode === undefined
                        ? 'bg-emerald-400'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span>{hoveredMarker.cmd || '(vide)'}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
                  <span>Exit: {hoveredMarker.exitCode ?? 0}</span>
                  {hoveredMarker.durationMs !== undefined && (
                    <span>• {hoveredMarker.durationMs}ms</span>
                  )}
                  <span className="text-sky-400">Clic pour naviguer</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Barre d'état intégrée (Powerline / Status Bar) */}
      <div className="h-7 bg-zinc-950 border-t border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center justify-between px-2 select-none z-30 shrink-0">
        {/* Left Segments (Powerline Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Distro Segment */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">{currentDistro.name}</span>
          </div>

          {/* Session Mode */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800/80 text-zinc-400">
            <Server className="w-3 h-3 text-sky-400" />
            <span>LOCAL: bash</span>
          </div>

          {/* Git Branch / Directory Status */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800/80 text-emerald-400">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
            <span className="text-[10px] text-zinc-500">(clean)</span>
          </div>

          {/* Path Segment */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 max-w-[200px] truncate">
            <Folder className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{tab.cwd}</span>
          </div>
        </div>

        {/* Right Segments: Encoding, Font Zoom, Sound, Line Count */}
        <div className="flex items-center gap-2 pl-2">
          {/* Drop Toast Feedback if active */}
          {dropFeedback && (
            <span className="hidden md:inline-flex text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {dropFeedback}
            </span>
          )}

          {/* Encoding & Format */}
          <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900/60 text-zinc-400 text-[10px]">
            <span>UTF-8</span>
            <span className="text-zinc-600">|</span>
            <span>LF</span>
          </div>

          {/* Font Zoom Controls */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-zinc-300">
            <button
              onClick={onDecreaseFontSize}
              title="Diminuer la police (A-)"
              className="px-1.5 hover:text-white hover:bg-zinc-800 rounded transition"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span
              onClick={onResetFontSize}
              title="Réinitialiser la taille (13px)"
              className="px-1 text-[10px] font-bold text-zinc-300 cursor-pointer hover:text-emerald-400"
            >
              {fontSize}px
            </span>
            <button
              onClick={onIncreaseFontSize}
              title="Agrandir la police (A+)"
              className="px-1.5 hover:text-white hover:bg-zinc-800 rounded transition"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Sound Effect Indicator */}
          <div
            title={`Effet sonore: ${soundEnabled ? soundStyle : 'Désactivé'}`}
            className="flex items-center text-zinc-400"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-600" />
            )}
          </div>

          {/* History Count & Clear button */}
          <div className="flex items-center gap-1">
            <span className="hidden lg:inline text-[10px] text-zinc-500">
              {tab.history.length} lignes
            </span>
            <button
              onClick={() => onUpdateTab({ history: [] })}
              title="Effacer le terminal (Ctrl+L)"
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-rose-300 rounded transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
