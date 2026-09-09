use crate::models::AppError;
use serde_json::{json, Value};
use std::sync::OnceLock;

// ===========================================================================
// Couche providers IA (source de vérité Rust).
// Port de l'ancien serveur Express (server.ts) : multi-provider réel
// (Gemini, Anthropic, OpenAI-compatible / DashScope / OpenRouter / Ollama /
// custom). Aucune donnée simulée : dégradation honnête via AppError.
// ===========================================================================

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum ProviderKind {
    Gemini,
    Anthropic,
    OpenAiCompat,
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum AuthKind {
    Bearer,
    XApiKey,
    Google,
    None,
}

pub struct ProviderSpec {
    pub id: &'static str,
    pub name: &'static str,
    pub kind: ProviderKind,
    pub base_url: &'static str,
    pub key_env: Option<&'static str>,
    pub auth: AuthKind,
    pub model_map: &'static [(&'static str, &'static str)],
}

pub struct ResolvedModel {
    pub provider_id: &'static str,
    pub provider_name: &'static str,
    pub kind: ProviderKind,
    pub base_url: &'static str,
    pub auth: AuthKind,
    pub key_env: Option<&'static str>,
    pub engine_model: String,
    pub display_name: String,
}

const PROVIDERS: &[ProviderSpec] = &[
    ProviderSpec {
        id: "google",
        name: "Google Gemini",
        kind: ProviderKind::Gemini,
        base_url: "",
        key_env: Some("GEMINI_API_KEY"),
        auth: AuthKind::Google,
        model_map: &[
            ("gemini-3.8-flash", "gemini-3.8-flash"),
            ("gemini-3.1-pro-preview", "gemini-3.1-pro-preview"),
            ("gemini-3.1-flash-lite", "gemini-3.1-flash-lite"),
            ("gemini-2.5-flash", "gemini-2.5-flash"),
            ("gemini-flash-latest", "gemini-flash-latest"),
        ],
    },
    ProviderSpec {
        id: "deepseek",
        name: "DeepSeek",
        kind: ProviderKind::OpenAiCompat,
        base_url: "https://api.deepseek.com",
        key_env: Some("DEEPSEEK_API_KEY"),
        auth: AuthKind::Bearer,
        model_map: &[
            ("deepseek-r1", "deepseek-reasoner"),
            ("deepseek-v3", "deepseek-chat"),
        ],
    },
    ProviderSpec {
        id: "mistral",
        name: "Mistral AI",
        kind: ProviderKind::OpenAiCompat,
        base_url: "https://api.mistral.ai/v1",
        key_env: Some("MISTRAL_API_KEY"),
        auth: AuthKind::Bearer,
        model_map: &[
            ("codestral-latest", "codestral-latest"),
            ("mistral-large-latest", "mistral-large-latest"),
        ],
    },
    ProviderSpec {
        id: "anthropic",
        name: "Anthropic",
        kind: ProviderKind::Anthropic,
        base_url: "",
        key_env: Some("ANTHROPIC_API_KEY"),
        auth: AuthKind::XApiKey,
        model_map: &[
            ("claude-3-7-sonnet", "claude-3-7-sonnet-20250219"),
            ("claude-3-5-haiku", "claude-3-5-haiku-20241022"),
        ],
    },
    ProviderSpec {
        id: "openai",
        name: "OpenAI",
        kind: ProviderKind::OpenAiCompat,
        base_url: "https://api.openai.com/v1",
        key_env: Some("OPENAI_API_KEY"),
        auth: AuthKind::Bearer,
        model_map: &[("gpt-4o", "gpt-4o"), ("o3-mini", "o3-mini")],
    },
    ProviderSpec {
        id: "qwen",
        name: "Alibaba Qwen (DashScope)",
        kind: ProviderKind::OpenAiCompat,
        base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        key_env: Some("DASHSCOPE_API_KEY"),
        auth: AuthKind::Bearer,
        model_map: &[("qwen2.5-coder-32b", "qwen2.5-coder-32b")],
    },
    ProviderSpec {
        id: "llama",
        name: "Meta LLaMA (OpenRouter)",
        kind: ProviderKind::OpenAiCompat,
        base_url: "https://openrouter.ai/api/v1",
        key_env: Some("OPENROUTER_API_KEY"),
        auth: AuthKind::Bearer,
        model_map: &[("llama-3.3-70b", "meta-llama/llama-3.3-70b-instruct")],
    },
    ProviderSpec {
        id: "ollama",
        name: "Ollama Local",
        kind: ProviderKind::OpenAiCompat,
        base_url: "http://localhost:11434/v1",
        key_env: None,
        auth: AuthKind::None,
        model_map: &[("ollama-local", "llama3.3")],
    },
    ProviderSpec {
        id: "custom",
        name: "Personnalisé (OpenAI-compatible)",
        kind: ProviderKind::OpenAiCompat,
        base_url: "",
        key_env: None,
        auth: AuthKind::Bearer,
        model_map: &[],
    },
];

pub fn resolve_model(raw: Option<&str>) -> ResolvedModel {
    let id = raw
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .unwrap_or("gemini-3.8-flash");

    for spec in PROVIDERS {
        if spec.id == "custom" {
            continue;
        }
        for (key, value) in spec.model_map {
            if *key == id {
                return ResolvedModel {
                    provider_id: spec.id,
                    provider_name: spec.name,
                    kind: spec.kind,
                    base_url: spec.base_url,
                    auth: spec.auth,
                    key_env: spec.key_env,
                    engine_model: value.to_string(),
                    display_name: id.to_string(),
                };
            }
        }
    }

    // Modèle inconnu -> endpoint OpenAI-compatible personnalisé (baseURL + clé fournies).
    ResolvedModel {
        provider_id: "custom",
        provider_name: "Personnalisé (OpenAI-compatible)",
        kind: ProviderKind::OpenAiCompat,
        base_url: "",
        auth: AuthKind::Bearer,
        key_env: None,
        engine_model: id.to_string(),
        display_name: id.to_string(),
    }
}

fn resolve_key(resolved: &ResolvedModel, req_key: Option<&str>) -> String {
    if let Some(k) = req_key {
        let t = k.trim();
        if !t.is_empty() {
            return t.to_string();
        }
    }
    if let Some(env) = resolved.key_env {
        if let Ok(v) = std::env::var(env) {
            let t = v.trim();
            if !t.is_empty() {
                return t.to_string();
            }
        }
    }
    String::new()
}

fn client() -> &'static reqwest::Client {
    static C: OnceLock<reqwest::Client> = OnceLock::new();
    C.get_or_init(reqwest::Client::new)
}

fn parse_response(raw: &str, status: reqwest::StatusCode, _provider: &str) -> Result<Value, AppError> {
    let data: Value = serde_json::from_str(raw).unwrap_or_else(|_| json!({ "raw": raw }));
    if !status.is_success() {
        let msg = data
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .or_else(|| data.get("message").and_then(|m| m.as_str()))
            .or_else(|| data.get("raw").and_then(|m| m.as_str()))
            .unwrap_or("Erreur HTTP");
        return Err(AppError::new(
            "ai_http",
            format!("{} (HTTP {})", msg, status.as_u16()),
        ));
    }
    Ok(data)
}

async fn gemini_generate(
    api_key: &str,
    model: &str,
    system: &str,
    prompt: &str,
    temperature: f32,
) -> Result<String, AppError> {
    if api_key.trim().is_empty() {
        return Err(AppError::new(
            "ai_key_missing",
            "Aucune clé API Gemini. Renseignez GEMINI_API_KEY ou la clé dans les Paramètres IA.",
        ));
    }
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
        model
    );
    let mut body = json!({
        "contents": [ { "parts": [ { "text": prompt } ] } ],
        "generationConfig": { "temperature": temperature }
    });
    if !system.trim().is_empty() {
        body["systemInstruction"] = json!({ "parts": [ { "text": system } ] });
    }
    let resp = client()
        .post(&url)
        .header("x-goog-api-key", api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::new("ai_http", format!("Erreur réseau Gemini : {}", e)))?;
    let status = resp.status();
    let raw = resp
        .text()
        .await
        .map_err(|e| AppError::new("ai_http", format!("Lecture réponse Gemini : {}", e)))?;
    let data = parse_response(&raw, status, "Gemini")?;
    let text = data
        .get("candidates")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("content"))
        .and_then(|c| c.get("parts"))
        .and_then(|p| p.get(0))
        .and_then(|p| p.get("text"))
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    Ok(text)
}

async fn anthropic_generate(
    api_key: &str,
    model: &str,
    system: &str,
    prompt: &str,
    temperature: f32,
) -> Result<String, AppError> {
    if api_key.trim().is_empty() {
        return Err(AppError::new(
            "ai_key_missing",
            "Aucune clé API Anthropic. Renseignez ANTHROPIC_API_KEY ou la clé dans les Paramètres IA.",
        ));
    }
    let mut body = json!({
        "model": model,
        "max_tokens": 2048,
        "temperature": temperature,
        "messages": [ { "role": "user", "content": prompt } ]
    });
    if !system.trim().is_empty() {
        body["system"] = json!(system);
    }
    let resp = client()
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::new("ai_http", format!("Erreur réseau Anthropic : {}", e)))?;
    let status = resp.status();
    let raw = resp
        .text()
        .await
        .map_err(|e| AppError::new("ai_http", format!("Lecture réponse Anthropic : {}", e)))?;
    let data = parse_response(&raw, status, "Anthropic")?;
    let text = data
        .get("content")
        .and_then(|c| c.get(0))
        .and_then(|m| m.get("text"))
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    Ok(text)
}

async fn openai_compat_generate(
    base_url: &str,
    api_key: &str,
    auth: AuthKind,
    model: &str,
    system: &str,
    prompt: &str,
    temperature: f32,
) -> Result<String, AppError> {
    let needs_key = matches!(auth, AuthKind::Bearer | AuthKind::XApiKey);
    if needs_key && api_key.trim().is_empty() {
        return Err(AppError::new(
            "ai_key_missing",
            format!(
                "Aucune clé API pour ce fournisseur ({}). Renseignez la clé dans les Paramètres IA ou via la variable d'environnement dédiée.",
                model
            ),
        ));
    }
    let base = base_url.trim_end_matches('/');
    let url = format!("{}/chat/completions", base);
    let mut messages = Vec::new();
    if !system.trim().is_empty() {
        messages.push(json!({ "role": "system", "content": system }));
    }
    messages.push(json!({ "role": "user", "content": prompt }));
    let body = json!({
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "stream": false
    });
    let mut req = client()
        .post(&url)
        .header("Content-Type", "application/json");
    if !api_key.trim().is_empty() {
        req = req.header("Authorization", format!("Bearer {}", api_key));
    }
    let resp = req
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::new("ai_http", format!("Erreur réseau ({}) : {}", model, e)))?;
    let status = resp.status();
    let raw = resp
        .text()
        .await
        .map_err(|e| AppError::new("ai_http", format!("Lecture réponse ({}) : {}", model, e)))?;
    let data = parse_response(&raw, status, model)?;
    let text = data
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|m| m.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    Ok(text)
}

pub struct GenerateOpts<'a> {
    pub key: Option<&'a str>,
    pub system: Option<&'a str>,
    pub prompt: &'a str,
    pub temperature: Option<f32>,
    pub custom_endpoint: Option<&'a str>,
}

/// Dispatch générique selon le provider résolu (miroir de generateText de server.ts).
pub async fn generate_text(resolved: &ResolvedModel, opts: &GenerateOpts<'_>) -> Result<String, AppError> {
    let temp = opts.temperature.unwrap_or(0.2);

    if resolved.provider_id == "custom" {
        let base_url = opts.custom_endpoint.map(|s| s.trim()).unwrap_or("");
        if base_url.is_empty() {
            return Err(AppError::new(
                "ai_endpoint_missing",
                "Aucun endpoint personnalisé fourni (customEndpoint).",
            ));
        }
        let key = opts.key.map(|s| s.trim()).unwrap_or("");
        let auth = if key.is_empty() {
            AuthKind::None
        } else {
            AuthKind::Bearer
        };
        return openai_compat_generate(
            base_url,
            key,
            auth,
            &resolved.engine_model,
            opts.system.unwrap_or(""),
            opts.prompt,
            temp,
        )
        .await;
    }

    let key = resolve_key(resolved, opts.key);
    match resolved.kind {
        ProviderKind::Gemini => {
            gemini_generate(&key, &resolved.engine_model, opts.system.unwrap_or(""), opts.prompt, temp).await
        }
        ProviderKind::Anthropic => {
            anthropic_generate(&key, &resolved.engine_model, opts.system.unwrap_or(""), opts.prompt, temp).await
        }
        ProviderKind::OpenAiCompat => openai_compat_generate(
            &resolved.base_url,
            &key,
            resolved.auth,
            &resolved.engine_model,
            opts.system.unwrap_or(""),
            opts.prompt,
            temp,
        )
        .await,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_known_models_to_providers() {
        let m = resolve_model(Some("gemini-2.5-flash"));
        assert_eq!(m.provider_id, "google");
        assert_eq!(m.engine_model, "gemini-2.5-flash");

        let m = resolve_model(Some("deepseek-r1"));
        assert_eq!(m.provider_id, "deepseek");
        assert_eq!(m.engine_model, "deepseek-reasoner");
    }

    #[test]
    fn resolves_unknown_model_to_custom() {
        let m = resolve_model(Some("my-fancy-model"));
        assert_eq!(m.provider_id, "custom");
        assert_eq!(m.engine_model, "my-fancy-model");
    }

    #[test]
    fn resolves_default_model_when_blank() {
        let m = resolve_model(None);
        assert_eq!(m.provider_id, "google");
        assert_eq!(m.engine_model, "gemini-3.8-flash");
    }
}
