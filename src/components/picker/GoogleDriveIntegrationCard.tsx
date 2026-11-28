import React, { useState, useEffect, useCallback } from 'react';
import { GooglePickerButton } from './GooglePickerButton';
import { PickedDriveFile } from '../../services/googlePickerService';
import {
  signInWithGoogleWorkspace,
  logoutWorkspace,
  getAccessToken,
  fetchDriveFiles,
  auth,
} from '../../lib/firebase';
import {
  FileCode,
  ExternalLink,
  LogOut,
  RefreshCw,
  FolderOpen,
  AlertCircle,
} from 'lucide-react';

const PICKED_DRIVE_STORAGE_KEY = 'algotrade_picked_drive_files_v1';

export const GoogleDriveIntegrationCard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [pickedFiles, setPickedFiles] = useState<PickedDriveFile[]>(() => {
    try {
      const saved = localStorage.getItem(PICKED_DRIVE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PICKED_DRIVE_STORAGE_KEY, JSON.stringify(pickedFiles));
    } catch {
      // Ignore
    }
  }, [pickedFiles]);

  const loadUserDriveFiles = useCallback(async (accessToken: string) => {
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const files = await fetchDriveFiles(accessToken);
      const mapped: PickedDriveFile[] = files.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        url: f.url,
        sizeBytes: f.sizeBytes,
        lastEditedUtc: f.modifiedTime,
      }));
      setPickedFiles((prev) => {
        const merged = [...mapped];
        for (const item of prev) {
          if (!merged.some((m) => m.id === item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
    } catch (err: unknown) {
      setDriveError(err instanceof Error ? err.message : 'Unable to list Google Drive files.');
    } finally {
      setIsLoadingDrive(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setCurrentUser(u);
      const t = await getAccessToken();
      setToken(t);
      if (t) {
        void loadUserDriveFiles(t);
      }
    });
    return () => unsubscribe();
  }, [loadUserDriveFiles]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setDriveError(null);
    try {
      const res = await signInWithGoogleWorkspace();
      setCurrentUser(res.user);
      setToken(res.accessToken);
      if (res.accessToken) {
        await loadUserDriveFiles(res.accessToken);
      }
    } catch (err: unknown) {
      setDriveError(err instanceof Error ? err.message : 'Google Workspace sign-in cancelled.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutWorkspace();
    setCurrentUser(null);
    setToken(null);
  };

  const handleFilePicked = (file: PickedDriveFile) => {
    setPickedFiles((prev) => [file, ...prev.filter((f) => f.id !== file.id)]);
  };

  return (
    <div className="rounded-xl bg-[#0F141E] border border-white/10 p-5 sm:p-6 shadow-xl space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#161D2B] border border-white/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Google Picker &amp; Drive Cloud Storage
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase">
                Live OAuth
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select and import Expert Advisors, .set presets, and backtest logs directly from your Google Drive.
            </p>
          </div>
        </div>

        {/* User Auth State */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 p-1.5 bg-[#161D2B] rounded-xl border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                {currentUser.displayName ? currentUser.displayName[0] : 'U'}
              </div>
              <div className="text-left text-xs pr-2">
                <span className="block font-semibold text-white leading-tight truncate max-w-[140px]">
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className="text-[10px] text-emerald-400">Connected</span>
              </div>
              {token && (
                <button
                  onClick={() => void loadUserDriveFiles(token)}
                  disabled={isLoadingDrive}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                  title="Refresh Drive files"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/5">
        <div>
          <span className="text-xs font-bold text-white block">
            Import Any Robot or Strategy File
          </span>
          <span className="text-[10px] text-slate-400 font-sans">
            Uses Google Picker &amp; Drive API v3 with your authenticated OAuth session.
          </span>
        </div>

        <GooglePickerButton
          onFilePicked={handleFilePicked}
          buttonLabel="Browse Drive with Google Picker"
          variant="cyber"
        />
      </div>

      {driveError && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{driveError}</span>
        </div>
      )}

      {/* Real Picked & Synced Drive Files */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
          Synced &amp; Picked Google Drive Files ({pickedFiles.length})
        </span>

        {pickedFiles.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#050811] border border-dashed border-white/10 text-center space-y-2">
            <FolderOpen className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400 font-sans">
              No Google Drive files loaded yet. Sign in with Google or click &quot;Browse Drive with Google Picker&quot; to attach live Drive files.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pickedFiles.map((file) => (
              <div
                key={file.id}
                className="p-3 rounded-xl bg-[#050811] border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(1)} KB` : 'Google Drive Document'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                    title="View on Google Drive"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
