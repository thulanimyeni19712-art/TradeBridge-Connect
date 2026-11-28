import { useEffect, useState } from 'react';
import { createUniqueId } from '../lib/crypto';

export type SpeechAlertCategory =
  | 'BOT_ENTRY'
  | 'CRITICAL_MOVE'
  | 'SIGNAL_ALERT'
  | 'OUTCOME'
  | 'SYSTEM';

export type SpeechSeverity = 'INFO' | 'HIGH' | 'CRITICAL';

export type SpeechDeliveryStatus =
  | 'SPOKEN'
  | 'MUTED'
  | 'DISABLED_CATEGORY'
  | 'UNSUPPORTED'
  | 'COOLDOWN';

export interface SpeechSettings {
  enabled: boolean;
  announceBotTrades: boolean;
  announceCriticalMoves: boolean;
  announceOutcomes: boolean;
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeechAnnouncementEvent {
  id: string;
  timestamp: number;
  category: SpeechAlertCategory;
  severity: SpeechSeverity;
  title: string;
  message: string;
  status: SpeechDeliveryStatus;
  dedupeKey?: string;
}

export interface SpeechVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
}

export interface SpeechNotifierSnapshot {
  isSupported: boolean;
  isSpeaking: boolean;
  settings: SpeechSettings;
  voices: SpeechVoiceOption[];
  logs: SpeechAnnouncementEvent[];
}

export interface SpeakOptions {
  category: SpeechAlertCategory;
  severity?: SpeechSeverity;
  title: string;
  message: string;
  dedupeKey?: string;
  cooldownMs?: number;
  interrupt?: boolean;
  forceSpeak?: boolean;
}

const STORAGE_KEY = 'titan_speech_notifier_v1';

const DEFAULT_SETTINGS: SpeechSettings = {
  enabled: true,
  announceBotTrades: true,
  announceCriticalMoves: true,
  announceOutcomes: true,
  voiceURI: '',
  rate: 1.05,
  pitch: 1.0,
  volume: 0.95,
};

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function hasSpeechSynthesis(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

class SpeechNotificationService {
  private settings: SpeechSettings;
  private voices: SpeechVoiceOption[] = [];
  private logs: SpeechAnnouncementEvent[] = [];
  private isSpeaking = false;
  private listeners = new Set<() => void>();
  private cooldownMap = new Map<string, number>();
  private voicesBound = false;

  constructor() {
    this.settings = this.loadSettings();
    if (hasSpeechSynthesis()) {
      this.refreshVoices();
      this.bindVoiceListener();
    }
  }

  private loadSettings(): SpeechSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw) as Partial<SpeechSettings>;
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SETTINGS.enabled,
        announceBotTrades:
          typeof parsed.announceBotTrades === 'boolean'
            ? parsed.announceBotTrades
            : DEFAULT_SETTINGS.announceBotTrades,
        announceCriticalMoves:
          typeof parsed.announceCriticalMoves === 'boolean'
            ? parsed.announceCriticalMoves
            : DEFAULT_SETTINGS.announceCriticalMoves,
        announceOutcomes:
          typeof parsed.announceOutcomes === 'boolean'
            ? parsed.announceOutcomes
            : DEFAULT_SETTINGS.announceOutcomes,
        voiceURI: typeof parsed.voiceURI === 'string' ? parsed.voiceURI : '',
        rate: clamp(Number(parsed.rate ?? DEFAULT_SETTINGS.rate), 0.7, 1.6),
        pitch: clamp(Number(parsed.pitch ?? DEFAULT_SETTINGS.pitch), 0.7, 1.4),
        volume: clamp(Number(parsed.volume ?? DEFAULT_SETTINGS.volume), 0, 1),
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage quota errors
    }
  }

  private bindVoiceListener(): void {
    if (this.voicesBound || !hasSpeechSynthesis()) return;
    this.voicesBound = true;
    const synth = window.speechSynthesis;
    const handleVoicesChanged = () => {
      this.refreshVoices();
      this.emit();
    };
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', handleVoicesChanged);
    } else {
      synth.onvoiceschanged = handleVoicesChanged;
    }
  }

  private refreshVoices(): void {
    if (!hasSpeechSynthesis()) {
      this.voices = [];
      return;
    }
    try {
      const rawVoices = window.speechSynthesis.getVoices() || [];
      const sorted = [...rawVoices].sort((a, b) => {
        const aEn = a.lang.toLowerCase().startsWith('en') ? 0 : 1;
        const bEn = b.lang.toLowerCase().startsWith('en') ? 0 : 1;
        if (aEn !== bEn) return aEn - bEn;
        return a.name.localeCompare(b.name);
      });
      this.voices = sorted.map((v) => ({
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        localService: v.localService,
      }));
    } catch {
      this.voices = [];
    }
  }

  private emit(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore subscriber error
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    if (hasSpeechSynthesis() && this.voices.length === 0) {
      this.refreshVoices();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): SpeechNotifierSnapshot {
    return {
      isSupported: hasSpeechSynthesis(),
      isSpeaking: this.isSpeaking,
      settings: { ...this.settings },
      voices: this.voices,
      logs: this.logs,
    };
  }

  public updateSettings(patch: Partial<SpeechSettings>): void {
    this.settings = {
      ...this.settings,
      ...patch,
      rate: patch.rate !== undefined ? clamp(patch.rate, 0.7, 1.6) : this.settings.rate,
      pitch: patch.pitch !== undefined ? clamp(patch.pitch, 0.7, 1.4) : this.settings.pitch,
      volume: patch.volume !== undefined ? clamp(patch.volume, 0, 1) : this.settings.volume,
    };
    this.saveSettings();
    if (patch.enabled === false) {
      this.stopAll();
    } else {
      this.emit();
    }
  }

  public stopAll(): void {
    if (hasSpeechSynthesis()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel failures
      }
    }
    this.isSpeaking = false;
    this.emit();
  }

  public clearLogs(): void {
    this.logs = [];
    this.emit();
  }

  private isCategoryAllowed(category: SpeechAlertCategory): boolean {
    if (category === 'BOT_ENTRY' || category === 'SIGNAL_ALERT') {
      return this.settings.announceBotTrades;
    }
    if (category === 'CRITICAL_MOVE') {
      return this.settings.announceCriticalMoves;
    }
    if (category === 'OUTCOME') {
      return this.settings.announceOutcomes;
    }
    return true;
  }

  private appendLog(entry: SpeechAnnouncementEvent): void {
    this.logs = [entry, ...this.logs.slice(0, 59)];
    this.emit();
  }

  private dispatchUtterance(text: string, interrupt: boolean): boolean {
    if (!hasSpeechSynthesis()) return false;
    try {
      const synth = window.speechSynthesis;
      if (interrupt || synth.pending) {
        // Keep queue short so alerts stay timely
        if (interrupt) {
          synth.cancel();
        }
      }

      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;

      const availableVoices = synth.getVoices();
      const chosen =
        (this.settings.voiceURI &&
          availableVoices.find((v) => v.voiceURI === this.settings.voiceURI)) ||
        availableVoices.find((v) => v.lang.toLowerCase().startsWith('en') && v.default) ||
        availableVoices.find((v) => v.lang.toLowerCase().startsWith('en'));

      if (chosen) {
        utterance.voice = chosen;
        utterance.lang = chosen.lang;
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.emit();
      };
      utterance.onend = () => {
        this.isSpeaking = synth.speaking || synth.pending;
        this.emit();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        this.emit();
      };

      synth.speak(utterance);
      this.isSpeaking = true;
      this.emit();
      return true;
    } catch {
      this.isSpeaking = false;
      this.emit();
      return false;
    }
  }

  public speak(options: SpeakOptions): SpeechAnnouncementEvent {
    const now = Date.now();
    const severity: SpeechSeverity = options.severity || 'INFO';
    const cooldownMs = options.cooldownMs ?? 3000;

    if (!options.forceSpeak && options.dedupeKey) {
      const lastAt = this.cooldownMap.get(options.dedupeKey) || 0;
      if (now - lastAt < cooldownMs) {
        return {
          id: createUniqueId('SPK'),
          timestamp: now,
          category: options.category,
          severity,
          title: options.title,
          message: options.message,
          status: 'COOLDOWN',
          dedupeKey: options.dedupeKey,
        };
      }
      this.cooldownMap.set(options.dedupeKey, now);
    }

    let status: SpeechDeliveryStatus = 'SPOKEN';
    if (!hasSpeechSynthesis()) {
      status = 'UNSUPPORTED';
    } else if (!options.forceSpeak && !this.settings.enabled) {
      status = 'MUTED';
    } else if (!options.forceSpeak && !this.isCategoryAllowed(options.category)) {
      status = 'DISABLED_CATEGORY';
    } else {
      const ok = this.dispatchUtterance(
        options.message,
        Boolean(options.interrupt || severity === 'CRITICAL')
      );
      if (!ok) status = 'UNSUPPORTED';
    }

    const event: SpeechAnnouncementEvent = {
      id: createUniqueId('SPK'),
      timestamp: now,
      category: options.category,
      severity,
      title: options.title,
      message: options.message,
      status,
      dedupeKey: options.dedupeKey,
    };

    this.appendLog(event);
    return event;
  }

  public replayEvent(eventId: string): void {
    const found = this.logs.find((l) => l.id === eventId);
    if (!found) return;
    this.dispatchUtterance(found.message, true);
  }

  public testVoice(): void {
    this.speak({
      category: 'BOT_ENTRY',
      severity: 'HIGH',
      title: 'Voice Dispatch Calibration Test',
      message:
        'Titan Aviator EA Lab voice synthesis active. Monitoring critical market moves and autonomous bot signal entries.',
      forceSpeak: true,
      interrupt: true,
    });
  }
}

export const speechNotifier = new SpeechNotificationService();

export function useSpeechNotifications(): SpeechNotifierSnapshot {
  const [snapshot, setSnapshot] = useState<SpeechNotifierSnapshot>(() =>
    speechNotifier.getSnapshot()
  );

  useEffect(() => {
    setSnapshot(speechNotifier.getSnapshot());
    return speechNotifier.subscribe(() => {
      setSnapshot(speechNotifier.getSnapshot());
    });
  }, []);

  return snapshot;
}
