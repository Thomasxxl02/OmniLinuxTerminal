use crate::models::AppError;
use crate::smtp::models::{SmtpConfig, SmtpProfile, SmtpSendResult, SmtpTestResult};
use crate::smtp::service as smtp;
use std::sync::Arc;
use std::time::Duration;
use tauri::State;

/// Délai maximal pour une opération SMTP (test/envoi).
const SMTP_OP_TIMEOUT: Duration = Duration::from_secs(20);

#[tauri::command]
#[specta::specta]
pub fn smtp_validate_config(config: SmtpConfig) -> Result<(), AppError> {
    smtp::validate(&config)
}

#[tauri::command]
#[specta::specta]
pub async fn smtp_test_connection(
    manager: State<'_, Arc<smtp::SmtpManager>>,
    config: SmtpConfig,
) -> Result<SmtpTestResult, AppError> {
    let mgr = manager.inner().clone();
    let _permit = mgr
        .slots()
        .acquire_owned()
        .await
        .map_err(|_| AppError::new("smtp_busy", "Trop d'opérations SMTP simultanées"))?;
    // lettre est bloquant : on le déporte sur un thread dédié (pas de blocage de l'UI).
    let handle = tokio::task::spawn_blocking(move || mgr.test_connection(&config));
    tokio::time::timeout(SMTP_OP_TIMEOUT, handle)
        .await
        .map_err(|_| AppError::new("smtp_timeout", "Test SMTP : délai dépassé (20s)"))?
        .map_err(|e| AppError::new("smtp_task", format!("Tâche SMTP interrompue : {e}")))?
}

#[tauri::command]
#[specta::specta]
pub async fn smtp_send_test(
    manager: State<'_, Arc<smtp::SmtpManager>>,
    config: SmtpConfig,
) -> Result<SmtpSendResult, AppError> {
    let mgr = manager.inner().clone();
    let _permit = mgr
        .slots()
        .acquire_owned()
        .await
        .map_err(|_| AppError::new("smtp_busy", "Trop d'opérations SMTP simultanées"))?;
    let handle = tokio::task::spawn_blocking(move || mgr.send_test(&config));
    tokio::time::timeout(SMTP_OP_TIMEOUT, handle)
        .await
        .map_err(|_| AppError::new("smtp_timeout", "Envoi SMTP : délai dépassé (20s)"))?
        .map_err(|e| AppError::new("smtp_task", format!("Tâche SMTP interrompue : {e}")))?
}

#[tauri::command]
#[specta::specta]
pub fn smtp_list_profiles(manager: State<'_, Arc<smtp::SmtpManager>>) -> Result<Vec<SmtpProfile>, AppError> {
    manager.list_profiles()
}

#[tauri::command]
#[specta::specta]
pub fn smtp_save_profile(
    manager: State<'_, Arc<smtp::SmtpManager>>,
    profile: SmtpProfile,
) -> Result<SmtpProfile, AppError> {
    manager.save_profile(profile)
}

#[tauri::command]
#[specta::specta]
pub fn smtp_delete_profile(manager: State<'_, Arc<smtp::SmtpManager>>, id: String) -> Result<(), AppError> {
    manager.delete_profile(&id)
}
