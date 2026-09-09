import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { TerminalTab, TerminalTheme, DistroId, TerminalSoundStyle, AiConfig } from './types';
import { useDistros, resolveDistro } from './lib/distroStore';
import { TERMINAL_THEMES, DEFAULT_THEME } from './data/themes';
import { MenuBar } from './components/MenuBar';
import { TerminalHeader } from './components/TerminalHeader';
import { TerminalView, SshSessionState } from './components/TerminalView';
import { sshListenSessionOutput, sshSessionWrite, sshDisconnect, SshConnectionInfo } from './lib/sshApi';
import { aiGenerate, aiExplain, aiDebug, aiErrorMessage } from './lib/aiApi';
import { getSettings, updateSetting } from './lib/settingsApi';
import { saveSessionFromTabs, loadSessionTabs } from './lib/sessionApi';
import { fsReset, fsExport, fsImport, fsUpdateOSRelease, errMsg } from './lib/fsApi';
import { useTerminalController } from './hooks/useTerminalController';
import { RiskConfirmModal } from './components/RiskConfirmModal';

// ==== Fenêtres lourdes chargées à la demande (React.lazy) ====
// Réduit le bundle initial : chaque fenêtre (éditeurs, moniteurs, modales,
// gestionnaire réseau) n'est chargée qu'à son ouverture.
const NanoEditor = lazy(() => import('./components/NanoEditor').then((m) => ({ default: m.NanoEditor })));
const VimEditor = lazy(() => import('./components/VimEditor').then((m) => ({ default: m.VimEditor })));
const HtopMonitor = lazy(() => import('./components/HtopMonitor').then((m) => ({ default: m.HtopMonitor })));
const CmatrixCanvas = lazy(() => import('./components/CmatrixCanvas').then((m) => ({ default: m.CmatrixCanvas })));
const SlAnimation = lazy(() => import('./components/SlAnimation').then((m) => ({ default: m.SlAnimation })));
const AiCopilotDrawer = lazy(() => import('./components/AiCopilotDrawer').then((m) => ({ default: m.AiCopilotDrawer })));
const AiConfigModal = lazy(() => import('./components/AiConfigModal').then((m) => ({ default: m.AiConfigModal })));
const ThemeSelectorModal = lazy(() => import('./components/ThemeSelectorModal').then((m) => ({ default: m.ThemeSelectorModal })));
const DistroInfoModal = lazy(() => import('./components/DistroInfoModal').then((m) => ({ default: m.DistroInfoModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then((m) => ({ default: m.HelpModal })));
const AboutModal = lazy(() => import('./components/AboutModal').then((m) => ({ default: m.AboutModal })));
const TauriArchitectureModal = lazy(() => import('./components/TauriArchitectureModal').then((m) => ({ default: m.TauriArchitectureModal })));
const ConnectionManagerModal = lazy(() => import('./components/network/ConnectionManagerModal').then((m) => ({ default: m.ConnectionManagerModal })));

// Fallback des fenêtres lazy (modal / workspace).
const modalFallback = (
  <div className="flex items-center justify-center h-40 text-zinc-500 text-xs font-mono">Chargement…</div>
);
const workspaceFallback = (
  <div className="flex items-center justify-center h-full text-zinc-500 text-xs font-mono">Chargement…</div>
);

export default function App() {
  // Theme & Appearance State
  const [theme, setTheme] = useState<TerminalTheme>(DEFAULT_THEME);
  const [crtEffect, setCrtEffect] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundStyle, setSoundStyle] = useState<TerminalSoundStyle>(() => {
    try {
      return (localStorage.getItem('omnilinux_sound_style') as TerminalSoundStyle) || 'mechanical';
    } catch {
      return 'mechanical';
    }
  });
  const [fontSize, setFontSize] = useState<number>(13);

  // --- Réglages persistés via le store Rust (source de vérité) ---
  const handleSelectSoundStyle = (style: TerminalSoundStyle) => {
    setSoundStyle(style);
    updateSetting('soundStyle', style).catch(() => {});
  };
  const handleToggleCrt = () => {
    const v = !crtEffect;
    setCrtEffect(v);
    updateSetting('crtEffect', v).catch(() => {});
  };
  const handleToggleSound = () => {
    const v = !soundEnabled;
    setSoundEnabled(v);
    updateSetting('soundEnabled', v).catch(() => {});
  };
  const handleChangeFontSize = (n: number) => {
    setFontSize(n);
    updateSetting('fontSize', n).catch(() => {});
  };
  const handleSelectThemeFull = (t: TerminalTheme) => {
    setTheme(t);
    updateSetting('themeId', t.id).catch(() => {});
  };

  // Tabs State
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'tab-1',
      title: 'Ubuntu 24.04',
      distroId: 'ubuntu',
      shell: 'bash',
      cwd: '/home/user',
      history: [],
      commandHistory: [],
      historyIndex: -1,
      envVars: { USER: 'ubuntu', SHELL: 'bash', HOME: '/home/user' },
      installedPackages: [],
      activeEditor: null,
      activeApp: 'none',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  // Modals & Sidebar State
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);
  const [aiConfigModalOpen, setAiConfigModalOpen] = useState<boolean>(false);
  const [themeModalOpen, setThemeModalOpen] = useState<boolean>(false);
  const [distroModalOpen, setDistroModalOpen] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [aboutModalOpen, setAboutModalOpen] = useState<boolean>(false);
  const [tauriModalOpen, setTauriModalOpen] = useState<boolean>(false);
  const [sshSmtpModalOpen, setSshSmtpModalOpen] = useState<boolean>(false);

  // ------ Session SSH interactive (état + stream de sortie) ------
  const [sshSession, setSshSession] = useState<SshSessionState | null>(null);
  const sshOutBuf = useRef('');
  useEffect(() => {
    const un = sshListenSessionOutput((text) => {
      sshOutBuf.current += text;
      setSshSession((prev) => (prev ? { ...prev, output: prev.output + text } : prev));
    });
    return un;
  }, []);

  const handleSshConnected = (info: SshConnectionInfo) => {
    setSshSession({ connected: true, host: info.host, user: info.user, output: sshOutBuf.current });
  };
  const handleSshKey = (bytes: number[]) => {
    sshSessionWrite(new Uint8Array(bytes)).catch(() => {});
  };
  const handleSshDisconnect = () => {
    sshDisconnect().catch(() => {});
    setSshSession(null);
  };

  // Gemini AI Model & API Key Configuration State
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    try {
      const saved = localStorage.getItem('omnilinux_ai_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          model: parsed.model || 'gemini-3.8-flash',
          provider: parsed.provider || 'google',
          customApiKey: parsed.customApiKey || '',
          isCustomKeyEnabled: !!parsed.isCustomKeyEnabled,
          customEndpoint: parsed.customEndpoint || '',
          temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.2,
          persona: parsed.persona || 'sysadmin',
          safetyFilter: parsed.safetyFilter !== undefined ? !!parsed.safetyFilter : true,
        };
      }
    } catch {}
    return {
      model: 'gemini-3.8-flash',
      provider: 'google',
      customApiKey: '',
      isCustomKeyEnabled: false,
      customEndpoint: '',
      temperature: 0.2,
      persona: 'sysadmin',
      safetyFilter: true,
    };
  });

  // Règle « secrets en mémoire » : on ne persiste jamais les clés API
  // (apiKeys, customApiKey) — uniquement la config non sensible.
  const persistAiConfig = (config: AiConfig) => {
    const nonSecret = { ...config };
    delete nonSecret.apiKeys;
    delete nonSecret.customApiKey;
    updateSetting('aiConfig', nonSecret).catch(() => {});
  };

  const handleSaveAiConfig = (newConfig: AiConfig) => {
    setAiConfig(newConfig);
    persistAiConfig(newConfig);
  };

  const handleSelectAiModel = (modelId: string) => {
    const updated = { ...aiConfig, model: modelId };
    setAiConfig(updated);
    persistAiConfig(updated);
  };

  // Hydratation depuis le store Rust (source de vérité) + migration des anciens
  // réglages localStorage. Les secrets ne sont jamais persistés.
  useEffect(() => {
    let mounted = true;
    getSettings()
      .then((s) => {
        if (!mounted) return;
        const legacySound = localStorage.getItem('omnilinux_sound_style');
        const legacyAi = localStorage.getItem('omnilinux_ai_config');

        if (typeof s.themeId === 'string') {
          const t = TERMINAL_THEMES.find((th) => th.id === s.themeId);
          if (t) setTheme(t);
        }
        if (typeof s.crtEffect === 'boolean') setCrtEffect(s.crtEffect);
        if (typeof s.soundEnabled === 'boolean') setSoundEnabled(s.soundEnabled);
        if (typeof s.fontSize === 'number') setFontSize(s.fontSize);

        if (typeof s.soundStyle === 'string') setSoundStyle(s.soundStyle as TerminalSoundStyle);
        else if (legacySound) {
          setSoundStyle(legacySound as TerminalSoundStyle);
          updateSetting('soundStyle', legacySound).catch(() => {});
        }

        if (s.aiConfig && typeof s.aiConfig === 'object') {
          setAiConfig((prev) => ({ ...prev, ...(s.aiConfig as Partial<AiConfig>) }));
        } else if (legacyAi) {
          try {
            const parsed = JSON.parse(legacyAi) || {};
            const nonSecret = { ...parsed };
            delete nonSecret.apiKeys;
            delete nonSecret.customApiKey;
            setAiConfig((prev) => ({ ...prev, ...(nonSecret as Partial<AiConfig>) }));
            updateSetting('aiConfig', nonSecret).catch(() => {});
          } catch {}
        }

        // Secrets jamais persistés : purge du stockage local historique.
        try { localStorage.removeItem('omnilinux_sound_style'); } catch {}
        try { localStorage.removeItem('omnilinux_ai_config'); } catch {}
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Hydratation de la session (onglets) depuis le store Rust + sauvegarde auto.
  const sessionHydrated = useRef(false);
  useEffect(() => {
    let mounted = true;
    loadSessionTabs()
      .then((s) => {
        if (!mounted) return;
        if (s) {
          setTabs(s.tabs);
          setActiveTabId(s.activeTabId);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) sessionHydrated.current = true;
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (sessionHydrated.current) {
      saveSessionFromTabs(tabs, activeTabId).catch(() => {});
    }
  }, [tabs, activeTabId]);

  const distros = useDistros();
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeDistro = resolveDistro(distros, activeTab.distroId);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T or Cmd+T: New Tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't' && !e.shiftKey) {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+W or Cmd+W: Close Tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        if (tabs.length > 1) {
          e.preventDefault();
          handleCloseTab(activeTabId);
        }
      }
      // Ctrl+I or Cmd+I: Toggle AI Copilot
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setAiDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId]);

  // New Tab Handler
  const handleNewTab = (distroId: DistroId = activeTab.distroId) => {
    const distro = resolveDistro(distros, distroId);
    const newTabId = `tab-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newTabId,
      title: distro.name.split(' ')[0],
      distroId: distro.id,
      shell: 'bash',
      cwd: '/home/user',
      history: [],
      commandHistory: [],
      historyIndex: -1,
      envVars: { USER: distro.defaultUser, SHELL: 'bash', HOME: '/home/user' },
      installedPackages: [],
      activeEditor: null,
      activeApp: 'none',
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);
  };

  // Duplicate Tab Handler
  const handleDuplicateTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: TerminalTab = {
      ...activeTab,
      id: newTabId,
      title: `${activeTab.title} (2)`,
      history: [...activeTab.history],
      commandHistory: [...activeTab.commandHistory],
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);
  };

  // Close Tab Handler
  const handleCloseTab = (id: string) => {
    if (tabs.length === 1) return;
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  // Update Active Tab
  const handleUpdateTab = (updated: Partial<TerminalTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...updated } : t))
    );
  };

  // Contrôleur d'exécution de commande (source unique, partagé avec le terminal).
  const controller = useTerminalController(handleUpdateTab);

  // Clear Terminal Screen
  const handleClearTerminal = () => {
    handleUpdateTab({ history: [] });
  };

  // Clear Command History
  const handleClearHistory = () => {
    handleUpdateTab({ commandHistory: [], historyIndex: -1 });
  };

  // Launch Interactive App
  const handleLaunchApp = (app: 'htop' | 'matrix' | 'sl' | 'nano' | 'vim' | 'none') => {
    if (app === 'nano') {
      handleUpdateTab({
        activeEditor: {
          type: 'nano',
          filePath: `${activeTab.cwd}/fichier.txt`,
          fileContent: '# Nouveau fichier texte\n# Écrivez votre contenu ici...\n',
        },
        activeApp: 'none',
      });
    } else if (app === 'vim') {
      handleUpdateTab({
        activeEditor: {
          type: 'vim',
          filePath: `${activeTab.cwd}/script.sh`,
          fileContent: '#!/bin/bash\n# Script Vim\necho "Hello from Vim"\n',
        },
        activeApp: 'none',
      });
    } else {
      handleUpdateTab({ activeApp: app, activeEditor: null });
    }
  };

  // Run a quick predefined command in the terminal (via le contrôleur unifié).
  const handleRunQuickCommand = async (cmd: string) => {
    await controller.runCommand(cmd, activeTab);
  };

  // Réinitialiser le système de fichiers (backend Rust)
  const handleResetSystem = async () => {
    try {
      await fsReset();
      handleUpdateTab({
        history: [
          ...activeTab.history,
          {
            id: `reset-${Date.now()}`,
            type: 'system',
            content: '✓ Système de fichiers virtuel réinitialisé avec succès à son état d\'origine.',
            cwd: activeTab.cwd,
            distroId: activeTab.distroId,
          },
        ],
      });
    } catch (e: any) {
      handleUpdateTab({
        history: [
          ...activeTab.history,
          {
            id: `reset-err-${Date.now()}`,
            type: 'error',
            content: `❌ Erreur lors de la réinitialisation : ${errMsg(e)}`,
            cwd: activeTab.cwd,
            distroId: activeTab.distroId,
          },
        ],
      });
    }
  };

  // Export File System as JSON (Rust VFS)
  const handleExportFileSystem = async () => {
    try {
      const fsData = await fsExport();
      const blob = new Blob([fsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnilinux-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.warn('Échec de l\'export du système de fichiers :', errMsg(e));
    }
  };

  // Rename Tab Handler
  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  // Close other tabs
  const handleCloseOtherTabs = () => {
    setTabs((prev) => prev.filter((t) => t.id === activeTabId));
  };

  // New guest sandbox tab
  const handleNewGuestTab = () => {
    const newTabId = `tab-guest-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newTabId,
      title: 'Guest Sandbox (Alpine)',
      distroId: 'alpine',
      shell: 'sh',
      cwd: '/tmp',
      history: [
        {
          id: `guest-${Date.now()}`,
          type: 'system',
          content: '🔒 Session Sandbox Invité éphémère initialisée dans /tmp. Mode restreint activé.',
          cwd: '/tmp',
          distroId: 'alpine',
        },
      ],
      commandHistory: [],
      historyIndex: -1,
      envVars: { USER: 'guest', SHELL: 'sh', HOME: '/tmp' },
      installedPackages: [],
      activeEditor: null,
      activeApp: 'none',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);
  };

  // Quick Select Theme By ID
  const handleSelectThemeById = (themeId: string) => {
    const found = TERMINAL_THEMES.find((t) => t.id === themeId);
    if (found) setTheme(found);
    updateSetting('themeId', themeId).catch(() => {});
  };

  // Import VFS JSON Handler (Rust VFS)
  const handleImportFileSystem = async (jsonContent: string) => {
    try {
      await fsImport(jsonContent);
      handleUpdateTab({
        history: [
          ...activeTab.history,
          {
            id: `import-${Date.now()}`,
            type: 'system',
            content: '✓ Sauvegarde VFS importée et restaurée avec succès !',
            cwd: activeTab.cwd,
            distroId: activeTab.distroId,
          },
        ],
      });
    } catch (e: any) {
      handleUpdateTab({
        history: [
          ...activeTab.history,
          {
            id: `import-err-${Date.now()}`,
            type: 'error',
            content: `❌ Erreur : Format de fichier JSON invalide pour la restauration VFS. (${errMsg(e)})`,
            cwd: activeTab.cwd,
            distroId: activeTab.distroId,
          },
        ],
      });
    }
  };

  // Download Terminal History Log (.log)
  const handleDownloadLog = () => {
    try {
      const logLines = activeTab.history
        .map((h) => `[${h.type.toUpperCase()}] ${h.distroId}@${h.cwd || '~'}: ${h.content}`)
        .join('\n');
      const blob = new Blob([logLines || 'Terminal session log is empty.'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terminal-${activeTab.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.log`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  // Select Distro for Current Tab (Rust VFS: met à jour /etc/os-release)
  const handleSelectDistro = async (distroId: DistroId) => {
    const distro = distros.find((d) => d.id === distroId);
    try {
      await fsUpdateOSRelease(distro?.name || 'Linux', distro?.version || '1.0');
    } catch (e: any) {
      console.warn('Échec de la mise à jour de /etc/os-release :', errMsg(e));
    }
    handleUpdateTab({ distroId });
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Execute AI Suggested Command directly into terminal prompt (exécution réelle).
  const handleExecuteCommandFromAi = (command: string) => {
    void controller.runCommand(command, activeTab);
  };

  // AI Request Handler
  const handleAiRequest = async (type: 'generate' | 'explain' | 'debug', query: string) => {
    try {
      const customKey = aiConfig.isCustomKeyEnabled && aiConfig.customApiKey?.trim()
        ? aiConfig.customApiKey.trim()
        : undefined;

      if (type === 'generate') {
        return await aiGenerate({
          prompt: query,
          distro: activeTab.distroId,
          currentDir: activeTab.cwd,
          model: aiConfig.model,
          apiKey: customKey,
        });
      }
      if (type === 'explain') {
        return await aiExplain({
          command: query,
          distro: activeTab.distroId,
          model: aiConfig.model,
          apiKey: customKey,
        });
      }
      return await aiDebug({
        command: query,
        errorOutput: '',
        distro: activeTab.distroId,
        model: aiConfig.model,
        apiKey: customKey,
      });
    } catch (e: any) {
      return { error: aiErrorMessage(e) || 'Erreur avec l\'assistant IA.' };
    }
  };

  return (
    <div className="w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden font-mono select-none relative">
      {/* Top Application Desktop Menu Bar */}
      <MenuBar
        tabs={tabs}
        activeTabId={activeTabId}
        aiConfig={aiConfig}
        onOpenAiConfigModal={() => setAiConfigModalOpen(true)}
        onSelectAiModel={handleSelectAiModel}
        onSelectTab={setActiveTabId}
        onNewTab={handleNewTab}
        onNewGuestTab={handleNewGuestTab}
        onCloseTab={handleCloseTab}
        onCloseOtherTabs={handleCloseOtherTabs}
        onDuplicateTab={handleDuplicateTab}
        onRenameTab={handleRenameTab}
        onSelectDistro={handleSelectDistro}
        onClearTerminal={handleClearTerminal}
        onClearHistory={handleClearHistory}
        onOpenDistroModal={() => setDistroModalOpen(true)}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onSelectThemeById={handleSelectThemeById}
        currentTheme={theme}
        onOpenHelpModal={() => setHelpModalOpen(true)}
        onOpenAboutModal={() => setAboutModalOpen(true)}
        onToggleAiDrawer={() => setAiDrawerOpen(!aiDrawerOpen)}
        aiDrawerOpen={aiDrawerOpen}
        crtEffect={crtEffect}
        onToggleCrt={handleToggleCrt}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        soundStyle={soundStyle}
        onSelectSoundStyle={handleSelectSoundStyle}
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        onToggleFullscreen={handleToggleFullscreen}
        onLaunchApp={handleLaunchApp}
        onRunQuickCommand={handleRunQuickCommand}
        onResetSystem={handleResetSystem}
        onExportFileSystem={handleExportFileSystem}
        onImportFileSystem={handleImportFileSystem}
        onDownloadLog={handleDownloadLog}
        onOpenTauriModal={() => setTauriModalOpen(true)}
        onOpenSshSmtpModal={() => setSshSmtpModalOpen(true)}
      />

      {/* Terminal Tabs & Header Controls */}
      <TerminalHeader
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onOpenDistroModal={() => setDistroModalOpen(true)}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onOpenHelpModal={() => setHelpModalOpen(true)}
        onToggleAiDrawer={() => setAiDrawerOpen(!aiDrawerOpen)}
        onOpenAiConfigModal={() => setAiConfigModalOpen(true)}
        onOpenSshSmtpModal={() => setSshSmtpModalOpen(true)}
        aiDrawerOpen={aiDrawerOpen}
        crtEffect={crtEffect}
        onToggleCrt={handleToggleCrt}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenTauriModal={() => setTauriModalOpen(true)}
      />

      {/* Main Workspace: Terminal + AI Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Terminal Screen / Interactive App */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeTab.activeEditor?.type === 'nano' ? (
            <Suspense fallback={workspaceFallback}>
              <NanoEditor
                filePath={activeTab.activeEditor.filePath}
                initialContent={activeTab.activeEditor.fileContent}
                onClose={() => handleUpdateTab({ activeEditor: null })}
              />
            </Suspense>
          ) : activeTab.activeEditor?.type === 'vim' ? (
            <Suspense fallback={workspaceFallback}>
              <VimEditor
                filePath={activeTab.activeEditor.filePath}
                initialContent={activeTab.activeEditor.fileContent}
                onClose={() => handleUpdateTab({ activeEditor: null })}
              />
            </Suspense>
          ) : activeTab.activeApp === 'htop' ? (
            <Suspense fallback={workspaceFallback}>
              <HtopMonitor
                distroName={activeDistro.name}
                onClose={() => handleUpdateTab({ activeApp: 'none' })}
              />
            </Suspense>
          ) : activeTab.activeApp === 'matrix' ? (
            <Suspense fallback={workspaceFallback}>
              <CmatrixCanvas onClose={() => handleUpdateTab({ activeApp: 'none' })} />
            </Suspense>
          ) : activeTab.activeApp === 'sl' ? (
            <Suspense fallback={workspaceFallback}>
              <SlAnimation onClose={() => handleUpdateTab({ activeApp: 'none' })} />
            </Suspense>
          ) : (
            <TerminalView
              tab={activeTab}
              theme={theme}
              fontSize={fontSize}
              soundEnabled={soundEnabled}
              soundStyle={soundStyle}
              onUpdateTab={handleUpdateTab}
              sshSession={sshSession}
              onSshKey={handleSshKey}
              onSshDisconnect={handleSshDisconnect}
            />
          )}

          {/* Optional CRT Scanlines Layer */}
          {crtEffect && (
            <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-60" />
          )}
        </main>

        {/* AI Copilot Drawer */}
        {aiDrawerOpen && (
          <Suspense fallback={modalFallback}>
            <AiCopilotDrawer
              distroId={activeTab.distroId}
              cwd={activeTab.cwd}
              aiConfig={aiConfig}
              onOpenAiConfigModal={() => setAiConfigModalOpen(true)}
              onClose={() => setAiDrawerOpen(false)}
              onExecuteCommandInTerminal={handleExecuteCommandFromAi}
            />
          </Suspense>
        )}
      </div>

      {/* Modals */}
      <Suspense fallback={modalFallback}>
        {themeModalOpen && (
          <ThemeSelectorModal
            currentTheme={theme}
            onSelectTheme={handleSelectThemeFull}
            onClose={() => setThemeModalOpen(false)}
            crtEffect={crtEffect}
            onToggleCrt={handleToggleCrt}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            soundStyle={soundStyle}
            onSelectSoundStyle={handleSelectSoundStyle}
            fontSize={fontSize}
            onChangeFontSize={handleChangeFontSize}
          />
        )}

        {distroModalOpen && (
          <DistroInfoModal
            currentDistroId={activeTab.distroId}
            onSelectDistro={handleSelectDistro}
            onClose={() => setDistroModalOpen(false)}
          />
        )}

        {helpModalOpen && <HelpModal onClose={() => setHelpModalOpen(false)} />}

        {aboutModalOpen && <AboutModal onClose={() => setAboutModalOpen(false)} />}

        {aiConfigModalOpen && (
          <AiConfigModal
            config={aiConfig}
            isOpen={aiConfigModalOpen}
            onClose={() => setAiConfigModalOpen(false)}
            onSave={handleSaveAiConfig}
          />
        )}

        {tauriModalOpen && (
          <TauriArchitectureModal
            isOpen={tauriModalOpen}
            onClose={() => setTauriModalOpen(false)}
          />
        )}

        {sshSmtpModalOpen && (
          <ConnectionManagerModal
            isOpen={sshSmtpModalOpen}
            onClose={() => setSshSmtpModalOpen(false)}
            onSshConnected={handleSshConnected}
          />
        )}
      </Suspense>

      {controller.riskConfirm && (
        <RiskConfirmModal
          command={controller.riskConfirm.command}
          report={controller.riskConfirm.report}
          onRun={() => void controller.runConfirmed(controller.riskConfirm.command, activeTab)}
          onCancel={() => controller.dismissRisk()}
        />
      )}
    </div>
  );
}
