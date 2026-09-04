import React from 'react';
import { LINUX_DISTROS } from '../data/distros';
import { DistroId, LinuxDistro } from '../types';
import { X, Check, Terminal, Cpu, Box, Shield, Layers } from 'lucide-react';

interface DistroInfoModalProps {
  currentDistroId: DistroId;
  onSelectDistro: (distroId: DistroId) => void;
  onClose: () => void;
}

export const DistroInfoModal: React.FC<DistroInfoModalProps> = ({
  currentDistroId,
  onSelectDistro,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Toutes les Distributions Linux Disponibles
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Chaque distribution fournit son noyau, son gestionnaire de paquets, ses commandes et ses logos ASCII authentiques.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Distros Grid */}
        <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {LINUX_DISTROS.map((distro) => {
            const isSelected = distro.id === currentDistroId;
            return (
              <div
                key={distro.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition relative ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                    : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        {distro.name}
                        {distro.id === 'kali' && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded uppercase font-mono">
                            Cyber Security
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">{distro.version}</p>
                    </div>
                    {isSelected ? (
                      <span className="bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectDistro(distro.id);
                          onClose();
                        }}
                        className="bg-zinc-800 hover:bg-emerald-600 hover:text-zinc-950 text-zinc-200 px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        Basculer ici
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{distro.description}</p>

                  <div className="bg-zinc-900/90 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 space-y-1 border border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Noyau : <strong className="text-white">{distro.kernel}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gestionnaire : <strong className="text-amber-300">{distro.packageManager}</strong> ({distro.pkgCommand})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-sky-400" />
                      <span>Prompt : <strong className="text-sky-300">{distro.defaultUser}@{distro.hostName}{distro.promptSymbol}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1">
                  {distro.specialTools.slice(0, 5).map((tool) => (
                    <span
                      key={tool}
                      className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-mono"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
          <span>Conseil: Vous pouvez aussi changer de distribution via la commande <code className="text-emerald-400">distro &lt;nom&gt;</code> dans le terminal.</span>
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
