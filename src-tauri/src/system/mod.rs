use crate::models::{ProcessItem, SystemTelemetry};

pub struct SystemMonitor;

impl SystemMonitor {
    pub fn get_telemetry(distro_id: &str) -> SystemTelemetry {
        SystemTelemetry {
            cpu_usage_percent: 14.8,
            memory_used_mb: 2150,
            memory_total_mb: 16384,
            disk_used_mb: 8420,
            disk_total_mb: 51200,
            uptime_seconds: 43200,
            active_processes_count: 8,
            distro_id: distro_id.to_string(),
        }
    }

    pub fn list_processes() -> Vec<ProcessItem> {
        vec![
            ProcessItem {
                pid: 1,
                user: "root".to_string(),
                cpu: 0.1,
                mem: 0.3,
                command: "/sbin/init".to_string(),
                status: "S".to_string(),
            },
            ProcessItem {
                pid: 42,
                user: "systemd".to_string(),
                cpu: 0.2,
                mem: 0.5,
                command: "/lib/systemd/systemd-journald".to_string(),
                status: "S".to_string(),
            },
            ProcessItem {
                pid: 104,
                user: "user".to_string(),
                cpu: 1.2,
                mem: 2.1,
                command: "tauri-backend (omnilinux-terminal)".to_string(),
                status: "R".to_string(),
            },
            ProcessItem {
                pid: 108,
                user: "user".to_string(),
                cpu: 0.5,
                mem: 1.0,
                command: "/bin/bash --login".to_string(),
                status: "S".to_string(),
            },
            ProcessItem {
                pid: 120,
                user: "user".to_string(),
                cpu: 0.8,
                mem: 1.4,
                command: "vfs-worker [posix-rust]".to_string(),
                status: "S".to_string(),
            },
            ProcessItem {
                pid: 144,
                user: "user".to_string(),
                cpu: 0.1,
                mem: 0.4,
                command: "ai-copilot-daemon --engine=gemini-flash".to_string(),
                status: "S".to_string(),
            },
        ]
    }
}
