// ===========================================================================
// Helpers de persistance robuste (Priorité 4).
// Écriture atomique (temp + fsync + rename), quarantaine d'un fichier corrompu,
// sauvegarde avant import. Utilisé par le VFS, les réglages et les sessions.
// ===========================================================================

use std::io::Write;
use std::path::{Path, PathBuf};

/// Écrit `bytes` dans `path` de manière atomique : écrit dans un fichier
/// temporaire du même répertoire, fsync, puis `rename` (atomique sur POSIX).
/// Un plantage en cours ne laisse jamais un fichier de données tronqué.
pub fn atomic_write(path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    // Nom temporaire unique (pid) pour éviter toute collision entre écritures.
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("data");
    let tmp = path.with_file_name(format!("{file_name}.{}.tmp", std::process::id()));
    {
        let mut f = std::fs::File::create(&tmp)?;
        f.write_all(bytes)?;
        f.sync_all()?;
    }
    std::fs::rename(&tmp, path)?;
    // Durabilité : fsync du répertoire parent (le rename ne suffit pas toujours).
    if let Some(parent) = path.parent() {
        if let Ok(d) = std::fs::File::open(parent) {
            let _ = d.sync_all();
        }
    }
    Ok(())
}

/// Met en quarantaine un fichier de données illisible/corrompu (le préserve en
/// `.corrupt-<horodatage>` pour diagnostic) et retourne son chemin. Retourne
/// `None` si le fichier n'existe pas ou n'a pas pu être renommé.
pub fn quarantine(path: &Path) -> Option<PathBuf> {
    if !path.exists() {
        return None;
    }
    let ts = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup = path.with_extension(format!("corrupt-{ts}"));
    std::fs::rename(path, &backup).ok()?;
    Some(backup)
}

/// Sauvegarde un fichier avant une opération destructrice (import). Retourne le
/// chemin de la sauvegarde, ou `None` si le fichier n'existe pas.
pub fn backup(path: &Path) -> Option<PathBuf> {
    if !path.exists() {
        return None;
    }
    let ts = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup = path.with_extension(format!("bak-{ts}"));
    std::fs::copy(path, &backup).ok()?;
    Some(backup)
}
