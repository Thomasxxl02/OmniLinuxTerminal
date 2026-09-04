import React, { useState, useEffect, useRef } from 'react';
import { TerminalTab, TerminalTheme, DistroId, TerminalSoundStyle } from '../types';
import { LINUX_DISTROS } from '../data/distros';
import { runTerminalCommand, applyTerminalResult } from '../lib/tauriBridge';
import { playTerminalSound } from '../lib/soundEffects';
import { Copy, Trash2, Terminal as TerminalIcon, Sparkles } from 'lucide-react';

interface TerminalViewProps {
  tab: TerminalTab;
  theme: TerminalTheme;
  fontSize: number;
  soundEnabled: boolean;
  soundStyle?: TerminalSoundStyle;
  onUpdateTab: (updated: Partial<TerminalTab>) => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  tab,
  theme,
  fontSize,
  soundEnabled,
  soundStyle = 'mechanical',
  onUpdateTab,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentDistro = LINUX_DISTROS.find((d) => d.id === tab.distroId) || LINUX_DISTROS[0];

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

    // Tab autocompletion
    if (e.key === 'Tab') {
      e.preventDefault();
      const availableCmds = [
        'help', 'man', 'neofetch', 'htop', 'top', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cp', 'mv',
        'cat', 'head', 'tail', 'grep', 'tree', 'nano', 'vim', 'vi', 'clear', 'whoami', 'hostname',
        'uname', 'date', 'uptime', 'cmatrix', 'sl', 'apt', 'apt-get', 'pacman', 'dnf', 'yum', 'apk',
        'zypper', 'distro', 'tauri', 'cargo', 'rustc'
      ];
      const match = availableCmds.find((c) => c.startsWith(inputVal));
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
