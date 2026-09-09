use crate::models::AppError;
use crate::ssh::known_hosts::{sha256_hex, KnownHostsStore};
use crate::ssh::models::{HostKeyStatus, SshAuthType, SshConfig, SshConnectionInfo};
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

/// Session SSH établie, avec les informations de clé d'hôte (TOFU).
pub struct Established {
    pub session: ssh2::Session,
    pub banner: Option<String>,
    pub host_key_fingerprint: Option<String>,
    pub host_key_status: HostKeyStatus,
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

/// Établit une connexion SSH réelle : résolution + TCP + handshake + auth,
/// puis **vérifie la clé d'hôte en mode TOFU** (enregistre au 1er usage, compare
/// ensuite, rejette si modifiée sauf override `allow_unknown_host_key`).
///
/// Retourne la `Session` (qui possède la socket), la bannière et l'état TOFU.
pub fn establish(
    config: &SshConfig,
    known_hosts: &mut KnownHostsStore,
) -> Result<Established, AppError> {
    validate(config)?;

    let addr = format!("{}:{}", config.host, config.port);
    let tcp = TcpStream::connect(&addr).map_err(|e| {
        AppError::with_details(
            "ssh_connect",
            "Connexion TCP échouée",
            format!("{addr} : {e}"),
        )
    })?;
    tcp.set_read_timeout(Some(CONNECT_TIMEOUT))
        .map_err(|e| AppError::new("ssh_connect", format!("set_read_timeout : {e}")))?;
    tcp.set_write_timeout(Some(CONNECT_TIMEOUT))
        .map_err(|e| AppError::new("ssh_connect", format!("set_write_timeout : {e}")))?;

    let mut session = ssh2::Session::new()
        .map_err(|e| AppError::new("ssh_connect", format!("Session SSH : {e}")))?;
    session.set_tcp_stream(tcp);
    session.handshake().map_err(|e| {
        AppError::with_details("ssh_handshake", "Handshake SSH échoué", e.to_string())
    })?;

    let banner = session.banner().map(|b| b.to_string());

    // --- Vérification TOFU de la clé d'hôte ---
    // host_key() retourne (blob_clé, HostKeyType) — on hache le blob.
    let fingerprint = session.host_key().map(|(bytes, _t)| sha256_hex(bytes));
    let host_key_status = match &fingerprint {
        // TOFU : on enregistre au 1er usage, on compare ensuite, on rejette si
        // modifiée SAUF si l'utilisateur autorise expressément les clés inconnues.
        Some(fp) => {
            let status = known_hosts.check(&config.host, config.port, fp);
            if status == HostKeyStatus::Changed && !config.allow_unknown_host_key {
                return Err(AppError::with_details(
                    "ssh_host_key",
                    "Clé d'hôte SSH différente de celle enregistrée",
                    format!(
                        "Risque d'attaque de l'homme du milieu sur {}:{}. Cochez \
                         « autoriser les clés inconnues » si vous faites confiance.",
                        config.host, config.port
                    ),
                ));
            }
            status
        }
        None if config.allow_unknown_host_key => HostKeyStatus::New,
        None => {
            return Err(AppError::new(
                "ssh_host_key",
                "Impossible de récupérer la clé d'hôte du serveur",
            ))
        }
    };

    // --- Authentification par clé ou mot de passe ---
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

    Ok(Established {
        session,
        banner,
        host_key_fingerprint: fingerprint,
        host_key_status,
    })
}

/// Construit le `SshConnectionInfo` à partir d'une session établie.
pub fn to_info(config: &SshConfig, est: &Established) -> SshConnectionInfo {
    SshConnectionInfo {
        ok: true,
        host: config.host.clone(),
        port: config.port,
        user: config.user.clone(),
        auth_type: config.auth_type,
        server_banner: est.banner.clone(),
        host_key_fingerprint: est.host_key_fingerprint.clone(),
        host_key_status: est.host_key_status,
        message: format!(
            "Connexion SSH établie avec succès sur {}:{}",
            config.host, config.port
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ssh::known_hosts::KnownHostsStore;

    fn store() -> KnownHostsStore {
        let dir = std::env::temp_dir().join(format!("ssh_test_{}", uuid::Uuid::new_v4()));
        KnownHostsStore::new(&dir)
    }

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
            allow_unknown_host_key: false,
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
    fn parse_forwarding_rejects_malformed() {
        assert!(parse_forwarding("pas-un-tunnel").is_err());
        assert!(parse_forwarding("8080:hote").is_err());
    }

    /// Preuve que la connexion est réellement réseau : un port fermé doit échouer.
    #[test]
    fn establish_closed_port_returns_error() {
        let mut c = cfg();
        c.host = "127.0.0.1".to_string();
        c.port = 1;
        let mut s = store();
        assert!(establish(&c, &mut s).is_err());
    }

    /// Preuve d'une **vraie session SSH interactive** (PTY + shell) : on se
    /// connecte au sshd local jetable, on ouvre un shell, on envoie `echo` et on
    /// lit la sortie. Ignoré par défaut (nécessite un sshd sur 127.0.0.1:2223).
    /// Activation : `cargo test -- --ignored ssh::service::tests::interactive_pty_roundtrip`.
    #[test]
    #[ignore]
    fn interactive_pty_roundtrip_against_local_sshd() {
        use std::io::{Read, Write};
        use std::time::Duration;

        let mut s = store();
        let cfg = SshConfig {
            host: "127.0.0.1".to_string(),
            port: 2223,
            user: "sshtest".to_string(),
            auth_type: SshAuthType::Key,
            password: None,
            key_path: Some("/tmp/sshtest/client".to_string()),
            keep_alive: 60,
            port_forwarding: None,
            allow_unknown_host_key: false,
        };

        let est = establish(&cfg, &mut s).expect("establish doit réussir sur le sshd local");
        // 1er usage → TOFU enregistré + accepté.
        assert_eq!(est.host_key_status, HostKeyStatus::New);

        est.session.set_blocking(true);
        // Timeout court pour une lecture non bloquante.
        est.session.set_timeout(200);
        let mut ch = est.session.channel_session().expect("channel");
        ch.request_pty("xterm", None, None).expect("pty");
        ch.shell().expect("shell");
        ch.write_all(b"echo SSHRUST_OK\n").expect("write");
        ch.flush().expect("flush");

        let mut out = String::new();
        let mut buf = [0u8; 4096];
        for _ in 0..100 {
            match ch.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => out.push_str(&String::from_utf8_lossy(&buf[..n])),
                Err(e)
                    if e.kind() == std::io::ErrorKind::WouldBlock
                        || e.kind() == std::io::ErrorKind::TimedOut =>
                {
                    std::thread::sleep(Duration::from_millis(50));
                }
                Err(_) => break,
            }
            if out.contains("SSHRUST_OK") {
                break;
            }
        }
        assert!(out.contains("SSHRUST_OK"), "sortie du shell attendue, obtenu : {out}");
    }
}
