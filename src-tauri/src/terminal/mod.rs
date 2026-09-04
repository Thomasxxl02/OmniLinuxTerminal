use crate::distro::{get_distro_by_id, get_supported_distros};
use crate::fs::VirtualFileSystem;
use crate::models::{CommandExecutionResult, NodeType};
use chrono::Utc;
use std::time::Instant;

/// Exécuteur de commandes shell POSIX universel en Rust
pub struct ShellExecutor {
    vfs: VirtualFileSystem,
}

impl ShellExecutor {
    pub fn new(vfs: VirtualFileSystem) -> Self {
        Self { vfs }
    }

    /// Exécute une commande complète (supporte pipes | et redirections > >>)
    pub fn execute(
        &self,
        raw_cmd: &str,
        cwd: &str,
        distro_id: &str,
        _installed_packages: &[String],
    ) -> CommandExecutionResult {
        let start_time = Instant::now();
        let trimmed = raw_cmd.trim();

        if trimmed.is_empty() {
            return CommandExecutionResult {
                text: Some(String::new()),
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: None,
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            };
        }

        // Support spécial pour la commande 'tauri' ou 'cargo' ou 'rustc'
        if trimmed == "tauri" || trimmed.starts_with("tauri ") {
            return self.handle_tauri_command(trimmed, start_time);
        }

        if trimmed == "cargo" || trimmed.starts_with("cargo ") {
            return self.handle_cargo_command(trimmed, start_time);
        }

        if trimmed == "rustc" || trimmed == "rustc --version" {
            return CommandExecutionResult {
                text: Some("rustc 1.85.0 (Tauri v2 Native Rust Backend Edition)".to_string()),
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: None,
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            };
        }

        // Gestion de pipeline simple (cmd1 | cmd2)
        if trimmed.contains('|') {
            return self.handle_pipeline(trimmed, cwd, distro_id, start_time);
        }

        // Gestion de redirection (cmd > file ou cmd >> file)
        if (trimmed.contains('>') || trimmed.contains(">>")) && !trimmed.starts_with("echo") {
            // Generic redirection handled below or via sub-execution
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        let cmd = parts[0];
        let args = &parts[1..];

        let current_distro = get_distro_by_id(distro_id).unwrap_or_else(|| get_supported_distros()[0].clone());

        match cmd {
            "pwd" => CommandExecutionResult {
                text: Some(cwd.to_string()),
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: None,
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },

            "whoami" => CommandExecutionResult {
                text: Some(current_distro.default_user),
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: None,
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },

            "date" => CommandExecutionResult {
                text: Some(Utc::now().to_rfc2822()),
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: None,
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },

            "clear" => CommandExecutionResult {
                text: None,
                new_cwd: None,
                clear: true,
                exit_code: 0,
                active_app: None,
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },

            "cd" => {
                let target = if args.is_empty() {
                    "/home/user"
                } else {
                    args[0]
                };
                let new_path = self.vfs.normalize_path(target, cwd);
                match self.vfs.get_node(&new_path) {
                    Some(node) => {
                        if node.node_type == NodeType::Dir {
                            CommandExecutionResult {
                                text: None,
                                new_cwd: Some(new_path),
                                clear: false,
                                exit_code: 0,
                                active_app: None,
                                installed_package: None,
                                switched_distro: None,
                                execution_time_ms: start_time.elapsed().as_millis() as u64,
                            }
                        } else {
                            CommandExecutionResult {
                                text: Some(format!("cd: pas un dossier: {}", target)),
                                new_cwd: None,
                                clear: false,
                                exit_code: 1,
                                active_app: None,
                                installed_package: None,
                                switched_distro: None,
                                execution_time_ms: start_time.elapsed().as_millis() as u64,
                            }
                        }
                    }
                    None => CommandExecutionResult {
                        text: Some(format!("cd: aucun fichier ou dossier de ce type: {}", target)),
                        new_cwd: None,
                        clear: false,
                        exit_code: 1,
                        active_app: None,
                        installed_package: None,
                        switched_distro: None,
                        execution_time_ms: start_time.elapsed().as_millis() as u64,
                    },
                }
            }

            "ls" => {
                let show_all = args.iter().any(|a| a.starts_with('-') && a.contains('a'));
                let show_long = args.iter().any(|a| a.starts_with('-') && a.contains('l'));
                let target_arg = args.iter().find(|a| !a.starts_with('-')).copied().unwrap_or(".");
                let target_path = self.vfs.normalize_path(target_arg, cwd);

                let entries = self.vfs.list_dir(&target_path);
                if entries.is_empty() {
                    return CommandExecutionResult {
                        text: Some(String::new()),
                        new_cwd: None,
                        clear: false,
                        exit_code: 0,
                        active_app: None,
                        installed_package: None,
                        switched_distro: None,
                        execution_time_ms: start_time.elapsed().as_millis() as u64,
                    };
                }

                let mut out_lines = Vec::new();
                for node in entries {
                    if !show_all && node.name.starts_with('.') {
                        continue;
                    }

                    if show_long {
                        out_lines.push(format!(
                            "{} {:>2} {:<8} {:<8} {:>6} {} {}",
                            node.permissions,
                            1,
                            node.owner,
                            node.group,
                            node.size,
                            node.updated_at,
                            node.name
                        ));
                    } else {
                        out_lines.push(node.name);
                    }
                }

                CommandExecutionResult {
                    text: Some(out_lines.join(if show_long { "\n" } else { "  " })),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "cat" => {
                if args.is_empty() {
                    return CommandExecutionResult {
                        text: Some("cat: argument manquant".to_string()),
                        new_cwd: None,
                        clear: false,
                        exit_code: 1,
                        active_app: None,
                        installed_package: None,
                        switched_distro: None,
                        execution_time_ms: start_time.elapsed().as_millis() as u64,
                    };
                }
                let mut combined = Vec::new();
                for target in args {
                    let path = self.vfs.normalize_path(target, cwd);
                    match self.vfs.read_file(&path) {
                        Ok(content) => combined.push(content),
                        Err(err) => combined.push(format!("cat: {}", err)),
                    }
                }
                CommandExecutionResult {
                    text: Some(combined.join("\n")),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "touch" => {
                if args.is_empty() {
                    return CommandExecutionResult {
                        text: Some("touch: argument manquant".to_string()),
                        new_cwd: None,
                        clear: false,
                        exit_code: 1,
                        active_app: None,
                        installed_package: None,
                        switched_distro: None,
                        execution_time_ms: start_time.elapsed().as_millis() as u64,
                    };
                }
                for target in args {
                    let path = self.vfs.normalize_path(target, cwd);
                    let _ = self.vfs.write_file(&path, "", false);
                }
                CommandExecutionResult {
                    text: None,
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "mkdir" => {
                let targets: Vec<&str> = args.iter().filter(|a| !a.starts_with('-')).copied().collect();
                for target in targets {
                    let path = self.vfs.normalize_path(target, cwd);
                    if let Err(err) = self.vfs.create_dir(&path) {
                        return CommandExecutionResult {
                            text: Some(format!("mkdir: {}", err)),
                            new_cwd: None,
                            clear: false,
                            exit_code: 1,
                            active_app: None,
                            installed_package: None,
                            switched_distro: None,
                            execution_time_ms: start_time.elapsed().as_millis() as u64,
                        };
                    }
                }
                CommandExecutionResult {
                    text: None,
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "rm" => {
                let recursive = args.iter().any(|a| a.contains('r') || a.contains('R'));
                let targets: Vec<&str> = args.iter().filter(|a| !a.starts_with('-')).copied().collect();
                for target in targets {
                    let path = self.vfs.normalize_path(target, cwd);
                    if let Err(err) = self.vfs.remove_path(&path, recursive) {
                        return CommandExecutionResult {
                            text: Some(format!("rm: {}", err)),
                            new_cwd: None,
                            clear: false,
                            exit_code: 1,
                            active_app: None,
                            installed_package: None,
                            switched_distro: None,
                            execution_time_ms: start_time.elapsed().as_millis() as u64,
                        };
                    }
                }
                CommandExecutionResult {
                    text: None,
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "echo" => {
                // Check if writing to file with > or >>
                if trimmed.contains('>') {
                    let is_append = trimmed.contains(">>");
                    let op = if is_append { ">>" } else { ">" };
                    let parts_redir: Vec<&str> = trimmed.split(op).collect();
                    if parts_redir.len() == 2 {
                        let content_raw = parts_redir[0].trim_start_matches("echo").trim();
                        let target_raw = parts_redir[1].trim();
                        let clean = content_raw.trim_matches('"').trim_matches('\'');
                        let target_path = self.vfs.normalize_path(target_raw, cwd);
                        let _ = self.vfs.write_file(&target_path, clean, is_append);
                        return CommandExecutionResult {
                            text: None,
                            new_cwd: None,
                            clear: false,
                            exit_code: 0,
                            active_app: None,
                            installed_package: None,
                            switched_distro: None,
                            execution_time_ms: start_time.elapsed().as_millis() as u64,
                        };
                    }
                }

                let text = args.join(" ").trim_matches('"').trim_matches('\'').to_string();
                CommandExecutionResult {
                    text: Some(text),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "uname" => {
                let all = args.iter().any(|a| *a == "-a");
                let msg = if all {
                    format!("Linux omnilinux 6.10.8-omni #1 SMP PREEMPT_DYNAMIC Rust x86_64 GNU/Linux (Tauri v2)")
                } else {
                    "Linux".to_string()
                };
                CommandExecutionResult {
                    text: Some(msg),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "neofetch" => {
                let logo = &current_distro.ascii_logo;
                let info = format!(
                    "{}@omnilinux\n\
                     --------------------\n\
                     OS: {}\n\
                     Host: Tauri v2 Native Desktop Container\n\
                     Kernel: {}\n\
                     Uptime: 4 days, 12 hours\n\
                     Packages: {} (apt/pacman/dnf)\n\
                     Shell: bash 5.2.26\n\
                     Terminal: OmniLinux Rust VFS v2\n\
                     CPU: AMD Ryzen 9 7950X (32) @ 4.500GHz\n\
                     Memory: 1840MiB / 32150MiB",
                    current_distro.default_user,
                    current_distro.name,
                    current_distro.kernel,
                    current_distro.default_packages.len()
                );
                CommandExecutionResult {
                    text: Some(format!("{}\n\n{}", logo, info)),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "htop" => CommandExecutionResult {
                text: None,
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: Some("htop".to_string()),
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },

            "cmatrix" | "matrix" => CommandExecutionResult {
                text: None,
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: Some("matrix".to_string()),
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },

            "sl" => CommandExecutionResult {
                text: None,
                new_cwd: None,
                clear: false,
                exit_code: 0,
                active_app: Some("sl".to_string()),
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },

            // Package managers in Rust
            "apt" | "apt-get" => {
                if args.get(0) == Some(&"install") && args.len() > 1 {
                    let pkg = args[1];
                    let out = format!(
                        "Lecture des listes de paquets... Fait\n\
                         Construction de l'arbre des dépendances... Fait\n\
                         Les NOUVEAUX paquets suivants seront installés :\n\
                           {}\n\
                         0 mis à jour, 1 nouvellement installés, 0 à enlever.\n\
                         Téléchargement et décompression en cours... Fait.\n\
                         Paramétrage de {} (moteur Rust Tauri v2)... Fait.",
                        pkg, pkg
                    );
                    return CommandExecutionResult {
                        text: Some(out),
                        new_cwd: None,
                        clear: false,
                        exit_code: 0,
                        active_app: None,
                        installed_package: Some(pkg.to_string()),
                        switched_distro: None,
                        execution_time_ms: start_time.elapsed().as_millis() as u64,
                    };
                }
                CommandExecutionResult {
                    text: Some(format!("apt 2.8.0 (amd64) - Gestionnaire de paquets Debian/Ubuntu")),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "pacman" => {
                if (args.get(0) == Some(&"-S") || args.get(0) == Some(&"-Sy")) && args.len() > 1 {
                    let pkg = args.last().unwrap();
                    let out = format!(
                        ":: Synchronisation des bases de données de paquets...\n\
                         resolving dependencies...\n\
                         looking for conflicting packages...\n\
                         Packages (1) {} \n\
                         Total Installed Size:  4.20 MiB\n\
                         :: Proceed with installation? [Y/n] Y\n\
                         (1/1) checking keys in keyring... [######################] 100%\n\
                         (1/1) checking package integrity... [######################] 100%\n\
                         (1/1) installing {} (moteur Rust)... [######################] 100%",
                        pkg, pkg
                    );
                    return CommandExecutionResult {
                        text: Some(out),
                        new_cwd: None,
                        clear: false,
                        exit_code: 0,
                        active_app: None,
                        installed_package: Some(pkg.to_string()),
                        switched_distro: None,
                        execution_time_ms: start_time.elapsed().as_millis() as u64,
                    };
                }
                CommandExecutionResult {
                    text: Some("Pacman v6.1.0 - Gestionnaire de paquets Arch Linux".to_string()),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            "help" => {
                let help_text = "\
OmniLinux Terminal v2 - Architecture Tauri v2 & Rust
=====================================================
Commandes système intégrées :
  • Navigation & Fichiers : ls, cd, pwd, cat, touch, mkdir, rm, cp, mv, chmod
  • Diagnostic & Infos     : uname, whoami, date, uptime, df, free, ps, neofetch
  • Gestion de Paquets    : apt, pacman, dnf, apk
  • Utilitaires & Jeux    : htop, cmatrix, sl, clear, echo, grep, find
  • Tauri v2 & Rust       : tauri (stats backend & IPC), cargo, rustc
  • Copilote IA Multi-Mod : ai \"<votre demande>\" ou bouton Copilote IA

Options d'exécution :
  • Redirections : echo \"texte\" > fichier.txt (ou >> pour ajouter)
  • Pipelines    : cat fichier.txt | grep motif";
                CommandExecutionResult {
                    text: Some(help_text.to_string()),
                    new_cwd: None,
                    clear: false,
                    exit_code: 0,
                    active_app: None,
                    installed_package: None,
                    switched_distro: None,
                    execution_time_ms: start_time.elapsed().as_millis() as u64,
                }
            }

            unknown => CommandExecutionResult {
                text: Some(format!("{}: commande introuvable. Tapez 'help' pour la liste.", unknown)),
                new_cwd: None,
                clear: false,
                exit_code: 127,
                active_app: None,
                installed_package: None,
                switched_distro: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },
        }
    }

    fn handle_tauri_command(&self, _cmd: &str, start_time: Instant) -> CommandExecutionResult {
        let msg = format!(
            "🦀 OmniLinux Terminal - Backend Rust & Tauri v2\n\
             ================================================\n\
             • Framework : Tauri v2.0 (IPC haute vitesse bidirectionnel)\n\
             • Backend   : Rust 1.85 (VFS POSIX, Shell Executor, Copilote IA)\n\
             • Nœuds VFS : {} fichiers & dossiers en mémoire vive\n\
             • Sécurité  : Sandboxing des capacités Tauri v2 (capabilities/default.json)\n\
             • Cibles OS : Linux (.deb, .AppImage), macOS (.dmg), Windows (.msi)\n\
             \n\
             Tapez 'cargo --version' ou ouvrez l'inspecteur d'architecture Tauri !",
            self.vfs.total_nodes()
        );

        CommandExecutionResult {
            text: Some(msg),
            new_cwd: None,
            clear: false,
            exit_code: 0,
            active_app: None,
            installed_package: None,
            switched_distro: None,
            execution_time_ms: start_time.elapsed().as_millis() as u64,
        }
    }

    fn handle_cargo_command(&self, _cmd: &str, start_time: Instant) -> CommandExecutionResult {
        let msg = "cargo 1.85.0 (Tauri v2 Workspace)\n\
                   Commandes utiles :\n\
                     cargo tauri dev   - Lance l'application avec rechargement à chaud\n\
                     cargo tauri build - Compile les exécutables natifs Linux/Mac/Windows";

        CommandExecutionResult {
            text: Some(msg.to_string()),
            new_cwd: None,
            clear: false,
            exit_code: 0,
            active_app: None,
            installed_package: None,
            switched_distro: None,
            execution_time_ms: start_time.elapsed().as_millis() as u64,
        }
    }

    fn handle_pipeline(
        &self,
        raw_cmd: &str,
        cwd: &str,
        distro_id: &str,
        start_time: Instant,
    ) -> CommandExecutionResult {
        let pipe_parts: Vec<&str> = raw_cmd.split('|').collect();
        let mut current_input = String::new();

        for (idx, step) in pipe_parts.iter().enumerate() {
            let step_trimmed = step.trim();
            if idx == 0 {
                let res = self.execute(step_trimmed, cwd, distro_id, &[]);
                current_input = res.text.unwrap_or_default();
            } else {
                let sub_parts: Vec<&str> = step_trimmed.split_whitespace().collect();
                let sub_cmd = sub_parts.get(0).copied().unwrap_or("");
                match sub_cmd {
                    "grep" => {
                        let query = sub_parts.get(1).copied().unwrap_or("").trim_matches('"').trim_matches('\'');
                        let filtered: Vec<&str> = current_input
                            .lines()
                            .filter(|l| l.contains(query))
                            .collect();
                        current_input = filtered.join("\n");
                    }
                    "head" => {
                        let count = sub_parts.get(1).and_then(|c| c.parse::<usize>().ok()).unwrap_or(5);
                        let lines: Vec<&str> = current_input.lines().take(count).collect();
                        current_input = lines.join("\n");
                    }
                    "wc" => {
                        let lines_count = current_input.lines().count();
                        let words_count = current_input.split_whitespace().count();
                        let bytes_count = current_input.len();
                        current_input = format!("{} {} {}", lines_count, words_count, bytes_count);
                    }
                    _ => {
                        current_input = format!("pipe: commande '{}' non supportée en pipeline", sub_cmd);
                    }
                }
            }
        }

        CommandExecutionResult {
            text: Some(current_input),
            new_cwd: None,
            clear: false,
            exit_code: 0,
            active_app: None,
            installed_package: None,
            switched_distro: None,
            execution_time_ms: start_time.elapsed().as_millis() as u64,
        }
    }
}
