pub mod ai;
pub mod distro;
pub mod fs;
pub mod models;
pub mod smtp;
pub mod ssh;
pub mod system;
pub mod terminal;

use ai::AiEngine;
use distro::{get_distro_by_id, get_supported_distros};
use fs::VirtualFileSystem;
use models::{
    AiGenerateRequest, AiGenerateResponse, AppError, CommandResult, DistroInfo, FileNode,
    ProcessItem, SystemTelemetry, TauriBackendInfo,
};
use std::sync::Mutex;
use system::SystemMonitor;
use tauri::{Manager, State};
use terminal::ShellExecutor;

pub struct AppState {
    pub vfs: VirtualFileSystem,
    pub executor: ShellExecutor,
}

// ==========================================
// CONTRAT IPC STABLE (Étape 1) — commandes typées
// Toutes les erreurs utilisent `AppError`.
// ==========================================

// ------------------ TERMINAL ------------------

#[tauri::command]
#[specta::specta]
fn terminal_execute(
    state: State<'_, Mutex<AppState>>,
    cmd: String,
    cwd: String,
    distro_id: String,
) -> CommandResult {
    let app_state = state.lock().unwrap();
    app_state.executor.execute(&cmd, &cwd, &distro_id, &[])
}

const TERMINAL_COMMANDS: &[&str] = &[
    "help", "man", "neofetch", "htop", "top", "ls", "cd", "pwd", "mkdir", "touch", "rm", "cp",
    "mv", "cat", "head", "tail", "grep", "tree", "nano", "vim", "vi", "clear", "whoami",
    "hostname", "uname", "date", "uptime", "cmatrix", "sl", "apt", "apt-get", "pacman", "dnf",
    "yum", "apk", "zypper", "distro", "tauri", "cargo", "rustc", "echo",
];

#[tauri::command]
#[specta::specta]
fn terminal_complete(input: String) -> Vec<String> {
    let q = input.to_lowercase();
    TERMINAL_COMMANDS
        .iter()
        .filter(|c| c.starts_with(&q))
        .map(|c| c.to_string())
        .collect()
}

#[tauri::command]
#[specta::specta]
fn terminal_supported_commands() -> Vec<String> {
    TERMINAL_COMMANDS.iter().map(|c| c.to_string()).collect()
}

#[tauri::command]
#[specta::specta]
fn terminal_help() -> String {
    let mut out = String::from("Commandes disponibles (OmniLinux Terminal) :\n\n");
    for c in TERMINAL_COMMANDS {
        out.push_str(&format!("  {c}\n"));
    }
    out.push_str(
        "\nAstuce : utilisez la touche Tab pour l'autocomplétion. Tapez 'distro' pour \
         changer de distribution.\n",
    );
    out
}

#[tauri::command]
#[specta::specta]
fn terminal_get_history() -> Vec<String> {
    Vec::new() // Phase 7 : persistance de l'historique des commandes
}

// ------------------ FICHIERS (VFS) ------------------

#[tauri::command]
#[specta::specta]
fn fs_read(state: State<'_, Mutex<AppState>>, path: String) -> Result<String, AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.read_file(&path).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_write(
    state: State<'_, Mutex<AppState>>,
    path: String,
    content: String,
    append: bool,
) -> Result<FileNode, AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.write_file(&path, &content, append).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_list(state: State<'_, Mutex<AppState>>, path: String) -> Vec<FileNode> {
    let app_state = state.lock().unwrap();
    app_state.vfs.list_dir(&path)
}

#[tauri::command]
#[specta::specta]
fn fs_create_dir(state: State<'_, Mutex<AppState>>, path: String) -> Result<FileNode, AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.create_dir(&path).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_remove(state: State<'_, Mutex<AppState>>, path: String, recursive: bool) -> Result<(), AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.remove_path(&path, recursive).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_copy(state: State<'_, Mutex<AppState>>, src: String, dst: String) -> Result<FileNode, AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.copy(&src, &dst).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_move(state: State<'_, Mutex<AppState>>, src: String, dst: String) -> Result<FileNode, AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.move_path(&src, &dst).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_search(state: State<'_, Mutex<AppState>>, query: String) -> Vec<String> {
    let app_state = state.lock().unwrap();
    app_state.vfs.search(&query)
}

#[tauri::command]
#[specta::specta]
fn fs_chmod(state: State<'_, Mutex<AppState>>, path: String, permissions: String) -> Result<FileNode, AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.chmod(&path, &permissions).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_reset(state: State<'_, Mutex<AppState>>) {
    let app_state = state.lock().unwrap();
    app_state.vfs.reset();
}

#[tauri::command]
#[specta::specta]
fn fs_export(state: State<'_, Mutex<AppState>>) -> Result<String, AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.export_json().map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_import(state: State<'_, Mutex<AppState>>, json: String) -> Result<(), AppError> {
    let app_state = state.lock().unwrap();
    app_state.vfs.import_json(&json).map_err(AppError::from)
}

#[tauri::command]
#[specta::specta]
fn fs_update_os_release(
    state: State<'_, Mutex<AppState>>,
    name: String,
    version: String,
) -> Result<FileNode, AppError> {
    let app_state = state.lock().unwrap();
    app_state
        .vfs
        .update_os_release(&name, &version)
        .map_err(AppError::from)
}

// ------------------ DISTRIBUTIONS ------------------

#[tauri::command]
#[specta::specta]
fn distro_list() -> Vec<DistroInfo> {
    get_supported_distros()
}

#[tauri::command]
#[specta::specta]
fn distro_get_current(state: State<'_, Mutex<AppState>>) -> String {
    let app_state = state.lock().unwrap();
    // Le VFS Rust ne stocke pas encore la distro active : défaut Ubuntu.
    let _ = &app_state;
    "ubuntu".to_string()
}

#[tauri::command]
#[specta::specta]
fn distro_switch(distro_id: String) -> Result<DistroInfo, AppError> {
    get_distro_by_id(&distro_id)
        .ok_or_else(|| AppError::not_found(format!("Distribution inconnue : {}", distro_id)))
}

// ------------------ SYSTÈME ------------------

#[tauri::command]
#[specta::specta]
fn system_get_telemetry(distro_id: String) -> SystemTelemetry {
    SystemMonitor::get_telemetry(&distro_id)
}

#[tauri::command]
#[specta::specta]
fn system_list_processes() -> Vec<ProcessItem> {
    SystemMonitor::list_processes()
}

#[tauri::command]
#[specta::specta]
fn tauri_get_backend_info(state: State<'_, Mutex<AppState>>) -> TauriBackendInfo {
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

// ------------------ IA ------------------

#[tauri::command]
#[specta::specta]
fn ai_generate(request: AiGenerateRequest) -> AiGenerateResponse {
    AiEngine::generate_fallback(&request)
}

#[tauri::command]
#[specta::specta]
fn ai_explain(_query: String) -> Result<String, AppError> {
    Err(AppError::not_implemented())
}

#[tauri::command]
#[specta::specta]
fn ai_debug(_query: String) -> Result<String, AppError> {
    Err(AppError::not_implemented())
}

#[tauri::command]
#[specta::specta]
fn ai_test() -> Result<(), AppError> {
    Err(AppError::not_implemented())
}

// ------------------ RÉGLAGES ------------------

#[tauri::command]
#[specta::specta]
fn settings_get() -> Result<String, AppError> {
    Err(AppError::not_implemented())
}

#[tauri::command]
#[specta::specta]
fn settings_update(_key: String, _value: String) -> Result<(), AppError> {
    Err(AppError::not_implemented())
}

// ------------------ SESSIONS ------------------

#[tauri::command]
#[specta::specta]
fn session_get() -> Result<String, AppError> {
    Err(AppError::not_implemented())
}

#[tauri::command]
#[specta::specta]
fn session_save(_data: String) -> Result<(), AppError> {
    Err(AppError::not_implemented())
}

#[tauri::command]
#[specta::specta]
fn session_export() -> Result<String, AppError> {
    Err(AppError::not_implemented())
}

#[tauri::command]
#[specta::specta]
fn session_import(_json: String) -> Result<(), AppError> {
    Err(AppError::not_implemented())
}

// ------------------ ALIAS (rétro-compat) ------------------

#[tauri::command]
#[specta::specta]
fn execute_shell_command(
    state: State<'_, Mutex<AppState>>,
    cmd: String,
    cwd: String,
    distro_id: String,
) -> CommandResult {
    let app_state = state.lock().unwrap();
    app_state.executor.execute(&cmd, &cwd, &distro_id, &[])
}

#[tauri::command]
#[specta::specta]
fn distro_list_all() -> Vec<DistroInfo> {
    get_supported_distros()
}

#[tauri::command]
#[specta::specta]
fn distro_get_info(distro_id: String) -> Option<DistroInfo> {
    get_distro_by_id(&distro_id)
}

#[tauri::command]
#[specta::specta]
fn ai_generate_command(request: AiGenerateRequest) -> AiGenerateResponse {
    AiEngine::generate_fallback(&request)
}

// ==========================================
// TAURI APPLICATION RUNNER
// ==========================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri_specta::Builder::new().commands(tauri_specta::collect_commands![
        terminal_execute,
        terminal_complete,
        terminal_supported_commands,
        terminal_help,
        terminal_get_history,
        fs_read,
        fs_write,
        fs_list,
        fs_create_dir,
        fs_remove,
        fs_copy,
        fs_move,
        fs_search,
        fs_chmod,
        fs_reset,
        fs_export,
        fs_import,
        fs_update_os_release,
        distro_list,
        distro_get_current,
        distro_switch,
        system_get_telemetry,
        system_list_processes,
        settings_get,
        settings_update,
        session_get,
        session_save,
        session_export,
        session_import,
        ai_generate,
        ai_explain,
        ai_debug,
        ai_test,
        execute_shell_command,
        distro_list_all,
        distro_get_info,
        ai_generate_command,
        tauri_get_backend_info,
        ssh::commands::ssh_validate_config,
        ssh::commands::ssh_test_connection,
        ssh::commands::ssh_connect,
        ssh::commands::ssh_session_write,
        ssh::commands::ssh_disconnect,
        ssh::commands::ssh_is_connected,
        ssh::commands::ssh_list_profiles,
        ssh::commands::ssh_save_profile,
        ssh::commands::ssh_delete_profile,
        smtp::commands::smtp_validate_config,
        smtp::commands::smtp_test_connection,
        smtp::commands::smtp_send_test,
        smtp::commands::smtp_list_profiles,
        smtp::commands::smtp_save_profile,
        smtp::commands::smtp_delete_profile,
    ]);

    // Export des types TypeScript via specta (debug uniquement).
    #[cfg(debug_assertions)]
    {
        let ts_path = format!("{}/../src/types/ipc.ts", env!("CARGO_MANIFEST_DIR"));
        builder
            .export(specta_typescript::Typescript::default(), &ts_path)
            .expect("échec de l'export des types specta");
    }

    tauri::Builder::default()
        .setup(|app| {
            // Répertoire de données de l'app : le VFS y est persisté (Phase 3).
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Impossible de résoudre le répertoire de données : {}", e))?;
            std::fs::create_dir_all(&data_dir)
                .map_err(|e| format!("Impossible de créer le répertoire de données : {}", e))?;
            let persist = data_dir.join("vfs.json");

            let vfs = VirtualFileSystem::new();
            vfs.set_persist_path(&persist.to_string_lossy());
            vfs.load_or_initialize(&persist.to_string_lossy());

            let executor = ShellExecutor::new(vfs.clone());
            app.manage(Mutex::new(AppState { vfs, executor }));
            app.manage(ssh::manager::SshManager::new(&data_dir));
            app.manage(smtp::service::SmtpManager::new(&data_dir));

            Ok(())
        })
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application Tauri v2");
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Vérifie que le typegen specta produit bien un bindings TypeScript valide.
    #[test]
    fn specta_exports_typescript() {
        let ts_path = std::env::temp_dir().join("omni_ipc_specta.ts");
        let builder = tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
            terminal_execute,
            fs_read,
            fs_write,
            distro_list,
            system_get_telemetry,
            ai_generate,
            tauri_get_backend_info,
        ]);
        builder
            .export(
                specta_typescript::Typescript::default(),
                ts_path.to_string_lossy().as_ref(),
            )
            .expect("échec de l'export specta");
        let content = std::fs::read_to_string(&ts_path).unwrap();
        eprintln!("SPECTA_TS_BYTES={}", content.len());
        assert!(content.contains("CommandResult"), "types manquants: CommandResult");
        assert!(content.contains("AppError"), "types manquants: AppError");
        assert!(content.contains("TerminalEffect"), "types manquants: TerminalEffect");
        assert!(content.contains("terminalExecute"), "commande manquante: terminalExecute (camelCase)");
        let _ = std::fs::remove_file(&ts_path);
    }
}
