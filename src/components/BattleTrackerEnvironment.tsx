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
  Trash2, 
  FastForward, 
  Undo2, 
  X,
  Crown,
  Heart
} from 'lucide-react';
import { BentoBox } from './BentoBox';
import { CombatEntity, CombatEntityType, CombatStep, BodyHealth, DamageType } from '../types';
import { HealthTracker } from './HealthTracker';
import { StorageApi } from '../services/storageApi';
import { realtimeSync } from '../services/realtimeSync';

interface BattleTrackerEnvironmentProps {
  characterName?: string;
  characterAvatar?: string;
  isGmView?: boolean;
  activeCharacterData?: any;
}

const STORAGE_KEY = 'arcana_battle_tracker_state';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  player: {
    label: 'Jogador',
    color: '#a855f7'
  },
  aliado: {
    label: 'Aliado',
    color: '#34d399'
  },
  neutro: {
    label: 'Neutro',
    color: '#60a5fa'
  },
  inimigo: {
    label: 'Inimigo',
    color: '#f43f5e'
  },
  chefe: {
    label: 'Chefe',
    color: '#f59e0b'
  },
  ally: { label: 'Aliado', color: '#34d399' },
  enemy: { label: 'Inimigo', color: '#f43f5e' },
  boss: { label: 'Chefe', color: '#f59e0b' }
};

const DEFAULT_BODY_HEALTH: BodyHealth = {
  head: Array(8).fill('none'),
  torso: Array(20).fill('none'),
  leftArm: Array(12).fill('none'),
  rightArm: Array(12).fill('none'),
  leftLeg: Array(16).fill('none'),
  rightLeg: Array(16).fill('none')
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
              const history = Array.isArray(e.history) ? e.history.slice(0, 2) : [];
              let steps: CombatStep[] = [];
              if (Array.isArray(e.steps) && e.steps.length > 0) {
                steps = e.steps.slice(0, 2);
              } else if (history.length > 0) {
                steps = [{ fromTick: history[0], toTick: e.currentTick }];
              }
              return {
                ...e,
                history,
                steps,
                health: e.health || DEFAULT_BODY_HEALTH
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
          defaultDelay: 3,
          health: DEFAULT_BODY_HEALTH
        },
        {
          id: 'enemy-sample',
          name: 'Assassino Sombrio',
          type: 'inimigo',
          color: '#f43f5e',
          currentTick: 2,
          history: [0],
          steps: [{ fromTick: 0, toTick: 2 }],
          hp: 14,
          maxHp: 14,
          defaultDelay: 3,
          health: DEFAULT_BODY_HEALTH
        }
      ]
    };
  });

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(() => {
    return state.entities[0]?.id || null;
  });

  const [customDelay, setCustomDelay] = useState<number>(3);
  const [showCustomDelay, setShowCustomDelay] = useState<boolean>(false);

  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<CombatEntityType>('inimigo');
  const [newEntityTick, setNewEntityTick] = useState(0);
  const [newEntityHp, setNewEntityHp] = useState<number | undefined>(15);
  const [peersCount, setPeersCount] = useState<number>(0);

  // Modal de HP do combatente
  const [healthModalEntityId, setHealthModalEntityId] = useState<string | null>(null);

  const chartScrollContainerRef = useRef<HTMLDivElement>(null);
  const currentTickLineRef = useRef<HTMLDivElement>(null);
  const lastSavedJsonRef = useRef<string>(JSON.stringify(state));
  const isSyncingFromServerRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const unsubBattle = realtimeSync.onBattleUpdate((remoteBattle) => {
      if (remoteBattle && Array.isArray(remoteBattle.entities)) {
        const remoteJson = JSON.stringify(remoteBattle);
        if (remoteJson !== lastSavedJsonRef.current) {
          isSyncingFromServerRef.current = true;
          lastSavedJsonRef.current = remoteJson;
          setState({
            currentTick: typeof remoteBattle.currentTick === 'number' ? remoteBattle.currentTick : 0,
            previousTick: typeof remoteBattle.previousTick === 'number' ? remoteBattle.previousTick : 0,
            minTimespan: Math.max(15, remoteBattle.minTimespan || 15),
            entities: remoteBattle.entities
          });
          setTimeout(() => {
            isSyncingFromServerRef.current = false;
          }, 150);
        }
      }
    });

    const unsubPeers = realtimeSync.onPeerCountChange((count) => {
      setPeersCount(count);
    });

    return () => {
      unsubBattle();
      unsubPeers();
    };
  }, []);

  const syncFromServer = async () => {
    try {
      const serverBattle = await StorageApi.getBattleState();
      if (serverBattle && Array.isArray(serverBattle.entities)) {
        const serverJson = JSON.stringify(serverBattle);
        if (serverJson !== lastSavedJsonRef.current) {
          isSyncingFromServerRef.current = true;
          lastSavedJsonRef.current = serverJson;
          setState({
            currentTick: typeof serverBattle.currentTick === 'number' ? serverBattle.currentTick : 0,
            previousTick: typeof serverBattle.previousTick === 'number' ? serverBattle.previousTick : 0,
            minTimespan: Math.max(15, serverBattle.minTimespan || 15),
            entities: serverBattle.entities
          });
          setTimeout(() => {
            isSyncingFromServerRef.current = false;
          }, 200);
        }
      }
    } catch (e) {
      console.warn('Battle sync warning:', e);
    }
  };

  useEffect(() => {
    syncFromServer();
    const interval = setInterval(syncFromServer, 3000);
    const handleFocus = () => syncFromServer();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (isSyncingFromServerRef.current) return;

    const currentJson = JSON.stringify(state);
    if (currentJson === lastSavedJsonRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await StorageApi.saveBattleState(state);
        lastSavedJsonRef.current = currentJson;
      } catch (err) {
        console.error('Failed to sync battle state to server:', err);
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentTickLineRef.current) {
        currentTickLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

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

  const ticksDescending = useMemo(() => {
    const list: number[] = [];
    for (let t = totalTimespanLength - 1; t >= 0; t--) {
      list.push(t);
    }
    return list;
  }, [totalTimespanLength]);

  const selectedEntity = useMemo(() => {
    return state.entities.find((e) => e.id === selectedEntityId) || state.entities[0] || null;
  }, [state.entities, selectedEntityId]);

  const healthModalEntity = useMemo(() => {
    return state.entities.find((e) => e.id === healthModalEntityId) || null;
  }, [state.entities, healthModalEntityId]);

  const advanceCurrentTick = (amount: number = 1) => {
    setState((prev) => ({
      ...prev,
      previousTick: prev.currentTick,
      currentTick: prev.currentTick + amount
    }));
  };

  // Jump to next scheduled action and select the next entity to act
  const jumpToNextAction = () => {
    const futureTicks = state.entities
      .map((e) => e.currentTick)
      .filter((t) => t > state.currentTick)
      .sort((a, b) => a - b);

    if (futureTicks.length > 0) {
      const nextTick = futureTicks[0];
      const nextEntity = state.entities.find((e) => e.currentTick === nextTick);
      if (nextEntity) {
        setSelectedEntityId(nextEntity.id);
      }
      setState((prev) => ({
        ...prev,
        previousTick: prev.currentTick,
        currentTick: nextTick
      }));
    } else {
      advanceCurrentTick(1);
    }
  };

  const advanceEntityAction = (entityId: string, delay: number) => {
    if (delay <= 0) return;

    setState((prev) => {
      const updatedEntities = prev.entities.map((entity) => {
        if (entity.id !== entityId) return entity;

        const oldTick = entity.currentTick;
        const baseTick = Math.max(entity.currentTick, prev.currentTick);
        const newTick = baseTick + delay;

        const newStep: CombatStep = { fromTick: baseTick, toTick: newTick };
        const existingSteps = entity.steps || [];
        const updatedSteps = [newStep, ...existingSteps].slice(0, 2);
        const newHistory = [oldTick, ...(entity.history || [])].slice(0, 2);

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

  const updateCombatantHealth = (entityId: string, part: keyof BodyHealth, index: number, value: DamageType) => {
    setState((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => {
        if (e.id !== entityId) return e;
        const currentHealth = e.health || DEFAULT_BODY_HEALTH;
        const updatedPart = [...currentHealth[part]];
        updatedPart[index] = value;
        return {
          ...e,
          health: {
            ...currentHealth,
            [part]: updatedPart
          }
        };
      })
    }));
  };

  const stretchTimespan = (amount: number = 5) => {
    setState((prev) => ({
      ...prev,
      minTimespan: prev.minTimespan + amount
    }));
  };

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

  const handleSaveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;

    const config = TYPE_CONFIG[newEntityType] || TYPE_CONFIG.inimigo;
    const newEntity: CombatEntity = {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newEntityName.trim(),
      type: newEntityType,
      color: config.color,
      currentTick: Math.max(0, newEntityTick),
      history: [],
      steps: [],
      hp: newEntityHp,
      maxHp: newEntityHp,
      defaultDelay: 3,
      health: DEFAULT_BODY_HEALTH
    };

    setState((prev) => ({
      ...prev,
      entities: [...prev.entities, newEntity]
    }));

    setSelectedEntityId(newEntity.id);
    setIsAddingEntity(false);
    setNewEntityName('');
  };

  const deleteEntity = (entityId: string) => {
    setState((prev) => ({
      ...prev,
      entities: prev.entities.filter((e) => e.id !== entityId)
    }));
    if (selectedEntityId === entityId) {
      setSelectedEntityId(null);
    }
  };

  const addQuickPreset = (type: CombatEntityType, name: string, hp: number) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.inimigo;
    const newEntity: CombatEntity = {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      type,
      color: config.color,
      currentTick: state.currentTick,
      history: [],
      steps: [],
      hp,
      maxHp: hp,
      defaultDelay: 3,
      health: DEFAULT_BODY_HEALTH
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

  // Helper to determine the trail step index for a tick (only 2 previous steps: 60% and 30%)
  const getStepForTick = (entity: CombatEntity, tick: number): { stepIndex: number; opacity: number } | null => {
    const steps = entity.steps || [];
    for (let i = 0; i < Math.min(steps.length, 2); i++) {
      const step = steps[i];
      const minT = Math.min(step.fromTick, step.toTick);
      const maxT = Math.max(step.fromTick, step.toTick);
      if (tick >= minT && tick < maxT) {
        const opacities = [0.60, 0.30];
        return { stepIndex: i, opacity: opacities[i] };
      }
    }
    const history = entity.history || [];
    if (history[0] === tick) return { stepIndex: 0, opacity: 0.60 };
    if (history[1] === tick) return { stepIndex: 1, opacity: 0.30 };

    return null;
  };

  return (
    <main className="p-3 flex flex-col gap-5 max-w-md mx-auto relative z-0 text-xs">
      
      {/* 1. TÍTULO DO BATTLE TRACKER */}
      <div className="flex items-center justify-between px-2 pt-0.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
            <Swords size={15} className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]" />
          </div>
          <h1 className="text-xs tracking-[0.25em] font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            Battle Tracker
          </h1>
        </div>

        {/* Live Internet Sync Badge */}
        <div 
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-[9px] text-emerald-300 font-medium"
          title="Battle Tracker sincronizado em tempo real via WebRTC"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ao Vivo</span>
          {peersCount > 0 && (
            <span className="font-mono text-[8px] text-emerald-200/80 bg-emerald-400/20 px-1 rounded">
              +{peersCount}
            </span>
          )}
        </div>
      </div>

      {/* 2. TIMELINE */}
      <BentoBox 
        title="Timeline" 
        titleClassName="text-amber-400"
        rightContent={
          <button
            onClick={scrollToCurrentTick}
            className="text-[9px] font-mono font-semibold text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Clock size={10} />
            <span>Focar Atual</span>
          </button>
        }
      >
        <div className="bg-[#03010b]/80 border border-white/10 rounded-xl overflow-hidden flex flex-col relative shadow-inner">
          
          <div className="bg-black/60 border-b border-white/10 px-2 py-1.5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
            <div className="text-[8px] font-mono font-bold text-white/40 w-9 shrink-0">
              TICK
            </div>
            <div className="flex-1 flex items-center justify-around gap-1 overflow-x-hidden px-1">
              {state.entities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-white/20 border-white/40 text-white shadow-sm ring-1 ring-white/20'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: entity.color }}
                    />
                    <span className="text-[9px] font-bold truncate max-w-[60px]">
                      {entity.name}
                    </span>
                    <span className="text-[8px] font-mono text-amber-300 font-bold">
                      #{entity.currentTick}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={chartScrollContainerRef}
            className="max-h-[300px] overflow-y-scroll overflow-x-hidden [scrollbar-gutter:stable] scrollbar-thin scrollbar-thumb-white/20 flex flex-col relative select-none"
          >
            {ticksDescending.map((tick) => {
              const isCurrentTick = tick === state.currentTick;
              const isPast = tick < state.currentTick;

              return (
                <div
                  key={tick}
                  ref={isCurrentTick ? currentTickLineRef : undefined}
                  className={`flex items-center h-7 min-h-[28px] max-h-[28px] border-b relative transition-colors ${
                    isCurrentTick
                      ? 'bg-amber-500/15 border-amber-400/60 shadow-[inset_0_0_12px_rgba(245,158,11,0.2)] z-10'
                      : isPast
                      ? 'border-white/[0.03] bg-white/[0.005]'
                      : 'border-white/[0.06] hover:bg-white/[0.02]'
                  }`}
                >
                  <div
                    className={`w-9 h-full flex items-center justify-center font-mono text-[9px] font-bold border-r shrink-0 ${
                      isCurrentTick
                        ? 'bg-amber-500 text-black font-black border-amber-400'
                        : isPast
                        ? 'text-white/30 border-white/5'
                        : 'text-white/60 border-white/10'
                    }`}
                  >
                    #{tick.toString().padStart(2, '0')}
                  </div>

                  {isCurrentTick && (
                    <div className="absolute left-9 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-amber-400/80 via-amber-300/60 to-transparent pointer-events-none z-0" />
                  )}

                  <div className="flex-1 flex items-center justify-around h-full relative z-10 px-1 min-w-[180px]">
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

                          {isCurrent && (
                            <div className="relative z-20 flex items-center justify-center">
                              <div
                                className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-black shadow-md transition-transform ${
                                  isCurrentTick ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[#03010b]' : ''
                                }`}
                                style={{
                                  backgroundColor: entity.color,
                                  boxShadow: `0 0 10px ${entity.color}`
                                }}
                              >
                                {entity.name.slice(0, 1).toUpperCase()}
                              </div>
                            </div>
                          )}

                          {trailInfo && (
                            <div className="relative z-10 flex items-center justify-center">
                              <div
                                className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm flex items-center justify-center"
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

            <div className="h-3 shrink-0 bg-transparent pointer-events-none" />
          </div>

        </div>
      </BentoBox>

      {/* 3. COMBATENTES (Com botão de HP abrindo a Ficha de Dano Corporal) */}
      <BentoBox
        title="Combatentes"
        titleClassName="text-amber-400"
        rightContent={
          <span className="text-[9px] font-mono text-white/50">
            {state.entities.length} participantes
          </span>
        }
      >
        <div className="flex flex-col gap-1.5">
          {state.entities.map((entity) => {
            const isSelected = selectedEntity?.id === entity.id;
            const isCurrentTurn = entity.currentTick === state.currentTick;

            return (
              <div
                key={entity.id}
                onClick={() => setSelectedEntityId(entity.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: entity.color }}
                  >
                    {entity.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white truncate">
                        {entity.name}
                      </span>
                      <span className="text-[8px] text-white/50 uppercase tracking-wider font-medium">
                        {TYPE_CONFIG[entity.type]?.label || entity.type}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-white/50">
                      Tick: <strong className="text-amber-300">#{entity.currentTick.toString().padStart(2, '0')}</strong>
                      {isCurrentTurn && (
                        <span className="ml-1 text-amber-400 font-bold uppercase text-[8px] animate-pulse">
                          ● VEZ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão para abrir o Painel de HP Corporal */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHealthModalEntityId(entity.id);
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    title={`Ver Ficha de HP de ${entity.name}`}
                  >
                    <Heart size={12} className="text-rose-400 fill-rose-400/30" />
                    <span>HP</span>
                  </button>

                  {isGmView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntity(entity.id);
                      }}
                      className="text-white/20 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Remover Combatente"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </BentoBox>

      {/* 4. CONTROLE DO MESTRE */}
      {isGmView && (
        <BentoBox 
          title="Controle do Mestre" 
          titleClassName="text-amber-400"
          icon={<Crown size={13} className="text-amber-400" />}
        >
          <div className="flex flex-col gap-4 text-xs">
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">
                Avanço Temporal Global:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => advanceCurrentTick(1)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <Plus size={12} />
                  <span>+1 Tick</span>
                </button>
                <button
                  onClick={() => advanceCurrentTick(3)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white text-[11px] font-semibold cursor-pointer border border-white/10"
                >
                  +3 Ticks
                </button>
                <button
                  onClick={jumpToNextAction}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/30 text-cyan-200 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <FastForward size={12} />
                  <span>Próxima Ação</span>
                </button>
                <button
                  onClick={() => stretchTimespan(5)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 text-[11px] border border-white/10 cursor-pointer"
                >
                  +5 Slots
                </button>
                <button
                  onClick={resetBattle}
                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer ml-auto transition-colors"
                  title="Reiniciar Combate"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {selectedEntity && (
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedEntity.color }} />
                    Fazer {selectedEntity.name} Subir:
                  </span>
                  <span className="font-mono text-[9px] text-amber-300 font-semibold">
                    Posição: #{selectedEntity.currentTick.toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => advanceEntityAction(selectedEntity.id, 2)}
                    className="py-1 rounded-lg bg-white/10 hover:bg-emerald-500/25 hover:text-emerald-300 border border-white/15 text-[11px] font-semibold transition-all cursor-pointer text-center"
                  >
                    +2 Rápido
                  </button>
                  <button
                    onClick={() => advanceEntityAction(selectedEntity.id, 3)}
                    className="py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 text-[11px] font-bold transition-all shadow-sm cursor-pointer text-center"
                  >
                    +3 Padrão
                  </button>
                  <button
                    onClick={() => advanceEntityAction(selectedEntity.id, 5)}
                    className="py-1 rounded-lg bg-violet-500/25 hover:bg-violet-500/40 border border-violet-400/40 text-violet-200 text-[11px] font-semibold transition-all cursor-pointer text-center"
                  >
                    +5 Pesado
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    onClick={() => setShowCustomDelay(!showCustomDelay)}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-white/80 cursor-pointer"
                  >
                    +X Customizado
                  </button>

                  {((selectedEntity.steps && selectedEntity.steps.length > 0) || (selectedEntity.history && selectedEntity.history.length > 0)) && (
                    <button
                      onClick={() => undoEntityStep(selectedEntity.id)}
                      className="px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Undo2 size={11} />
                      <span>Desfazer</span>
                    </button>
                  )}
                </div>

                {showCustomDelay && (
                  <div className="p-2 bg-black/60 border border-amber-400/30 rounded-lg flex items-center justify-between gap-2 text-[11px] mt-1">
                    <span>Subir quantos ticks?</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={customDelay}
                        onChange={(e) => setCustomDelay(parseInt(e.target.value) || 1)}
                        className="w-10 px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-center font-mono font-bold text-white focus:outline-none focus:border-amber-400 text-xs"
                      />
                      <button
                        onClick={() => {
                          advanceEntityAction(selectedEntity.id, customDelay);
                          setShowCustomDelay(false);
                        }}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[11px] cursor-pointer"
                      >
                        Subir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Spawner (Sem Chefe) */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">
                Invocação Rápida (Aliado, Neutro, Inimigo):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => addQuickPreset('aliado', 'Aliado', 12)}
                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Shield size={11} />
                  <span>Aliado</span>
                </button>
                <button
                  onClick={() => addQuickPreset('neutro', 'Neutro', 10)}
                  className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <User size={11} />
                  <span>Neutro</span>
                </button>
                <button
                  onClick={() => addQuickPreset('inimigo', 'Inimigo', 10)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Skull size={11} />
                  <span>Inimigo</span>
                </button>
              </div>

              <button
                onClick={() => setIsAddingEntity(true)}
                className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors mt-0.5"
              >
                <Plus size={12} />
                <span>Personalizado...</span>
              </button>
            </div>

          </div>
        </BentoBox>
      )}

      {/* Modal para exibir a Ficha de HP Corporal do Combatente */}
      {healthModalEntity && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setHealthModalEntityId(null)}
        >
          <div 
            className="bg-[#050508] border border-white/15 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col gap-4 animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ backgroundColor: healthModalEntity.color }}
                >
                  {healthModalEntity.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {healthModalEntity.name}
                  </h3>
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">
                    Painel de Pontos de Vida (HP Corporal)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setHealthModalEntityId(null)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="py-2">
              <HealthTracker 
                data={healthModalEntity.health || DEFAULT_BODY_HEALTH}
                update={(part, index, value) => updateCombatantHealth(healthModalEntity.id, part, index, value)}
                readonly={false}
                isGmView={isGmView}
                isEditing={isGmView}
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setHealthModalEntityId(null)}
                className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding custom entity */}
      {isAddingEntity && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#080514] border border-amber-400/40 rounded-2xl max-w-sm w-full p-4 shadow-2xl flex flex-col gap-3 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Plus size={14} className="text-amber-400" />
                Novo Combatente
              </span>
              <button
                onClick={() => setIsAddingEntity(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEntity} className="flex flex-col gap-2.5">
              <div>
                <label className="text-white/70 block mb-1 font-semibold text-[11px]">Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do personagem ou criatura"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white/5 border border-white/15 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/70 block mb-1 font-semibold text-[11px]">Tipo</label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value as CombatEntityType)}
                    className="w-full px-2 py-1 bg-[#120e24] border border-white/15 rounded-lg text-white focus:outline-none focus:border-amber-400 cursor-pointer text-xs"
                  >
                    <option value="aliado">Aliado</option>
                    <option value="neutro">Neutro</option>
                    <option value="inimigo">Inimigo</option>
                    <option value="player">Jogador</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/70 block mb-1 font-semibold text-[11px]">Tick Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newEntityTick}
                    onChange={(e) => setNewEntityTick(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 bg-white/5 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1 font-semibold text-[11px]">HP Inicial</label>
                <input
                  type="number"
                  min="1"
                  value={newEntityHp || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setNewEntityHp(isNaN(val) ? undefined : val);
                  }}
                  className="w-full px-2.5 py-1 bg-white/5 border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingEntity(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[11px] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] shadow-md transition-colors cursor-pointer"
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
