use crate::models::AppError;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

// ===========================================================================
// Store de session (source de vérité Rust).
// Persisté en JSON sous `app_data_dir/session.json`. Le blob contient la
// session de terminal (onglets + onglet actif). Le frontend décide du schéma ;
// Rust ne fait que stocker/restituer fidèlement le JSON (aucune simulation).
// ===========================================================================

pub struct SessionStore {
    path: PathBuf,
}

impl SessionStore {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    /// Retourne le blob JSON de session (chaîne vide si aucune session sauvegardée).
    pub fn load(&self) -> String {
        std::fs::read_to_string(&self.path).unwrap_or_default()
    }

    pub fn save(&self, json: &str) -> Result<(), AppError> {
        std::fs::write(&self.path, json).map_err(|e| AppError::new("session_io", format!("{e}")))
    }
}

#[tauri::command]
#[specta::specta]
pub fn session_get(state: State<'_, Mutex<SessionStore>>) -> Result<String, AppError> {
    Ok(state.lock().unwrap().load())
}

#[tauri::command]
#[specta::specta]
pub fn session_save(state: State<'_, Mutex<SessionStore>>, data: String) -> Result<(), AppError> {
    state.lock().unwrap().save(&data)
}

#[tauri::command]
#[specta::specta]
pub fn session_export(state: State<'_, Mutex<SessionStore>>) -> Result<String, AppError> {
    Ok(state.lock().unwrap().load())
}

#[tauri::command]
#[specta::specta]
pub fn session_import(state: State<'_, Mutex<SessionStore>>, json: String) -> Result<(), AppError> {
    state.lock().unwrap().save(&json)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("omni_session_{name}_{}.json", std::process::id()))
    }

    #[test]
    fn load_empty_when_no_file() {
        let p = tmp_path("empty");
        let _ = std::fs::remove_file(&p);
        let store = SessionStore::new(p.clone());
        assert_eq!(store.load(), "");
        let _ = std::fs::remove_file(&p);
    }

    #[test]
    fn save_and_load_roundtrip() {
        let p = tmp_path("roundtrip");
        let _ = std::fs::remove_file(&p);
        let store = SessionStore::new(p.clone());
        let blob = r#"{"activeTabId":"tab-1","tabs":[{"id":"tab-1","title":"Ubuntu","distroId":"ubuntu"}]}"#;
        store.save(blob).unwrap();
        assert_eq!(store.load(), blob);
        let _ = std::fs::remove_file(&p);
    }
}
