use crate::models::AppError;
use crate::ssh::models::HostKeyStatus;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Registre TOFU (Trust On First Use) des clés d'hôte SSH.
///
/// À la première connexion à un hôte, on **enregistre** l'empreinte de sa clé
/// d'hôte. Aux connexions suivantes, on **compare** ; si la clé diffère, c'est
/// un signal d'attaque de l'homme du milieu → on rejette (sauf override
/// `allow_unknown_host_key`). Les empreintes sont persistées dans un JSON sous
/// le répertoire de données de l'app (aucun secret impliqué).
pub struct KnownHostsStore {
    path: PathBuf,
    map: HashMap<String, String>,
}

/// Entrée persistée : `host:port` → empreinte SHA-256 hex.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoreFile {
    version: u32,
    entries: HashMap<String, String>,
}

impl KnownHostsStore {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            path: data_dir.join("ssh_known_hosts.json"),
            map: Self::load(&data_dir.join("ssh_known_hosts.json")),
        }
    }

    fn load(path: &Path) -> HashMap<String, String> {
        match std::fs::read_to_string(path) {
            Ok(s) if !s.trim().is_empty() => {
                serde_json::from_str::<StoreFile>(&s)
                    .map(|f| f.entries)
                    .unwrap_or_default()
            }
            _ => HashMap::new(),
        }
    }

    fn persist(&self) -> Result<(), AppError> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::new("known_hosts", format!("création répertoire : {e}")))?;
        }
        let file = StoreFile {
            version: 1,
            entries: self.map.clone(),
        };
        let json = serde_json::to_string_pretty(&file)
            .map_err(|e| AppError::new("known_hosts", format!("sérialisation : {e}")))?;
        std::fs::write(&self.path, json)
            .map_err(|e| AppError::new("known_hosts", format!("écriture : {e}")))
    }

    /// Vérifie l'empreinte de la clé d'hôte en mode TOFU.
    /// `New` → enregistre la clé et l'accepte ; `Verified` → identique ; `Changed` → différente.
    pub fn check(&mut self, host: &str, port: u16, fingerprint: &str) -> HostKeyStatus {
        let key = format!("{}:{}", host, port);
        match self.map.get(&key) {
            Some(existing) if existing == fingerprint => HostKeyStatus::Verified,
            Some(_) => HostKeyStatus::Changed,
            None => {
                self.map.insert(key, fingerprint.to_string());
                let _ = self.persist();
                HostKeyStatus::New
            }
        }
    }
}

/// Empreinte SHA-256 hex d'un blob de clé (utilisé pour le fingerprint stable TOFU).
pub fn sha256_hex(bytes: &[u8]) -> String {
    let mut h = Sha256::new();
    h.update(bytes);
    let out = h.finalize();
    out.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn store(dir: &std::path::Path) -> KnownHostsStore {
        KnownHostsStore::new(dir)
    }

    #[test]
    fn tofu_first_seen_is_new_then_verified() {
        let dir = std::env::temp_dir().join(format!("kh_{}", uuid::Uuid::new_v4()));
        let mut s = store(&dir);
        let fp = sha256_hex(b"some-host-key");
        assert_eq!(s.check("h", 22, &fp), HostKeyStatus::New);
        assert_eq!(s.check("h", 22, &fp), HostKeyStatus::Verified);
    }

    #[test]
    fn changed_key_is_detected() {
        let dir = std::env::temp_dir().join(format!("kh_{}", uuid::Uuid::new_v4()));
        let mut s = store(&dir);
        assert_eq!(s.check("h", 22, "aaa"), HostKeyStatus::New);
        assert_eq!(s.check("h", 22, "bbb"), HostKeyStatus::Changed);
    }

    #[test]
    fn pers_lists_roundtrip() {
        let dir = std::env::temp_dir().join(format!("kh_{}", uuid::Uuid::new_v4()));
        {
            let mut s = store(&dir);
            let _ = s.check("host", 22, "fp1");
        }
        let mut s2 = store(&dir);
        assert_eq!(s2.check("host", 22, "fp1"), HostKeyStatus::Verified);
    }
}
