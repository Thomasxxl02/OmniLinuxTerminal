import React, { useState } from 'react';
import { X, Sparkles, Terminal, Copy, Check, Play, HelpCircle, AlertTriangle, ArrowRight, ShieldCheck, Settings, Key } from 'lucide-react';
import { DistroId, AiConfig, backendProviderIdForModel } from '../types';
import { aiGenerate, aiExplain, aiDebug, aiErrorMessage } from '../lib/aiApi';
import { redactSecrets } from '../lib/secretsApi';

interface AiCopilotDrawerProps {
  distroId: DistroId;
  cwd: string;
  aiConfig: AiConfig;
  onClose: () => void;
  onOpenAiConfigModal: () => void;
  onExecuteCommandInTerminal: (cmd: string) => void;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  distroId,
  cwd,
  aiConfig,
  onClose,
  onOpenAiConfigModal,
  onExecuteCommandInTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'explain' | 'debug'>('generate');

  // Generate state
  const [genQuery, setGenQuery] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);

  // Explain state
  const [explainCmd, setExplainCmd] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState<any>(null);

  // Debug state
  const [debugCmd, setDebugCmd] = useState('');
  const [debugErrorOutput, setDebugErrorOutput] = useState('');
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);

  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(redactSecrets(text));
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const activeProviderId = backendProviderIdForModel(aiConfig.model);
  const currentApiKey =
    (aiConfig.apiKeys?.[activeProviderId] || '').trim() ||
    (aiConfig.isCustomKeyEnabled && aiConfig.customApiKey?.trim()
      ? aiConfig.customApiKey.trim()
      : undefined);
  const currentCustomEndpoint = aiConfig.customEndpoint?.trim() || undefined;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genQuery.trim()) return;
    setGenLoading(true);
    setGenResult(null);

    try {
      const data = await aiGenerate({
        prompt: genQuery,
        distro: distroId,
        currentDir: cwd,
        model: aiConfig.model,
        apiKey: currentApiKey,
        customEndpoint: currentCustomEndpoint,
        temperature: aiConfig.temperature,
        persona: aiConfig.persona,
      });
      setGenResult(data as any);
    } catch (err) {
      setGenResult({ error: aiErrorMessage(err) });
    } finally {
      setGenLoading(false);
    }
  };

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainCmd.trim()) return;
    setExplainLoading(true);
    setExplainResult(null);

    try {
      const data = await aiExplain({
        command: explainCmd,
        distro: distroId,
        model: aiConfig.model,
        apiKey: currentApiKey,
        customEndpoint: currentCustomEndpoint,
        temperature: aiConfig.temperature,
        persona: aiConfig.persona,
      });
      setExplainResult(data as any);
    } catch (err) {
      setExplainResult({ error: aiErrorMessage(err) });
    } finally {
      setExplainLoading(false);
    }
  };

  const handleDebug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debugCmd.trim()) return;
    setDebugLoading(true);
    setDebugResult(null);

    try {
      const data = await aiDebug({
        command: debugCmd,
        errorOutput: debugErrorOutput,
        distro: distroId,
        model: aiConfig.model,
        apiKey: currentApiKey,
        customEndpoint: currentCustomEndpoint,
        temperature: aiConfig.temperature,
      });
      setDebugResult(data as any);
    } catch (err) {
      setDebugResult({ error: aiErrorMessage(err) });
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div className="w-80 sm:w-96 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full shadow-2xl backdrop-blur-md text-zinc-100 font-sans z-30">
      {/* Copilot Header */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Assistant Copilot IA</span>
              {aiConfig.isCustomKeyEnabled && (
                <span className="p-0.5 rounded bg-amber-500/20 text-amber-300" title="Clé API personnalisée active">
                  <Key className="w-3 h-3" />
                </span>
              )}
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-400 font-semibold">{aiConfig.model}</span>
              {aiConfig.provider && aiConfig.provider !== 'google' && (
                <span className="text-[9px] uppercase px-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-sans">
                  {aiConfig.provider}
                </span>
              )}
              <span>•</span>
              <span>{distroId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenAiConfigModal}
            className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-800 transition"
            title="Configurer le modèle et la clé API"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-800 transition"
            title="Fermer le volet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-1.5 bg-zinc-950 border-b border-zinc-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('generate')}
          className={`py-1.5 rounded transition ${
            activeTab === 'generate' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Générer
        </button>
        <button
          onClick={() => setActiveTab('explain')}
          className={`py-1.5 rounded transition ${
            activeTab === 'explain' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Expliquer
        </button>
        <button
          onClick={() => setActiveTab('debug')}
          className={`py-1.5 rounded transition ${
            activeTab === 'debug' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Déboguer
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'generate' && (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleGenerate} className="space-y-2">
              <label className="block text-zinc-300 font-medium">
                Décrivez ce que vous souhaitez faire en langage naturel :
              </label>
              <textarea
                value={genQuery}
                onChange={(e) => setGenQuery(e.target.value)}
                placeholder="Exemple: Trouver tous les fichiers .log créés cette semaine et les compresser"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 h-20 resize-none"
              />
              <button
                type="submit"
                disabled={genLoading || !genQuery.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                {genLoading ? 'Génération...' : 'Générer la Commande Bash'}
              </button>
            </form>

            {genResult && (
              <div className="bg-zinc-950 rounded-xl p-3 border border-emerald-500/30 space-y-3 font-mono">
                {genResult.error ? (
                  <p className="text-rose-400">{genResult.error}</p>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                        Commande Suggérée :
                      </span>
                      <div className="bg-zinc-900 p-2.5 rounded text-emerald-400 text-xs break-all relative group border border-zinc-800">
                        {genResult.command}
                      </div>
                    </div>

                    <div className="flex gap-2 font-sans">
                      <button
                        onClick={() => onExecuteCommandInTerminal(genResult.command)}
                        className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 hover:text-zinc-950 text-emerald-300 font-bold py-1.5 rounded text-xs transition flex items-center justify-center gap-1 border border-emerald-500/40"
                      >
                        <Play className="w-3.5 h-3.5" /> Exécuter
                      </button>
                      <button
                        onClick={() => copyToClipboard(genResult.command)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded transition"
                      >
                        {copiedText === genResult.command ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="font-sans text-xs text-zinc-300 space-y-1 pt-2 border-t border-zinc-800">
                      <p className="font-semibold text-white">Explication :</p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">{genResult.explanation}</p>
                      {genResult.tips && (
                        <p className="text-amber-300/90 text-[11px] pt-1">💡 {genResult.tips}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'explain' && (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleExplain} className="space-y-2">
              <label className="block text-zinc-300 font-medium">
                Saisissez une commande Linux complexes à décortiquer :
              </label>
              <input
                type="text"
                value={explainCmd}
                onChange={(e) => setExplainCmd(e.target.value)}
                placeholder="Ex: tar -czvf archive.tar.gz /var/log/*.log"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={explainLoading || !explainCmd.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold py-2 rounded-lg transition"
              >
                {explainLoading ? 'Analyse...' : 'Expliquer la Commande'}
              </button>
            </form>

            {explainResult && (
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 space-y-3">
                {explainResult.error ? (
                  <p className="text-rose-400">{explainResult.error}</p>
                ) : (
                  <>
                    <p className="text-zinc-300 text-xs leading-relaxed">{explainResult.summary}</p>

                    {explainResult.breakdown && Array.isArray(explainResult.breakdown) && (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <span className="font-semibold text-zinc-400 font-sans text-xs">Composants :</span>
                        {explainResult.breakdown.map((item: any, i: number) => (
                          <div key={i} className="bg-zinc-900 p-2 rounded border border-zinc-800 flex flex-col gap-0.5">
                            <span className="text-emerald-400 font-bold">{item.part}</span>
                            <span className="text-zinc-400 font-sans text-[11px]">{item.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                      <span className="text-zinc-400">Sécurité :</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        explainResult.safety === 'Élevé' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        Risque {explainResult.safety || 'Faible'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleDebug} className="space-y-2">
              <label className="block text-zinc-300 font-medium">Commande ayant échoué :</label>
              <input
                type="text"
                value={debugCmd}
                onChange={(e) => setDebugCmd(e.target.value)}
                placeholder="Ex: apt install docker-ce"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />

              <label className="block text-zinc-300 font-medium pt-1">Message d'erreur obtenu :</label>
              <textarea
                value={debugErrorOutput}
                onChange={(e) => setDebugErrorOutput(e.target.value)}
                placeholder="Ex: E: Unable to locate package docker-ce"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 text-xs font-mono focus:outline-none focus:border-emerald-500 h-16 resize-none"
              />

              <button
                type="submit"
                disabled={debugLoading || !debugCmd.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold py-2 rounded-lg transition"
              >
                {debugLoading ? 'Analyse de l\'erreur...' : 'Déboguer avec l\'IA'}
              </button>
            </form>

            {debugResult && (
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 space-y-3">
                {debugResult.error ? (
                  <p className="text-rose-400">{debugResult.error}</p>
                ) : (
                  <>
                    <div>
                      <span className="font-semibold text-rose-400 block mb-1">Cause de l'erreur :</span>
                      <p className="text-zinc-300 text-xs leading-relaxed">{debugResult.cause}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-emerald-400 block mb-1">Solution proposée :</span>
                      <p className="text-zinc-300 text-xs leading-relaxed">{debugResult.solution}</p>
                    </div>

                    {debugResult.correctedCommand && (
                      <div className="pt-2 border-t border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Commande corrigée :</span>
                        <div className="bg-zinc-900 p-2 rounded text-emerald-400 font-mono text-xs break-all border border-zinc-800 mb-2">
                          {debugResult.correctedCommand}
                        </div>
                        <button
                          onClick={() => onExecuteCommandInTerminal(debugResult.correctedCommand)}
                          className="w-full bg-emerald-600 text-zinc-950 font-bold py-1.5 rounded text-xs hover:bg-emerald-500 transition flex items-center justify-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" /> Exécuter la commande corrigée
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
