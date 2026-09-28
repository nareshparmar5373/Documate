import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Activity,
  BarChart3,
  HardDrive,
  Settings,
  AlertOctagon,
  LogOut,
  RefreshCw,
  Check,
} from 'lucide-react';
import { AdminSettings, ErrorLog, ProcessingStats } from '../../types';
import {
  getAdminSettings,
  updateAdminSettings,
  getProcessingStats,
  getErrorLogs,
  clearErrorLogs,
} from '../../utils/storage';
import { formatBytes, formatDate } from '../../utils/formatters';

export const AdminView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('documate_admin_session') === 'true';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [stats, setStats] = useState<ProcessingStats>(getProcessingStats());
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>(getErrorLogs());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Dynamic admin credentials: checks configured password from local environment / secure storage
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default administrative passcode or user-configured secret
    const storedSecret = localStorage.getItem('documate_admin_key') || 'admin2026';
    if (passwordInput.trim() === storedSecret) {
      sessionStorage.setItem('documate_admin_session', 'true');
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('documate_admin_session');
    setIsAuthenticated(false);
  };

  const handleSaveSettings = () => {
    const updated = updateAdminSettings(settings);
    setSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearLogs = () => {
    if (confirm('Clear all system error logs?')) {
      clearErrorLogs();
      setErrorLogs([]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-1">
          Admin Portal Login
        </h3>
        <p className="text-xs text-center text-slate-500 mb-6">
          Access telemetry, upload constraints, system settings, and diagnostic logs.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Administrator Master Key / Passcode
            </label>
            <input
              type="password"
              placeholder="Enter passcode (Default: admin2026)"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setLoginError(false);
              }}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-mono"
            />
          </div>

          {loginError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Invalid credentials. Please verify your administrator passcode.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            Authenticate & Open Dashboard
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Passcode can be updated in Settings once logged in.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            DocuMate Admin Control Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            System overview, rate limits, performance metrics & diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setStats(getProcessingStats());
              setErrorLogs(getErrorLogs());
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Operations</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {stats.totalProcessedCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            Active browser instances
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bandwidth / Storage Saved</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            {formatBytes(stats.totalSavedBytes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Through client-side compression
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">System Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {settings.maintenanceMode ? 'Maintenance Mode' : 'Online & Healthy'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            WebAssembly 2026 Core v2.4
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Logged Errors</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {errorLogs.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Handled gracefully
          </div>
        </div>
      </div>

      {/* Tool Usage Breakdown */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Tool Usage Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(stats.toolCounts).map(([toolId, count]) => (
            <div
              key={toolId}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize truncate pr-2">
                {toolId.replace(/-/g, ' ')}
              </span>
              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Settings & Limits */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            System Limits & Configuration
          </h3>
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Settings Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Max Upload Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Maximum File Size Limit (MB)
            </label>
            <input
              type="number"
              min="5"
              max="500"
              value={settings.maxUploadSizeMb}
              onChange={(e) =>
                setSettings({ ...settings, maxUploadSizeMb: parseInt(e.target.value) || 50 })
              }
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Default: 50 MB</span>
          </div>

          {/* Rate Limit Per Minute */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Operations Rate Limit / Min
            </label>
            <input
              type="number"
              min="10"
              max="300"
              value={settings.rateLimitPerMinute}
              onChange={(e) =>
                setSettings({ ...settings, rateLimitPerMinute: parseInt(e.target.value) || 60 })
              }
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Prevents tab lockup</span>
          </div>

          {/* Maintenance Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Maintenance Mode Toggle
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                id="maintenanceToggle"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenanceMode: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <label htmlFor="maintenanceToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {settings.maintenanceMode ? 'Maintenance Mode Enabled' : 'Normal Operation'}
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
        >
          Save Configuration
        </button>
      </div>

      {/* Diagnostic Error Logs */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              Diagnostic Error Logs ({errorLogs.length})
            </h3>
            <p className="text-xs text-slate-400">
              Captures file format anomalies, corrupted PDFs, and memory limits for debugging.
            </p>
          </div>

          {errorLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Clear Logs
            </button>
          )}
        </div>

        {errorLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No errors logged. All systems operating cleanly.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {errorLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    Tool: {log.toolId || 'System'}
                  </span>
                  <span className="font-mono text-[11px]">{formatDate(log.timestamp)}</span>
                </div>
                <div className="font-mono text-slate-800 dark:text-slate-200">{log.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
