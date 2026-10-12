import React, { useState } from 'react';
import { Ability } from '../types';
import { Plus, X, CheckCircle2, EyeOff, SlidersHorizontal, Zap, Trash2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

type Props = {
  data: Ability[];
  add: (ability: Omit<Ability, 'id'>) => void;
  remove: (id: string) => void;
  toggleSelect: (id: string) => void;
  readonly?: boolean;
};

export const Abilities: React.FC<Props> = ({ 
  data, 
  add, 
  remove, 
  toggleSelect,
  readonly = false 
}) => {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [newAbility, setNewAbility] = useState({ name: '', description: '', mechanic: '', cost: '' });
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    if (!newAbility.name) return;
    add({
      ...newAbility,
      selected: true
    });
    setNewAbility({ name: '', description: '', mechanic: '', cost: '' });
    setIsAddingOpen(false);
  };

  // Filter abilities that should appear on the profile card (selected !== false)
  const profileAbilities = data.filter(a => a.selected !== false);

  const filteredManagerAbilities = data.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      (a.mechanic && a.mechanic.toLowerCase().includes(term)) ||
      (a.cost && a.cost.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Control Bar: Summary and Manager Modal trigger */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-2.5 px-3.5 text-xs">
        <span className="text-white/60 font-medium">
          Exibindo <strong className="text-fuchsia-300 font-bold font-mono">{profileAbilities.length}</strong> de <span className="font-mono text-white/50">{data.length}</span> habilidades
        </span>
        <button
          type="button"
          onClick={() => setIsManagerOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 text-fuchsia-300 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(232,121,249,0.15)]"
        >
          <SlidersHorizontal size={12} />
          <span>Selecionar Habilidades</span>
        </button>
      </div>

      {/* Main Profile View: Displays selected abilities */}
      {profileAbilities.length > 0 ? (
        <div className="flex flex-col gap-3">
          {profileAbilities.map((ability) => (
            <div 
              key={ability.id} 
              onClick={() => setSelectedAbility(ability)}
              className="relative bg-white/[0.015] border border-fuchsia-500/20 hover:border-fuchsia-500/50 rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-[0_0_15px_rgba(232,121,249,0.1)]"
            >
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    toggleSelect(ability.id); 
                  }}
                  className="absolute top-4 right-4 text-white/30 hover:text-rose-400 transition-colors cursor-pointer p-1"
                  title="Ocultar do perfil"
                >
                  <EyeOff size={14} />
                </button>
              )}
              <h4 className="text-fuchsia-400 font-medium text-sm pr-8 drop-shadow-[0_0_8px_rgba(232,121,249,0.4)] tracking-wide group-hover:text-fuchsia-300 transition-colors">
                {ability.name}
              </h4>
              {ability.cost && (
                <span className="text-[10px] text-fuchsia-300/90 font-bold tracking-widest uppercase mt-0.5">
                  Custo: {ability.cost}
                </span>
              )}
              {ability.mechanic && (
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  <span className="text-white/40 uppercase tracking-widest text-[10px] mr-2 font-semibold">Mecânica:</span> 
                  {ability.mechanic}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div 
          onClick={() => setIsManagerOpen(true)}
          className="p-8 border border-white/10 border-dashed rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer hover:bg-white/[0.03] hover:border-fuchsia-500/30 transition-all group"
        >
          <Zap size={24} className="text-fuchsia-400/40 group-hover:text-fuchsia-400 transition-colors" />
          <p className="text-xs text-white/60 font-medium">
            Nenhuma habilidade selecionada para exibição no perfil.
          </p>
          <span className="text-[10px] uppercase font-bold tracking-wider text-fuchsia-300 bg-fuchsia-500/15 px-3 py-1 rounded-lg border border-fuchsia-500/30">
            Clique para selecionar habilidades
          </span>
        </div>
      )}

      {/* Special Ability Detail Modal */}
      {selectedAbility && (
        <Modal
          isOpen={!!selectedAbility}
          onClose={() => setSelectedAbility(null)}
          title={selectedAbility.name}
          subtitle={selectedAbility.cost ? `Custo: ${selectedAbility.cost}` : undefined}
          icon={<Zap size={20} />}
          theme="amber"
          maxWidth="md"
        >
          <div className="flex flex-col gap-5">
            {selectedAbility.mechanic && (
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-amber-400/80 uppercase tracking-widest font-bold">Mecânica de Jogo</span>
                <p className="text-sm text-white/90 leading-relaxed">{selectedAbility.mechanic}</p>
              </div>
            )}
            {selectedAbility.description && (
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Detalhes & Lore</span>
                <p className="text-sm text-white/70 font-light leading-relaxed whitespace-pre-wrap">{selectedAbility.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Special Abilities Selector & Manager Panel Modal */}
      <Modal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        title="Painel de Habilidades Especiais"
        subtitle="Clique em uma habilidade para ativar (✓) ou ocultar (👁) sua aparição no perfil"
        icon={<Zap size={20} />}
        theme="violet"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-white/40">
              {profileAbilities.length} de {data.length} selecionadas para o perfil
            </span>
            <Button
              theme="violet"
              size="sm"
              onClick={() => setIsManagerOpen(false)}
            >
              Concluído
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Header Controls & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5">
            <input
              type="text"
              placeholder="Buscar habilidade por nome, mecânica ou custo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-fuchsia-500/50"
            />

            {!readonly && (
              <button
                type="button"
                onClick={() => setIsAddingOpen(!isAddingOpen)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-[0_0_12px_rgba(232,121,249,0.3)]"
              >
                <Plus size={14} />
                <span>Nova Habilidade</span>
              </button>
            )}
          </div>

          {/* Form to Create New Ability */}
          {isAddingOpen && !readonly && (
            <div className="bg-fuchsia-950/20 border border-fuchsia-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_0_20px_rgba(232,121,249,0.15)] animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">Cadastrar Nova Habilidade</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="NOME DA HABILIDADE"
                  value={newAbility.name}
                  onChange={(e) => setNewAbility({ ...newAbility, name: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20"
                />
                <input
                  type="text"
                  placeholder="CUSTO (EX: 2 ANIMA)"
                  value={newAbility.cost}
                  onChange={(e) => setNewAbility({ ...newAbility, cost: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20"
                />
              </div>

              <input
                type="text"
                placeholder="MECÂNICA (EFEITO EM REGRAS)"
                value={newAbility.mechanic}
                onChange={(e) => setNewAbility({ ...newAbility, mechanic: e.target.value })}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20"
              />

              <textarea
                placeholder="DESCRIÇÃO DETALHADA OU HISTÓRICO"
                value={newAbility.description}
                onChange={(e) => setNewAbility({ ...newAbility, description: e.target.value })}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-xs focus:outline-none focus:border-fuchsia-500 resize-none h-16 transition-colors placeholder:text-white/20 font-light"
              />

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_12px_rgba(232,121,249,0.3)]"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* List of ALL Abilities in Manager Panel with Toggle Click Selection */}
          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {filteredManagerAbilities.length > 0 ? (
              filteredManagerAbilities.map((ability) => {
                const isSelected = ability.selected !== false;

                return (
                  <div
                    key={ability.id}
                    onClick={() => toggleSelect(ability.id)}
                    className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-fuchsia-950/20 border-fuchsia-400/60 shadow-[0_0_15px_rgba(232,121,249,0.15)]'
                        : 'bg-white/[0.01] border-white/10 hover:border-white/25 text-white/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-col gap-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm tracking-wide ${
                          isSelected ? 'text-fuchsia-300 drop-shadow-[0_0_6px_rgba(232,121,249,0.4)]' : 'text-white/70'
                        }`}>
                          {ability.name}
                        </h4>
                        {ability.cost && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-fuchsia-300">
                            {ability.cost}
                          </span>
                        )}
                      </div>

                      {ability.mechanic && (
                        <p className="text-xs text-white/65 leading-relaxed">
                          <span className="text-white/30 uppercase text-[9px] mr-1 font-semibold">Mecânica:</span>
                          {ability.mechanic}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Selection Toggle Badge */}
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-fuchsia-500/25 border-fuchsia-400/60 text-fuchsia-200 shadow-[0_0_10px_rgba(232,121,249,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}>
                        {isSelected ? <CheckCircle2 size={14} className="text-fuchsia-400" /> : <EyeOff size={14} />}
                        <span className="text-[10px] uppercase tracking-wider">
                          {isSelected ? 'No Perfil' : 'Oculta'}
                        </span>
                      </div>

                      {/* Remove Button in Edit Mode */}
                      {!readonly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(ability.id);
                          }}
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Excluir habilidade definitivamente"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-white/40 text-xs">
                Nenhuma habilidade encontrada para "{searchTerm}".
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
