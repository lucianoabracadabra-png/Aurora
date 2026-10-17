import React, { useState } from 'react';
import { 
  Crown, 
  Plus, 
  Trash2, 
  X,
  FileCode,
  HardDrive
} from 'lucide-react';
import { CampaignCharacter } from '../types';

interface GmRosterBarProps {
  characters: CampaignCharacter[];
  activeCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onAddCharacter: (name: string, role?: string, color?: string, username?: string, password?: string) => void;
  onRequestDeleteCharacter: (char: CampaignCharacter) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  isGmView?: boolean;
}

const COLOR_PRESETS = [
  { label: 'Violeta', value: '#a855f7' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Rosa', value: '#f43f5e' },
  { label: 'Índigo', value: '#6366f1' },
];

export const GmRosterBar: React.FC<GmRosterBarProps> = ({
  characters,
  activeCharacterId,
  onSelectCharacter,
  onAddCharacter,
  onRequestDeleteCharacter,
  isEditing: _isEditing,
  isGmView = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharUsername, setNewCharUsername] = useState('');
  const [newCharPassword, setNewCharPassword] = useState('1');
  const [newCharColor, setNewCharColor] = useState('#06b6d4');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    const finalUsername = newCharUsername.trim()
      ? newCharUsername.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
      : newCharName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    onAddCharacter(
      newCharName.trim(),
      '',
      newCharColor,
      finalUsername || `char_${Date.now()}`,
      newCharPassword || '1'
    );
    setNewCharName('');
    setNewCharUsername('');
    setNewCharPassword('1');
    setIsModalOpen(false);
  };

  const activeChar = characters.find((c) => c.id === activeCharacterId) || characters[0];

  return (
    <div className={`w-full backdrop-blur-xl px-4 py-2.5 relative z-20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-3 duration-200 border-b ${
      isGmView ? 'bg-[#08031a]/95 border-amber-500/25' : 'bg-[#050214]/95 border-violet-500/20'
    }`}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
            isGmView
              ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/10 border-amber-400/40 text-amber-300 shadow-amber-500/20'
              : 'bg-gradient-to-br from-violet-500/30 to-cyan-500/10 border-violet-400/40 text-violet-300 shadow-violet-500/20'
          }`}>
            <Crown size={17} className={isGmView ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]' : 'text-violet-300'} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black uppercase tracking-wider ${isGmView ? 'text-amber-300' : 'text-violet-300'}`}>
                {isGmView ? 'Painel do Mestre (GM)' : 'Personagens da Campanha'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isGmView ? 'bg-amber-400/15 border border-amber-400/30 text-amber-200' : 'bg-violet-400/15 border border-violet-400/30 text-violet-200'
              }`}>
                {characters.length} Ficha{characters.length !== 1 ? 's' : ''} no Servidor
              </span>
            </div>
            <p className="text-[11px] text-white/50 flex items-center gap-1">
              <HardDrive size={11} className={isGmView ? 'text-amber-400/70' : 'text-cyan-400/70'} />
              <span>Arquivos lidos do servidor /data/characters</span>
            </p>
          </div>
        </div>

        {/* Character Orbs / Bolinhas Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {characters.map((char) => {
            const isActive = char.id === activeCharacterId;
            const username = char.username || char.id.replace(/^char-/, '');
            const initial = username.charAt(0).toUpperCase();
            const color = char.color || '#a855f7';

            return (
              <div key={char.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCharacter(char.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                    isActive
                      ? isGmView
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#08031a] scale-105 shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                        : 'ring-2 ring-violet-400 ring-offset-2 ring-offset-[#08031a] scale-105 shadow-[0_0_16px_rgba(168,85,247,0.5)]'
                      : 'opacity-70 hover:opacity-100 hover:scale-105 ring-1 ring-white/20'
                  }`}
                  style={{
                    backgroundColor: char.avatarUrl ? 'transparent' : color,
                  }}
                  title={`Ficha de @${username}`}
                >
                  {char.avatarUrl ? (
                    <img
                      src={char.avatarUrl}
                      alt={username}
                      className="w-full h-full rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <span className="text-white text-xs font-black drop-shadow-sm">
                      {initial}
                    </span>
                  )}

                  {/* Active Pin Dot */}
                  {isActive && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#08031a] ${
                      isGmView ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-violet-400 shadow-[0_0_6px_#a855f7]'
                    }`} />
                  )}
                </button>

                {/* Tooltip on hover */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 bg-[#050110] border border-white/20 rounded-lg text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap text-center">
                  <div className="text-xs font-bold text-white">@{username}</div>
                  <div className="text-[10px] text-white/50">{char.name ? `${char.name} • ` : ''}{char.data?.identity?.origin || 'Aventureiro'}</div>
                  {isActive && <div className="text-[9px] text-emerald-400 font-bold">● Ativo na Tela</div>}
                </div>
              </div>
            );
          })}

          {/* Add Character Button Bolinha (Apenas GM pode adicionar novas fichas diretamente daqui) */}
          {isGmView && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-10 h-10 rounded-full border-2 border-dashed border-amber-400/40 hover:border-amber-400 bg-white/[0.02] hover:bg-amber-500/10 text-amber-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 shrink-0 shadow-sm"
              title="Criar Novo Arquivo de Ficha no Servidor"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Current Active Character Info & Actions */}
        {activeChar && (
          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10 justify-between sm:justify-start">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-white truncate max-w-[130px] flex items-center gap-1 justify-end">
                <span>@{activeChar.username || activeChar.id.replace(/^char-/, '')}</span>
              </div>
              <div className={`text-[10px] ${isGmView ? 'text-amber-300/80' : 'text-violet-300/80'}`}>
                {activeChar.name || activeChar.data?.identity?.origin || 'Personagem'}
              </div>
            </div>

            {/* Delete character button (Apenas visível para GM) */}
            {isGmView && characters.length > 1 && (
              <button
                type="button"
                onClick={() => onRequestDeleteCharacter(activeChar)}
                className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 flex items-center justify-center transition-colors cursor-pointer"
                title={`Apagar ficha de @${activeChar.username || activeChar.id.replace(/^char-/, '')} com a senha do GM`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal for adding character */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090518] border border-amber-400/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Crown size={16} className="text-amber-400" />
                <span>Novo Personagem</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-white/70 block mb-1 font-semibold">Nome do Personagem</label>
                <input
                  type="text"
                  required
                  placeholder="Vazio"
                  value={newCharName}
                  onChange={(e) => {
                    setNewCharName(e.target.value);
                    if (!newCharUsername) {
                      setNewCharUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Identificador / Login</label>
                  <div className="flex items-center bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 focus-within:border-amber-400">
                    <input
                      type="text"
                      placeholder="Vazio"
                      value={newCharUsername}
                      onChange={(e) => setNewCharUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="w-full bg-transparent text-amber-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Senha Inicial</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={newCharPassword}
                    onChange={(e) => setNewCharPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1 font-semibold">Cor da Bolinha</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setNewCharColor(p.value)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        newCharColor === p.value ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.value }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Criar Personagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
