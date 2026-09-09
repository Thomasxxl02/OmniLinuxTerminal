import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

// ===========================================================================
// Coller & exécuter dans le terminal (modale self-contained). Le texte collé
// est un état local ; l'exécution remonte via onRun(cmd).
// ===========================================================================

interface MenuBarPasteModalProps {
  onClose: () => void;
  onRun: (cmd: string) => void;
}

export function MenuBarPasteModal({ onClose, onRun }: MenuBarPasteModalProps) {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl w-full max-w-md text-zinc-100 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-white">
          <ClipboardCheck className="w-4 h-4 text-emerald-400" />
          Coller & Exécuter dans le Terminal
        </h3>
        <textarea
          placeholder="Collez ou tapez ici votre commande ou script shell..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          autoFocus
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
        <div className="flex justify-end gap-2 text-xs">
          <button
            onClick={() => {
              setValue('');
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (value.trim()) {
                onRun(value.trim());
                setValue('');
                onClose();
              }
            }}
            disabled={!value.trim()}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-zinc-950"
          >
            Exécuter
          </button>
        </div>
      </div>
    </div>
  );
}
