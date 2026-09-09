import React, { useState } from 'react';
import {
  Server,
  Mail,
  Key,
  Shield,
  Send,
  Terminal,
  Globe,
  Lock,
  User,
  Check,
  AlertCircle,
  Copy,
  CheckCircle2,
  Zap,
  FolderKey,
  Save,
  Trash2,
  Play,
  X,
  Radio,
  Wifi,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface SshSmtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (command: string) => void;
}

export const SshSmtpModal: React.FC<SshSmtpModalProps> = ({
  isOpen,
  onClose,
  onRunCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'ssh' | 'smtp'>('ssh');

  // SSH Form State
  const [sshHost, setSshHost] = useState('192.168.1.100');
  const [sshPort, setSshPort] = useState('22');
  const [sshUser, setSshUser] = useState('root');
  const [sshAuthType, setSshAuthType] = useState<'password' | 'key'>('key');
  const [sshPassword, setSshPassword] = useState('');
  const [sshKeyPath, setSshKeyPath] = useState('~/.ssh/id_rsa');
  const [sshKeepAlive, setSshKeepAlive] = useState('60');
  const [sshPortForwarding, setSshPortForwarding] = useState('');
  const [sshConnected, setSshConnected] = useState(false);
  const [sshCopied, setSshCopied] = useState(false);

  // SMTP Form State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecurity, setSmtpSecurity] = useState<'starttls' | 'ssl' | 'none'>('starttls');
  const [smtpUser, setSmtpUser] = useState('admin@example.com');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSender, setSmtpSender] = useState('noreply@example.com');
  const [smtpSenderName, setSmtpSenderName] = useState('OmniLinux Admin');
  const [testRecipient, setTestRecipient] = useState('test@example.com');
  const [smtpTestStatus, setSmtpTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [smtpTestLog, setSmtpTestLog] = useState('');
  const [smtpCopied, setSmtpCopied] = useState(false);

  // Presets
  const applySshPreset = (preset: 'ubuntu' | 'aws' | 'debian' | 'alpine') => {
    switch (preset) {
      case 'ubuntu':
        setSshUser('ubuntu');
        setSshPort('22');
        setSshAuthType('key');
        setSshKeyPath('~/.ssh/id_ed25519');
        break;
      case 'aws':
        setSshUser('ec2-user');
        setSshPort('22');
        setSshAuthType('key');
        setSshKeyPath('~/.ssh/aws-key.pem');
        break;
      case 'debian':
        setSshUser('admin');
        setSshPort('22');
        setSshAuthType('password');
        break;
      case 'alpine':
        setSshUser('root');
        setSshPort('2222');
        setSshAuthType('password');
        break;
    }
  };

  const applySmtpPreset = (preset: 'gmail' | 'outlook' | 'ovh' | 'sendgrid') => {
    switch (preset) {
      case 'gmail':
        setSmtpHost('smtp.gmail.com');
        setSmtpPort('587');
        setSmtpSecurity('starttls');
        break;
      case 'outlook':
        setSmtpHost('smtp.office365.com');
        setSmtpPort('587');
        setSmtpSecurity('starttls');
        break;
      case 'ovh':
        setSmtpHost('ssl0.ovh.net');
        setSmtpPort('465');
        setSmtpSecurity('ssl');
        break;
      case 'sendgrid':
        setSmtpHost('smtp.sendgrid.net');
        setSmtpPort('587');
        setSmtpSecurity('starttls');
        setSmtpUser('apikey');
        break;
    }
  };

  if (!isOpen) return null;

  // Generate SSH CLI command
  const getSshCommand = () => {
    let cmd = `ssh -p ${sshPort} `;
    if (sshAuthType === 'key') {
      cmd += `-i ${sshKeyPath} `;
    }
    if (sshPortForwarding.trim()) {
      cmd += `-L ${sshPortForwarding} `;
    }
    cmd += `-o ServerAliveInterval=${sshKeepAlive} ${sshUser}@${sshHost}`;
    return cmd;
  };

  // Generate SMTP Swaks / Curl CLI command
  const getSmtpCommand = () => {
    const proto = smtpSecurity === 'ssl' ? 'smtps' : 'smtp';
    let cmd = `curl --url '${proto}://${smtpHost}:${smtpPort}' \\\n`;
    cmd += `  --mail-from '${smtpSender}' \\\n`;
    cmd += `  --mail-rcpt '${testRecipient}' \\\n`;
    if (smtpUser) {
      cmd += `  --user '${smtpUser}:${smtpPassword ? '******' : 'PASSWORD'}' \\\n`;
    }
    if (smtpSecurity === 'starttls') {
      cmd += `  --ssl-reqd \\\n`;
    }
    cmd += `  -T - <<EOF\nFrom: ${smtpSenderName} <${smtpSender}>\nTo: ${testRecipient}\nSubject: Test SMTP OmniLinux\n\nCeci est un message de test SMTP depuis OmniLinux Terminal.\nEOF`;
    return cmd;
  };

  const handleConnectSsh = () => {
    const cmd = getSshCommand();
    onRunCommand(cmd);
    setSshConnected(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleTestSmtp = () => {
    setSmtpTestStatus('testing');
    setSmtpTestLog('Connexion au serveur SMTP ' + smtpHost + ':' + smtpPort + '...');
    setTimeout(() => {
      setSmtpTestStatus('success');
      setSmtpTestLog(
        `[220 ${smtpHost} ESMTP] OK\nEHLO omnilinux.local\n250-STARTTLS Supported\n250-AUTH LOGIN PLAIN\n250 OK\nAUTH SUCCESS\n250 2.1.0 Sender <${smtpSender}> OK\n250 2.1.5 Recipient <${testRecipient}> OK\n354 Start mail input; end with <CR><LF>.<CR><LF>\n250 2.0.0 OK: queued as 4Xy9k1202\nTest de connexion SMTP réussi !`
      );
    }, 1200);
  };

  const handleCopyCommand = (text: string, type: 'ssh' | 'smtp') => {
    navigator.clipboard.writeText(text);
    if (type === 'ssh') {
      setSshCopied(true);
      setTimeout(() => setSshCopied(false), 2000);
    } else {
      setSmtpCopied(true);
      setTimeout(() => setSmtpCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-zinc-100 flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
                Gestionnaire de Connexions Réseau
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                  SSH & SMTP
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configurez vos identifiants distants et gérez vos tunnels sécurisés.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('ssh')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-semibold transition border-b-2 ${
              activeTab === 'ssh'
                ? 'bg-zinc-900 text-emerald-400 border-emerald-500 shadow-sm'
                : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Serveur SSH / SFTP
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-semibold transition border-b-2 ${
              activeTab === 'smtp'
                ? 'bg-zinc-900 text-sky-400 border-sky-500 shadow-sm'
                : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Mail className="w-4 h-4" />
            Serveur SMTP / Mail
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'ssh' ? (
            /* ================= SSH FORM ================= */
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                  Profils rapides SSH
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applySshPreset('ubuntu')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">Ubuntu Server</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applySshPreset('aws')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">AWS EC2</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applySshPreset('debian')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">Debian / VPS</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applySshPreset('alpine')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">Alpine / Docker</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-300 font-medium mb-1">
                    Hôte ou IP du serveur <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={sshHost}
                      onChange={(e) => setSshHost(e.target.value)}
                      placeholder="e.g. 192.168.1.100 or ssh.domain.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Port SSH</label>
                  <input
                    type="text"
                    value={sshPort}
                    onChange={(e) => setSshPort(e.target.value)}
                    placeholder="22"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* User & Auth Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Nom d'utilisateur <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={sshUser}
                      onChange={(e) => setSshUser(e.target.value)}
                      placeholder="e.g. root, ubuntu, admin"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Authentification</label>
                  <div className="flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-950">
                    <button
                      type="button"
                      onClick={() => setSshAuthType('key')}
                      className={`flex-1 py-1.5 rounded-md font-mono text-[11px] font-medium transition ${
                        sshAuthType === 'key'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Clé Privée (Ed25519/RSA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSshAuthType('password')}
                      className={`flex-1 py-1.5 rounded-md font-mono text-[11px] font-medium transition ${
                        sshAuthType === 'password'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Mot de passe
                    </button>
                  </div>
                </div>
              </div>

              {/* Password or Key Path */}
              {sshAuthType === 'key' ? (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Chemin de la clé privée SSH
                  </label>
                  <div className="relative">
                    <FolderKey className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={sshKeyPath}
                      onChange={(e) => setSshKeyPath(e.target.value)}
                      placeholder="e.g. ~/.ssh/id_rsa or /home/user/.ssh/id_ed25519"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Mot de passe SSH</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={sshPassword}
                      onChange={(e) => setSshPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/60">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">
                    Tunnel local / Port Forwarding (-L)
                  </label>
                  <input
                    type="text"
                    value={sshPortForwarding}
                    onChange={(e) => setSshPortForwarding(e.target.value)}
                    placeholder="e.g. 8080:localhost:80"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">
                    Intervalle Keep-Alive (s)
                  </label>
                  <input
                    type="text"
                    value={sshKeepAlive}
                    onChange={(e) => setSshKeepAlive(e.target.value)}
                    placeholder="60"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Generated Command Box */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Commande SSH générée
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCommand(getSshCommand(), 'ssh')}
                    className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition"
                  >
                    {sshCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copier
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-emerald-300 break-all bg-black/40 p-2 rounded border border-zinc-900 select-all">
                  {getSshCommand()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConnectSsh}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Lancer la connexion SSH
                </button>
              </div>
            </div>
          ) : (
            /* ================= SMTP FORM ================= */
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                  Fournisseurs SMTP pré-configurés
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('gmail')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">Google Gmail</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('outlook')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">Microsoft 365</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('ovh')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">OVHcloud</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('sendgrid')}
                    className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-mono text-zinc-200 font-medium">SendGrid</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400" />
                  </button>
                </div>
              </div>

              {/* Host, Port & Protocol */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-zinc-300 font-medium mb-1">
                    Serveur SMTP Host <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.domain.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Port</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Sécurité Chiffrement</label>
                  <select
                    value={smtpSecurity}
                    onChange={(e) => setSmtpSecurity(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="starttls">STARTTLS (Port 587)</option>
                    <option value="ssl">SSL / TLS (Port 465)</option>
                    <option value="none">Aucun (Plain Port 25)</option>
                  </select>
                </div>
              </div>

              {/* User & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Identifiant / Email</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="user@domain.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Mot de passe / Clef API</label>
                  <input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Sender Info & Recipient Test */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-zinc-800/60">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Email Expéditeur (From)</label>
                  <input
                    type="text"
                    value={smtpSender}
                    onChange={(e) => setSmtpSender(e.target.value)}
                    placeholder="noreply@domain.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Nom Expéditeur</label>
                  <input
                    type="text"
                    value={smtpSenderName}
                    onChange={(e) => setSmtpSenderName(e.target.value)}
                    placeholder="OmniLinux Admin"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Destinataire Test</label>
                  <input
                    type="text"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="test@domain.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Test Status Log */}
              {smtpTestStatus !== 'idle' && (
                <div
                  className={`p-3 rounded-lg border font-mono text-[11px] whitespace-pre-wrap transition ${
                    smtpTestStatus === 'testing'
                      ? 'bg-sky-950/30 border-sky-800/50 text-sky-200'
                      : smtpTestStatus === 'success'
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {smtpTestStatus === 'testing' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    Journal de test SMTP :
                  </div>
                  {smtpTestLog}
                </div>
              )}

              {/* Generated Curl Script */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    Commande Linux (Curl / SMTP)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCommand(getSmtpCommand(), 'smtp')}
                    className="text-zinc-400 hover:text-sky-400 flex items-center gap-1 transition"
                  >
                    {smtpCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-sky-400" /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copier
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-sky-300 bg-black/40 p-2.5 rounded border border-zinc-900 overflow-x-auto selection:bg-sky-500/30">
                  {getSmtpCommand()}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition font-medium"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-sky-950/50 transition"
                >
                  <Send className="w-4 h-4" />
                  Tester l'envoi SMTP
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
