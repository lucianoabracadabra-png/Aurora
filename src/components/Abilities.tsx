import React, { useState } from 'react';
import { Ability } from '../types';
import { Plus, X } from 'lucide-react';

type Props = {
  data: Ability[];
  add: (ability: Omit<Ability, 'id'>) => void;
  remove: (id: string) => void;
  readonly?: boolean;
};

export const Abilities: React.FC<Props> = ({ data, add, remove, readonly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newAbility, setNewAbility] = useState({ name: '', description: '', mechanic: '', cost: '' });
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);

  const handleAdd = () => {
    if (!newAbility.name) return;
    add(newAbility);
    setNewAbility({ name: '', description: '', mechanic: '', cost: '' });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {data.map((ability) => (
        <div 
          key={ability.id} 
          onClick={() => setSelectedAbility(ability)}
          className="relative bg-white/[0.01] border border-fuchsia-500/20 hover:border-fuchsia-500/50 rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 cursor-pointer"
        >
          {!readonly && (
            <button
              onClick={(e) => { e.stopPropagation(); remove(ability.id); }}
              className="absolute top-4 right-4 text-white/30 hover:text-white/80 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <h4 className="text-fuchsia-400 font-medium text-sm pr-6 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)] tracking-wide">{ability.name}</h4>
          {ability.cost && <span className="text-[10px] text-fuchsia-300 font-bold tracking-widest uppercase mt-1">Custo: {ability.cost}</span>}
          {ability.mechanic && <p className="text-xs text-white/70 mt-1"><span className="text-white/40 uppercase tracking-widest text-[10px] mr-2">Mecânica:</span> {ability.mechanic}</p>}
        </div>
      ))}

      {selectedAbility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setSelectedAbility(null)}>
          <div className="bg-[#050508] border border-fuchsia-500/30 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-[0_10px_40px_rgba(232,121,249,0.2)] overflow-hidden" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-fuchsia-300 text-lg drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]">{selectedAbility.name}</h3>
                {selectedAbility.cost && <span className="text-[10px] text-fuchsia-400/80 font-bold tracking-widest uppercase">Custo: {selectedAbility.cost}</span>}
              </div>
              <button 
                onClick={() => setSelectedAbility(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar flex flex-col gap-6">
              {selectedAbility.mechanic && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Mecânica</span>
                  <p className="text-sm text-white/80">{selectedAbility.mechanic}</p>
                </div>
              )}
              {selectedAbility.description && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Detalhes</span>
                  <p className="text-sm text-white/60 font-light leading-relaxed whitespace-pre-wrap">{selectedAbility.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!readonly && (
        isOpen ? (
          <div className="bg-white/[0.02] border border-fuchsia-500/30 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_20px_rgba(232,121,249,0.1)]">
            <input
              type="text"
              placeholder="NOME DA HABILIDADE"
              value={newAbility.name}
              onChange={(e) => setNewAbility({ ...newAbility, name: e.target.value })}
              className="bg-transparent border-b border-white/10 px-2 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20 placeholder:text-xs placeholder:tracking-widest"
            />
            <input
              type="text"
              placeholder="CUSTO (EX: 2 ANIMA)"
              value={newAbility.cost}
              onChange={(e) => setNewAbility({ ...newAbility, cost: e.target.value })}
              className="bg-transparent border-b border-white/10 px-2 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20 placeholder:text-xs placeholder:tracking-widest"
            />
            <input
              type="text"
              placeholder="MECÂNICA"
              value={newAbility.mechanic}
              onChange={(e) => setNewAbility({ ...newAbility, mechanic: e.target.value })}
              className="bg-transparent border-b border-white/10 px-2 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20 placeholder:text-xs placeholder:tracking-widest"
            />
            <textarea
              placeholder="DESCRIÇÃO"
              value={newAbility.description}
              onChange={(e) => setNewAbility({ ...newAbility, description: e.target.value })}
              className="bg-transparent border-b border-white/10 px-2 py-2 text-white/70 text-sm focus:outline-none focus:border-fuchsia-500 resize-none h-16 transition-colors placeholder:text-white/20 placeholder:text-[10px] placeholder:tracking-widest font-light"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAdd}
                className="flex-1 bg-fuchsia-500 text-white rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(232,121,249,0.4)] hover:bg-fuchsia-400 transition-colors"
              >
                Adicionar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-white/5 text-white/60 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white/[0.02] border border-white/10 border-dashed rounded-2xl py-4 text-fuchsia-400/50 hover:text-fuchsia-400 hover:border-fuchsia-400/50 transition-all duration-300 text-[10px] uppercase font-bold tracking-widest mt-2 hover:shadow-[0_0_15px_rgba(232,121,249,0.1)]"
          >
            <Plus size={14} /> Nova Habilidade
          </button>
        )
      )}
    </div>
  );
};
