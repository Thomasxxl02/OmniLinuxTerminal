use crate::models::AppError;
use std::collections::HashMap;
use std::sync::Mutex;

// ===========================================================================
// Trousseau de secrets (source de vérité Rust).
// Priorité : trousseau système (OS keyring via keyring crate, backend natif
// linux-keyutils / macOS / Windows) ; repli automatique en mémoire de session
// si le trousseau est indisponible (aucune donnée sur disque, jamais en
// localStorage). Les secrets ne sont jamais retournés au frontend sauf sur
// demande explicite, et jamais écrits dans les logs.
// ===========================================================================

type MemStore = HashMap<(String, String), String>;
static MEM: Mutex<Option<MemStore>> = Mutex::new(None);

fn mem() -> std::sync::MutexGuard<'static, Option<MemStore>> {
    MEM.lock().unwrap()
}

fn keyring_entry(service: &str, key: &str) -> Result<keyring::Entry, AppError> {
    keyring::Entry::new(service, key).map_err(|e| AppError::new("keyring", format!("{e}")))
}

/// Stocke un secret : trousseau système, sinon repli mémoire (jamais d'échec).
pub fn set(service: &str, key: &str, value: &str) -> Result<(), AppError> {
    if value.is_empty() {
        return delete(service, key);
    }
    if let Ok(entry) = keyring_entry(service, key) {
        if entry.set_password(value).is_ok() {
            return Ok(());
        }
    }
    // Repli mémoire (daemon absent / backend indisponible).
    let mut g = mem();
    g.get_or_insert_with(HashMap::new)
        .insert((service.to_string(), key.to_string()), value.to_string());
    Ok(())
}

/// Récupère un secret : trousseau système, sinon repli mémoire.
pub fn get(service: &str, key: &str) -> Result<String, AppError> {
    if let Ok(entry) = keyring_entry(service, key) {
        if let Ok(v) = entry.get_password() {
            return Ok(v);
        }
    }
    if let Some(g) = mem().as_ref() {
        if let Some(v) = g.get(&(service.to_string(), key.to_string())) {
            return Ok(v.clone());
        }
    }
    Err(AppError::new(
        "secret_not_found",
        format!("Aucun secret pour {}/{}", service, key),
    ))
}

/// Supprime un secret (trousseau + mémoire).
pub fn delete(service: &str, key: &str) -> Result<(), AppError> {
    if let Ok(entry) = keyring_entry(service, key) {
        let _ = entry.delete_credential();
    }
    if let Some(g) = mem().as_mut() {
        g.remove(&(service.to_string(), key.to_string()));
    }
    Ok(())
}

/// Vrai si un secret existe (trousseau ou mémoire).
pub fn exists(service: &str, key: &str) -> bool {
    get(service, key).is_ok()
}

// ------------------ Commandes Tauri ------------------

#[tauri::command]
#[specta::specta]
pub fn secret_save(service: String, key: String, value: String) -> Result<(), AppError> {
    set(&service, &key, &value)
}

#[tauri::command]
#[specta::specta]
pub fn secret_get(service: String, key: String) -> Result<String, AppError> {
    get(&service, &key)
}

#[tauri::command]
#[specta::specta]
pub fn secret_delete(service: String, key: String) -> Result<(), AppError> {
    delete(&service, &key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn set_get_delete_memory_fallback() {
        // Utilise le repli mémoire (aucun trousseau en CI/headless).
        set("test-service", "k", "s3cret").unwrap();
        assert_eq!(get("test-service", "k").unwrap(), "s3cret");
        assert!(exists("test-service", "k"));
        delete("test-service", "k").unwrap();
        assert!(get("test-service", "k").is_err());
    }
}
