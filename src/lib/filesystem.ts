import { FileNode } from '../types';

const STORAGE_KEY = 'omnilinux_vfs_v2';

export function createInitialFS(): Record<string, FileNode> {
  const now = new Date().toISOString().substring(0, 10);
  
  const fs: Record<string, FileNode> = {
    'root-dir': {
      id: 'root-dir',
      name: '/',
      type: 'dir',
      path: '/',
      parentId: null,
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'home-dir': {
      id: 'home-dir',
      name: 'home',
      type: 'dir',
      path: '/home',
      parentId: 'root-dir',
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'user-dir': {
      id: 'user-dir',
      name: 'user',
      type: 'dir',
      path: '/home/user',
      parentId: 'home-dir',
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'user',
      group: 'user',
      updatedAt: now,
    },
    'welcome-file': {
      id: 'welcome-file',
      name: 'bienvenue.txt',
      type: 'file',
      path: '/home/user/bienvenue.txt',
      parentId: 'user-dir',
      content: `=====================================================
  Bienvenue sur OmniLinux Terminal - Linux Universel !
=====================================================

Vous disposez d'un système de fichiers virtuel complet,
compatible avec toutes les distributions majeures :
- Ubuntu, Arch, Kali, Debian, Fedora, Alpine, CentOS, openSUSE, Void, NixOS.

Commandes disponibles à essayer :
  • help                 : Voir la liste de toutes les commandes
  • neofetch             : Afficher les specs & logo ASCII de la distro
  • apt / pacman / dnf   : Simuler l'installation de paquets
  • htop                 : Moniteur de processus interactif
  • nano fichier.txt     : Éditeur de texte Nano interactif
  • vim config.sh        : Éditeur de texte Vim interactif
  • ai "comment installer docker" : Assistant IA Gemini pour vos commandes
  • cmatrix / sl         : Animations amusantes dans le terminal

Tapez 'distro' pour changer de distribution Linux à tout moment !
`,
      size: 680,
      permissions: '-rw-r--r--',
      owner: 'user',
      group: 'user',
      updatedAt: now,
    },
    'demo-script': {
      id: 'demo-script',
      name: 'backup.sh',
      type: 'file',
      path: '/home/user/backup.sh',
      parentId: 'user-dir',
      content: `#!/bin/bash
# Script de sauvegarde automatisé
echo "[+] Démarrage de la sauvegarde de /home/user..."
date
mkdir -p /tmp/backups
echo "[+] Copie des fichiers importants..."
cp /home/user/*.txt /tmp/backups/ 2>/dev/null
echo "[+] Sauvegarde terminée avec succès !"
`,
      size: 260,
      permissions: '-rwxr-xr-x',
      owner: 'user',
      group: 'user',
      updatedAt: now,
    },
    'notes-file': {
      id: 'notes-file',
      name: 'notes.txt',
      type: 'file',
      path: '/home/user/notes.txt',
      parentId: 'user-dir',
      content: `- Réviser les commandes 'grep' et 'find'
- Tester la distribution Kali Linux pour la sécurité
- Configurer un serveur Web NGINX avec 'apt install nginx'
- Utiliser nano pour modifier ce fichier !
`,
      size: 190,
      permissions: '-rw-r--r--',
      owner: 'user',
      group: 'user',
      updatedAt: now,
    },
    'etc-dir': {
      id: 'etc-dir',
      name: 'etc',
      type: 'dir',
      path: '/etc',
      parentId: 'root-dir',
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'os-release-file': {
      id: 'os-release-file',
      name: 'os-release',
      type: 'file',
      path: '/etc/os-release',
      parentId: 'etc-dir',
      content: `NAME="Ubuntu"
VERSION="24.04 LTS (Noble Numbat)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 24.04 LTS"
VERSION_ID="24.04"
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
UBUNTU_CODENAME=noble
`,
      size: 260,
      permissions: '-rw-r--r--',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'hosts-file': {
      id: 'hosts-file',
      name: 'hosts',
      type: 'file',
      path: '/etc/hosts',
      parentId: 'etc-dir',
      content: `127.0.0.1   localhost
127.0.1.1   omnilinux-box
::1         localhost ip6-localhost ip6-loopback
fe00::0     ip6-localnet
`,
      size: 130,
      permissions: '-rw-r--r--',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'fstab-file': {
      id: 'fstab-file',
      name: 'fstab',
      type: 'file',
      path: '/etc/fstab',
      parentId: 'etc-dir',
      content: `# /etc/fstab: static file system information.
UUID=a1b2c3d4-e5f6-7890-abcd-123456789012 /               ext4    errors=remount-ro 0       1
UUID=b2c3d4e5-f6a7-8901-bcde-234567890123 /home           ext4    defaults        0       2
`,
      size: 210,
      permissions: '-rw-r--r--',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'var-dir': {
      id: 'var-dir',
      name: 'var',
      type: 'dir',
      path: '/var',
      parentId: 'root-dir',
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'log-dir': {
      id: 'log-dir',
      name: 'log',
      type: 'dir',
      path: '/var/log',
      parentId: 'var-dir',
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'syslog-file': {
      id: 'syslog-file',
      name: 'syslog',
      type: 'file',
      path: '/var/log/syslog',
      parentId: 'log-dir',
      content: `Sep 03 12:00:01 omnilinux systemd[1]: Started Periodic Command Scheduler.
Sep 03 12:00:05 omnilinux kernel: [    0.000000] Linux version 6.8.0-40-generic (buildd@bos03-amd64-001)
Sep 03 12:00:10 omnilinux NetworkManager[845]: <info> [1725380410.123] NetworkManager (version 1.46.0) is starting...
Sep 03 12:00:15 omnilinux sshd[1020]: Server listening on 0.0.0.0 port 22.
Sep 03 12:01:00 omnilinux terminal[1337]: Session initialized for user@omnilinux.
`,
      size: 420,
      permissions: '-rw-r-----',
      owner: 'root',
      group: 'adm',
      updatedAt: now,
    },
    'tmp-dir': {
      id: 'tmp-dir',
      name: 'tmp',
      type: 'dir',
      path: '/tmp',
      parentId: 'root-dir',
      size: 4096,
      permissions: 'drwxrwxrwt',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'bin-dir': {
      id: 'bin-dir',
      name: 'bin',
      type: 'dir',
      path: '/bin',
      parentId: 'root-dir',
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'usr-dir': {
      id: 'usr-dir',
      name: 'usr',
      type: 'dir',
      path: '/usr',
      parentId: 'root-dir',
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'root-user-dir': {
      id: 'root-user-dir',
      name: 'root',
      type: 'dir',
      path: '/root',
      parentId: 'root-dir',
      size: 4096,
      permissions: 'drwx------',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    },
    'flag-file': {
      id: 'flag-file',
      name: 'flag.txt',
      type: 'file',
      path: '/root/flag.txt',
      parentId: 'root-user-dir',
      content: `FLAG{OMNILINUX_TERMINAL_ROOT_ACCESS_GRANTED_2026}
Bravo ! Vous avez accédé au répertoire administrateur /root.
`,
      size: 110,
      permissions: '-rw-------',
      owner: 'root',
      group: 'root',
      updatedAt: now,
    }
  };

  return fs;
}

export class VirtualFS {
  private fs: Record<string, FileNode>;

  constructor() {
    this.fs = this.loadFS();
  }

  private loadFS(): Record<string, FileNode> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load VFS from localStorage:', e);
    }
    const initial = createInitialFS();
    this.saveFS(initial);
    return initial;
  }

  public saveFS(data?: Record<string, FileNode>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || this.fs));
    } catch (e) {
      console.warn('Failed to save VFS to localStorage:', e);
    }
  }

  public resetFS() {
    this.fs = createInitialFS();
    this.saveFS();
  }

  public normalizePath(path: string, currentCwd: string = '/home/user'): string {
    if (!path || path === '.') return currentCwd;
    if (path === '~' || path.startsWith('~/')) {
      path = path.replace('~', '/home/user');
    }

    let absolute = path.startsWith('/') ? path : `${currentCwd}/${path}`;
    
    // Process . and ..
    const segments = absolute.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        resolved.pop();
      } else {
        resolved.push(seg);
      }
    }

    return '/' + resolved.join('/');
  }

  public getNodeByPath(path: string): FileNode | null {
    const normalized = this.normalizePath(path);
    if (normalized === '/') return this.fs['root-dir'];

    const found = Object.values(this.fs).find(node => node.path === normalized);
    return found || null;
  }

  public getChildren(dirPath: string): FileNode[] {
    const norm = this.normalizePath(dirPath);
    const parentNode = this.getNodeByPath(norm);
    if (!parentNode || parentNode.type !== 'dir') return [];

    return Object.values(this.fs).filter(node => node.parentId === parentNode.id);
  }

  public createFile(
    dirPath: string,
    name: string,
    content: string = '',
    owner: string = 'user',
    permissions: string = '-rw-r--r--'
  ): FileNode | string {
    const normDir = this.normalizePath(dirPath);
    const parent = this.getNodeByPath(normDir);
    if (!parent || parent.type !== 'dir') {
      return `Répertoire introuvable: ${dirPath}`;
    }

    const filePath = normDir === '/' ? `/${name}` : `${normDir}/${name}`;
    const existing = this.getNodeByPath(filePath);
    if (existing) {
      // Overwrite content
      existing.content = content;
      existing.size = content.length;
      existing.updatedAt = new Date().toISOString().substring(0, 10);
      this.saveFS();
      return existing;
    }

    const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNode: FileNode = {
      id,
      name,
      type: 'file',
      path: filePath,
      parentId: parent.id,
      content,
      size: content.length,
      permissions,
      owner,
      group: owner === 'root' ? 'root' : 'user',
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    this.fs[id] = newNode;
    this.saveFS();
    return newNode;
  }

  public createDir(
    dirPath: string,
    name: string,
    owner: string = 'user'
  ): FileNode | string {
    const normDir = this.normalizePath(dirPath);
    const parent = this.getNodeByPath(normDir);
    if (!parent || parent.type !== 'dir') {
      return `Répertoire parent introuvable: ${dirPath}`;
    }

    const newPath = normDir === '/' ? `/${name}` : `${normDir}/${name}`;
    if (this.getNodeByPath(newPath)) {
      return `Le fichier ou répertoire '${name}' existe déjà.`;
    }

    const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newDir: FileNode = {
      id,
      name,
      type: 'dir',
      path: newPath,
      parentId: parent.id,
      size: 4096,
      permissions: 'drwxr-xr-x',
      owner,
      group: owner === 'root' ? 'root' : 'user',
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    this.fs[id] = newDir;
    this.saveFS();
    return newDir;
  }

  public removeNode(targetPath: string, recursive: boolean = false): boolean | string {
    const node = this.getNodeByPath(targetPath);
    if (!node) return `Impossible de supprimer '${targetPath}': Aucun fichier ou dossier de ce nom`;
    if (node.path === '/' || node.path === '/home' || node.path === '/etc') {
      return `Permission refusée: Impossible de supprimer le répertoire système '${targetPath}'`;
    }

    if (node.type === 'dir') {
      const children = this.getChildren(node.path);
      if (children.length > 0 && !recursive) {
        return `Impossible de supprimer '${node.name}': Le répertoire n'est pas vide (utilisez rm -r)`;
      }
      // Delete children recursively
      for (const child of children) {
        this.removeNode(child.path, true);
      }
    }

    delete this.fs[node.id];
    this.saveFS();
    return true;
  }

  public updateOSRelease(distroName: string, version: string, id: string) {
    const osReleaseNode = this.getNodeByPath('/etc/os-release');
    if (osReleaseNode) {
      osReleaseNode.content = `NAME="${distroName}"
VERSION="${version}"
ID=${id}
PRETTY_NAME="${distroName} ${version}"
VERSION_ID="${version}"
HOME_URL="https://${id}.org/"
`;
      this.saveFS();
    }
  }
}

export const vfs = new VirtualFS();
