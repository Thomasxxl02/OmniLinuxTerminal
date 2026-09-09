import React, { useCallback, useEffect, useState } from 'react';
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
  CheckCircle2,
  AlertCircle,
  FolderKey,
  Save,
  Trash2,
  Play,
  X,
  Radio,
  Wifi,
  ChevronRight,
  RefreshCw,
  Plug,
} from 'lucide-react';
import {
  sshTestConnection,
  sshConnect,
  sshDisconnect,
  sshSaveProfile,
  sshListProfiles,
  sshDeleteProfile,
  SshConfig,
  SshProfile,
} from '../lib/sshApi';
import {
  smtpTestConnection,
  smtpSendTest,
  smtpSaveProfile,
  smtpListProfiles,
  smtpDeleteProfile,
  SmtpConfig,
  SmtpProfile,
} from '../lib/smtpApi';

interface SshSmtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StatusPhase = 'idle' | 'running' | 'success' | 'error';

interface Status {
  phase: StatusPhase;
  message: string;
  detail?: string;
}

const IDLE: Status = { phase: 'idle', message: '' };

export const SshSmtpModal: React.FC<SshSmtpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ssh' | 'smtp'>('ssh');

  // SSH Form State
  const [sshHost, setSshHost] = useState('192.168.1.100');
  const [sshPort, setSshPort] = useState('22');
  const [sshUser, setSshUser] = useState('root');
  const [sshAuthType, setSshAuthType] = useState<'key' | 'password'>('key');
  const [sshPassword, setSshPassword] = useState('');
  const [sshKeyPath, setSshKeyPath] = useState('~/.ssh/id_rsa');
  const [sshKeepAlive, setSshKeepAlive] = useState('60');
  const [sshPortForwarding, setSshPortForwarding] = useState('');
  const [sshStatus, setSshStatus] = useState<Status>(IDLE);
  const [sshConnected, setSshConnected] = useState(false);
  const [sshProfiles, setSshProfiles] = useState<SshProfile[]>([]);
  const [sshProfileName, setSshProfileName] = useState('');

  // SMTP Form State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecurity, setSmtpSecurity] = useState<'startTls' | 'ssl' | 'none'>('startTls');
  const [smtpUser, setSmtpUser] = useState('admin@example.com');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSender, setSmtpSender] = useState('noreply@example.com');
  const [smtpSenderName, setSmtpSenderName] = useState('OmniLinux Admin');
  const [testRecipient, setTestRecipient] = useState('test@example.com');
  const [smtpTestStatus, setSmtpTestStatus] = useState<Status>(IDLE);
  const [smtpSendStatus, setSmtpSendStatus] = useState<Status>(IDLE);
  const [smtpProfiles, setSmtpProfiles] = useState<SmtpProfile[]>([]);
  const [smtpProfileName, setSmtpProfileName] = useState('');

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
        setSmtpSecurity('startTls');
        break;
      case 'outlook':
        setSmtpHost('smtp.office365.com');
        setSmtpPort('587');
        setSmtpSecurity('startTls');
        break;
      case 'ovh':
        setSmtpHost('ssl0.ovh.net');
        setSmtpPort('465');
        setSmtpSecurity('ssl');
        break;
      case 'sendgrid':
        setSmtpHost('smtp.sendgrid.net');
        setSmtpPort('587');
        setSmtpSecurity('startTls');
        setSmtpUser('apikey');
        break;
    }
  };

  const parsePort = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const buildSshConfig = (): SshConfig => ({
    host: sshHost.trim(),
    port: parsePort(sshPort, 22),
    user: sshUser.trim(),
    authType: sshAuthType,
    password: sshPassword || undefined,
    keyPath: sshKeyPath.trim() || undefined,
    keepAlive: parsePort(sshKeepAlive, 60),
    portForwarding: sshPortForwarding.trim() || undefined,
  });

  const buildSmtpConfig = (): SmtpConfig => ({
    host: smtpHost.trim(),
    port: parsePort(smtpPort, 587),
    security: smtpSecurity,
    user: smtpUser.trim() || undefined,
    password: smtpPassword || undefined,
    fromAddress: smtpSender.trim(),
    fromName: smtpSenderName.trim() || undefined,
    toAddress: testRecipient.trim() || undefined,
  });

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

  // ---------------- SSH handlers ----------------
  const handleTestSsh = async () => {
    setSshStatus({ phase: 'running', message: `Test de connexion SSH vers ${sshHost}:${sshPort}...` });
    try {
      const res = await sshTestConnection(buildSshConfig());
      setSshStatus({
        phase: 'success',
        message: res.message,
        detail: res.serverBanner ? `Bannière serveur : ${res.serverBanner}` : undefined,
      });
    } catch (e) {
      setSshStatus({ phase: 'error', message: 'Test de connexion échoué', detail: errMsg(e) });
    }
  };

  const handleConnectSsh = async () => {
    setSshStatus({ phase: 'running', message: `Connexion SSH à ${sshHost}:${sshPort}...` });
    try {
      const res = await sshConnect(buildSshConfig());
      setSshConnected(true);
      setSshStatus({
        phase: 'success',
        message: res.message,
        detail: res.serverBanner ? `Bannière serveur : ${res.serverBanner}` : undefined,
      });
    } catch (e) {
      setSshConnected(false);
      setSshStatus({ phase: 'error', message: 'Connexion SSH échouée', detail: errMsg(e) });
    }
  };

  const handleDisconnectSsh = async () => {
    try {
      await sshDisconnect();
      setSshConnected(false);
      setSshStatus({ phase: 'idle', message: '' });
    } catch (e) {
      setSshStatus({ phase: 'error', message: 'Déconnexion échouée', detail: errMsg(e) });
    }
  };

  // ---------------- SMTP handlers ----------------
  const handleTestSmtp = async () => {
    setSmtpTestStatus({ phase: 'running', message: `Test de connexion SMTP vers ${smtpHost}:${smtpPort}...` });
    try {
      const res = await smtpTestConnection(buildSmtpConfig());
      setSmtpTestStatus({
        phase: 'success',
        message: res.message,
        detail: res.serverGreeting ? `Réponse serveur : ${res.serverGreeting}` : undefined,
      });
    } catch (e) {
      setSmtpTestStatus({ phase: 'error', message: 'Test de connexion SMTP échoué', detail: errMsg(e) });
    }
  };

  const handleSendSmtp = async () => {
    setSmtpSendStatus({ phase: 'running', message: `Envoi du message de test à ${testRecipient}...` });
    try {
      const res = await smtpSendTest(buildSmtpConfig());
      setSmtpSendStatus({ phase: 'success', message: res.message });
    } catch (e) {
      setSmtpSendStatus({ phase: 'error', message: 'Envoi du test échoué', detail: errMsg(e) });
    }
  };

  // ---------------- profils ----------------
  const reloadSshProfiles = useCallback(async () => {
    try {
      setSshProfiles(await sshListProfiles());
    } catch {
      setSshProfiles([]);
    }
  }, []);

  const reloadSmtpProfiles = useCallback(async () => {
    try {
      setSmtpProfiles(await smtpListProfiles());
    } catch {
      setSmtpProfiles([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      reloadSshProfiles();
      reloadSmtpProfiles();
    }
  }, [isOpen, reloadSshProfiles, reloadSmtpProfiles]);

  const applySshProfile = (p: SshProfile) => {
    setSshHost(p.host);
    setSshPort(String(p.port));
    setSshUser(p.user);
    setSshAuthType(p.authType);
    setSshKeyPath(p.keyPath || '');
    setSshKeepAlive(String(p.keepAlive));
    setSshPortForwarding(p.portForwarding || '');
    setSshPassword('');
  };

  const saveSshProfile = async () => {
    if (!sshProfileName.trim()) return;
    try {
      const cfg = buildSshConfig();
      await sshSaveProfile({
        id: '',
        name: sshProfileName.trim(),
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        authType: cfg.authType,
        keyPath: cfg.keyPath,
        keepAlive: cfg.keepAlive,
        portForwarding: cfg.portForwarding,
        updatedAt: '',
      });
      setSshProfileName('');
      await reloadSshProfiles();
    } catch (e) {
      setSshStatus({ phase: 'error', message: 'Sauvegarde du profil SSH échouée', detail: errMsg(e) });
    }
  };

  const applySmtpProfile = (p: SmtpProfile) => {
    setSmtpHost(p.host);
    setSmtpPort(String(p.port));
    setSmtpSecurity(p.security);
    setSmtpUser(p.user || '');
    setSmtpSender(p.fromAddress);
    setSmtpSenderName(p.fromName || '');
    setSmtpPassword('');
  };

  const saveSmtpProfile = async () => {
    if (!smtpProfileName.trim()) return;
    try {
      const cfg = buildSmtpConfig();
      await smtpSaveProfile({
        id: '',
        name: smtpProfileName.trim(),
        host: cfg.host,
        port: cfg.port,
        security: cfg.security,
        user: cfg.user,
        fromAddress: cfg.fromAddress,
        fromName: cfg.fromName,
        updatedAt: '',
      });
      setSmtpProfileName('');
      await reloadSmtpProfiles();
    } catch (e) {
      setSmtpTestStatus({ phase: 'error', message: 'Sauvegarde du profil SMTP échouée', detail: errMsg(e) });
    }
  };

  if (!isOpen) return null;

  const statusBox = (st: Status) => {
    if (st.phase === 'idle') return null;
    const isErr = st.phase === 'error';
    return (
      <div
        className={`p-3 rounded-lg border font-mono text-[11px] whitespace-pre-wrap transition ${
          st.phase === 'running'
            ? 'bg-zinc-950/40 border-zinc-700 text-zinc-200'
            : isErr
            ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
            : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2 font-bold mb-1">
          {st.phase === 'running' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
          ) : isErr ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {st.message}
        </div>
        {st.detail && <span className="text-zinc-400">{st.detail}</span>}
      </div>
    );
  };

  const renderProfileBar = (
    name: string,
    setter: (v: string) => void,
    onSave: () => void,
    onApply: (id: string) => void,
    onDelete: (id: string) => void,
    list: { id: string; name: string }[]
  ) => (
    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setter(e.target.value)}
        placeholder="Nom du profil"
        className="flex-1 min-w-[140px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500 transition"
      />
      <button
        type="button"
        onClick={onSave}
        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1.5 transition"
      >
        <Save className="w-3.5 h-3.5" /> Enregistrer
      </button>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {list.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-emerald-300"
            >
              <button
                type="button"
                onClick={() => onApply(p.id)}
                className="hover:text-white transition"
                title="Appliquer"
              >
                {p.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                className="text-zinc-500 hover:text-rose-400 transition"
                title="Supprimer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

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
                Connexions réelles pilotées par le backend Rust — aucun accès simulé.
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
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                  Profils rapides SSH
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ['ubuntu', 'Ubuntu Server'],
                      ['aws', 'AWS EC2'],
                      ['debian', 'Debian / VPS'],
                      ['alpine', 'Alpine / Docker'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applySshPreset(key)}
                      className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                    >
                      <span className="font-mono text-zinc-200 font-medium">{label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-300 font-medium mb-1">
                    Hôte ou IP du serveur <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={sshHost}
                    onChange={(e) => setSshHost(e.target.value)}
                    placeholder="e.g. 192.168.1.100 or ssh.domain.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Nom d'utilisateur <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    placeholder="e.g. root, ubuntu, admin"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
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

              {sshAuthType === 'key' ? (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Chemin de la clé privée SSH</label>
                  <input
                    type="text"
                    value={sshKeyPath}
                    onChange={(e) => setSshKeyPath(e.target.value)}
                    placeholder="e.g. ~/.ssh/id_rsa or /home/user/.ssh/id_ed25519"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Mot de passe SSH</label>
                  <input
                    type="password"
                    value={sshPassword}
                    onChange={(e) => setSshPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              )}

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
                  <label className="block text-zinc-400 text-[11px] mb-1">Intervalle Keep-Alive (s)</label>
                  <input
                    type="text"
                    value={sshKeepAlive}
                    onChange={(e) => setSshKeepAlive(e.target.value)}
                    placeholder="60"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {statusBox(sshStatus)}
              {sshConnected && (
                <div className="flex items-center gap-2 text-emerald-300 font-mono text-[11px]">
                  <Plug className="w-3.5 h-3.5" /> Session SSH active
                </div>
              )}
              {renderProfileBar(
                sshProfileName,
                setSshProfileName,
                saveSshProfile,
                (id) => {
                  const p = sshProfiles.find((x) => x.id === id);
                  if (p) applySshProfile(p);
                },
                async (id) => {
                  await sshDeleteProfile(id);
                  await reloadSshProfiles();
                },
                sshProfiles
              )}

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
                  onClick={handleTestSsh}
                  disabled={sshStatus.phase === 'running'}
                  className="px-4 py-2 rounded-lg border border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/10 transition font-medium flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  Tester la connexion
                </button>
                {!sshConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectSsh}
                    disabled={sshStatus.phase === 'running'}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Lancer la connexion SSH
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDisconnectSsh}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-rose-950/50 transition"
                  >
                    <X className="w-4 h-4" />
                    Déconnecter
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                  Fournisseurs SMTP pré-configurés
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ['gmail', 'Google Gmail'],
                      ['outlook', 'Microsoft 365'],
                      ['ovh', 'OVHcloud'],
                      ['sendgrid', 'SendGrid'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applySmtpPreset(key)}
                      className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-left transition flex items-center justify-between group"
                    >
                      <span className="font-mono text-zinc-200 font-medium">{label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
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
                    onChange={(e) => setSmtpSecurity(e.target.value as 'startTls' | 'ssl' | 'none')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="startTls">STARTTLS (Port 587)</option>
                    <option value="ssl">SSL / TLS (Port 465)</option>
                    <option value="none">Aucun (Plain Port 25)</option>
                  </select>
                </div>
              </div>

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

              {statusBox(smtpTestStatus)}
              {statusBox(smtpSendStatus)}
              {renderProfileBar(
                smtpProfileName,
                setSmtpProfileName,
                saveSmtpProfile,
                (id) => {
                  const p = smtpProfiles.find((x) => x.id === id);
                  if (p) applySmtpProfile(p);
                },
                async (id) => {
                  await smtpDeleteProfile(id);
                  await reloadSmtpProfiles();
                },
                smtpProfiles
              )}

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
                  disabled={smtpTestStatus.phase === 'running'}
                  className="px-4 py-2 rounded-lg border border-sky-600/50 text-sky-300 hover:bg-sky-600/10 transition font-medium flex items-center gap-2"
                >
                  <Wifi className="w-4 h-4" />
                  Tester la connexion
                </button>
                <button
                  type="button"
                  onClick={handleSendSmtp}
                  disabled={smtpSendStatus.phase === 'running'}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-sky-950/50 transition"
                >
                  <Send className="w-4 h-4" />
                  Envoyer le test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
