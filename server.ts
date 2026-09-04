import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Real multi-provider AI backend.
// Each app model id maps to a real provider + real model id. No fake personas.
// ---------------------------------------------------------------------------
type ProviderId =
  | 'google' | 'deepseek' | 'mistral' | 'anthropic' | 'openai'
  | 'qwen' | 'llama' | 'ollama' | 'custom';

type ClientKind = 'gemini' | 'anthropic' | 'openai-compat';
type AuthKind = 'bearer' | 'x-api-key' | 'google' | 'none';

interface ProviderSpec {
  id: ProviderId;
  name: string;
  kind: ClientKind;
  baseUrl: string;
  keyEnv?: string; // env var holding this provider's API key
  auth: AuthKind;
  modelMap: Record<string, string>; // app model id -> real provider model id
}

// Endpoints / model ids are public real-world values.
const PROVIDERS: Record<ProviderId, ProviderSpec> = {
  google: {
    id: 'google', name: 'Google Gemini', kind: 'gemini', baseUrl: '', keyEnv: 'GEMINI_API_KEY', auth: 'google',
    modelMap: {
      'gemini-3.8-flash': 'gemini-3.8-flash',
      'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
      'gemini-2.5-flash': 'gemini-2.5-flash',
      'gemini-flash-latest': 'gemini-flash-latest',
    },
  },
  deepseek: {
    id: 'deepseek', name: 'DeepSeek', kind: 'openai-compat', baseUrl: 'https://api.deepseek.com', keyEnv: 'DEEPSEEK_API_KEY', auth: 'bearer',
    modelMap: { 'deepseek-r1': 'deepseek-reasoner', 'deepseek-v3': 'deepseek-chat' },
  },
  mistral: {
    id: 'mistral', name: 'Mistral AI', kind: 'openai-compat', baseUrl: 'https://api.mistral.ai/v1', keyEnv: 'MISTRAL_API_KEY', auth: 'bearer',
    modelMap: { 'codestral-latest': 'codestral-latest', 'mistral-large-latest': 'mistral-large-latest' },
  },
  anthropic: {
    id: 'anthropic', name: 'Anthropic', kind: 'anthropic', baseUrl: 'https://api.anthropic.com', keyEnv: 'ANTHROPIC_API_KEY', auth: 'x-api-key',
    modelMap: {
      'claude-3-7-sonnet': 'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
    },
  },
  openai: {
    id: 'openai', name: 'OpenAI', kind: 'openai-compat', baseUrl: 'https://api.openai.com/v1', keyEnv: 'OPENAI_API_KEY', auth: 'bearer',
    modelMap: { 'gpt-4o': 'gpt-4o', 'o3-mini': 'o3-mini' },
  },
  qwen: {
    // Alibaba DashScope exposes Qwen via an OpenAI-compatible endpoint.
    id: 'qwen', name: 'Alibaba Qwen (DashScope)', kind: 'openai-compat', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', keyEnv: 'DASHSCOPE_API_KEY', auth: 'bearer',
    modelMap: { 'qwen2.5-coder-32b': 'qwen2.5-coder-32b' },
  },
  llama: {
    // Meta has no first-party API for llama-3.3-70b; served via OpenRouter.
    id: 'llama', name: 'Meta LLaMA (OpenRouter)', kind: 'openai-compat', baseUrl: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY', auth: 'bearer',
    modelMap: { 'llama-3.3-70b': 'meta-llama/llama-3.3-70b-instruct' },
  },
  ollama: {
    id: 'ollama', name: 'Ollama Local', kind: 'openai-compat', baseUrl: 'http://localhost:11434/v1', keyEnv: '', auth: 'none',
    // Default local model; the UI lets the user override the model name.
    modelMap: { 'ollama-local': 'llama3.3' },
  },
  custom: {
    id: 'custom', name: 'Personnalisé (OpenAI-compatible)', kind: 'openai-compat', baseUrl: '', keyEnv: '', auth: 'bearer',
    modelMap: {},
  },
};

interface ResolvedModel {
  provider: ProviderSpec;
  providerId: ProviderId;
  engineModel: string;
  displayName: string;
}

const resolveModel = (rawModel?: string): ResolvedModel => {
  const id = (rawModel && rawModel.trim()) || 'gemini-3.8-flash';
  for (const spec of Object.values(PROVIDERS)) {
    if (spec.modelMap[id] !== undefined && spec.id !== 'custom') {
      return { provider: spec, providerId: spec.id, engineModel: spec.modelMap[id], displayName: id };
    }
  }
  // Unknown model id -> custom OpenAI-compatible endpoint (user provides baseUrl + key).
  return { provider: PROVIDERS.custom, providerId: 'custom', engineModel: id, displayName: id };
};

const resolveKey = (spec: ProviderSpec, reqKey?: string): string => {
  if (reqKey && reqKey.trim()) return reqKey.trim();
  if (spec.keyEnv && process.env[spec.keyEnv]) return process.env[spec.keyEnv];
  return '';
};

// --- Gemini (official SDK) ---
async function geminiGenerate(apiKey: string, model: string, system: string, prompt: string, temperature: number): Promise<string> {
  if (!apiKey) throw new Error('Aucune clé API Gemini. Renseignez GEMINI_API_KEY ou la clé dans les Paramètres IA.');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const r = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: system || undefined,
      temperature,
    },
  });
  return r.text?.trim() || '';
}

// --- Anthropic (native /v1/messages) ---
async function anthropicGenerate(apiKey: string, model: string, system: string, prompt: string, temperature: number): Promise<string> {
  if (!apiKey) throw new Error('Aucune clé API Anthropic. Renseignez ANTHROPIC_API_KEY ou la clé dans les Paramètres IA.');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      ...(system ? { system } : {}),
      temperature,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.raw || `Erreur Anthropic ${res.status}`);
  }
  return (data?.content?.[0]?.text || '').trim();
}

// --- OpenAI-compatible (DeepSeek, Mistral, OpenAI, Qwen, Llama, Ollama, custom) ---
async function openaiCompatGenerate(baseUrl: string, apiKey: string, auth: AuthKind, model: string, system: string, prompt: string, temperature: number): Promise<string> {
  if (auth === 'bearer' && !apiKey) {
    throw new Error(`Aucune clé API pour ce fournisseur (${model}). Renseignez la clé dans les Paramètres IA ou via la variable d'environnement dédiée.`);
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const messages: Array<{ role: string; content: string }> = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, temperature, stream: false }),
  });

  // Tolerant body parsing: some providers return plain-text error bodies.
  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || data?.raw || `Erreur HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return (data?.choices?.[0]?.message?.content || '').trim();
}

// --- Central dispatcher ---
async function generateText(
  resolved: ResolvedModel,
  opts: { key?: string; system?: string; prompt: string; temperature?: number; customEndpoint?: string },
): Promise<string> {
  const temp = typeof opts.temperature === 'number' ? opts.temperature : 0.2;
  const spec = resolved.provider;

  // Custom provider: baseUrl + key come from the request.
  if (resolved.providerId === 'custom') {
    const baseUrl = (opts.customEndpoint || '').trim();
    if (!baseUrl) throw new Error('Aucun endpoint personnalisé fourni (customEndpoint).');
    const key = opts.key?.trim() || '';
    return openaiCompatGenerate(baseUrl, key, key ? 'bearer' : 'none', resolved.engineModel, opts.system || '', opts.prompt, temp);
  }

  const key = resolveKey(spec, opts.key);
  switch (spec.kind) {
    case 'gemini':
      return geminiGenerate(key, resolved.engineModel, opts.system || '', opts.prompt, temp);
    case 'anthropic':
      return anthropicGenerate(key, resolved.engineModel, opts.system || '', opts.prompt, temp);
    case 'openai-compat':
    default:
      return openaiCompatGenerate(spec.baseUrl, key, spec.auth, resolved.engineModel, opts.system || '', opts.prompt, temp);
  }
}

const safeParseJson = <T = unknown>(text: string): T => {
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'OmniLinux Terminal' });
  });

  // Test AI Configuration (model & API key)
  app.post('/api/ai/test-config', async (req, res) => {
    const startTime = Date.now();
    try {
      const { model, apiKey, samplePrompt, customEndpoint } = req.body;
      const resolved = resolveModel(model);
      const promptToRun = samplePrompt && samplePrompt.trim()
        ? `En tant qu'assistant Linux (${resolved.displayName}), réponds brièvement en 1 phrase à: ${samplePrompt.trim()}`
        : 'Réponds en un seul mot: "OK"';

      const text = await generateText(resolved, { key: apiKey, prompt: promptToRun, customEndpoint });
      const latencyMs = Date.now() - startTime;

      return res.json({
        status: 'ok',
        model: resolved.displayName,
        engineModel: resolved.engineModel,
        provider: resolved.provider.name,
        providerId: resolved.providerId,
        latencyMs,
        message: `Connexion réussie ! Modèle "${resolved.displayName}" (${resolved.provider.name}) opérationnel (${latencyMs}ms).`,
        sampleResponse: text || 'OK',
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      console.error('AI Test Config Error:', err);
      return res.status(400).json({
        error: err.message || 'Erreur de validation de la clé API ou du modèle.',
        latencyMs,
      });
    }
  });

  // AI Command Generator / Natural language to Bash
  app.post('/api/ai/generate-command', async (req, res) => {
    try {
      const { prompt, distro, currentDir, model, apiKey, temperature, persona, customEndpoint } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Un prompt est requis.' });
      }

      const resolved = resolveModel(model);

      let personaNote = 'Réponds avec concision et précision chirurgicale de niveau SysAdmin/DevOps senior.';
      if (persona === 'educational') {
        personaNote = 'Adopte une approche pédagogique, explique le rôle de chaque flag et argument pour faciliter l\'apprentissage.';
      } else if (persona === 'security') {
        personaNote = 'Accorde une attention critique à la sécurité, analyse les privilèges nécessaires et mentionne les risques potentiels.';
      }

      const systemInstruction = `Tu es un expert Linux. Distribution: "${distro || 'Ubuntu'}", répertoire courant: "${currentDir || '~'}".
${personaNote}
Convertis la demande en français ou anglais vers la commande bash exacte appropriée pour sa distribution.
Fournis un résultat JSON structuré avec:
- "command": La commande Bash exacte prête à être exécutée.
- "explanation": Une brève explication en français (2-3 phrases) de ce que fait la commande.
- "tips": Un ou deux conseils utiles ou drapeaux importants.
Réponds UNIQUEMENT sous forme de JSON valide.`;

      const text = await generateText(resolved, { key: apiKey, system: systemInstruction, prompt, temperature, customEndpoint });
      const json = safeParseJson(text);
      return res.json(json);
    } catch (err: any) {
      console.error('AI Generate Command Error:', err);
      return res.status(500).json({ error: err.message || "Erreur lors de la génération de la commande." });
    }
  });

  // AI Command Explainer
  app.post('/api/ai/explain-command', async (req, res) => {
    try {
      const { command, distro, model, apiKey, temperature, persona, customEndpoint } = req.body;
      if (!command) {
        return res.status(400).json({ error: 'Une commande est requise.' });
      }

      const resolved = resolveModel(model);

      let personaNote = 'Fournis une analyse technique claire et concise.';
      if (persona === 'educational') {
        personaNote = 'Détaille pédagogiquement chaque partie pour un utilisateur en cours d\'apprentissage.';
      } else if (persona === 'security') {
        personaNote = 'Évalue avec une vigilance accrue la criticité root, les impacts sur le système de fichiers et la sécurité.';
      }

      const systemInstruction = `Tu es un expert en ligne de commande Linux. ${personaNote}
Analyse la commande suivante pour la distribution "${distro || 'Linux'}": \`${command}\`.
Fournis une explication détaillée en français avec:
- "summary": Résumé rapide en 1-2 phrases.
- "breakdown": Un tableau d'éléments décrivant chaque partie, option/drapeau et argument.
- "safety": Risque potentiel (Faible, Moyen, Élevé) si exécuté avec privilèges root.
- "example": Un exemple concret d'utilisation.
Réponds au format JSON avec les clés "summary", "breakdown" (liste de {part, description}), "safety", "example".`;

      const text = await generateText(resolved, { key: apiKey, system: systemInstruction, prompt: command, temperature, customEndpoint });
      const json = safeParseJson(text);
      return res.json(json);
    } catch (err: any) {
      console.error('AI Explain Command Error:', err);
      return res.status(500).json({ error: err.message || "Erreur lors de l'explication de la commande." });
    }
  });

  // AI Error Debugger
  app.post('/api/ai/debug-error', async (req, res) => {
    try {
      const { command, errorOutput, distro, model, apiKey, temperature, customEndpoint } = req.body;
      if (!command) {
        return res.status(400).json({ error: 'Données insuffisantes pour le débogage.' });
      }

      const resolved = resolveModel(model);
      const prompt = `Commande exécutée: \`${command}\`
Distribution: ${distro || 'Linux'}
Erreur ou sortie:
${errorOutput || 'Commande introuvable ou erreur inconnue'}`;

      const systemInstruction = `Tu es un assistant de débogage pour terminal Linux.
Analyse l'erreur ci-dessus et explique en français:
1. Pourquoi cette erreur s'est produite.
2. La solution exacte ou la commande corrigée.
Fournis un objet JSON avec "cause", "solution", "correctedCommand".`;

      const text = await generateText(resolved, { key: apiKey, system: systemInstruction, prompt, temperature, customEndpoint });
      const json = safeParseJson(text);
      return res.json(json);
    } catch (err: any) {
      console.error('AI Debug Error:', err);
      return res.status(500).json({ error: err.message || "Erreur lors du débogage de l'erreur." });
    }
  });

  // Global error handler: clean JSON error, never leak stack traces.
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Unhandled server error:', err);
    if (res.headersSent) return;
    res.status(err.statusCode || err.status || 400).json({ error: 'Requête invalide ou corps JSON malformé.' });
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`OmniLinux Terminal server running on http://127.0.0.1:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
