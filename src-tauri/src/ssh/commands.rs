use crate::models::AppError;
use crate::ssh::manager::SshManager;
use crate::ssh::models::{SshConfig, SshConnectionInfo, SshProfile};
use crate::ssh::service;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, State};

/// Délai maximal pour une connexion/opération SSH (handshake + ouverture canal).
const SSH_OP_TIMEOUT: Duration = Duration::from_secs(20);

#[tauri::command]
#[specta::specta]
pub fn ssh_validate_config(config: SshConfig) -> Result<(), AppError> {
    service::validate(&config)
}

#[tauri::command]
#[specta::specta]
pub async fn ssh_test_connection(
    manager: State<'_, Arc<SshManager>>,
    config: SshConfig,
) -> Result<SshConnectionInfo, AppError> {
    let mgr = manager.inner().clone();
    // Limite de connexions simultanées (semaphore), libérée en fin de fonction.
    let _permit = mgr
        .slots()
        .acquire_owned()
        .await
        .map_err(|_| AppError::new("ssh_busy", "Trop de connexions SSH simultanées"))?;
    // Le réseau ssh2 est bloquant : on le déporte sur un thread dédié (pas de blocage de l'UI).
    let handle = tokio::task::spawn_blocking(move || mgr.test_connection(&config));
    tokio::time::timeout(SSH_OP_TIMEOUT, handle)
        .await
        .map_err(|_| AppError::new("ssh_timeout", "Connexion SSH : délai dépassé (20s)"))?
        .map_err(|e| AppError::new("ssh_task", format!("Tâche SSH interrompue : {e}")))?
}

#[tauri::command]
#[specta::specta]
pub async fn ssh_connect(
    app: AppHandle,
    manager: State<'_, Arc<SshManager>>,
    config: SshConfig,
) -> Result<SshConnectionInfo, AppError> {
    let mgr = manager.inner().clone();
    let _permit = mgr
        .slots()
        .acquire_owned()
        .await
        .map_err(|_| AppError::new("ssh_busy", "Trop de connexions SSH simultanées"))?;
    let handle = tokio::task::spawn_blocking(move || mgr.connect(&config, app));
    tokio::time::timeout(SSH_OP_TIMEOUT, handle)
        .await
        .map_err(|_| AppError::new("ssh_timeout", "Connexion SSH : délai dépassé (20s)"))?
        .map_err(|e| AppError::new("ssh_task", format!("Tâche SSH interrompue : {e}")))?
}

#[tauri::command]
#[specta::specta]
pub fn ssh_session_write(
    manager: State<'_, Arc<SshManager>>,
    data: Vec<u8>,
) -> Result<(), AppError> {
    manager.session_write(data)
}

#[tauri::command]
#[specta::specta]
pub fn ssh_disconnect(manager: State<'_, Arc<SshManager>>) -> Result<(), AppError> {
    manager.disconnect()
}

#[tauri::command]
#[specta::specta]
pub fn ssh_is_connected(manager: State<'_, Arc<SshManager>>) -> bool {
    manager.is_connected()
}

#[tauri::command]
#[specta::specta]
pub fn ssh_list_profiles(manager: State<'_, Arc<SshManager>>) -> Result<Vec<SshProfile>, AppError> {
    manager.list_profiles()
}

#[tauri::command]
#[specta::specta]
pub fn ssh_save_profile(
    manager: State<'_, Arc<SshManager>>,
    profile: SshProfile,
) -> Result<SshProfile, AppError> {
    manager.save_profile(profile)
}

#[tauri::command]
#[specta::specta]
pub fn ssh_delete_profile(manager: State<'_, Arc<SshManager>>, id: String) -> Result<(), AppError> {
    manager.delete_profile(&id)
}
