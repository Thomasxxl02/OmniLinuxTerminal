//! Client SSH réel (Rust) : validation, connexion, profils et tunnels.
//!
//! Toute la logique métier SSH vit ici, jamais dans le frontend. React
//! transmet un objet `SshConfig` typé et affiche le résultat Rust.

pub mod commands;
pub mod manager;
pub mod models;
pub mod service;
