import { useState } from 'react';
import { Edit3 } from 'lucide-react';

// ===========================================================================
// Renommage d'onglet (modale self-contained). Le nom saisi est un état local
// initialisé au titre courant ; la sauvegarde remonte via onSave(name).
// ===========================================================================

interface MenuBarRenameModalProps {
  initialTitle: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function MenuBarRenameModal({ initialTitle, onClose, onSave }: MenuBarRenameModalProps) {
  const [value, setValue] = useState(initialTitle);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl w-full max-w-sm text-zinc-100 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-white">
          <Edit3 className="w-4 h-4 text-emerald-400" />
          Renommer l'Onglet Actif
        </h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSave(value.trim());
            if (e.key === 'Escape') onClose();
          }}
          autoFocus
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
        />
        <div className="flex justify-end gap-2 text-xs">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
            Annuler
          </button>
          <button
            onClick={() => value.trim() && onSave(value.trim())}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-zinc-950"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
