import { useCallback, useEffect, useState } from 'react';
import { Radio, Play, X } from 'lucide-react';
import {
  sshTestConnection,
  sshConnect,
  sshDisconnect,
  sshSaveProfile,
  sshListProfiles,
  sshDeleteProfile,
  SshConfig,
  SshProfile,
  SshConnectionInfo,
} from '../../../lib/sshApi';
import { secretSave, secretDelete } from '../../../lib/secretsApi';
import { formatError } from '../../../lib/ipcError';
import { SshPresets, SshPresetKey } from './SshPresets';
import { SshStatus } from './SshStatus';
import { ProfileBar } from '../ProfileBar';
import { Status, IDLE } from '../StatusBox';

// ===========================================================================
// Formulaire SSH (auto-porté) : détient SON état de formulaire, ses handlers
// (test/connexion/déconnexion/profils) et appelle le backend Rust + le
// trousseau de secrets. La validation et les profils vivent en Rust ; ce
// composant reste purement visuel.
// ===========================================================================

interface SshFormProps {
  onConnected: (info: SshConnectionInfo) => void;
  onClose: () => void;
}

export function SshForm({ onConnected, onClose }: SshFormProps) {
  const [host, setHost] = useState('192.168.1.100');
  const [port, setPort] = useState('22');
  const [user, setUser] = useState('root');
  const [authType, setAuthType] = useState<'key' | 'password'>('key');
  const [password, setPassword] = useState('');
  const [keyPath, setKeyPath] = useState('~/.ssh/id_rsa');
  const [keepAlive, setKeepAlive] = useState('60');
  const [portForwarding, setPortForwarding] = useState('');
  const [status, setStatus] = useState<Status>(IDLE);
  const [connected, setConnected] = useState(false);
  const [allowUnknown, setAllowUnknown] = useState(false);
  const [profiles, setProfiles] = useState<SshProfile[]>([]);
  const [profileName, setProfileName] = useState('');

  const reloadProfiles = useCallback(async () => {
    try {
      setProfiles(await sshListProfiles());
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    reloadProfiles();
  }, [reloadProfiles]);

  const applyPreset = (preset: SshPresetKey) => {
    switch (preset) {
      case 'ubuntu':
        setUser('ubuntu');
        setPort('22');
        setAuthType('key');
        setKeyPath('~/.ssh/id_ed25519');
        break;
      case 'aws':
        setUser('ec2-user');
        setPort('22');
        setAuthType('key');
        setKeyPath('~/.ssh/aws-key.pem');
        break;
      case 'debian':
        setUser('admin');
        setPort('22');
        setAuthType('password');
        break;
      case 'alpine':
        setUser('root');
        setPort('2222');
        setAuthType('password');
        break;
    }
  };

  const parsePort = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const buildConfig = (): SshConfig => ({
    host: host.trim(),
    port: parsePort(port, 22),
    user: user.trim(),
    authType,
    password: password || undefined,
    keyPath: keyPath.trim() || undefined,
    keepAlive: parsePort(keepAlive, 60),
    portForwarding: portForwarding.trim() || undefined,
    allowUnknownHostKey: allowUnknown,
  });

  const errMsg = (e: unknown) => formatError(e);

  const hostKeyText = (s: string, fp?: string): string => {
    const label =
      s === 'new'
        ? 'Nouvelle clé d\u2019hôte enregistrée (TOFU)'
        : s === 'verified'
        ? 'Clé d\u2019hôte vérifiée'
        : '⚠ Clé d\u2019hôte modifiée (autorisée)';
    return fp ? `${label} · SHA-256 ${fp.slice(0, 16)}…` : label;
  };

  const handleTest = async () => {
    setStatus({ phase: 'running', message: `Test de connexion SSH vers ${host}:${port}...` });
    try {
      const res = await sshTestConnection(buildConfig());
      setStatus({
        phase: 'success',
        message: res.message,
        detail: [res.serverBanner ? `Bannière : ${res.serverBanner}` : undefined, hostKeyText(res.hostKeyStatus, res.hostKeyFingerprint)]
          .filter(Boolean)
          .join('\n'),
      });
    } catch (e) {
      setStatus({ phase: 'error', message: 'Test de connexion échoué', detail: errMsg(e) });
    }
  };

  const handleConnect = async () => {
    setStatus({ phase: 'running', message: `Connexion SSH à ${host}:${port}...` });
    try {
      const res = await sshConnect(buildConfig());
      setConnected(true);
      setStatus({
        phase: 'success',
        message: res.message,
        detail: [res.serverBanner ? `Bannière : ${res.serverBanner}` : undefined, hostKeyText(res.hostKeyStatus, res.hostKeyFingerprint)]
          .filter(Boolean)
          .join('\n'),
      });
      onConnected(res);
      onClose();
    } catch (e) {
      setConnected(false);
      setStatus({ phase: 'error', message: 'Connexion SSH échouée', detail: errMsg(e) });
    }
  };

  const handleDisconnect = async () => {
    try {
      await sshDisconnect();
      setConnected(false);
      setStatus(IDLE);
    } catch (e) {
      setStatus({ phase: 'error', message: 'Déconnexion échouée', detail: errMsg(e) });
    }
  };

  const applyProfile = (p: SshProfile) => {
    setHost(p.host);
    setPort(String(p.port));
    setUser(p.user);
    setAuthType(p.authType);
    setKeyPath(p.keyPath || '');
    setKeepAlive(String(p.keepAlive));
    setPortForwarding(p.portForwarding || '');
    setPassword('');
  };

  const saveProfile = async () => {
    const name = profileName.trim();
    if (!name) return;
    try {
      const cfg = buildConfig();
      await sshSaveProfile({
        id: '',
        name,
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        authType: cfg.authType,
        keyPath: cfg.keyPath,
        keepAlive: cfg.keepAlive,
        portForwarding: cfg.portForwarding,
        updatedAt: '',
      });
      setProfileName('');
      await reloadProfiles();
      // Secret stocké au trousseau système (jamais en localStorage / logs).
      if (password) {
        await secretSave('ssh', name, password);
      }
    } catch (e) {
      setStatus({ phase: 'error', message: 'Sauvegarde du profil SSH échouée', detail: errMsg(e) });
    }
  };

  const deleteProfile = async (id: string) => {
    const p = profiles.find((x) => x.id === id);
    try {
      await sshDeleteProfile(id);
      if (p?.name) {
        await secretDelete('ssh', p.name).catch(() => {});
      }
    } catch (e) {
      console.warn('[secret_delete ssh]', e);
    }
    await reloadProfiles();
  };

  return (
    <div className="space-y-4">
      <SshPresets onApply={applyPreset} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-zinc-300 font-medium mb-1">
            Hôte ou IP du serveur <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="e.g. 192.168.1.100 or ssh.domain.com"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Port SSH</label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
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
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="e.g. root, ubuntu, admin"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Authentification</label>
          <div className="flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-950">
            <button
              type="button"
              onClick={() => setAuthType('key')}
              className={`flex-1 py-1.5 rounded-md font-mono text-[11px] font-medium transition ${
                authType === 'key' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Clé Privée (Ed25519/RSA)
            </button>
            <button
              type="button"
              onClick={() => setAuthType('password')}
              className={`flex-1 py-1.5 rounded-md font-mono text-[11px] font-medium transition ${
                authType === 'password' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mot de passe
            </button>
          </div>
        </div>
      </div>

      {authType === 'key' ? (
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Chemin de la clé privée SSH</label>
          <input
            type="text"
            value={keyPath}
            onChange={(e) => setKeyPath(e.target.value)}
            placeholder="e.g. ~/.ssh/id_rsa or /home/user/.ssh/id_ed25519"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      ) : (
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Mot de passe SSH</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/60">
        <div>
          <label className="block text-zinc-400 text-[11px] mb-1">Tunnel local / Port Forwarding (-L)</label>
          <input
            type="text"
            value={portForwarding}
            onChange={(e) => setPortForwarding(e.target.value)}
            placeholder="e.g. 8080:localhost:80"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-[11px] mb-1">Intervalle Keep-Alive (s)</label>
          <input
            type="text"
            value={keepAlive}
            onChange={(e) => setKeepAlive(e.target.value)}
            placeholder="60"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          checked={allowUnknown}
          onChange={(e) => setAllowUnknown(e.target.checked)}
          className="accent-emerald-500"
        />
        Autoriser une clé d'hôte inconnue / modifiée (dégrade la protection TOFU)
      </label>

      <SshStatus status={status} connected={connected} />

      <ProfileBar
        name={profileName}
        setName={setProfileName}
        onSave={saveProfile}
        onApply={(id) => {
          const p = profiles.find((x) => x.id === id);
          if (p) applyProfile(p);
        }}
        onDelete={deleteProfile}
        list={profiles}
      />

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
          onClick={handleTest}
          disabled={status.phase === 'running'}
          className="px-4 py-2 rounded-lg border border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/10 transition font-medium flex items-center gap-2"
        >
          <Radio className="w-4 h-4" /> Tester la connexion
        </button>
        {!connected ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={status.phase === 'running'}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition"
          >
            <Play className="w-4 h-4 fill-current" /> Lancer la connexion SSH
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisconnect}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-rose-950/50 transition"
          >
            <X className="w-4 h-4" /> Déconnecter
          </button>
        )}
      </div>
    </div>
  );
}
