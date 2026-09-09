# OmniLinuxTerminal — Migration 100 % Rust : plan complet

> Plan de refonte cible : React ne garde que le rendu/DOM/état éphémère ; tout le
> métier (décisions, transformations, persistance, validation, réseau) vit en Rust.
> Document versionné dans le repo ; sert de référentiel pour les phases.

---

## 0. Règle explicite (à graver dans AGENTS.md / CONTRIBUTING)

> **Si une fonction peut être testée sans navigateur, elle appartient au backend Rust.**

React/TypeScript conserve **quatre responsabilités** : afficher les données fournies par
Rust, capturer les actions utilisateur, invoquer une commande Tauri **typée**, afficher
les événements émis par Rust.

**Classification de référence :**
| Catégorie | Destination |
|---|---|
| Composants, animations, focus, dimensions | React |
| Commandes, fichiers, IA, sécurité, distributions | Rust |
| État persistant et configuration | Rust |
| Types échangés | Rust, puis types TS générés |

---

## 1. État actuel (inventaire réel)

### React — `src/` (9 161 lignes)
- Rendu/composants : `components/*` (~6 300) — MenuBar 2707, AiConfigModal 1164, TauriArchitectureModal 628, AiCopilotDrawer 413, TerminalView 279, ThemeSelectorModal 224, TerminalHeader 201, HtopMonitor 165, VimEditor 130, DistroInfoModal 128, HelpModal 125, NanoEditor 120, AboutModal 88, CmatrixCanvas 74, SlAnimation 57.
- État de session : `App.tsx` (683).
- Orchestration : `lib/commandExecutor.ts` (668), `lib/filesystem.ts` (484), `lib/tauriBridge.ts` (147), `lib/soundEffects.ts` (125).
- Données : `data/distros.ts` (276), `data/themes.ts` (110).
- Types : `types.ts` (155).

### Rust — `src-tauri/src/` — source de vérité (« Rust décide, React affiche »)
`terminal/mod.rs` (ShellExecutor) · `fs/mod.rs` (VirtualFileSystem POSIX) · `distro/mod.rs` (catalogue des 10 distros) · `ai/service.rs` + `ai/commands.rs` (providers IA réels multi-fournisseurs : Gemini, Anthropic, OpenAI-compatible, DashScope, OpenRouter, Ollama, custom + 4 commandes async `ai_test`/`ai_generate`/`ai_explain`/`ai_debug`) · `ai/mod.rs` (AiEngine, garde-fou sécurité + prompts) · `ssh/` + `smtp/` (connexions réseau réelles) · `lib.rs` (enregistrement des commandes) · `models.rs` (DTOs serde/specta) · `system/mod.rs`.

✅ **`server.ts` (Express) supprimé** — l'IA vit désormais dans `ai/service.rs` / `ai/commands.rs`. Plus de serveur local ni de dépendances Express/`@google/genai`/`dotenv` ; les 4 appels IA passent par IPC Tauri (clé API en mémoire, jamais persistée).

---

## 2. Incohérences détectées (signal de la Phase 1)
1. **VFS dupliqué** : `lib/filesystem.ts` (VirtualFS + localStorage) vs `src-tauri/src/fs`.
2. **Distro dupliquée** : `data/distros.ts` vs `distro/mod.rs`.
3. **IA multi-fournisseurs** : unifiée en Rust (`ai/service.rs` + `ai/commands.rs`), `server.ts` supprimé ; `ai/mod.rs` conserve `generate_fallback` comme suggestion hors-ligne console.
4. **Types dupliqués** : `types.ts` manuel vs `models.rs` (serde).
5. ✅ **Clés API jamais persistées** : la config IA est sauvegardée en `localStorage` sans `apiKeys`/`customApiKey` (secrets en mémoire, règle « secrets never persisted »).
6. ✅ **Plus aucune donnée simulée** : `tauriBridge.handleBridgeCall` retourne `null` (dégradation honnête) ; les fausses données système/IA en dur ont été retirées.

---

## 3. API IPC stable (contrat cible)

Commandes Tauri typées, source = Rust, types TS **générés** (specta/tauri-specta) :

```
terminal_execute          fs_read        distro_switch      system_get_telemetry
terminal_complete         fs_write       distro_get_current session_export
terminal_get_history      fs_list        package_install    session_import
await fs_remove           ai_generate    ai_test
fs_export                 ai_explain     settings_get
fs_import                 ai_debug       settings_update
```

Structure riche exposée par Rust (source de vérité) :

```rust
pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub cwd: String,
    pub effects: Vec<TerminalEffect>,
}
```
`TerminalEffect` demande au frontend d'ouvrir un éditeur, effacer l'écran, afficher une app… **La décision vient de Rust ; React ne fait que le rendu.**

---

## 4. Roadmap — 12 phases

### Phase 1 — Poser les frontières ✅ (ce document)
Règle + classification + contrat IPC défini. Attendu : aucun code métier testable-hors-navigateur dans React.

### Phase 2 — Unifier le moteur de terminal
`commandExecutor.ts` **disparaît**. Le Rust devient l'unique source pour : découpage d'arguments, guillemets/échappements, variables d'env, chemins relatifs/absolus, redirections `>` et `>>`, pipelines, codes de sortie, `cd`, commandes internes, lancement d'apps visuelles (nano/vim/htop/cmatrix), installation simulée de paquets, changement de distribution.

### Phase 3 — Migrer entièrement le VFS
Supprimer `filesystem.ts` + localStorage. Rust gère : création initiale, normalisation, fichiers/dossiers, métadonnées POSIX, lecture/écriture, suppression récursive, copie/déplacement, recherche, permissions, `/etc/os-release`, import/export/réinitialisation, **persistance entre lancements**. JSON versionné dans le répertoire de données app (SQLite si grosse). Structure persistante avec **numéro de version** pour migrations.

### Phase 4 — Rendre les éditeurs passifs
`NanoEditor.tsx` / `VimEditor.tsx` n'importent plus le VFS. Flux : Rust ouvre→React affiche→l'utilisateur modifie→React transmet→Rust valide (chemin/permissions) et enregistre→Rust renvoie le fichier ou une erreur structurée. Raccourcis/mouvements de curseur = React (interface).

### Phase 5 — Déplacer toute l'IA dans Rust
Supprimer Express + routes `/api/ai/*`. Module Rust `AiProvider` (trait) : client Gemini réel, éventuellement un client par fournisseur réel, validation des modèles, construction des instructions système, validation JSON, timeouts/annulations, erreurs structurées, contrôle de sécurité des commandes proposées.
**Plus de Gemini déguisé en Claude/GPT/DeepSeek/Mistral.** Chaque choix = fournisseur réel, ou explicitement « persona Gemini ». **Clés API dans le coffre sécurisé système** (jamais localStorage ni état React).

### Phase 6 — Centraliser la sécurité
Module `security` Rust : classifier les commandes, détecter les opérations destructrices, analyser redirections/pipelines, reconnaître `sudo`, `sh -c`, variables, espaces inhabituels, contrôler les chemins du VFS, décider si confirmation requise, filtrer les commandes IA. **Après le découpage syntaxique** (pas des recherches de chaînes).
```rust
pub enum RiskLevel { Safe, Caution, Dangerous, Blocked }
pub struct SafetyAssessment { pub level: RiskLevel, pub reasons: Vec<String>, pub requires_confirmation: bool }
```

### Phase 7 — Déplacer sessions et paramètres
Rust propriétaire de : historique de commandes, distribution active, paquets installés, onglets restaurables, config IA, thème (si persisté), préférences utilisateur, sauvegardes/restaurations. React = onglet visible temporaire ; **Rust = état persistant canonique**.

### Phase 8 — Générer les contrats TypeScript
specta + tauri-specta. Ne plus maintenir les types à deux endroits. IPC typé, erreurs cohérentes, suppression des `any`, détection des ruptures d'API au compile. `tauriBridge.ts` remplacé par un client généré très mince (zéro simulation).

### Phase 9 — Supprimer les simulations frontend
Retirer : fausses latences IPC, versions Rust codées en dur, faux processus, fausse télémétrie, VFS miroir, réponses de commandes locales, métadonnées distro dupliquées. Le mode navigateur est supprimé **ou** utilise un vrai backend Rust séparé — jamais de simulation silencieuse du natif.

### Phase 10 — Découper l'interface React
MenuBar → menus fonctionnels ; App → composition + hooks d'interface ; hook `useTerminalSession` ; hook `useTauriEvents` ; composants d'affichage sans logique métier. Frontend nettement plus petit.

### Phase 11 — Tests Rust
Unitaires : normalisation chemins, permissions VFS, écriture/ajout, suppression récursive, parseur de commandes, variables/guillemets, redirections/pipelines, paquets par distro, classification sécurité, validation réponses IA, migrations de données. Intégration : commande Tauri→service→sérialisé, séquence terminal, sauvegarde/restauration session, changement de distro, ouverture/sauvegarde fichier depuis éditeur.

### Phase 12 — Durcir et valider
Retirer `unsafe-eval` de la CSP ; limiter `connect-src` ; supprimer Express + deps Node inutiles ; vérifier permissions Tauri ; `cargo fmt` + `cargo clippy -D warnings` ; tous les tests Rust ; build frontend ; paquet Tauri complet ; vérification manuelle des commandes principales + éditeurs.

---

## 5. Ordre de réalisation recommandé
1. Définir les types et l'API IPC.
2. Migrer `commandExecutor.ts`.
3. Migrer `filesystem.ts`.
4. Adapter Nano et Vim.
5. Migrer données distros/paquets.
6. ✅ Migrer le serveur IA vers Rust (fait — `ai/service.rs` + `ai/commands.rs`).
7. ✅ **Paramètres & sessions en Rust** (`settings.json` + `session.json` ; `settings_*` et `session_*` réels — onglets persistés au redémarrage).
8. Générer les types TS.
9. Supprimer anciens moteurs et simulations.
10. Découper React.
11. Tests + sécurité.

## 6. Garde-fous sécurité (appliqués récemment)
Plus de serveur HTTP exposé : les opérations réseau/IA passent par IPC Tauri (Rust). Aucune surface d'écoute, erreurs et timeouts centralisés, secrets en mémoire (clé API transmise par requête, jamais persistée).

---

## 7. Advisory de dépendance connu (à suivre)

### `glib` (transitif, pile GTK du webview Tauri) — Dependabot #1
- **Sévérité** : moyenne · **Correctif** : `glib >= 0.20`
- **Faille** : *unsoundness* dans `glib::VariantStrIter` (`impl_get`) → comportement indéfini.
- **Pourquoi non corrigé** : la pile épinglée est en gtk-rs **0.18** (`glib 0.18.5`, `gtk 0.18.2`,
  `webkit2gtk 2.0.2`, `soup3 0.5`) ; `tauri 2.11.5` / `wry 0.55.1` imposent `gtk ^0.18`.
  Un bump de `glib` seul échoue en résolution : `failed to select a version for requirement glib = "^0.18"`.
- **Impact** : chemin de code interne des binding GTK,**non atteint** par un terminal + webview ;
  risque d'exploitation quasi nul. Le correctif arrivera avec la migration `tauri`/`wry` vers gtk-rs 0.20.
