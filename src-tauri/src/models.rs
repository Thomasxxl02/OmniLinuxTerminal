use serde::{Deserialize, Serialize};

/// Type de nœud dans le système de fichiers virtuel POSIX
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum NodeType {
    File,
    Dir,
}

/// Nœud de fichier POSIX dans le VFS Rust
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: NodeType,
    pub path: String,
    pub parent_id: Option<String>,
    pub content: Option<String>,
    #[specta(type = specta_typescript::Number)]
    pub size: u64,
    pub permissions: String,
    pub owner: String,
    pub group: String,
    pub updated_at: String,
}

/// Distribution Linux supportée
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
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
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CommandExecutionResult {
    pub text: Option<String>,
    pub new_cwd: Option<String>,
    pub clear: bool,
    pub exit_code: i32,
    pub active_app: Option<String>,
    pub installed_package: Option<String>,
    pub switched_distro: Option<String>,
	#[specta(type = specta_typescript::Number)]
    pub execution_time_ms: u64,
}

/// Requête de complétion / génération IA
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiGenerateRequest {
    pub prompt: String,
    pub distro: Option<String>,
    pub current_dir: Option<String>,
    pub model: Option<String>,
    pub api_key: Option<String>,
    pub temperature: Option<f32>,
    pub persona: Option<String>,
    pub custom_endpoint: Option<String>,
}

/// Réponse structurée de génération IA
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiGenerateResponse {
    pub command: String,
    pub explanation: String,
    pub tips: Option<String>,
    pub warnings: Option<String>,
}

/// Test de configuration IA (clé + modèle)
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiTestRequest {
    pub model: Option<String>,
    pub api_key: Option<String>,
    pub sample_prompt: Option<String>,
    pub custom_endpoint: Option<String>,
}

/// Résultat du test de configuration IA
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiTestResponse {
    pub status: String,
    pub model: String,
    pub engine_model: String,
    pub provider: String,
    pub provider_id: String,
    pub latency_ms: u64,
    pub message: String,
    pub sample_response: String,
}

/// Requête d'explication de commande
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiExplainRequest {
    pub command: String,
    pub distro: Option<String>,
    pub model: Option<String>,
    pub api_key: Option<String>,
    pub temperature: Option<f32>,
    pub persona: Option<String>,
    pub custom_endpoint: Option<String>,
}

/// Élément de breakdown d'une commande expliquée
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiBreakdownItem {
    pub part: String,
    pub description: String,
}

/// Réponse d'explication de commande
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiExplainResponse {
    pub summary: String,
    pub breakdown: Vec<AiBreakdownItem>,
    pub safety: String,
    pub example: String,
}

/// Requête de débogage d'erreur
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiDebugRequest {
    pub command: String,
    pub error_output: Option<String>,
    pub distro: Option<String>,
    pub model: Option<String>,
    pub api_key: Option<String>,
    pub temperature: Option<f32>,
    pub custom_endpoint: Option<String>,
}

/// Réponse de débogage d'erreur
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AiDebugResponse {
    pub cause: String,
    pub solution: String,
    pub corrected_command: String,
}

/// Statistiques système et télémétrie
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SystemTelemetry {
    pub cpu_usage_percent: f32,
	#[specta(type = specta_typescript::Number)]
    pub memory_used_mb: u64,
	#[specta(type = specta_typescript::Number)]
    pub memory_total_mb: u64,
	#[specta(type = specta_typescript::Number)]
    pub disk_used_mb: u64,
	#[specta(type = specta_typescript::Number)]
    pub disk_total_mb: u64,
	#[specta(type = specta_typescript::Number)]
    pub uptime_seconds: u64,
	#[specta(type = specta_typescript::Number)]
    pub active_processes_count: usize,
    pub distro_id: String,
}

/// Processus virtuel pour le moniteur htop / ps
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProcessItem {
    pub pid: u32,
    pub user: String,
    pub cpu: f32,
    pub mem: f32,
    pub command: String,
    pub status: String,
}

/// Erreur applicative commune exposée par toutes les commandes Tauri.
/// Permet un typage des erreurs côté frontend et une génération specta.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl AppError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
            details: None,
        }
    }

    pub fn with_details(code: &str, message: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
            details: Some(details.into()),
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new("not_found", message)
    }
    pub fn invalid(message: impl Into<String>) -> Self {
        Self::new("invalid", message)
    }
    pub fn not_implemented() -> Self {
        Self::new("not_implemented", "Commande définie mais non implémentée (phase ultérieure)")
    }
}

/// Conversion aisée des erreurs `String` du VFS/moteur vers `AppError`.
impl From<String> for AppError {
    fn from(value: String) -> Self {
        Self::new("io", value)
    }
}

/// Information d'architecture Tauri v2
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TauriBackendInfo {
    pub tauri_version: String,
    pub rustc_version: String,
    pub os_family: String,
    pub arch: String,
    pub ipc_status: String,
	#[specta(type = specta_typescript::Number)]
    pub virtual_fs_nodes: usize,
	#[specta(type = specta_typescript::Number)]
    pub supported_distros: usize,
}

// ===========================================================================
// Contrat IPC stable (Phase 2 / 6) — nouvelle source de vérité pour le frontend
// ===========================================================================

/// Résultat unifié d'exécution d'une commande (remplace CommandExecutionResult).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub cwd: String,
    pub effects: Vec<TerminalEffect>,
}

/// Effet que Rust demande au frontend d'exécuter. La décision vient de Rust,
/// React ne fait que le rendu (ouvrir un éditeur, effacer l'écran, lancer une app...).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum TerminalEffect {
    OpenEditor {
        editor: String,
        path: String,
        content: Option<String>,
        is_new_file: bool,
    },
    ClearScreen,
    LaunchApp {
        app: String,
    },
    SetCwd {
        cwd: String,
    },
    Print {
        text: String,
    },
    InstallPackage {
        package: String,
    },
    SwitchDistro {
        distro_id: String,
    },
}

/// Niveau de risque d'une commande (Phase 6 — module security).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum RiskLevel {
    Safe,
    Caution,
    Dangerous,
    Blocked,
}

/// Évaluation de sécurité structurée d'une commande (Phase 6).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SafetyAssessment {
    pub level: RiskLevel,
    pub reasons: Vec<String>,
    pub requires_confirmation: bool,
}
