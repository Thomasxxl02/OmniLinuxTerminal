use crate::models::{AiGenerateRequest, AiGenerateResponse};

/// Moteur de Copilote IA et de validation de sécurité en Rust
pub struct AiEngine;

impl AiEngine {
    /// Analyse et vérifie les risques d'une commande shell (Garde-fou Sécurité)
    pub fn check_safety(cmd: &str) -> Option<String> {
        let lower = cmd.to_lowercase();
        if lower.contains("rm -rf /") || lower.contains("rm -rf /*") {
            return Some("DANGER CRITIQUE: Tentative de suppression récursive de la racine (/).".to_string());
        }
        if lower.contains(":(){ :|:& };:") {
            return Some("ALERTE: Fork-bomb détectée, risque de saturation des ressources du système.".to_string());
        }
        if lower.contains("mkfs") && lower.contains("/dev/") {
            return Some("ATTENTION: Formatage de bloc disque détecté.".to_string());
        }
        if lower.contains("> /dev/sda") || lower.contains("> /dev/nvme") {
            return Some("DANGER: Écriture directe sur un périphérique de stockage bloc.".to_string());
        }
        None
    }

    /// Génère le prompt système contextualisé selon le profil (Persona)
    pub fn build_system_prompt(persona: &str, distro: &str) -> String {
        let base = format!(
            "Tu es l'assistant DevOps et administrateur système Linux OmniLinux. \
             Distribution cible : {}. \
             Tu réponds uniquement avec la commande bash exacte, la plus moderne, sûre et efficace. \
             Explique succinctement chaque option et drapeau utilisé.",
            distro
        );

        match persona {
            "educational" => format!(
                "{} Adopte un ton très pédagogique, décompose chaque argument pour un débutant Linux.",
                base
            ),
            "security" => format!(
                "{} Adopte un profil d'auditeur sécurité strict. Vérifie les moindres privilèges (sudo/root) et l'impact disque.",
                base
            ),
            _ => format!(
                "{} Adopte un profil Senior SRE / DevOps. Direct, concis, privilégie les one-liners fiables.",
                base
            ),
        }
    }

    /// Générateur de règles de complétion
    pub fn generate_fallback(req: &AiGenerateRequest) -> AiGenerateResponse {
        let p = req.prompt.to_lowercase();
        let distro = req.distro.as_deref().unwrap_or("ubuntu");

        let (cmd, exp) = if p.contains("disque") || p.contains("espace") || p.contains("taille") {
            (
                "df -h | grep -E '^/dev/'".to_string(),
                "Affiche l'espace disque utilisé et disponible en unités lisibles (-h) pour les systèmes de fichiers physiques.".to_string(),
            )
        } else if p.contains("mémoire") || p.contains("ram") {
            (
                "free -m -h".to_string(),
                "Affiche la mémoire vive (RAM) et swap utilisée et disponible en Mo et format lisible.".to_string(),
            )
        } else if p.contains("processus") || p.contains("cpu") {
            (
                "ps aux --sort=-%mem | head -n 10".to_string(),
                "Liste les 10 processus consommant le plus de mémoire vive sur le système.".to_string(),
            )
        } else if p.contains("docker") {
            if distro == "arch" {
                (
                    "sudo pacman -S docker docker-compose && sudo systemctl enable --now docker".to_string(),
                    "Installe le service Docker et son orchestrateur compose avec pacman sous Arch Linux.".to_string(),
                )
            } else {
                (
                    "sudo apt update && sudo apt install -y docker.io && sudo systemctl enable --now docker".to_string(),
                    "Met à jour le catalogue apt et installe le démon conteneur Docker sous Ubuntu/Debian.".to_string(),
                )
            }
        } else if p.contains("rechercher") || p.contains("trouver") {
            (
                "find . -type f -name \"*.log\" -mtime -7".to_string(),
                "Recherche tous les fichiers de journalisation .log modifiés au cours des 7 derniers jours.".to_string(),
            )
        } else {
            (
                format!("echo \"[Copilote Rust] Demande traitée : {}\"", req.prompt),
                "Commande générée selon les standards POSIX par le moteur Rust Tauri v2.".to_string(),
            )
        };

        let warnings = Self::check_safety(&cmd);

        AiGenerateResponse {
            command: cmd,
            explanation: exp,
            warnings,
        }
    }
}
