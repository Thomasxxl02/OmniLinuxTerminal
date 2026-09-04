use serde::{Deserialize, Serialize};

/// Type de nœud dans le système de fichiers virtuel POSIX
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NodeType {
    File,
    Dir,
}

/// Nœud de fichier POSIX dans le VFS Rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: NodeType,
    pub path: String,
    pub parent_id: Option<String>,
    pub content: Option<String>,
    pub size: u64,
    pub permissions: String,
    pub owner: String,
    pub group: String,
    pub updated_at: String,
}

/// Distribution Linux supportée
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DistroInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub kernel: String,
    pub default_user: String,
    pub package_manager: String,
    pub color_theme: String,
    pub ascii_logo: String,
    pub description: String,
    pub default_packages: Vec<String>,
}

/// Résultat d'exécution d'une commande shell
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandExecutionResult {
    pub text: Option<String>,
    pub new_cwd: Option<String>,
    pub clear: bool,
    pub exit_code: i32,
    pub active_app: Option<String>,
    pub installed_package: Option<String>,
    pub switched_distro: Option<String>,
    pub execution_time_ms: u64,
}

/// Requête de complétion / génération IA
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiGenerateRequest {
    pub prompt: String,
    pub distro: Option<String>,
    pub current_dir: Option<String>,
    pub model: Option<String>,
    pub api_key: Option<String>,
    pub temperature: Option<f32>,
    pub persona: Option<String>,
}

/// Réponse structurée de génération IA
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiGenerateResponse {
    pub command: String,
    pub explanation: String,
    pub warnings: Option<String>,
}

/// Statistiques système et télémétrie
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemTelemetry {
    pub cpu_usage_percent: f32,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub disk_used_mb: u64,
    pub disk_total_mb: u64,
    pub uptime_seconds: u64,
    pub active_processes_count: usize,
    pub distro_id: String,
}

/// Processus virtuel pour le moniteur htop / ps
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessItem {
    pub pid: u32,
    pub user: String,
    pub cpu: f32,
    pub mem: f32,
    pub command: String,
    pub status: String,
}

/// Information d'architecture Tauri v2
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TauriBackendInfo {
    pub tauri_version: String,
    pub rustc_version: String,
    pub os_family: String,
    pub arch: String,
    pub ipc_status: String,
    pub virtual_fs_nodes: usize,
    pub supported_distros: usize,
}
