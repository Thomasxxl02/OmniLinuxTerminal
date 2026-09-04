import React, { useState, useEffect } from 'react';
import { fsWrite, errMsg } from '../lib/fsApi';
import { Save, X, HelpCircle, FileText } from 'lucide-react';

interface NanoEditorProps {
  filePath: string;
  initialContent: string;
  onClose: (saved: boolean) => void;
}

export const NanoEditor: React.FC<NanoEditorProps> = ({
  filePath,
  initialContent,
  onClose,
}) => {
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState<string>('');
  const fileName = filePath.split('/').pop() || filePath;

  const handleSave = async () => {
    try {
      // filePath provient déjà normalisé de l'effet Rust openEditor.
      await fsWrite(filePath, content, false);
      setMessage(`[ Écrit ${content.length} octets dans '${fileName}' ]`);
    } catch (e) {
      setMessage(`[ Échec de l'écriture : ${errMsg(e)} ]`);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+O WriteOut (Save)
    if (e.ctrlKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      handleSave();
    }
    // Ctrl+X Exit
    if (e.ctrlKey && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      onClose(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white font-mono text-sm border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="bg-zinc-800 text-zinc-200 px-4 py-1.5 flex justify-between items-center text-xs font-semibold select-none">
        <span className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          GNU nano 7.2
        </span>
        <span className="truncate max-w-xs">{filePath}</span>
        <span className="text-zinc-400">{content ? `${content.split('\n').length}L` : '0L'}</span>
      </div>

      {/* Editor Main Content */}
      <div className="flex-1 p-3 bg-zinc-950 text-zinc-100 flex flex-col relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full flex-1 bg-transparent text-emerald-300 font-mono text-sm p-1 resize-none focus:outline-none leading-relaxed tracking-wide selection:bg-emerald-500/30"
          placeholder="Commencez à taper votre texte..."
        />
        {message && (
          <div className="absolute bottom-2 left-4 right-4 bg-zinc-800/90 text-amber-300 text-xs px-3 py-1 rounded shadow text-center border border-amber-500/30">
            {message}
          </div>
        )}
      </div>

      {/* Bottom Nano Shortcut Bar */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-2 text-xs select-none">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-300">
          <button
            onClick={() => {
              setMessage('Aide Nano : Utiliser Ctrl+O pour sauvegarder, Ctrl+X pour quitter.');
            }}
            className="flex items-center gap-1.5 hover:text-white hover:bg-zinc-800 p-1 rounded transition"
          >
            <span className="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-[11px] font-bold">^G</span>
            <span>Obtenir de l'aide</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 hover:text-white hover:bg-zinc-800 p-1 rounded transition"
          >
            <span className="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-[11px] font-bold">^O</span>
            <span className="flex items-center gap-1">
              <Save className="w-3 h-3 text-emerald-400" /> Enregistrer
            </span>
          </button>

          <button
            onClick={() => {
              const query = prompt('Rechercher du texte:');
              if (query && content.includes(query)) {
                setMessage(`Mot '${query}' trouvé.`);
              } else if (query) {
                setMessage(`Mot '${query}' introuvable.`);
              }
            }}
            className="flex items-center gap-1.5 hover:text-white hover:bg-zinc-800 p-1 rounded transition"
          >
            <span className="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-[11px] font-bold">^W</span>
            <span>Rechercher</span>
          </button>

          <button
            onClick={() => onClose(true)}
            className="flex items-center gap-1.5 hover:text-white hover:bg-zinc-800 p-1 rounded transition text-rose-300"
          >
            <span className="bg-zinc-800 text-rose-400 px-1 py-0.5 rounded text-[11px] font-bold">^X</span>
            <span className="flex items-center gap-1">
              <X className="w-3 h-3 text-rose-400" /> Quitter Nano
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
