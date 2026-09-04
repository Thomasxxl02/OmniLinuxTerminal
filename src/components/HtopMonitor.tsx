import React, { useState, useEffect } from 'react';
import { X, Play, Square, Activity, Cpu, HardDrive } from 'lucide-react';

interface Process {
  pid: number;
  user: string;
  pri: number;
  ni: number;
  virt: string;
  res: string;
  shr: string;
  s: string;
  cpu: number;
  mem: number;
  time: string;
  command: string;
}

interface HtopMonitorProps {
  distroName: string;
  onClose: () => void;
}

export const HtopMonitor: React.FC<HtopMonitorProps> = ({ distroName, onClose }) => {
  const [processes, setProcesses] = useState<Process[]>([
    { pid: 1, user: 'root', pri: 20, ni: 0, virt: '168M', res: '12M', shr: '8M', s: 'S', cpu: 0.1, mem: 0.2, time: '0:03.12', command: '/sbin/init splash' },
    { pid: 132, user: 'root', pri: 20, ni: 0, virt: '42M', res: '4M', shr: '3M', s: 'S', cpu: 0.0, mem: 0.1, time: '0:00.45', command: 'systemd-journald' },
    { pid: 402, user: 'root', pri: 20, ni: 0, virt: '85M', res: '18M', shr: '12M', s: 'S', cpu: 0.2, mem: 0.4, time: '0:01.88', command: '/usr/sbin/sshd -D' },
    { pid: 812, user: 'user', pri: 20, ni: 0, virt: '320M', res: '64M', shr: '32M', s: 'S', cpu: 1.4, mem: 1.2, time: '0:12.40', command: '/bin/bash' },
    { pid: 1042, user: 'user', pri: 20, ni: 0, virt: '850M', res: '142M', shr: '56M', s: 'S', cpu: 3.2, mem: 2.8, time: '0:28.91', command: 'python3 /usr/bin/ai-daemon' },
    { pid: 1337, user: 'user', pri: 20, ni: 0, virt: '124M', res: '28M', shr: '16M', s: 'R', cpu: 4.8, mem: 0.6, time: '0:02.10', command: 'htop' },
    { pid: 2048, user: 'www-data', pri: 20, ni: 0, virt: '450M', res: '88M', shr: '24M', s: 'S', cpu: 0.8, mem: 1.1, time: '0:05.15', command: 'nginx: worker process' },
  ]);

  const [cpuUsage, setCpuUsage] = useState([12, 8, 24, 15]);
  const [ramUsage, setRamUsage] = useState(2048);

  // Live simulation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage([
        Math.floor(5 + Math.random() * 30),
        Math.floor(4 + Math.random() * 25),
        Math.floor(8 + Math.random() * 40),
        Math.floor(6 + Math.random() * 20),
      ]);
      setProcesses(prev =>
        prev.map(p => ({
          ...p,
          cpu: +(Math.random() * (p.command.includes('htop') ? 8 : 3)).toFixed(1)
        }))
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleKill = (pid: number) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="bg-zinc-900 text-zinc-200 px-4 py-2 flex justify-between items-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-white">HTOP 3.3.0 - {distroName}</span>
        </div>
        <button
          onClick={onClose}
          className="bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white px-2.5 py-1 rounded text-xs transition font-sans flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Quitter Htop (F10)
        </button>
      </div>

      {/* Gauges & Summary */}
      <div className="p-3 bg-zinc-950/80 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-800/80">
        {/* CPU Bars */}
        <div className="space-y-1">
          {cpuUsage.map((usage, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 text-zinc-400 text-right">{idx + 1}</span>
              <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden flex items-center px-1 border border-zinc-800">
                <div
                  className="bg-emerald-500 h-2 rounded-xs transition-all duration-500"
                  style={{ width: `${usage}%` }}
                />
              </div>
              <span className="w-10 text-right text-emerald-300 font-bold">{usage}%</span>
            </div>
          ))}
        </div>

        {/* RAM & System info */}
        <div className="space-y-2 text-zinc-300">
          <div>
            <div className="flex justify-between text-zinc-400 mb-1">
              <span>Mem [|||||||||||||||............]</span>
              <span className="text-emerald-400 font-semibold">{ramUsage}MiB / 8192MiB</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded overflow-hidden border border-zinc-800">
              <div className="bg-cyan-500 h-full w-[25%]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
            <div>Tasks: <span className="text-white font-bold">{processes.length}</span>, 1 running</div>
            <div>Uptime: <span className="text-white font-bold">4d 12:35:10</span></div>
            <div>Load avg: <span className="text-emerald-400 font-bold">0.15 0.22 0.18</span></div>
            <div>PID Max: <span className="text-white font-bold">32768</span></div>
          </div>
        </div>
      </div>

      {/* Process Table Header */}
      <div className="bg-emerald-600 text-zinc-950 px-3 py-1 font-bold grid grid-cols-12 gap-1 uppercase text-[11px]">
        <div className="col-span-1">PID</div>
        <div className="col-span-2">USER</div>
        <div className="col-span-1">PRI</div>
        <div className="col-span-1">VIRT</div>
        <div className="col-span-1">RES</div>
        <div className="col-span-1">CPU%</div>
        <div className="col-span-1">MEM%</div>
        <div className="col-span-3">COMMAND</div>
        <div className="col-span-1 text-right">ACTION</div>
      </div>

      {/* Process List Body */}
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {processes.map((proc) => (
          <div
            key={proc.pid}
            className="grid grid-cols-12 gap-1 px-2 py-1 items-center hover:bg-zinc-800/80 rounded font-mono text-[11px] text-zinc-300 transition"
          >
            <div className="col-span-1 text-amber-400 font-bold">{proc.pid}</div>
            <div className="col-span-2 text-cyan-400 truncate">{proc.user}</div>
            <div className="col-span-1 text-zinc-400">{proc.pri}</div>
            <div className="col-span-1 text-zinc-400">{proc.virt}</div>
            <div className="col-span-1 text-zinc-400">{proc.res}</div>
            <div className="col-span-1 text-emerald-400 font-bold">{proc.cpu}%</div>
            <div className="col-span-1 text-emerald-400">{proc.mem}%</div>
            <div className="col-span-3 text-white truncate font-medium">{proc.command}</div>
            <div className="col-span-1 text-right">
              <button
                onClick={() => handleKill(proc.pid)}
                className="bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white px-1.5 py-0.5 rounded text-[10px] font-sans font-medium transition"
              >
                Kill
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer shortcut bar */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-1.5 flex gap-2 text-[11px] text-zinc-300 select-none">
        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-bold">F1 Help</span>
        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-bold">F3 Search</span>
        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-bold">F9 Kill</span>
        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-rose-400 font-bold cursor-pointer" onClick={onClose}>F10 Quit</span>
      </div>
    </div>
  );
};
