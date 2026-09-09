import React, { useState, useEffect, useRef } from 'react';
import { TerminalTab, DistroId, LinuxDistro, TerminalSoundStyle, TerminalTheme, AiConfig } from '../types';
import { useDistros, resolveDistro } from '../lib/distroStore';
import { TERMINAL_THEMES } from '../data/themes';
import { SOUND_STYLES, playTerminalSound } from '../lib/soundEffects';
import { MenuBarSearchModal } from './menubar/MenuBarSearchModal';
import { MenuBarAliasModal } from './menubar/MenuBarAliasModal';
import { MenuBarPasteModal } from './menubar/MenuBarPasteModal';
import { MenuBarRenameModal } from './menubar/MenuBarRenameModal';
import {
  Terminal,
  Terminal as TerminalIcon,
  Boxes,
  Plus,
  X,
  Copy,
  FolderOpen,
  Trash2,
  RefreshCw,
  Palette,
  ZoomIn,
  ZoomOut,
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Layers,
  Sparkles,
  HelpCircle,
  Info,
  Activity,
  FileCode,
  FileText,
  Play,
  Monitor,
  ChevronRight,
  Shield,
  Download,
  Upload,
  TerminalSquare,
  Edit3,
  Check,
  Code,
  Zap,
  Globe,
  Sliders,
  FileDown,
  Terminal as TermIcon,
  Clipboard,
  ClipboardCheck,
  Search,
  FilePlus,
  FolderPlus,
  SlidersHorizontal,
  Key,
  Lock,
  Unlock,
  CornerDownLeft,
  ListOrdered,
  ListFilter,
  ArrowRight,
  Bell,
  Sun,
  Moon,
  Type,
  Eye,
  CheckCircle2,
  Sliders as SlidersIcon,
  Cpu,
  HardDrive,
  Wifi,
  CloudRain,
  Hash,
  Radio,
  Package,
  Server,
  Box,
  ExternalLink,
  Bot,
  Bug,
  Lightbulb,
  ShieldAlert,
  MessageSquare,
  BookOpen,
  Compass,
  LifeBuoy,
  Settings,
} from 'lucide-react';

interface MenuBarProps {
  tabs: TerminalTab[];
  activeTabId: string;
  aiConfig: AiConfig;
  onOpenAiConfigModal: () => void;
  onSelectAiModel?: (modelId: string) => void;
  onSelectTab: (id: string) => void;
  onNewTab: (distroId?: DistroId) => void;
  onNewGuestTab?: () => void;
  onCloseTab: (id: string) => void;
  onCloseOtherTabs?: () => void;
  onDuplicateTab: () => void;
  onRenameTab?: (id: string, newTitle: string) => void;
  onSelectDistro: (distroId: DistroId) => void;
  onClearTerminal: () => void;
  onClearHistory: () => void;
  onOpenDistroModal: () => void;
  onOpenThemeModal: () => void;
  onSelectThemeById?: (themeId: string) => void;
  currentTheme?: TerminalTheme;
  onOpenHelpModal: () => void;
  onOpenAboutModal: () => void;
  onToggleAiDrawer: () => void;
  aiDrawerOpen: boolean;
  crtEffect: boolean;
  onToggleCrt: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  soundStyle: TerminalSoundStyle;
  onSelectSoundStyle: (style: TerminalSoundStyle) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  onToggleFullscreen: () => void;
  onLaunchApp: (app: 'htop' | 'matrix' | 'sl' | 'nano' | 'vim' | 'none') => void;
  onRunQuickCommand: (cmd: string) => void;
  onResetSystem: () => void;
  onExportFileSystem: () => void;
  onImportFileSystem?: (jsonContent: string) => void;
  onDownloadLog?: () => void;
  onOpenTauriModal?: () => void;
  onOpenSshSmtpModal?: () => void;
}

type MenuKey = 'file' | 'edit' | 'view' | 'distros' | 'tools' | 'ai' | 'help' | null;

export const MenuBar: React.FC<MenuBarProps> = ({
  tabs,
  activeTabId,
  aiConfig,
  onOpenAiConfigModal,
  onSelectAiModel,
  onOpenSshSmtpModal,
  onSelectTab,
  onNewTab,
  onNewGuestTab,
  onCloseTab,
  onCloseOtherTabs,
  onDuplicateTab,
  onRenameTab,
  onSelectDistro,
  onClearTerminal,
  onClearHistory,
  onOpenDistroModal,
  onOpenThemeModal,
  onSelectThemeById,
  currentTheme,
  onOpenHelpModal,
  onOpenAboutModal,
  onToggleAiDrawer,
  aiDrawerOpen,
  crtEffect,
  onToggleCrt,
  soundEnabled,
  onToggleSound,
  soundStyle,
  onSelectSoundStyle,
  fontSize,
  onChangeFontSize,
  onToggleFullscreen,
  onLaunchApp,
  onRunQuickCommand,
  onResetSystem,
  onExportFileSystem,
  onImportFileSystem,
  onDownloadLog,
  onOpenTauriModal,
}) => {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [distroSubmenuOpen, setDistroSubmenuOpen] = useState<boolean>(false);
  const [themeSubmenuOpen, setThemeSubmenuOpen] = useState<boolean>(false);
  const [soundSubmenuOpen, setSoundSubmenuOpen] = useState<boolean>(false);
  const [templatesSubmenuOpen, setTemplatesSubmenuOpen] = useState<boolean>(false);
  const [fileOpsSubmenuOpen, setFileOpsSubmenuOpen] = useState<boolean>(false);
  const [pipesSubmenuOpen, setPipesSubmenuOpen] = useState<boolean>(false);
  const [envSubmenuOpen, setEnvSubmenuOpen] = useState<boolean>(false);
  const [fontPresetSubmenuOpen, setFontPresetSubmenuOpen] = useState<boolean>(false);
  const [visualFxSubmenuOpen, setVisualFxSubmenuOpen] = useState<boolean>(false);
  const [sysDiagSubmenuOpen, setSysDiagSubmenuOpen] = useState<boolean>(false);
  const [netToolsSubmenuOpen, setNetToolsSubmenuOpen] = useState<boolean>(false);
  const [cryptoSubmenuOpen, setCryptoSubmenuOpen] = useState<boolean>(false);
  const [geekToysSubmenuOpen, setGeekToysSubmenuOpen] = useState<boolean>(false);
  const [distroNewTabSubmenuOpen, setDistroNewTabSubmenuOpen] = useState<boolean>(false);
  const [distroPkgSubmenuOpen, setDistroPkgSubmenuOpen] = useState<boolean>(false);
  const [aiPromptsSubmenuOpen, setAiPromptsSubmenuOpen] = useState<boolean>(false);
  const [aiAuditsSubmenuOpen, setAiAuditsSubmenuOpen] = useState<boolean>(false);
  const [aiCommandsSubmenuOpen, setAiCommandsSubmenuOpen] = useState<boolean>(false);
  const [aiModelsSubmenuOpen, setAiModelsSubmenuOpen] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [aliasModalOpen, setAliasModalOpen] = useState<boolean>(false);
  const [pasteModalOpen, setPasteModalOpen] = useState<boolean>(false);

  const menuBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const distros = useDistros();
  const activeDistro = resolveDistro(distros, activeTab?.distroId);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setDistroSubmenuOpen(false);
        setThemeSubmenuOpen(false);
        setSoundSubmenuOpen(false);
        setTemplatesSubmenuOpen(false);
        setFileOpsSubmenuOpen(false);
        setPipesSubmenuOpen(false);
        setEnvSubmenuOpen(false);
        setFontPresetSubmenuOpen(false);
        setVisualFxSubmenuOpen(false);
        setSysDiagSubmenuOpen(false);
        setNetToolsSubmenuOpen(false);
        setCryptoSubmenuOpen(false);
        setGeekToysSubmenuOpen(false);
        setDistroNewTabSubmenuOpen(false);
        setDistroPkgSubmenuOpen(false);
        setAiPromptsSubmenuOpen(false);
        setAiAuditsSubmenuOpen(false);
        setAiCommandsSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for menu closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setDistroSubmenuOpen(false);
        setThemeSubmenuOpen(false);
        setSoundSubmenuOpen(false);
        setTemplatesSubmenuOpen(false);
        setFileOpsSubmenuOpen(false);
        setPipesSubmenuOpen(false);
        setEnvSubmenuOpen(false);
        setFontPresetSubmenuOpen(false);
        setVisualFxSubmenuOpen(false);
        setSysDiagSubmenuOpen(false);
        setNetToolsSubmenuOpen(false);
        setCryptoSubmenuOpen(false);
        setGeekToysSubmenuOpen(false);
        setDistroNewTabSubmenuOpen(false);
        setDistroPkgSubmenuOpen(false);
        setAiPromptsSubmenuOpen(false);
        setAiAuditsSubmenuOpen(false);
        setAiCommandsSubmenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMenuClick = (menu: MenuKey) => {
    setOpenMenu(openMenu === menu ? null : menu);
    setDistroSubmenuOpen(false);
    setThemeSubmenuOpen(false);
    setSoundSubmenuOpen(false);
    setTemplatesSubmenuOpen(false);
    setFileOpsSubmenuOpen(false);
    setPipesSubmenuOpen(false);
    setEnvSubmenuOpen(false);
    setFontPresetSubmenuOpen(false);
    setVisualFxSubmenuOpen(false);
    setSysDiagSubmenuOpen(false);
    setNetToolsSubmenuOpen(false);
    setCryptoSubmenuOpen(false);
    setGeekToysSubmenuOpen(false);
    setDistroNewTabSubmenuOpen(false);
    setDistroPkgSubmenuOpen(false);
    setAiPromptsSubmenuOpen(false);
    setAiAuditsSubmenuOpen(false);
    setAiCommandsSubmenuOpen(false);
  };

  const handleMenuHover = (menu: MenuKey) => {
    if (openMenu !== null) {
      setOpenMenu(menu);
      setDistroSubmenuOpen(false);
      setThemeSubmenuOpen(false);
      setSoundSubmenuOpen(false);
      setTemplatesSubmenuOpen(false);
      setFileOpsSubmenuOpen(false);
      setPipesSubmenuOpen(false);
      setEnvSubmenuOpen(false);
      setFontPresetSubmenuOpen(false);
      setVisualFxSubmenuOpen(false);
      setSysDiagSubmenuOpen(false);
      setNetToolsSubmenuOpen(false);
      setCryptoSubmenuOpen(false);
      setGeekToysSubmenuOpen(false);
      setDistroNewTabSubmenuOpen(false);
      setDistroPkgSubmenuOpen(false);
      setAiPromptsSubmenuOpen(false);
      setAiAuditsSubmenuOpen(false);
      setAiCommandsSubmenuOpen(false);
    }
  };

  const executeAndClose = (action?: () => void) => {
    if (action) action();
    setOpenMenu(null);
    setDistroSubmenuOpen(false);
    setThemeSubmenuOpen(false);
    setSoundSubmenuOpen(false);
    setTemplatesSubmenuOpen(false);
    setFileOpsSubmenuOpen(false);
    setPipesSubmenuOpen(false);
    setEnvSubmenuOpen(false);
    setFontPresetSubmenuOpen(false);
    setVisualFxSubmenuOpen(false);
    setSysDiagSubmenuOpen(false);
    setNetToolsSubmenuOpen(false);
    setCryptoSubmenuOpen(false);
    setGeekToysSubmenuOpen(false);
    setDistroNewTabSubmenuOpen(false);
    setDistroPkgSubmenuOpen(false);
    setAiPromptsSubmenuOpen(false);
    setAiAuditsSubmenuOpen(false);
    setAiCommandsSubmenuOpen(false);
  };

  const handleTestBellSound = () => {
    if (soundEnabled) {
      playTerminalSound(soundStyle, 0.08);
      setCopyFeedback('🔔 Bip système exécuté !');
      setTimeout(() => setCopyFeedback(null), 2000);
    } else {
      setCopyFeedback('🔇 Son désactivé. Activez les effets sonores d\'abord.');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleRandomTheme = () => {
    if (onSelectThemeById) {
      const otherThemes = TERMINAL_THEMES.filter((t) => t.id !== currentTheme?.id);
      const random = otherThemes[Math.floor(Math.random() * otherThemes.length)];
      if (random) {
        onSelectThemeById(random.id);
        setCopyFeedback(`Thème activé : ${random.name}`);
        setTimeout(() => setCopyFeedback(null), 2000);
      }
    }
  };

  const getPkgUpdateCommand = (distro: LinuxDistro): string => {
    switch (distro.packageManager) {
      case 'pacman': return 'pacman -Sy';
      case 'dnf': return 'dnf check-update';
      case 'apk': return 'apk update';
      case 'zypper': return 'zypper refresh';
      case 'xbps': return 'xbps-install -S';
      case 'nix': return 'nix-channel --update';
      default: return 'apt update';
    }
  };

  const getPkgUpgradeCommand = (distro: LinuxDistro): string => {
    switch (distro.packageManager) {
      case 'pacman': return 'pacman -Syu';
      case 'dnf': return 'dnf upgrade -y';
      case 'apk': return 'apk upgrade';
      case 'zypper': return 'zypper update -y';
      case 'xbps': return 'xbps-install -Su';
      case 'nix': return 'nixos-rebuild switch';
      default: return 'apt upgrade -y';
    }
  };

  const getPkgListCommand = (distro: LinuxDistro): string => {
    switch (distro.packageManager) {
      case 'pacman': return 'pacman -Q | head -n 20';
      case 'dnf': return 'rpm -qa --last | head -n 20';
      case 'apk': return 'apk info -v | head -n 20';
      case 'zypper': return 'rpm -qa | head -n 20';
      case 'xbps': return 'xbps-query -l | head -n 20';
      case 'nix': return 'nix-env -q';
      default: return 'dpkg -l | head -n 25';
    }
  };

  const handleAiExplainLastCommand = () => {
    const lastCmd = [...activeTab.commandHistory].reverse().find((c) => c && !c.startsWith('ai ') && !c.startsWith('ai'));
    if (lastCmd) {
      onRunQuickCommand(`ai explain "${lastCmd.replace(/"/g, '\\"')}"`);
    } else {
      onRunQuickCommand('ai explain "ps aux --sort=-%mem | head -n 10"');
    }
  };

  const handleAiDebugLastError = () => {
    const lastErr = [...activeTab.history].reverse().find((h) => h.type === 'error');
    if (lastErr) {
      onRunQuickCommand(`ai debug "${lastErr.content.replace(/"/g, '\\"')}"`);
    } else {
      onRunQuickCommand('ai debug "bash: ./deploy.sh: Permission denied (code 126)"');
    }
  };

  const handleCopyLastOutput = () => {
    const lastItem = [...activeTab.history].reverse().find((h) => h.type === 'output' || h.type === 'input');
    if (lastItem) {
      navigator.clipboard.writeText(lastItem.content);
      setCopyFeedback('Dernière sortie copiée !');
      setTimeout(() => setCopyFeedback(null), 2500);
    } else {
      setCopyFeedback('Aucune sortie à copier.');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
    setOpenMenu(null);
  };

  const handleCopyAllHistory = () => {
    const allText = activeTab.history
      .map((h) => (h.type === 'input' ? `$ ${h.content}` : h.content))
      .join('\n');
    navigator.clipboard.writeText(allText || 'Session vide.');
    setCopyFeedback('Session complète copiée !');
    setTimeout(() => setCopyFeedback(null), 2500);
    setOpenMenu(null);
  };

  const handlePastePrompt = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onRunQuickCommand(text.trim());
        setCopyFeedback('Commande collée et exécutée !');
        setTimeout(() => setCopyFeedback(null), 2500);
      } else {
        setPasteModalOpen(true);
      }
    } catch {
      setPasteModalOpen(true);
    }
    setOpenMenu(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && onImportFileSystem) {
        onImportFileSystem(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setOpenMenu(null);
  };

  return (
    <>
      {/* Hidden File Input for VFS Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />

      {/* Floating Toast Notification for Feedback */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Terminal History Search Modal */}
      {searchModalOpen && (
        <MenuBarSearchModal
          history={activeTab.history}
          onClose={() => setSearchModalOpen(false)}
          onCopy={(content) => {
            navigator.clipboard.writeText(content);
            setCopyFeedback('Ligne copiée !');
            setTimeout(() => setCopyFeedback(null), 2000);
          }}
        />
      )}

      {/* Custom Alias Creator Modal */}
      {aliasModalOpen && (
        <MenuBarAliasModal
          onClose={() => setAliasModalOpen(false)}
          onSave={(name, cmd) => {
            onRunQuickCommand(`alias ${name}='${cmd}'`);
            setAliasModalOpen(false);
            setCopyFeedback(`Alias "${name}" créé avec succès !`);
            setTimeout(() => setCopyFeedback(null), 2500);
          }}
        />
      )}

      {/* Manual Paste Modal */}
      {pasteModalOpen && (
        <MenuBarPasteModal
          onClose={() => setPasteModalOpen(false)}
          onRun={(cmd) => {
            onRunQuickCommand(cmd);
            setCopyFeedback('Commande collée et exécutée !');
            setTimeout(() => setCopyFeedback(null), 2500);
          }}
        />
      )}

      {/* Inline Rename Dialog */}
      {isRenaming && (
        <MenuBarRenameModal
          initialTitle={activeTab.title}
          onClose={() => setIsRenaming(false)}
          onSave={(name) => {
            if (name.trim() && onRenameTab) onRenameTab(activeTabId, name.trim());
            setIsRenaming(false);
          }}
        />
      )}

      {/* Main MenuBar Bar */}
      <div
        ref={menuBarRef}
        className="bg-[#18181B] border-b border-[#27272A] text-zinc-300 text-xs select-none flex items-center justify-between px-3 h-8 shrink-0 z-40 relative font-sans"
      >
        {/* Left: Window Controls + App Name + Menu Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Window controls (macOS style) */}
          <div className="flex items-center gap-1.5 mr-1 hidden sm:flex">
            <div
              onClick={() => {
                if (tabs.length > 1) onCloseTab(activeTabId);
              }}
              title="Fermer l'onglet actif (Ctrl+W)"
              className="w-3 h-3 rounded-full bg-[#FF5F56] hover:opacity-80 cursor-pointer transition shadow-sm"
            />
            <div
              onClick={onToggleFullscreen}
              title="Mode Plein Écran (F11)"
              className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:opacity-80 cursor-pointer transition shadow-sm"
            />
            <div
              onClick={() => onNewTab()}
              title="Nouvel Onglet (Ctrl+T)"
              className="w-3 h-3 rounded-full bg-[#27C93F] hover:opacity-80 cursor-pointer transition shadow-sm"
            />
          </div>

          <div className="h-4 w-px bg-[#3F3F46] mx-1 hidden sm:block" />

          {/* Brand */}
          <div
            onClick={onOpenAboutModal}
            className="flex items-center gap-1.5 font-bold text-zinc-100 mr-2 cursor-pointer hover:text-emerald-400 transition"
            title="À propos d'OmniLinux Terminal"
          >
            <TerminalIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline font-mono tracking-tight text-[11px]">OmniLinux</span>
          </div>

          {/* Menu Items List */}
          <div className="flex items-center space-x-0.5 text-[11px] font-medium">
            {/* 1. FICHIER */}
            <div className="relative">
              <button
                onClick={() => handleMenuClick('file')}
                onMouseEnter={() => handleMenuHover('file')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  openMenu === 'file'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                Fichier
              </button>

              {openMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-68 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200">
                  <button
                    onClick={() => executeAndClose(() => onNewTab())}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-emerald-400" /> Nouvel Onglet
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+T</span>
                  </button>

                  {/* Submenu: New Tab with Distro */}
                  <div
                    className="relative"
                    onMouseEnter={() => setDistroSubmenuOpen(true)}
                    onMouseLeave={() => setDistroSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-400" /> Nouvel Onglet avec Distro...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {distroSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-60 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 max-h-84 overflow-y-auto">
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Distributions Disponibles
                        </div>
                        {distros.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => executeAndClose(() => onNewTab(d.id))}
                            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-[11px]"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                              <span className="truncate">{d.name}</span>
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono shrink-0 ml-1.5">
                              {d.pkgCommand}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {onNewGuestTab && (
                    <button
                      onClick={() => executeAndClose(onNewGuestTab)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-purple-400" /> Onglet Invité Sandbox
                      </span>
                      <span className="text-[10px] text-purple-300 font-mono">Privé</span>
                    </button>
                  )}

                  <button
                    onClick={() => executeAndClose(onDuplicateTab)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-zinc-400" /> Dupliquer l'Onglet
                    </span>
                  </button>

                  <button
                    onClick={() => setIsRenaming(true)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Renommer l'Onglet...
                    </span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  <button
                    onClick={() => executeAndClose(() => onCloseTab(activeTabId))}
                    disabled={tabs.length <= 1}
                    className={`w-full flex items-center justify-between px-3 py-1.5 transition text-left ${
                      tabs.length <= 1
                        ? 'text-zinc-600 cursor-not-allowed'
                        : 'hover:bg-rose-600 hover:text-white text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <X className="w-3.5 h-3.5 text-rose-400" /> Fermer l'Onglet
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+W</span>
                  </button>

                  {onCloseOtherTabs && tabs.length > 1 && (
                    <button
                      onClick={() => executeAndClose(onCloseOtherTabs)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-rose-600 hover:text-white transition text-left text-zinc-300"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Fermer les Autres Onglets
                      </span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#27272A]" />

                  <button
                    onClick={() => executeAndClose(onExportFileSystem)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-sky-400" /> Exporter Sauvegarde VFS (.json)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-amber-400" /> Importer Sauvegarde VFS...
                    </span>
                  </button>

                  {onDownloadLog && (
                    <button
                      onClick={() => executeAndClose(onDownloadLog)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                    >
                      <span className="flex items-center gap-2">
                        <FileDown className="w-3.5 h-3.5 text-emerald-400" /> Télécharger Journal (.log)
                      </span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#27272A]" />

                  <button
                    onClick={() => executeAndClose(onResetSystem)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-rose-600 hover:text-white transition text-left text-rose-300"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-rose-400" /> Réinitialisation Usine (VFS)
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. ÉDITION */}
            <div className="relative">
              <button
                onClick={() => handleMenuClick('edit')}
                onMouseEnter={() => handleMenuHover('edit')}
                className={`px-2 py-1 rounded transition ${
                  openMenu === 'edit'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                Édition
              </button>

              {openMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200 text-xs">
                  {/* Copy last output */}
                  <button
                    onClick={handleCopyLastOutput}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-blue-400" /> Copier la Dernière Sortie
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+C</span>
                  </button>

                  {/* Copy all history */}
                  <button
                    onClick={handleCopyAllHistory}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5 text-cyan-400" /> Copier Tout le Journal
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+A</span>
                  </button>

                  {/* Paste / Run in terminal */}
                  <button
                    onClick={handlePastePrompt}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> Coller dans le Terminal...
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+V</span>
                  </button>

                  {/* Search in History / Buffer */}
                  <button
                    onClick={() => {
                      setSearchModalOpen(true);
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-indigo-400" /> Rechercher dans le Journal...
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+F</span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Clear screen & Clear history */}
                  <button
                    onClick={() => executeAndClose(onClearTerminal)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-amber-400" /> Effacer l'Écran (clear)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+L</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(onClearHistory)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-zinc-400" /> Vider l'Historique de session
                    </span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Submenu 1: File & Directory Quick Actions */}
                  <div
                    className="relative"
                    onMouseEnter={() => setFileOpsSubmenuOpen(true)}
                    onMouseLeave={() => setFileOpsSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-400" /> Fichiers & Répertoire Courant...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {fileOpsSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-68 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('pwd'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" /> Afficher Chemin (pwd)
                          </span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ls -la'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-blue-400" /> Lister Répertoire (ls -la)
                          </span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('tree -L 2 || ls -R'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Arborescence (tree -L 2)
                          </span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('mkdir -p workspace && ls -la'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="flex items-center gap-2">
                            <FolderPlus className="w-3.5 h-3.5 text-amber-400" /> Créer Dossier (mkdir workspace)
                          </span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('touch notes.txt && ls -la'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="flex items-center gap-2">
                            <FilePlus className="w-3.5 h-3.5 text-cyan-400" /> Créer Fichier (touch notes.txt)
                          </span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('chmod +x *.sh 2>/dev/null || echo "Permissions exécutables appliquées"'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="flex items-center gap-2">
                            <Unlock className="w-3.5 h-3.5 text-purple-400" /> Rendre Scripts Exécutables (chmod +x)
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu 2: Unix Pipes & Stream Filters */}
                  <div
                    className="relative"
                    onMouseEnter={() => setPipesSubmenuOpen(true)}
                    onMouseLeave={() => setPipesSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <ListFilter className="w-3.5 h-3.5 text-cyan-400" /> Chaînages & Filtres Unix (Pipes)...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {pipesSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-72 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ps aux --sort=-%mem | head -n 10'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Top 10 Processus RAM</span>
                          <span className="text-[10px] text-zinc-400 font-mono">ps aux --sort=-%mem | head -n 10</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('history | tail -n 25'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">25 Dernières Commandes</span>
                          <span className="text-[10px] text-zinc-400 font-mono">history | tail -n 25</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('df -h && echo "" && free -m'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Espace Disque & Mémoire</span>
                          <span className="text-[10px] text-zinc-400 font-mono">df -h && free -m</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('find . -maxdepth 3 -type f | sort'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Recherche Globale de Fichiers</span>
                          <span className="text-[10px] text-zinc-400 font-mono">find . -maxdepth 3 -type f</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('du -sh * 2>/dev/null | sort -hr'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Tailles des Dossiers Triées</span>
                          <span className="text-[10px] text-zinc-400 font-mono">du -sh * | sort -hr</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu 3: Environment & Aliases */}
                  <div
                    className="relative"
                    onMouseEnter={() => setEnvSubmenuOpen(true)}
                    onMouseLeave={() => setEnvSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Variables & Alias Bash...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {envSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-68 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('alias ll=\'ls -la --color=auto\' && echo "Alias ll configuré !"'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Alias ll ('ls -la')</span>
                          <span className="text-[10px] text-zinc-400 font-mono">alias ll='ls -la'</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('alias update=\'sudo apt update && sudo apt upgrade -y\' && echo "Alias update configuré !"'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Alias update ('apt update')</span>
                          <span className="text-[10px] text-zinc-400 font-mono">alias update='sudo apt update'</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('printenv | head -n 15'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Afficher l'Environnement</span>
                          <span className="text-[10px] text-zinc-400 font-mono">printenv | head -n 15</span>
                        </button>
                        <button
                          onClick={() => {
                            setAliasModalOpen(true);
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-purple-600 hover:text-white transition text-left flex items-center gap-2 text-purple-300 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" /> Créer un Alias Personnalisé...
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu 4: Insert Script Template */}
                  <div
                    className="relative"
                    onMouseEnter={() => setTemplatesSubmenuOpen(true)}
                    onMouseLeave={() => setTemplatesSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Code className="w-3.5 h-3.5 text-purple-400" /> Insérer Script Modèle...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {templatesSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-72 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand(
                                'echo -e "#!/bin/bash\\n# Backup Script\\ntar -czf backup-$(date +%F).tar.gz /home/user/documents 2>/dev/null\\necho \\"Sauvegarde terminée !\\"" > backup.sh && chmod +x backup.sh && cat backup.sh'
                              )
                            )
                          }
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">backup.sh</span>
                          <span className="text-[10px] text-zinc-400">Script de compression & archivage .tar.gz</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand(
                                'echo -e "#!/bin/bash\\necho \\"=== BILAN SANTE DU SYSTEME ===\\"\\nfree -m\\ndf -h /\\nuptime" > healthcheck.sh && chmod +x healthcheck.sh && bash healthcheck.sh'
                              )
                            )
                          }
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">healthcheck.sh</span>
                          <span className="text-[10px] text-zinc-400">Surveillance RAM, Disque, Charge, Uptime</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('python3 -m http.server 8080 || echo "Serveur Web démarré sur http://localhost:8080"')
                            )
                          }
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">webserver.py</span>
                          <span className="text-[10px] text-zinc-400">Serveur HTTP Python One-liner port 8080</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('curl -s https://wttr.in/Paris?format=3 || echo "Paris: ⛅ +18°C 12km/h"')
                            )
                          }
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">weather.sh</span>
                          <span className="text-[10px] text-zinc-400">Bulletin météo en direct via wttr.in</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('echo -e "=== GENERATION CLES SSH ===\\nssh-keygen -t ed25519 -C \\"user@omnilinux\\" -f id_ed25519 -N \\"\\"" && ls -l')
                            )
                          }
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">ssh_keygen.sh</span>
                          <span className="text-[10px] text-zinc-400">Génération paire de clés SSH Ed25519</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. AFFICHAGE */}
            <div className="relative">
              <button
                onClick={() => handleMenuClick('view')}
                onMouseEnter={() => handleMenuHover('view')}
                className={`px-2 py-1 rounded transition ${
                  openMenu === 'view'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                Affichage
              </button>

              {openMenu === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200 text-xs">
                  {/* Theme Manager Modal */}
                  <button
                    onClick={() => executeAndClose(onOpenThemeModal)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-amber-400" /> Thèmes & Apparence Complète...
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Personnaliser</span>
                  </button>

                  {/* Submenu: Quick Themes Switch */}
                  {onSelectThemeById && (
                    <div
                      className="relative"
                      onMouseEnter={() => setThemeSubmenuOpen(true)}
                      onMouseLeave={() => setThemeSubmenuOpen(false)}
                    >
                      <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                        <span className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-blue-400" /> Thème Rapide ({currentTheme?.name || 'Matrix'})...
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                      </div>

                      {themeSubmenuOpen && (
                        <div className="absolute left-full top-0 ml-0.5 w-60 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 max-h-72 overflow-y-auto">
                          {TERMINAL_THEMES.map((t) => {
                            const isCurrent = currentTheme?.id === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => executeAndClose(() => onSelectThemeById(t.id))}
                                className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs ${
                                  isCurrent ? 'bg-blue-500/10 text-blue-300 font-bold' : ''
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full border border-zinc-700 shrink-0"
                                    style={{ backgroundColor: t.bg }}
                                  />
                                  <span className="truncate">{t.name}</span>
                                </span>
                                {isCurrent && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Random theme button */}
                  <button
                    onClick={() => executeAndClose(handleRandomTheme)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Thème Aléatoire (Surprise)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">🎲</span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Font Sizing + Presets */}
                  <button
                    onClick={() => executeAndClose(() => onChangeFontSize(Math.min(fontSize + 1, 22)))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <ZoomIn className="w-3.5 h-3.5 text-zinc-400" /> Agrandir Police ({fontSize}px)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl++</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(() => onChangeFontSize(Math.max(fontSize - 1, 9)))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <ZoomOut className="w-3.5 h-3.5 text-zinc-400" /> Réduire Police
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ctrl+-</span>
                  </button>

                  {/* Submenu: Font Size Presets */}
                  <div
                    className="relative"
                    onMouseEnter={() => setFontPresetSubmenuOpen(true)}
                    onMouseLeave={() => setFontPresetSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Type className="w-3.5 h-3.5 text-indigo-400" /> Préréglages de Taille de Police...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {fontPresetSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-56 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        {[
                          { size: 11, label: 'Compact (Haute densité)' },
                          { size: 13, label: 'Standard (Par défaut)' },
                          { size: 15, label: 'Confortable (Lisibilité)' },
                          { size: 18, label: 'Présentation / Grand écran' },
                          { size: 20, label: 'Ultra Large' },
                        ].map((p) => (
                          <button
                            key={p.size}
                            onClick={() => executeAndClose(() => onChangeFontSize(p.size))}
                            className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left ${
                              fontSize === p.size ? 'bg-indigo-500/10 text-indigo-300 font-bold' : 'text-zinc-300'
                            }`}
                          >
                            <span>{p.size}px - {p.label}</span>
                            {fontSize === p.size && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => executeAndClose(() => onChangeFontSize(13))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-400"
                  >
                    <span className="pl-6">Rétablir Taille Normale (13px)</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+0</span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* CRT Retro Filter Toggle */}
                  <button
                    onClick={() => executeAndClose(onToggleCrt)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Tv className="w-3.5 h-3.5 text-emerald-400" /> Effet Scanlines Cathodique (CRT)
                    </span>
                    <span className={`text-[10px] font-bold ${crtEffect ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {crtEffect ? 'ACTIF' : 'OFF'}
                    </span>
                  </button>

                  {/* Submenu: Visual Demos & Screensavers */}
                  <div
                    className="relative"
                    onMouseEnter={() => setVisualFxSubmenuOpen(true)}
                    onMouseLeave={() => setVisualFxSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-teal-400" /> Démos Visuelles & Écrans de Veille...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {visualFxSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-64 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('cmatrix'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Pluie Numérique Matrix</span>
                          <span className="text-[10px] text-zinc-400 font-mono">cmatrix (Q pour quitter)</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('sl'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Locomotive ASCII Animée</span>
                          <span className="text-[10px] text-zinc-400 font-mono">sl (Steam Locomotive)</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('neofetch'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Logo Distro & Spécifications</span>
                          <span className="text-[10px] text-zinc-400 font-mono">neofetch (Bannière ASCII)</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('cowsay "OmniLinux Terminal v2.4 !"'))}
                          className="w-full px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left flex flex-col"
                        >
                          <span className="font-semibold text-xs text-white">Mascotte Cowsay</span>
                          <span className="text-[10px] text-zinc-400 font-mono">cowsay & fortune</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Sound Effects Toggle */}
                  <button
                    onClick={() => executeAndClose(onToggleSound)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      {soundEnabled ? (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      Effets Sonores Clavier
                    </span>
                    <span className={`text-[10px] font-bold ${soundEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {soundEnabled ? 'ACTIF' : 'OFF'}
                    </span>
                  </button>

                  {/* Submenu: Sound Styles */}
                  <div
                    className="relative"
                    onMouseEnter={() => setSoundSubmenuOpen(true)}
                    onMouseLeave={() => setSoundSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2 pl-6">
                        <span>Style Sonore ({soundStyle})...</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {soundSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-64 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        {SOUND_STYLES.map((style) => {
                          const isSelected = soundStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              onClick={() => executeAndClose(() => onSelectSoundStyle(style.id))}
                              className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs ${
                                isSelected ? 'bg-emerald-500/10 text-emerald-300 font-bold' : ''
                              }`}
                            >
                              <div>
                                <span>{style.name}</span>
                                <p className="text-[10px] text-zinc-400 font-normal">{style.description}</p>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Test Bell Sound */}
                  <button
                    onClick={handleTestBellSound}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-300"
                  >
                    <span className="flex items-center gap-2 pl-6">
                      <Bell className="w-3.5 h-3.5 text-amber-400" /> Tester Bip Système (Bell \a)
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Audio</span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Fullscreen & AI Drawer */}
                  <button
                    onClick={() => executeAndClose(onToggleFullscreen)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Maximize2 className="w-3.5 h-3.5 text-sky-400" /> Mode Plein Écran
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">F11</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(onToggleAiDrawer)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Volet Assistant IA Gemini
                    </span>
                    <span className={`text-[10px] font-bold ${aiDrawerOpen ? 'text-purple-400' : 'text-zinc-500'}`}>
                      {aiDrawerOpen ? 'OUVERT' : 'FERMÉ'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. DISTRIBUTIONS */}
            <div className="relative">
              <button
                onClick={() => handleMenuClick('distros')}
                onMouseEnter={() => handleMenuHover('distros')}
                className={`px-2 py-1 rounded transition flex items-center gap-1.5 ${
                  openMenu === 'distros'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5 text-orange-400" />
                <span>Distributions</span>
              </button>

              {openMenu === 'distros' && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200 text-xs">
                  {/* Current Active Distro Banner Card */}
                  <div className="mx-2 mb-1.5 p-2.5 rounded-md bg-zinc-900/90 border border-zinc-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Distribution Active
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        En ligne
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/20 shadow-sm"
                        style={{ backgroundColor: activeDistro.themeColor }}
                      />
                      <span className="font-bold text-white text-xs truncate">{activeDistro.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono ml-auto shrink-0 uppercase px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                        {activeDistro.packageManager}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 truncate font-mono flex items-center justify-between">
                      <span className="truncate">{activeDistro.defaultUser}@{activeDistro.hostName}</span>
                      <span className="text-zinc-400 shrink-0 ml-1 text-[9px]">{activeDistro.kernel.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* Submenu: Open in New Tab with selected distro */}
                  <div
                    className="relative"
                    onMouseEnter={() => setDistroNewTabSubmenuOpen(true)}
                    onMouseLeave={() => setDistroNewTabSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 text-emerald-400" /> Ouvrir dans un Nouvel Onglet...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {distroNewTabSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-72 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 max-h-72 overflow-y-auto">
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Démarrer avec l'OS :
                        </div>
                        {distros.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => executeAndClose(() => onNewTab(d.id))}
                            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-zinc-700"
                                style={{ backgroundColor: d.themeColor }}
                              />
                              <span className="truncate">{d.name}</span>
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-2">
                              {d.packageManager}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submenu: Package Manager tools of active distro */}
                  <div
                    className="relative"
                    onMouseEnter={() => setDistroPkgSubmenuOpen(true)}
                    onMouseLeave={() => setDistroPkgSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-amber-400" /> Paquets {activeDistro.packageManager.toUpperCase()} ({activeDistro.name.split(' ')[0]})...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {distroPkgSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-76 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Outils {activeDistro.packageManager.toUpperCase()}
                        </div>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand(getPkgUpdateCommand(activeDistro)))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Actualiser le Cache Dépôts
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {getPkgUpdateCommand(activeDistro)}
                          </span>
                        </button>

                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand(getPkgUpgradeCommand(activeDistro)))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Download className="w-3.5 h-3.5 text-emerald-400" /> Mettre à Jour le Système
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {getPkgUpgradeCommand(activeDistro).split(' ')[0]}
                          </span>
                        </button>

                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand(getPkgListCommand(activeDistro)))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Paquets Installés
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">list</span>
                        </button>

                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand(`${activeDistro.pkgCommand.split(' ')[0]} --help || man ${activeDistro.packageManager}`))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Manuel & Options du Gestionnaire
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">--help</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Section: Switch Active Tab to Distro */}
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Basculer l'Onglet Actif vers :</span>
                    <span className="text-[9px] text-zinc-500">10 Systèmes</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    {distros.map((distro) => {
                      const isCurrent = activeTab.distroId === distro.id;
                      return (
                        <button
                          key={distro.id}
                          onClick={() => executeAndClose(() => onSelectDistro(distro.id))}
                          className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs ${
                            isCurrent ? 'bg-blue-500/10 text-blue-300 font-bold' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 border border-zinc-700 ${
                                isCurrent ? 'ring-2 ring-blue-400 shadow-sm shadow-blue-400/50' : ''
                              }`}
                              style={{ backgroundColor: distro.themeColor }}
                            />
                            <span className="truncate">{distro.name}</span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {distro.packageManager}
                            </span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Distro Diagnostics & Identity */}
                  <button
                    onClick={() => executeAndClose(() => onRunQuickCommand('cat /etc/os-release'))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" /> Fiche d'Identité OS (/etc/os-release)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">cat</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(() => onRunQuickCommand('neofetch'))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-purple-400" /> Bannière Distro & Neofetch
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">neofetch</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(onOpenDistroModal)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-blue-400 font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Fiches Techniques & Spécifications...
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Réinitialiser la distribution */}
                  <button
                    onClick={() => executeAndClose(onResetSystem)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-red-600 hover:text-white transition text-left text-rose-400"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser l'Environnement Distro
                    </span>
                    <span className="text-[10px] text-rose-300 font-mono">Clean OS</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. OUTILS & APPS */}
            <div className="relative">
              <button
                onClick={() => handleMenuClick('tools')}
                onMouseEnter={() => handleMenuHover('tools')}
                className={`px-2 py-1 rounded transition ${
                  openMenu === 'tools'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                Outils
              </button>

              {openMenu === 'tools' && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Éditeurs & IDE
                  </div>

                  <button
                    onClick={() => executeAndClose(() => onLaunchApp('nano'))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" /> Éditeur Nano
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">nano</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(() => onLaunchApp('vim'))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <TerminalSquare className="w-3.5 h-3.5 text-green-400" /> Éditeur Vim (Modal)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">vim</span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Submenu: System Diagnostics */}
                  <div
                    className="relative"
                    onMouseEnter={() => setSysDiagSubmenuOpen(true)}
                    onMouseLeave={() => setSysDiagSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" /> Surveillance & Diagnostics...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {sysDiagSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-68 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onLaunchApp('htop'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Moniteur Interactif
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">htop</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ps aux --sort=-%cpu | head -n 11'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5 text-amber-400" /> Top 10 Processus CPU
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">ps aux</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('free -h'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Mémoire RAM & Swap
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">free -h</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('df -h'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <HardDrive className="w-3.5 h-3.5 text-sky-400" /> Espace Disque Partitions
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">df -h</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('uptime'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-purple-400" /> Charge & Temps d'Activité
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">uptime</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('lscpu || uname -m'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5 text-rose-400" /> Architecture CPU
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">lscpu</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu: Network Tools */}
                  <div
                    className="relative"
                    onMouseEnter={() => setNetToolsSubmenuOpen(true)}
                    onMouseLeave={() => setNetToolsSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-sky-400" /> Réseau, Web & Connectivité...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {netToolsSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-68 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ping -c 4 8.8.8.8'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-sky-400" /> Test Ping (Google DNS)
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">ping</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('curl -s ifconfig.me || curl -s icanhazip.com'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Mon Adresse IP Publique
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">curl</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('curl -s wttr.in/Paris?format=3'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Météo en Ligne de Commande
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">wttr.in</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('host google.com'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-amber-400" /> Résolution DNS Domaine
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">host</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ss -tulpn || netstat -tuln'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Radio className="w-3.5 h-3.5 text-pink-400" /> Ports & Sockets Écoutés
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">ss / netstat</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ip -brief address show || ip a'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Interfaces Réseau Locales
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">ip a</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu: Cryptography & Security */}
                  <div
                    className="relative"
                    onMouseEnter={() => setCryptoSubmenuOpen(true)}
                    onMouseLeave={() => setCryptoSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> Sécurité, Clés & Hachage...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {cryptoSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-68 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ssh-keygen -t ed25519 -C "omnilinux-key" -f ~/.ssh/id_ed25519 -N ""'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-amber-400" /> Générer Paire de Clés SSH
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">ssh-keygen</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('echo -n "OmniLinux" | sha256sum'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-cyan-400" /> Calculer Empreinte SHA-256
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">sha256</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('openssl rand -base64 16 || tr -dc A-Za-z0-9 </dev/urandom | head -c 16 ; echo'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Mot de Passe Aléatoire
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">openssl</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('echo "OmniLinux Security" | base64'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Code className="w-3.5 h-3.5 text-purple-400" /> Encoder Chaîne en Base64
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">base64</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('echo "T21uaUxpbnV4IFNlY3VyaXR5Cg==" | base64 -d'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Unlock className="w-3.5 h-3.5 text-teal-400" /> Décoder Chaîne Base64
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">base64 -d</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu: Geek Toys & Terminal Fun */}
                  <div
                    className="relative"
                    onMouseEnter={() => setGeekToysSubmenuOpen(true)}
                    onMouseLeave={() => setGeekToysSubmenuOpen(false)}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Play className="w-3.5 h-3.5 text-purple-400" /> Geek Toys & Démos ASCII...
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>

                    {geekToysSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-68 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50">
                        <button
                          onClick={() => executeAndClose(() => onLaunchApp('matrix'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Play className="w-3.5 h-3.5 text-emerald-400" /> Pluie de Code Matrix
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">cmatrix</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onLaunchApp('sl'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Play className="w-3.5 h-3.5 text-amber-400" /> Train à Vapeur Rétro
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">sl</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('cowsay "OmniLinux Terminal v2.4 !"'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Vache Parlante Cowsay
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">cowsay</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('fortune || cowsay $(date)'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Fortune Cookie Linux
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">fortune</span>
                        </button>
                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('for i in {0..15}; do echo -en "\\e[48;5;${i}m  \\e[0m"; done; echo'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5 text-teal-400" /> Nuancier ANSI 16/256
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">color test</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Neofetch & Specs */}
                  <button
                    onClick={() => executeAndClose(() => onRunQuickCommand('neofetch'))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-blue-400" /> Logo Distro & Spécifications
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">neofetch</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(() => onRunQuickCommand('uname -a && cat /etc/os-release'))}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-cyan-400" /> Version Noyau Linux & OS
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">uname -a</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. IA COPILOT */}
            <div className="relative">
              <button
                onClick={() => handleMenuClick('ai')}
                onMouseEnter={() => handleMenuHover('ai')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  openMenu === 'ai'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>IA Copilot</span>
              </button>

              {openMenu === 'ai' && (
                <div className="absolute top-full left-0 mt-1 w-84 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200">
                  {/* Active AI Engine Banner */}
                  <div className="mx-2 mb-2 p-2.5 rounded-md bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/30 shadow-inner">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-300">
                          {aiConfig.model === 'gemini-3.8-flash'
                            ? 'Gemini 3.8 Flash'
                            : aiConfig.model === 'gemini-3.1-pro-preview'
                            ? 'Gemini 3.1 Pro'
                            : aiConfig.model === 'gemini-3.1-flash-lite'
                            ? 'Gemini 3.1 Flash Lite'
                            : aiConfig.model === 'gemini-2.5-flash'
                            ? 'Gemini 2.5 Flash'
                            : aiConfig.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] text-emerald-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Opérationnel</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-0.5">
                      <span>Cible : <strong className="text-zinc-200">{activeDistro.name.split(' ')[0]}</strong></span>
                      <span>Shell : <span className="font-mono text-emerald-400">{activeTab.shell}</span></span>
                      <span>
                        Clé :{' '}
                        {aiConfig.isCustomKeyEnabled && aiConfig.customApiKey ? (
                          <span className="text-amber-300 font-mono" title="Clé personnalisée active">
                            BYOK (••{aiConfig.customApiKey.slice(-3)})
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-mono" title="Clé d'environnement plateforme">
                            Serveur
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Configure Model & API Key */}
                  <button
                    onClick={() => executeAndClose(onOpenAiConfigModal)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-emerald-600 hover:text-white transition text-left font-medium text-emerald-400"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5" /> Configurer Modèle & Clé API...
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      Paramètres
                    </span>
                  </button>

                  {/* Quick Model Selector Submenu */}
                  <div
                    className="relative"
                    onMouseEnter={() => setAiModelsSubmenuOpen(true)}
                    onMouseLeave={() => setAiModelsSubmenuOpen(false)}
                  >
                    <button
                      onClick={() => setAiModelsSubmenuOpen(!aiModelsSubmenuOpen)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-200"
                    >
                      <span className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-purple-400" /> Changer de Modèle Gemini
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {aiModelsSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-1 w-64 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200">
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#27272A] mb-1">
                          Modèles Disponibles
                        </div>
                        {[
                          { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', tag: 'Défaut' },
                          { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', tag: 'Pro' },
                          { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', tag: 'Lite' },
                          { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tag: 'Stable' },
                        ].map((m) => {
                          const isCurrent = aiConfig.model === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() =>
                                executeAndClose(() => {
                                  if (onSelectAiModel) onSelectAiModel(m.id);
                                })
                              }
                              className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left ${
                                isCurrent ? 'bg-zinc-800/80 text-emerald-400 font-semibold' : ''
                              }`}
                            >
                              <span className="flex items-center gap-2 text-xs">
                                {isCurrent ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="w-3" />}
                                {m.label}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">{m.tag}</span>
                            </button>
                          );
                        })}
                        <div className="my-1 border-t border-[#27272A]" />
                        <button
                          onClick={() => executeAndClose(onOpenAiConfigModal)}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-300 text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <SlidersIcon className="w-3 h-3 text-zinc-400" /> Personnalisé / Clé API...
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Toggle Copilot Drawer */}
                  <button
                    onClick={() => executeAndClose(onToggleAiDrawer)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-emerald-600 hover:text-white transition text-left font-semibold text-emerald-400"
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5" /> {aiDrawerOpen ? 'Fermer le Volet IA Latéral' : 'Ouvrir le Volet IA Latéral'}
                    </span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">Ctrl+I</span>
                  </button>

                  <button
                    onClick={() =>
                      executeAndClose(() => {
                        if (!aiDrawerOpen) onToggleAiDrawer();
                      })
                    }
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-200"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-blue-400" /> Générer un Script Bash...
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">prompt</span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Contextual Actions */}
                  <div className="px-3 py-0.5 text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Actions Contextuelles
                  </div>

                  <button
                    onClick={() => executeAndClose(handleAiExplainLastCommand)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-200"
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Expliquer la Dernière Commande Saisie
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">ai explain</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(handleAiDebugLastError)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-200"
                  >
                    <span className="flex items-center gap-2">
                      <Bug className="w-3.5 h-3.5 text-rose-400" /> Diagnostiquer la Dernière Erreur
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">ai debug</span>
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Submenu 1: Recettes & Automatisations DevOps */}
                  <div
                    className="relative"
                    onMouseEnter={() => setAiPromptsSubmenuOpen(true)}
                    onMouseLeave={() => setAiPromptsSubmenuOpen(false)}
                  >
                    <button
                      onClick={() => setAiPromptsSubmenuOpen(!aiPromptsSubmenuOpen)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                    >
                      <span className="flex items-center gap-2">
                        <TerminalIcon className="w-3.5 h-3.5 text-sky-400" /> Recettes & Scripts DevOps
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {aiPromptsSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-1 w-76 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200">
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#27272A] mb-1">
                          Scénarios d'Automatisation
                        </div>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "lancer un serveur http sur le port 8080 en tâche de fond"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Lancer un Serveur Web Express</span>
                          <span className="text-[10px] text-zinc-400 font-mono">http 8080</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "trouver les 10 plus gros fichiers sur le disque et les trier"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Trouver les 10 Fichiers les Plus Lourds</span>
                          <span className="text-[10px] text-zinc-400 font-mono">du | sort</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "créer une archive tar.gz compressée et horodatée de /home/user"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Sauvegarde Compressée Horodatée</span>
                          <span className="text-[10px] text-zinc-400 font-mono">tar.gz</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand(`ai "purger les caches paquets et optimiser la mémoire sur ${activeDistro.name}"`)
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Purger les Caches & Libérer la RAM</span>
                          <span className="text-[10px] text-zinc-400 font-mono">clean</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "rechercher le terme ERROR récursivement dans les fichiers journaux"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Recherche Récursive dans les Logs</span>
                          <span className="text-[10px] text-zinc-400 font-mono">grep</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "annuler le dernier commit git sans perdre le travail en cours"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Annuler un Commit Git Proprement</span>
                          <span className="text-[10px] text-zinc-400 font-mono">git reset</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "créer un service systemd d arrière-plan avec restart=always"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Modèle de Service Systemd</span>
                          <span className="text-[10px] text-zinc-400 font-mono">systemd</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu 2: Audits & Sécurité Assistés par IA */}
                  <div
                    className="relative"
                    onMouseEnter={() => setAiAuditsSubmenuOpen(true)}
                    onMouseLeave={() => setAiAuditsSubmenuOpen(false)}
                  >
                    <button
                      onClick={() => setAiAuditsSubmenuOpen(!aiAuditsSubmenuOpen)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Audits & Sécurité IA
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {aiAuditsSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-1 w-76 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200">
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#27272A] mb-1">
                          Diagnostics & Sécurisation
                        </div>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "auditer les binaires SUID et droits sudo potentiellement dangereux"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Audit Droits SUID & Faiblesses Sudo</span>
                          <span className="text-[10px] text-zinc-400 font-mono">suid</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "analyser la sortie de ps aux et recommander des optimisations de charge"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Analyse Processus & Consommation RAM</span>
                          <span className="text-[10px] text-zinc-400 font-mono">ps aux</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "analyser les ports en écoute avec ss et netstat et identifier les risques"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Vérification des Sockets & Ports Réseau</span>
                          <span className="text-[10px] text-zinc-400 font-mono">ss / netstat</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand(`ai "recommandations clés de durcissement sécurité pour ${activeDistro.name}"`)
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Recommandations de Durcissement (Hardening)</span>
                          <span className="text-[10px] text-zinc-400 font-mono">hardening</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "analyser df -h et df -i pour détecter une saturation de disque ou d inodes"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Inspection des Inodes & Espace Disque</span>
                          <span className="text-[10px] text-zinc-400 font-mono">df -i</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submenu 3: Syntaxe CLI Integrée */}
                  <div
                    className="relative"
                    onMouseEnter={() => setAiCommandsSubmenuOpen(true)}
                    onMouseLeave={() => setAiCommandsSubmenuOpen(false)}
                  >
                    <button
                      onClick={() => setAiCommandsSubmenuOpen(!aiCommandsSubmenuOpen)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Compass className="w-3.5 h-3.5 text-purple-400" /> Syntaxes & Manuel CLI `ai`
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {aiCommandsSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-1 w-76 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200">
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#27272A] mb-1">
                          Commandes Terminal Supportées
                        </div>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai "comment vérifier l adresse ip publique en terminal ?"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Poser une Question Libre</span>
                          <span className="text-[10px] text-emerald-400 font-mono">ai "question"</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai explain "find / -type f -perm -4000 2>/dev/null"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Explication de Syntaxe Complexe</span>
                          <span className="text-[10px] text-cyan-400 font-mono">ai explain "cmd"</span>
                        </button>

                        <button
                          onClick={() =>
                            executeAndClose(() =>
                              onRunQuickCommand('ai debug "fatal: not a git repository (or any of the parent directories)"')
                            )
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Résolution & Débogage d'Erreur</span>
                          <span className="text-[10px] text-rose-400 font-mono">ai debug "err"</span>
                        </button>

                        <button
                          onClick={() => executeAndClose(() => onRunQuickCommand('ai --help'))}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                        >
                          <span className="text-xs">Manuel Complet de l'Outil CLI</span>
                          <span className="text-[10px] text-amber-400 font-mono">ai --help</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-[#27272A]" />

                  {/* Direct Free Prompt */}
                  <button
                    onClick={() =>
                      executeAndClose(() =>
                        onRunQuickCommand('ai "comment configurer une tâche planifiée cron quotidienne ?"')
                      )
                    }
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Poser une Question Système Rapide
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">cron</span>
                  </button>

                  <button
                    onClick={() =>
                      executeAndClose(() =>
                        onRunQuickCommand('ai "quels outils de diagnostic réseau sont préinstallés sur cette machine ?"')
                      )
                    }
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Diagnostic Outils Disponibles
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">outils</span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. AIDE */}
            <div className="relative">
              <button
                onClick={() => handleMenuClick('help')}
                onMouseEnter={() => handleMenuHover('help')}
                className={`px-2 py-1 rounded transition ${
                  openMenu === 'help'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                Aide
              </button>

              {openMenu === 'help' && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl py-1.5 z-50 text-zinc-200">
                  <button
                    onClick={() => executeAndClose(onOpenHelpModal)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Guide des Commandes Linux
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">help</span>
                  </button>

                  <button
                    onClick={() => executeAndClose(onOpenHelpModal)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left"
                  >
                    <TermIcon className="w-3.5 h-3.5 text-emerald-400" /> Raccourcis Clavier du Terminal
                  </button>

                  <div className="my-1 border-t border-[#27272A]" />

                  <button
                    onClick={() => executeAndClose(onOpenAboutModal)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white transition text-left text-zinc-300 font-medium"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-400" /> À propos d'OmniLinux Terminal...
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry / Distro Badge / Online Status */}
        <div className="flex items-center gap-3 text-[10px] text-[#71717A]">
          {/* Active Distro Badge */}
          <div
            onClick={onOpenDistroModal}
            className="hidden sm:flex items-center gap-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-200 px-2 py-0.5 rounded cursor-pointer transition"
            title="Changer de distribution"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="font-semibold text-zinc-100">{activeDistro.name.split(' ')[0]}</span>
            <span className="text-zinc-400 hidden lg:inline">{activeDistro.version}</span>
          </div>

          {/* System Online Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="font-mono text-zinc-300 hidden md:inline">SYSTEM ONLINE</span>
          </div>

          {/* IP Badge */}
          <div className="bg-[#27272A] px-2 py-0.5 rounded text-zinc-300 font-mono hidden xl:block">
            192.168.1.42
          </div>
        </div>
      </div>
    </>
  );
};
