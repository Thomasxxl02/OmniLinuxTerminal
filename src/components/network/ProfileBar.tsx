import { Save, Trash2 } from 'lucide-react';

// ===========================================================================
// Barre de profils réseau (SSH + SMTP) : nom du profil, enregistrement,
// application/suppression des profils persistés côté Rust.
// ===========================================================================

interface ProfileBarProps {
  name: string;
  setName: (v: string) => void;
  onSave: () => void;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  list: { id: string; name: string }[];
}

export function ProfileBar({ name, setName, onSave, onApply, onDelete, list }: ProfileBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du profil"
        className="flex-1 min-w-[140px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500 transition"
      />
      <button
        type="button"
        onClick={onSave}
        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1.5 transition"
      >
        <Save className="w-3.5 h-3.5" /> Enregistrer
      </button>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {list.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-emerald-300"
            >
              <button type="button" onClick={() => onApply(p.id)} className="hover:text-white transition" title="Appliquer">
                {p.name}
              </button>
              <button type="button" onClick={() => onDelete(p.id)} className="text-zinc-500 hover:text-rose-400 transition" title="Supprimer">
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
