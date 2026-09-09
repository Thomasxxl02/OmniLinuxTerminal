// ===========================================================================
// Historique des commandes (Priorité 4).
// Persisté en JSONL (une entrée JSON par ligne) sous `app_data_dir/history.jsonl`.
// Léger, sans dépendance lourde, et cohérent avec la réduction des dépendances :
// les entrées sont ajoutées en append (non destructif) et lues en ordre
// anté-chronologique (limité).
// ===========================================================================

use crate::models::AppError;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;

/// Nombre maximum d'entrées d'historique lues par défaut.
const DEFAULT_LIMIT: usize = 200;

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub ts: String,
    pub distro: String,
    pub cwd: String,
    pub cmd: String,
    pub exit_code: i32,
}

/// Store d'historique de commandes (JSONL, une entrée JSON par ligne).
pub struct HistoryStore {
    path: PathBuf,
}

impl HistoryStore {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            path: data_dir.join("history.jsonl"),
        }
    }

    /// Ajoute une entrée à l'historique (append non destructif). L'horodatage
    /// est posé côté Rust (source de vérité).
    pub fn add(&self, cmd: &str, distro: &str, cwd: &str, exit_code: i32) -> Result<(), AppError> {
        let entry = HistoryEntry {
            ts: Utc::now().to_rfc3339(),
            distro: distro.to_string(),
            cwd: cwd.to_string(),
            cmd: cmd.to_string(),
            exit_code,
        };
        self.append(&entry)
    }

    fn append(&self, entry: &HistoryEntry) -> Result<(), AppError> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::new("history_io", format!("création répertoire : {e}")))?;
        }
        let line = serde_json::to_string(entry)
            .map_err(|e| AppError::new("history_io", format!("sérialisation : {e}")))?;
        let mut f = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)
            .map_err(|e| AppError::new("history_io", format!("ouverture : {e}")))?;
        writeln!(f, "{line}").map_err(|e| AppError::new("history_io", format!("écriture : {e}")))?;
        Ok(())
    }

    /// Lit les entrées les plus récentes (ordre anté-chronologique), limité à
    /// `limit` (200 par défaut). Ignore les lignes malformées (résilience).
    pub fn list(&self, limit: usize) -> Vec<HistoryEntry> {
        let limit = if limit == 0 { DEFAULT_LIMIT } else { limit };
        let s = std::fs::read_to_string(&self.path).unwrap_or_default();
        let mut out = Vec::new();
        for line in s.lines().rev() {
            if let Ok(e) = serde_json::from_str::<HistoryEntry>(line) {
                out.push(e);
                if out.len() >= limit {
                    break;
                }
            }
        }
        out
    }

    /// Efface entièrement l'historique.
    pub fn clear(&self) -> Result<(), AppError> {
        match std::fs::remove_file(&self.path) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(AppError::new("history_io", format!("suppression : {e}"))),
        }
    }
}

#[tauri::command]
#[specta::specta]
pub fn history_add(
    store: State<'_, Mutex<HistoryStore>>,
    cmd: String,
    distro: String,
    cwd: String,
    exit_code: i32,
) -> Result<(), AppError> {
    store.lock().unwrap().add(&cmd, &distro, &cwd, exit_code)
}

#[tauri::command]
#[specta::specta]
pub fn history_list(store: State<'_, Mutex<HistoryStore>>, limit: u32) -> Vec<HistoryEntry> {
    store.lock().unwrap().list(limit as usize)
}

#[tauri::command]
#[specta::specta]
pub fn history_clear(store: State<'_, Mutex<HistoryStore>>) -> Result<(), AppError> {
    store.lock().unwrap().clear()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("omni_history_{name}_{}.jsonl", std::process::id()))
    }

    #[test]
    fn add_and_list_roundtrip() {
        let p = tmp("roundtrip");
        let _ = std::fs::remove_file(&p);
        let store = HistoryStore { path: p.clone() };
        store.add("ls -la", "ubuntu", "/home/user", 0).unwrap();
        store.add("echo hi", "arch", "/", 0).unwrap();
        let items = store.list(10);
        assert_eq!(items.len(), 2);
        assert_eq!(items[0].cmd, "echo hi"); // plus récent d'abord
        assert_eq!(items[1].cmd, "ls -la");
        let _ = std::fs::remove_file(&p);
    }

    #[test]
    fn list_ignores_malformed_lines() {
        let p = tmp("malformed");
        let _ = std::fs::remove_file(&p);
        std::fs::write(&p, "{pas du json}\n").unwrap();
        let store = HistoryStore { path: p.clone() };
        store.add("ok", "debian", "/", 0).unwrap();
        let items = store.list(10);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].cmd, "ok");
        let _ = std::fs::remove_file(&p);
    }

    #[test]
    fn clear_removes_history() {
        let p = tmp("clear");
        let _ = std::fs::remove_file(&p);
        let store = HistoryStore { path: p.clone() };
        store.add("a", "u", "/", 0).unwrap();
        store.clear().unwrap();
        assert!(store.list(10).is_empty());
        let _ = std::fs::remove_file(&p);
    }
}
