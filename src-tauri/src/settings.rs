use crate::models::AppError;
use crate::storage;
use serde_json::{Map, Value};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

// ===========================================================================
// Store des réglages (source de vérité Rust).
// Persisté en JSON sous `app_data_dir/settings.json` sous forme versionnée
// `{ "version": 1, "data": { ... } }`. Map générique clé/valeur pour rester
// flexible (themeId, crtEffect, soundEnabled, soundStyle, fontSize,
// aiConfig…). Les secrets ne passent JAMAIS par ce store : le frontend ne
// persiste que des valeurs non sensibles.
// Écriture atomique (temp + fsync + rename) + récupération sur corruption.
// ===========================================================================

/// Version du format de persistance des réglages. À incrémenter à chaque
/// migration (voir `load`).
const SETTINGS_VERSION: u32 = 1;

pub struct SettingsStore {
    path: PathBuf,
    data: Map<String, Value>,
}

impl SettingsStore {
    pub fn new(path: PathBuf) -> Self {
        let data = Self::load(&path);
        Self { path, data }
    }

    /// Charge la map des réglages. Gère le format versionné, migre l'ancien
    /// format (map racine) et met en quarantaine un fichier corrompu.
    fn load(path: &PathBuf) -> Map<String, Value> {
        match std::fs::read_to_string(path) {
            Ok(s) if !s.trim().is_empty() => match serde_json::from_str::<Value>(&s) {
                Ok(v) => {
                    // Format versionné (v1+) : { "version": N, "data": {...} }
                    if let Some(data) = v.get("data").and_then(|d| d.as_object()) {
                        return data.clone();
                    }
                    // Legacy : la racine était directement la map des réglages.
                    v.as_object().cloned().unwrap_or_default()
                }
                Err(_) => {
                    // Fichier corrompu -> quarantaine (préserve pour diagnostic).
                    let _ = storage::quarantine(path);
                    Map::new()
                }
            },
            _ => Map::new(),
        }
    }

    pub fn all(&self) -> Map<String, Value> {
        self.data.clone()
    }

    pub fn set(&mut self, key: String, value: Value) -> Result<(), AppError> {
        self.data.insert(key, value);
        self.persist()
    }

    fn persist(&self) -> Result<(), AppError> {
        let mut env = Map::new();
        env.insert("version".to_string(), Value::from(SETTINGS_VERSION));
        env.insert("data".to_string(), Value::Object(self.data.clone()));
        let json = serde_json::to_string_pretty(&Value::Object(env))
            .map_err(|e| AppError::new("settings_io", format!("{e}")))?;
        storage::atomic_write(&self.path, json.as_bytes())
            .map_err(|e| AppError::new("settings_io", format!("{e}")))
    }
}

#[tauri::command]
#[specta::specta]
pub fn settings_get(state: State<'_, Mutex<SettingsStore>>) -> Result<String, AppError> {
    serde_json::to_string(&Value::Object(state.lock().unwrap().all()))
        .map_err(|e| AppError::new("settings_serialize", format!("{e}")))
}

#[tauri::command]
#[specta::specta]
pub fn settings_update(
    state: State<'_, Mutex<SettingsStore>>,
    key: String,
    value: String,
) -> Result<(), AppError> {
    let parsed: Value = serde_json::from_str(&value)
        .map_err(|e| AppError::new("invalid", format!("Valeur de réglage JSON invalide : {e}")))?;
    state.lock().unwrap().set(key, parsed)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("omni_settings_{name}_{}.json", std::process::id()))
    }

    #[test]
    fn new_store_is_empty_when_no_file() {
        let p = tmp_path("empty");
        let _ = std::fs::remove_file(&p);
        let store = SettingsStore::new(p.clone());
        assert!(store.all().is_empty());
        let _ = std::fs::remove_file(&p);
    }

    #[test]
    fn upsert_and_persist_roundtrip() {
        let p = tmp_path("roundtrip");
        let _ = std::fs::remove_file(&p);

        let store = SettingsStore::new(p.clone());
        // set est une méthode &mut (persist à chaque fois)
        std::sync::Mutex::new(store)
            .lock()
            .unwrap()
            .set("fontSize".to_string(), Value::from(15))
            .unwrap();

        // Recharge depuis le disque : la valeur doit être là.
        let reloaded = SettingsStore::new(p.clone());
        assert_eq!(reloaded.all().get("fontSize").and_then(|v| v.as_i64()), Some(15));

        let _ = std::fs::remove_file(&p);
    }
}
