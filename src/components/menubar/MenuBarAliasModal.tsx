import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

// ===========================================================================
// Création d'alias bash (modale self-contained). Le nom/la commande sont des
// états locaux ; la définition remonte via onSave(name, cmd).
// ===========================================================================

interface MenuBarAliasModalProps {
  onClose: () => void;
  onSave: (name: string, cmd: string) => void;
}

export function MenuBarAliasModal({ onClose, onSave }: MenuBarAliasModalProps) {
  const [name, setName] = useState('');
  const [cmd, setCmd] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl w-full max-w-md text-zinc-100 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-white">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          Créer un Nouvel Alias Bash
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Nom de l'alias (ex: ll, update, cls)</label>
            <input
              type="text"
              placeholder="ex: mycmd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Commande substituée (ex: ls -la --color=auto)</label>
            <input
              type="text"
              placeholder="ex: git status -s"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 text-xs">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
            Annuler
          </button>
          <button
            onClick={() => {
              if (name.trim() && cmd.trim()) onSave(name.trim(), cmd.trim());
            }}
            disabled={!name.trim() || !cmd.trim()}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-bold text-white transition"
          >
            Définir l'Alias
          </button>
        </div>
      </div>
    </div>
  );
}
