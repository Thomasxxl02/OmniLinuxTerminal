import { AlertTriangle } from 'lucide-react';
import { RiskReport } from '../lib/riskApi';

// ===========================================================================
// Boîte de confirmation d'une commande à risque (partagée TerminalView + App).
// Affiche le niveau, les raisons et laisse l'utilisateur exécuter ou annuler.
// L'analyse de risque vient du backend Rust.
// ===========================================================================

interface RiskConfirmModalProps {
  command: string;
  report: RiskReport;
  onRun: () => void;
  onCancel: () => void;
}

export function RiskConfirmModal({ command, report, onRun, onCancel }: RiskConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-xl p-5 max-w-lg w-full text-zinc-100 shadow-2xl">
        <h3 className="font-semibold text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Commande à risque
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Niveau : <span className="text-amber-300 font-mono uppercase">{report.level}</span>
        </p>
        <pre className="mt-3 text-xs bg-black/40 border border-zinc-800 rounded px-2 py-1.5 whitespace-pre-wrap break-all">{command}</pre>
        <ul className="mt-3 text-xs text-zinc-300 list-disc pl-5 space-y-1">
          {report.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded text-xs bg-zinc-800 hover:bg-zinc-700">
            Annuler
          </button>
          <button onClick={onRun} className="px-3 py-1.5 rounded text-xs bg-amber-500 text-black font-semibold hover:bg-amber-400">
            Exécuter quand même
          </button>
        </div>
      </div>
    </div>
  );
}
