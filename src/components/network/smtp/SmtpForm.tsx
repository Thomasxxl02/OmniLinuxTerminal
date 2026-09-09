import { useCallback, useEffect, useState } from 'react';
import { Wifi, Send } from 'lucide-react';
import {
  smtpTestConnection,
  smtpSendTest,
  smtpSaveProfile,
  smtpListProfiles,
  smtpDeleteProfile,
  SmtpConfig,
  SmtpProfile,
} from '../../../lib/smtpApi';
import { secretSave, secretDelete } from '../../../lib/secretsApi';
import { formatError } from '../../../lib/ipcError';
import { SmtpPresets, SmtpPresetKey } from './SmtpPresets';
import { SmtpTestResult } from './SmtpTestResult';
import { ProfileBar } from '../ProfileBar';
import { Status, IDLE } from '../StatusBox';

// ===========================================================================
// Formulaire SMTP (auto-porté) : détient SON état de formulaire, ses handlers
// (test/envoi/profils) et appelle le backend Rust + le trousseau de secrets.
// La validation et les profils vivent en Rust ; ce composant reste purement
// visuel.
// ===========================================================================

interface SmtpFormProps {
  onClose: () => void;
}

export function SmtpForm({ onClose }: SmtpFormProps) {
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState('587');
  const [security, setSecurity] = useState<'startTls' | 'ssl' | 'none'>('startTls');
  const [user, setUser] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [sender, setSender] = useState('noreply@example.com');
  const [senderName, setSenderName] = useState('OmniLinux Admin');
  const [testRecipient, setTestRecipient] = useState('test@example.com');
  const [testStatus, setTestStatus] = useState<Status>(IDLE);
  const [sendStatus, setSendStatus] = useState<Status>(IDLE);
  const [profiles, setProfiles] = useState<SmtpProfile[]>([]);
  const [profileName, setProfileName] = useState('');

  const reloadProfiles = useCallback(async () => {
    try {
      setProfiles(await smtpListProfiles());
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    reloadProfiles();
  }, [reloadProfiles]);

  const applyPreset = (preset: SmtpPresetKey) => {
    switch (preset) {
      case 'gmail':
        setHost('smtp.gmail.com');
        setPort('587');
        setSecurity('startTls');
        break;
      case 'outlook':
        setHost('smtp.office365.com');
        setPort('587');
        setSecurity('startTls');
        break;
      case 'ovh':
        setHost('ssl0.ovh.net');
        setPort('465');
        setSecurity('ssl');
        break;
      case 'sendgrid':
        setHost('smtp.sendgrid.net');
        setPort('587');
        setSecurity('startTls');
        setUser('apikey');
        break;
    }
  };

  const parsePort = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const buildConfig = (): SmtpConfig => ({
    host: host.trim(),
    port: parsePort(port, 587),
    security,
    user: user.trim() || undefined,
    password: password || undefined,
    fromAddress: sender.trim(),
    fromName: senderName.trim() || undefined,
    toAddress: testRecipient.trim() || undefined,
  });

  const errMsg = (e: unknown) => formatError(e);

  const handleTest = async () => {
    setTestStatus({ phase: 'running', message: `Test de connexion SMTP vers ${host}:${port}...` });
    try {
      const res = await smtpTestConnection(buildConfig());
      setTestStatus({
        phase: 'success',
        message: res.message,
        detail: res.serverGreeting ? `Réponse serveur : ${res.serverGreeting}` : undefined,
      });
    } catch (e) {
      setTestStatus({ phase: 'error', message: 'Test de connexion SMTP échoué', detail: errMsg(e) });
    }
  };

  const handleSend = async () => {
    setSendStatus({ phase: 'running', message: `Envoi du message de test à ${testRecipient}...` });
    try {
      const res = await smtpSendTest(buildConfig());
      setSendStatus({ phase: 'success', message: res.message });
    } catch (e) {
      setSendStatus({ phase: 'error', message: 'Envoi du test échoué', detail: errMsg(e) });
    }
  };

  const applyProfile = (p: SmtpProfile) => {
    setHost(p.host);
    setPort(String(p.port));
    setSecurity(p.security);
    setUser(p.user || '');
    setSender(p.fromAddress);
    setSenderName(p.fromName || '');
    setPassword('');
  };

  const saveProfile = async () => {
    const name = profileName.trim();
    if (!name) return;
    try {
      const cfg = buildConfig();
      await smtpSaveProfile({
        id: '',
        name,
        host: cfg.host,
        port: cfg.port,
        security: cfg.security,
        user: cfg.user,
        fromAddress: cfg.fromAddress,
        fromName: cfg.fromName,
        updatedAt: '',
      });
      setProfileName('');
      await reloadProfiles();
      // Secret stocké au trousseau système s'il est renseigné.
      if (password) {
        await secretSave('smtp', name, password);
      }
    } catch (e) {
      setTestStatus({ phase: 'error', message: 'Sauvegarde du profil SMTP échouée', detail: errMsg(e) });
    }
  };

  const deleteProfile = async (id: string) => {
    const p = profiles.find((x) => x.id === id);
    try {
      await smtpDeleteProfile(id);
      if (p?.name) {
        await secretDelete('smtp', p.name).catch(() => {});
      }
    } catch (e) {
      console.warn('[secret_delete smtp]', e);
    }
    await reloadProfiles();
  };

  return (
    <div className="space-y-4">
      <SmtpPresets onApply={applyPreset} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-zinc-300 font-medium mb-1">
            Serveur SMTP Host <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.domain.com"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Port</label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="587"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Sécurité Chiffrement</label>
          <select
            value={security}
            onChange={(e) => setSecurity(e.target.value as 'startTls' | 'ssl' | 'none')}
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
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="user@domain.com"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-300 font-medium mb-1">Mot de passe / Clef API</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="noreply@domain.com"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-[11px] mb-1">Nom Expéditeur</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
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

      <SmtpTestResult testStatus={testStatus} sendStatus={sendStatus} />

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
          disabled={testStatus.phase === 'running'}
          className="px-4 py-2 rounded-lg border border-sky-600/50 text-sky-300 hover:bg-sky-600/10 transition font-medium flex items-center gap-2"
        >
          <Wifi className="w-4 h-4" /> Tester la connexion
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sendStatus.phase === 'running'}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-sky-950/50 transition"
        >
          <Send className="w-4 h-4" /> Envoyer le test
        </button>
      </div>
    </div>
  );
}
