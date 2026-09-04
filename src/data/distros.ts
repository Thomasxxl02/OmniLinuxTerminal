import { LinuxDistro } from '../types';

export const LINUX_DISTROS: LinuxDistro[] = [
  {
    id: 'ubuntu',
    name: 'Ubuntu 24.04 LTS',
    version: '24.04.1 LTS (Noble Numbat)',
    tagline: 'La distribution Linux grand public la plus populaire au monde',
    kernel: '6.8.0-40-generic x86_64',
    packageManager: 'apt',
    pkgCommand: 'apt update && apt install',
    defaultUser: 'ubuntu',
    hostName: 'ubuntu-desktop',
    promptSymbol: '$',
    themeColor: '#E95420', // Ubuntu Orange
    accentBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    badgeBorder: 'border-orange-500',
    description: 'Conçue par Canonical, Ubuntu offre une stabilité à toute épreuve, Snap/APT, et une communauté gigantesque.',
    defaultPackages: ['apt', 'snapd', 'systemd', 'bash', 'coreutils', 'curl', 'git', 'python3', 'nano', 'vim', 'htop'],
    specialTools: ['apt-get', 'snap', 'ufw', 'add-apt-repository'],
    asciiArt: `
         _-_         
       /     \\       
      |   O   |      
       \\_   _/       
         - -         
  ______ _____  ____ 
 /  ___//  _  \\/  _/ 
|  |  _|  |_|  || |_ 
|  | |_ |   _  ||  _|
|  |__| |  | | || |  
 \\_____/|__| |_||_|  
`
  },
  {
    id: 'arch',
    name: 'Arch Linux',
    version: 'Rolling Release (x86_64)',
    tagline: 'Une distribution minimale et personnalisable en rolling-release (KISS)',
    kernel: '6.10.8-arch1-1 x86_64',
    packageManager: 'pacman',
    pkgCommand: 'pacman -Syu && pacman -S',
    defaultUser: 'archuser',
    hostName: 'arch-box',
    promptSymbol: '$',
    themeColor: '#1793D1', // Arch Blue
    accentBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    badgeBorder: 'border-sky-500',
    description: 'Adepte du principe Keep It Simple, Arch Linux vous donne le contrôle total grâce au package manager Pacman et l\'AUR.',
    defaultPackages: ['pacman', 'yay', 'bash', 'zsh', 'coreutils', 'vim', 'git', 'neofetch', 'base-devel'],
    specialTools: ['pacman', 'yay', 'makepkg', 'arch-chroot'],
    asciiArt: `
       /\\
      /  \\
     /\\   \\
    /      \\
   /   ,,   \\
  /   |  |  -\\
 /_-''    ''-_\\
`
  },
  {
    id: 'kali',
    name: 'Kali Linux',
    version: '2024.3 (Cyber Security Edition)',
    tagline: 'Plateforme spécialisée dans la sécurité informatique et les tests d\'intrusion',
    kernel: '6.8.11-kali1-amd64 x86_64',
    packageManager: 'apt',
    pkgCommand: 'apt update && apt install',
    defaultUser: 'kali',
    hostName: 'kali-dragon',
    promptSymbol: '$',
    themeColor: '#557C93', // Kali Cyan
    accentBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    badgeBorder: 'border-cyan-500',
    description: 'Développée par Offensive Security, pré-chargée avec des centaines d\'outils d\'analyse de sécurité et de pentest.',
    defaultPackages: ['apt', 'nmap', 'wireshark-cli', 'metasploit-framework', 'hydra', 'aircrack-ng', 'nikto', 'sqlmap', 'john'],
    specialTools: ['nmap', 'msfconsole', 'hydra', 'aircrack-ng', 'sqlmap', 'nikto', 'wireshark'],
    asciiArt: `
  ..............
  ............      
  .........  ..     
  ......  .......   
  ....  ........... 
  ..  ............. 
  ..................
`
  },
  {
    id: 'debian',
    name: 'Debian 12 Bookworm',
    version: '12.6 (Bookworm)',
    tagline: 'Le système d\'exploitation universel, reconnu pour sa grande stabilité',
    kernel: '6.1.0-23-amd64 x86_64',
    packageManager: 'apt',
    pkgCommand: 'apt-get update && apt-get install',
    defaultUser: 'debian',
    hostName: 'debian-server',
    promptSymbol: '$',
    themeColor: '#A80030', // Debian Red/Crimson
    accentBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    badgeBorder: 'border-rose-500',
    description: 'Rocher de la communauté Open Source, ancêtre d\'Ubuntu, réputée pour ses dépôts ultra-stables et sécurisés.',
    defaultPackages: ['apt', 'dpkg', 'bash', 'coreutils', 'net-tools', 'iputils-ping', 'nano', 'vim', 'systemd'],
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
`
  },
  {
    id: 'fedora',
    name: 'Fedora 40 Workstation',
    version: '40 (Workstation Edition)',
    tagline: 'Pionnière des dernières innovations technologiques et du noyau Linux',
    kernel: '6.9.12-200.fc40.x86_64',
    packageManager: 'dnf',
    pkgCommand: 'dnf check-update && dnf install',
    defaultUser: 'fedora',
    hostName: 'fedora-laptop',
    promptSymbol: '$',
    themeColor: '#3C6EB4', // Fedora Blue
    accentBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    badgeBorder: 'border-blue-500',
    description: 'Soutenue par Red Hat, Fedora propose les paquets logiciels les plus récents et sert de banc d\'essai pour RHEL.',
    defaultPackages: ['dnf', 'rpm', 'flatpak', 'bash', 'coreutils', 'gcc', 'git', 'systemd', 'podman'],
    specialTools: ['dnf', 'rpm', 'flatpak', 'podman', 'semanage'],
    asciiArt: `
          /----\\
         / /||\\ \\
        / / || \\ \\
       / /  ||  \\ \\
      / /___||___\\ \\
     /______||______\\
`
  },
  {
    id: 'alpine',
    name: 'Alpine Linux 3.20',
    version: '3.20.2 (Musl & BusyBox)',
    tagline: 'Ultra-léger, orienté sécurité, idéal pour les conteneurs Docker (5Mo)',
    kernel: '6.6.43-0-virt x86_64',
    packageManager: 'apk',
    pkgCommand: 'apk update && apk add',
    defaultUser: 'root',
    hostName: 'alpine-node',
    promptSymbol: '#',
    themeColor: '#0D597F', // Alpine Teal
    accentBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    badgeBorder: 'border-emerald-500',
    description: 'Utilise musl libc et BusyBox. Ultra-rapide au démarrage, consomme très peu de mémoire vive.',
    defaultPackages: ['apk-tools', 'busybox', 'musl', 'sh', 'ash', 'ssl'],
    specialTools: ['apk', 'setup-alpine', 'rc-service'],
    asciiArt: `
       /\\
      /  \\
     /    \\
    /  /\\  \\
   /  /  \\  \\
  /__/    \\__\\
`
  },
  {
    id: 'centos',
    name: 'CentOS Stream 9 / RHEL',
    version: 'Stream 9 (Red Hat Enterprise Linux upstream)',
    tagline: 'Standard industriel pour les serveurs d\'entreprise et cloud',
    kernel: '5.14.0-427.13.1.el9_4.x86_64',
    packageManager: 'dnf',
    pkgCommand: 'dnf update && dnf install',
    defaultUser: 'sysadmin',
    hostName: 'centos-srv01',
    promptSymbol: '$',
    themeColor: '#26255C', // CentOS Purple
    accentBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    badgeBorder: 'border-purple-500',
    description: 'Version de développement continue en amont de RHEL. Extrêmement robuste pour les environnements de production.',
    defaultPackages: ['dnf', 'yum', 'rpm', 'selinux-policy', 'systemd', 'firewalld', 'cockpit'],
    specialTools: ['dnf', 'yum', 'firewall-cmd', 'sestatus'],
    asciiArt: `
  __  _  __
 /  \\/ \\/  \\
|   /\\ /\\   |
 \\_/  \\/  _/
  |   /\\   |
  |  /  \\  |
   \\/    \\/
`
  },
  {
    id: 'opensuse',
    name: 'openSUSE Tumbleweed',
    version: 'Tumbleweed Rolling (Gecko)',
    tagline: 'Distribution allemande réputée pour YaST et son système Btrfs/Snapper',
    kernel: '6.10.3-1-default x86_64',
    packageManager: 'zypper',
    pkgCommand: 'zypper refresh && zypper in',
    defaultUser: 'gecko',
    hostName: 'suse-rig',
    promptSymbol: '$',
    themeColor: '#73BA25', // openSUSE Green
    accentBg: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
    badgeBorder: 'border-lime-500',
    description: 'Fournit le puissant outil de configuration YaST et un gestionnaire Zypper rapide avec snapshots automatiques.',
    defaultPackages: ['zypper', 'yast2', 'snapper', 'btrfsprogs', 'bash', 'coreutils', 'git'],
    specialTools: ['zypper', 'yast', 'snapper', 'rpm'],
    asciiArt: `
      ______ 
     /  ___ \\
    |  /   | |
    |  |   | |
    |  |___/ /
    |  ____ / 
    |_/       
`
  },
  {
    id: 'void',
    name: 'Void Linux',
    version: 'Rolling Release (XBPS & runit)',
    tagline: 'Conçue à partir de zéro, indépendante, utilisant runit et XBPS',
    kernel: '6.6.45_1 x86_64',
    packageManager: 'xbps',
    pkgCommand: 'xbps-install -Syu && xbps-install -S',
    defaultUser: 'voidman',
    hostName: 'void-station',
    promptSymbol: '$',
    themeColor: '#478061', // Void Dark Green
    accentBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    badgeBorder: 'border-teal-500',
    description: 'Développée indépendamment sans systemd. Utilise runit pour l\'init et XBPS écrit en C pour une vitesse éclair.',
    defaultPackages: ['xbps', 'runit', 'bash', 'zsh', 'coreutils', 'xbps-src'],
    specialTools: ['xbps-install', 'xbps-query', 'xbps-remove', 'sv'],
    asciiArt: `
       _______
      /  ___  \\
     /  /   \\  \\
    |  |     |  |
     \\  \\___/  /
      \\_______/
`
  },
  {
    id: 'nixos',
    name: 'NixOS 24.05',
    version: '24.05 (Uakari)',
    tagline: 'Gestion de configuration purement déclarative et reproductible',
    kernel: '6.6.32 x86_64',
    packageManager: 'nix',
    pkgCommand: 'nix-env -iA nixos.',
    defaultUser: 'nixuser',
    hostName: 'nixos-box',
    promptSymbol: '$',
    themeColor: '#5277C3', // NixOS Powder Blue
    accentBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    badgeBorder: 'border-indigo-500',
    description: 'Tout le système est configuré via un fichier `/etc/nixos/configuration.nix`. Rollback atomique instantané.',
    defaultPackages: ['nix', 'nix-env', 'nix-shell', 'nixos-rebuild', 'bash', 'git', 'vim'],
    specialTools: ['nix-env', 'nix-shell', 'nixos-rebuild', 'nix-store'],
    asciiArt: `
      \\\\  \\\\
   \\\\  \\\\  \\\\
    \\\\  \\\\  \\\\  \\\\
     \\\\  \\\\  \\\\  \\\\
      \\\\__\\\\__\\\\__\\\\
`
  }
];

export const DEFAULT_DISTRO = LINUX_DISTROS[0]; // Ubuntu
