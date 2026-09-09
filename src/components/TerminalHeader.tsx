import React from 'react';
import { TerminalTab, DistroId, LinuxDistro } from '../types';
import { useDistros, resolveDistro } from '../lib/distroStore';
import {
  Plus,
  X,
  Sparkles,
  Palette,
  HelpCircle,
  Maximize2,
  Volume2,
  VolumeX,
  Tv,
  Layers,
  Terminal as TerminalIcon,
  Settings,
  Server,
} from 'lucide-react';

interface TerminalHeaderProps {
  tabs: TerminalTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: (distroId?: DistroId) => void;
  onCloseTab: (id: string) => void;
  onOpenDistroModal: () => void;
  onOpenThemeModal: () => void;
  onOpenHelpModal: () => void;
  onToggleAiDrawer: () => void;
  onOpenAiConfigModal?: () => void;
  onOpenSshSmtpModal?: () => void;
  aiDrawerOpen: boolean;
  crtEffect: boolean;
  onToggleCrt: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onOpenTauriModal?: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onOpenDistroModal,
  onOpenThemeModal,
  onOpenHelpModal,
  onToggleAiDrawer,
  onOpenAiConfigModal,
  onOpenSshSmtpModal,
  aiDrawerOpen,
  crtEffect,
  onToggleCrt,
  soundEnabled,
  onToggleSound,
  onToggleFullscreen,
  onOpenTauriModal,
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const distros = useDistros();
  const activeDistro = resolveDistro(distros, activeTab?.distroId);

  return (
    <header className="bg-zinc-950/90 border-b border-zinc-800 text-zinc-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center px-3 py-2 gap-2 select-none">
      {/* Left: Tab list & New Tab button */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const distro = resolveDistro(distros, tab.distroId);

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer border transition ${
                isActive
                  ? 'bg-zinc-800 text-white border-zinc-700 shadow-md'
                  : 'bg-zinc-900/60 text-zinc-400 border-transparent hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold truncate max-w-[120px]">
                {distro.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-zinc-500 hidden md:inline">{tab.cwd}</span>

              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="hover:text-rose-400 hover:bg-zinc-700 p-0.5 rounded transition ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={() => onNewTab()}
          title="Ouvrir un nouvel onglet"
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-1.5 rounded-lg border border-zinc-800 transition flex items-center justify-center shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/80">
        {/* Distro Quick Switcher */}
        <button
          onClick={onOpenDistroModal}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium transition"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold">{activeDistro.name.split(' ')[0]}</span>
        </button>

        {/* SSH & SMTP Connection Manager */}
        {onOpenSshSmtpModal && (
          <button
            onClick={onOpenSshSmtpModal}
            title="Formulaire Connexion SSH & SMTP"
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium transition hover:border-emerald-500/40"
          >
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline font-semibold">SSH / SMTP</span>
          </button>
        )}

        {/* AI Copilot Toggle & Config */}
        <div className="flex items-center rounded-lg border border-emerald-500/30 overflow-hidden bg-emerald-500/10">
          <button
            onClick={onToggleAiDrawer}
            title="Ouvrir le volet IA Copilot (Ctrl+I)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold transition ${
              aiDrawerOpen
                ? 'bg-emerald-600 text-zinc-950 font-extrabold shadow-inner'
                : 'text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>IA Copilot</span>
          </button>
          {onOpenAiConfigModal && (
            <button
              onClick={onOpenAiConfigModal}
              title="Configurer le modèle IA & Clé API Gemini"
              className="px-2 py-1.5 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/20 border-l border-emerald-500/30 transition flex items-center justify-center"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Theme Picker */}
        <button
          onClick={onOpenThemeModal}
          title="Changer le thème"
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg border border-zinc-800 transition"
        >
          <Palette className="w-4 h-4 text-amber-400" />
        </button>

        {/* CRT Scanline Toggle */}
        <button
          onClick={onToggleCrt}
          title={crtEffect ? "Désactiver l'effet CRT" : "Activer l'effet CRT"}
          className={`p-2 rounded-lg border transition ${
            crtEffect
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? "Couper le son des clics" : "Activer le son des clics"}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg border border-zinc-800 transition"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {/* Help Guide */}
        <button
          onClick={onOpenHelpModal}
          title="Guide des commandes"
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg border border-zinc-800 transition"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          title="Plein écran"
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg border border-zinc-800 transition hidden sm:block"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
