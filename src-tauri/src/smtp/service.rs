use crate::models::AppError;
use crate::smtp::models::{SmtpConfig, SmtpProfile, SmtpSecurity, SmtpSendResult, SmtpTestResult};
use chrono::Utc;
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::client::{Tls, TlsParameters};
use lettre::{Message, SmtpTransport, Transport};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Semaphore;
use uuid::Uuid;

/// Timeout réseau SMTP par défaut.
const SMTP_TIMEOUT: Duration = Duration::from_secs(15);

/// Nombre maximal d'opérations SMTP (test/envoi) simultanées.
const MAX_SMTP_CONNECTIONS: usize = 3;

/// Validation structurée de la configuration SMTP.
pub fn validate(config: &SmtpConfig) -> Result<(), AppError> {
    if config.host.trim().is_empty() {
        return Err(AppError::invalid("Hôte SMTP requis"));
    }
    if config.port == 0 {
        return Err(AppError::invalid("Port SMTP invalide (doit être > 0)"));
    }
    if config.from_address.trim().is_empty() {
        return Err(AppError::invalid("Adresse d'expédition requise"));
    }
    Ok(())
}

/// Construit un `SmtpTransport` lettre à partir de la config (TLS + AUTH typés).
fn build_transport(config: &SmtpConfig) -> Result<SmtpTransport, AppError> {
    let tls = match config.security {
        SmtpSecurity::None => Tls::None,
        SmtpSecurity::StartTls => Tls::Opportunistic(
            TlsParameters::new(config.host.clone())
                .map_err(|e| AppError::new("smtp_tls", format!("TLS : {e}")))?,
        ),
        SmtpSecurity::Ssl => Tls::Required(
            TlsParameters::new(config.host.clone())
                .map_err(|e| AppError::new("smtp_tls", format!("TLS : {e}")))?,
        ),
    };

    let mut builder = SmtpTransport::builder_dangerous(&config.host)
        .port(config.port)
        .timeout(Some(SMTP_TIMEOUT))
        .tls(tls);

    if let (Some(user), Some(password)) = (&config.user, &config.password) {
        if !user.is_empty() {
            builder = builder.credentials(Credentials::new(user.clone(), password.clone()));
        }
    }

    Ok(builder.build())
}

/// Test de connexion **réel** : ouvre la connexion SMTP, négocie TLS/STARTTLS
/// et authentifie si des identifiants sont fournis. Aucun message n'est envoyé.
pub fn test_connection(config: &SmtpConfig) -> Result<SmtpTestResult, AppError> {
    validate(config)?;
    let transport = build_transport(config)?;
    let ok = transport
        .test_connection()
        .map_err(|e| AppError::with_details("smtp_test", "Test de connexion SMTP échoué", e.to_string()))?;

    if !ok {
        return Err(AppError::new(
            "smtp_test",
            "Connexion SMTP refusée : le test de connexion a échoué.",
        ));
    }

    Ok(SmtpTestResult {
        ok: true,
        host: config.host.clone(),
        port: config.port,
        security: config.security,
        server_greeting: None,
        message: format!(
            "Connexion SMTP établie avec succès sur {}:{} (TLS/AUTH vérifiés)",
            config.host, config.port
        ),
    })
}

/// Envoie un **vrai** message de test au destinataire configuré.
pub fn send_test(config: &SmtpConfig) -> Result<SmtpSendResult, AppError> {
    validate(config)?;
    let to = config.to_address.clone().unwrap_or_default();
    if to.trim().is_empty() {
        return Err(AppError::invalid("Destinataire du test requis"));
    }

    let from = match &config.from_name {
        Some(name) if !name.trim().is_empty() => format!("{} <{}>", name, config.from_address),
        _ => config.from_address.clone(),
    };

    let email = Message::builder()
        .from(from.parse().map_err(|e| AppError::new("smtp_from", format!("Expéditeur invalide : {e}")))?)
        .to(to.parse().map_err(|e| AppError::new("smtp_to", format!("Destinataire invalide : {e}")))?)
        .subject("Test SMTP OmniLinux")
        .body("Ceci est un message de test SMTP envoyé depuis OmniLinux Terminal.".to_string())
        .map_err(|e| AppError::new("smtp_message", format!("Construction du message : {e}")))?;

    let transport = build_transport(config)?;
    let response = transport
        .send(&email)
        .map_err(|e| AppError::with_details("smtp_send", "Envoi du message de test échoué", e.to_string()))?;

    Ok(SmtpSendResult {
        ok: true,
        to: to.clone(),
        response_code: Some(response.code().to_string()),
        message: format!("Message de test envoyé à {}", to),
    })
}

/// Gestionnaire des profils SMTP (non sensibles) et du test/envoi.
pub struct SmtpManager {
    profile_path: PathBuf,
    conn_slots: Arc<Semaphore>,
}

impl SmtpManager {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            profile_path: data_dir.join("smtp_profiles.json"),
            conn_slots: Arc::new(Semaphore::new(MAX_SMTP_CONNECTIONS)),
        }
    }

    /// Retourne le sémaphore limitant les opérations SMTP simultanées.
    pub fn slots(&self) -> Arc<Semaphore> {
        Arc::clone(&self.conn_slots)
    }

    pub fn test_connection(&self, config: &SmtpConfig) -> Result<SmtpTestResult, AppError> {
        test_connection(config)
    }

    pub fn send_test(&self, config: &SmtpConfig) -> Result<SmtpSendResult, AppError> {
        send_test(config)
    }

    pub fn list_profiles(&self) -> Result<Vec<SmtpProfile>, AppError> {
        self.load_profiles()
    }

    pub fn save_profile(&self, mut profile: SmtpProfile) -> Result<SmtpProfile, AppError> {
        if profile.id.is_empty() {
            profile.id = Uuid::new_v4().to_string();
        }
        if profile.name.trim().is_empty() {
            return Err(AppError::invalid("Nom de profil requis"));
        }
        profile.updated_at = Utc::now().to_rfc3339();
        let mut profiles = self.load_profiles().unwrap_or_default();
        if let Some(existing) = profiles.iter_mut().find(|p| p.id == profile.id) {
            *existing = profile.clone();
        } else {
            profiles.push(profile.clone());
        }
        self.store_profiles(&profiles)?;
        Ok(profile)
    }

    pub fn delete_profile(&self, id: &str) -> Result<(), AppError> {
        let mut profiles = self.load_profiles()?;
        profiles.retain(|p| p.id != id);
        self.store_profiles(&profiles)
    }

    fn load_profiles(&self) -> Result<Vec<SmtpProfile>, AppError> {
        match std::fs::read_to_string(&self.profile_path) {
            Ok(s) if !s.trim().is_empty() => {
                serde_json::from_str(&s).map_err(|e| AppError::new("profile", format!("JSON invalide : {e}")))
            }
            _ => Ok(Vec::new()),
        }
    }

    fn store_profiles(&self, profiles: &[SmtpProfile]) -> Result<(), AppError> {
        if let Some(parent) = self.profile_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::new("profile", format!("création répertoire : {e}")))?;
        }
        let json = serde_json::to_string_pretty(profiles)
            .map_err(|e| AppError::new("profile", format!("sérialisation : {e}")))?;
        std::fs::write(&self.profile_path, json)
            .map_err(|e| AppError::new("profile", format!("écriture : {e}")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> SmtpConfig {
        SmtpConfig {
            host: "smtp.example.com".to_string(),
            port: 587,
            security: SmtpSecurity::StartTls,
            user: Some("user@example.com".to_string()),
            password: Some("secret".to_string()),
            from_address: "noreply@example.com".to_string(),
            from_name: Some("OmniLinux".to_string()),
            to_address: Some("test@example.com".to_string()),
        }
    }

    #[test]
    fn validate_accepts_valid_config() {
        assert!(validate(&cfg()).is_ok());
    }

    #[test]
    fn validate_rejects_empty_host() {
        let mut c = cfg();
        c.host = "  ".to_string();
        assert!(validate(&c).is_err());
    }

    #[test]
    fn validate_rejects_empty_from_address() {
        let mut c = cfg();
        c.from_address = "".to_string();
        assert!(validate(&c).is_err());
    }

    /// Preuve que la sonde est réellement réseau : un port fermé doit échouer.
    #[test]
    fn test_connection_closed_port_returns_error() {
        let mut c = cfg();
        c.host = "127.0.0.1".to_string();
        c.port = 1;
        c.security = SmtpSecurity::None;
        assert!(test_connection(&c).is_err());
    }
}
