import { ChevronRight } from 'lucide-react';

// ===========================================================================
// Fournisseurs SMTP pré-configurés (présentation) : un clic pré-remplit le
// formulaire. La validation de l'hôte/TLS reste côté backend Rust.
// ===========================================================================

export type SmtpPresetKey = 'gmail' | 'outlook' | 'ovh' | 'sendgrid';

interface SmtpPresetsProps {
  onApply: (preset: SmtpPresetKey) => void;
}

const PRESETS: [SmtpPresetKey, string][] = [
  ['gmail', 'Google Gmail'],
  ['outlook', 'Microsoft 365'],
  ['ovh', 'OVHcloud'],
  ['sendgrid', 'SendGrid'],
];

export function SmtpPresets({ onApply }: SmtpPresetsProps) {
  return (
    <div>
      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
        Fournisseurs SMTP pré-configurés
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
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
