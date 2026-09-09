import React, { useState } from 'react';
import { Server, Mail, X, Terminal } from 'lucide-react';
import { SshConnectionInfo } from '../../lib/sshApi';
import { SshForm } from './ssh/SshForm';
import { SmtpForm } from './smtp/SmtpForm';

// ===========================================================================
// Gestionnaire de Connexions Réseau (SSH & SMTP) — orchestrateur.
// Détient l'onglet actif, le header et le wrapper de la modale. Les deux
// formulaires (SSH/SMTP) sont montés en permanence et masqués via CSS pour
// conserver leur état lors d'un changement d'onglet. Validation et profils
// gérés par le backend Rust ; l'UI reste purement visuelle.
// ===========================================================================

export interface ConnectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSshConnected?: (info: SshConnectionInfo) => void;
}

export const ConnectionManagerModal: React.FC<ConnectionManagerModalProps> = ({
  isOpen,
  onClose,
  onSshConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'ssh' | 'smtp'>('ssh');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-zinc-100 flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
                Gestionnaire de Connexions Réseau
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                  SSH & SMTP
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Connexions réelles pilotées par le backend Rust — aucun accès simulé.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('ssh')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-semibold transition border-b-2 ${
              activeTab === 'ssh'
                ? 'bg-zinc-900 text-emerald-400 border-emerald-500 shadow-sm'
                : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Serveur SSH / SFTP
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-semibold transition border-b-2 ${
              activeTab === 'smtp'
                ? 'bg-zinc-900 text-sky-400 border-sky-500 shadow-sm'
                : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Mail className="w-4 h-4" />
            Serveur SMTP / Mail
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Les deux formulaires restent montés (état conservé entre onglets). */}
          <div className={activeTab === 'ssh' ? 'block' : 'hidden'}>
            <SshForm onConnected={onSshConnected ?? (() => {})} onClose={onClose} />
          </div>
          <div className={activeTab === 'smtp' ? 'block' : 'hidden'}>
            <SmtpForm onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};
