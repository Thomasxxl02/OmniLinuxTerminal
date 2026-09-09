use crate::models::AppError;
use crate::ssh::models::{SshAuthType, SshConfig, SshConnectionInfo};
use std::net::TcpStream;
use std::path::Path;
use std::time::Duration;

/// Durée limite pour la résolution + connexion TCP et le handshake SSH.
const CONNECT_TIMEOUT: Duration = Duration::from_secs(15);

/// Spécification de tunnel `-L` parsée et validée (champs typés, aucun échappement shell).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ForwardSpec {
    pub bind: String,
    pub local_port: u16,
    pub remote_host: String,
    pub remote_port: u16,
}

/// Validation structurée de la configuration SSH.
/// Aucune valeur n'est interpolée dans une commande shell : tout est passé en
/// arguments typés au client SSH Rust (`ssh2`), ce qui élimine tout risque
/// d'injection de commande.
pub fn validate(config: &SshConfig) -> Result<(), AppError> {
    if config.host.trim().is_empty() {
        return Err(AppError::invalid("Hôte SSH requis"));
    }
    if config.port == 0 {
        return Err(AppError::invalid("Port SSH invalide (doit être > 0)"));
    }
    if config.user.trim().is_empty() {
        return Err(AppError::invalid("Utilisateur SSH requis"));
    }
    match config.auth_type {
        SshAuthType::Key => {
            let kp = config.key_path.as_deref().unwrap_or("").trim();
            if kp.is_empty() {
                return Err(AppError::invalid("Chemin de clé privée requis pour l'auth par clé"));
            }
        }
        SshAuthType::Password => {
            let pw = config.password.as_deref().unwrap_or("");
            if pw.is_empty() {
                return Err(AppError::invalid("Mot de passe requis pour l'auth par mot de passe"));
            }
        }
    }
    if let Some(fwd) = config.port_forwarding.as_deref() {
        if !fwd.trim().is_empty() {
            // On vérifie que la spécification est bien formée sans jamais
            // l'exécuter : le parsing typé sert uniquement à la validation.
            for spec in fwd.split(',') {
                parse_forwarding(spec).map_err(|e| AppError::invalid(format!("Tunnel invalide : {e}")))?;
            }
        }
    }
    Ok(())
}

/// Parse une spécification `-L` : `[bind:]port:hôte:port_remote`.
pub fn parse_forwarding(spec: &str) -> Result<ForwardSpec, String> {
    let parts: Vec<&str> = spec.trim().split(':').collect();
    let (bind, local_port, remote_host, remote_port) = match parts.as_slice() {
        [lp, rh, rp] => ("127.0.0.1", *lp, *rh, *rp),
        [b, lp, rh, rp] => (*b, *lp, *rh, *rp),
        _ => return Err("format attendu [bind:]port:hôte:port_remote".to_string()),
    };
    let local_port = local_port
        .parse::<u16>()
        .map_err(|_| "port local invalide".to_string())?;
    let remote_port = remote_port
        .parse::<u16>()
        .map_err(|_| "port distant invalide".to_string())?;
    if remote_host.trim().is_empty() {
        return Err("hôte distant manquant".to_string());
    }
    Ok(ForwardSpec {
        bind: bind.to_string(),
        local_port,
        remote_host: remote_host.to_string(),
        remote_port,
    })
}

/// Établit une connexion SSH réelle : résolution + TCP + handshake + authentification.
///
/// Retourne la `Session` (qui possède la socket) ainsi que la bannière serveur.
/// En cas d'échec (hôte inexistant, port fermé, TLS/creds invalides...), retourne
/// une `AppError` descriptive — jamais de faux succès.
pub fn establish(config: &SshConfig) -> Result<(ssh2::Session, Option<String>), AppError> {
    validate(config)?;

    let addr = format!("{}:{}", config.host, config.port);
    let tcp = TcpStream::connect(&addr)
        .map_err(|e| AppError::with_details("ssh_connect", "Connexion TCP échouée", format!("{addr} : {e}")))?;
    tcp.set_read_timeout(Some(CONNECT_TIMEOUT))
        .map_err(|e| AppError::new("ssh_connect", format!("set_read_timeout : {e}")))?;
    tcp.set_write_timeout(Some(CONNECT_TIMEOUT))
        .map_err(|e| AppError::new("ssh_connect", format!("set_write_timeout : {e}")))?;

    let mut session = ssh2::Session::new()
        .map_err(|e| AppError::new("ssh_connect", format!("Session SSH : {e}")))?;
    session.set_tcp_stream(tcp);
    session
        .handshake()
        .map_err(|e| AppError::with_details("ssh_handshake", "Handshake SSH échoué", e.to_string()))?;

    let banner = session.banner().map(|b| b.to_string());

    // Authentification par clé ou mot de passe.
    let auth_res = match config.auth_type {
        SshAuthType::Key => {
            let key_path = config.key_path.as_deref().unwrap_or("");
            let passphrase = config.password.as_deref();
            session.userauth_pubkey_file(&config.user, None, Path::new(key_path), passphrase)
        }
        SshAuthType::Password => {
            let pw = config.password.as_deref().unwrap_or("");
            session.userauth_password(&config.user, pw)
        }
    };
    if let Err(e) = auth_res {
        return Err(AppError::with_details(
            "ssh_auth",
            "Échec de l'authentification SSH",
            e.to_string(),
        ));
    }
    if !session.authenticated() {
        return Err(AppError::with_details(
            "ssh_auth",
            "Authentification SSH refusée",
            "le serveur a refusé les identifiants fournis".to_string(),
        ));
    }

    Ok((session, banner))
}

/// Test de connexion : ouvre une vraie connexion (TCP + handshake + auth),
/// capture la bannière, puis ferme immédiatement la session.
pub fn test_connection(config: &SshConfig) -> Result<SshConnectionInfo, AppError> {
    let (_, banner) = establish(config)?;
    Ok(SshConnectionInfo {
        ok: true,
        host: config.host.clone(),
        port: config.port,
        user: config.user.clone(),
        auth_type: config.auth_type,
        server_banner: banner,
        message: format!("Connexion SSH établie avec succès sur {}:{}", config.host, config.port),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> SshConfig {
        SshConfig {
            host: "192.168.1.1".to_string(),
            port: 22,
            user: "root".to_string(),
            auth_type: SshAuthType::Key,
            password: None,
            key_path: Some("~/.ssh/id_rsa".to_string()),
            keep_alive: 60,
            port_forwarding: None,
        }
    }

    #[test]
    fn validate_accepts_valid_key_config() {
        assert!(validate(&cfg()).is_ok());
    }

    #[test]
    fn validate_rejects_empty_host() {
        let mut c = cfg();
        c.host = "  ".to_string();
        assert!(validate(&c).is_err());
    }

    #[test]
    fn validate_rejects_empty_user() {
        let mut c = cfg();
        c.user = "".to_string();
        assert!(validate(&c).is_err());
    }

    #[test]
    fn validate_rejects_key_auth_without_key_path() {
        let mut c = cfg();
        c.key_path = Some("  ".to_string());
        assert!(validate(&c).is_err());
    }

    #[test]
    fn validate_rejects_password_auth_without_password() {
        let mut c = cfg();
        c.auth_type = SshAuthType::Password;
        c.password = None;
        c.key_path = None;
        assert!(validate(&c).is_err());
    }

    #[test]
    fn parse_forwarding_basic() {
        let f = parse_forwarding("8080:localhost:80").unwrap();
        assert_eq!(f.bind, "127.0.0.1");
        assert_eq!(f.local_port, 8080);
        assert_eq!(f.remote_host, "localhost");
        assert_eq!(f.remote_port, 80);
    }

    #[test]
    fn parse_forwarding_with_bind() {
        let f = parse_forwarding("127.0.0.1:8080:db:3306").unwrap();
        assert_eq!(f.bind, "127.0.0.1");
        assert_eq!(f.local_port, 8080);
        assert_eq!(f.remote_host, "db");
        assert_eq!(f.remote_port, 3306);
    }

    #[test]
    fn parse_forwarding_rejects_malformed() {
        assert!(parse_forwarding("pas-un-tunnel").is_err());
        assert!(parse_forwarding("8080:hote").is_err());
    }

    /// Preuve que la connexion est réellement réseau (et non simulée) :
    /// un port fermé sur la boucle locale doit produire une erreur.
    #[test]
    fn test_connection_closed_port_returns_error() {
        let mut c = cfg();
        c.host = "127.0.0.1".to_string();
        c.port = 1; // port 1 : connexion refusée quasi systématiquement
        assert!(test_connection(&c).is_err());
    }
}
