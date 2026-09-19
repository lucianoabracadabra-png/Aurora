import React, { useState } from 'react';
import { Trait } from '../types';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
  data: Trait[];
  add: (trait: Omit<Trait, 'id'>) => void;
  remove: (id: string) => void;
  readonly?: boolean;
};

const TraitItem: React.FC<{ trait: Trait, remove: (id: string) => void, readonly: boolean }> = ({ trait, remove, readonly }) => {
  const [expanded, setExpanded] = useState(false);
  const colorClass = trait.type === 'advantage' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]';
  const borderClass = trait.type === 'advantage' ? 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/5';
  
  return (
    <div className={`flex flex-col bg-white/[0.01] border ${borderClass} rounded-2xl overflow-hidden transition-all duration-300`}>
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col">
          <span className={`font-medium tracking-wide text-sm ${colorClass}`}>{trait.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/80 font-bold">{trait.value}</span>
          {!readonly && (
            <button
              onClick={(e) => { e.stopPropagation(); remove(trait.id); }}
              className="text-white/30 hover:text-white/80 transition-colors p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      {expanded && trait.description && (
        <div className="p-3 border-t border-white/5 bg-black/20 text-xs text-white/50 font-light leading-relaxed">
          {trait.description}
        </div>
      )}
    </div>
  );
};

export const Traits: React.FC<Props> = ({ data, add, remove, readonly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTrait, setNewTrait] = useState<{ name: string; type: 'advantage' | 'disadvantage'; description: string; value: number }>({
    name: '',
    type: 'advantage',
    description: '',
    value: 1,
  });

  const advantages = data.filter(t => t.type === 'advantage');
  const disadvantages = data.filter(t => t.type === 'disadvantage');

  const handleAdd = () => {
    if (!newTrait.name) return;
    add(newTrait);
    setNewTrait({ name: '', type: 'advantage', description: '', value: 1 });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Vantagens */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest text-center border-b border-emerald-500/20 pb-2 drop-shadow-[0_0_8px_currentColor]">Vantagens</h3>
          {advantages.map((trait) => (
            <TraitItem key={trait.id} trait={trait} remove={remove} readonly={readonly} />
          ))}
          {advantages.length === 0 && <p className="text-center text-[10px] uppercase tracking-widest text-white/20 py-2">Nenhuma</p>}
        </div>

        {/* Desvantagens */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] text-rose-400 font-bold uppercase tracking-widest text-center border-b border-rose-500/20 pb-2 drop-shadow-[0_0_8px_currentColor]">Desvantagens</h3>
          {disadvantages.map((trait) => (
            <TraitItem key={trait.id} trait={trait} remove={remove} readonly={readonly} />
          ))}
          {disadvantages.length === 0 && <p className="text-center text-[10px] uppercase tracking-widest text-white/20 py-2">Nenhuma</p>}
        </div>
      </div>

      {!readonly && (
        isOpen ? (
          <div className="bg-white/[0.02] border border-violet-500/30 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_20px_rgba(167,139,250,0.1)]">
            <div className="flex gap-2">
              <button
                onClick={() => setNewTrait({ ...newTrait, type: 'advantage' })}
                className={`flex-1 py-2 text-[10px] rounded-xl border uppercase tracking-widest transition-all ${
                  newTrait.type === 'advantage'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}
              >
                Vantagem
              </button>
              <button
                onClick={() => setNewTrait({ ...newTrait, type: 'disadvantage' })}
                className={`flex-1 py-2 text-[10px] rounded-xl border uppercase tracking-widest transition-all ${
                  newTrait.type === 'disadvantage'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}
              >
                Desvantagem
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="NOME"
                value={newTrait.name}
                onChange={(e) => setNewTrait({ ...newTrait, name: e.target.value })}
                className="flex-[3] bg-transparent border-b border-white/10 px-2 py-2 text-white text-sm focus:outline-none focus:border-violet-500 min-w-0 transition-colors placeholder:text-white/20 placeholder:text-xs placeholder:tracking-widest"
              />
              <input
                type="number"
                placeholder="VALOR"
                min="1"
                value={newTrait.value}
                onChange={(e) => setNewTrait({ ...newTrait, value: Number(e.target.value) })}
                className="flex-1 bg-transparent border-b border-white/10 px-2 py-2 text-white text-sm focus:outline-none focus:border-violet-500 min-w-0 text-center transition-colors placeholder:text-white/20 placeholder:text-xs placeholder:tracking-widest"
              />
            </div>
            <textarea
              placeholder="DESCRIÇÃO (OPCIONAL)"
              value={newTrait.description}
              onChange={(e) => setNewTrait({ ...newTrait, description: e.target.value })}
              className="bg-transparent border-b border-white/10 px-2 py-2 text-white/70 text-sm focus:outline-none focus:border-violet-500 resize-none h-16 transition-colors placeholder:text-white/20 placeholder:text-[10px] placeholder:tracking-widest font-light"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAdd}
                className="flex-1 bg-violet-500 text-white rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(167,139,250,0.4)] hover:bg-violet-400 transition-colors"
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
            className="w-full flex items-center justify-center gap-2 bg-white/[0.02] border border-white/10 border-dashed rounded-2xl py-4 text-violet-400/50 hover:text-violet-400 hover:border-violet-400/50 transition-all duration-300 text-[10px] uppercase font-bold tracking-widest mt-2 hover:shadow-[0_0_15px_rgba(167,139,250,0.1)]"
          >
            <Plus size={14} /> Novo Traço
          </button>
        )
      )}
    </div>
  );
};
