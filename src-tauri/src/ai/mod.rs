use crate::models::{AiGenerateRequest, AiGenerateResponse};

pub mod commands;
pub mod service;

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

    /// Prompt système pour la génération de commande (persona + contexte).
    pub fn build_generate_prompt(persona: &str, distro: &str, current_dir: &str) -> String {
        let persona_note = match persona {
            "educational" => {
                "Adopte une approche pédagogique, explique le rôle de chaque flag et argument pour faciliter l'apprentissage."
            }
            "security" => {
                "Accorde une attention critique à la sécurité, analyse les privilèges nécessaires et mentionne les risques potentiels."
            }
            _ => "Réponds avec concision et précision chirurgicale de niveau SysAdmin/DevOps senior.",
        };
        format!(
            "Tu es un expert Linux. Distribution: \"{}\", répertoire courant: \"{}\".\n{}\n\
             Convertis la demande en français ou anglais vers la commande bash exacte appropriée pour sa distribution.\n\
             Fournis un résultat JSON structuré avec:\n\
             - \"command\": La commande Bash exacte prête à être exécutée.\n\
             - \"explanation\": Une brève explication en français (2-3 phrases) de ce que fait la commande.\n\
             - \"tips\": Un ou deux conseils utiles ou drapeaux importants.\n\
             Réponds UNIQUEMENT sous forme de JSON valide.",
            distro, current_dir, persona_note
        )
    }

    /// Prompt système pour expliquer une commande.
    pub fn build_explain_prompt(persona: &str, distro: &str, command: &str) -> String {
        let persona_note = match persona {
            "educational" => "Détaille pédagogiquement chaque partie pour un utilisateur en cours d'apprentissage.",
            "security" => "Évalue avec une vigilance accrue la criticité root, les impacts sur le système de fichiers et la sécurité.",
            _ => "Fournis une analyse technique claire et concise.",
        };
        format!(
            "Tu es un expert en ligne de commande Linux. {}\n\
             Analyse la commande suivante pour la distribution \"{}\": `{}`.\n\
             Fournis une explication détaillée en français avec:\n\
             - \"summary\": Résumé rapide en 1-2 phrases.\n\
             - \"breakdown\": Un tableau d'éléments décrivant chaque partie, option/drapeau et argument.\n\
             - \"safety\": Risque potentiel (Faible, Moyen, Élevé) si exécuté avec privilèges root.\n\
             - \"example\": Un exemple concret d'utilisation.\n\
             Réponds au format JSON avec les clés \"summary\", \"breakdown\" (liste de {{part, description}}), \"safety\", \"example\".",
            persona_note, distro, command
        )
    }

    /// Prompt système pour déboguer une erreur.
    pub fn build_debug_prompt() -> String {
        "Tu es un assistant de débogage pour terminal Linux.\n\
         Analyse l'erreur ci-dessus et explique en français:\n\
         1. Pourquoi cette erreur s'est produite.\n\
         2. La solution exacte ou la commande corrigée.\n\
         Fournis un objet JSON avec \"cause\", \"solution\", \"correctedCommand\"."
            .to_string()
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

    /// Générateur de règles de complétion (hors-ligne, utilisé en fallback console)
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
            tips: None,
            warnings,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safety_detects_dangerous_commands() {
        assert!(AiEngine::check_safety("rm -rf /").is_some());
        assert!(AiEngine::check_safety("sudo mkfs /dev/sda1").is_some());
        assert!(AiEngine::check_safety("ls -la").is_none());
    }
}
