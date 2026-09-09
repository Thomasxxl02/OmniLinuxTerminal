import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

// ===========================================================================
// Boîte de statut réseau partagée (SSH + SMTP).
// Affiche l'état d'une opération (chargement / succès / erreur) de façon
// homogène. La validation et les profils restent gérés par le backend Rust.
// ===========================================================================

export type StatusPhase = 'idle' | 'running' | 'success' | 'error';

export interface Status {
  phase: StatusPhase;
  message: string;
  detail?: string;
}

export const IDLE: Status = { phase: 'idle', message: '' };

export function StatusBox({ st }: { st: Status }) {
  if (st.phase === 'idle') return null;
  const isErr = st.phase === 'error';
  return (
    <div
      className={`p-3 rounded-lg border font-mono text-[11px] whitespace-pre-wrap transition ${
        st.phase === 'running'
          ? 'bg-zinc-950/40 border-zinc-700 text-zinc-200'
          : isErr
          ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
          : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2 font-bold mb-1">
        {st.phase === 'running' ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
        ) : isErr ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
        {st.message}
      </div>
      {st.detail && <span className="text-zinc-400">{st.detail}</span>}
    </div>
  );
}
