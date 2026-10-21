import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Sparkles, 
  Calculator, 
  Table, 
  CheckCircle2, 
  Layers, 
  Coins, 
  Flame, 
  Target,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Search,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { CharacterData, FocusLevel, FocusDistributionType, FocusConfig } from '../types';
import { 
  FOCUS_LABELS, 
  FOCUS_PRESETS, 
  ATRIBUTOS_COST_TABLE, 
  PERICIAS_COST_TABLE,
  getDetailedSheetExpBreakdown,
  normalizeFocusLevel
} from '../utils/expCalculations';

interface FocusExpModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterData: CharacterData;
  onUpdateFocusConfig: (newConfig: FocusConfig) => void;
  onUpdateExpBudget: (newBudget: { initial: number; campaign: number }) => void;
  readonly?: boolean;
}

export const FocusExpModal: React.FC<FocusExpModalProps> = ({
  isOpen,
  onClose,
  characterData,
  onUpdateFocusConfig,
  onUpdateExpBudget,
  readonly = false,
}) => {
  // Tab 1: Tree-View de EXP | Tab 2: Matriz de Custos & Focos
  const [activeTab, setActiveTab] = useState<'treeView' | 'costMatrix'>('treeView');
  
  // Modo de visualização da árvore: Por Categoria (Atributos, Perícias, Fixos) ou Por Eixo
  const [treeGrouping, setTreeGrouping] = useState<'byCategory' | 'byAxis'>('byCategory');

  // Controle de colapso do Tree-View
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [treeSearch, setTreeSearch] = useState('');

  // Tabela selecionada na Matriz de Custos (Atributos ou Perícias)
  const [costTableTab, setCostTableTab] = useState<'atributos' | 'pericias'>('atributos');

  const currentFocus: FocusConfig = {
    distribution: characterData.focusConfig?.distribution || 'padrao',
    physical: normalizeFocusLevel(characterData.focusConfig?.physical || 'F1'),
    mental: normalizeFocusLevel(characterData.focusConfig?.mental || 'F2'),
    social: normalizeFocusLevel(characterData.focusConfig?.social || 'SF'),
  };

  const expBudget = characterData.expBudget || {
    initial: 300,
    campaign: 0,
  };

  // Árvore hierárquica detalhada de EXP
  const treeBreakdown = useMemo(() => {
    return getDetailedSheetExpBreakdown(characterData);
  }, [characterData]);

  const activeSections = useMemo(() => {
    return treeGrouping === 'byCategory' 
      ? treeBreakdown.sectionsByCategory 
      : treeBreakdown.sectionsByAxis;
  }, [treeGrouping, treeBreakdown]);

  const totalBudget = (expBudget.initial || 0) + (expBudget.campaign || 0);
  const remainingExp = totalBudget - treeBreakdown.totalSpent;

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const expandAll = () => {
    setCollapsedNodes({});
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    activeSections.forEach(sec => {
      next[sec.id] = true;
      sec.subgroups.forEach(sub => {
        next[sub.id] = true;
      });
    });
    setCollapsedNodes(next);
  };

  // Handler para trocar distribuição pré-definida
  const handleSelectPreset = (dist: FocusDistributionType) => {
    if (readonly) return;
    if (dist === 'padrao') {
      onUpdateFocusConfig({
        distribution: 'padrao',
        physical: 'F1',
        mental: 'F2',
        social: 'SF',
      });
    } else if (dist === 'especializada') {
      onUpdateFocusConfig({
        distribution: 'especializada',
        physical: 'FE',
        mental: 'SF',
        social: 'SF',
      });
    } else if (dist === 'generalista') {
      onUpdateFocusConfig({
        distribution: 'generalista',
        physical: 'F2',
        mental: 'F2',
        social: 'F2',
      });
    }
  };

  // Handler para alterar foco de um grupo específico mantendo regras de validação
  const handleChangeGroupFocus = (group: 'physical' | 'mental' | 'social', newFocus: FocusLevel) => {
    if (readonly) return;
    const current = { ...currentFocus };

    if (current.distribution === 'padrao') {
      // Padrão exige exatamente F1, F2 e SF distribuídos entre os 3 grupos
      const allowed: FocusLevel[] = ['F1', 'F2', 'SF'];
      if (!allowed.includes(newFocus)) return;

      const otherGroups = (['physical', 'mental', 'social'] as const).filter(g => g !== group);
      const remainingPicks = allowed.filter(f => f !== newFocus);

      current[group] = newFocus;
      current[otherGroups[0]] = remainingPicks[0];
      current[otherGroups[1]] = remainingPicks[1];
    } else if (current.distribution === 'especializada') {
      // Especializada exige 1 FE e 2 SF
      if (newFocus === 'FE') {
        current.physical = 'SF';
        current.mental = 'SF';
        current.social = 'SF';
        current[group] = 'FE';
      }
    } else if (current.distribution === 'generalista') {
      // Generalista exige todos F2
      current.physical = 'F2';
      current.mental = 'F2';
      current.social = 'F2';
    }

    onUpdateFocusConfig(current);
  };

  // Helper de badge para cada Foco (com ícones para FE, F1, F2 e limpo sem ícone para SF)
  const renderFocusBadge = (focus: FocusLevel, size: 'sm' | 'md' = 'sm') => {
    if (focus === 'FE') {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-bold rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)] ${
          size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
        }`}>
          <Flame size={size === 'sm' ? 10 : 12} className="text-amber-400 stroke-[2.5]" />
          <span>FE</span>
        </span>
      );
    }
    if (focus === 'F1') {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-bold rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.25)] ${
          size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
        }`}>
          <Target size={size === 'sm' ? 10 : 12} className="text-emerald-400 stroke-[2.5]" />
          <span>F1</span>
        </span>
      );
    }
    if (focus === 'F2') {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-bold rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)] ${
          size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
        }`}>
          <Compass size={size === 'sm' ? 10 : 12} className="text-cyan-400 stroke-[2.5]" />
          <span>F2</span>
        </span>
      );
    }
    if (focus === 'SF') {
      return (
        <span className={`inline-flex items-center font-mono font-bold rounded-full bg-white/5 border border-white/20 text-white/70 ${
          size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
        }`}>
          <span>SF</span>
        </span>
      );
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calculadora de EXP & Matriz de Focos"
      subtitle="Auditoria hierárquica em Tree-View, matrizes de custo oficiais e alocação de aptidão"
      icon={<Calculator size={20} />}
      theme="violet"
      maxWidth="4xl"
      className="h-[92vh] max-h-[920px] flex flex-col"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/40">Total de EXP Gasto:</span>
            <strong className="text-cyan-300 font-mono text-sm">{treeBreakdown.totalSpent} EXP</strong>
            <span className="text-white/20">|</span>
            <span className="text-white/40">Saldo Restante:</span>
            <strong className={`font-mono text-sm ${remainingExp < 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
              {remainingExp} EXP
            </strong>
          </div>
          <Button theme="violet" size="sm" onClick={onClose}>
            Concluir
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 min-h-[500px]">
        {/* Toggle das Duas Telas Principais */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('treeView')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'treeView'
                ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={15} />
            <span>1. Tree-View de EXP & Seções</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('costMatrix')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'costMatrix'
                ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(232,121,249,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Table size={15} />
            <span>2. Matriz de Custos & Legenda de Focos</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TELA 1: TREE-VIEW DE EXP POR SEÇÕES                                       */}
        {/* ========================================================================= */}
        {activeTab === 'treeView' && (
          <div className="flex flex-col flex-1 min-h-0 gap-3.5 animate-in fade-in duration-200">
            {/* Banner de Orçamento dos Bancos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 border border-white/10 rounded-2xl p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                  Banco Inicial (Criação)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-bold text-white">
                    {expBudget.initial} EXP
                  </span>
                  {!readonly && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateExpBudget({ ...expBudget, initial: Math.max(0, expBudget.initial - 50) })}
                        className="w-4 h-4 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center cursor-pointer text-[10px]"
                        title="Diminuir 50 EXP"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateExpBudget({ ...expBudget, initial: expBudget.initial + 50 })}
                        className="w-4 h-4 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center cursor-pointer text-[10px]"
                        title="Aumentar 50 EXP"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                  Banco de Campanha (Mestre)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-bold text-amber-300">
                    +{expBudget.campaign} EXP
                  </span>
                  {!readonly && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateExpBudget({ ...expBudget, campaign: Math.max(0, expBudget.campaign - 10) })}
                        className="w-4 h-4 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center cursor-pointer text-[10px]"
                        title="Diminuir 10 EXP"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateExpBudget({ ...expBudget, campaign: expBudget.campaign + 10 })}
                        className="w-4 h-4 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center cursor-pointer text-[10px]"
                        title="Aumentar 10 EXP"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                  Total Gasto na Ficha
                </span>
                <span className="font-mono text-sm font-bold text-cyan-300">
                  {treeBreakdown.totalSpent} EXP
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                  Saldo Restante
                </span>
                <span className={`font-mono text-sm font-extrabold ${remainingExp < 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {remainingExp >= 0 ? `+${remainingExp}` : remainingExp} EXP
                </span>
              </div>
            </div>

            {/* Barra de Ações & Filtro da Árvore */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Filtrar por atributo, perícia ou termo..."
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>

                <div className="flex items-center rounded-xl bg-black/50 border border-white/10 p-0.5 text-[11px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setTreeGrouping('byCategory')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      treeGrouping === 'byCategory'
                        ? 'bg-violet-600 text-white font-bold shadow-xs'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title="Agrupar por Atributos, Perícias e Especial & Fixos"
                  >
                    Por Categoria
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreeGrouping('byAxis')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      treeGrouping === 'byAxis'
                        ? 'bg-violet-600 text-white font-bold shadow-xs'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title="Agrupar por Eixo Físico, Mental e Social"
                  >
                    Por Eixo
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                  title="Expandir todos os ramos"
                >
                  <Maximize2 size={12} />
                  <span>Expandir</span>
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                  title="Recolher todos os ramos"
                >
                  <Minimize2 size={12} />
                  <span>Recolher</span>
                </button>
              </div>
            </div>

            {/* Tree-View Hierárquico Interativo */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2.5 custom-scrollbar">
              {activeSections.map((section) => {
                const isSectionCollapsed = !!collapsedNodes[section.id];
                const sectionPercent = treeBreakdown.totalSpent > 0 
                  ? Math.round((section.totalExp / treeBreakdown.totalSpent) * 100) 
                  : 0;

                // Filtro de busca
                const filteredSubgroups = section.subgroups.map(sub => ({
                  ...sub,
                  items: sub.items.filter(it => 
                    !treeSearch || 
                    it.name.toLowerCase().includes(treeSearch.toLowerCase()) ||
                    section.title.toLowerCase().includes(treeSearch.toLowerCase()) ||
                    sub.title.toLowerCase().includes(treeSearch.toLowerCase())
                  )
                })).filter(sub => sub.items.length > 0);

                if (treeSearch && filteredSubgroups.length === 0) return null;

                const themeColors = {
                  rose: 'border-rose-500/30 bg-rose-950/20 text-rose-300',
                  cyan: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
                  emerald: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
                  amber: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
                  violet: 'border-violet-500/30 bg-violet-950/20 text-violet-300',
                };

                return (
                  <div 
                    key={section.id}
                    className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden shadow-xs"
                  >
                    {/* Cabeçalho da Seção (Nível 1 da Árvore) */}
                    <div 
                      onClick={() => toggleNode(section.id)}
                      className="p-3 flex items-center justify-between gap-2 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer select-none transition-colors border-b border-white/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button type="button" className="text-white/40 hover:text-white p-0.5">
                          {isSectionCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <FolderOpen size={16} className={themeColors[section.theme].split(' ')[2]} />
                        <span className="font-bold text-xs text-white uppercase tracking-wider truncate">
                          {section.title}
                        </span>
                        {section.focus && renderFocusBadge(section.focus)}
                        <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
                          ({section.itemCount} itens)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
                          ({sectionPercent}% do total)
                        </span>
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300">
                          {section.totalExp} EXP
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo Expansível da Seção */}
                    {!isSectionCollapsed && (
                      <div className="p-2 sm:p-3 flex flex-col gap-2.5">
                        {filteredSubgroups.map((subgroup) => {
                          const isSubCollapsed = !!collapsedNodes[subgroup.id];
                          const subThemeClass = subgroup.theme 
                            ? themeColors[subgroup.theme].split(' ')[2] 
                            : 'text-white/40';

                          return (
                            <div 
                              key={subgroup.id}
                              className="border border-white/5 rounded-xl bg-black/30 overflow-hidden pl-2"
                            >
                              {/* Cabeçalho do Subgrupo (Nível 2 da Árvore) */}
                              <div
                                onClick={() => toggleNode(subgroup.id)}
                                className="py-2 px-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.03] cursor-pointer select-none transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <button type="button" className="text-white/30 hover:text-white p-0.5">
                                    {isSubCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                  <Folder size={14} className={subThemeClass} />
                                  <span className="text-[11px] font-semibold text-white/90 truncate">
                                    {subgroup.title}
                                  </span>
                                  {subgroup.focus && renderFocusBadge(subgroup.focus)}
                                  <span className="text-[10px] text-white/30 font-mono">
                                    ({subgroup.items.length})
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] font-bold text-white/70 shrink-0">
                                  {subgroup.totalExp} EXP
                                </span>
                              </div>

                              {/* Folhas do Subgrupo (Nível 3 da Árvore - Itens individuais) */}
                              {!isSubCollapsed && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 pt-1 border-t border-white/5 bg-black/20">
                                  {subgroup.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="p-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15 flex items-center justify-between gap-2 transition-all"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                                        <span className="text-xs text-white/90 truncate font-medium">
                                          {item.name}
                                        </span>
                                        {item.ruleNote && (
                                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-white/5 text-amber-300/80 shrink-0">
                                            {item.ruleNote}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0 font-mono">
                                        <span className="text-[10px] text-white/40">
                                          LVL {item.level}
                                        </span>
                                        <span className="text-white/20">➔</span>
                                        <span className="text-[10px] font-bold text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
                                          {item.cost} EXP
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TELA 2: MATRIZ DE CUSTOS & LEGENDA DE PESOS DOS FOCOS                     */}
        {/* ========================================================================= */}
        {activeTab === 'costMatrix' && (
          <div className="flex flex-col flex-1 min-h-0 gap-4 animate-in fade-in duration-200 overflow-y-auto pr-1 custom-scrollbar">
            {/* 1. SELEÇÃO DAS 3 OPÇÕES DE MATRIZ DE FOCOS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  Matriz de Aptidão dos Focos (3 Opções Oficiais)
                </label>
                <span className="text-[10px] text-white/50 font-mono">
                  {readonly ? 'Modo de visualização' : 'Clique para alterar a distribuição'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {FOCUS_PRESETS.map((preset) => {
                  const isSelected = currentFocus.distribution === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={readonly}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`text-left p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-violet-950/40 border-violet-400/80 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-violet-400/50'
                          : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                      } ${readonly ? 'cursor-default' : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-white">
                            {preset.title}
                          </h4>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-cyan-300">
                            {preset.pattern}
                          </span>
                        </div>
                        <p className="text-[10px] text-violet-300 font-medium">
                          {preset.subtitle}
                        </p>
                        <p className="text-[11px] text-white/60 leading-relaxed mt-1">
                          {preset.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-violet-300 font-bold uppercase tracking-wider">
                          <CheckCircle2 size={12} className="text-violet-400" />
                          <span>Selecionado</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. LEGENDA DO PESO DOS FOCOS (aparece só junto da seleção de opções de focos) */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>Legenda do Peso dos Focos (Tabela de Custos):</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Flame size={13} className="text-amber-400" />
                    <span>FE (Foco Exclusivo)</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    {FOCUS_LABELS.FE.desc}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                    <Target size={13} className="text-emerald-400" />
                    <span>F1 (Foco Primário)</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    {FOCUS_LABELS.F1.desc}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                    <Compass size={13} className="text-cyan-400" />
                    <span>F2 (Foco Secundário)</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    {FOCUS_LABELS.F2.desc}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
                    <span className="text-[10px] font-mono px-1 rounded bg-white/10 text-white/70">SF</span>
                    <span>SF (Sem Foco)</span>
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed">
                    {FOCUS_LABELS.SF.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. ALOCAÇÃO DE FOCOS POR EIXO */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                Alocação nos 3 Eixos (Físico, Mental, Social)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'physical' as const, label: 'Eixo Físico', current: currentFocus.physical, theme: 'rose' },
                  { key: 'mental' as const, label: 'Eixo Mental', current: currentFocus.mental, theme: 'cyan' },
                  { key: 'social' as const, label: 'Eixo Social', current: currentFocus.social, theme: 'emerald' },
                ].map(group => (
                  <div 
                    key={group.key}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {group.label}
                      </span>
                      {renderFocusBadge(group.current, 'md')}
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {(['FE', 'F1', 'F2', 'SF'] as FocusLevel[]).map(f => {
                        const isSelected = group.current === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            disabled={readonly}
                            onClick={() => handleChangeGroupFocus(group.key, f)}
                            className={`py-1 rounded-lg font-mono text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? f === 'FE'
                                  ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                                  : f === 'F1'
                                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                                  : f === 'F2'
                                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                                  : 'bg-white/15 border-white/30 text-white'
                                : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                            } ${readonly ? 'cursor-default opacity-80' : ''}`}
                            title={`Definir foco ${f} para ${group.label}`}
                          >
                            {f === 'FE' && <Flame size={10} className="text-amber-400" />}
                            {f === 'F1' && <Target size={10} className="text-emerald-400" />}
                            {f === 'F2' && <Compass size={10} className="text-cyan-400" />}
                            <span>{f}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. TABELAS DE CUSTO OFICIAIS (LOOK-UP TABLES) */}
            <div className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden">
              <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Table size={15} className="text-violet-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Matriz Oficial de Custo de EXP
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCostTableTab('atributos')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      costTableTab === 'atributos'
                        ? 'bg-violet-600 border-violet-400 text-white shadow-sm'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    Atributos (LVL 1-15)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostTableTab('pericias')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      costTableTab === 'pericias'
                        ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-sm'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    Perícias (LVL 1-7)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-56 p-2 custom-scrollbar">
                {costTableTab === 'atributos' ? (
                  <table className="w-full text-center text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] text-white/60">
                        <th className="py-2 px-3 text-left">Nível</th>
                        <th className="py-2 px-3 text-amber-300">
                          <div className="flex items-center justify-center gap-1">
                            <Flame size={11} className="text-amber-400" />
                            <span>FE (Exclusivo)</span>
                          </div>
                        </th>
                        <th className="py-2 px-3 text-emerald-300">
                          <div className="flex items-center justify-center gap-1">
                            <Target size={11} className="text-emerald-400" />
                            <span>F1 (Primário)</span>
                          </div>
                        </th>
                        <th className="py-2 px-3 text-cyan-300">
                          <div className="flex items-center justify-center gap-1">
                            <Compass size={11} className="text-cyan-400" />
                            <span>F2 (Secundário)</span>
                          </div>
                        </th>
                        <th className="py-2 px-3 text-slate-300">SF (Sem Foco)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => (
                        <tr key={lvl} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-1.5 px-3 text-left font-bold text-white/80">
                            Nível {lvl}
                          </td>
                          <td className="py-1.5 px-3 text-amber-300/90 font-medium bg-amber-500/[0.02]">
                            {ATRIBUTOS_COST_TABLE.FE[lvl - 1]} EXP
                          </td>
                          <td className="py-1.5 px-3 text-emerald-300/90 font-medium bg-emerald-500/[0.02]">
                            {ATRIBUTOS_COST_TABLE.F1[lvl - 1]} EXP
                          </td>
                          <td className="py-1.5 px-3 text-cyan-300/90 font-medium bg-cyan-500/[0.02]">
                            {ATRIBUTOS_COST_TABLE.F2[lvl - 1]} EXP
                          </td>
                          <td className="py-1.5 px-3 text-slate-300/80 font-medium bg-white/[0.01]">
                            {ATRIBUTOS_COST_TABLE.SF[lvl - 1]} EXP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-center text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] text-white/60">
                        <th className="py-2 px-3 text-left">Nível</th>
                        <th className="py-2 px-3 text-amber-300">
                          <div className="flex items-center justify-center gap-1">
                            <Flame size={11} className="text-amber-400" />
                            <span>FE (Exclusivo)</span>
                          </div>
                        </th>
                        <th className="py-2 px-3 text-emerald-300">
                          <div className="flex items-center justify-center gap-1">
                            <Target size={11} className="text-emerald-400" />
                            <span>F1 (Primário)</span>
                          </div>
                        </th>
                        <th className="py-2 px-3 text-cyan-300">
                          <div className="flex items-center justify-center gap-1">
                            <Compass size={11} className="text-cyan-400" />
                            <span>F2 (Secundário)</span>
                          </div>
                        </th>
                        <th className="py-2 px-3 text-slate-300">SF (Sem Foco)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Array.from({ length: 7 }, (_, i) => i + 1).map((lvl) => (
                        <tr key={lvl} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-1.5 px-3 text-left font-bold text-white/80">
                            Nível {lvl}
                          </td>
                          <td className="py-1.5 px-3 text-amber-300/90 font-medium bg-amber-500/[0.02]">
                            {PERICIAS_COST_TABLE.FE[lvl - 1]} EXP
                          </td>
                          <td className="py-1.5 px-3 text-emerald-300/90 font-medium bg-emerald-500/[0.02]">
                            {PERICIAS_COST_TABLE.F1[lvl - 1]} EXP
                          </td>
                          <td className="py-1.5 px-3 text-cyan-300/90 font-medium bg-cyan-500/[0.02]">
                            {PERICIAS_COST_TABLE.F2[lvl - 1]} EXP
                          </td>
                          <td className="py-1.5 px-3 text-slate-300/80 font-medium bg-white/[0.01]">
                            {PERICIAS_COST_TABLE.SF[lvl - 1]} EXP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
