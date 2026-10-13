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
  Minus, 
  Trash2, 
  FastForward, 
  Undo2, 
  X,
  Crown
} from 'lucide-react';
import { BentoBox } from './BentoBox';
import { CombatEntity, CombatEntityType, CombatStep } from '../types';

interface BattleTrackerEnvironmentProps {
  characterName?: string;
  characterAvatar?: string;
  isGmView?: boolean;
  activeCharacterData?: any;
}

const STORAGE_KEY = 'arcana_battle_tracker_state';

const TYPE_CONFIG: Record<CombatEntityType, { label: string; color: string }> = {
  player: {
    label: 'Jogador',
    color: '#a855f7'
  },
  ally: {
    label: 'Aliado',
    color: '#34d399'
  },
  enemy: {
    label: 'Inimigo',
    color: '#f43f5e'
  },
  boss: {
    label: 'Chefe',
    color: '#f59e0b'
  }
};

interface LocalBattleState {
  currentTick: number;
  previousTick: number;
  minTimespan: number;
  entities: CombatEntity[];
}

export const BattleTrackerEnvironment: React.FC<BattleTrackerEnvironmentProps> = ({
  characterName = 'Personagem',
  isGmView = false
}) => {
  // Load state from localStorage
  const [state, setState] = useState<LocalBattleState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentTick === 'number' && Array.isArray(parsed.entities)) {
          return {
            currentTick: parsed.currentTick,
            previousTick: typeof parsed.previousTick === 'number' ? parsed.previousTick : Math.max(0, parsed.currentTick - 1),
            minTimespan: Math.max(15, parsed.minTimespan || 15),
            entities: parsed.entities.map((e: any) => {
              const history = Array.isArray(e.history) ? e.history.slice(0, 3) : [];
              let steps: CombatStep[] = [];
              if (Array.isArray(e.steps) && e.steps.length > 0) {
                steps = e.steps.slice(0, 3);
              } else if (history.length > 0) {
                // Infer initial step from history and currentTick
                steps = [{ fromTick: history[0], toTick: e.currentTick }];
              }
              return {
                ...e,
                history,
                steps
              };
            })
          };
        }
      } catch (err) {
        console.error('Error loading battle tracker:', err);
      }
    }
    return {
      currentTick: 0,
      previousTick: 0,
      minTimespan: 15,
      entities: [
        {
          id: 'player-default',
          name: characterName || 'Personagem',
          type: 'player',
          color: '#a855f7',
          currentTick: 0,
          history: [],
          steps: [],
          hp: 20,
          maxHp: 20,
          defaultDelay: 3
        },
        {
          id: 'enemy-sample',
          name: 'Assassino Sombrio',
          type: 'enemy',
          color: '#f43f5e',
          currentTick: 2,
          history: [0],
          steps: [{ fromTick: 0, toTick: 2 }],
          hp: 14,
          maxHp: 14,
          defaultDelay: 3
        },
        {
          id: 'boss-sample',
          name: 'Gárgula Anciã',
          type: 'boss',
          color: '#f59e0b',
          currentTick: 4,
          history: [0],
          steps: [{ fromTick: 0, toTick: 4 }],
          hp: 35,
          maxHp: 35,
          defaultDelay: 4
        }
      ]
    };
  });

  // Selected entity for focused actions
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(() => {
    return state.entities[0]?.id || null;
  });

  // Custom delay input
  const [customDelay, setCustomDelay] = useState<number>(3);
  const [showCustomDelay, setShowCustomDelay] = useState<boolean>(false);

  // Form state for adding custom entity
  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<CombatEntityType>('enemy');
  const [newEntityTick, setNewEntityTick] = useState(0);
  const [newEntityHp, setNewEntityHp] = useState<number | undefined>(15);

  // Auto-scroll ref
  const chartScrollContainerRef = useRef<HTMLDivElement>(null);
  const currentTickLineRef = useRef<HTMLDivElement>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Initial scroll into view on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentTickLineRef.current) {
        currentTickLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Calculate timespan: minimum 15, stretches if entities or currentTick reach further
  const totalTimespanLength = useMemo(() => {
    let maxFoundTick = Math.max(state.currentTick, state.previousTick);
    for (const ent of state.entities) {
      if (ent.currentTick > maxFoundTick) {
        maxFoundTick = ent.currentTick;
      }
      for (const h of ent.history || []) {
        if (h > maxFoundTick) {
          maxFoundTick = h;
        }
      }
      for (const s of ent.steps || []) {
        if (s.toTick > maxFoundTick) {
          maxFoundTick = s.toTick;
        }
      }
    }
    return Math.max(state.minTimespan, 15, maxFoundTick + 2);
  }, [state.currentTick, state.previousTick, state.minTimespan, state.entities]);

  // Generate tick numbers descending (Max at top, 0 at bottom)
  const ticksDescending = useMemo(() => {
    const list: number[] = [];
    for (let t = totalTimespanLength - 1; t >= 0; t--) {
      list.push(t);
    }
    return list;
  }, [totalTimespanLength]);

  // Selected entity reference
  const selectedEntity = useMemo(() => {
    return state.entities.find((e) => e.id === selectedEntityId) || state.entities[0] || null;
  }, [state.entities, selectedEntityId]);

  // Advance global time (incremental)
  const advanceCurrentTick = (amount: number = 1) => {
    setState((prev) => ({
      ...prev,
      previousTick: prev.currentTick,
      currentTick: prev.currentTick + amount
    }));
  };

  // Jump to next scheduled action
  const jumpToNextAction = () => {
    const futureTicks = state.entities
      .map((e) => e.currentTick)
      .filter((t) => t > state.currentTick)
      .sort((a, b) => a - b);

    if (futureTicks.length > 0) {
      setState((prev) => ({
        ...prev,
        previousTick: prev.currentTick,
        currentTick: futureTicks[0]
      }));
    } else {
      advanceCurrentTick(1);
    }
  };

  // Move entity UPWARDS by delay ticks
  const advanceEntityAction = (entityId: string, delay: number) => {
    if (delay <= 0) return;

    setState((prev) => {
      const updatedEntities = prev.entities.map((entity) => {
        if (entity.id !== entityId) return entity;

        const oldTick = entity.currentTick;
        const baseTick = Math.max(entity.currentTick, prev.currentTick);
        const newTick = baseTick + delay;

        // Record movement step covering all ticks from baseTick to newTick
        const newStep: CombatStep = { fromTick: baseTick, toTick: newTick };
        const existingSteps = entity.steps || [];
        const updatedSteps = [newStep, ...existingSteps].slice(0, 3);
        const newHistory = [oldTick, ...(entity.history || [])].slice(0, 3);

        return {
          ...entity,
          currentTick: newTick,
          history: newHistory,
          steps: updatedSteps
        };
      });

      return {
        ...prev,
        entities: updatedEntities
      };
    });
  };

  // Undo step
  const undoEntityStep = (entityId: string) => {
    setState((prev) => {
      const updatedEntities = prev.entities.map((entity) => {
        if (entity.id !== entityId) return entity;
        const steps = entity.steps || [];
        if (steps.length === 0 && (!entity.history || entity.history.length === 0)) return entity;

        const lastStep = steps[0];
        const prevTick = lastStep ? lastStep.fromTick : (entity.history?.[0] ?? entity.currentTick);
        const remainingSteps = steps.slice(1);
        const remainingHistory = (entity.history || []).slice(1);

        return {
          ...entity,
          currentTick: prevTick,
          history: remainingHistory,
          steps: remainingSteps
        };
      });
      return {
        ...prev,
        entities: updatedEntities
      };
    });
  };

  // Stretch timespan (+5)
  const stretchTimespan = (amount: number = 5) => {
    setState((prev) => ({
      ...prev,
      minTimespan: prev.minTimespan + amount
    }));
  };

  // Reset battle
  const resetBattle = () => {
    if (window.confirm('Deseja reiniciar a batalha? Todas as bolinhas voltarão para o Tick 0.')) {
      setState((prev) => ({
        ...prev,
        currentTick: 0,
        previousTick: 0,
        minTimespan: 15,
        entities: prev.entities.map((e) => ({
          ...e,
          currentTick: 0,
          history: [],
          steps: []
        }))
      }));
    }
  };

  // Adjust HP
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

  // Save custom entity
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
      steps: [],
      hp: newEntityHp,
      maxHp: newEntityHp,
      defaultDelay: 3
    };

    setState((prev) => ({
      ...prev,
      entities: [...prev.entities, newEntity]
    }));

    setSelectedEntityId(newEntity.id);
    setIsAddingEntity(false);
    setNewEntityName('');
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

  // Add quick preset
  const addQuickPreset = (type: CombatEntityType, name: string, hp: number) => {
    const newEntity: CombatEntity = {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      type,
      color: TYPE_CONFIG[type].color,
      currentTick: state.currentTick,
      history: [],
      steps: [],
      hp,
      maxHp: hp,
      defaultDelay: 3
    };
    setState((prev) => ({
      ...prev,
      entities: [...prev.entities, newEntity]
    }));
    setSelectedEntityId(newEntity.id);
  };

  const scrollToCurrentTick = () => {
    if (currentTickLineRef.current) {
      currentTickLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Helper to determine the trail step index for a tick
  // Step 0: most recent move (70% opacity)
  // Step 1: 2nd recent move (50% opacity)
  // Step 2: 3rd recent move (20% opacity)
  const getStepForTick = (entity: CombatEntity, tick: number): { stepIndex: number; opacity: number } | null => {
    const steps = entity.steps || [];
    for (let i = 0; i < Math.min(steps.length, 3); i++) {
      const step = steps[i];
      const minT = Math.min(step.fromTick, step.toTick);
      const maxT = Math.max(step.fromTick, step.toTick);
      // Cover all ticks from where it started up to right before it landed (or include landing if not current)
      if (tick >= minT && tick < maxT) {
        const opacities = [0.70, 0.50, 0.20];
        return { stepIndex: i, opacity: opacities[i] };
      }
    }
    // Fallback if steps wasn't recorded but history was
    const history = entity.history || [];
    if (history[0] === tick) return { stepIndex: 0, opacity: 0.70 };
    if (history[1] === tick) return { stepIndex: 1, opacity: 0.50 };
    if (history[2] === tick) return { stepIndex: 2, opacity: 0.20 };

    return null;
  };

  return (
    <main className="p-4 flex flex-col gap-8 max-w-lg mx-auto relative z-0">
      
      {/* 1. TÍTULO DO BATTLE TRACKER (Limpo, sem Anterior e Atual ao lado) */}
      <div className="flex items-center gap-3 px-2 pt-1">
        <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
          <Swords size={18} className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
        </div>
        <h1 className="text-sm tracking-[0.3em] font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
          Battle Tracker
        </h1>
      </div>

      {/* 2. O GRÁFICO (O NOME É SÓ "TIMELINE", SEM EXPLICAÇÃO DE BOLINHAS) */}
      <BentoBox 
        title="Timeline" 
        titleClassName="text-amber-400"
        rightContent={
          <button
            onClick={scrollToCurrentTick}
            className="text-[10px] font-mono font-semibold text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Clock size={11} />
            <span>Focar Atual</span>
          </button>
        }
      >
        <div className="bg-[#03010b]/80 border border-white/10 rounded-2xl overflow-hidden flex flex-col relative shadow-inner">
          
          {/* Timeline Columns Header (Entidades) */}
          <div className="bg-black/60 border-b border-white/10 px-3 py-2 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
            <div className="text-[9px] font-mono font-bold text-white/40 w-11 shrink-0">
              TICK
            </div>
            <div className="flex-1 flex items-center justify-around gap-1 overflow-x-hidden px-1">
              {state.entities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-white/20 border-white/40 text-white shadow-sm ring-1 ring-white/20'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: entity.color }}
                    />
                    <span className="text-[10px] font-bold truncate max-w-[70px]">
                      {entity.name}
                    </span>
                    <span className="text-[9px] font-mono text-amber-300 font-bold">
                      #{entity.currentTick}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Track: overflow-y-scroll + overflow-x-hidden [scrollbar-gutter:stable] permanently prevents sidebar resizing jitter */}
          <div
            ref={chartScrollContainerRef}
            className="max-h-[380px] overflow-y-scroll overflow-x-hidden [scrollbar-gutter:stable] scrollbar-thin scrollbar-thumb-white/20 flex flex-col relative select-none"
          >
            {ticksDescending.map((tick) => {
              const isCurrentTick = tick === state.currentTick;
              const isPreviousTick = tick === state.previousTick && tick !== state.currentTick;
              const isPast = tick < state.currentTick;

              return (
                <div
                  key={tick}
                  ref={isCurrentTick ? currentTickLineRef : undefined}
                  className={`flex items-center h-9 min-h-[36px] max-h-[36px] border-b relative transition-colors ${
                    isCurrentTick
                      ? 'bg-amber-500/15 border-amber-400/60 shadow-[inset_0_0_15px_rgba(245,158,11,0.2)] z-10'
                      : isPreviousTick
                      ? 'bg-cyan-500/10 border-cyan-400/40 z-5'
                      : isPast
                      ? 'border-white/[0.03] bg-white/[0.005]'
                      : 'border-white/[0.06] hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Y-Axis Tick Number */}
                  <div
                    className={`w-11 h-full flex items-center justify-center font-mono text-[11px] font-bold border-r shrink-0 ${
                      isCurrentTick
                        ? 'bg-amber-500 text-black font-black border-amber-400'
                        : isPreviousTick
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30'
                        : isPast
                        ? 'text-white/30 border-white/5'
                        : 'text-white/60 border-white/10'
                    }`}
                  >
                    #{tick.toString().padStart(2, '0')}
                  </div>

                  {/* Marker Guide Line for Current Tick */}
                  {isCurrentTick && (
                    <div className="absolute left-11 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-amber-400 via-amber-300 to-transparent pointer-events-none z-0">
                      <span className="absolute right-2 -top-2.5 text-[8px] uppercase font-mono font-bold text-amber-300 bg-black/90 px-1.5 py-0.2 rounded border border-amber-400/40">
                        Atual (#{tick.toString().padStart(2, '0')})
                      </span>
                    </div>
                  )}

                  {/* Marker Guide Line for Previous Tick (mostra o tick antes no gráfico) */}
                  {isPreviousTick && (
                    <div className="absolute left-11 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-400/40 pointer-events-none z-0">
                      <span className="absolute right-2 -top-2 text-[7px] uppercase font-mono font-semibold text-cyan-300 bg-black/90 px-1 py-0.2 rounded border border-cyan-400/30">
                        Anterior (#{tick.toString().padStart(2, '0')})
                      </span>
                    </div>
                  )}

                  {/* Entity Lanes */}
                  <div className="flex-1 flex items-center justify-around h-full relative z-10 px-2 min-w-[200px]">
                    {state.entities.map((entity) => {
                      const isCurrent = entity.currentTick === tick;
                      const trailInfo = !isCurrent ? getStepForTick(entity, tick) : null;
                      const isSelected = selectedEntity?.id === entity.id;

                      return (
                        <div
                          key={`${entity.id}-${tick}`}
                          className="flex-1 flex items-center justify-center h-full relative cursor-pointer"
                          onClick={() => setSelectedEntityId(entity.id)}
                        >
                          {/* Continuous Vertical Guide/Stem Line */}
                          <div
                            className={`absolute top-0 bottom-0 pointer-events-none transition-all ${
                              trailInfo 
                                ? 'w-1' 
                                : isSelected 
                                ? 'w-[1px] bg-white/20' 
                                : 'w-[1px] bg-white/5'
                            }`}
                            style={
                              trailInfo 
                                ? { backgroundColor: entity.color, opacity: trailInfo.opacity } 
                                : undefined
                            }
                          />

                          {/* Bolinha Atual (100% opacidade - sem ping para evitar bug de overflow/sidebar) */}
                          {isCurrent && (
                            <div className="relative z-20 flex items-center justify-center">
                              <div
                                className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[11px] font-black shadow-md transition-transform ${
                                  isCurrentTick ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[#03010b]' : ''
                                }`}
                                style={{
                                  backgroundColor: entity.color,
                                  boxShadow: `0 0 12px ${entity.color}`
                                }}
                              >
                                {entity.name.slice(0, 1).toUpperCase()}
                              </div>
                            </div>
                          )}

                          {/* Bolinha de Passo Anterior (Aparece em todos os ticks do segmento com o mesmo tom) */}
                          {trailInfo && (
                            <div className="relative z-10 flex items-center justify-center">
                              <div
                                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm flex items-center justify-center"
                                style={{
                                  backgroundColor: entity.color,
                                  opacity: trailInfo.opacity
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bottom breathing room so tick #00 is never crammed against the container edge */}
            <div className="h-4 shrink-0 bg-transparent pointer-events-none" />
          </div>

        </div>
      </BentoBox>

      {/* 3. LISTA DE COMBATENTES (EMBAIXO DO GRÁFICO) */}
      <BentoBox
        title="Combatentes"
        titleClassName="text-amber-400"
        rightContent={
          <span className="text-[10px] font-mono text-white/50">
            {state.entities.length} participantes
          </span>
        }
      >
        <div className="flex flex-col gap-2">
          {state.entities.map((entity) => {
            const isSelected = selectedEntity?.id === entity.id;
            const isCurrentTurn = entity.currentTick === state.currentTick;

            return (
              <div
                key={entity.id}
                onClick={() => setSelectedEntityId(entity.id)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: entity.color }}
                  >
                    {entity.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {entity.name}
                      </span>
                      <span className="text-[9px] text-white/50 uppercase tracking-wider font-medium">
                        {TYPE_CONFIG[entity.type]?.label || entity.type}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-white/50">
                      Tick: <strong className="text-amber-300">#{entity.currentTick.toString().padStart(2, '0')}</strong>
                      {isCurrentTurn && (
                        <span className="ml-1.5 text-amber-400 font-bold uppercase text-[8px] animate-pulse">
                          ● VEZ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* HP & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {typeof entity.hp === 'number' && (
                    isGmView ? (
                      <div
                        className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-lg border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateEntityHp(entity.id, -1)}
                          className="w-5 h-5 rounded hover:bg-rose-500/20 text-rose-300 flex items-center justify-center cursor-pointer transition-colors"
                          title="Reduzir HP"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-white px-1">
                          {entity.hp}
                        </span>
                        <button
                          onClick={() => updateEntityHp(entity.id, 1)}
                          className="w-5 h-5 rounded hover:bg-emerald-500/20 text-emerald-300 flex items-center justify-center cursor-pointer transition-colors"
                          title="Aumentar HP"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                        {entity.hp} HP
                      </span>
                    )
                  )}

                  {isGmView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntity(entity.id);
                      }}
                      className="text-white/20 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                      title="Remover Combatente"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </BentoBox>

      {/* 4. CAIXA DE CONTROLE (SÓ APARECE PARA O GM) */}
      {isGmView && (
        <BentoBox 
          title="Controle do Mestre" 
          titleClassName="text-amber-400"
          icon={<Crown size={14} className="text-amber-400" />}
        >
          <div className="flex flex-col gap-5 text-xs">
            
            {/* Global Timeline Controls */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                Avanço Temporal Global:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => advanceCurrentTick(1)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <Plus size={13} />
                  <span>+1 Tick</span>
                </button>
                <button
                  onClick={() => advanceCurrentTick(3)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer border border-white/10"
                >
                  +3 Ticks
                </button>
                <button
                  onClick={jumpToNextAction}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/30 text-cyan-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <FastForward size={13} />
                  <span>Próxima Ação</span>
                </button>
                <button
                  onClick={() => stretchTimespan(5)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 text-xs border border-white/10 cursor-pointer"
                >
                  +5 Slots
                </button>
                <button
                  onClick={resetBattle}
                  className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer ml-auto transition-colors"
                  title="Reiniciar Combate"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Selected Combatant Action */}
            {selectedEntity && (
              <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedEntity.color }} />
                    Fazer {selectedEntity.name} Subir:
                  </span>
                  <span className="font-mono text-[10px] text-amber-300 font-semibold">
                    Posição: #{selectedEntity.currentTick.toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => advanceEntityAction(selectedEntity.id, 2)}
                    className="py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/25 hover:text-emerald-300 border border-white/15 text-xs font-semibold transition-all cursor-pointer text-center"
                  >
                    +2 Rápido
                  </button>
                  <button
                    onClick={() => advanceEntityAction(selectedEntity.id, 3)}
                    className="py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 text-xs font-bold transition-all shadow-sm cursor-pointer text-center"
                  >
                    +3 Padrão
                  </button>
                  <button
                    onClick={() => advanceEntityAction(selectedEntity.id, 5)}
                    className="py-1.5 rounded-xl bg-violet-500/25 hover:bg-violet-500/40 border border-violet-400/40 text-violet-200 text-xs font-semibold transition-all cursor-pointer text-center"
                  >
                    +5 Pesado
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setShowCustomDelay(!showCustomDelay)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] text-white/80 cursor-pointer"
                  >
                    +X Customizado
                  </button>

                  {((selectedEntity.steps && selectedEntity.steps.length > 0) || (selectedEntity.history && selectedEntity.history.length > 0)) && (
                    <button
                      onClick={() => undoEntityStep(selectedEntity.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Undo2 size={12} />
                      <span>Desfazer</span>
                    </button>
                  )}
                </div>

                {showCustomDelay && (
                  <div className="p-2 bg-black/60 border border-amber-400/30 rounded-xl flex items-center justify-between gap-2 text-xs mt-1">
                    <span>Subir quantos ticks?</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={customDelay}
                        onChange={(e) => setCustomDelay(parseInt(e.target.value) || 1)}
                        className="w-12 px-2 py-0.5 bg-white/10 border border-white/20 rounded text-center font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={() => {
                          advanceEntityAction(selectedEntity.id, customDelay);
                          setShowCustomDelay(false);
                        }}
                        className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Subir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Spawner */}
            <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                Invocação Rápida de Entidade:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addQuickPreset('enemy', 'Lacaio', 10)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Skull size={12} />
                  <span>+ Lacaio</span>
                </button>
                <button
                  onClick={() => addQuickPreset('boss', 'Chefe', 30)}
                  className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Flame size={12} />
                  <span>+ Chefe</span>
                </button>
                <button
                  onClick={() => addQuickPreset('ally', 'Aliado', 16)}
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Shield size={12} />
                  <span>+ Aliado</span>
                </button>
              </div>

              <button
                onClick={() => setIsAddingEntity(true)}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors mt-1"
              >
                <Plus size={13} />
                <span>Personalizado...</span>
              </button>
            </div>

          </div>
        </BentoBox>
      )}

      {/* Modal for adding custom entity */}
      {isAddingEntity && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#080514] border border-amber-400/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Plus size={15} className="text-amber-400" />
                Novo Combatente
              </span>
              <button
                onClick={() => setIsAddingEntity(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEntity} className="flex flex-col gap-3">
              <div>
                <label className="text-white/70 block mb-1 font-semibold">Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do monstro ou aliado"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Tipo</label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value as CombatEntityType)}
                    className="w-full px-2 py-1.5 bg-[#120e24] border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="enemy">Inimigo</option>
                    <option value="boss">Chefe</option>
                    <option value="player">Jogador</option>
                    <option value="ally">Aliado</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Tick Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newEntityTick}
                    onChange={(e) => setNewEntityTick(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1 font-semibold">HP Inicial</label>
                <input
                  type="number"
                  min="1"
                  value={newEntityHp || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setNewEntityHp(isNaN(val) ? undefined : val);
                  }}
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingEntity(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};
