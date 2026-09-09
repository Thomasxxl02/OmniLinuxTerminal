use serde::{Deserialize, Serialize};

/// Sécurité de transport SMTP.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum SmtpSecurity {
    None,
    StartTls,
    Ssl,
}

/// Configuration SMTP transmise par le frontend.
///
/// Le mot de passe est utilisé une seule fois puis abandonné : jamais persisté,
/// jamais renvoyé au frontend.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SmtpConfig {
    pub host: String,
    #[specta(type = specta_typescript::Number)]
    pub port: u16,
    pub security: SmtpSecurity,
    pub user: Option<String>,
    pub password: Option<String>,
    /// Adresse d'expédition (from).
    pub from_address: String,
    /// Nom d'affichage de l'expéditeur.
    pub from_name: Option<String>,
    /// Destinataire du message de test (requis pour `smtp_send_test`).
    pub to_address: Option<String>,
}

/// Résultat d'un test de connexion SMTP (sonde réelle, aucun message envoyé).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SmtpTestResult {
    pub ok: bool,
    pub host: String,
    #[specta(type = specta_typescript::Number)]
    pub port: u16,
    pub security: SmtpSecurity,
    /// Réponse d'accueil du serveur (greeting).
    pub server_greeting: Option<String>,
    pub message: String,
}

/// Résultat de l'envoi d'un message de test réel.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SmtpSendResult {
    pub ok: bool,
    pub to: String,
    /// Code de réponse SMTP (ex. 250).
    pub response_code: Option<String>,
    pub message: String,
}

/// Profil SMTP persisté (champs non sensibles uniquement).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SmtpProfile {
    pub id: String,
    pub name: String,
    pub host: String,
    #[specta(type = specta_typescript::Number)]
    pub port: u16,
    pub security: SmtpSecurity,
    pub user: Option<String>,
    pub from_address: String,
    pub from_name: Option<String>,
    pub updated_at: String,
}
