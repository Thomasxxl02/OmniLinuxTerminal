use serde::{Deserialize, Serialize};

/// Mode d'authentification SSH.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum SshAuthType {
    /// Authentification par clé privée (Ed25519 / RSA).
    Key,
    /// Authentification par mot de passe.
    Password,
}

/// Statut de la clé d'hôte vérifiée (mode TOFU).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum HostKeyStatus {
    /// Clé d'hôte inconnue : enregistrée (Trust On First Use).
    New,
    /// Clé d'hôte déjà connue et identique : vérifiée.
    Verified,
    /// Clé d'hôte différente de celle enregistrée : à rejeter (risque MITM).
    Changed,
}

/// Configuration SSH complète transmise par le frontend.
///
/// Le mot de passe n'est **jamais** persisté ni retourné : il est utilisé pour
/// la connexion puis effacé. Le frontend en conserve une copie en mémoire en
/// attendant l'appel IPC, jamais sur disque.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SshConfig {
    pub host: String,
    #[specta(type = specta_typescript::Number)]
    pub port: u16,
    pub user: String,
    pub auth_type: SshAuthType,
    pub password: Option<String>,
    pub key_path: Option<String>,
    /// Intervalle de keep-alive SSH (secondes).
    #[specta(type = specta_typescript::Number)]
    pub keep_alive: u16,
    /// Spécification(s) de tunnel local `-L` (ex. `8080:localhost:80`).
    pub port_forwarding: Option<String>,
    /// Autoriser une clé d'hôte inconnue / différente (dégrade la sécurité TOFU).
    #[serde(default)]
    pub allow_unknown_host_key: bool,
}

/// Résultat de connection / test SSH.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SshConnectionInfo {
    pub ok: bool,
    pub host: String,
    #[specta(type = specta_typescript::Number)]
    pub port: u16,
    pub user: String,
    pub auth_type: SshAuthType,
    /// Bannière du serveur (bannière SSH, avant l'auth).
    pub server_banner: Option<String>,
    /// Empreinte SHA-256 de la clé d'hôte (hex).
    pub host_key_fingerprint: Option<String>,
    /// Statut de la vérification de la clé d'hôte (TOFU).
    pub host_key_status: HostKeyStatus,
    pub message: String,
}

/// Profil SSH persisté (champs non sensibles uniquement).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SshProfile {
    pub id: String,
    pub name: String,
    pub host: String,
    #[specta(type = specta_typescript::Number)]
    pub port: u16,
    pub user: String,
    pub auth_type: SshAuthType,
    pub key_path: Option<String>,
    #[specta(type = specta_typescript::Number)]
    pub keep_alive: u16,
    pub port_forwarding: Option<String>,
    pub updated_at: String,
}
