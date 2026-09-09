import { Plug } from 'lucide-react';
import { StatusBox, Status } from '../StatusBox';

// ===========================================================================
// Statut de la connexion SSH (présentation) : boîte de statut + indicateur
// « session active ». L'état vient du backend Rust (test/connexion).
// ===========================================================================

interface SshStatusProps {
  status: Status;
  connected: boolean;
}

export function SshStatus({ status, connected }: SshStatusProps) {
  return (
    <>
      <StatusBox st={status} />
      {connected && (
        <div className="flex items-center gap-2 text-emerald-300 font-mono text-[11px]">
          <Plug className="w-3.5 h-3.5" /> Session SSH active
        </div>
      )}
    </>
  );
}
