import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TerminalTab, TerminalTheme, DistroId, TerminalSoundStyle } from '../types';
import { useDistros, resolveDistro } from '../lib/distroStore';
import { runTerminalCommand, applyTerminalResult } from '../lib/tauriBridge';
import { terminalSupportedCommands } from '../lib/terminalApi';
import { playTerminalSound } from '../lib/soundEffects';
import { Copy, Trash2, Terminal as TerminalIcon, Sparkles } from 'lucide-react';

export interface SshSessionState {
  connected: boolean;
  host: string;
  user: string;
  output: string;
}

interface TerminalViewProps {
  tab: TerminalTab;
  theme: TerminalTheme;
  fontSize: number;
  soundEnabled: boolean;
  soundStyle?: TerminalSoundStyle;
  onUpdateTab: (updated: Partial<TerminalTab>) => void;
  sshSession?: SshSessionState | null;
  onSshKey?: (bytes: number[]) => void;
  onSshDisconnect?: () => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  tab,
  theme,
  fontSize,
  soundEnabled,
  soundStyle = 'mechanical',
  onUpdateTab,
  sshSession,
  onSshKey,
  onSshDisconnect,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [supportedCmds, setSupportedCmds] = useState<string[]>([]);

  // Liste des commandes fournie par le moteur Rust (source de vérité unique).
  useEffect(() => {
    terminalSupportedCommands()
      .then(setSupportedCmds)
      .catch(() => setSupportedCmds([]));
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const distros = useDistros();
  const currentDistro = resolveDistro(distros, tab.distroId);

  // Sound click effect generator
  const playKeyPressSound = () => {
    if (!soundEnabled) return;
    playTerminalSound(soundStyle as TerminalSoundStyle);
  };

  // Scroll to bottom whenever history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [tab.history, tab.activeApp, tab.activeEditor]);

  // Always keep input focused when clicking terminal container
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Command submission handler
  const handleSubmit = async (cmdToRun?: string) => {
    const command = cmdToRun !== undefined ? cmdToRun : inputVal;
    const trimmed = command.trim();

    playKeyPressSound();

    // Append input line to history
    const inputLineId = `line-${Date.now()}`;
    const newHistory = [
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
    setHistoryIdx(-1);

    if (!trimmed) {
      onUpdateTab({ history: newHistory });
      return;
    }

    // Update command history array
    const updatedCmdHistory = [...tab.commandHistory, command];

    setIsExecuting(true);
    const result = await runTerminalCommand(command, tab.cwd, tab.distroId);
    setIsExecuting(false);

    onUpdateTab(applyTerminalResult(result, tab, newHistory, updatedCmdHistory));
  };

  // Keyboard navigation & tab autocompletion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    playKeyPressSound();

    if (e.key === 'Enter') {
      handleSubmit();
      return;
    }

    // Tab autocompletion (source : moteur Rust, plus de liste dupliquée)
    if (e.key === 'Tab') {
      e.preventDefault();
      const match = supportedCmds.find((c) => c.startsWith(inputVal));
      if (match) {
        setInputVal(match + ' ');
      }
      return;
    }

    // Command History navigation (Up / Down)
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (tab.commandHistory.length === 0) return;
      const nextIdx = historyIdx < tab.commandHistory.length - 1 ? historyIdx + 1 : historyIdx;
      setHistoryIdx(nextIdx);
      const histCmd = tab.commandHistory[tab.commandHistory.length - 1 - nextIdx];
      if (histCmd) setInputVal(histCmd);
      return;
    }

    if (e.key === 'ArrowDown') {
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

  const sshOutRef = useRef<HTMLPreElement | null>(null);
  const sshInRef = useRef<HTMLInputElement | null>(null);

  // Scroll automatique en bas à chaque nouvelle sortie SSH.
  useEffect(() => {
    if (sshSession?.connected && sshOutRef.current) {
      sshOutRef.current.scrollTop = sshOutRef.current.scrollHeight;
    }
  }, [sshSession?.output, sshSession?.connected]);

  // Convertit un événement clavier en octets à envoyer (PTY BRUT, pas de prompt local).
  const handleSshKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      let bytes: number[] = [];
      if (key === 'Enter') bytes = [13];
      else if (key === 'Backspace') bytes = [127];
      else if (key === 'Tab') bytes = [9];
      else if (key === 'ArrowUp') bytes = [27, 91, 65];
      else if (key === 'ArrowDown') bytes = [27, 91, 66];
      else if (key === 'ArrowRight') bytes = [27, 91, 67];
      else if (key === 'ArrowLeft') bytes = [27, 91, 68];
      else if (e.ctrlKey && key.toLowerCase() === 'c') bytes = [3];
      else if (e.ctrlKey && key.toLowerCase() === 'd') bytes = [4];
      else if (e.ctrlKey && key.toLowerCase() === 'l') bytes = [12];
      else if (e.ctrlKey) bytes = [];
      else if (key.length === 1) bytes = [key.charCodeAt(0)];

      if (bytes.length && onSshKey) {
        e.preventDefault();
        onSshKey(bytes);
      } else if (key === 'Enter' || key.startsWith('Arrow')) {
        e.preventDefault();
      }
    },
    [onSshKey]
  );

  // Mode SSH interactif : passthrough clavier → hôte, sortie affichée telle quelle.
  if (sshSession?.connected) {
    return (
      <div
        className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed select-text cursor-text relative flex flex-col"
        style={{ backgroundColor: theme.bg, color: theme.fg, fontSize: `${fontSize}px` }}
        onClick={() => sshInRef.current?.focus()}
      >
        <div className="flex items-center justify-between mb-3 text-[11px] border-b border-zinc-800 pb-2">
          <span className="flex items-center gap-2 text-emerald-400 font-bold">
            <TerminalIcon className="w-3.5 h-3.5" />
            Session SSH interactive — {sshSession.user}@{sshSession.host}
          </span>
          <button
            onClick={onSshDisconnect}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-medium"
          >
            Déconnecter
          </button>
        </div>
        <pre
          ref={sshOutRef}
          className="whitespace-pre-wrap break-all flex-1 font-mono"
          style={{ color: theme.fg }}
        >
          {sshSession.output}
        </pre>
        <input
          ref={sshInRef}
          autoFocus
          onKeyDown={handleSshKeyDown}
          className="absolute opacity-0 w-0 h-0"
          aria-label="Clavier de session SSH"
        />
      </div>
    );
  }

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

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed select-text cursor-text relative flex flex-col justify-between"
      style={{
        backgroundColor: theme.bg,
        color: theme.fg,
        fontSize: `${fontSize}px`,
      }}
    >
      {/* Lines History Container */}
      <div className="space-y-2">
        {/* Banner header on clean session */}
        {tab.history.length === 0 && (
          <div className="mb-4 p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 text-zinc-300 space-y-1">
            <p className="font-bold text-emerald-400">
              OmniLinux v2.4 [{currentDistro.name}] - Terminal Universel
            </p>
            <p className="text-zinc-400 text-[11px]">
              Tapez <code className="text-amber-300">help</code> pour voir la liste des commandes, <code className="text-sky-300">neofetch</code> pour les specs, ou <code className="text-emerald-300">ai "votre question"</code> pour l'assistant IA Gemini.
            </p>
          </div>
        )}

        {tab.history.map((line) => {
          if (line.type === 'input') {
            return (
              <div key={line.id} className="flex items-start flex-wrap">
                {renderPromptSymbol(line.cwd)}
                <span className="font-mono text-white font-semibold">{line.content}</span>
              </div>
            );
          }

          if (line.type === 'output') {
            return (
              <div
                key={line.id}
                className="whitespace-pre-wrap font-mono break-all text-zinc-200 pl-1 border-l-2 border-emerald-500/30 py-0.5 my-1"
              >
                {line.content}
              </div>
            );
          }

          return null;
        })}

        {/* Current Active Input Prompt */}
        <div className="flex items-center flex-wrap pt-1">
          {renderPromptSymbol()}
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={isExecuting}
            className="flex-1 bg-transparent font-mono text-white focus:outline-none border-none p-0 tracking-wide"
            style={{ color: theme.fg }}
          />
        </div>
      </div>

      {/* Floating Action Menu in bottom corner */}
      <div className="sticky bottom-0 right-0 self-end pt-4 select-none opacity-80 hover:opacity-100 transition flex gap-2">
        <button
          onClick={() => onUpdateTab({ history: [] })}
          title="Effacer le terminal (Ctrl+L)"
          className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2 py-1 rounded text-[10px] border border-zinc-800 flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>
    </div>
  );
};
