use crate::models::{FileNode, NodeType};
use chrono::Utc;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Système de fichiers virtuel POSIX (VFS) haute performance codé en Rust
#[derive(Debug, Clone)]
pub struct VirtualFileSystem {
    nodes: Arc<Mutex<HashMap<String, FileNode>>>,
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
        }
    }

    /// Normalise un chemin relatif ou absolu en chemin POSIX canonique
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

        // Création du fichier
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
        Ok(node)
    }

    pub fn create_dir(&self, path: &str) -> Result<FileNode, String> {
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
        Ok(node)
    }

    pub fn remove_path(&self, path: &str, recursive: bool) -> Result<(), String> {
        let mut map = self.nodes.lock().unwrap();
        if !map.contains_key(path) {
            return Err(format!("{}: Aucun fichier ou dossier de ce type", path));
        }

        if map.get(path).unwrap().node_type == NodeType::Dir && !recursive {
            // Vérifier si le dossier est vide
            let has_children = map.keys().any(|k| k != path && k.starts_with(path));
            if has_children {
                return Err(format!("{}: Le dossier n'est pas vide (utilisez -r)", path));
            }
        }

        let prefix = format!("{}/", path);
        map.retain(|k, _| k != path && (!recursive || !k.starts_with(&prefix)));
        Ok(())
    }

    pub fn total_nodes(&self) -> usize {
        self.nodes.lock().unwrap().len()
    }
}
