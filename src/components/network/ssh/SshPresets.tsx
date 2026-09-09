import { ChevronRight } from 'lucide-react';

// ===========================================================================
// Profils rapides SSH (présentation) : un clic pré-remplit le formulaire.
// La validation des hôtes/clés reste côté backend Rust.
// ===========================================================================

export type SshPresetKey = 'ubuntu' | 'aws' | 'debian' | 'alpine';

interface SshPresetsProps {
  onApply: (preset: SshPresetKey) => void;
}

const PRESETS: [SshPresetKey, string][] = [
  ['ubuntu', 'Ubuntu Server'],
  ['aws', 'AWS EC2'],
  ['debian', 'Debian / VPS'],
  ['alpine', 'Alpine / Docker'],
];

export function SshPresets({ onApply }: SshPresetsProps) {
  return (
    <div>
      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
        Profils rapides SSH
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESETS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onApply(key)}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
          >
            <span className="font-mono text-zinc-200 font-medium">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
