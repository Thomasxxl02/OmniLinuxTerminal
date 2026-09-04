use crate::distro::{get_distro_by_id, get_supported_distros};
use crate::fs::VirtualFileSystem;
use crate::models::{CommandResult, NodeType, TerminalEffect};
use chrono::Utc;

/// Découpe une ligne de commande en respectant guillemets simples/doubles et
/// échappements backslash. Retourne les tokens (arguments) unitaires.
fn tokenize(input: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut in_single = false;
    let mut in_double = false;
    let mut chars = input.chars().peekable();

    while let Some(c) = chars.next() {
        match c {
            '\'' if !in_double => in_single = !in_single,
            '"' if !in_single => in_double = !in_double,
            '\\' if !in_single => {
                if let Some(&next) = chars.peek() {
                    current.push(next);
                    chars.next();
                } else {
                    current.push('\\');
                }
            }
            c if c.is_whitespace() && !in_single && !in_double => {
                if !current.is_empty() {
                    tokens.push(std::mem::take(&mut current));
                }
            }
            c => current.push(c),
        }
    }
    if !current.is_empty() {
        tokens.push(current);
    }
    tokens
}

/// Exécuteur de commandes shell POSIX universel en Rust.
/// Unique source de vérité (Phase 2) : retourne un `CommandResult` riche,
/// la décision (effets) vient d'ici, React ne fait que le rendu.
pub struct ShellExecutor {
    vfs: VirtualFileSystem,
}

impl ShellExecutor {
    pub fn new(vfs: VirtualFileSystem) -> Self {
        Self { vfs }
    }

    /// Construit un résultat de commande sans erreur (stdout vide, exit 0).
    #[inline]
    fn ok(&self, stdout: impl Into<String>, cwd: &str, effects: Vec<TerminalEffect>) -> CommandResult {
        CommandResult {
            stdout: stdout.into(),
            stderr: String::new(),
            exit_code: 0,
            cwd: cwd.to_string(),
            effects,
        }
    }

    /// Construit un résultat d'erreur (exit 1, message dans stderr).
    #[inline]
    fn err(&self, stderr: impl Into<String>, cwd: &str, exit: i32) -> CommandResult {
        CommandResult {
            stdout: String::new(),
            stderr: stderr.into(),
            exit_code: exit,
            cwd: cwd.to_string(),
            effects: Vec::new(),
        }
    }

    /// Ouvre un éditeur (nano/vim) via un effet.
    fn open_editor(&self, editor: &str, name: &str, cwd: &str) -> CommandResult {
        let path = self.vfs.normalize_path(name, cwd);
        let (content, is_new_file) = match self.vfs.get_node(&path) {
            Some(n) if n.node_type == NodeType::File => (n.content.unwrap_or_default(), false),
            _ => (String::new(), true),
        };
        self.ok(
            "",
            cwd,
            vec![TerminalEffect::OpenEditor {
                editor: editor.to_string(),
                path,
                content: Some(content),
                is_new_file,
            }],
        )
    }

    /// Exécute une commande complète (supporte pipes `|` et redirections `>` `>>`).
    pub fn execute(
        &self,
        raw_cmd: &str,
        cwd: &str,
        distro_id: &str,
        _installed_packages: &[String],
    ) -> CommandResult {
        let trimmed = raw_cmd.trim();

        if trimmed.is_empty() {
            return self.ok("", cwd, vec![]);
        }

        // Commandes spéciales Tauri / Cargo / Rust
        if trimmed == "tauri" || trimmed.starts_with("tauri ") {
            return self.handle_tauri_command(cwd);
        }
        if trimmed == "cargo" || trimmed == "cargo --version" || trimmed.starts_with("cargo ") {
            return self.handle_cargo_command(cwd);
        }
        if trimmed == "rustc" || trimmed == "rustc --version" {
            return self.ok("rustc 1.98.0 (Tauri v2 Native Rust Backend Edition)", cwd, vec![]);
        }

        // Pipeline simple (cmd1 | cmd2)
        if trimmed.contains('|') {
            return self.handle_pipeline(trimmed, cwd, distro_id);
        }

        let parts = tokenize(trimmed);
        if parts.is_empty() {
            return self.ok("", cwd, vec![]);
        }
        let cmd = parts[0].as_str();
        let args: Vec<&str> = parts[1..].iter().map(|s| s.as_str()).collect();
        let args = args.as_slice();

        let distro = get_distro_by_id(distro_id).unwrap_or_else(|| get_supported_distros()[0].clone());
        let user = distro.default_user.clone();
        let host = "omnilinux";

        match cmd {
            "pwd" => self.ok(cwd, cwd, vec![]),

            "whoami" => self.ok(user, cwd, vec![]),

            "hostname" => self.ok(host, cwd, vec![]),

            "date" => self.ok(Utc::now().to_rfc2822(), cwd, vec![]),

            "uptime" => self.ok(" 16:20:00 up 4 days, 12:35, 1 user, load average: 0.15, 0.22, 0.18", cwd, vec![]),

            "clear" => self.ok("", cwd, vec![TerminalEffect::ClearScreen]),

            "cd" => {
                let target = if args.is_empty() { "~" } else { args[0] };
                let new_path = self.vfs.normalize_path(target, cwd);
                match self.vfs.get_node(&new_path) {
                    Some(n) if n.node_type == NodeType::Dir => self.ok("", &new_path, vec![TerminalEffect::SetCwd { cwd: new_path.clone() }]),
                    Some(_) => self.err(format!("cd: pas un dossier: {}", target), cwd, 1),
                    None => self.err(format!("cd: aucun fichier ou dossier de ce type: {}", target), cwd, 1),
                }
            }

            "ls" => {
                let show_all = args.iter().any(|a| a.starts_with('-') && a.contains('a'));
                let show_long = args.iter().any(|a| a.starts_with('-') && a.contains('l'));
                let target_arg = args.iter().find(|a| !a.starts_with('-')).copied().unwrap_or(".");
                let target_path = self.vfs.normalize_path(target_arg, cwd);

                match self.vfs.get_node(&target_path) {
                    Some(n) if n.node_type == NodeType::Dir => {
                        let mut entries = self.vfs.list_dir(&target_path);
                        if !show_all {
                            entries.retain(|e| !e.name.starts_with('.'));
                        }
                        entries.sort_by(|a, b| {
                            let ad = a.node_type == NodeType::Dir;
                            let bd = b.node_type == NodeType::Dir;
                            if ad != bd {
                                return if ad { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater };
                            }
                            a.name.cmp(&b.name)
                        });

                        if show_long {
                            let mut lines: Vec<String> = vec![format!("total {}", entries.len() * 4)];
                            for e in entries {
                                let isdir = e.node_type == NodeType::Dir;
                                let name = if isdir { format!("{}/", e.name) } else { e.name.clone() };
                                lines.push(format!(
                                    "{} {:>2} {:<8} {:<8} {:>6} {} {}",
                                    e.permissions, 1, e.owner, e.group, e.size, e.updated_at, name
                                ));
                            }
                            self.ok(lines.join("\n"), cwd, vec![])
                        } else {
                            let names: Vec<String> = entries
                                .iter()
                                .map(|e| if e.node_type == NodeType::Dir { format!("{}/", e.name) } else { e.name.clone() })
                                .collect();
                            self.ok(names.join("  "), cwd, vec![])
                        }
                    }
                    Some(_) => {
                        let e = self.vfs.get_node(&target_path).unwrap();
                        self.ok(e.name, cwd, vec![])
                    }
                    None => self.err(format!("ls: impossible d'accéder à '{}': Aucun fichier ou dossier de ce nom", target_arg), cwd, 2),
                }
            }

            "cat" => {
                if args.is_empty() {
                    return self.err("cat: argument manquant", cwd, 1);
                }
                let mut combined = Vec::new();
                for target in args {
                    let path = self.vfs.normalize_path(target, cwd);
                    match self.vfs.read_file(&path) {
                        Ok(content) => combined.push(content),
                        Err(e) => return self.err(format!("cat: {}", e), cwd, 1),
                    }
                }
                self.ok(combined.join("\n"), cwd, vec![])
            }

            "head" => {
                if args.is_empty() {
                    return self.err("head: argument manquant", cwd, 1);
                }
                let path = self.vfs.normalize_path(args[0], cwd);
                match self.vfs.read_file(&path) {
                    Ok(content) => self.ok(content.lines().take(10).collect::<Vec<_>>().join("\n"), cwd, vec![]),
                    Err(e) => self.err(format!("head: {}", e), cwd, 1),
                }
            }

            "tail" => {
                if args.is_empty() {
                    return self.err("tail: argument manquant", cwd, 1);
                }
                let path = self.vfs.normalize_path(args[0], cwd);
                match self.vfs.read_file(&path) {
                    Ok(content) => {
                        let lines: Vec<&str> = content.lines().collect();
                        let last: Vec<&str> = if lines.len() > 10 { lines[lines.len() - 10..].to_vec() } else { lines };
                        self.ok(last.join("\n"), cwd, vec![])
                    }
                    Err(e) => self.err(format!("tail: {}", e), cwd, 1),
                }
            }

            "grep" => {
                if args.len() < 2 {
                    return self.err("Usage: grep [motif] [fichier]", cwd, 1);
                }
                let pattern = args[0];
                let path = self.vfs.normalize_path(args[1], cwd);
                match self.vfs.read_file(&path) {
                    Ok(content) => {
                        let matched: Vec<&str> = content
                            .lines()
                            .filter(|l| l.to_lowercase().contains(&pattern.to_lowercase()))
                            .collect();
                        self.ok(matched.join("\n"), cwd, vec![])
                    }
                    Err(e) => self.err(format!("grep: {}", e), cwd, 1),
                }
            }

            "tree" => {
                let mut output = String::new();
                self.build_tree(cwd, &mut output, 0);
                self.ok(output, cwd, vec![])
            }

            "touch" => {
                if args.is_empty() {
                    return self.err("touch: opérande de fichier manquant", cwd, 1);
                }
                for target in args {
                    let path = self.vfs.normalize_path(target, cwd);
                    if self.vfs.get_node(&path).is_none() {
                        let _ = self.vfs.write_file(&path, "", false);
                    }
                }
                self.ok("", cwd, vec![])
            }

            "mkdir" => {
                let targets: Vec<&str> = args.iter().filter(|a| !a.starts_with('-')).copied().collect();
                if targets.is_empty() {
                    return self.err("mkdir: opérande manquant", cwd, 1);
                }
                for target in targets {
                    let path = self.vfs.normalize_path(target, cwd);
                    if let Err(e) = self.vfs.create_dir(&path) {
                        return self.err(format!("mkdir: {}", e), cwd, 1);
                    }
                }
                self.ok("", cwd, vec![])
            }

            "rm" => {
                let recursive = args.iter().any(|a| a.contains('r') || a.contains('R'));
                let targets: Vec<&str> = args.iter().filter(|a| !a.starts_with('-')).copied().collect();
                if targets.is_empty() {
                    return self.err("rm: opérande manquant", cwd, 1);
                }
                for target in targets {
                    let path = self.vfs.normalize_path(target, cwd);
                    if let Err(e) = self.vfs.remove_path(&path, recursive) {
                        return self.err(format!("rm: {}", e), cwd, 1);
                    }
                }
                self.ok("", cwd, vec![])
            }

            "cp" => {
                if args.len() < 2 {
                    return self.err("Usage: cp [source] [destination]", cwd, 1);
                }
                let src = self.vfs.normalize_path(args[0], cwd);
                let dst = self.vfs.normalize_path(args[1], cwd);
                match self.vfs.read_file(&src) {
                    Ok(content) => {
                        let _ = self.vfs.write_file(&dst, &content, false);
                        self.ok("", cwd, vec![])
                    }
                    Err(e) => self.err(format!("cp: {}", e), cwd, 1),
                }
            }

            "mv" => {
                if args.len() < 2 {
                    return self.err("Usage: mv [source] [destination]", cwd, 1);
                }
                let src = self.vfs.normalize_path(args[0], cwd);
                let dst = self.vfs.normalize_path(args[1], cwd);
                match self.vfs.read_file(&src) {
                    Ok(content) => {
                        let _ = self.vfs.write_file(&dst, &content, false);
                        let _ = self.vfs.remove_path(&src, false);
                        self.ok("", cwd, vec![])
                    }
                    Err(e) => self.err(format!("mv: {}", e), cwd, 1),
                }
            }

            "echo" => {
                if trimmed.contains('>') {
                    let is_append = trimmed.contains(">>");
                    let op = if is_append { ">>" } else { ">" };
                    let idx = trimmed.find(op).unwrap();
                    let content_raw = trimmed[5..idx].trim();
                    let mut content = content_raw.trim_matches('"').trim_matches('\'').to_string();
                    content = self.expand_vars(&content, &user, cwd, &distro.name);
                    let target = trimmed[idx + op.len()..].trim();
                    let target_path = self.vfs.normalize_path(target, cwd);
                    let _ = self.vfs.write_file(&target_path, &content, is_append);
                    return self.ok("", cwd, vec![]);
                }
                let mut text = args.join(" ");
                text = text.trim_matches('"').trim_matches('\'').to_string();
                text = self.expand_vars(&text, &user, cwd, &distro.name);
                self.ok(text, cwd, vec![])
            }

            "uname" => {
                let all = args.iter().any(|a| *a == "-a" || *a == "-r");
                let msg = if all {
                    "Linux omnilinux 6.10.8-omni #1 SMP PREEMPT_DYNAMIC Rust x86_64 GNU/Linux (Tauri v2)".to_string()
                } else {
                    "Linux".to_string()
                };
                self.ok(msg, cwd, vec![])
            }

            "neofetch" => {
                let logo = &distro.ascii_logo;
                let info = format!(
                    "{}@omnilinux\n--------------------\nOS: {}\nHost: Tauri v2 Native Desktop Container\nKernel: {}\nUptime: 4 days, 12 hours\nPackages: {} ({})\nShell: bash 5.2.26\nTerminal: OmniLinux Rust VFS v2\nCPU: AMD Ryzen 9 7950X (32) @ 4.500GHz\nMemory: 1840MiB / 32150MiB",
                    user, distro.name, distro.kernel, distro.default_packages.len(), distro.package_manager
                );
                self.ok(format!("{}\n\n{}", logo, info), cwd, vec![])
            }

            "nano" => self.open_editor("nano", args.first().copied().unwrap_or("nouveau.txt"), cwd),
            "vim" | "vi" => self.open_editor("vim", args.first().copied().unwrap_or("nouveau.txt"), cwd),

            "htop" | "top" => self.ok("", cwd, vec![TerminalEffect::LaunchApp { app: "htop".into() }]),
            "cmatrix" | "matrix" => self.ok("", cwd, vec![TerminalEffect::LaunchApp { app: "matrix".into() }]),
            "sl" => self.ok("", cwd, vec![TerminalEffect::LaunchApp { app: "sl".into() }]),

            "apt" | "apt-get" | "dnf" | "yum" | "apk" | "zypper" => self.package_manager(cmd, args, &distro, cwd),
            "pacman" => self.package_manager(cmd, args, &distro, cwd),

            "distro" => self.distro_command(args, &distro, cwd),

            "help" | "man" => self.ok(
                "===============================================================\n\
                 COMMANDES DISPONIBLES DANS OMNILINUX\n\
                 ===============================================================\n\
                 \n\
                 Noyau & Fichiers:\n\
                   ls, cd, pwd, cat, head, tail, grep, tree, touch, mkdir, rm, cp, mv, echo\n\
                 \n\
                 Système & Stats:\n\
                   whoami, hostname, uname, date, uptime, neofetch, htop, top, clear\n\
                 \n\
                 Gestionnaires de Paquets (Simulés):\n\
                   apt, apt-get, pacman, dnf, yum, apk, zypper\n\
                 \n\
                 Éditeurs de Texte Interactifs:\n\
                   nano <fichier>   : Ouvre l'éditeur Nano\n\
                   vim <fichier>    : Ouvre l'éditeur Vim\n\
                 \n\
                 Distribution:\n\
                   distro           : Liste et change la distribution Linux\n\
                 \n\
                 Animations & Tauri:\n\
                   cmatrix, sl, tauri, cargo, rustc",
                cwd,
                vec![],
            ),

            _ => self.err(
                format!("{}: commande introuvable. Tapez 'help' pour la liste.", cmd),
                cwd,
                127,
            ),
        }
    }

    fn build_tree(&self, dir: &str, output: &mut String, depth: usize) {
        if depth == 0 {
            output.push_str(&format!("{}\n", dir));
        }
        let entries = self.vfs.list_dir(dir);
        for (idx, e) in entries.iter().enumerate() {
            let is_last = idx == entries.len() - 1;
            let prefix = if depth == 0 {
                if is_last { "└── " } else { "├── " }
            } else {
                if is_last { "    └── " } else { "    ├── " }
            };
            output.push_str(&format!("{}{}{}\n", prefix, e.name, if e.node_type == NodeType::Dir { "/" } else { "" }));
            if e.node_type == NodeType::Dir {
                self.build_tree(&e.path, output, depth + 1);
            }
        }
    }

    fn expand_vars(&self, text: &str, user: &str, cwd: &str, distro_name: &str) -> String {
        text.replace("$USER", user)
            .replace("$SHELL", "bash")
            .replace("$PWD", cwd)
            .replace("$HOME", "/home/user")
            .replace("$DISTRO", distro_name)
    }

    fn package_manager(&self, mgr: &str, args: &[&str], distro: &crate::models::DistroInfo, cwd: &str) -> CommandResult {
        let sub = args.first().copied().unwrap_or("");
        if sub == "update" || sub == "refresh" || sub == "-Syu" {
            return self.ok(
                format!("[+] Mise à jour des dépôts logiciels pour {}...\nRécupération des index... Fait\nTous les paquets sont à jour.", distro.name),
                cwd,
                vec![],
            );
        }
        if sub == "install" || sub == "add" || sub == "-S" || sub == "-Sy" || sub == "in" {
            let pkg = args.get(1).copied().unwrap_or("logiciel");
            return self.ok(
                format!(
                    "Lecture des listes de paquets... Fait\nConstruction de l'arbre des dépendances... Fait\nLes paquets suivants seront installés:\n  {}\n0 mis à jour, 1 nouvellement installé, 0 à enlever.\nDépaquetage de {}... Fait\n[+] {} installé avec succès sur {}!",
                    pkg, pkg, pkg, distro.name
                ),
                cwd,
                vec![TerminalEffect::InstallPackage { package: pkg.to_string() }],
            );
        }
        self.ok(
            format!("Gestionnaire de paquets {} (Distribution: {})\nUsage: {} <install|update|search> <paquet>", mgr, distro.name, mgr),
            cwd,
            vec![],
        )
    }

    fn distro_command(&self, args: &[&str], distro: &crate::models::DistroInfo, cwd: &str) -> CommandResult {
        if args.is_empty() {
            let mut msg = format!("Distribution actuelle : {} ({})\n\nDistributions disponibles :\n", distro.name, distro.version);
            for d in get_supported_distros() {
                let marker = if d.id == distro.id { " [ACTUELLE]" } else { "" };
                msg.push_str(&format!("  • {:<10} : {}{}\n", d.id, d.name, marker));
            }
            msg.push_str("\nPour changer : distro <nom> (ex: distro arch, distro kali)");
            return self.ok(msg, cwd, vec![]);
        }
        let requested = args[0].to_lowercase();
        match get_supported_distros().into_iter().find(|d| d.id == requested || d.name.to_lowercase().contains(&requested)) {
            Some(target) => self.ok(
                format!("[+] Basculement vers la distribution {} !\n[+] Kernel: {}\n[+] Gestionnaire de paquets : {}\nTapez 'neofetch' pour les détails.", target.name, target.kernel, target.package_manager),
                cwd,
                vec![TerminalEffect::SwitchDistro { distro_id: target.id.clone() }],
            ),
            None => self.err(format!("Distribution '{}' introuvable. Tapez 'distro' pour la liste.", args[0]), cwd, 1),
        }
    }

    fn handle_tauri_command(&self, cwd: &str) -> CommandResult {
        let msg = format!(
            "🦀 OmniLinux Terminal - Backend Rust & Tauri v2\n================================================\n• Framework : Tauri v2.0 (IPC haute vitesse bidirectionnel)\n• Backend   : Rust 1.98 (VFS POSIX, Shell Executor, Routeur IA)\n• Nœuds VFS : {} fichiers & dossiers\n• Sécurité  : Sandboxing des capacités Tauri v2 (capabilities/default.json)\n\nTapez 'cargo --version' pour plus d'infos.",
            self.vfs.total_nodes()
        );
        self.ok(msg, cwd, vec![])
    }

    fn handle_cargo_command(&self, cwd: &str) -> CommandResult {
        self.ok(
            "cargo 1.98.0 (Tauri v2 Workspace)\nCommande utiles :\n  cargo tauri dev   - Lance l'application avec rechargement à chaud\n  cargo tauri build - Compile les exécutables natifs Linux/Mac/Windows",
            cwd,
            vec![],
        )
    }

    fn handle_pipeline(&self, raw_cmd: &str, cwd: &str, distro_id: &str) -> CommandResult {
        let mut current_input = String::new();
        for (idx, step) in raw_cmd.split('|').enumerate() {
            let step = step.trim();
            if idx == 0 {
                let res = self.execute(step, cwd, distro_id, &[]);
                current_input = res.stdout;
            } else {
                let sub_parts: Vec<&str> = step.split_whitespace().collect();
                let sub_cmd = sub_parts.first().copied().unwrap_or("");
                match sub_cmd {
                    "grep" => {
                        let query = sub_parts.get(1).copied().unwrap_or("").trim_matches('"').trim_matches('\'');
                        current_input = current_input.lines().filter(|l| l.contains(query)).collect::<Vec<_>>().join("\n");
                    }
                    "head" => {
                        let count = sub_parts.get(1).and_then(|c| c.parse::<usize>().ok()).unwrap_or(5);
                        current_input = current_input.lines().take(count).collect::<Vec<_>>().join("\n");
                    }
                    "wc" => {
                        let lines = current_input.lines().count();
                        let words = current_input.split_whitespace().count();
                        let bytes = current_input.len();
                        current_input = format!("{} {} {}", lines, words, bytes);
                    }
                    _ => current_input = format!("pipe: commande '{}' non supportée en pipeline", sub_cmd),
                }
            }
        }
        self.ok(current_input, cwd, vec![])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn executor() -> ShellExecutor {
        ShellExecutor::new(VirtualFileSystem::new())
    }

    #[test]
    fn pwd_and_cd() {
        let ex = executor();
        let r = ex.execute("pwd", "/home/user", "ubuntu", &[]);
        assert_eq!(r.stdout, "/home/user");
        assert_eq!(r.exit_code, 0);

        let r = ex.execute("cd /tmp", "/home/user", "ubuntu", &[]);
        assert_eq!(r.cwd, "/tmp");
        assert!(r.effects.contains(&TerminalEffect::SetCwd { cwd: "/tmp".into() }));
    }

    #[test]
    fn clear_and_launch_app() {
        let ex = executor();
        let r = ex.execute("clear", "/home/user", "ubuntu", &[]);
        assert!(r.effects.contains(&TerminalEffect::ClearScreen));

        let r = ex.execute("htop", "/home/user", "ubuntu", &[]);
        assert!(r.effects.contains(&TerminalEffect::LaunchApp { app: "htop".into() }));
    }

    #[test]
    fn nano_opens_editor() {
        let ex = executor();
        let r = ex.execute("nano", "/home/user", "ubuntu", &[]);
        assert!(r.effects.iter().any(|e| matches!(e, TerminalEffect::OpenEditor { is_new_file: true, .. })));
    }

    #[test]
    fn install_package_effect() {
        let ex = executor();
        let r = ex.execute("apt install htop", "/home/user", "ubuntu", &[]);
        assert!(r.effects.contains(&TerminalEffect::InstallPackage { package: "htop".into() }));
    }

    #[test]
    fn echo_redirection_writes_file() {
        let ex = executor();
        let _ = ex.execute("echo hello > /home/user/test.txt", "/home/user", "ubuntu", &[]);
        let r = ex.execute("cat /home/user/test.txt", "/home/user", "ubuntu", &[]);
        assert_eq!(r.stdout.trim(), "hello");
    }

    #[test]
    fn echo_expands_variables() {
        let ex = executor();
        // $USER est développé vers le default_user de la distribution (ici "user").
        let r = ex.execute("echo $USER", "/home/user", "ubuntu", &[]);
        assert_eq!(r.stdout.trim(), "user");
    }

    #[test]
    fn unknown_command_exit_127() {
        let ex = executor();
        let r = ex.execute("boguscmd", "/home/user", "ubuntu", &[]);
        assert_eq!(r.exit_code, 127);
        assert!(r.stderr.contains("commande introuvable"));
    }

    #[test]
    fn tokenize_respects_quotes_and_escapes() {
        assert_eq!(tokenize("echo \"hello world\" foo"), vec!["echo", "hello world", "foo"]);
        assert_eq!(tokenize("echo 'a b' c"), vec!["echo", "a b", "c"]);
        assert_eq!(tokenize("echo a\\ b"), vec!["echo", "a b"]);
    }

    #[test]
    fn echo_quoted_argument_is_one_token() {
        let ex = executor();
        let r = ex.execute("echo \"hello world\"", "/home/user", "ubuntu", &[]);
        assert_eq!(r.stdout.trim(), "hello world");
    }
}
