import { ReactNode } from 'react';
import { vfs } from './filesystem';
import { LINUX_DISTROS } from '../data/distros';
import { DistroId, TerminalTab, ActiveEditorState } from '../types';
import { tauriInvoke } from './tauriBridge';

export interface CommandOutput {
  text?: string;
  element?: ReactNode;
  newCwd?: string;
  clear?: boolean;
  activeEditor?: ActiveEditorState | null;
  activeApp?: 'none' | 'htop' | 'matrix' | 'sl';
  installedPackage?: string;
  switchedDistro?: DistroId;
  exitCode?: number;
}

export async function executeCommand(
  rawCmd: string,
  tab: TerminalTab,
  onAiRequest?: (type: 'generate' | 'explain' | 'debug', query: string) => Promise<any>
): Promise<CommandOutput> {
  const trimmed = rawCmd.trim();
  if (!trimmed) return { text: '' };

  // Handle pipeline or redirection simply
  const currentDistro = LINUX_DISTROS.find(d => d.id === tab.distroId) || LINUX_DISTROS[0];
  const cwd = tab.cwd;

  // Split args
  const parts = trimmed.split(' ').filter(Boolean);
  const mainCmd = parts[0];
  const args = parts.slice(1);

  // Redirection handling check: e.g., echo "hello" > file.txt or >> file.txt
  if (trimmed.includes('>') && mainCmd === 'echo') {
    const isAppend = trimmed.includes('>>');
    const operator = isAppend ? '>>' : '>';
    const splitIndex = trimmed.indexOf(operator);
    const echoContentRaw = trimmed.substring(5, splitIndex).trim();
    const targetFilePath = trimmed.substring(splitIndex + operator.length).trim();

    // Strip quotes
    let cleanText = echoContentRaw;
    if ((cleanText.startsWith('"') && cleanText.endsWith('"')) || (cleanText.startsWith("'") && cleanText.endsWith("'"))) {
      cleanText = cleanText.slice(1, -1);
    }

    // Resolve variables
    cleanText = cleanText
      .replace(/\$USER/g, currentDistro.defaultUser)
      .replace(/\$SHELL/g, tab.shell)
      .replace(/\$PWD/g, cwd)
      .replace(/\$HOME/g, '/home/user');

    if (targetFilePath) {
      const targetAbs = vfs.normalizePath(targetFilePath, cwd);
      const existing = vfs.getNodeByPath(targetAbs);
      if (existing && isAppend && existing.type === 'file') {
        const newContent = (existing.content || '') + '\n' + cleanText;
        vfs.createFile(vfs.normalizePath(targetAbs + '/..', cwd), existing.name, newContent, currentDistro.defaultUser);
      } else {
        const parts = targetAbs.split('/');
        const fileName = parts.pop() || 'file.txt';
        const dirPath = parts.join('/') || '/';
        vfs.createFile(dirPath, fileName, cleanText, currentDistro.defaultUser);
      }
      return { text: '' };
    }
  }

  // Dispatch through Tauri v2 Rust IPC bridge
  await tauriInvoke('execute_shell_command', {
    cmd: trimmed,
    cwd,
    distroId: tab.distroId,
  });

  switch (mainCmd) {
    case 'tauri': {
      return {
        text: `🦀 OmniLinux Terminal - Backend Rust & Tauri v2
================================================
• Framework : Tauri v2.0 (IPC haute vitesse bidirectionnel)
• Backend   : Rust 1.85 (VFS POSIX, Shell Parser, Routeur IA Multi-Modèles)
• Modules   : src-tauri/src/{fs, terminal, distro, ai, system, models}.rs
• Sécurité  : Capabilities déclaratives (src-tauri/capabilities/default.json)
• Cibles OS : GNU/Linux (.deb, .AppImage), macOS (.dmg), Windows (.msi)

Commandes utiles :
  tauri info    : Vérifie la configuration du runtime Tauri v2
  cargo build   : Informations sur le pipeline de compilation Rust
  tauri dev     : Lance le conteneur desktop natif`
      };
    }

    case 'cargo': {
      if (args[0] === 'tauri' && args[1] === 'build') {
        return {
          text: `[cargo-tauri] Démarrage du build de production Tauri v2...
[1/4] Compilation des crates Rust (tauri, serde, tokio, reqwest)... Terminé.
[2/4] Compilation du bundle web Vite + Tailwind CSS... Terminé.
[3/4] Liaison des symboles statiques et extraction du binaire natif...
[4/4] Paquets générés :
      • target/release/bundle/deb/omnilinux-terminal_1.0.0_amd64.deb
      • target/release/bundle/appimage/omnilinux-terminal_1.0.0_amd64.AppImage
      • target/release/omnilinux-terminal (Binaire ELF x86_64, 18.4 Mo)`
        };
      }
      return {
        text: `cargo 1.85.0 (Tauri v2 Workspace)
Usage :
  cargo tauri dev    - Démarre l'application en mode développement
  cargo tauri build  - Compile les binaires natifs distribuables`
      };
    }

    case 'rustc':
    case 'rust': {
      return {
        text: `rustc 1.85.0 (Tauri v2 Edition) - Compilateur Rust haute performance
Architecture cible : x86_64-unknown-linux-gnu`
      };
    }

    case 'clear':
      return { clear: true };

    case 'pwd':
      return { text: cwd };

    case 'whoami':
      return { text: currentDistro.defaultUser };

    case 'hostname':
      return { text: currentDistro.hostName };

    case 'uname':
      if (args.includes('-a') || args.includes('-r')) {
        return { text: `Linux ${currentDistro.hostName} ${currentDistro.kernel} SMP PREEMPT_DYNAMIC GNU/Linux` };
      }
      return { text: 'Linux' };

    case 'date':
      return { text: new Date().toString() };

    case 'uptime':
      return { text: ` 16:20:00 up 4 days, 12:35, 1 user, load average: 0.15, 0.22, 0.18` };

    case 'cd': {
      const targetDir = args[0] || '~';
      const resolved = vfs.normalizePath(targetDir, cwd);
      const node = vfs.getNodeByPath(resolved);
      if (!node) {
        return { text: `cd: ${targetDir}: Aucun fichier ou dossier de ce nom` };
      }
      if (node.type !== 'dir') {
        return { text: `cd: ${targetDir}: N'est pas un dossier` };
      }
      return { newCwd: resolved };
    }

    case 'ls': {
      const showAll = args.some(a => a.includes('a'));
      const showLong = args.some(a => a.includes('l'));
      
      const targetPath = args.find(a => !a.startsWith('-')) || cwd;
      const targetNode = vfs.getNodeByPath(targetPath);

      if (!targetNode) {
        return { text: `ls: impossible d'accéder à '${targetPath}': Aucun fichier ou dossier de ce nom` };
      }

      let items = targetNode.type === 'dir' ? vfs.getChildren(targetNode.path) : [targetNode];
      if (!showAll) {
        items = items.filter(i => !i.name.startsWith('.'));
      }

      items.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });

      if (showLong) {
        let lines: string[] = [`total ${items.length * 4}`];
        if (showAll && targetNode.type === 'dir') {
          lines.push(`drwxr-xr-x 2 ${targetNode.owner} ${targetNode.group} 4096 Sep 03 12:00 .`);
          lines.push(`drwxr-xr-x 4 root root 4096 Sep 03 12:00 ..`);
        }
        items.forEach(item => {
          const isDir = item.type === 'dir';
          const nameColored = isDir ? `\x1b[34m${item.name}/\x1b[0m` : item.name;
          lines.push(`${item.permissions} 1 ${item.owner} ${item.group} ${item.size.toString().padStart(6, ' ')} ${item.updatedAt} ${item.name}${isDir ? '/' : ''}`);
        });
        return { text: lines.join('\n') };
      } else {
        const itemNames = items.map(i => i.name + (i.type === 'dir' ? '/' : ''));
        return { text: itemNames.join('  ') };
      }
    }

    case 'cat': {
      if (args.length === 0) return { text: 'cat: argument manquant' };
      const filePath = vfs.normalizePath(args[0], cwd);
      const node = vfs.getNodeByPath(filePath);
      if (!node) return { text: `cat: ${args[0]}: Aucun fichier ou dossier de ce nom` };
      if (node.type === 'dir') return { text: `cat: ${args[0]}: Est un dossier` };
      return { text: node.content || '' };
    }

    case 'head': {
      if (args.length === 0) return { text: 'head: argument manquant' };
      const filePath = vfs.normalizePath(args[0], cwd);
      const node = vfs.getNodeByPath(filePath);
      if (!node || node.type === 'dir') return { text: `head: impossible d'ouvrir '${args[0]}'` };
      const lines = (node.content || '').split('\n').slice(0, 10);
      return { text: lines.join('\n') };
    }

    case 'tail': {
      if (args.length === 0) return { text: 'tail: argument manquant' };
      const filePath = vfs.normalizePath(args[0], cwd);
      const node = vfs.getNodeByPath(filePath);
      if (!node || node.type === 'dir') return { text: `tail: impossible d'ouvrir '${args[0]}'` };
      const lines = (node.content || '').split('\n');
      return { text: lines.slice(-10).join('\n') };
    }

    case 'mkdir': {
      if (args.length === 0) return { text: 'mkdir: opérande manquant' };
      const name = args.filter(a => !a.startsWith('-'))[0];
      if (!name) return { text: 'mkdir: opérande manquant' };
      const result = vfs.createDir(cwd, name, currentDistro.defaultUser);
      if (typeof result === 'string') return { text: result };
      return { text: '' };
    }

    case 'touch': {
      if (args.length === 0) return { text: 'touch: opérande de fichier manquant' };
      const fileName = args[0];
      const result = vfs.createFile(cwd, fileName, '', currentDistro.defaultUser);
      if (typeof result === 'string') return { text: result };
      return { text: '' };
    }

    case 'rm': {
      if (args.length === 0) return { text: 'rm: opérande manquant' };
      const isRecursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
      const target = args.find(a => !a.startsWith('-'));
      if (!target) return { text: 'rm: opérande manquant' };
      const abs = vfs.normalizePath(target, cwd);
      const res = vfs.removeNode(abs, isRecursive);
      if (typeof res === 'string') return { text: res };
      return { text: '' };
    }

    case 'echo': {
      let message = args.join(' ');
      if ((message.startsWith('"') && message.endsWith('"')) || (message.startsWith("'") && message.endsWith("'"))) {
        message = message.slice(1, -1);
      }
      message = message
        .replace(/\$USER/g, currentDistro.defaultUser)
        .replace(/\$SHELL/g, tab.shell)
        .replace(/\$PWD/g, cwd)
        .replace(/\$HOME/g, '/home/user')
        .replace(/\$DISTRO/g, currentDistro.name);
      return { text: message };
    }

    case 'grep': {
      if (args.length < 2) return { text: 'Usage: grep [motif] [fichier]' };
      const pattern = args[0];
      const fileArg = args[1];
      const abs = vfs.normalizePath(fileArg, cwd);
      const node = vfs.getNodeByPath(abs);
      if (!node || node.type === 'dir') return { text: `grep: ${fileArg}: Fichier introuvable` };
      const lines = (node.content || '').split('\n');
      const matched = lines.filter(l => l.toLowerCase().includes(pattern.toLowerCase()));
      return { text: matched.join('\n') };
    }

    case 'tree': {
      const rootNode = vfs.getNodeByPath(cwd);
      if (!rootNode) return { text: '' };
      let output = `${cwd}\n`;
      const children = vfs.getChildren(cwd);
      children.forEach((c, idx) => {
        const isLast = idx === children.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        output += `${prefix}${c.name}${c.type === 'dir' ? '/' : ''}\n`;
        if (c.type === 'dir') {
          const sub = vfs.getChildren(c.path);
          sub.forEach((sc, sidx) => {
            const sLast = sidx === sub.length - 1;
            const sprefix = isLast ? '    ' : '│   ';
            output += `${sprefix}${sLast ? '└── ' : '├── '}${sc.name}\n`;
          });
        }
      });
      return { text: output };
    }

    case 'nano': {
      const fileName = args[0] || 'nouveau.txt';
      const absPath = vfs.normalizePath(fileName, cwd);
      const existing = vfs.getNodeByPath(absPath);
      let content = existing && existing.type === 'file' ? (existing.content || '') : '';
      return {
        activeEditor: {
          type: 'nano',
          filePath: absPath,
          fileContent: content,
          isNewFile: !existing,
        }
      };
    }

    case 'vim':
    case 'vi': {
      const fileName = args[0] || 'nouveau.txt';
      const absPath = vfs.normalizePath(fileName, cwd);
      const existing = vfs.getNodeByPath(absPath);
      let content = existing && existing.type === 'file' ? (existing.content || '') : '';
      return {
        activeEditor: {
          type: 'vim',
          filePath: absPath,
          fileContent: content,
          mode: 'normal',
          isNewFile: !existing,
        }
      };
    }

    case 'htop':
    case 'top': {
      return { activeApp: 'htop' };
    }

    case 'cmatrix':
    case 'matrix': {
      return { activeApp: 'matrix' };
    }

    case 'sl': {
      return { activeApp: 'sl' };
    }

    case 'neofetch':
    case 'fastfetch': {
      const pkgsCount = currentDistro.defaultPackages.length + tab.installedPackages.length;
      const uptimeStr = '4 jours, 12h 35m';
      const memStr = '2048MiB / 8192MiB';

      const output = `${currentDistro.asciiArt}
${currentDistro.defaultUser}@${currentDistro.hostName}
----------------------------
OS: ${currentDistro.name}
Kernel: ${currentDistro.kernel}
Uptime: ${uptimeStr}
Packages: ${pkgsCount} (${currentDistro.packageManager})
Shell: ${tab.shell} (v5.2.21)
Terminal: OmniLinux v2.4 (xterm-256color)
CPU: AMD EPYC 7763 (4) @ 2.449GHz
GPU: Virtual Cloud Graphics Engine
Memory: ${memStr}
[●] Palette: \x1b[31m███\x1b[32m███\x1b[33m███\x1b[34m███\x1b[35m███\x1b[36m███\x1b[0m`;
      return { text: output };
    }

    // Package Managers Simulation
    case 'apt':
    case 'apt-get':
    case 'pacman':
    case 'dnf':
    case 'yum':
    case 'apk':
    case 'zypper':
    case 'xbps-install':
    case 'nix-env':
    case 'snap': {
      const subAction = args[0] || '';
      const pkgName = args[1] || args[0];

      if (subAction === 'update' || subAction === 'refresh' || subAction === '-Syu') {
        return {
          text: `[+] Mise à jour des dépôts logiciels pour ${currentDistro.name}...
Réception de: 1 http://archive.${currentDistro.id}.org/ubuntu noble InRelease [256 kB]
Réception de: 2 http://security.${currentDistro.id}.org/ubuntu noble-security InRelease [126 kB]
Lecture des listes de paquets... Fait
Tous les paquets sont à jour.`
        };
      }

      if (['install', 'add', '-S', 'in', '-iA'].includes(subAction) || (mainCmd === 'apk' && subAction === 'add')) {
        const targetPkg = args[1] || 'logiciel';
        return {
          text: `Lecture des listes de paquets... Fait
Construction de l'arbre des dépendances... Fait
Les paquets supplémentaires suivants seront installés :
  lib${targetPkg}-dep1 lib${targetPkg}-data ${targetPkg}
0 mis à jour, 3 nouvellement installés, 0 à enlever.
Il est nécessaire de prendre 14,2 Mo dans les archives.
Dépaquetage de ${targetPkg} (1.2.4-1) ...
Saisie des configurations pour ${targetPkg} ...
[████████████████████████████████] 100%
[+] ${targetPkg} a été installé avec succès sur ${currentDistro.name}!`,
          installedPackage: targetPkg
        };
      }

      if (['search', '-Ss', 'se'].includes(subAction)) {
        return {
          text: `Résultats de la recherche pour '${pkgName}' dans les dépôts ${currentDistro.name} :
  ${pkgName}/noble 1.2.4-1 amd64 [installé]
    Utilitaire système haute performance.
  ${pkgName}-dev/noble 1.2.4-1 amd64
    Fichiers d'en-tête et bibliothèques de développement.`
        };
      }

      return {
        text: `Gestionnaire de paquets ${mainCmd} (Distribution: ${currentDistro.name})
Usage: ${currentDistro.pkgCommand} <paquet>`
      };
    }

    // Distro management command
    case 'distro': {
      if (args.length === 0) {
        let msg = `Distribution actuelle : ${currentDistro.name} (${currentDistro.version})\n\n`;
        msg += `Distributions disponibles :\n`;
        LINUX_DISTROS.forEach(d => {
          const isCurrent = d.id === currentDistro.id ? ' [ACTUELLE]' : '';
          msg += `  • ${d.id.padEnd(10, ' ')} : ${d.name}${isCurrent}\n`;
        });
        msg += `\nPour changer de distribution : distro <nom> (ex: distro arch, distro kali, distro fedora)`;
        return { text: msg };
      }

      const requestedId = args[0].toLowerCase() as DistroId;
      const targetDistro = LINUX_DISTROS.find(d => d.id === requestedId || d.name.toLowerCase().includes(requestedId));
      if (!targetDistro) {
        return { text: `Distribution '${args[0]}' introuvable. Tapez 'distro' pour voir la liste.` };
      }

      vfs.updateOSRelease(targetDistro.name, targetDistro.version, targetDistro.id);
      return {
        text: `[+] Basculement vers la distribution ${targetDistro.name} !
[+] Kernel: ${targetDistro.kernel}
[+] Gestionnaire de paquets par défaut : ${targetDistro.packageManager}
Tapez 'neofetch' pour voir les détails.`,
        switchedDistro: targetDistro.id
      };
    }

    case 'history': {
      return {
        text: tab.commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n')
      };
    }

    case 'cowsay': {
      const msg = args.join(' ') || 'OmniLinux Terminal est génial !';
      const border = '-'.repeat(msg.length + 2);
      const cow = `
 ${border}
< ${msg} >
 ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
      return { text: cow };
    }

    case 'fortune': {
      const fortunes = [
        "Un ordinateur sans Linux, c'est comme un chocolat chaud sans guimauves.",
        "Le principe KISS : Keep It Simple, Stupid. - Philosophie Arch Linux",
        "En cas de doute, 'sudo !!' sauvera votre journée.",
        "Il n'y a pas de place comme /home !",
        "Linux est convivial. Il est juste sélectif quant à ses amis."
      ];
      const random = fortunes[Math.floor(Math.random() * fortunes.length)];
      return { text: random };
    }

    case 'ping': {
      const host = args[0] || 'google.com';
      return {
        text: `PING ${host} (142.250.200.46) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=118 time=12.4 ms
64 bytes from ${host}: icmp_seq=2 ttl=118 time=11.8 ms
64 bytes from ${host}: icmp_seq=3 ttl=118 time=13.1 ms
64 bytes from ${host}: icmp_seq=4 ttl=118 time=11.5 ms
--- ${host} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 11.5/12.2/13.1/0.6 ms`
      };
    }

    case 'curl':
    case 'wget': {
      const url = args.find(a => !a.startsWith('-')) || 'https://api.github.com';
      return {
        text: `HTTP/1.1 200 OK
Server: OmniLinux-Proxy/1.0
Date: ${new Date().toUTCString()}
Content-Type: application/json; charset=utf-8
Content-Length: 142

{
  "status": "success",
  "message": "Réponse reçue avec succès depuis ${url}",
  "distro": "${currentDistro.name}"
}`
      };
    }

    case 'python3':
    case 'python': {
      if (args[0] === '-c' && args[1]) {
        try {
          const code = args.slice(1).join(' ').replace(/^["']|["']$/g, '');
          if (code.includes('print')) {
            const match = code.match(/print\((.*)\)/);
            if (match) {
              const inner = match[1].replace(/^["']|["']$/g, '');
              return { text: inner };
            }
          }
          return { text: 'Code Python exécuté avec succès.' };
        } catch (e) {
          return { text: 'SyntaxError: invalid syntax' };
        }
      }
      return { text: 'Python 3.12.3 (main, Apr 17 2026, 12:00:00) [GCC 13.2.0]\nTapez "help", "copyright", "credits" pour plus d\'informations.\n>>> print("Bonjour depuis Python sur " + "' + currentDistro.name + '")\nBonjour depuis Python sur ' + currentDistro.name };
    }

    case 'node': {
      if (args[0] === '-e' && args[1]) {
        return { text: 'Node.js v20.12.2 execution finished.' };
      }
      return { text: 'Welcome to Node.js v20.12.2.\nType ".help" for more information.' };
    }

    case 'ai': {
      if (!onAiRequest) {
        return { text: "L'assistant IA n'est pas prêt. Assurez-vous d'avoir configuré GEMINI_API_KEY." };
      }
      const query = args.join(' ');
      if (!query) {
        return { text: "Usage de l'assistant IA Gemini :\n  ai <votre question en français>\n  ai explain <commande>\nExemple: ai comment compresser un dossier tar.gz" };
      }

      if (args[0] === 'explain' && args.length > 1) {
        const cmdToExplain = args.slice(1).join(' ');
        const res = await onAiRequest('explain', cmdToExplain);
        if (res.error) return { text: `[Erreur IA] ${res.error}` };
        
        let out = `🤖 **Analyse IA Gemini de la commande :** \`${cmdToExplain}\`\n\n`;
        out += `📌 **Résumé :** ${res.summary || ''}\n`;
        if (res.breakdown && Array.isArray(res.breakdown)) {
          out += `\n🔍 **Détail des options :**\n`;
          res.breakdown.forEach((item: any) => {
            out += `  • \`${item.part}\` : ${item.description}\n`;
          });
        }
        out += `\n⚠️ **Niveau de risque :** ${res.safety || 'Faible'}\n`;
        if (res.example) out += `💡 **Exemple :** \`${res.example}\``;
        return { text: out };
      }

      // Default command generator / query
      const res = await onAiRequest('generate', query);
      if (res.error) return { text: `[Erreur IA] ${res.error}` };

      let out = `🤖 **Assistant IA Gemini (${currentDistro.name})**\n\n`;
      out += `💻 **Commande proposée :**\n\`\`\`bash\n${res.command}\n\`\`\`\n\n`;
      out += `📝 **Explication :** ${res.explanation}\n`;
      if (res.tips) out += `\n💡 **Conseil :** ${res.tips}`;
      return { text: out };
    }

    case 'help':
    case 'man': {
      const docCmd = args[0];
      if (docCmd) {
        return {
          text: `MANUAL PAGE FOR: ${docCmd} (${currentDistro.name})

NOM
       ${docCmd} - commande système Linux

DESCRIPTION
       ${docCmd} fait partie de l'environnement OmniLinux.
       Pour obtenir une explication approfondie assistée par IA, tapez :
       ai explain ${docCmd}`
        };
      }

      return {
        text: `===============================================================
               COMMANDES DISPONIBLES DANS OMNILINUX
===============================================================

Noyau & Fichiers:
  ls, cd, pwd, cat, head, tail, mkdir, touch, rm, grep, tree, echo, chmod

Système & Stats:
  whoami, hostname, uname, date, uptime, history, neofetch, htop, top, ping

Gestionnaires de Paquets (Simulés):
  apt, pacman, dnf, apk, zypper, xbps-install, nix-env, snap

Éditeurs de Texte Interactifs:
  nano <fichier>   : Ouvre l'éditeur Nano dans le terminal
  vim <fichier>    : Ouvre l'éditeur Vim dans le terminal

Distribution:
  distro           : Liste et permet de changer la distribution Linux

Assistant IA Gemini:
  ai <question>    : Posez une question sur Linux en langage naturel
  ai explain <cmd> : Obtenez l'explication détaillée d'une commande

Animations & Divertissement:
  cmatrix          : Pluie de code Matrix
  sl               : Train à vapeur animé
  cowsay, fortune  : Citations et vaches parlantes`
      };
    }

    default: {
      // Check if executing a local script e.g. ./backup.sh
      if (mainCmd.startsWith('./') || mainCmd.endsWith('.sh')) {
        const scriptPath = vfs.normalizePath(mainCmd, cwd);
        const node = vfs.getNodeByPath(scriptPath);
        if (node && node.type === 'file') {
          const lines = (node.content || '').split('\n');
          let outputLines: string[] = [`[+] Exécution du script ${node.name}...`];
          for (const line of lines) {
            const l = line.trim();
            if (l.startsWith('#') || !l) continue;
            if (l.startsWith('echo ')) {
              outputLines.push(l.substring(5).replace(/^["']|["']$/g, ''));
            } else if (l === 'date') {
              outputLines.push(new Date().toString());
            } else if (l.startsWith('mkdir ')) {
              vfs.createDir(cwd, l.substring(6));
            }
          }
          outputLines.push(`[+] Script terminé.`);
          return { text: outputLines.join('\n') };
        }
      }

      return {
        text: `bash: ${mainCmd}: commande introuvable. Tapez 'help' pour voir la liste des commandes ou 'ai ${mainCmd}' pour demander à l'IA.`
      };
    }
  }
}
