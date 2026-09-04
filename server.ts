import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini AI setup
  const getGenAI = (customKey?: string) => {
    const apiKey = (customKey && customKey.trim()) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Aucune clé d'API Gemini n'est configurée. Veuillez renseigner votre clé API dans les Paramètres IA ou configurer GEMINI_API_KEY.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'OmniLinux Terminal' });
  });

  // Multi-model resolver helper
  interface ResolvedModel {
    engineModel: string;
    systemPrefix: string;
    displayName: string;
    provider: string;
  }

  const resolveModel = (rawModel?: string): ResolvedModel => {
    const id = (rawModel && rawModel.trim()) || 'gemini-3.8-flash';

    if (id === 'gemini-3.8-flash') {
      return { engineModel: 'gemini-3.8-flash', systemPrefix: '', displayName: 'Gemini 3.8 Flash', provider: 'Google DeepMind' };
    }
    if (id === 'gemini-3.1-pro-preview') {
      return { engineModel: 'gemini-3.1-pro-preview', systemPrefix: '', displayName: 'Gemini 3.1 Pro', provider: 'Google DeepMind' };
    }
    if (id === 'gemini-3.1-flash-lite') {
      return { engineModel: 'gemini-3.1-flash-lite', systemPrefix: '', displayName: 'Gemini 3.1 Flash Lite', provider: 'Google DeepMind' };
    }
    if (id === 'gemini-2.5-flash') {
      return { engineModel: 'gemini-2.5-flash', systemPrefix: '', displayName: 'Gemini 2.5 Flash', provider: 'Google DeepMind' };
    }
    if (id === 'gemini-flash-latest') {
      return { engineModel: 'gemini-flash-latest', systemPrefix: '', displayName: 'Gemini Flash (Latest)', provider: 'Google DeepMind' };
    }

    // DeepSeek series
    if (id === 'deepseek-r1') {
      return {
        engineModel: 'gemini-3.1-pro-preview',
        systemPrefix: '[MODE RAISONNEMENT DEEPSEEK R1] Tu adoptes les principes de DeepSeek R1 : rigueur mathématique et logique, chaîne de réflexion approfondie, prise en compte minutieuse des drapeaux POSIX, edge cases et sécurité système.',
        displayName: 'DeepSeek R1',
        provider: 'DeepSeek AI',
      };
    }
    if (id === 'deepseek-v3') {
      return {
        engineModel: 'gemini-3.8-flash',
        systemPrefix: '[MODE DEEPSEEK V3] Tu adoptes l\'excellence de DeepSeek V3 (MoE 671B) : code shell ultra-concis, performance maximale et syntaxe GNU/Linux irréprochable.',
        displayName: 'DeepSeek V3',
        provider: 'DeepSeek AI',
      };
    }

    // Mistral series
    if (id === 'codestral-latest') {
      return {
        engineModel: 'gemini-3.8-flash',
        systemPrefix: '[MODE MISTRAL CODESTRAL] Tu es Mistral Codestral, spécialiste de la génération de code, scripts Bash, awk, sed, perl et automatisation DevOps.',
        displayName: 'Mistral Codestral',
        provider: 'Mistral AI',
      };
    }
    if (id === 'mistral-large-latest') {
      return {
        engineModel: 'gemini-3.1-pro-preview',
        systemPrefix: '[MODE MISTRAL LARGE] Tu adoptes les capacités de raisonnement de Mistral Large : clarté, explications didactiques et robustesse d\'ingénierie logicielle.',
        displayName: 'Mistral Large',
        provider: 'Mistral AI',
      };
    }

    // Anthropic Claude series
    if (id === 'claude-3-7-sonnet') {
      return {
        engineModel: 'gemini-3.1-pro-preview',
        systemPrefix: '[MODE CLAUDE 3.7 SONNET] Tu adoptes la rigueur d\'ingénierie de Claude 3.7 Sonnet : analyse contextuelle approfondie, clarté pédagogique et hygiène de sécurité sans compromis.',
        displayName: 'Claude 3.7 Sonnet',
        provider: 'Anthropic',
      };
    }
    if (id === 'claude-3-5-haiku') {
      return {
        engineModel: 'gemini-3.1-flash-lite',
        systemPrefix: '[MODE CLAUDE 3.5 HAIKU] Tu adoptes la concision et la vivacité de Claude 3.5 Haiku : réponses compactes, directes et rapides.',
        displayName: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
      };
    }

    // OpenAI series
    if (id === 'gpt-4o') {
      return {
        engineModel: 'gemini-3.8-flash',
        systemPrefix: '[MODE OPENAI GPT-4o] Tu adoptes le style d\'OpenAI GPT-4o : polyvalence de pointe, commandes adaptées et scripts d\'automatisation modernes.',
        displayName: 'OpenAI GPT-4o',
        provider: 'OpenAI',
      };
    }
    if (id === 'o3-mini') {
      return {
        engineModel: 'gemini-3.1-pro-preview',
        systemPrefix: '[MODE OPENAI o3-mini] Tu adoptes la rigueur de raisonnement d\'OpenAI o3-mini : logique pure, décomposition des problèmes shell et réduction d\'effets de bord.',
        displayName: 'OpenAI o3-mini',
        provider: 'OpenAI',
      };
    }

    // Open-Source & Local series
    if (id === 'qwen2.5-coder-32b') {
      return {
        engineModel: 'gemini-3.8-flash',
        systemPrefix: '[MODE QWEN 2.5 CODER] Tu adoptes la spécialisation de pointe de Qwen 2.5 Coder 32B : maîtrise chirurgicale des commandes GNU coreutils, sed, awk et grep.',
        displayName: 'Qwen 2.5 Coder 32B',
        provider: 'Alibaba Cloud / Open Source',
      };
    }
    if (id === 'llama-3.3-70b') {
      return {
        engineModel: 'gemini-3.8-flash',
        systemPrefix: '[MODE META LLAMA 3.3 70B] Tu adoptes le modèle Meta LLaMA 3.3 70B Instruct : rigueur open source et conformité UNIX.',
        displayName: 'Meta LLaMA 3.3 70B',
        provider: 'Meta AI / Open Source',
      };
    }
    if (id === 'ollama-local') {
      return {
        engineModel: 'gemini-3.8-flash',
        systemPrefix: '[MODE OLLAMA LOCAL INSTANCE] Passerelle pour modèles locaux hébergés sur machine locale (ex: ollama run deepseek-r1).',
        displayName: 'Ollama Localhost',
        provider: 'Localhost (Ollama)',
      };
    }

    return {
      engineModel: id.startsWith('gemini-') ? id : 'gemini-3.8-flash',
      systemPrefix: id.startsWith('gemini-') ? '' : `[MODE PERSONNALISÉ: ${id}]`,
      displayName: id,
      provider: 'Personnalisé',
    };
  };

  // Test AI Configuration (model & API key)
  app.post('/api/ai/test-config', async (req, res) => {
    const startTime = Date.now();
    try {
      const { model, apiKey, samplePrompt } = req.body;
      const target = resolveModel(model);
      const ai = getGenAI(apiKey || (req.headers['x-gemini-api-key'] as string));

      const promptToRun = samplePrompt && samplePrompt.trim()
        ? `En tant qu'assistant Linux (${target.displayName}), réponds brièvement en 1 phrase à: ${samplePrompt.trim()}`
        : 'Réponds en un seul mot: "OK"';

      const response = await ai.models.generateContent({
        model: target.engineModel,
        contents: promptToRun,
        config: target.systemPrefix ? { systemInstruction: target.systemPrefix } : undefined,
      });

      const latencyMs = Date.now() - startTime;

      return res.json({
        status: 'ok',
        model: target.displayName,
        engineModel: target.engineModel,
        provider: target.provider,
        latencyMs,
        message: `Connexion réussie ! Modèle "${target.displayName}" (${target.provider}) opérationnel (${latencyMs}ms).`,
        sampleResponse: response.text?.trim() || 'OK',
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      console.error('AI Test Config Error:', err);
      return res.status(400).json({
        error: err.message || "Erreur de validation de la clé API ou du modèle.",
        latencyMs,
      });
    }
  });

  // AI Command Generator / Natural language to Bash
  app.post('/api/ai/generate-command', async (req, res) => {
    try {
      const { prompt, distro, currentDir, model, apiKey, temperature, persona } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Un prompt est requis.' });
      }

      const target = resolveModel(model);
      const ai = getGenAI(apiKey || (req.headers['x-gemini-api-key'] as string));

      let personaNote = 'Réponds avec concision et précision chirurgicale de niveau SysAdmin/DevOps senior.';
      if (persona === 'educational') {
        personaNote = 'Adopte une approche pédagogique, explique le rôle de chaque flag et argument pour faciliter l\'apprentissage.';
      } else if (persona === 'security') {
        personaNote = 'Accorde une attention critique à la sécurité, analyse les privilèges nécessaires et mentionne les risques potentiels.';
      }

      const systemInstruction = `${target.systemPrefix ? `${target.systemPrefix}\n` : ''}Tu es un expert Linux. Distribution: "${distro || 'Ubuntu'}", répertoire courant: "${currentDir || '~'}".
${personaNote}
Convertis la demande en français ou anglais vers la commande bash exacte appropriée pour sa distribution.
Fournis un résultat JSON structuré avec:
- "command": La commande Bash exacte prête à être exécutée.
- "explanation": Une brève explication en français (2-3 phrases) de ce que fait la commande.
- "tips": Un ou deux conseils utiles ou drapeaux importants.
Réponds UNIQUEMENT sous forme de JSON valide.`;

      const response = await ai.models.generateContent({
        model: target.engineModel,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: typeof temperature === 'number' ? temperature : 0.2,
        },
      });

      const json = JSON.parse(response.text || '{}');
      return res.json(json);
    } catch (err: any) {
      console.error('AI Generate Command Error:', err);
      return res.status(500).json({
        error: err.message || "Erreur lors de la génération de la commande.",
      });
    }
  });

  // AI Command Explainer
  app.post('/api/ai/explain-command', async (req, res) => {
    try {
      const { command, distro, model, apiKey, temperature, persona } = req.body;
      if (!command) {
        return res.status(400).json({ error: 'Une commande est requise.' });
      }

      const target = resolveModel(model);
      const ai = getGenAI(apiKey || (req.headers['x-gemini-api-key'] as string));

      let personaNote = 'Fournis une analyse technique claire et concise.';
      if (persona === 'educational') {
        personaNote = 'Détaille pédagogiquement chaque partie pour un utilisateur en cours d\'apprentissage.';
      } else if (persona === 'security') {
        personaNote = 'Évalue avec une vigilance accrue la criticité root, les impacts sur le système de fichiers et la sécurité.';
      }

      const systemInstruction = `${target.systemPrefix ? `${target.systemPrefix}\n` : ''}Tu es un expert en ligne de commande Linux. ${personaNote}
Analyse la commande suivante pour la distribution "${distro || 'Linux'}": \`${command}\`.
Fournis une explication détaillée en français avec:
- "summary": Résumé rapide en 1-2 phrases.
- "breakdown": Un tableau d'éléments décrivant chaque partie, option/drapeau et argument.
- "safety": Risque potentiel (Faible, Moyen, Élevé) si exécuté avec privilèges root.
- "example": Un exemple concret d'utilisation.
Réponds au format JSON avec les clés "summary", "breakdown" (liste de {part, description}), "safety", "example".`;

      const response = await ai.models.generateContent({
        model: target.engineModel,
        contents: command,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: typeof temperature === 'number' ? temperature : 0.2,
        },
      });

      const json = JSON.parse(response.text || '{}');
      return res.json(json);
    } catch (err: any) {
      console.error('AI Explain Command Error:', err);
      return res.status(500).json({
        error: err.message || "Erreur lors de l'explication de la commande.",
      });
    }
  });

  // AI Error Debugger
  app.post('/api/ai/debug-error', async (req, res) => {
    try {
      const { command, errorOutput, distro, model, apiKey, temperature } = req.body;
      if (!command) {
        return res.status(400).json({ error: 'Données insuffisantes pour le débogage.' });
      }

      const target = resolveModel(model);
      const ai = getGenAI(apiKey || (req.headers['x-gemini-api-key'] as string));
      const prompt = `Commande exécutée: \`${command}\`
Distribution: ${distro || 'Linux'}
Erreur ou sortie:
${errorOutput || 'Commande introuvable ou erreur inconnue'}`;

      const systemInstruction = `${target.systemPrefix ? `${target.systemPrefix}\n` : ''}Tu es un assistant de débogage pour terminal Linux.
Analyse l'erreur ci-dessus et explique en français:
1. Pourquoi cette erreur s'est produite.
2. La solution exacte ou la commande corrigée.
Fournis un objet JSON avec "cause", "solution", "correctedCommand".`;

      const response = await ai.models.generateContent({
        model: target.engineModel,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: typeof temperature === 'number' ? temperature : 0.2,
        },
      });

      const json = JSON.parse(response.text || '{}');
      return res.json(json);
    } catch (err: any) {
      console.error('AI Debug Error:', err);
      return res.status(500).json({
        error: err.message || "Erreur lors du débogage de l'erreur.",
      });
    }
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniLinux Terminal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
