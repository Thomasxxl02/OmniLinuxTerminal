import React, { useState } from 'react';
import { fsWrite, errMsg } from '../lib/fsApi';

interface VimEditorProps {
  filePath: string;
  initialContent: string;
  onClose: (saved: boolean) => void;
}

export const VimEditor: React.FC<VimEditorProps> = ({
  filePath,
  initialContent,
  onClose,
}) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'normal' | 'insert' | 'command'>('normal');
  const [commandInput, setCommandInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fileName = filePath.split('/').pop() || filePath;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mode === 'insert') {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMode('normal');
        setStatusMsg('');
      }
      return;
    }

    if (mode === 'normal') {
      if (e.key === 'i' || e.key === 'a') {
        e.preventDefault();
        setMode('insert');
        setStatusMsg('-- INSERTION --');
        return;
      }
      if (e.key === ':') {
        e.preventDefault();
        setMode('command');
        setCommandInput(':');
        return;
      }
    }
  };

  const handleCommandKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setMode('normal');
      setCommandInput('');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = commandInput.trim();
      if (cmd === ':w') {
        try {
          // filePath provient déjà normalisé de l'effet Rust openEditor.
          await fsWrite(filePath, content, false);
          setStatusMsg(`"${fileName}" écrites, ${content.length}B`);
        } catch (err) {
          setStatusMsg(`E466: ${errMsg(err)}`);
        }
        setMode('normal');
        setCommandInput('');
      } else if (cmd === ':q') {
        onClose(false);
      } else if (cmd === ':wq' || cmd === ':x' || cmd === ':wq!') {
        try {
          await fsWrite(filePath, content, false);
          onClose(true);
        } catch (err) {
          setStatusMsg(`E466: ${errMsg(err)}`);
          setMode('normal');
          setCommandInput('');
        }
      } else if (cmd === ':q!') {
        onClose(false);
      } else {
        setStatusMsg(`E492: Commande non reconnue : ${cmd}`);
        setMode('normal');
        setCommandInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono text-sm border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Vim Editor Content */}
      <div className="flex-1 p-3 bg-zinc-950 flex flex-col relative">
        <textarea
          value={content}
          onChange={(e) => mode === 'insert' && setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full flex-1 bg-transparent text-emerald-400 font-mono text-sm p-1 resize-none focus:outline-none leading-relaxed tracking-wide selection:bg-emerald-500/30"
          readOnly={mode !== 'insert'}
        />
      </div>

      {/* Vim Command Line / Status Bar */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-3 py-1.5 flex justify-between items-center text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
              mode === 'insert'
                ? 'bg-emerald-500 text-zinc-950'
                : mode === 'command'
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {mode === 'insert' ? 'INSERT' : mode === 'command' ? 'COMMAND' : 'NORMAL'}
          </span>

          {mode === 'command' ? (
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleCommandKeyDown}
              autoFocus
              className="bg-transparent text-amber-300 font-mono focus:outline-none w-48"
            />
          ) : (
            <span className="text-zinc-300">{statusMsg || `"${filePath}"`}</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
          <span>Appuyez sur 'i' pour insérer, ':wq' pour enregistrer & quitter</span>
          <span>{content.split('\n').length} lignes</span>
        </div>
      </div>
    </div>
  );
};
