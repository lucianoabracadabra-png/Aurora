import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trait } from '../types';
import { Plus, X, Sparkles, AlertTriangle, ShieldCheck, Trash2, Edit3, Check } from 'lucide-react';

type Props = {
  data: Trait[];
  add: (trait: Omit<Trait, 'id'>) => void;
  update?: (trait: Trait) => void;
  remove: (id: string) => void;
  readonly?: boolean;
};

export const Traits: React.FC<Props> = ({ data, add, update, remove, readonly = false }) => {
  // Modal de Detalhes / Edição de Traço
  const [selectedTrait, setSelectedTrait] = useState<Trait | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingValue, setEditingValue] = useState<number>(1);
  const [editingDesc, setEditingDesc] = useState('');
  const [editingType, setEditingType] = useState<'advantage' | 'disadvantage'>('advantage');

  // Modal de Criação de Novo Traço
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState<number>(1);
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'advantage' | 'disadvantage'>('advantage');

  const advantages = data.filter(t => t.type === 'advantage');
  const disadvantages = data.filter(t => t.type === 'disadvantage');

  const handleOpenDetailModal = (trait: Trait) => {
    setSelectedTrait(trait);
    setEditingTitle(trait.name);
    setEditingValue(trait.value);
    setEditingDesc(trait.description || '');
    setEditingType(trait.type);
  };

  const handleCloseDetailModal = () => {
    setSelectedTrait(null);
  };

  const handleSaveTraitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrait || !editingTitle.trim()) return;

    if (update) {
      update({
        ...selectedTrait,
        name: editingTitle.trim(),
        value: Number(editingValue) || 1,
        description: editingDesc.trim(),
        type: editingType
      });
    }
    handleCloseDetailModal();
  };

  const handleDeleteFromModal = () => {
    if (!selectedTrait) return;
    remove(selectedTrait.id);
    handleCloseDetailModal();
  };

  const handleCreateNewTrait = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    add({
      name: newTitle.trim(),
      type: newType,
      value: Math.max(1, Number(newValue) || 1),
      description: newDesc.trim()
    });

    setNewTitle('');
    setNewValue(1);
    setNewDesc('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Coluna de Vantagens */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <h3 className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest drop-shadow-[0_0_8px_currentColor]">
              Vantagens
            </h3>
            <span className="text-[9px] font-mono text-emerald-400/60 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              {advantages.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {advantages.map((trait) => (
              <div
                key={trait.id}
                onClick={() => handleOpenDetailModal(trait)}
                className="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/[0.015] border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] select-none"
                title="Clique para ver os detalhes completos"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-semibold tracking-wide text-xs text-emerald-300 group-hover:text-emerald-200 transition-colors truncate">
                    {trait.name}
                  </span>
                  {trait.description && (
                    <span className="text-[10px] text-white/40 truncate font-light mt-0.5">
                      {trait.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    +{trait.value}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(trait.id);
                      }}
                      className="text-white/20 hover:text-rose-400 transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
                      title="Excluir"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {advantages.length === 0 && (
              <p className="text-center text-[10px] uppercase tracking-widest text-white/20 py-4 bg-white/[0.01] rounded-2xl border border-white/5">
                Nenhuma
              </p>
            )}
          </div>
        </div>

        {/* Coluna de Desvantagens */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
            <h3 className="text-[10px] text-rose-400 font-bold uppercase tracking-widest drop-shadow-[0_0_8px_currentColor]">
              Desvantagens
            </h3>
            <span className="text-[9px] font-mono text-rose-400/60 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
              {disadvantages.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {disadvantages.map((trait) => (
              <div
                key={trait.id}
                onClick={() => handleOpenDetailModal(trait)}
                className="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/[0.015] border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] select-none"
                title="Clique para ver os detalhes completos"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-semibold tracking-wide text-xs text-rose-300 group-hover:text-rose-200 transition-colors truncate">
                    {trait.name}
                  </span>
                  {trait.description && (
                    <span className="text-[10px] text-white/40 truncate font-light mt-0.5">
                      {trait.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-500/30">
                    -{trait.value}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(trait.id);
                      }}
                      className="text-white/20 hover:text-rose-400 transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
                      title="Excluir"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {disadvantages.length === 0 && (
              <p className="text-center text-[10px] uppercase tracking-widest text-white/20 py-4 bg-white/[0.01] rounded-2xl border border-white/5">
                Nenhuma
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botão para Criar Novo Traço */}
      {!readonly && (
        <button
          type="button"
          onClick={() => {
            setNewTitle('');
            setNewValue(1);
            setNewDesc('');
            setNewType('advantage');
            setIsCreating(true);
          }}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.02] border border-white/10 border-dashed rounded-2xl py-3.5 text-violet-400/60 hover:text-violet-300 hover:border-violet-400/50 hover:bg-violet-500/5 transition-all duration-300 text-xs uppercase font-bold tracking-widest cursor-pointer shadow-sm"
        >
          <Plus size={15} />
          <span>Novo Traço (Vantagem ou Desvantagem)</span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DETALHES / VISUALIZAÇÃO / EDIÇÃO DO TRAÇO SELECIONADO            */}
      {/* ========================================================================= */}
      {selectedTrait && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={handleCloseDetailModal}
        >
          <div
            className="bg-[#0b0816]/95 border border-white/15 rounded-[2rem] max-w-lg w-full p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col gap-4 text-xs animate-in fade-in zoom-in-95 duration-200 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                {editingType === 'advantage' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                    <Sparkles size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                    <AlertTriangle size={16} />
                  </div>
                )}
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    editingType === 'advantage' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {editingType === 'advantage' ? 'Vantagem' : 'Desvantagem'}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    Detalhes do Traço
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corpo do Modal: Título, Valor e Caixa de Detalhes */}
            {!readonly ? (
              /* MODO EDIÇÃO */
              <form onSubmit={handleSaveTraitEdit} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingType('advantage')}
                    className={`flex-1 py-2 text-[10px] rounded-xl border uppercase tracking-widest transition-all font-bold cursor-pointer ${
                      editingType === 'advantage'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    Vantagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingType('disadvantage')}
                    className={`flex-1 py-2 text-[10px] rounded-xl border uppercase tracking-widest transition-all font-bold cursor-pointer ${
                      editingType === 'disadvantage'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    Desvantagem
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                      Título do Traço *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Ex: Sentidos Aguçados, Código de Honra..."
                      className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-violet-500/60"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                      Valor (Pontos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingValue}
                      onChange={(e) => setEditingValue(Math.max(1, Number(e.target.value) || 1))}
                      className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-center font-mono font-bold text-xs text-amber-300 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                    Caixa de Detalhes / Regras / Descrição
                  </label>
                  <textarea
                    rows={4}
                    value={editingDesc}
                    onChange={(e) => setEditingDesc(e.target.value)}
                    placeholder="Descreva as regras mecânicas, bônus, penalidades, antecedentes ou notas interpretativas..."
                    className="bg-black/50 border border-white/10 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleDeleteFromModal}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseDetailModal}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(167,139,250,0.3)] cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* MODO LEITURA (GAME MODE) */
              <div className="flex flex-col gap-4">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Título:</span>
                    <h3 className={`text-base font-bold mt-0.5 ${
                      editingType === 'advantage' ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                    }`}>
                      {editingTitle}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Valor:</span>
                    <span className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded-lg border mt-0.5 ${
                      editingType === 'advantage'
                        ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30'
                        : 'text-rose-300 bg-rose-950/60 border-rose-500/30'
                    }`}>
                      {editingType === 'advantage' ? `+${editingValue}` : `-${editingValue}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                    Caixa de Detalhes:
                  </span>
                  <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed font-light whitespace-pre-wrap min-h-[90px] shadow-inner">
                    {editingDesc ? editingDesc : <span className="text-white/30 italic">Sem descrição adicional registrada para este traço.</span>}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCloseDetailModal}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CRIAR NOVO TRAÇO (VANTAGEM OU DESVANTAGEM)                       */}
      {/* ========================================================================= */}
      {isCreating && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsCreating(false)}
        >
          <div
            className="bg-[#0b0816]/95 border border-white/15 rounded-[2rem] max-w-lg w-full p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col gap-4 text-xs animate-in fade-in zoom-in-95 duration-200 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <Plus size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Novo Registro</span>
                  <h4 className="text-sm font-bold text-white leading-tight">Adicionar Vantagem ou Desvantagem</h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTrait} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('advantage')}
                  className={`flex-1 py-2 text-[10px] rounded-xl border uppercase tracking-widest transition-all font-bold cursor-pointer ${
                    newType === 'advantage'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  Vantagem
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('disadvantage')}
                  className={`flex-1 py-2 text-[10px] rounded-xl border uppercase tracking-widest transition-all font-bold cursor-pointer ${
                    newType === 'disadvantage'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  Desvantagem
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                    Título do Traço *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Sentidos Aguçados, Código de Honra..."
                    className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-slate-100 text-xs focus:outline-none focus:border-violet-500/60"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                    Valor (Pontos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newValue}
                    onChange={(e) => setNewValue(Math.max(1, Number(e.target.value) || 1))}
                    className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-center font-mono font-bold text-xs text-amber-300 focus:outline-none focus:border-violet-500/60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                  Caixa de Detalhes / Regras / Descrição
                </label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Descreva as regras mecânicas, bônus, penalidades, antecedentes ou notas interpretativas..."
                  className="bg-black/50 border border-white/10 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(167,139,250,0.3)] cursor-pointer"
                >
                  Criar Traço
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
