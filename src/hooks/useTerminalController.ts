import { useCallback, useState } from 'react';
import { runTerminalCommand, applyTerminalResult } from '../lib/tauriBridge';
import { riskAnalyze, RiskReport } from '../lib/riskApi';
import { TerminalTab } from '../types';

// ===========================================================================
// useTerminalController — point d'exécution UNIQUE des commandes terminal.
// Appelle Rust (runTerminalCommand), applique le garde-fou de risque, puis
// traduit le résultat (effets) en état visuel via onUpdateTab. Utilisé par le
// formulaire de saisie (TerminalView), la barre de menus (App) et le collage.
// Élimine les deux chemins d'exécution dupliqués.
// ===========================================================================

export interface ExecuteOptions {
  /** Vrai quand l'utilisateur a déjà confirmé le risque (pas de ré-analyse). */
  skipRisk?: boolean;
}

export interface TerminalController {
  /** Exécute une commande (analyse de risque + appel Rust + rendu visuel). */
  runCommand: (command: string, tab: TerminalTab, opts?: ExecuteOptions) => Promise<void>;
  /** Exécute après confirmation de l'utilisateur (pas de ré-analyse). */
  runConfirmed: (command: string, tab: TerminalTab) => Promise<void>;
  /** Ferme la boîte de confirmation (annulation) sans exécuter. */
  dismissRisk: () => void;
  isExecuting: boolean;
  riskConfirm: { command: string; report: RiskReport } | null;
}

export function useTerminalController(
  onUpdateTab: (updated: Partial<TerminalTab>) => void
): TerminalController {
  const [isExecuting, setIsExecuting] = useState(false);
  const [riskConfirm, setRiskConfirm] = useState<{ command: string; report: RiskReport } | null>(null);

  const runCommand = useCallback(
    async (command: string, tab: TerminalTab, opts: ExecuteOptions = {}) => {
      const trimmed = command.trim();
      if (!trimmed) return;

      const inputLineId = `line-${Date.now()}`;
      const newHistory: TerminalTab['history'] = [
        ...tab.history,
        { id: inputLineId, type: 'input' as const, content: command, cwd: tab.cwd, distroId: tab.distroId },
      ];
      const updatedCmdHistory = [...tab.commandHistory, command];

      if (!opts.skipRisk) {
        let report: RiskReport | null = null;
        try {
          report = await riskAnalyze(trimmed);
        } catch {
          report = null;
        }
        if (report?.blocked) {
          onUpdateTab(
            applyTerminalResult(
              {
                stdout: `⛔ Commande bloquée (analyse de risque).\n${report.reasons.join('\n')}`,
                stderr: '',
                exitCode: 1,
                cwd: tab.cwd,
                effects: [],
              },
              tab,
              newHistory,
              updatedCmdHistory
            )
          );
          return;
        }
        if (report?.needsConfirmation) {
          setRiskConfirm({ command, report });
          return;
        }
      }

      setIsExecuting(true);
      try {
        const result = await runTerminalCommand(command, tab.cwd, tab.distroId);
        onUpdateTab(applyTerminalResult(result, tab, newHistory, updatedCmdHistory));
      } finally {
        setIsExecuting(false);
      }
    },
    [onUpdateTab]
  );

  const runConfirmed = useCallback(
    (command: string, tab: TerminalTab) => {
      setRiskConfirm(null);
      return runCommand(command, tab, { skipRisk: true });
    },
    [runCommand]
  );

  const dismissRisk = useCallback(() => setRiskConfirm(null), []);

  return { runCommand, runConfirmed, dismissRisk, isExecuting, riskConfirm };
}
