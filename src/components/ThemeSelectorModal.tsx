import React from 'react';
import { TERMINAL_THEMES } from '../data/themes';
import { TerminalTheme, TerminalSoundStyle } from '../types';
import { SOUND_STYLES, playTerminalSound } from '../lib/soundEffects';
import { X, Check, Palette, Volume2, Play } from 'lucide-react';

interface ThemeSelectorModalProps {
  currentTheme: TerminalTheme;
  onSelectTheme: (theme: TerminalTheme) => void;
  onClose: () => void;
  crtEffect: boolean;
  onToggleCrt: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  soundStyle: TerminalSoundStyle;
  onSelectSoundStyle: (style: TerminalSoundStyle) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  currentTheme,
  onSelectTheme,
  onClose,
  crtEffect,
  onToggleCrt,
  soundEnabled,
  onToggleSound,
  soundStyle,
  onSelectSoundStyle,
  fontSize,
  onChangeFontSize,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Thèmes & Apparence du Terminal</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Themes Grid */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
              Palette de couleurs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TERMINAL_THEMES.map((theme) => {
                const isSelected = theme.id === currentTheme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme)}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-2 transition relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{theme.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>

                    {/* Color Preview Bar */}
                    <div
                      className="h-6 rounded flex items-center px-2 gap-1.5 text-xs font-mono overflow-hidden"
                      style={{ backgroundColor: theme.bg, color: theme.fg }}
                    >
                      <span style={{ color: theme.promptUser }}>user@host</span>
                      <span style={{ color: theme.promptPath }}>:~$</span>
                      <span style={{ color: theme.fg }}>ls -la</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Effects & Controls */}
          <div className="border-t border-zinc-800 pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              Effets visuels & Son
            </h3>

            <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
              <div>
                <p className="font-semibold text-sm">Effet Écran CRT / Lignes de balayage</p>
                <p className="text-xs text-zinc-400">Simule un moniteur cathodique rétro avec balayage phosphore.</p>
              </div>
              <button
                onClick={onToggleCrt}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  crtEffect ? 'bg-emerald-600' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    crtEffect ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    Effets Sonores Clavier
                  </p>
                  <p className="text-xs text-zinc-400">Joue un son subtil à chaque touche du clavier et lors de l'exécution.</p>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    soundEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {soundEnabled && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Style Sonore :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SOUND_STYLES.map((style) => {
                      const isSelected = soundStyle === style.id;
                      return (
                        <div
                          key={style.id}
                          className={`p-2.5 rounded-lg border flex flex-col justify-between transition cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                              : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                          }`}
                          onClick={() => {
                            onSelectSoundStyle(style.id);
                            playTerminalSound(style.id, 0.06);
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-zinc-100">{style.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                            <p className="text-[10px] text-zinc-400 leading-tight mb-2">
                              {style.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTerminalSound(style.id, 0.08);
                            }}
                            className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2 py-1 rounded text-[10px] flex items-center justify-center gap-1 self-start transition border border-zinc-700/50 mt-1"
                          >
                            <Play className="w-2.5 h-2.5 text-emerald-400" /> Tester le son
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
              <div>
                <p className="font-semibold text-sm">Taille de police du terminal</p>
                <p className="text-xs text-zinc-400">Ajuster la lisibilité (actuelle: {fontSize}px)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChangeFontSize(Math.max(11, fontSize - 1))}
                  className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 font-bold flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-sm">{fontSize}</span>
                <button
                  onClick={() => onChangeFontSize(Math.min(20, fontSize + 1))}
                  className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm transition"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};
