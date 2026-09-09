use crate::models::AppError;
use crate::ssh::known_hosts::KnownHostsStore;
use crate::ssh::models::{SshConfig, SshConnectionInfo, SshProfile};
use crate::ssh::service;
use chrono::Utc;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::Semaphore;
use uuid::Uuid;

/// Nombre maximal de connexions SSH simultanées (limite de ressource réseau).
const MAX_SSH_CONNECTIONS: usize = 3;

/// Poignée d'une session SSH interactive.
struct InteractiveHandle {
    input: mpsc::Sender<Vec<u8>>,
    shutdown: Arc<AtomicBool>,
    join: Option<std::thread::JoinHandle<()>>,
}

/// Gestionnaire des connexions SSH (test, connexion interactive, profils) et
/// du registre TOFU des clés d'hôte.
///
/// Les secrets (mot de passe) ne transitent que par la config transmise à
/// `connect`/`test`, sont utilisés une fois puis abandonnés : ils ne sont
/// **jamais** écrits sur disque ni renvoyés au frontend.
pub struct SshManager {
    profile_path: PathBuf,
    known_hosts: Mutex<KnownHostsStore>,
    session: Mutex<Option<InteractiveHandle>>,
    conn_slots: Arc<Semaphore>,
}

impl SshManager {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            profile_path: data_dir.join("ssh_profiles.json"),
            known_hosts: Mutex::new(KnownHostsStore::new(data_dir)),
            session: Mutex::new(None),
            conn_slots: Arc::new(Semaphore::new(MAX_SSH_CONNECTIONS)),
        }
    }

    /// Retourne le sémaphore limitant les connexions SSH simultanées.
    pub fn slots(&self) -> Arc<Semaphore> {
        Arc::clone(&self.conn_slots)
    }

    /// Test de connexion : TCP + handshake + auth + vérification TOFU, puis ferme la session.
    pub fn test_connection(&self, config: &SshConfig) -> Result<SshConnectionInfo, AppError> {
        let mut known = self.known_hosts.lock().unwrap();
        let est = service::establish(config, &mut known)?;
        Ok(service::to_info(config, &est))
    }

    /// Établit une **vraie session SSH interactive** : authentifie, ouvre un canal
    /// avec PTY + shell, et streame la sortie vers le frontend (event
    /// `ssh:session-output`) pendant que le frontend envoie les frappes via
    /// `session_write`. Retourne l'info de connexion (dont l'état TOFU).
    pub fn connect(&self, config: &SshConfig, app: AppHandle) -> Result<SshConnectionInfo, AppError> {
        let mut known = self.known_hosts.lock().unwrap();
        let est = service::establish(config, &mut known)?;
        let info = service::to_info(config, &est);

        // Ferme toute session précédente.
        if let Some(old) = self.session.lock().unwrap().take() {
            old.shutdown.store(true, Ordering::Relaxed);
            if let Some(j) = old.join {
                let _ = j.join();
            }
        }

        let interval = (config.keep_alive.max(15) as u64).max(30);
        let (tx, rx) = mpsc::channel::<Vec<u8>>();
        let shutdown = Arc::new(AtomicBool::new(false));
        let flag = shutdown.clone();
        let app2 = app.clone();
        let (ready_tx, ready_rx) = mpsc::channel::<Result<(), String>>();

        let join = std::thread::spawn(move || {
            let session = est.session;
            session.set_blocking(true);
            session.set_keepalive(true, interval as u32);

            // Ouverture du canal interactif (PTY + shell).
            let mut channel = match session.channel_session() {
                Ok(c) => c,
                Err(e) => {
                    let _ = ready_tx.send(Err(e.to_string()));
                    return;
                }
            };
            if let Err(e) = channel.request_pty("xterm", None, None) {
                let _ = ready_tx.send(Err(e.to_string()));
                return;
            }
            if let Err(e) = channel.shell() {
                let _ = ready_tx.send(Err(e.to_string()));
                return;
            }
            let _ = ready_tx.send(Ok(()));

            // Lecture non bloquante (timeout court) pour la boucle interactive.
            session.set_timeout(50);

            let mut buf = [0u8; 8192];
            loop {
                if flag.load(Ordering::Relaxed) {
                    break;
                }
                // Envoi des frappes clavier vers le canal.
                loop {
                    match rx.try_recv() {
                        Ok(chunk) => {
                            if channel.write_all(&chunk).is_err() || channel.flush().is_err() {
                                break;
                            }
                        }
                        Err(mpsc::TryRecvError::Empty) | Err(mpsc::TryRecvError::Disconnected) => break,
                    }
                }
                // Lecture de la sortie distante.
                match channel.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let s = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = app2.emit("ssh:session-output", s);
                    }
                    Err(e)
                        if e.kind() == std::io::ErrorKind::WouldBlock
                            || e.kind() == std::io::ErrorKind::TimedOut => {}
                    Err(_) => break,
                }
                std::thread::sleep(Duration::from_millis(10));
            }
            // channel + session libérés ici.
        });

        // Attend la préparation du canal interactif (sinon on retourne l'erreur).
        let setup = ready_rx
            .recv_timeout(Duration::from_secs(15))
            .map_err(|_| AppError::new("ssh_session", "Délai d'initialisation de la session dépassé"))?;

        match setup {
            Ok(()) => {
                *self.session.lock().unwrap() = Some(InteractiveHandle {
                    input: tx,
                    shutdown,
                    join: Some(join),
                });
            }
            Err(e) => {
                shutdown.store(true, Ordering::Relaxed);
                let _ = join.join();
                return Err(AppError::with_details(
                    "ssh_session",
                    "Échec d'ouverture de la session SSH interactive",
                    e,
                ));
            }
        }

        Ok(info)
    }

    /// Envoie une chaîne de frappes clavier à la session interactive active.
    pub fn session_write(&self, data: Vec<u8>) -> Result<(), AppError> {
        let handle = self.session.lock().unwrap();
        let h = handle
            .as_ref()
            .ok_or_else(|| AppError::new("ssh_session", "Aucune session SSH active"))?;
        h.input
            .send(data)
            .map_err(|_| AppError::new("ssh_session", "Canal de session fermé"))
    }

    /// Ferme la session SSH active (annulation).
    pub fn disconnect(&self) -> Result<(), AppError> {
        if let Some(handle) = self.session.lock().unwrap().take() {
            handle.shutdown.store(true, Ordering::Relaxed);
            if let Some(j) = handle.join {
                let _ = j.join();
            }
        }
        Ok(())
    }

    pub fn is_connected(&self) -> bool {
        self.session.lock().unwrap().is_some()
    }

    // ---------------- profils (non sensibles) ----------------

    pub fn list_profiles(&self) -> Result<Vec<SshProfile>, AppError> {
        self.load_profiles()
    }

    pub fn save_profile(&self, mut profile: SshProfile) -> Result<SshProfile, AppError> {
        if profile.id.is_empty() {
            profile.id = Uuid::new_v4().to_string();
        }
        if profile.name.trim().is_empty() {
            return Err(AppError::invalid("Nom de profil requis"));
        }
        profile.updated_at = Utc::now().to_rfc3339();
        let mut profiles = self.load_profiles().unwrap_or_default();
        if let Some(existing) = profiles.iter_mut().find(|p| p.id == profile.id) {
            *existing = profile.clone();
        } else {
            profiles.push(profile.clone());
        }
        self.store_profiles(&profiles)?;
        Ok(profile)
    }

    pub fn delete_profile(&self, id: &str) -> Result<(), AppError> {
        let mut profiles = self.load_profiles()?;
        profiles.retain(|p| p.id != id);
        self.store_profiles(&profiles)
    }

    fn load_profiles(&self) -> Result<Vec<SshProfile>, AppError> {
        match std::fs::read_to_string(&self.profile_path) {
            Ok(s) if !s.trim().is_empty() => serde_json::from_str(&s)
                .map_err(|e| AppError::new("profile", format!("JSON invalide : {e}"))),
            _ => Ok(Vec::new()),
        }
    }

    fn store_profiles(&self, profiles: &[SshProfile]) -> Result<(), AppError> {
        if let Some(parent) = self.profile_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::new("profile", format!("création répertoire : {e}")))?;
        }
        let json = serde_json::to_string_pretty(profiles)
            .map_err(|e| AppError::new("profile", format!("sérialisation : {e}")))?;
        std::fs::write(&self.profile_path, json)
            .map_err(|e| AppError::new("profile", format!("écriture : {e}")))
    }
}
