import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { TerminalTab } from '../../types';

// ===========================================================================
// Recherche dans le journal du terminal (modale self-contained).
// Le filtre est un état local ; la copie d'une ligne remonte via onCopy.
// ===========================================================================

interface MenuBarSearchModalProps {
  history: TerminalTab['history'];
  onClose: () => void;
  onCopy: (content: string) => void;
}

export function MenuBarSearchModal({ history, onClose, onCopy }: MenuBarSearchModalProps) {
  const [filter, setFilter] = useState('');
  const filtered = history.filter((h) =>
    filter ? h.content.toLowerCase().includes(filter.toLowerCase()) : true
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl w-full max-w-lg text-zinc-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2 text-white">
            <Search className="w-4 h-4 text-blue-400" />
            Recherche dans le Journal du Terminal
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="text"
          placeholder="Tapez un mot-clé, commande ou motif grep..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoFocus
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
        />
        <div className="max-h-60 overflow-y-auto space-y-1.5 font-mono text-[11px] bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
          {filtered.length === 0 ? (
            <div className="text-zinc-500 italic text-center py-4">Aucun résultat trouvé</div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-1.5 rounded hover:bg-zinc-800/60 flex items-start justify-between group border-b border-zinc-900/60"
              >
                <div className="truncate pr-2">
                  <span className="text-zinc-500 mr-2 text-[10px]">[{item.type}]</span>
                  <span
                    className={
                      item.type === 'error'
                        ? 'text-rose-400'
                        : item.type === 'input'
                        ? 'text-emerald-400 font-bold'
                        : 'text-zinc-300'
                    }
                  >
                    {item.content}
                  </span>
                </div>
                <button
                  onClick={() => onCopy(item.content)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 bg-zinc-800 rounded shrink-0 transition"
                >
                  Copier
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between items-center text-[11px] text-zinc-400">
          <span>{history.length} entrées totales</span>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
