/**
 * D'VERO — Centralized Audit & Operational Logger
 */

type LogLevel = 'info' | 'warn' | 'error';

export function logAudit(action: string, level: LogLevel = 'info', metadata: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[D'VERO AUDIT ${level.toUpperCase()}] [${timestamp}] Action: ${action}`, metadata);
}
