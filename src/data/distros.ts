import { LinuxDistro, DistroId, PackageManagerName } from '../types';
import { DistroInfo } from '../lib/distroApi';

/**
 * Couche PRÉSENTATION des distributions (rendu côté React).
 * ⚠️ Ce fichier ne définit PLUS le catalogue des distributions : la liste
 * (quelles distros existent, nom, version, noyau, gestionnaire de paquets,
 * utilisateur par défaut, description, paquets) vient de Rust via `distro_list`.
 * React ne conserve ici QUE les champs purement visuels/d'affichage
 * (asciiArt, thème, tagline, commande de paquets, hostname, prompt…),
 * keyés par `DistroId`. C'est la règle « React affiche les données fournies par Rust ».
 */

export interface DistroPresentation {
  tagline: string;
  pkgCommand: string;
  hostName: string;
  promptSymbol: string;
  themeColor: string;
  accentBg: string;
  badgeBorder: string;
  asciiArt: string;
  specialTools: string[];
}

export const DISTRO_PRESENTATION: Record<string, DistroPresentation> = {
  ubuntu: {
    tagline: 'La distribution Linux grand public la plus populaire au monde',
    pkgCommand: 'apt update && apt install',
    hostName: 'ubuntu-desktop',
    promptSymbol: '$',
    themeColor: '#E95420', // Ubuntu Orange
    accentBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    badgeBorder: 'border-orange-500',
    specialTools: ['apt-get', 'snap', 'ufw', 'add-apt-repository'],
    asciiArt: `
         _-_
       /     \\
      |   O   |
       \\_   _/
         - -
  ______ _____  ____
 /  ___//  _  \\\\/  _/
||  |  _|  |_|  || |_
||  | |_ |   _  ||  _|
||  |__| |  | | || |
\\\\_____/|__| |_||_|
`,
  },
  arch: {
    tagline: 'Une distribution minimale et personnalisable en rolling-release (KISS)',
    pkgCommand: 'pacman -Syu && pacman -S',
    hostName: 'arch-box',
    promptSymbol: '$',
    themeColor: '#1793D1', // Arch Blue
    accentBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    badgeBorder: 'border-sky-500',
    specialTools: ['pacman', 'yay', 'makepkg', 'arch-chroot'],
    asciiArt: `
       /\\
      /  \\
     /\\   \\
    /      \\
   /   ,,   \\
  /   |  |  -\\
 /_-''    ''-_\\
`,
  },
  kali: {
    tagline: 'Plateforme spécialisée dans la sécurité informatique et les tests d\'intrusion',
    pkgCommand: 'apt update && apt install',
    hostName: 'kali-dragon',
    promptSymbol: '$',
    themeColor: '#557C93', // Kali Cyan
    accentBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    badgeBorder: 'border-cyan-500',
    specialTools: ['nmap', 'msfconsole', 'hydra', 'aircrack-ng', 'sqlmap', 'nikto', 'wireshark'],
    asciiArt: `
  ..............
  ............
  .........  ..
  ......  .......
  ....  ...........
  ..  .............
  ..................
`,
  },
  debian: {
    tagline: 'Le système d\'exploitation universel, reconnu pour sa grande stabilité',
    pkgCommand: 'apt-get update && apt-get install',
    hostName: 'debian-server',
    promptSymbol: '$',
    themeColor: '#A80030', // Debian Red/Crimson
    accentBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    badgeBorder: 'border-rose-500',
    specialTools: ['dpkg', 'apt-get', 'tasksel', 'dpkg-reconfigure'],
    asciiArt: `
     _____
    /  __ \\
   |  /  | |
   |  |  |/
   |  |___
   |  /   |
   |  |___/
   \\_____-
`,
  },
  fedora: {
    tagline: 'Pionnière des dernières innovations technologiques et du noyau Linux',
    pkgCommand: 'dnf check-update && dnf install',
    hostName: 'fedora-laptop',
    promptSymbol: '$',
    themeColor: '#3C6EB4', // Fedora Blue
    accentBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    badgeBorder: 'border-blue-500',
    specialTools: ['dnf', 'rpm', 'flatpak', 'podman', 'semanage'],
    asciiArt: `
          /----\\
         / /||\\ \\
        / / || \\ \\
       / /  ||  \\ \\
      / /___||___\\ \\
     /______||______\\
`,
  },
  alpine: {
    tagline: 'Ultra-léger, orienté sécurité, idéal pour les conteneurs Docker (5Mo)',
    pkgCommand: 'apk update && apk add',
    hostName: 'alpine-node',
    promptSymbol: '#',
    themeColor: '#0D597F', // Alpine Teal
    accentBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    badgeBorder: 'border-emerald-500',
    specialTools: ['apk', 'setup-alpine', 'rc-service'],
    asciiArt: `
       /\\
      /  \\
     /    \\
    /  /\\  \\
   /  /  \\  \\
  /__/    \\__\\
`,
  },
  centos: {
    tagline: 'Standard industriel pour les serveurs d\'entreprise et cloud',
    pkgCommand: 'dnf update && dnf install',
    hostName: 'centos-srv01',
    promptSymbol: '$',
    themeColor: '#26255C', // CentOS Purple
    accentBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    badgeBorder: 'border-purple-500',
    specialTools: ['dnf', 'yum', 'firewall-cmd', 'sestatus'],
    asciiArt: `
  __  _  __
 /  \\/ \\/  \\
|   /\\ /\\   |
 \\_/  \\/  _/
  |   /\\   |
  |  /  \\  |
   \\/    \\/
`,
  },
  opensuse: {
    tagline: 'Distribution allemande réputée pour YaST et son système Btrfs/Snapper',
    pkgCommand: 'zypper refresh && zypper in',
    hostName: 'suse-rig',
    promptSymbol: '$',
    themeColor: '#73BA25', // openSUSE Green
    accentBg: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
    badgeBorder: 'border-lime-500',
    specialTools: ['zypper', 'yast', 'snapper', 'rpm'],
    asciiArt: `
      ______
     /  ___ \\
    |  /   | |
    |  |   | |
    |  |___/ /
    |  ____ /
    |_/
`,
  },
  void: {
    tagline: 'Conçue à partir de zéro, indépendante, utilisant runit et XBPS',
    pkgCommand: 'xbps-install -Syu && xbps-install -S',
    hostName: 'void-station',
    promptSymbol: '$',
    themeColor: '#478061', // Void Dark Green
    accentBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    badgeBorder: 'border-teal-500',
    specialTools: ['xbps-install', 'xbps-query', 'xbps-remove', 'sv'],
    asciiArt: `
       _______
      /  ___  \\
     /  /   \\  \\
    |  |     |  |
     \\  \\___/  /
      \\_______/
`,
  },
  nixos: {
    tagline: 'Gestion de configuration purement déclarative et reproductible',
    pkgCommand: 'nix-env -iA nixos.',
    hostName: 'nixos-box',
    promptSymbol: '$',
    themeColor: '#5277C3', // NixOS Powder Blue
    accentBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    badgeBorder: 'border-indigo-500',
    specialTools: ['nix-env', 'nix-shell', 'nixos-rebuild', 'nix-store'],
    asciiArt: `
      \\\\  \\\\
   \\\\  \\\\  \\\\
    \\\\  \\\\  \\\\  \\\\
     \\\\  \\\\  \\\\  \\\\
      \\\\__\\\\__\\\\__\\\\
`,
  },
};

/** Placeholder inerte pour éviter tout crash avant le chargement Rust (pas des données simulées). */
export const EMPTY_DISTRO: LinuxDistro = {
  id: 'ubuntu',
  name: '',
  version: '',
  tagline: '',
  kernel: '',
  packageManager: 'apt',
  pkgCommand: '',
  defaultUser: '',
  hostName: '',
  promptSymbol: '$',
  themeColor: '',
  accentBg: '',
  badgeBorder: '',
  asciiArt: '',
  description: '',
  defaultPackages: [],
  specialTools: [],
};

/**
 * Fusionne une `DistroInfo` Rust (identité = source de vérité) avec la couche
 * présentation React pour produire la `LinuxDistro` complète rendue par l'UI.
 */
export function mergeDistroInfo(info: DistroInfo): LinuxDistro {
  const p = DISTRO_PRESENTATION[info.id] || EMPTY_PRESENTATION;
  return {
    id: info.id as DistroId,
    name: info.name,
    version: info.version,
    tagline: p.tagline,
    kernel: info.kernel,
    packageManager: info.packageManager as PackageManagerName,
    pkgCommand: p.pkgCommand,
    defaultUser: info.defaultUser,
    hostName: p.hostName,
    promptSymbol: p.promptSymbol,
    themeColor: p.themeColor || info.colorTheme,
    accentBg: p.accentBg,
    badgeBorder: p.badgeBorder,
    asciiArt: p.asciiArt || info.asciiLogo,
    description: info.description,
    defaultPackages: info.defaultPackages,
    specialTools: p.specialTools,
  };
}

const EMPTY_PRESENTATION: DistroPresentation = {
  tagline: '',
  pkgCommand: '',
  hostName: '',
  promptSymbol: '$',
  themeColor: '',
  accentBg: '',
  badgeBorder: '',
  asciiArt: '',
  specialTools: [],
};
