use crate::models::{
    AiBreakdownItem, AiDebugRequest, AiDebugResponse, AiExplainRequest, AiExplainResponse,
    AiGenerateRequest, AiGenerateResponse, AiTestRequest, AiTestResponse, AppError,
};
use serde_json::Value;
use super::service::{self, resolve_model, GenerateOpts};
use super::AiEngine;

// ===========================================================================
// Commandes Tauri IA (migration de l'ancien serveur Express server.ts).
// Réelles, asynchrones, multi-provider. Aucune donnée simulée.
// ===========================================================================

fn strip_fences(text: &str) -> &str {
    let t = text.trim();
    if let Some(rest) = t.strip_prefix("```") {
        let body = if let Some(nl) = rest.find('\n') {
            &rest[nl + 1..]
        } else {
            rest
        };
        if let Some(idx) = body.find("```") {
            return body[..idx].trim();
        }
        return body.trim();
    }
    t
}

fn str_field(v: &Value, key: &str) -> Option<String> {
    v.get(key)
        .and_then(|x| x.as_str())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn breakdown_field(v: &Value) -> Vec<AiBreakdownItem> {
    v.get("breakdown")
        .and_then(|b| b.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    let part = str_field(item, "part").unwrap_or_default();
                    let description = str_field(item, "description").unwrap_or_default();
                    if part.is_empty() && description.is_empty() {
                        None
                    } else {
                        Some(AiBreakdownItem { part, description })
                    }
                })
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
#[specta::specta]
pub async fn ai_generate(request: AiGenerateRequest) -> Result<AiGenerateResponse, AppError> {
    let resolved = resolve_model(request.model.as_deref());
    let system = AiEngine::build_generate_prompt(
        request.persona.as_deref().unwrap_or(""),
        request.distro.as_deref().unwrap_or("Ubuntu"),
        request.current_dir.as_deref().unwrap_or("~"),
    );
    let text = service::generate_text(
        &resolved,
        &GenerateOpts {
            key: request.api_key.as_deref(),
            system: Some(&system),
            prompt: &request.prompt,
            temperature: request.temperature,
            custom_endpoint: request.custom_endpoint.as_deref(),
        },
    )
    .await?;

    let parsed: Value = serde_json::from_str(strip_fences(&text)).unwrap_or(Value::Null);
    let command = str_field(&parsed, "command").unwrap_or_else(|| text.trim().to_string());
    let explanation = str_field(&parsed, "explanation").unwrap_or_default();
    let tips = str_field(&parsed, "tips");
    let warnings = AiEngine::check_safety(&command);

    Ok(AiGenerateResponse {
        command,
        explanation,
        tips,
        warnings,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn ai_explain(request: AiExplainRequest) -> Result<AiExplainResponse, AppError> {
    let resolved = resolve_model(request.model.as_deref());
    let system = AiEngine::build_explain_prompt(
        request.persona.as_deref().unwrap_or(""),
        request.distro.as_deref().unwrap_or("Linux"),
        &request.command,
    );
    let text = service::generate_text(
        &resolved,
        &GenerateOpts {
            key: request.api_key.as_deref(),
            system: Some(&system),
            prompt: &request.command,
            temperature: request.temperature,
            custom_endpoint: request.custom_endpoint.as_deref(),
        },
    )
    .await?;

    let parsed: Value = serde_json::from_str(strip_fences(&text)).unwrap_or(Value::Null);
    Ok(AiExplainResponse {
        summary: str_field(&parsed, "summary").unwrap_or_default(),
        breakdown: breakdown_field(&parsed),
        safety: str_field(&parsed, "safety").unwrap_or_else(|| "Moyen".to_string()),
        example: str_field(&parsed, "example").unwrap_or_default(),
    })
}

#[tauri::command]
#[specta::specta]
pub async fn ai_debug(request: AiDebugRequest) -> Result<AiDebugResponse, AppError> {
    let resolved = resolve_model(request.model.as_deref());
    let system = AiEngine::build_debug_prompt();
    let user_prompt = format!(
        "Commande exécutée: `{}`\nDistribution: {}\nErreur ou sortie:\n{}",
        request.command,
        request.distro.as_deref().unwrap_or("Linux"),
        request.error_output.as_deref().unwrap_or("Commande introuvable ou erreur inconnue")
    );
    let text = service::generate_text(
        &resolved,
        &GenerateOpts {
            key: request.api_key.as_deref(),
            system: Some(&system),
            prompt: &user_prompt,
            temperature: request.temperature,
            custom_endpoint: request.custom_endpoint.as_deref(),
        },
    )
    .await?;

    let parsed: Value = serde_json::from_str(strip_fences(&text)).unwrap_or(Value::Null);
    Ok(AiDebugResponse {
        cause: str_field(&parsed, "cause").unwrap_or_default(),
        solution: str_field(&parsed, "solution").unwrap_or_default(),
        corrected_command: str_field(&parsed, "correctedCommand").unwrap_or_default(),
    })
}

#[tauri::command]
#[specta::specta]
pub async fn ai_test(request: AiTestRequest) -> Result<AiTestResponse, AppError> {
    let start = std::time::Instant::now();
    let resolved = resolve_model(request.model.as_deref());

    if resolved.provider_id == "custom"
        && request.custom_endpoint.as_deref().map(|s| s.trim().is_empty()).unwrap_or(true)
    {
        return Err(AppError::new(
            "ai_endpoint_missing",
            "Aucun endpoint personnalisé fourni (customEndpoint).",
        ));
    }

    let prompt_to_run = match request.sample_prompt.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty()) {
        Some(sample) => format!(
            "En tant qu'assistant Linux ({}), réponds brièvement en 1 phrase à: {}",
            resolved.display_name, sample
        ),
        None => "Réponds en un seul mot: \"OK\"".to_string(),
    };

    let text = service::generate_text(
        &resolved,
        &GenerateOpts {
            key: request.api_key.as_deref(),
            system: None,
            prompt: &prompt_to_run,
            temperature: None,
            custom_endpoint: request.custom_endpoint.as_deref(),
        },
    )
    .await?;

    let latency = start.elapsed().as_millis() as u64;
    Ok(AiTestResponse {
        status: "ok".to_string(),
        model: resolved.display_name.clone(),
        engine_model: resolved.engine_model.clone(),
        provider: resolved.provider_name.to_string(),
        provider_id: resolved.provider_id.to_string(),
        latency_ms: latency,
        message: format!(
            "Connexion réussie ! Modèle \"{}\" ({}) opérationnel ({}ms).",
            resolved.display_name, resolved.provider_name, latency
        ),
        sample_response: if text.trim().is_empty() { "OK".to_string() } else { text.trim().to_string() },
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strip_fences_removes_markdown_code_fences() {
        assert_eq!(strip_fences("```json\n{\"a\":1}\n```"), "{\"a\":1}");
        assert_eq!(strip_fences("plain text"), "plain text");
    }

    #[test]
    fn strip_fences_handles_short_input() {
        assert_eq!(strip_fences("```"), "");
    }
}
