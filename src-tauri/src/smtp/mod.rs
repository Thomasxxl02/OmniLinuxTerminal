//! Client SMTP réel (Rust) : validation, sonde de connexion, envoi de test et
//! profils. Toute la logique métier SMTP vit ici, jamais dans le frontend.

pub mod commands;
pub mod models;
pub mod service;
