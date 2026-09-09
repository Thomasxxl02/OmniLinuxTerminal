use crate::models::AppError;
use crate::ssh::manager::SshManager;
use crate::ssh::models::{SshConfig, SshConnectionInfo, SshProfile};
use crate::ssh::service;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub fn ssh_validate_config(config: SshConfig) -> Result<(), AppError> {
    service::validate(&config)
}

#[tauri::command]
#[specta::specta]
pub fn ssh_test_connection(config: SshConfig) -> Result<SshConnectionInfo, AppError> {
    service::test_connection(&config)
}

#[tauri::command]
#[specta::specta]
pub fn ssh_connect(
    manager: State<'_, SshManager>,
    config: SshConfig,
) -> Result<SshConnectionInfo, AppError> {
    manager.connect(&config)
}

#[tauri::command]
#[specta::specta]
pub fn ssh_disconnect(manager: State<'_, SshManager>) -> Result<(), AppError> {
    manager.disconnect()
}

#[tauri::command]
#[specta::specta]
pub fn ssh_is_connected(manager: State<'_, SshManager>) -> bool {
    manager.is_connected()
}

#[tauri::command]
#[specta::specta]
pub fn ssh_list_profiles(manager: State<'_, SshManager>) -> Result<Vec<SshProfile>, AppError> {
    manager.list_profiles()
}

#[tauri::command]
#[specta::specta]
pub fn ssh_save_profile(
    manager: State<'_, SshManager>,
    profile: SshProfile,
) -> Result<SshProfile, AppError> {
    manager.save_profile(profile)
}

#[tauri::command]
#[specta::specta]
pub fn ssh_delete_profile(manager: State<'_, SshManager>, id: String) -> Result<(), AppError> {
    manager.delete_profile(&id)
}
