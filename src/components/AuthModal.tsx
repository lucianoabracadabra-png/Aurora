import React, { useState } from 'react';
import { 
  User, 
  Crown, 
  UserPlus, 
  Lock, 
  Key, 
  X, 
  Check, 
  Sparkles, 
  HardDrive, 
  FileCode, 
  Loader2, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { StorageApi, CharacterSummary } from '../services/storageApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCharacters: CharacterSummary[];
  onLoginSuccess: (session: { role: 'player' | 'gamemaster'; username: string; name: string; color?: string }, characterData?: any) => void;
  defaultTab?: 'player' | 'gm' | 'register';
}

const COLOR_PRESETS = [
  { label: 'Violeta', value: '#a855f7' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Rosa', value: '#f43f5e' },
  { label: 'Índigo', value: '#6366f1' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  availableCharacters,
  onLoginSuccess,
  defaultTab = 'player',
}) => {
  const [tab, setTab] = useState<'player' | 'gm' | 'register'>(defaultTab);

  // Player login state
  const [playerUsername, setPlayerUsername] = useState('');
  const [playerPassword, setPlayerPassword] = useState('');

  // GM login state
  const [gmPassword, setGmPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('Místico Arcano');
  const [regColor, setRegColor] = useState('#a855f7');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Player Login
  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerUsername.trim()) {
      setError('Por favor, informe seu nome de usuário.');
      return;
    }
    if (!playerPassword) {
      setError('Por favor, informe sua senha.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await StorageApi.login(playerUsername.trim(), playerPassword, false);
      onLoginSuccess(
        {
          role: 'player',
          username: res.user.username,
          name: res.user.name,
          color: res.color,
        },
        res.character
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  // Handle GM Login
  const handleGmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmPassword) {
      setError('Informe a senha do Game Master.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await StorageApi.loginGm(gmPassword);
      onLoginSuccess({
        role: 'gamemaster',
        username: 'gamemaster',
        name: res.user.name || 'Game Master',
        color: '#f59e0b',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Senha incorreta para a conta do Game Master.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = regUsername.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUser || cleanUser.length < 2) {
      setError('O username deve ter pelo menos 2 caracteres alfanuméricos.');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setError('A senha deve ter pelo menos 3 dígitos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await StorageApi.register({
        username: cleanUser,
        password: regPassword,
        name: regName.trim() || cleanUser,
        role: regRole,
        color: regColor,
      });
      onLoginSuccess(
        {
          role: 'player',
          username: res.user.username,
          name: res.user.name,
          color: res.color,
        },
        res.character
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar nova ficha.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo user
  const selectQuickUser = (u: string) => {
    setPlayerUsername(u);
    setPlayerPassword('123');
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#070314] border border-violet-500/30 rounded-3xl max-w-lg w-full p-6 shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col gap-4 animate-in zoom-in-95 duration-150 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/10 border border-violet-400/40 flex items-center justify-center text-violet-300 shadow-[0_0_15px_rgba(167,139,250,0.3)]">
              <HardDrive size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Autenticação & Persistência</span>
              </h3>
              <p className="text-[11px] text-violet-300/80 font-mono flex items-center gap-1.5">
                <FileCode size={12} />
                <span>Sistema File-System (Sem Banco de Dados)</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl">
          <button
            type="button"
            onClick={() => { setTab('player'); setError(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'player'
                ? 'bg-violet-600/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={14} />
            <span>Jogador</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('gm'); setError(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'gm'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] font-black'
                : 'text-amber-300/70 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Crown size={14} />
            <span>Mestre (GM)</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-cyan-600/90 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus size={14} />
            <span>Nova Ficha</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. PLAYER LOGIN TAB */}
        {tab === 'player' && (
          <form onSubmit={handlePlayerLogin} className="flex flex-col gap-3.5">
            <div className="text-[11px] text-white/60 bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
              Cada ficha é salva em seu arquivo <code className="text-violet-300 font-mono">[username].json</code> independente no disco. Sua senha valida o acesso ao seu arquivo.
            </div>

            {/* Quick-Select available sheets */}
            {availableCharacters.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold text-white/70 block mb-1.5">
                  Fichas salvas no disco (Clique para preencher rápido):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableCharacters.map((c) => (
                    <button
                      key={c.username}
                      type="button"
                      onClick={() => selectQuickUser(c.username)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        playerUsername === c.username
                          ? 'bg-violet-500/30 border-violet-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: c.color || '#a855f7' }}
                      />
                      <span>{c.name || c.username}</span>
                      <span className="text-[10px] text-white/40 font-mono">({c.username}.json)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Nome de Usuário (arquivo .json)
              </label>
              <input
                type="text"
                required
                placeholder="Ex: arcana, valerius, seu_nome..."
                value={playerUsername}
                onChange={(e) => setPlayerUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 focus:border-violet-400 rounded-xl text-white text-xs outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Senha da Ficha
              </label>
              <input
                type="password"
                required
                placeholder="Digite sua senha (padrão de teste: 123)"
                value={playerPassword}
                onChange={(e) => setPlayerPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 focus:border-violet-400 rounded-xl text-white text-xs outline-none transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                <span>Entrar & Carregar Ficha</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. GAME MASTER LOGIN TAB */}
        {tab === 'gm' && (
          <form onSubmit={handleGmLogin} className="flex flex-col gap-3.5">
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                <Crown size={15} />
                <span>Conta do Game Master (gamemaster.json)</span>
              </div>
              <p>
                O arquivo <code className="text-white bg-black/40 px-1 py-0.5 rounded font-mono">data/gamemaster.json</code> conecta todas as fichas dos jogadores. Como Mestre, você tem visão total, controle da timeline do Battle Tracker e permissão de apagar qualquer ficha com a senha.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1 flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                <span>Senha do Game Master</span>
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Digite a senha do Mestre (saidaquiburro)..."
                value={gmPassword}
                onChange={(e) => setGmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-amber-400/40 focus:border-amber-400 rounded-xl text-white text-xs outline-none transition-colors"
              />
              <p className="text-[10px] text-amber-300/60 mt-1">
                Dica da mesa: A senha do Game Master é <strong className="text-amber-300 font-mono">saidaquiburro</strong>
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin text-black" /> : <ShieldCheck size={16} />}
                <span>Entrar como Game Master</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. REGISTER / NEW CHARACTER TAB */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="text-[11px] text-white/60 bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
              Cria um novo arquivo <code className="text-cyan-300 font-mono">[username].json</code> persistido diretamente no sistema de arquivos do servidor.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Username do Arquivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: lyra, thorin"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl text-white text-xs outline-none transition-colors font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Senha da Ficha
                </label>
                <input
                  type="password"
                  required
                  placeholder="Crie sua senha..."
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl text-white text-xs outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Nome do Personagem
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lyra Lunaris"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Arquétipo / Origem
                </label>
                <input
                  type="text"
                  placeholder="Ex: Feiticeira Elemental"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl text-white text-xs outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Cor de Destaque
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setRegColor(p.value)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      regColor === p.value ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.value }}
                    title={p.label}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
                <span>Criar Arquivo & Começar Ficha</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
