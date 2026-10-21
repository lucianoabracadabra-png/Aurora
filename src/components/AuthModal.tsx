import React, { useState } from 'react';
import { 
  User, 
  Crown, 
  UserPlus, 
  Lock, 
  Key, 
  X, 
  Sparkles, 
  HardDrive, 
  FileCode, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  LogOut,
  Flame,
  Target,
  Compass
} from 'lucide-react';
import { StorageApi, CharacterSummary, AuthSession } from '../services/storageApi';
import { createEmptyCharacterData } from '../initialState';
import { FocusDistributionType, FocusConfig } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  availableCharacters: CharacterSummary[];
  onLoginSuccess: (session: { role: 'player' | 'gamemaster'; username: string; name: string; color?: string }, characterData?: any) => void;
  defaultTab?: 'player' | 'gm' | 'register';
  isInitialScreen?: boolean;
  currentSession?: AuthSession | null;
  onLogout?: () => void;
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
  isInitialScreen = false,
  currentSession,
  onLogout,
}) => {
  const [tab, setTab] = useState<'player' | 'gm' | 'register'>(defaultTab);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [internalList, setInternalList] = useState<CharacterSummary[]>(availableCharacters);

  React.useEffect(() => {
    if (availableCharacters.length > 0) {
      setInternalList(availableCharacters);
    } else {
      StorageApi.getCharactersList().then((list) => {
        if (list && list.length > 0) setInternalList(list);
      });
    }
  }, [availableCharacters]);

  // Player login state
  const [playerUsername, setPlayerUsername] = useState('');
  const [playerPassword, setPlayerPassword] = useState('123123123');

  // GM login state
  const [gmPassword, setGmPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('123123123');
  const [regName, setRegName] = useState('');
  const [regArchetype, setRegArchetype] = useState('');
  const [regFocusDist, setRegFocusDist] = useState<FocusDistributionType>('padrao');
  const [regFocusGroup, setRegFocusGroup] = useState<'physical' | 'mental' | 'social'>('physical');
  const [regColor, setRegColor] = useState('#a855f7');

  // Change password state
  const [changeUser, setChangeUser] = useState(
    currentSession?.username && currentSession.username !== 'gamemaster' ? currentSession.username : ''
  );
  const [changeOldPass, setChangeOldPass] = useState('123123123');
  const [changeNewPass, setChangeNewPass] = useState('');
  const [changeConfirmPass, setChangeConfirmPass] = useState('');
  const [changeIsGm, setChangeIsGm] = useState(currentSession?.role === 'gamemaster');
  const [changeSuccessMessage, setChangeSuccessMessage] = useState<string | null>(null);

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
      if (onClose) onClose();
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
      if (onClose) onClose();
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
      setError('O login deve ter pelo menos 2 caracteres alfanuméricos.');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setError('A senha deve ter pelo menos 3 dígitos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cleanName = regName.trim() || cleanUser;
      const emptyData = createEmptyCharacterData(cleanName, regColor);
      emptyData.identity.archetype = regArchetype.trim();

      // Configuração inicial dos Focos conforme as 3 opções
      if (regFocusDist === 'padrao') {
        if (regFocusGroup === 'physical') {
          emptyData.focusConfig = { distribution: 'padrao', physical: 'F1', mental: 'F2', social: 'SF' };
        } else if (regFocusGroup === 'mental') {
          emptyData.focusConfig = { distribution: 'padrao', physical: 'F2', mental: 'F1', social: 'SF' };
        } else {
          emptyData.focusConfig = { distribution: 'padrao', physical: 'F2', mental: 'SF', social: 'F1' };
        }
      } else if (regFocusDist === 'especializada') {
        if (regFocusGroup === 'physical') {
          emptyData.focusConfig = { distribution: 'especializada', physical: 'FE', mental: 'SF', social: 'SF' };
        } else if (regFocusGroup === 'mental') {
          emptyData.focusConfig = { distribution: 'especializada', physical: 'SF', mental: 'FE', social: 'SF' };
        } else {
          emptyData.focusConfig = { distribution: 'especializada', physical: 'SF', mental: 'SF', social: 'FE' };
        }
      } else {
        emptyData.focusConfig = { distribution: 'generalista', physical: 'F2', mental: 'F2', social: 'F2' };
      }

      const res = await StorageApi.register({
        username: cleanUser,
        password: regPassword,
        name: cleanName,
        color: regColor,
        characterData: emptyData,
      });
      onLoginSuccess(
        {
          role: 'player',
          username: res.user.username,
          name: res.user.name,
          color: res.color,
        },
        res.character || emptyData
      );
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar nova ficha.');
    } finally {
      setLoading(false);
    }
  };

  // Preencher rápido com o login e senha padrão
  const selectQuickUser = (u: string) => {
    setPlayerUsername(u);
    setPlayerPassword('123123123');
    setError(null);
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setChangeSuccessMessage(null);

    if (!changeIsGm && !changeUser.trim()) {
      setError('Por favor, informe ou selecione o usuário da ficha.');
      return;
    }
    if (!changeOldPass) {
      setError('Por favor, informe a senha atual.');
      return;
    }
    if (!changeNewPass || changeNewPass.length < 3) {
      setError('A nova senha deve ter pelo menos 3 dígitos.');
      return;
    }
    if (changeNewPass !== changeConfirmPass) {
      setError('A confirmação da nova senha não confere.');
      return;
    }

    try {
      setLoading(true);
      const res = await StorageApi.changePassword({
        username: changeIsGm ? 'gamemaster' : changeUser.trim(),
        currentPassword: changeOldPass,
        newPassword: changeNewPass,
        isGm: changeIsGm,
      });
      setChangeSuccessMessage(res.message || 'Senha alterada com sucesso!');
      setChangeOldPass(changeNewPass);
      setChangeNewPass('');
      setChangeConfirmPass('');
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div
      className={`bg-[#070314]/95 border border-violet-500/30 rounded-3xl w-full p-5 sm:p-6 shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col gap-4 relative overflow-hidden backdrop-blur-xl ${
        isInitialScreen ? 'max-w-md mx-auto' : 'max-w-lg'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/10 border border-violet-400/40 flex items-center justify-center text-violet-300 shadow-[0_0_15px_rgba(167,139,250,0.3)] shrink-0">
            <HardDrive size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>Autenticação & Persistência</span>
            </h3>
            <p className="text-[11px] text-violet-300/80 font-mono flex items-center gap-1.5">
              <Sparkles size={12} className="text-cyan-400" />
              <span>Sincronização em Nuvem & Cache Local</span>
            </p>
          </div>
        </div>
        {!isInitialScreen && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* If already logged into an account, show account panel with 'Mudar Senha' button */}
      {currentSession && !isInitialScreen ? (
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-indigo-950/40 border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white font-bold shadow-md shrink-0"
                style={{ backgroundColor: currentSession.color || (currentSession.role === 'gamemaster' ? '#f59e0b' : '#a855f7') }}
              >
                {currentSession.role === 'gamemaster' ? <Crown size={20} className="text-black" /> : (currentSession.name?.charAt(0).toUpperCase() || 'P')}
              </div>
              <div>
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  {currentSession.role === 'gamemaster' ? 'Mestre da Mesa' : 'Ficha Conectada'}
                </div>
                <div className="text-sm sm:text-base font-black text-white">
                  {currentSession.name || currentSession.username}
                </div>
                <div className="text-[11px] text-violet-300/70 font-mono">
                  Login: @{currentSession.username}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(!isChangingPassword);
                setError(null);
                setChangeSuccessMessage(null);
                setChangeUser(currentSession.username);
                setChangeIsGm(currentSession.role === 'gamemaster');
              }}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all cursor-pointer shrink-0"
            >
              <Key size={14} />
              <span>{isChangingPassword ? 'Fechar' : 'Mudar Senha'}</span>
            </button>
          </div>

          {isChangingPassword ? (
            <div className="bg-black/50 border border-violet-500/30 rounded-2xl p-4 animate-in fade-in flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key size={14} className="text-cyan-400" />
                  <span>Alterar Senha de {currentSession.name || currentSession.username}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="text-xs text-white/50 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {changeSuccessMessage && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-2.5 text-xs text-emerald-300 font-medium flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>{changeSuccessMessage}</span>
                </div>
              )}

              {error && (
                <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-2.5 text-xs text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">
                    {currentSession.role === 'gamemaster' ? 'Senha Atual do Mestre' : 'Senha Atual da Ficha'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Sua senha atual"
                    value={changeOldPass}
                    onChange={(e) => setChangeOldPass(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-violet-400 rounded-xl text-white text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-white/80 block mb-1">Nova Senha</label>
                    <input
                      type="password"
                      required
                      placeholder="Nova senha"
                      value={changeNewPass}
                      onChange={(e) => setChangeNewPass(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-violet-400 rounded-xl text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/80 block mb-1">Confirmar Senha</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirmar"
                      value={changeConfirmPass}
                      onChange={(e) => setChangeConfirmPass(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-violet-400 rounded-xl text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin inline mr-1" /> : <Key size={14} className="inline mr-1" />}
                    <span>Confirmar Nova Senha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[11px] text-white/50">Deseja trocar de personagem ou sair?</span>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    if (onClose) onClose();
                  }}
                  className="text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-semibold"
                >
                  <LogOut size={13} />
                  <span>Desconectar / Trocar de Ficha</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tab Switcher - Apenas Jogador e Mestre */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => { setTab('player'); setError(null); }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'gm'
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] font-black'
                  : 'text-amber-300/70 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Crown size={14} />
              <span>Mestre</span>
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
          <div className="text-[11px] text-white/60 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 leading-relaxed">
            Cada ficha possui persistência independente. Informe seu login e senha para carregar sua ficha.
          </div>

          {/* Quick-Select available sheets - só preenche o login */}
          {internalList.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-white/70 block mb-1.5">
                Fichas salvas (Clique para preencher o login):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {internalList.map((c) => (
                  <button
                    key={c.username}
                    type="button"
                    onClick={() => selectQuickUser(c.username)}
                    title={`Ficha do usuário: ${c.username}`}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      playerUsername === c.username
                        ? 'bg-violet-500/30 border-violet-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: c.color || '#a855f7' }}
                    />
                    <span>{c.username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">
              Nome de Usuário / Login
            </label>
            <input
              type="text"
              required
              placeholder="Vazio"
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
              placeholder="123123123"
              value={playerPassword}
              onChange={(e) => setPlayerPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 focus:border-violet-400 rounded-xl text-white text-xs outline-none transition-colors"
            />
          </div>

          <div className="pt-1">
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
              <span>Conta do Game Master</span>
            </div>
            <p>
              A conta do Mestre conecta todas as fichas dos jogadores da campanha. Como Mestre, você tem visão total, controle da timeline do Battle Tracker e gerenciamento das fichas.
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
              placeholder="saidaquiburro"
              value={gmPassword}
              onChange={(e) => setGmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/50 border border-amber-400/40 focus:border-amber-400 rounded-xl text-white text-xs outline-none transition-colors"
            />
            <p className="text-[10px] text-amber-300/60 mt-1">
              Dica da mesa: A senha do Game Master é <strong className="text-amber-300 font-mono">saidaquiburro</strong>
            </p>
          </div>

          <div className="pt-1">
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

      {/* 3. REGISTER / NEW CHARACTER TAB (Sem campo de arquétipo) */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <div className="text-[11px] text-white/60 bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
            Cria uma nova ficha de personagem com persistência independente no sistema.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Login / Identificador
              </label>
              <input
                type="text"
                required
                placeholder="Vazio"
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
                placeholder="123123123"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl text-white text-xs outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Nome do Personagem
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Elias Iyanu"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl text-white text-xs outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Arquétipo <span className="text-white/40 text-[10px] font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Guardião, Caçador, Feiticeiro"
                value={regArchetype}
                onChange={(e) => setRegArchetype(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl text-white text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {/* Seleção dos 3 Tipos de Focos na Criação */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
            <label className="text-xs font-bold text-white/90 uppercase tracking-wider block">
              Distribuição de Focos dos Grupos
            </label>
            <span className="text-[10px] text-white/50 mb-1 leading-relaxed">
              Define o custo em EXP para evoluir atributos e perícias (Físico, Mental, Social).
            </span>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: 'padrao' as FocusDistributionType,
                  title: 'O Natural (Aptidão Padrão)',
                  pattern: '[ F1 + F2 + SF ]',
                  desc: '1 Primário (baixo custo), 1 Secundário (médio) e 1 Sem Foco (alto).'
                },
                {
                  id: 'especializada' as FocusDistributionType,
                  title: 'O Especialista (Gênio Focado)',
                  pattern: '[ FE + SF + SF ]',
                  desc: '1 Foco Exclusivo (menor custo) e 2 Sem Foco (alto custo).'
                },
                {
                  id: 'generalista' as FocusDistributionType,
                  title: 'O Generalista ("Sem Foco" Específico)',
                  pattern: '[ F2 + F2 + F2 ]',
                  desc: 'Três Focos Secundários de custo médio equilibrado.'
                }
              ].map(opt => {
                const isSelected = regFocusDist === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRegFocusDist(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-black/30 border-white/5 hover:border-white/15 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {opt.title}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-cyan-300">
                        {opt.pattern}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/55 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Grupo com maior afinidade se padrão ou especializada */}
            {regFocusDist !== 'generalista' && (
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-white/70">
                  {regFocusDist === 'padrao' ? 'Grupo Primário (F1):' : 'Grupo Exclusivo (FE):'}
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'physical' as const, label: 'Físico' },
                    { id: 'mental' as const, label: 'Mental' },
                    { id: 'social' as const, label: 'Social' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setRegFocusGroup(g.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        regFocusGroup === g.id
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legenda do Peso dos Focos (aparece junto da seleção na criação da ficha) */}
            <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                Legenda do Peso dos Focos:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-1.5">
                  <Flame size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">FE (Exclusivo):</strong> Menor custo de evolução.
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 flex items-start gap-1.5">
                  <Target size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300">F1 (Primário):</strong> Custo baixo de evolução.
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 flex items-start gap-1.5">
                  <Compass size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cyan-300">F2 (Secundário):</strong> Custo médio padrão.
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-slate-300 flex items-start gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-white/40 shrink-0 mt-0.5 px-1 rounded bg-white/5">SF</span>
                  <div>
                    <strong className="text-white/80">SF (Sem Foco):</strong> Maior custo de evolução.
                  </div>
                </div>
              </div>
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

          <div className="pt-1">
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
      </>
    )}
  </div>
  );

  if (isInitialScreen) {
    return cardContent;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {cardContent}
    </div>
  );
};
