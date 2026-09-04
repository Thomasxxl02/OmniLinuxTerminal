import React from 'react';
import { X, Terminal, Cpu, Shield, Sparkles, Heart, Code2, Globe } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6 shadow-2xl text-zinc-100 flex flex-col relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logo & Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              OmniLinux Terminal
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v2.5 LTS
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Environnement Terminal Linux Universel Multi-Distribution
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="space-y-3 text-xs text-zinc-300 mb-6">
          <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Noyau Virtuel</span>
              <span className="font-mono text-emerald-400">6.8.0-universal</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Distributions Incluses</span>
              <span className="font-mono text-zinc-200">10 (Ubuntu, Arch, Kali, Debian...)</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Moteur IA</span>
              <span className="font-mono text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> Google Gemini API
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Système de Fichiers</span>
              <span className="font-mono text-zinc-200">VFS LocalStorage Persistant</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Éditeurs Intégrés</span>
              <span className="font-mono text-zinc-200">Nano, Vim (Modal)</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            OmniLinux Terminal simule une expérience système Linux complète directement dans votre navigateur : exécution de commandes POSIX, gestionnaires de paquets (APT, Pacman, DNF, APK...), moniteur de processus temps réel, et assistance IA conversationnelle.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            Fait avec <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" /> pour les passionnés de Linux
          </span>
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
