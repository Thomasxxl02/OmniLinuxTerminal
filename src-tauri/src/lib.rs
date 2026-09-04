pub mod ai;
pub mod distro;
pub mod fs;
pub mod models;
pub mod system;
pub mod terminal;

use ai::AiEngine;
use distro::{get_distro_by_id, get_supported_distros};
use fs::VirtualFileSystem;
use models::{
    AiGenerateRequest, AiGenerateResponse, CommandExecutionResult, DistroInfo, FileNode,
    ProcessItem, SystemTelemetry, TauriBackendInfo,
};
use std::sync::Mutex;
use system::SystemMonitor;
use tauri::State;
use terminal::ShellExecutor;

pub struct AppState {
    pub vfs: VirtualFileSystem,
    pub executor: ShellExecutor,
}

// ==========================================
// TAURI V2 COMMANDS
// ==========================================

#[tauri::command]
pub fn execute_shell_command(
    state: State<'_, Mutex<AppState>>,
    cmd: String,
    cwd: String,
    distro_id: String,
) -> CommandExecutionResult {
    let app_state = state.lock().unwrap();
    app_state.executor.execute(&cmd, &cwd, &distro_id, &[])
}

#[tauri::command]
pub fn fs_read_file(
    state: State<'_, Mutex<AppState>>,
    path: String,
) -> Result<String, String> {
    let app_state = state.lock().unwrap();
    app_state.vfs.read_file(&path)
}

#[tauri::command]
pub fn fs_write_file(
    state: State<'_, Mutex<AppState>>,
    path: String,
    content: String,
    append: bool,
) -> Result<FileNode, String> {
    let app_state = state.lock().unwrap();
    app_state.vfs.write_file(&path, &content, append)
}

#[tauri::command]
pub fn fs_list_dir(
    state: State<'_, Mutex<AppState>>,
    path: String,
) -> Vec<FileNode> {
    let app_state = state.lock().unwrap();
    app_state.vfs.list_dir(&path)
}

#[tauri::command]
pub fn fs_create_dir(
    state: State<'_, Mutex<AppState>>,
    path: String,
) -> Result<FileNode, String> {
    let app_state = state.lock().unwrap();
    app_state.vfs.create_dir(&path)
}

#[tauri::command]
pub fn fs_remove_path(
    state: State<'_, Mutex<AppState>>,
    path: String,
    recursive: bool,
) -> Result<(), String> {
    let app_state = state.lock().unwrap();
    app_state.vfs.remove_path(&path, recursive)
}

#[tauri::command]
pub fn distro_list_all() -> Vec<DistroInfo> {
    get_supported_distros()
}

#[tauri::command]
pub fn distro_get_info(distro_id: String) -> Option<DistroInfo> {
    get_distro_by_id(&distro_id)
}

#[tauri::command]
pub fn ai_generate_command(request: AiGenerateRequest) -> AiGenerateResponse {
    AiEngine::generate_fallback(&request)
}

#[tauri::command]
pub fn system_get_telemetry(distro_id: String) -> SystemTelemetry {
    SystemMonitor::get_telemetry(&distro_id)
}

#[tauri::command]
pub fn system_list_processes() -> Vec<ProcessItem> {
    SystemMonitor::list_processes()
}

#[tauri::command]
pub fn tauri_get_backend_info(state: State<'_, Mutex<AppState>>) -> TauriBackendInfo {
    let app_state = state.lock().unwrap();
    TauriBackendInfo {
        tauri_version: "2.0.0".to_string(),
        rustc_version: "1.85.0".to_string(),
        os_family: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        ipc_status: "Active (Bidirectional Channel)".to_string(),
        virtual_fs_nodes: app_state.vfs.total_nodes(),
        supported_distros: get_supported_distros().len(),
    }
}

// ==========================================
// TAURI APPLICATION RUNNER
// ==========================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let vfs = VirtualFileSystem::new();
    let executor = ShellExecutor::new(vfs.clone());
    let state = AppState { vfs, executor };

    tauri::Builder::default()
        .manage(Mutex::new(state))
        .invoke_handler(tauri::generate_handler![
            execute_shell_command,
            fs_read_file,
            fs_write_file,
            fs_list_dir,
            fs_create_dir,
            fs_remove_path,
            distro_list_all,
            distro_get_info,
            ai_generate_command,
            system_get_telemetry,
            system_list_processes,
            tauri_get_backend_info,
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application Tauri v2");
}
