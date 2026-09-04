import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Zap,
  Shield,
  Check,
  X,
  Key,
  Sliders,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Play,
  Terminal,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  Info,
  ClipboardPaste,
  Layers,
  Clock,
  Search,
  Server,
  Globe,
  Code2,
  TerminalSquare,
} from 'lucide-react';
import { AiConfig, backendProviderIdForModel, BackendProviderId } from '../types';

interface AiConfigModalProps {
  config: AiConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: AiConfig) => void;
}

export interface ModelSpec {
  id: string;
  name: string;
  provider: 'google' | 'deepseek' | 'mistral' | 'anthropic' | 'openai' | 'opensource';
  providerName: string;
  providerBadgeColor: string;
  tag: string;
  tagColor: string;
  description: string;
  latency: string;
  contextWindow: string;
  category: 'balanced' | 'reasoning' | 'speed' | 'code' | 'stable';
  strengths: string[];
}

export const AVAILABLE_MODELS: ModelSpec[] = [
  // Google Gemini
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'google',
    providerName: 'Google',
    providerBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    tag: 'Recommandé par défaut',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Modèle multimodal de nouvelle génération. Réponses ultra-rapides et fidélité de pointe pour la génération de commandes bash et scripts système.',
    latency: '< 350 ms',
    contextWindow: '1M tokens',
    category: 'balanced',
    strengths: ['Bash & CLI POSIX', 'Diagnostic syntaxique', 'Basse latence'],
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    providerName: 'Google',
    providerBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    tag: 'Raisonnement Avancé',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Modèle de raisonnement complexe. Idéal pour concevoir des pipelines sed/awk/grep avancés, scripts d\'automatisation DevOps et audit de sécurité approfondi.',
    latency: '~1.1 s',
    contextWindow: '2M tokens',
    category: 'reasoning',
    strengths: ['Scripts DevOps complexes', 'Audit de sécurité', 'Raisonnement pas à pas'],
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'google',
    providerName: 'Google',
    providerBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    tag: 'Ultra-Rapide',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Modèle allégé optimisé pour le débit et la réactivité maximale. Recommandé pour les commandes courtes et l\'autocomplétion en temps réel.',
    latency: '< 200 ms',
    contextWindow: '1M tokens',
    category: 'speed',
    strengths: ['Autocomplétion instantanée', 'Faible coût de tokens', 'Latence minimale'],
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    providerName: 'Google',
    providerBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    tag: 'Haute Stabilité',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Modèle éprouvé de production. Excellente polyvalence générale et haute tolérance sur tous les environnements shell classiques.',
    latency: '~450 ms',
    contextWindow: '1M tokens',
    category: 'stable',
    strengths: ['Grande polyvalence', 'Stabilité éprouvée', 'Compatibilité legacy'],
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest)',
    provider: 'google',
    providerName: 'Google',
    providerBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    tag: 'Dernière Version Auto',
    tagColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Alias dynamique pointant automatiquement vers la version Flash la plus récente et optimisée en production.',
    latency: '~350 ms',
    contextWindow: '1M tokens',
    category: 'balanced',
    strengths: ['Mises à jour automatiques', 'Haute disponibilité', 'Standard Google'],
  },

  // DeepSeek
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    providerBadgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    tag: 'Chaîne de Pensée (CoT)',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Le modèle star du raisonnement open-weights. Décompose chaque problème Linux en chaîne de pensée rigoureuse pour éliminer les erreurs de commande.',
    latency: '~1.3 s',
    contextWindow: '128K tokens',
    category: 'reasoning',
    strengths: ['Raisonnement mathématique & logique', 'Détection des edge-cases', 'Scripts complexes'],
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    providerBadgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    tag: 'MoE 671B Params',
    tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Architecture Mixture-of-Experts 671B réputée pour ses performances de pointe en génération de code et commandes terminal GNU.',
    latency: '~480 ms',
    contextWindow: '128K tokens',
    category: 'code',
    strengths: ['Syntaxe shell moderne', 'Optimisation des flags', 'Rapport qualité/vitesse'],
  },

  // Mistral AI
  {
    id: 'codestral-latest',
    name: 'Mistral Codestral',
    provider: 'mistral',
    providerName: 'Mistral AI',
    providerBadgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    tag: 'Spécialiste Code & Bash',
    tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Entraîné sur plus de 80 langages de programmation. Maîtrise parfaite des constructions syntaxiques complexes (Bash, Zsh, Awk, Sed, Perl).',
    latency: '~400 ms',
    contextWindow: '256K tokens',
    category: 'code',
    strengths: ['Fidélité syntaxique Bash/POSIX', 'Pipelines Sed & Awk', 'Automatisation shell'],
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'mistral',
    providerName: 'Mistral AI',
    providerBadgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    tag: 'Flagship Européen',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Modèle de raisonnement multilingue de premier ordre. Idéal pour les explications techniques fouillées et l\'analyse contextuelle.',
    latency: '~850 ms',
    contextWindow: '128K tokens',
    category: 'reasoning',
    strengths: ['Français technique irréprochable', 'Explications didactiques', 'Précision contextuelle'],
  },

  // Anthropic Claude
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    providerBadgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    tag: 'Raisonnement Hybride',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Modèle d\'ingénierie logicielle d\'Anthropic avec capacité de réflexion étendue. Réputé pour son hygiène de code et la sécurité.',
    latency: '~1.2 s',
    contextWindow: '200K tokens',
    category: 'reasoning',
    strengths: ['Analyse de sécurité stricte', 'Refactoring de scripts', 'Explications pédagogiques'],
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    providerName: 'Anthropic',
    providerBadgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    tag: 'Vitesse & Concision',
    tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Modèle léger ultra-rapide. Réponses directes sans verbiage superflu.',
    latency: '< 300 ms',
    contextWindow: '200K tokens',
    category: 'speed',
    strengths: ['Exécution rapide', 'Concision chirurgicale', 'Faible latence'],
  },

  // OpenAI
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'openai',
    providerName: 'OpenAI',
    providerBadgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    tag: 'Flagship Polyvalent',
    tagColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Modèle omni d\'OpenAI réputé pour sa flexibilité générale, son support multilingue et sa large adoption.',
    latency: '~500 ms',
    contextWindow: '128K tokens',
    category: 'balanced',
    strengths: ['Polyvalence générale', 'Large documentation', 'Scripts modernes'],
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'openai',
    providerName: 'OpenAI',
    providerBadgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    tag: 'Raisonnement Spécialisé',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Modèle de raisonnement compact d\'OpenAI, conçu pour la résolution logique, les mathématiques et la programmation.',
    latency: '~900 ms',
    contextWindow: '200K tokens',
    category: 'reasoning',
    strengths: ['Logique pure', 'Prévention des erreurs', 'Debug technique'],
  },

  // Open Source & Local
  {
    id: 'qwen2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'opensource',
    providerName: 'Alibaba / Open-Source',
    providerBadgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    tag: 'Champion Open-Source CLI',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Le modèle open source le plus plébiscité par les développeurs pour les commandes GNU/Linux, awk, jq et expressions régulières.',
    latency: '~450 ms',
    contextWindow: '128K tokens',
    category: 'code',
    strengths: ['Expertise GNU coreutils', 'Regex & Sed avancés', 'Standards POSIX'],
  },
  {
    id: 'llama-3.3-70b',
    name: 'Meta LLaMA 3.3 70B',
    provider: 'opensource',
    providerName: 'Meta AI',
    providerBadgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    tag: 'Open-Weights de Référence',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Modèle open-weights d\'une fidélité exceptionnelle, offrant un raisonnement robuste et une grande conformité aux instructions.',
    latency: '~650 ms',
    contextWindow: '128K tokens',
    category: 'balanced',
    strengths: ['Transparence open source', 'Fidélité aux instructions', 'Culture UNIX'],
  },
  {
    id: 'ollama-local',
    name: 'Ollama Localhost',
    provider: 'opensource',
    providerName: 'Local Machine',
    providerBadgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    tag: '100% Hors-Ligne & Privé',
    tagColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    description: 'Connecteur pour vos modèles tournant localement sur http://localhost:11434 (ex: ollama run deepseek-r1 ou codellama). Aucune donnée transmise vers le cloud.',
    latency: 'Variable (GPU local)',
    contextWindow: 'Configurable',
    category: 'speed',
    strengths: ['Confidentialité totale', 'Zéro coût d\'API', 'Fonctionne sans internet'],
  },
];

export const AiConfigModal: React.FC<AiConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
}) => {
  const isCustomPreset = !AVAILABLE_MODELS.some((m) => m.id === config.model);
  const [selectedModel, setSelectedModel] = useState<string>(isCustomPreset ? 'custom' : config.model);
  const [customModelInput, setCustomModelInput] = useState<string>(isCustomPreset ? config.model : '');
  const [isCustomKeyEnabled, setIsCustomKeyEnabled] = useState<boolean>(config.isCustomKeyEnabled);
  const [customApiKey, setCustomApiKey] = useState<string>(config.customApiKey || '');
  const [customEndpoint, setCustomEndpoint] = useState<string>(config.customEndpoint || '');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(config.apiKeys || {});

  // Providers that need an API key (mirrors the backend registry).
  const KEY_PROVIDERS: Array<{ id: BackendProviderId; label: string; hint: string }> = [
    { id: 'google', label: 'Gemini', hint: 'aistudio.google.com/apikey' },
    { id: 'deepseek', label: 'DeepSeek', hint: 'platform.deepseek.com' },
    { id: 'mistral', label: 'Mistral AI', hint: 'console.mistral.ai' },
    { id: 'anthropic', label: 'Anthropic', hint: 'console.anthropic.com' },
    { id: 'openai', label: 'OpenAI', hint: 'platform.openai.com' },
    { id: 'qwen', label: 'Alibaba Qwen', hint: 'dashscope.aliyuncs.com' },
    { id: 'llama', label: 'LLaMA (OpenRouter)', hint: 'openrouter.ai/keys' },
  ];

  // Filters & Search
  const [providerFilter, setProviderFilter] = useState<
    'all' | 'google' | 'deepseek' | 'mistral' | 'anthropic_openai' | 'opensource'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Advanced Hyperparameters
  const [temperature, setTemperature] = useState<number>(config.temperature ?? 0.2);
  const [persona, setPersona] = useState<'sysadmin' | 'educational' | 'security'>(config.persona ?? 'sysadmin');
  const [safetyFilter, setSafetyFilter] = useState<boolean>(config.safetyFilter ?? true);
  const [showAdvancedTuning, setShowAdvancedTuning] = useState<boolean>(false);

  // Test status state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testSampleEnabled, setTestSampleEnabled] = useState<boolean>(false);
  const [sampleQuery, setSampleQuery] = useState<string>('Afficher les 5 répertoires les plus volumineux');
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    model?: string;
    provider?: string;
    latencyMs?: number;
    sampleResponse?: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentEffectiveModel = selectedModel === 'custom' ? (customModelInput.trim() || 'gemini-3.8-flash') : selectedModel;
  const currentModelSpec = AVAILABLE_MODELS.find((m) => m.id === currentEffectiveModel);
  const activeProviderId = backendProviderIdForModel(currentEffectiveModel);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCustomApiKey(text.trim());
      }
    } catch {
      // Ignored if permissions are rejected
    }
  };

  const handleApplyPresetProfile = (preset: 'speed' | 'balanced' | 'deepseek' | 'codestral' | 'claude' | 'ollama') => {
    if (preset === 'speed') {
      setSelectedModel('gemini-3.1-flash-lite');
      setTemperature(0.1);
      setPersona('sysadmin');
    } else if (preset === 'balanced') {
      setSelectedModel('gemini-3.8-flash');
      setTemperature(0.2);
      setPersona('sysadmin');
    } else if (preset === 'deepseek') {
      setSelectedModel('deepseek-r1');
      setTemperature(0.15);
      setPersona('sysadmin');
    } else if (preset === 'codestral') {
      setSelectedModel('codestral-latest');
      setTemperature(0.1);
      setPersona('sysadmin');
    } else if (preset === 'claude') {
      setSelectedModel('claude-3-7-sonnet');
      setTemperature(0.15);
      setPersona('security');
    } else if (preset === 'ollama') {
      setSelectedModel('ollama-local');
      setTemperature(0.2);
      setPersona('sysadmin');
      if (!customEndpoint) {
        setCustomEndpoint('http://localhost:11434');
      }
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/test-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: currentEffectiveModel,
          apiKey: (apiKeys[activeProviderId] || '').trim() || (isCustomKeyEnabled && customApiKey.trim() ? customApiKey.trim() : undefined),
          customEndpoint: customEndpoint.trim() || undefined,
          samplePrompt: testSampleEnabled ? sampleQuery : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setTestResult({
          success: true,
          message: data.message || `Connexion réussie avec "${data.model}" !`,
          model: data.model,
          provider: data.provider,
          latencyMs: data.latencyMs,
          sampleResponse: data.sampleResponse,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Impossible de se connecter avec cette configuration.',
          latencyMs: data.latencyMs,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erreur réseau lors du test.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      model: currentEffectiveModel,
      provider: currentModelSpec?.provider || 'google',
      isCustomKeyEnabled,
      customApiKey: customApiKey.trim(),
      customEndpoint: customEndpoint.trim(),
      apiKeys,
      temperature,
      persona,
      safetyFilter,
    });
    onClose();
  };

  // Filter models based on provider and search query
  const filteredModels = AVAILABLE_MODELS.filter((m) => {
    // Provider filter
    if (providerFilter === 'google' && m.provider !== 'google') return false;
    if (providerFilter === 'deepseek' && m.provider !== 'deepseek') return false;
    if (providerFilter === 'mistral' && m.provider !== 'mistral') return false;
    if (providerFilter === 'anthropic_openai' && m.provider !== 'anthropic' && m.provider !== 'openai') return false;
    if (providerFilter === 'opensource' && m.provider !== 'opensource') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = m.name.toLowerCase().includes(q);
      const matchId = m.id.toLowerCase().includes(q);
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchProvider = m.providerName.toLowerCase().includes(q);
      const matchStrengths = m.strengths.some((s) => s.toLowerCase().includes(q));
      return matchName || matchId || matchDesc || matchProvider || matchStrengths;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Catalogue & Configuration des Modèles IA</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  {AVAILABLE_MODELS.length} modèles
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Basculez entre Gemini, DeepSeek, Mistral, Claude, OpenAI ou vos modèles Ollama locaux.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 p-1.5 rounded-lg transition"
            title="Fermer (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
          {/* Quick Preset Profiles Bar */}
          <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">Profils Rapides Prédéfinis :</span>
              </div>
              <span className="text-[10px] text-zinc-500 hidden sm:inline font-mono">1-clic pour configurer</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPresetProfile('speed')}
                className="px-2 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-medium transition flex items-center justify-center gap-1 text-center"
                title="Gemini 3.1 Flash Lite, latence minimale <200ms"
              >
                <Zap className="w-3 h-3 shrink-0" /> Vitesse
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetProfile('balanced')}
                className="px-2 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-medium transition flex items-center justify-center gap-1 text-center"
                title="Gemini 3.8 Flash, équilibre optimal"
              >
                <Sparkles className="w-3 h-3 shrink-0" /> Recommandé
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetProfile('deepseek')}
                className="px-2 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-medium transition flex items-center justify-center gap-1 text-center"
                title="DeepSeek R1, chaîne de pensée CoT"
              >
                <TerminalSquare className="w-3 h-3 shrink-0" /> DeepSeek R1
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetProfile('codestral')}
                className="px-2 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-[11px] font-medium transition flex items-center justify-center gap-1 text-center"
                title="Mistral Codestral, spécialiste scripts bash/awk/sed"
              >
                <Code2 className="w-3 h-3 shrink-0" /> Codestral
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetProfile('claude')}
                className="px-2 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-medium transition flex items-center justify-center gap-1 text-center"
                title="Claude 3.7 Sonnet avec audit de sécurité"
              >
                <Shield className="w-3 h-3 shrink-0" /> Claude 3.7
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetProfile('ollama')}
                className="px-2 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-[11px] font-medium transition flex items-center justify-center gap-1 text-center"
                title="Ollama Localhost, 100% hors-ligne & privé"
              >
                <Server className="w-3 h-3 shrink-0" /> Ollama Local
              </button>
            </div>
          </div>

          {/* Section: Model Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="font-semibold text-zinc-200 flex items-center gap-2 text-sm">
                <Cpu className="w-4 h-4 text-emerald-400" /> Choisir un Modèle IA
                <span className="text-[10px] px-2 py-0.2 bg-zinc-800 rounded font-mono text-zinc-400">
                  {filteredModels.length} disponibles
                </span>
              </label>

              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher (ex: r1, flash, codestral)..."
                  className="w-full pl-8 pr-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Provider Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
              <button
                type="button"
                onClick={() => setProviderFilter('all')}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition ${
                  providerFilter === 'all'
                    ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Tous ({AVAILABLE_MODELS.length})
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter('google')}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition flex items-center gap-1 ${
                  providerFilter === 'google'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-400" /> Google Gemini (5)
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter('deepseek')}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition flex items-center gap-1 ${
                  providerFilter === 'deepseek'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-semibold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <TerminalSquare className="w-3 h-3 text-cyan-400" /> DeepSeek (2)
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter('mistral')}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition flex items-center gap-1 ${
                  providerFilter === 'mistral'
                    ? 'bg-orange-950/60 border-orange-500 text-orange-300 font-semibold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3 h-3 text-orange-400" /> Mistral AI (2)
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter('anthropic_openai')}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition flex items-center gap-1 ${
                  providerFilter === 'anthropic_openai'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-semibold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3 h-3 text-purple-400" /> Claude & OpenAI (4)
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter('opensource')}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition flex items-center gap-1 ${
                  providerFilter === 'opensource'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-semibold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Server className="w-3 h-3 text-rose-400" /> Open Source & Local (3)
              </button>
            </div>

            {/* Model Cards Grid */}
            <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredModels.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-zinc-100 text-xs tracking-tight">{m.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${m.providerBadgeColor}`}>
                            {m.providerName}
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full border font-semibold ${m.tagColor}`}>
                            {m.tag}
                          </span>
                        </div>

                        {/* Specs Badges */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                          <span className="flex items-center gap-1 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
                            <Clock className="w-3 h-3 text-zinc-500" /> {m.latency}
                          </span>
                          <span className="bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
                            {m.contextWindow}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">{m.description}</p>

                      {/* Strengths Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {m.strengths.map((str, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 bg-zinc-900/80 border border-zinc-800/80 rounded text-zinc-300 font-mono"
                          >
                            ✓ {str}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                          : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}

              {filteredModels.length === 0 && (
                <div className="p-6 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl space-y-1">
                  <p>Aucun modèle trouvé pour "{searchQuery}".</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setProviderFilter('all');
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}

              {/* Custom Model Choice */}
              <div
                onClick={() => setSelectedModel('custom')}
                className={`p-3 rounded-xl border cursor-pointer transition space-y-2 ${
                  selectedModel === 'custom'
                    ? 'bg-emerald-950/30 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-xs">Identifiant de Modèle Personnalisé</span>
                    <span className="text-[10px] px-2 py-0.5 rounded border font-mono bg-zinc-800 text-zinc-300 border-zinc-700">
                      ID Manuel / Fine-tuned
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedModel === 'custom'
                        ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                        : 'border-zinc-600'
                    }`}
                  >
                    {selectedModel === 'custom' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {selectedModel === 'custom' && (
                  <div className="pt-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder="Ex: gemini-3.8-flash, deepseek-r1, llama3.3:70b..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-400">
                      <span>Raccourcis rapides :</span>
                      {['gemini-3.8-flash', 'deepseek-r1', 'codestral-latest', 'claude-3-7-sonnet', 'ollama-local'].map(
                        (id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setCustomModelInput(id)}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-mono transition"
                          >
                            {id}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Advanced AI Tuning Parameters (Sliders & Persona) */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
            <button
              type="button"
              onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-900/60 transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-zinc-200 text-xs">Paramètres Avancés & Profil Système</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                  Temp: {temperature.toFixed(2)} • {persona}
                </span>
              </div>
              <span className="text-zinc-500 text-xs">{showAdvancedTuning ? 'Masquer ▲' : 'Configurer ▼'}</span>
            </button>

            {showAdvancedTuning && (
              <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950/80">
                {/* Temperature Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-zinc-300 text-xs flex items-center gap-1.5">
                      <span>Température de Génération :</span>
                      <strong className="text-emerald-400 font-mono text-xs">{temperature.toFixed(2)}</strong>
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      {temperature <= 0.2
                        ? '🎯 Strict & Déterministe (Recommandé Shell)'
                        : temperature <= 0.5
                        ? '⚖️ Équilibré'
                        : '💡 Créatif'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>0.0 (Précis)</span>
                    <span>0.2 (Défaut Bash)</span>
                    <span>1.0 (Créatif)</span>
                  </div>
                </div>

                {/* Persona Selector */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <label className="font-medium text-zinc-300 text-xs block">
                    Style & Rôle Système de l'Assistant :
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPersona('sysadmin')}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        persona === 'sysadmin'
                          ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">🛠️ DevOps Senior</div>
                      <div className="text-[10px] mt-0.5 leading-snug">Commandes directes, flags optimisés et scripts concis.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersona('educational')}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        persona === 'educational'
                          ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">🎓 Pédagogique</div>
                      <div className="text-[10px] mt-0.5 leading-snug">Explications détaillées de chaque argument et drapeau.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersona('security')}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        persona === 'security'
                          ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">🛡️ Sécurité & Audit</div>
                      <div className="text-[10px] mt-0.5 leading-snug">Analyse des privilèges root, impact disque et risques réseau.</div>
                    </button>
                  </div>
                </div>

                {/* Safety Filter Toggle */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-medium text-zinc-300 text-xs flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Garde-fou Commandes Destructrices (Safety Guard)
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Alerte automatiquement si une commande générée contient rm -rf, mkfs ou écriture brute sur /dev.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSafetyFilter(!safetyFilter)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      safetyFilter ? 'bg-emerald-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        safetyFilter ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Custom API Key / BYOK & Custom Endpoint */}
          <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-zinc-200 text-xs">Clé d'API & Endpoint Personnalisés (BYOK)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">
                  {isCustomKeyEnabled ? 'Activé (Clé Utilisateur)' : 'Défaut (Clé Serveur Inclus)'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomKeyEnabled(!isCustomKeyEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isCustomKeyEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isCustomKeyEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {isCustomKeyEnabled ? (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300">Votre Clé d'API :</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Obtenir une clé Google AI Studio <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSy... (ou clé personnalisée)"
                      className="w-full pr-24 pl-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="px-1.5 py-1 text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded text-[10px] flex items-center gap-1 transition"
                        title="Coller depuis le presse-papier"
                      >
                        <ClipboardPaste className="w-3 h-3" /> Coller
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1 text-zinc-400 hover:text-zinc-200"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Endpoint Input (for Ollama or custom gateway) */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 flex items-center gap-1">
                      <Server className="w-3 h-3 text-zinc-400" /> Endpoint d'API Personnalisé (Optionnel) :
                    </span>
                    <span className="text-zinc-500 text-[10px]">Ollama, OpenRouter, vLLM</span>
                  </div>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="Ex: http://localhost:11434 ou https://api.openai.com/v1"
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Per-provider API keys (BYOK) */}
                <div className="space-y-1 pt-1 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 flex items-center gap-1">
                      <Key className="w-3 h-3 text-zinc-400" /> Clés API par fournisseur :
                    </span>
                    <span className="text-zinc-500 text-[10px]">la clé du fournisseur du modèle sélectionné est transmise</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {KEY_PROVIDERS.map((p) => (
                      <div key={p.id} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-300">{p.label}</span>
                          <span className="text-zinc-500">{p.hint}</span>
                        </div>
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKeys[p.id] || ''}
                          onChange={(e) => setApiKeys((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder={`Clé ${p.label}`}
                          className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                L'application utilise le moteur IA serveur préconfiguré. Activez l'option ci-dessus pour utiliser vos propres quotas, clés de projet Google Cloud ou connecter une instance locale.
              </p>
            )}
          </div>

          {/* Section: Live Connection Diagnostic & Benchmark Suite */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-zinc-200 text-xs">Banc d'Essai & Diagnostic Réseau</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testSampleEnabled}
                    onChange={(e) => setTestSampleEnabled(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Tester avec invite Bash réelle</span>
                </label>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Mesure en cours...' : 'Tester la Connexion'}
                </button>
              </div>
            </div>

            {testSampleEnabled && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={sampleQuery}
                  onChange={(e) => setSampleQuery(e.target.value)}
                  placeholder="Ex: Lister les processus actifs triés par mémoire"
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-2 ${
                  testResult.success
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold">{testResult.message}</span>
                  </div>

                  {testResult.latencyMs !== undefined && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                      ⏱ {testResult.latencyMs} ms
                    </span>
                  )}
                </div>

                {testResult.sampleResponse && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 text-zinc-300 font-mono text-[11px] bg-zinc-900/80 p-2 rounded">
                    <span className="text-zinc-500 block text-[10px] uppercase">Réponse modèle :</span>
                    "{testResult.sampleResponse}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span>Actif :</span>
            <strong className="text-emerald-400 font-mono">{currentEffectiveModel}</strong>
            {currentModelSpec && (
              <span className="text-zinc-500">({currentModelSpec.providerName})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Enregistrer les Paramètres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
