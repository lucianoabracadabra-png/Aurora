import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Swords, 
  Plus, 
  RotateCcw, 
  Clock, 
  Shield, 
  Skull, 
  User, 
  Flame, 
  Heart, 
  Minus, 
  Sparkles, 
  Trash2, 
  FastForward, 
  History, 
  Play, 
  Undo2,
  X,
  ChevronUp,
  Maximize2,
  Eye
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { CombatEntity, CombatEntityType, BattleTrackerState } from '../types';

interface BattleTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName?: string;
  characterAvatar?: string;
  isGmView?: boolean;
}

const STORAGE_KEY = 'arcana_battle_tracker_state';

const TYPE_CONFIG: Record<CombatEntityType, { label: string; color: string; border: string; bg: string; text: string; icon: any }> = {
  player: {
    label: 'Jogador',
    color: '#a855f7',
    border: 'border-violet-400/40',
    bg: 'bg-violet-500/15',
    text: 'text-violet-300',
    icon: User
  },
  ally: {
    label: 'Aliado',
    color: '#34d399',
    border: 'border-emerald-400/40',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    icon: Shield
  },
  enemy: {
    label: 'Inimigo',
    color: '#f43f5e',
    border: 'border-rose-400/40',
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    icon: Skull
  },
  boss: {
    label: 'Chefe',
    color: '#f59e0b',
    border: 'border-amber-400/40',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    icon: Flame
  }
};

export const BattleTrackerModal: React.FC<BattleTrackerModalProps> = ({
  isOpen,
  onClose,
  characterName = 'Personagem',
  characterAvatar,
  isGmView = false
}) => {
  // Load state from localStorage
  const [state, setState] = useState<BattleTrackerState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentTick === 'number' && Array.isArray(parsed.entities)) {
          return {
            currentTick: parsed.currentTick,
            minTimespan: Math.max(15, parsed.minTimespan || 15),
            entities: parsed.entities.map((e: any) => ({
              ...e,
              history: Array.isArray(e.history) ? e.history.slice(0, 3) : []
            }))
          };
        }
      } catch (err) {
        console.error('Error loading battle tracker:', err);
      }
    }
    // Default initial battle setup
    return {
      currentTick: 0,
      minTimespan: 15,
      entities: [
        {
          id: 'player-default',
          name: characterName || 'Personagem',
          type: 'player',
          color: '#a855f7',
          currentTick: 0,
          history: [],
          hp: 20,
          maxHp: 20,
          defaultDelay: 3,
          notes: 'Personagem Principal'
        },
        {
          id: 'enemy-sample',
          name: 'Assassino Sombrio',
          type: 'enemy',
          color: '#f43f5e',
          currentTick: 2,
          history: [],
          hp: 14,
          maxHp: 14,
          defaultDelay: 3,
          notes: 'Adagas Rápidas'
        },
        {
          id: 'boss-sample',
          name: 'Gárgula Anciã',
          type: 'boss',
          color: '#f59e0b',
          currentTick: 4,
          history: [],
          hp: 35,
          maxHp: 35,
          defaultDelay: 4,
          notes: 'Pele de Pedra'
        }
      ]
    };
  });

  // Selected entity for focused actions
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(() => {
    return state.entities[0]?.id || null;
  });

  // Keep saved in localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Form states for adding entity
  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<CombatEntityType>('enemy');
  const [newEntityTick, setNewEntityTick] = useState(0);
  const [newEntityHp, setNewEntityHp] = useState<number | undefined>(15);
  const [newEntityMaxHp, setNewEntityMaxHp] = useState<number | undefined>(15);
  const [newEntityNotes, setNewEntityNotes] = useState('');

  // Custom delay input
  const [customDelay, setCustomDelay] = useState<number>(3);
  const [showCustomDelay, setShowCustomDelay] = useState<boolean>(false);

  // Auto-scroll ref
  const chartScrollContainerRef = useRef<HTMLDivElement>(null);
  const currentTickLineRef = useRef<HTMLDivElement>(null);

  // Calculate timespan: minimum 15, stretches if entities or currentTick reach further
  const totalTimespanLength = useMemo(() => {
    let maxFoundTick = state.currentTick;
    for (const ent of state.entities) {
      if (ent.currentTick > maxFoundTick) {
        maxFoundTick = ent.currentTick;
      }
      for (const h of ent.history) {
        if (h > maxFoundTick) {
          maxFoundTick = h;
        }
      }
    }
    // Must show at least 15 ticks, and stretch if any entity reaches 14 or higher (0 to 14 is 15 ticks)
    return Math.max(state.minTimespan, 15, maxFoundTick + 2);
  }, [state.currentTick, state.minTimespan, state.entities]);

  // Generate tick numbers from max downwards to 0 so the chart grows VERTICALLY (0 at bottom, max at top)
  const ticksDescending = useMemo(() => {
    const list: number[] = [];
    for (let t = totalTimespanLength - 1; t >= 0; t--) {
      list.push(t);
    }
    return list;
  }, [totalTimespanLength]);

  // Scroll to bottom (Tick 0) or current tick on load/open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (currentTickLineRef.current) {
          currentTickLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (chartScrollContainerRef.current) {
          chartScrollContainerRef.current.scrollTop = chartScrollContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [isOpen]);

  // Selected entity reference
  const selectedEntity = useMemo(() => {
    return state.entities.find((e) => e.id === selectedEntityId) || state.entities[0] || null;
  }, [state.entities, selectedEntityId]);

  // Advance global time by 1 tick (incremental)
  const advanceCurrentTick = (amount: number = 1) => {
    setState((prev) => ({
      ...prev,
      currentTick: prev.currentTick + amount
    }));
  };

  // Jump to the next scheduled action
  const jumpToNextAction = () => {
    const futureTicks = state.entities
      .map((e) => e.currentTick)
      .filter((t) => t > state.currentTick)
      .sort((a, b) => a - b);

    if (futureTicks.length > 0) {
      setState((prev) => ({
        ...prev,
        currentTick: futureTicks[0]
      }));
    } else {
      advanceCurrentTick(1);
    }
  };

  // Move entity UPWARDS by delay ticks:
  // Leaves behind smaller bolinhas at previous ticks:
  // - 1st previous step (-1): 70% opacity
  // - 2nd previous step (-2): 50% opacity
  // - 3rd previous step (-3): 20% opacity
  const advanceEntityAction = (entityId: string, delay: number) => {
    if (delay <= 0) return;

    setState((prev) => {
      const updatedEntities = prev.entities.map((entity) => {
        if (entity.id !== entityId) return entity;

        const oldTick = entity.currentTick;
        // Start from max(entity.currentTick, prev.currentTick)
        const baseTick = Math.max(entity.currentTick, prev.currentTick);
        const newTick = baseTick + delay;

        // Keep last 3 previous steps
        const newHistory = [oldTick, ...(entity.history || [])].slice(0, 3);

        return {
          ...entity,
          currentTick: newTick,
          history: newHistory
        };
      });

      return {
        ...prev,
        entities: updatedEntities
      };
    });
  };

  // Undo the last step of an entity
  const undoEntityStep = (entityId: string) => {
    setState((prev) => {
      const updatedEntities = prev.entities.map((entity) => {
        if (entity.id !== entityId || entity.history.length === 0) return entity;
        const [lastStep, ...remainingHistory] = entity.history;
        return {
          ...entity,
          currentTick: lastStep,
          history: remainingHistory
        };
      });
      return {
        ...prev,
        entities: updatedEntities
      };
    });
  };

  // Manual stretch (+5 slots)
  const stretchTimespan = (amount: number = 5) => {
    setState((prev) => ({
      ...prev,
      minTimespan: prev.minTimespan + amount
    }));
  };

  // Reset entire battle
  const resetBattle = () => {
    if (window.confirm('Deseja reiniciar a batalha? Todas as bolinhas voltarão para o Tick 0 na base do gráfico.')) {
      setState((prev) => ({
        ...prev,
        currentTick: 0,
        minTimespan: 15,
        entities: prev.entities.map((e) => ({
          ...e,
          currentTick: 0,
          history: []
        }))
      }));
    }
  };

  // Adjust entity HP
  const updateEntityHp = (entityId: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => {
        if (e.id !== entityId) return e;
        const current = e.hp ?? 0;
        const max = e.maxHp ?? current;
        const nextHp = Math.max(0, Math.min(max, current + delta));
        return { ...e, hp: nextHp };
      })
    }));
  };

  // Save new entity
  const handleSaveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;

    const newEntity: CombatEntity = {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newEntityName.trim(),
      type: newEntityType,
      color: TYPE_CONFIG[newEntityType].color,
      currentTick: Math.max(0, newEntityTick),
      history: [],
      hp: newEntityHp,
      maxHp: newEntityMaxHp,
      notes: newEntityNotes.trim(),
      defaultDelay: 3
    };

    setState((prev) => ({
      ...prev,
      entities: [...prev.entities, newEntity]
    }));

    setSelectedEntityId(newEntity.id);
    setIsAddingEntity(false);
  };

  // Delete entity
  const deleteEntity = (entityId: string) => {
    setState((prev) => ({
      ...prev,
      entities: prev.entities.filter((e) => e.id !== entityId)
    }));
    if (selectedEntityId === entityId) {
      setSelectedEntityId(null);
    }
  };

  // Quick preset add
  const addQuickPreset = (type: CombatEntityType, name: string, hp: number) => {
    const newEntity: CombatEntity = {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      type,
      color: TYPE_CONFIG[type].color,
      currentTick: state.currentTick,
      history: [],
      hp,
      maxHp: hp,
      defaultDelay: 3,
      notes: ''
    };
    setState((prev) => ({
      ...prev,
      entities: [...prev.entities, newEntity]
    }));
    setSelectedEntityId(newEntity.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      theme="amber"
      title={
        <div className="flex items-center gap-2">
          <span>Battle Tracker</span>
          <span className="text-xs font-normal text-amber-400/80 border border-amber-400/30 px-2 py-0.5 rounded-full bg-amber-400/10 flex items-center gap-1">
            <ChevronUp size={13} className="text-amber-400 animate-bounce" />
            Gráfico Vertical Crescente
          </span>
          {isGmView ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
              👑 Modo Mestre (Controle Total)
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Eye size={10} />
              Modo Jogador (Visualização)
            </span>
          )}
        </div>
      }
      subtitle={
        isGmView
          ? "Controle de combate exclusivo do Mestre: incremente o tempo, faça as bolinhas subirem e gerencie combatentes."
          : "Visualização em tempo real da linha temporal de combate. O Mestre controla os avanços de tempo e ações."
      }
      icon={<Swords size={18} className="text-amber-400" />}
      className="max-h-[92vh]"
    >
      <div className="flex flex-col gap-4 text-slate-200">
        
        {/* Top Header: Current Tick Bar & Global Time Controls */}
        <div className="bg-black/50 border border-amber-500/25 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80 flex items-center gap-1">
                <Clock size={11} className="text-amber-400 animate-spin-slow" />
                Nível Temporal (Tick Atual)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                  #{state.currentTick.toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-white/50 font-mono">
                  / {totalTimespanLength} ticks de altura
                </span>
              </div>
            </div>

            {/* Advance Time Controls: ONLY GM */}
            {isGmView ? (
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => advanceCurrentTick(1)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
                  title="Avançar o tempo em +1 Tick (Exclusivo GM)"
                >
                  <Plus size={13} />
                  <span>+1 Tick</span>
                </button>

                <button
                  onClick={() => advanceCurrentTick(3)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Avançar o tempo em +3 Ticks (Exclusivo GM)"
                >
                  +3
                </button>

                <button
                  onClick={jumpToNextAction}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Pular a linha temporal para o próximo combatente que irá agir (Exclusivo GM)"
                >
                  <FastForward size={13} />
                  <span className="hidden sm:inline">Próxima Ação</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs">
                <Eye size={14} className="text-cyan-400 shrink-0" />
                <span className="font-semibold">Modo Jogador</span>
                <span className="text-white/40 hidden sm:inline">· Apenas o Mestre pode avançar a linha de combate</span>
              </div>
            )}
          </div>

          {/* Quick Actions & Stretch */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (currentTickLineRef.current) {
                  currentTickLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs border border-white/10 transition-colors cursor-pointer"
              title="Centralizar visão no tick atual"
            >
              Focar Atual
            </button>

            {isGmView && (
              <>
                <button
                  onClick={() => stretchTimespan(5)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs border border-white/10 transition-colors cursor-pointer"
                  title="Aumentar a altura vertical do gráfico em mais 5 ticks"
                >
                  +5 Altura ({totalTimespanLength})
                </button>

                <button
                  onClick={() => setIsAddingEntity(true)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Novo Combatente</span>
                </button>

                <button
                  onClick={resetBattle}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                  title="Reiniciar Combate (Voltar ao Tick 0)"
                >
                  <RotateCcw size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Legend of the Falling Trail Orbs (Bolinhas menores pelo caminho) */}
        <div className="px-3.5 py-2 bg-white/[0.02] border border-white/5 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-white/70 font-medium">
            <Sparkles size={13} className="text-amber-400" />
            <span>Rastro de Bolinhas (Conforme sobe):</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            {/* Bolinha Atual */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-violet-400 border border-white shadow-[0_0_8px_#a855f7]" />
              <span className="text-white font-semibold">Bolinha Atual (100%)</span>
            </div>

            {/* Bolinha -1 */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-violet-400 opacity-70" />
              <span className="text-white/80">Menor (-1 passo) · 70%</span>
            </div>

            {/* Bolinha -2 */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 opacity-50" />
              <span className="text-white/60">Ainda menor (-2) · 50%</span>
            </div>

            {/* Bolinha -3 */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 opacity-20" />
              <span className="text-white/40">Menorzinho (-3) · 20%</span>
            </div>
          </div>
        </div>

        {/* MAIN VISUAL: The Vertical Growing Chart */}
        <div className="bg-[#050210] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative">
          
          {/* Chart Header Bar: Combatant Column Labels */}
          <div className="bg-black/60 border-b border-white/10 px-4 py-2 flex items-center justify-between z-10 sticky top-0 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-mono text-white/50 w-16 shrink-0">
              <span>EIXO Y</span>
            </div>

            <div className="flex-1 flex items-center justify-around gap-2 px-2 overflow-x-auto scrollbar-none">
              {state.entities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                const isCurrentTurn = entity.currentTick === state.currentTick;

                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-white/15 border-white/40 text-white shadow-sm ring-1 ring-white/20'
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: entity.color }}
                    />
                    <span className="text-xs font-bold truncate max-w-[100px]">
                      {entity.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 font-bold">
                      #{entity.currentTick}
                    </span>
                    {isCurrentTurn && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Chart Body (Scrollable, 0 at the bottom, higher ticks at top) */}
          <div
            ref={chartScrollContainerRef}
            className="max-h-[460px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/15 flex flex-col relative select-none"
          >
            {/* Ticks rendered descending: MaxTick down to 0 */}
            {ticksDescending.map((tick) => {
              const isCurrentTick = tick === state.currentTick;
              const isPast = tick < state.currentTick;

              return (
                <div
                  key={tick}
                  ref={isCurrentTick ? currentTickLineRef : undefined}
                  className={`flex items-center h-10 min-h-[40px] border-b relative transition-colors ${
                    isCurrentTick
                      ? 'bg-amber-500/10 border-amber-400/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.15)] z-10'
                      : isPast
                      ? 'border-white/[0.04] bg-white/[0.005]'
                      : 'border-white/[0.06] hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Left Y-Axis Tick Number */}
                  <div
                    className={`w-16 h-full flex items-center justify-center font-mono text-xs font-bold border-r shrink-0 ${
                      isCurrentTick
                        ? 'bg-amber-500 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.5)] border-amber-400'
                        : isPast
                        ? 'text-white/30 border-white/5'
                        : 'text-white/60 border-white/10'
                    }`}
                  >
                    <span>#{tick.toString().padStart(2, '0')}</span>
                  </div>

                  {/* Horizontal Guideline Marker */}
                  {isCurrentTick && (
                    <div className="absolute left-16 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-amber-400 via-amber-300 to-transparent pointer-events-none z-0">
                      <span className="absolute right-3 -top-2.5 text-[9px] uppercase font-mono font-bold tracking-widest text-amber-300 bg-black/80 px-1.5 py-0.2 rounded border border-amber-400/40">
                        Nível Atual (Vez de Agir)
                      </span>
                    </div>
                  )}

                  {/* Entity Columns: The Rising Bolinhas and their Trails */}
                  <div className="flex-1 flex items-center justify-around h-full relative z-10 px-2 min-w-[280px]">
                    {state.entities.map((entity) => {
                      const isCurrent = entity.currentTick === tick;
                      const step1 = entity.history[0] === tick;
                      const step2 = entity.history[1] === tick;
                      const step3 = entity.history[2] === tick;

                      const isSelected = selectedEntity?.id === entity.id;

                      // Vertical lane guideline for this entity
                      const hasAnyDot = isCurrent || step1 || step2 || step3;

                      return (
                        <div
                          key={`${entity.id}-${tick}`}
                          className="flex-1 flex items-center justify-center h-full relative group cursor-pointer"
                          onClick={() => setSelectedEntityId(entity.id)}
                          title={`${entity.name} · Tick #${tick}`}
                        >
                          {/* Subtle vertical trail guideline behind orbs */}
                          <div
                            className={`absolute top-0 bottom-0 w-[1px] pointer-events-none transition-all ${
                              isSelected
                                ? 'bg-white/20'
                                : 'bg-white/5'
                            }`}
                          />

                          {/* CASE 1: Main Bolinha (Current Active Position, 100% Opacity) */}
                          {isCurrent && (
                            <div
                              className={`relative z-20 flex items-center justify-center transition-all animate-in zoom-in-75 duration-200 ${
                                isSelected ? 'scale-110' : 'hover:scale-105'
                              }`}
                            >
                              {/* Pulse ring for entity on current tick */}
                              {isCurrentTick && (
                                <span
                                  className="absolute -inset-1.5 rounded-full animate-ping opacity-60 pointer-events-none"
                                  style={{ backgroundColor: entity.color }}
                                />
                              )}

                              {/* The Main Glowing Bolinha */}
                              <div
                                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-lg transition-transform"
                                style={{
                                  backgroundColor: entity.color,
                                  boxShadow: `0 0 16px ${entity.color}`
                                }}
                              >
                                {entity.name.slice(0, 1).toUpperCase()}
                              </div>

                              {/* Tooltip on hover */}
                              <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] text-white font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md">
                                {entity.name} · Posição Atual (# {tick})
                              </div>
                            </div>
                          )}

                          {/* CASE 2: 1st Previous Step (-1): Smaller Bolinha at 70% Opacity */}
                          {step1 && !isCurrent && (
                            <div className="relative z-10 flex items-center justify-center">
                              <div
                                className="w-6 h-6 rounded-full border border-white/60 flex items-center justify-center text-white text-[10px] font-bold shadow-md transition-all group-hover:scale-110"
                                style={{
                                  backgroundColor: entity.color,
                                  opacity: 0.70,
                                  boxShadow: `0 0 10px ${entity.color}80`
                                }}
                              >
                                -1
                              </div>

                              {/* Tooltip */}
                              <div className="absolute left-1/2 -translate-x-1/2 -top-7 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                {entity.name} · 1º Passo Atrás (70%)
                              </div>
                            </div>
                          )}

                          {/* CASE 3: 2nd Previous Step (-2): Even Smaller Bolinha at 50% Opacity */}
                          {step2 && !isCurrent && !step1 && (
                            <div className="relative z-10 flex items-center justify-center">
                              <div
                                className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-white text-[8px] font-bold transition-all group-hover:scale-125"
                                style={{
                                  backgroundColor: entity.color,
                                  opacity: 0.50,
                                  boxShadow: `0 0 6px ${entity.color}60`
                                }}
                              >
                                •
                              </div>

                              {/* Tooltip */}
                              <div className="absolute left-1/2 -translate-x-1/2 -top-7 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                {entity.name} · 2º Passo Atrás (50%)
                              </div>
                            </div>
                          )}

                          {/* CASE 4: 3rd Previous Step (-3): Smallest Bolinha at 20% Opacity */}
                          {step3 && !isCurrent && !step1 && !step2 && (
                            <div className="relative z-10 flex items-center justify-center">
                              <div
                                className="w-2.5 h-2.5 rounded-full transition-all group-hover:scale-150"
                                style={{
                                  backgroundColor: entity.color,
                                  opacity: 0.20,
                                  boxShadow: `0 0 4px ${entity.color}40`
                                }}
                              />

                              {/* Tooltip */}
                              <div className="absolute left-1/2 -translate-x-1/2 -top-7 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                {entity.name} · 3º Passo Atrás (20%)
                              </div>
                            </div>
                          )}

                          {/* Empty tick spot hover dot */}
                          {!hasAnyDot && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Chart Axis: Base of the Timeline */}
          <div className="bg-black/80 border-t border-white/10 px-4 py-2 flex items-center justify-between text-[11px] text-white/50">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Base do Gráfico: Tick #00
            </span>
            <span className="flex items-center gap-1 italic">
              Conforme o tempo passa e os combatentes agem, as bolinhas sobem pelo gráfico
            </span>
          </div>
        </div>

        {/* BOTTOM ACTION CONSOLE: Action Trigger for Selected Entity */}
        {selectedEntity && (
          <div className="bg-black/60 border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
            
            {/* Entity Summary & Identity */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-md shrink-0"
                style={{ backgroundColor: selectedEntity.color }}
              >
                {selectedEntity.name.slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">
                    {selectedEntity.name}
                  </span>
                  <span
                    className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: `${selectedEntity.color}40` }}
                  >
                    {TYPE_CONFIG[selectedEntity.type].label}
                  </span>
                </div>
                <div className="text-xs text-white/60 font-mono">
                  Posição no Gráfico: <strong className="text-amber-300 font-bold">Tick #{selectedEntity.currentTick}</strong>
                  {selectedEntity.currentTick === state.currentTick && (
                    <span className="ml-2 text-amber-400 font-bold animate-pulse">
                      ● SUA VEZ DE AGIR
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Movement Buttons (Faz a Bolinha Subir!) - ONLY GM */}
            {isGmView ? (
              <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto">
                <span className="text-[11px] uppercase font-bold text-white/40 tracking-wider mr-1 hidden md:inline">
                  Fazer Subir:
                </span>

                <button
                  onClick={() => advanceEntityAction(selectedEntity.id, 2)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/25 hover:text-emerald-300 border border-white/15 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Avança 2 ticks (Ação Rápida)"
                >
                  +2 Rápido
                </button>

                <button
                  onClick={() => advanceEntityAction(selectedEntity.id, 3)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 text-xs font-bold transition-all active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
                  title="Avança 3 ticks (Ação Padrão)"
                >
                  +3 Padrão
                </button>

                <button
                  onClick={() => advanceEntityAction(selectedEntity.id, 5)}
                  className="px-3 py-1.5 rounded-xl bg-violet-500/25 hover:bg-violet-500/40 border border-violet-400/40 text-violet-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Avança 5 ticks (Ação Pesada / Magia)"
                >
                  +5 Pesado
                </button>

                {/* Custom Delay Trigger */}
                <button
                  onClick={() => setShowCustomDelay(!showCustomDelay)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-white/80 transition-colors cursor-pointer"
                  title="Outro valor de ticks"
                >
                  +X
                </button>

                {/* Undo Last Step */}
                {selectedEntity.history.length > 0 && (
                  <button
                    onClick={() => undoEntityStep(selectedEntity.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Desfazer o último passo e descer a bolinha"
                  >
                    <Undo2 size={13} />
                    <span className="hidden sm:inline">Desfazer</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <Eye size={13} className="text-cyan-400" />
                <span>Modo Jogador: Apenas o Mestre (GM) pode movimentar as bolinhas no gráfico.</span>
              </div>
            )}
          </div>
        )}

        {/* Custom Delay Inline Input - ONLY GM */}
        {isGmView && showCustomDelay && selectedEntity && (
          <div className="p-3 bg-black/80 border border-amber-400/40 rounded-xl flex items-center justify-between gap-3 text-xs">
            <span className="text-white/80 font-medium">
              Quantos ticks de ação <strong>{selectedEntity.name}</strong> deve subir?
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={customDelay}
                onChange={(e) => setCustomDelay(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-center font-mono font-bold text-white focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => {
                  advanceEntityAction(selectedEntity.id, customDelay);
                  setShowCustomDelay(false);
                }}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors cursor-pointer"
              >
                Subir +{customDelay}
              </button>
              <button
                onClick={() => setShowCustomDelay(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Combatants Quick List with HP Adjustments */}
        <div className="bg-[#050210] border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-white/50 px-1">
            <span className="uppercase font-bold tracking-wider">Combatentes em Campo:</span>
            <span>{isGmView ? 'Clique para selecionar e aplicar ações de combate' : 'Clique para inspecionar posição'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {state.entities.map((entity) => {
              const isSelected = selectedEntity?.id === entity.id;

              return (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: entity.color }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate block">
                        {entity.name}
                      </span>
                      <span className="text-[10px] font-mono text-white/50">
                        Tick Atual: <strong className="text-amber-300">#{entity.currentTick}</strong>
                      </span>
                    </div>
                  </div>

                  {/* HP Controls - GM can edit, Player can only view */}
                  {typeof entity.hp === 'number' && (
                    isGmView ? (
                      <div
                        className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded border border-white/10 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateEntityHp(entity.id, -1)}
                          className="w-4 h-4 rounded hover:bg-rose-500/20 text-rose-300 flex items-center justify-center cursor-pointer"
                          title="Reduzir HP"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-white px-1">
                          {entity.hp}
                        </span>
                        <button
                          onClick={() => updateEntityHp(entity.id, 1)}
                          className="w-4 h-4 rounded hover:bg-emerald-500/20 text-emerald-300 flex items-center justify-center cursor-pointer"
                          title="Aumentar HP"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-rose-300/90 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded shrink-0">
                        {entity.hp} HP
                      </span>
                    )
                  )}

                  {/* Delete button - ONLY GM */}
                  {isGmView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntity(entity.id);
                      }}
                      className="text-white/20 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Remover Combatente (GM)"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal for Adding New Entity */}
        {isAddingEntity && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#080514] border border-amber-400/40 rounded-2xl max-w-md w-full p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus size={16} className="text-amber-400" />
                  <span>Adicionar Bolinha / Combatente ao Gráfico</span>
                </h4>
                <button
                  onClick={() => setIsAddingEntity(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEntity} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Nome do Combatente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Monstro da Cripta, Druida, Assassino..."
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">Tipo de Entidade</label>
                    <select
                      value={newEntityType}
                      onChange={(e) => setNewEntityType(e.target.value as CombatEntityType)}
                      className="w-full px-3 py-2 bg-[#120e24] border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="enemy">Inimigo (Vermelho)</option>
                      <option value="boss">Chefe (Dourado)</option>
                      <option value="player">Jogador (Violeta)</option>
                      <option value="ally">Aliado (Verde)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">Tick Inicial no Gráfico</label>
                    <input
                      type="number"
                      min="0"
                      value={newEntityTick}
                      onChange={(e) => setNewEntityTick(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">HP Inicial</label>
                    <input
                      type="number"
                      min="1"
                      value={newEntityHp || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setNewEntityHp(isNaN(val) ? undefined : val);
                        setNewEntityMaxHp(isNaN(val) ? undefined : val);
                      }}
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">Anotações / Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Escudo Mágico"
                      value={newEntityNotes}
                      onChange={(e) => setNewEntityNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddingEntity(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold transition-all shadow-md"
                  >
                    Inserir no Gráfico
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
