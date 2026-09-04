import React from 'react';
import { X, Terminal, HelpCircle, Sparkles, BookOpen, Command } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-3xl p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold">Guide des Commandes Linux & Raccourcis</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-sm">
          {/* Section 1: AI Copilot */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <h3 className="font-bold text-emerald-300 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Assistant IA Gemini Intégré
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-2">
              Vous n'avez pas besoin de retenir toutes les commandes par cœur ! L'IA Gemini traduit vos requêtes en langage naturel en commandes Linux exactes.
            </p>
            <div className="bg-zinc-950/80 rounded-lg p-2.5 font-mono text-xs space-y-1 text-emerald-400 border border-zinc-800">
              <p><span className="text-zinc-400">ai</span> "comment compresser un dossier en tar.gz"</p>
              <p><span className="text-zinc-400">ai</span> "afficher tous les processus consommant le plus de RAM"</p>
              <p><span className="text-zinc-400">ai explain</span> "find /var/log -type f -name '*.log'"</p>
            </div>
          </div>

          {/* Section 2: Command Cheat Sheet */}
          <div>
            <h3 className="font-bold text-zinc-200 uppercase text-xs tracking-wider mb-3">
              Commandes Essentielles par Catégorie
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 space-y-1.5 font-mono">
                <p className="text-amber-400 font-bold font-sans">Navigation & Fichiers</p>
                <p><code className="text-emerald-400">ls -la</code> : Lister tous les fichiers avec détails</p>
                <p><code className="text-emerald-400">cd &lt;dossier&gt;</code> : Changer de répertoire</p>
                <p><code className="text-emerald-400">cat &lt;fichier&gt;</code> : Afficher le contenu</p>
                <p><code className="text-emerald-400">touch &lt;fichier&gt;</code> : Créer un fichier vide</p>
                <p><code className="text-emerald-400">mkdir &lt;nom&gt;</code> : Créer un dossier</p>
                <p><code className="text-emerald-400">rm -rf &lt;nom&gt;</code> : Supprimer fichier/dossier</p>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 space-y-1.5 font-mono">
                <p className="text-cyan-400 font-bold font-sans">Gestionnaires de Paquets</p>
                <p><code className="text-emerald-400">apt install &lt;pkg&gt;</code> : Ubuntu / Debian</p>
                <p><code className="text-emerald-400">pacman -S &lt;pkg&gt;</code> : Arch Linux</p>
                <p><code className="text-emerald-400">dnf install &lt;pkg&gt;</code> : Fedora / RHEL</p>
                <p><code className="text-emerald-400">apk add &lt;pkg&gt;</code> : Alpine Linux</p>
                <p><code className="text-emerald-400">zypper in &lt;pkg&gt;</code> : openSUSE</p>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 space-y-1.5 font-mono">
                <p className="text-purple-400 font-bold font-sans">Éditeurs de Texte</p>
                <p><code className="text-emerald-400">nano &lt;fichier&gt;</code> : Éditeur intuitif (Ctrl+O, Ctrl+X)</p>
                <p><code className="text-emerald-400">vim &lt;fichier&gt;</code> : Éditeur modal ('i' pour insérer, ':wq' sauver)</p>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 space-y-1.5 font-mono">
                <p className="text-rose-400 font-bold font-sans">Monitoring & Divertissement</p>
                <p><code className="text-emerald-400">neofetch</code> : Logo & spécifications système</p>
                <p><code className="text-emerald-400">htop</code> : Moniteur de processus interactif</p>
                <p><code className="text-emerald-400">cmatrix</code> : Effet de pluie de code Matrix</p>
                <p><code className="text-emerald-400">sl</code> : Animation de train à vapeur</p>
              </div>
            </div>
          </div>

          {/* Section 3: Keyboard Shortcuts */}
          <div>
            <h3 className="font-bold text-zinc-200 uppercase text-xs tracking-wider mb-2">
              Raccourcis Clavier du Terminal
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-zinc-300">
              <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">Tab</span> : Autocomplétion
              </div>
              <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">Flèches ↑ / ↓</span> : Historique
              </div>
              <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">Ctrl + L</span> : Effacer l'écran
              </div>
              <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">Ctrl + C</span> : Annuler commande
              </div>
              <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">Ctrl + Shift + T</span> : Nouvel onglet
              </div>
              <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">Échap</span> : Quitter mode plein écran / app
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm transition"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
