use crate::models::AppError;
use crate::ssh::models::{SshConfig, SshConnectionInfo, SshProfile};
use crate::ssh::service;
use chrono::Utc;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use uuid::Uuid;

/// Gestionnaire des connexions SSH persistantes + profils.
///
/// La session SSH authentifiée est conservée ouverte tant que la connexion est
/// active. Les secrets (mot de passe) ne transitent que par la config transmise
/// à `connect`/`test`, sont utilisés une fois puis abandonnés : ils ne sont
/// **jamais** écrits sur disque ni renvoyés au frontend.
pub struct SshManager {
    profile_path: PathBuf,
    session: Mutex<Option<ssh2::Session>>,
}

impl SshManager {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            profile_path: data_dir.join("ssh_profiles.json"),
            session: Mutex::new(None),
        }
    }

    /// Établit une connexion SSH **réelle** (TCP + handshake + auth), configure
    /// le keep-alive et conserve la session ouverte. Retourne la bannière.
    pub fn connect(&self, config: &SshConfig) -> Result<SshConnectionInfo, AppError> {
        let (session, banner) = service::establish(config)?;
        // Configure le keep-alive SSH (envoyé par libssh2 pendant les opérations).
        let interval = config.keep_alive.max(15) as u32;
        session.set_keepalive(true, interval);

        // Remplace toute session précédente (ferme l'ancienne socket).
        *self.session.lock().unwrap() = Some(session);

        Ok(SshConnectionInfo {
            ok: true,
            host: config.host.clone(),
            port: config.port,
            user: config.user.clone(),
            auth_type: config.auth_type,
            server_banner: banner,
            message: format!(
                "Connexion SSH établie avec succès sur {}:{}",
                config.host, config.port
            ),
        })
    }

    /// Ferme la session SSH active (libère la socket).
    pub fn disconnect(&self) -> Result<(), AppError> {
        *self.session.lock().unwrap() = None;
        Ok(())
    }

    pub fn is_connected(&self) -> bool {
        self.session.lock().unwrap().is_some()
    }

    // ---------------- profils (non sensibles) ----------------

    pub fn list_profiles(&self) -> Result<Vec<SshProfile>, AppError> {
        self.load_profiles()
    }

    pub fn save_profile(&self, mut profile: SshProfile) -> Result<SshProfile, AppError> {
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

    fn load_profiles(&self) -> Result<Vec<SshProfile>, AppError> {
        match std::fs::read_to_string(&self.profile_path) {
            Ok(s) if !s.trim().is_empty() => serde_json::from_str(&s)
                .map_err(|e| AppError::new("profile", format!("JSON invalide : {e}"))),
            _ => Ok(Vec::new()),
        }
    }

    fn store_profiles(&self, profiles: &[SshProfile]) -> Result<(), AppError> {
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
