import React, { useState, useEffect, useRef } from 'react';
import { TerminalTab, TerminalTheme, DistroId, TerminalSoundStyle, AiConfig } from './types';
import { LINUX_DISTROS, DEFAULT_DISTRO } from './data/distros';
import { TERMINAL_THEMES, DEFAULT_THEME } from './data/themes';
import { MenuBar } from './components/MenuBar';
import { TerminalHeader } from './components/TerminalHeader';
import { TerminalView, SshSessionState } from './components/TerminalView';
import { sshListenSessionOutput, sshSessionWrite, sshDisconnect, SshConnectionInfo } from './lib/sshApi';
import { NanoEditor } from './components/NanoEditor';
import { VimEditor } from './components/VimEditor';
import { HtopMonitor } from './components/HtopMonitor';
import { CmatrixCanvas } from './components/CmatrixCanvas';
import { SlAnimation } from './components/SlAnimation';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';
import { AiConfigModal } from './components/AiConfigModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { DistroInfoModal } from './components/DistroInfoModal';
import { HelpModal } from './components/HelpModal';
import { AboutModal } from './components/AboutModal';
import { TauriArchitectureModal } from './components/TauriArchitectureModal';
import { SshSmtpModal } from './components/SshSmtpModal';
import { runTerminalCommand, applyTerminalResult } from './lib/tauriBridge';
import { fsReset, fsExport, fsImport, fsUpdateOSRelease, errMsg } from './lib/fsApi';

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

  // Sync soundStyle to localStorage
  const handleSelectSoundStyle = (style: TerminalSoundStyle) => {
    setSoundStyle(style);
    try {
      localStorage.setItem('omnilinux_sound_style', style);
    } catch {}
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

  const handleSaveAiConfig = (newConfig: AiConfig) => {
    setAiConfig(newConfig);
    try {
      localStorage.setItem('omnilinux_ai_config', JSON.stringify(newConfig));
    } catch {}
  };

  const handleSelectAiModel = (modelId: string) => {
    const updated = { ...aiConfig, model: modelId };
    setAiConfig(updated);
    try {
      localStorage.setItem('omnilinux_ai_config', JSON.stringify(updated));
    } catch {}
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeDistro = LINUX_DISTROS.find((d) => d.id === activeTab.distroId) || DEFAULT_DISTRO;

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
    const distro = LINUX_DISTROS.find((d) => d.id === distroId) || DEFAULT_DISTRO;
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

  // Run a quick predefined command in the terminal
  const handleRunQuickCommand = async (cmd: string) => {
    const inputLineId = `cmd-${Date.now()}`;
    const newHistory = [
      ...activeTab.history,
      {
        id: inputLineId,
        type: 'input' as const,
        content: cmd,
        cwd: activeTab.cwd,
        distroId: activeTab.distroId,
      },
    ];
    const updatedCmdHistory = [...activeTab.commandHistory, cmd];

    const result = await runTerminalCommand(cmd, activeTab.cwd, activeTab.distroId);
    handleUpdateTab(applyTerminalResult(result, activeTab, newHistory, updatedCmdHistory));
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
    const distro = LINUX_DISTROS.find((d) => d.id === distroId);
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

  // Execute AI Suggsted Command directly into terminal prompt
  const handleExecuteCommandFromAi = (command: string) => {
    handleUpdateTab({
      history: [
        ...activeTab.history,
        {
          id: `ai-cmd-${Date.now()}`,
          type: 'input',
          content: command,
          cwd: activeTab.cwd,
          distroId: activeTab.distroId,
        },
      ],
      commandHistory: [...activeTab.commandHistory, command],
    });

    // Execute
    const customKey = aiConfig.isCustomKeyEnabled && aiConfig.customApiKey?.trim()
      ? aiConfig.customApiKey.trim()
      : undefined;

    fetch('/api/ai/generate-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: command,
        distro: activeTab.distroId,
        currentDir: activeTab.cwd,
        model: aiConfig.model,
        apiKey: customKey,
      }),
    }).catch(() => {});
  };

  // AI Request Handler
  const handleAiRequest = async (type: 'generate' | 'explain' | 'debug', query: string) => {
    try {
      const endpoint =
        type === 'generate'
          ? '/api/ai/generate-command'
          : type === 'explain'
          ? '/api/ai/explain-command'
          : '/api/ai/debug-error';

      const customKey = aiConfig.isCustomKeyEnabled && aiConfig.customApiKey?.trim()
        ? aiConfig.customApiKey.trim()
        : undefined;

      const bodyData =
        type === 'generate'
          ? { prompt: query, distro: activeTab.distroId, currentDir: activeTab.cwd, model: aiConfig.model, apiKey: customKey }
          : type === 'explain'
          ? { command: query, distro: activeTab.distroId, model: aiConfig.model, apiKey: customKey }
          : { command: query, errorOutput: '', distro: activeTab.distroId, model: aiConfig.model, apiKey: customKey };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      return await res.json();
    } catch (e: any) {
      return { error: e.message || 'Erreur réseau avec Gemini.' };
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
        onToggleCrt={() => setCrtEffect(!crtEffect)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        soundStyle={soundStyle}
        onSelectSoundStyle={handleSelectSoundStyle}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
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
        onToggleCrt={() => setCrtEffect(!crtEffect)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenTauriModal={() => setTauriModalOpen(true)}
      />

      {/* Main Workspace: Terminal + AI Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Terminal Screen / Interactive App */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeTab.activeEditor?.type === 'nano' ? (
            <NanoEditor
              filePath={activeTab.activeEditor.filePath}
              initialContent={activeTab.activeEditor.fileContent}
              onClose={() => handleUpdateTab({ activeEditor: null })}
            />
          ) : activeTab.activeEditor?.type === 'vim' ? (
            <VimEditor
              filePath={activeTab.activeEditor.filePath}
              initialContent={activeTab.activeEditor.fileContent}
              onClose={() => handleUpdateTab({ activeEditor: null })}
            />
          ) : activeTab.activeApp === 'htop' ? (
            <HtopMonitor
              distroName={activeDistro.name}
              onClose={() => handleUpdateTab({ activeApp: 'none' })}
            />
          ) : activeTab.activeApp === 'matrix' ? (
            <CmatrixCanvas onClose={() => handleUpdateTab({ activeApp: 'none' })} />
          ) : activeTab.activeApp === 'sl' ? (
            <SlAnimation onClose={() => handleUpdateTab({ activeApp: 'none' })} />
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
          <AiCopilotDrawer
            distroId={activeTab.distroId}
            cwd={activeTab.cwd}
            aiConfig={aiConfig}
            onOpenAiConfigModal={() => setAiConfigModalOpen(true)}
            onClose={() => setAiDrawerOpen(false)}
            onExecuteCommandInTerminal={handleExecuteCommandFromAi}
          />
        )}
      </div>

      {/* Modals */}
      {themeModalOpen && (
        <ThemeSelectorModal
          currentTheme={theme}
          onSelectTheme={setTheme}
          onClose={() => setThemeModalOpen(false)}
          crtEffect={crtEffect}
          onToggleCrt={() => setCrtEffect(!crtEffect)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          soundStyle={soundStyle}
          onSelectSoundStyle={handleSelectSoundStyle}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
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
        <SshSmtpModal
          isOpen={sshSmtpModalOpen}
          onClose={() => setSshSmtpModalOpen(false)}
          onSshConnected={handleSshConnected}
        />
      )}
    </div>
  );
}
