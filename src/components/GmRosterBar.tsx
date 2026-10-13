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
  isEditing,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharUsername, setNewCharUsername] = useState('');
  const [newCharPassword, setNewCharPassword] = useState('123');
  const [newCharRole, setNewCharRole] = useState('Místico / Erudito');
  const [newCharColor, setNewCharColor] = useState('#06b6d4');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    const finalUsername = newCharUsername.trim()
      ? newCharUsername.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
      : newCharName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    onAddCharacter(
      newCharName.trim(),
      newCharRole,
      newCharColor,
      finalUsername || `char_${Date.now()}`,
      newCharPassword || '123'
    );
    setNewCharName('');
    setNewCharUsername('');
    setNewCharPassword('123');
    setIsModalOpen(false);
  };

  const activeChar = characters.find((c) => c.id === activeCharacterId) || characters[0];

  return (
    <div className="w-full bg-[#08031a]/95 backdrop-blur-xl border-b border-amber-500/25 px-4 py-3 relative z-20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-3 duration-200">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* GM Badge & Party Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
            <Crown size={17} className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Painel do Mestre (GM)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/15 border border-amber-400/30 text-amber-200 font-mono">
                {characters.length} Fichas no Disco
              </span>
            </div>
            <p className="text-[11px] text-white/50 flex items-center gap-1">
              <HardDrive size={11} className="text-amber-400/70" />
              <span>Conectado a <code className="text-amber-300 font-mono text-[10px]">data/gamemaster.json</code></span>
            </p>
          </div>
        </div>

        {/* Character Orbs / Bolinhas Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {characters.map((char) => {
            const isActive = char.id === activeCharacterId;
            const initial = char.name.charAt(0).toUpperCase() || 'P';
            const color = char.color || '#a855f7';
            const username = char.id.replace(/^char-/, '');

            return (
              <div key={char.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCharacter(char.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                    isActive
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#08031a] scale-105 shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                      : 'opacity-70 hover:opacity-100 hover:scale-105 ring-1 ring-white/20'
                  }`}
                  style={{
                    backgroundColor: char.avatarUrl ? 'transparent' : color,
                  }}
                  title={`Editar ficha de ${char.name} (${username}.json)`}
                >
                  {char.avatarUrl ? (
                    <img
                      src={char.avatarUrl}
                      alt={char.name}
                      className="w-full h-full rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <span className="text-white text-xs font-black drop-shadow-sm">
                      {initial}
                    </span>
                  )}

                  {/* Active Pin Dot */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#08031a] shadow-[0_0_6px_#f59e0b]" />
                  )}
                </button>

                {/* Tooltip on hover */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 bg-[#050110] border border-amber-400/40 rounded-lg text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap text-center">
                  <div className="text-xs font-bold text-amber-200">{char.name}</div>
                  <div className="text-[10px] text-amber-300/80 font-mono">{username}.json</div>
                  <div className="text-[10px] text-white/50">{char.data.identity?.origin || 'Aventureiro'}</div>
                  {isActive && <div className="text-[9px] text-emerald-400 font-bold">● Ativo no Painel</div>}
                </div>
              </div>
            );
          })}

          {/* Add Character Button Bolinha */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-10 h-10 rounded-full border-2 border-dashed border-amber-400/40 hover:border-amber-400 bg-white/[0.02] hover:bg-amber-500/10 text-amber-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 shrink-0 shadow-sm"
            title="Criar Novo Arquivo de Ficha no Disco"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Current Active Character Info & Actions */}
        {activeChar && (
          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10 justify-between sm:justify-start">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-white truncate max-w-[130px] flex items-center gap-1 justify-end">
                <span>{activeChar.name}</span>
              </div>
              <div className="text-[10px] text-amber-300/80 font-mono">
                {activeChar.id.replace(/^char-/, '')}.json
              </div>
            </div>

            {/* Delete character button (Requires GM password 'saidaquiburro') */}
            {characters.length > 1 && (
              <button
                type="button"
                onClick={() => onRequestDeleteCharacter(activeChar)}
                className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 flex items-center justify-center transition-colors cursor-pointer"
                title={`Apagar ${activeChar.name} (${activeChar.id.replace(/^char-/, '')}.json) do disco com a senha do GM`}
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
                <span>Nova Ficha no Disco (.json)</span>
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
                  placeholder="Ex: Valerius, Lyra, Kaelen..."
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
                  <label className="text-white/70 block mb-1 font-semibold">Nome do Arquivo</label>
                  <div className="flex items-center bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 focus-within:border-amber-400">
                    <input
                      type="text"
                      placeholder="username"
                      value={newCharUsername}
                      onChange={(e) => setNewCharUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="w-full bg-transparent text-amber-300 font-mono text-xs focus:outline-none"
                    />
                    <span className="text-white/40 font-mono text-[11px]">.json</span>
                  </div>
                </div>

                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Senha Inicial</label>
                  <input
                    type="text"
                    value={newCharPassword}
                    onChange={(e) => setNewCharPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1 font-semibold">Arquétipo / Origem</label>
                <input
                  type="text"
                  placeholder="Ex: Guerreiro Nobre, Místico do Caos..."
                  value={newCharRole}
                  onChange={(e) => setNewCharRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
                />
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
                  Criar Arquivo .json
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
