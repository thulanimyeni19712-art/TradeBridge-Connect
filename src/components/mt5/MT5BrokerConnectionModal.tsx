import React, { useState, useRef, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { MT5BrokerCredential } from '../../types/trading';
import {
  X,
  Server,
  Key,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  Globe,
  Lock,
} from 'lucide-react';

interface MT5BrokerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_BROKERS = [
  { name: 'IC Markets Global', defaultServer: 'ICMarketsSC-Live02' },
  { name: 'ThinkMarkets (EmergeFX)', defaultServer: 'ThinkMarkets-Live04' },
  { name: 'FTMO MT5', defaultServer: 'FTMO-Server04' },
  { name: 'Pepperstone UK', defaultServer: 'Pepperstone-Live-EU' },
  { name: 'Exness Technologies', defaultServer: 'Exness-Real10' },
  { name: 'Deriv MT5', defaultServer: 'Deriv-Server-02' },
];

export const MT5BrokerConnectionModal: React.FC<MT5BrokerConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { connectMT5Broker } = useTrading();

  const [brokerName, setBrokerName] = useState<string>('IC Markets Global');
  const [server, setServer] = useState<string>('ICMarketsSC-Live02');
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [accountType, setAccountType] = useState<MT5BrokerCredential['accountType']>('LIVE');
  const [protocol, setProtocol] = useState<'DIRECT_SOCKET' | 'ZEROMQ_IPC' | 'PYTHON_DLL'>('DIRECT_SOCKET');

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionStep, setConnectionStep] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleBrokerChange = (selected: string) => {
    setBrokerName(selected);
    const found = POPULAR_BROKERS.find((b) => b.name === selected);
    if (found) {
      setServer(found.defaultServer);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) return;

    setIsConnecting(true);
    setStatusMessage(null);
    setConnectionStep(`Authenticating ${server} over Equinix TLS bridge...`);

    const result = await connectMT5Broker(
      brokerName,
      server,
      login,
      password,
      accountType
    );

    setIsConnecting(false);
    setConnectionStep('');
    setStatusMessage({
      text: result.message,
      isError: !result.success,
    });

    if (result.success) {
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b0e14] border-t md:border border-cyan-500/40 rounded-t-3xl md:rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col font-mono text-xs max-h-[90vh] md:max-h-[92vh]">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 md:hidden" />
        {/* Header */}
        <div className="px-5 md:px-6 py-3.5 md:py-4 border-b border-slate-800 bg-[#101520] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Connect Real MT5 Broker Account</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Direct DMA
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Authenticate your live MetaTrader 5 terminal with the automated trading bridge.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConnect} className="p-6 space-y-4">
          {/* Broker Selection */}
          <div>
            <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
              Select Broker Provider
            </label>
            <select
              value={brokerName}
              onChange={(e) => handleBrokerChange(e.target.value)}
              className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              {POPULAR_BROKERS.map((b) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
              <option value="Custom Broker">Custom Broker / Private Gateway</option>
            </select>
          </div>

          {/* Server & Account Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                MT5 Server Host
              </label>
              <input
                type="text"
                required
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="e.g. ICMarketsSC-Live02"
                className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                Account Classification
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as MT5BrokerCredential['accountType'])}
                className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="LIVE">Live Personal Account</option>
                <option value="PROP_FIRM">Prop Firm Challenge (Emerge / FTMO)</option>
                <option value="DEMO">Demo Practice Account</option>
              </select>
            </div>
          </div>

          {/* Login & Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                MT5 Account Login (Number)
              </label>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="e.g. 50294112"
                className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                Master / Investor Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Bridge Protocol Mode */}
          <div>
            <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
              Execution Protocol
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProtocol('DIRECT_SOCKET')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition ${
                  protocol === 'DIRECT_SOCKET'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Direct WebRequest
              </button>
              <button
                type="button"
                onClick={() => setProtocol('ZEROMQ_IPC')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition ${
                  protocol === 'ZEROMQ_IPC'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                ZeroMQ IPC Bridge
              </button>
              <button
                type="button"
                onClick={() => setProtocol('PYTHON_DLL')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition ${
                  protocol === 'PYTHON_DLL'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                MT5 Native DLL
              </button>
            </div>
          </div>

          {/* Connection Progress */}
          {isConnecting && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Connecting to {brokerName}...</span>
              </div>
              <div className="text-[11px] text-slate-400">{connectionStep}</div>
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                statusMessage.isError
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {statusMessage.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Authenticate & Bind MT5 Broker</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
