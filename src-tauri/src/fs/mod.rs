use crate::models::{FileNode, NodeType};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Version du schéma de persistance du VFS. À incrémenter à chaque migration
/// de format pour permettre des migrations futures (Phase 3).
pub const VFS_SCHEMA_VERSION: u32 = 1;

/// Enveloppe persistée et versionnée du VFS.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VfsState {
    pub version: u32,
    pub nodes: HashMap<String, FileNode>,
}

/// Système de fichiers virtuel POSIX (VFS) codé en Rust.
/// Persistance dans un fichier JSON versionné (Phase 3).
#[derive(Debug, Clone)]
pub struct VirtualFileSystem {
    nodes: Arc<Mutex<HashMap<String, FileNode>>>,
    persist_path: Arc<Mutex<Option<String>>>,
}

impl Default for VirtualFileSystem {
    fn default() -> Self {
        Self::new()
    }
}

impl VirtualFileSystem {
    pub fn new() -> Self {
        let mut map = HashMap::new();
        let now = Utc::now().format("%Y-%m-%d").to_string();

        let root = FileNode {
            id: "root-dir".to_string(),
            name: "/".to_string(),
            node_type: NodeType::Dir,
            path: "/".to_string(),
            parent_id: None,
            content: None,
            size: 4096,
            permissions: "drwxr-xr-x".to_string(),
            owner: "root".to_string(),
            group: "root".to_string(),
            updated_at: now.clone(),
        };
        map.insert("/".to_string(), root);

        let default_dirs = vec![
            ("bin", "/bin", "root-dir"),
            ("etc", "/etc", "root-dir"),
            ("home", "/home", "root-dir"),
            ("home/user", "/home/user", "home-dir"),
            ("var", "/var", "root-dir"),
            ("var/log", "/var/log", "var-dir"),
            ("tmp", "/tmp", "root-dir"),
            ("usr", "/usr", "root-dir"),
            ("usr/bin", "/usr/bin", "usr-dir"),
            ("dev", "/dev", "root-dir"),
        ];

        for (name, path, parent) in default_dirs {
            let id = format!("{}-dir", name.replace('/', "-"));
            map.insert(
                path.to_string(),
                FileNode {
                    id,
                    name: name.split('/').last().unwrap_or(name).to_string(),
                    node_type: NodeType::Dir,
                    path: path.to_string(),
                    parent_id: Some(parent.to_string()),
                    content: None,
                    size: 4096,
                    permissions: "drwxr-xr-x".to_string(),
                    owner: "root".to_string(),
                    group: "root".to_string(),
                    updated_at: now.clone(),
                },
            );
        }

        // /etc/os-release
        map.insert(
            "/etc/os-release".to_string(),
            FileNode {
                id: "os-release".to_string(),
                name: "os-release".to_string(),
                node_type: NodeType::File,
                path: "/etc/os-release".to_string(),
                parent_id: Some("etc-dir".to_string()),
                content: Some(
                    "NAME=\"Ubuntu\"\nVERSION=\"24.04\"\nID=ubuntu\nPRETTY_NAME=\"Ubuntu 24.04\"\n"
                        .to_string(),
                ),
                size: 74,
                permissions: "-rw-r--r--".to_string(),
                owner: "root".to_string(),
                group: "root".to_string(),
                updated_at: now.clone(),
            },
        );

        // Fichier de bienvenue
        map.insert(
            "/home/user/bienvenue.txt".to_string(),
            FileNode {
                id: "welcome-file".to_string(),
                name: "bienvenue.txt".to_string(),
                node_type: NodeType::File,
                path: "/home/user/bienvenue.txt".to_string(),
                parent_id: Some("home-user-dir".to_string()),
                content: Some(
                    "=====================================================\n\
                     OmniLinux Terminal v2 - Propulsé par Tauri v2 & Rust\n\
                     =====================================================\n\
                     \n\
                     Toutes les logiques métiers (système de fichiers VFS,\n\
                     analyseur de commandes POSIX, gestionnaire de paquets\n\
                     et passerelle IA multi-modèles) sont exécutées en Rust.\n\
                     \n\
                     Commandes disponibles :\n\
                     • help, neofetch, tauri, htop, ls -la, cat, grep\n\
                     • apt / pacman / dnf (installation de paquets)\n\
                     • ai \"comment configurer nginx\" (copilote multi-modèles)\n\
                     \n\
                     Tapez 'tauri' pour inspecter le backend Rust natif !\n"
                        .to_string(),
                ),
                size: 612,
                permissions: "-rw-r--r--".to_string(),
                owner: "user".to_string(),
                group: "user".to_string(),
                updated_at: now.clone(),
            },
        );

        // Script bash démo
        map.insert(
            "/home/user/backup.sh".to_string(),
            FileNode {
                id: "backup-script".to_string(),
                name: "backup.sh".to_string(),
                node_type: NodeType::File,
                path: "/home/user/backup.sh".to_string(),
                parent_id: Some("home-user-dir".to_string()),
                content: Some(
                    "#!/bin/bash\n\
                     # Script de sauvegarde automatisé exécuté par le moteur Rust\n\
                     echo \"[+] Démarrage de la sauvegarde de /home/user...\"\n\
                     date\n\
                     mkdir -p /tmp/backups\n\
                     echo \"[+] Copie des fichiers importants...\"\n\
                     cp /home/user/*.txt /tmp/backups/ 2>/dev/null\n\
                     echo \"[+] Sauvegarde terminée avec succès !\"\n"
                        .to_string(),
                ),
                size: 280,
                permissions: "-rwxr-xr-x".to_string(),
                owner: "user".to_string(),
                group: "user".to_string(),
                updated_at: now,
            },
        );

        Self {
            nodes: Arc::new(Mutex::new(map)),
            persist_path: Arc::new(Mutex::new(None)),
        }
    }

    // ==================== PERSISTANCE (Phase 3) ====================

    /// Définit le chemin du fichier JSON de persistance.
    pub fn set_persist_path(&self, path: &str) {
        *self.persist_path.lock().unwrap() = Some(path.to_string());
    }

    /// Snapshot actuel de l'état, versionné.
    pub fn to_state(&self) -> VfsState {
        VfsState {
            version: VFS_SCHEMA_VERSION,
            nodes: self.nodes.lock().unwrap().clone(),
        }
    }

    /// Remplace l'intégralité des nœuds par un état chargé.
    pub fn from_state(&self, state: VfsState) {
        let mut map = self.nodes.lock().unwrap();
        *map = state.nodes;
    }

    /// Sérialise et écrit le VFS sur disque (si un chemin est défini).
    pub fn persist(&self) {
        let path = self.persist_path.lock().unwrap().clone();
        if let Some(p) = path {
            if let Ok(json) = serde_json::to_string_pretty(&self.to_state()) {
                let _ = std::fs::write(p, json);
            }
        }
    }

    /// Charge le VFS depuis `path`. Renvoie `true` si un état valide a été lu.
    /// Sinon conserve le VFS initial (seed).
    pub fn load_or_initialize(&self, path: &str) -> bool {
        if let Ok(json) = std::fs::read_to_string(path) {
            if let Ok(state) = serde_json::from_str::<VfsState>(&json) {
                if state.version == VFS_SCHEMA_VERSION {
                    self.from_state(state);
                    return true;
                }
            }
        }
        false
    }

    // ==================== LECTURE / ÉCRITURE ====================

    pub fn normalize_path(&self, target: &str, cwd: &str) -> String {
        let trimmed = target.trim();
        if trimmed.is_empty() {
            return cwd.to_string();
        }

        let full_path = if trimmed.starts_with('/') {
            trimmed.to_string()
        } else if trimmed.starts_with('~') {
            format!("/home/user{}", &trimmed[1..])
        } else if cwd == "/" {
            format!("/{}", trimmed)
        } else {
            format!("{}/{}", cwd, trimmed)
        };

        let segments: Vec<&str> = full_path.split('/').collect();
        let mut resolved: Vec<&str> = Vec::new();

        for seg in segments {
            if seg.is_empty() || seg == "." {
                continue;
            }
            if seg == ".." {
                resolved.pop();
            } else {
                resolved.push(seg);
            }
        }

        if resolved.is_empty() {
            "/".to_string()
        } else {
            format!("/{}", resolved.join("/"))
        }
    }

    pub fn get_node(&self, path: &str) -> Option<FileNode> {
        let map = self.nodes.lock().unwrap();
        map.get(path).cloned()
    }

    pub fn list_dir(&self, path: &str) -> Vec<FileNode> {
        let map = self.nodes.lock().unwrap();
        let normalized = if path.ends_with('/') && path != "/" {
            &path[..path.len() - 1]
        } else {
            path
        };

        map.values()
            .filter(|node| {
                if node.path == normalized {
                    return false;
                }
                let parent_path = match node.path.rfind('/') {
                    Some(0) => "/",
                    Some(idx) => &node.path[..idx],
                    None => "/",
                };
                parent_path == normalized
            })
            .cloned()
            .collect()
    }

    pub fn read_file(&self, path: &str) -> Result<String, String> {
        let map = self.nodes.lock().unwrap();
        match map.get(path) {
            Some(node) => {
                if node.node_type == NodeType::Dir {
                    Err(format!("{}: est un dossier", path))
                } else {
                    Ok(node.content.clone().unwrap_or_default())
                }
            }
            None => Err(format!("{}: Aucun fichier ou dossier de ce type", path)),
        }
    }

    pub fn write_file(&self, path: &str, content: &str, append: bool) -> Result<FileNode, String> {
        let node = {
            let mut map = self.nodes.lock().unwrap();
            let now = Utc::now().format("%Y-%m-%d").to_string();

            if let Some(existing) = map.get_mut(path) {
                if existing.node_type == NodeType::Dir {
                    return Err(format!("{}: est un dossier", path));
                }
                let new_content = if append {
                    format!("{}\n{}", existing.content.as_deref().unwrap_or(""), content)
                } else {
                    content.to_string()
                };
                existing.size = new_content.len() as u64;
                existing.content = Some(new_content);
                existing.updated_at = now;
                return Ok(existing.clone());
            }

            let name = path.split('/').last().unwrap_or("file").to_string();
            let node = FileNode {
                id: uuid::Uuid::new_v4().to_string(),
                name,
                node_type: NodeType::File,
                path: path.to_string(),
                parent_id: None,
                content: Some(content.to_string()),
                size: content.len() as u64,
                permissions: "-rw-r--r--".to_string(),
                owner: "user".to_string(),
                group: "user".to_string(),
                updated_at: now,
            };
            map.insert(path.to_string(), node.clone());
            node
        };
        self.persist();
        Ok(node)
    }

    pub fn create_dir(&self, path: &str) -> Result<FileNode, String> {
        let node = {
            let mut map = self.nodes.lock().unwrap();
            if map.contains_key(path) {
                return Err(format!("{}: Le dossier existe déjà", path));
            }

            let now = Utc::now().format("%Y-%m-%d").to_string();
            let name = path.split('/').last().unwrap_or("dir").to_string();

            let node = FileNode {
                id: uuid::Uuid::new_v4().to_string(),
                name,
                node_type: NodeType::Dir,
                path: path.to_string(),
                parent_id: None,
                content: None,
                size: 4096,
                permissions: "drwxr-xr-x".to_string(),
                owner: "user".to_string(),
                group: "user".to_string(),
                updated_at: now,
            };
            map.insert(path.to_string(), node.clone());
            node
        };
        self.persist();
        Ok(node)
    }

    pub fn remove_path(&self, path: &str, recursive: bool) -> Result<(), String> {
        {
            let mut map = self.nodes.lock().unwrap();
            if !map.contains_key(path) {
                return Err(format!("{}: Aucun fichier ou dossier de ce type", path));
            }

            if map.get(path).unwrap().node_type == NodeType::Dir && !recursive {
                let has_children = map.keys().any(|k| k != path && k.starts_with(path));
                if has_children {
                    return Err(format!("{}: Le dossier n'est pas vide (utilisez -r)", path));
                }
            }

            let prefix = format!("{}/", path);
            map.retain(|k, _| k != path && (!recursive || !k.starts_with(&prefix)));
        }
        self.persist();
        Ok(())
    }

    pub fn total_nodes(&self) -> usize {
        self.nodes.lock().unwrap().len()
    }

    // ==================== OPÉRATIONS (Phase 3) ====================

    pub fn copy(&self, src: &str, dst: &str) -> Result<FileNode, String> {
        let node = {
            let mut map = self.nodes.lock().unwrap();
            let src_node = map
                .get(src)
                .cloned()
                .ok_or_else(|| format!("{}: Aucun fichier ou dossier de ce type", src))?;
            if map.contains_key(dst) {
                return Err(format!("{}: existe déjà", dst));
            }
            let mut n = src_node;
            n.id = uuid::Uuid::new_v4().to_string();
            n.path = dst.to_string();
            n.name = dst.split('/').last().unwrap_or(dst).to_string();
            n.parent_id = None;
            n.updated_at = Utc::now().format("%Y-%m-%d").to_string();
            map.insert(dst.to_string(), n.clone());
            n
        };
        self.persist();
        Ok(node)
    }

    pub fn move_path(&self, src: &str, dst: &str) -> Result<FileNode, String> {
        let node = self.copy(src, dst)?;
        self.remove_path(src, true)?;
        Ok(node)
    }

    pub fn search(&self, query: &str) -> Vec<String> {
        let map = self.nodes.lock().unwrap();
        let q = query.to_lowercase();
        map.values()
            .filter(|n| {
                n.name.to_lowercase().contains(&q) || n.path.to_lowercase().contains(&q)
            })
            .map(|n| n.path.clone())
            .collect()
    }

    pub fn chmod(&self, path: &str, permissions: &str) -> Result<FileNode, String> {
        let node = {
            let mut map = self.nodes.lock().unwrap();
            let n = map
                .get_mut(path)
                .ok_or_else(|| format!("{}: Aucun fichier ou dossier de ce type", path))?;
            n.permissions = permissions.to_string();
            n.updated_at = Utc::now().format("%Y-%m-%d").to_string();
            n.clone()
        };
        self.persist();
        Ok(node)
    }

    /// Met à jour /etc/os-release (contenu de la distribution courante).
    pub fn update_os_release(&self, name: &str, version: &str) -> Result<FileNode, String> {
        let content = format!(
            "NAME=\"{}\"\nVERSION=\"{}\"\nID={}\nPRETTY_NAME=\"{}\" {}\n",
            name,
            version,
            name.to_lowercase(),
            name,
            version
        );
        self.write_file("/etc/os-release", &content, false)
    }

    pub fn export_json(&self) -> Result<String, String> {
        serde_json::to_string_pretty(&self.to_state()).map_err(|e| e.to_string())
    }

    pub fn import_json(&self, json: &str) -> Result<(), String> {
        let state: VfsState = serde_json::from_str(json).map_err(|e| e.to_string())?;
        if state.version != VFS_SCHEMA_VERSION {
            return Err(format!(
                "Version de schéma incompatible: {} (attendu {})",
                state.version, VFS_SCHEMA_VERSION
            ));
        }
        self.from_state(state);
        self.persist();
        Ok(())
    }

    /// Réinitialise le VFS à son état initial (seed).
    pub fn reset(&self) {
        let fresh = Self::new();
        self.from_state(fresh.to_state());
        self.persist();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_path() -> String {
        std::env::temp_dir()
            .join(format!("omni_vfs_test_{}.json", uuid::Uuid::new_v4()))
            .to_string_lossy()
            .to_string()
    }

    #[test]
    fn persist_roundtrip() {
        let vfs = VirtualFileSystem::new();
        let p = temp_path();
        vfs.set_persist_path(&p);
        let _ = vfs.write_file("/home/user/hello.txt", "bonjour", false);
        vfs.persist();

        let vfs2 = VirtualFileSystem::new();
        assert!(vfs2.get_node("/home/user/hello.txt").is_none());
        assert!(vfs2.load_or_initialize(&p));
        assert!(vfs2.get_node("/home/user/hello.txt").is_some());
        let _ = std::fs::remove_file(&p);
    }

    #[test]
    fn copy_move_search() {
        let vfs = VirtualFileSystem::new();
        let _ = vfs.write_file("/home/user/a.txt", "abc", false);
        let _ = vfs.copy("/home/user/a.txt", "/home/user/b.txt");
        assert!(vfs.get_node("/home/user/b.txt").is_some());
        assert_eq!(vfs.read_file("/home/user/b.txt").unwrap(), "abc");

        let _ = vfs.move_path("/home/user/b.txt", "/home/user/c.txt");
        assert!(vfs.get_node("/home/user/b.txt").is_none());
        assert!(vfs.get_node("/home/user/c.txt").is_some());
        assert!(!vfs.search("c.txt").is_empty());
    }

    #[test]
    fn os_release_and_export_import() {
        let vfs = VirtualFileSystem::new();
        let _ = vfs.update_os_release("Arch", "rolling");
        assert!(vfs.get_node("/etc/os-release").is_some());

        let json = vfs.export_json().unwrap();
        let vfs2 = VirtualFileSystem::new();
        vfs2.import_json(&json).unwrap();
        assert!(vfs2.get_node("/etc/os-release").is_some());
    }

    #[test]
    fn chmod_works() {
        let vfs = VirtualFileSystem::new();
        let _ = vfs.write_file("/home/user/x.sh", "echo hi", false);
        let n = vfs.chmod("/home/user/x.sh", "-rwxr-xr-x").unwrap();
        assert_eq!(n.permissions, "-rwxr-xr-x");
    }
}
