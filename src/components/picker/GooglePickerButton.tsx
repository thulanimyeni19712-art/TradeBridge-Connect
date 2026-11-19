import React, { useState } from 'react';
import { openGooglePicker, PickedDriveFile } from '../../services/googlePickerService';
import { signInWithGoogleWorkspace, getAccessToken, logoutWorkspace, auth } from '../../lib/firebase';
import {
  HardDrive,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  Sparkles,
  Zap,
  FolderOpen,
  Check,
} from 'lucide-react';

interface GooglePickerButtonProps {
  onFilePicked?: (file: PickedDriveFile) => void;
  allowedMimeTypes?: string;
  buttonLabel?: string;
  variant?: 'primary' | 'secondary' | 'compact' | 'cyber';
  className?: string;
}

export const GooglePickerButton: React.FC<GooglePickerButtonProps> = ({
  onFilePicked,
  allowedMimeTypes,
  buttonLabel = 'Select from Google Drive',
  variant = 'primary',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastPickedFile, setLastPickedFile] = useState<PickedDriveFile | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleOpenPicker = async () => {
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const file = await openGooglePicker({
        title: 'Select Robot (.ex5, .ex4, .mq5), Preset (.set), or Journal from Google Drive',
        allowedMimeTypes,
        fetchContent: true,
      });

      if (file) {
        setLastPickedFile(file);
        if (onFilePicked) {
          onFilePicked(file);
        }
      }
    } catch (err: unknown) {
      console.error('Google Picker Error:', err);
      setErrorNotice(err instanceof Error ? err.message : 'Failed to launch Google Picker');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleOpenPicker}
        disabled={isLoading}
        className={`px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 ${className}`}
        title="Open Google Drive Picker"
      >
        {isLoading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        ) : (
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
        )}
        <span>{buttonLabel}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleOpenPicker}
        disabled={isLoading}
        className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-lg ${
          variant === 'cyber'
            ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 shadow-cyan-500/25'
            : 'bg-[#101726] hover:bg-[#162035] text-white border border-cyan-500/40 shadow-cyan-950/30'
        } ${className}`}
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Google Drive SVG Icon */}
            <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span>{buttonLabel}</span>
          </div>
        )}
      </button>

      {lastPickedFile && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 truncate">
            <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-white block truncate">{lastPickedFile.name}</span>
              <span className="text-[10px] text-slate-400">
                {lastPickedFile.sizeBytes ? `${(lastPickedFile.sizeBytes / 1024).toFixed(1)} KB` : 'Google Drive Document'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={lastPickedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
              title="Open in Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              IMPORTED
            </span>
          </div>
        </div>
      )}

      {errorNotice && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{errorNotice}</span>
        </div>
      )}
    </div>
  );
};
