use crate::models::AppError;
use crate::smtp::models::{SmtpConfig, SmtpProfile, SmtpSendResult, SmtpTestResult};
use crate::smtp::service as smtp;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub fn smtp_validate_config(config: SmtpConfig) -> Result<(), AppError> {
    smtp::validate(&config)
}

#[tauri::command]
#[specta::specta]
pub fn smtp_test_connection(
    manager: State<'_, smtp::SmtpManager>,
    config: SmtpConfig,
) -> Result<SmtpTestResult, AppError> {
    manager.test_connection(&config)
}

#[tauri::command]
#[specta::specta]
pub fn smtp_send_test(
    manager: State<'_, smtp::SmtpManager>,
    config: SmtpConfig,
) -> Result<SmtpSendResult, AppError> {
    manager.send_test(&config)
}

#[tauri::command]
#[specta::specta]
pub fn smtp_list_profiles(manager: State<'_, smtp::SmtpManager>) -> Result<Vec<SmtpProfile>, AppError> {
    manager.list_profiles()
}

#[tauri::command]
#[specta::specta]
pub fn smtp_save_profile(
    manager: State<'_, smtp::SmtpManager>,
    profile: SmtpProfile,
) -> Result<SmtpProfile, AppError> {
    manager.save_profile(profile)
}

#[tauri::command]
#[specta::specta]
pub fn smtp_delete_profile(manager: State<'_, smtp::SmtpManager>, id: String) -> Result<(), AppError> {
    manager.delete_profile(&id)
}
