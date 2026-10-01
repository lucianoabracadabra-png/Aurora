import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Dices, RotateCcw, CheckCircle2, XCircle, Zap, Plus, Calculator, Shield, Brain, Crown } from 'lucide-react';
import { Attributes } from '../types';

export type DiceRollRequest = 
  | {
      type: 'attribute';
      name: string;
      value: number;
      theme: 'rose' | 'cyan' | 'emerald' | 'violet';
    }
  | {
      type: 'skill' | 'personality';
      name: string;
      dots: number;
      theme: 'rose' | 'cyan' | 'emerald' | 'violet';
    }
  | {
      type: 'damage';
      name: string;
      actionName?: string;
      formula: string;
      damageType: string;
      ap?: number;
      precision?: number;
      theme?: 'rose' | 'cyan' | 'emerald' | 'violet' | 'amber';
    };

type Props = {
  request: DiceRollRequest | null;
  onClose: () => void;
  attributes?: Attributes;
};

type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

const DIE_SIDES: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20
};

const DIE_LABELS: Record<DieType, string> = {
  d4: 'Muito Fácil',
  d6: 'Fácil',
  d8: 'Médio',
  d10: 'Difícil',
  d12: 'Muito Difícil',
  d20: 'Extremo'
};

export const DiceRollerModal: React.FC<Props> = ({ request, onClose, attributes }) => {
  const [selectedDie, setSelectedDie] = useState<DieType>('d8');
  const [isRolling, setIsRolling] = useState(false);
  const [landedAnimationKey, setLandedAnimationKey] = useState<number>(0);
  
  // Attribute Roll State
  const [attributeResult, setAttributeResult] = useState<number | null>(null);

  // Skill Roll State
  type SkillDieRoll = {
    id: string;
    val: number;
    isExplosion: boolean;
    chainIndex: number;
  };
  const [skillResults, setSkillResults] = useState<SkillDieRoll[]>([]);
  const [skillDiceCount, setSkillDiceCount] = useState<number>(1);

  // Damage Roll State
  type DamageDieResult = {
    dieIndex: number;
    sides: number;
    val: number;
  };
  const [damageResults, setDamageResults] = useState<DamageDieResult[]>([]);

  // Attribute summing state
  type SelectedAttrInfo = {
    code: string;
    name: string;
    value: number;
    category: string;
    theme: 'rose' | 'cyan' | 'emerald';
  };
  const [selectedAttribute, setSelectedAttribute] = useState<SelectedAttrInfo | null>(null);
  const [showAttributePicker, setShowAttributePicker] = useState(false);

  // Focus-specific styles for summing attributes
  const focusColorStyles = {
    rose: {
      btnActive: 'bg-rose-500/20 border-rose-400/60 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      plusIcon: 'text-rose-400',
      sumBox: 'border-rose-500/30 bg-rose-950/20',
      sumTitle: 'text-rose-400',
      dieCard: 'bg-rose-500/10 border-rose-500/30 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.15)]',
      dieSubtext: 'text-rose-300/60',
    },
    cyan: {
      btnActive: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]',
      plusIcon: 'text-cyan-400',
      sumBox: 'border-cyan-500/30 bg-cyan-950/20',
      sumTitle: 'text-cyan-400',
      dieCard: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.15)]',
      dieSubtext: 'text-cyan-300/60',
    },
    emerald: {
      btnActive: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)]',
      plusIcon: 'text-emerald-400',
      sumBox: 'border-emerald-500/30 bg-emerald-950/20',
      sumTitle: 'text-emerald-400',
      dieCard: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.15)]',
      dieSubtext: 'text-emerald-300/60',
    }
  };

  const activeFocusStyle = selectedAttribute ? focusColorStyles[selectedAttribute.theme] : null;

  // Initialize states when request changes (hidden/waiting state, prompt user to roll)
  useEffect(() => {
    if (!request) return;
    setSelectedAttribute(null);
    setShowAttributePicker(false);
    setAttributeResult(null);
    setSkillResults([]);
    setIsRolling(false);

    if (request.type === 'attribute') {
      setSelectedDie('d8');
    } else if (request.type === 'damage') {
      executeDamageRoll(request.formula);
    } else {
      const count = Math.max(1, request.dots);
      setSkillDiceCount(count);
    }
  }, [request]);

  // Helper to dynamically get current attribute value from the character sheet attributes
  const getAttrValue = (category: string, code: string, defaultValue: number) => {
    if (!attributes) return defaultValue;
    if (category === 'Físico') {
      if (code === 'FOR') return attributes.physical?.strength ?? 0;
      if (code === 'DES') return attributes.physical?.dexterity ?? 0;
      if (code === 'AGI') return attributes.physical?.agility ?? 0;
      if (code === 'CON') return attributes.physical?.constitution ?? 0;
    } else if (category === 'Mental') {
      if (code === 'INT') return attributes.mental?.intelligence ?? 0;
      if (code === 'PER') return attributes.mental?.perception ?? 0;
      if (code === 'RAC') return attributes.mental?.reasoning ?? 0;
      if (code === 'SAB') return attributes.mental?.wisdom ?? 0;
    } else if (category === 'Social') {
      if (code === 'EMP') return attributes.social?.empathy ?? 0;
      if (code === 'MAN') return attributes.social?.manipulation ?? 0;
      if (code === 'EXP') return attributes.social?.expression ?? 0;
      if (code === 'RES') return attributes.social?.resilience ?? 0;
    }
    return defaultValue;
  };

  const attributeGroups = [
    {
      category: 'Físico',
      focusName: 'Foco Físico',
      tag: 'Vigor',
      theme: 'rose' as const,
      icon: Shield,
      containerStyle: 'from-rose-950/40 via-rose-900/10 to-transparent border-rose-500/25 shadow-[inset_0_1px_10px_rgba(244,63,94,0.08)]',
      badgeStyle: 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
      tagStyle: 'text-rose-400/80 bg-rose-500/10 border-rose-500/20',
      titleColor: 'text-rose-400',
      activeBorder: 'border-rose-400 bg-rose-500/25 text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.45)] ring-1 ring-rose-400/60',
      idleClass: 'bg-rose-500/[0.04] border-rose-500/20 hover:border-rose-400/60 hover:bg-rose-500/15 text-rose-200/90',
      items: [
        { code: 'FOR', name: 'Força', value: attributes?.physical?.strength ?? 0 },
        { code: 'DES', name: 'Destreza', value: attributes?.physical?.dexterity ?? 0 },
        { code: 'AGI', name: 'Agilidade', value: attributes?.physical?.agility ?? 0 },
        { code: 'CON', name: 'Constituição', value: attributes?.physical?.constitution ?? 0 },
      ]
    },
    {
      category: 'Mental',
      focusName: 'Foco Mental',
      tag: 'Foco',
      theme: 'cyan' as const,
      icon: Brain,
      containerStyle: 'from-cyan-950/40 via-cyan-900/10 to-transparent border-cyan-500/25 shadow-[inset_0_1px_10px_rgba(34,211,238,0.08)]',
      badgeStyle: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]',
      tagStyle: 'text-cyan-400/80 bg-cyan-500/10 border-cyan-500/20',
      titleColor: 'text-cyan-400',
      activeBorder: 'border-cyan-400 bg-cyan-500/25 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.45)] ring-1 ring-cyan-400/60',
      idleClass: 'bg-cyan-500/[0.04] border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-500/15 text-cyan-200/90',
      items: [
        { code: 'INT', name: 'Inteligência', value: attributes?.mental?.intelligence ?? 0 },
        { code: 'PER', name: 'Percepção', value: attributes?.mental?.perception ?? 0 },
        { code: 'RAC', name: 'Raciocínio', value: attributes?.mental?.reasoning ?? 0 },
        { code: 'SAB', name: 'Sabedoria', value: attributes?.mental?.wisdom ?? 0 },
      ]
    },
    {
      category: 'Social',
      focusName: 'Foco Social',
      tag: 'Graça',
      theme: 'emerald' as const,
      icon: Crown,
      containerStyle: 'from-emerald-950/40 via-emerald-900/10 to-transparent border-emerald-500/25 shadow-[inset_0_1px_10px_rgba(52,211,153,0.08)]',
      badgeStyle: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]',
      tagStyle: 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20',
      titleColor: 'text-emerald-400',
      activeBorder: 'border-emerald-400 bg-emerald-500/25 text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.45)] ring-1 ring-emerald-400/60',
      idleClass: 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-400/60 hover:bg-emerald-500/15 text-emerald-200/90',
      items: [
        { code: 'EMP', name: 'Empatia', value: attributes?.social?.empathy ?? 0 },
        { code: 'MAN', name: 'Manipulação', value: attributes?.social?.manipulation ?? 0 },
        { code: 'EXP', name: 'Expressão', value: attributes?.social?.expression ?? 0 },
        { code: 'RES', name: 'Resiliência', value: attributes?.social?.resilience ?? 0 },
      ]
    },
  ];

  const currentSelectedValue = selectedAttribute 
    ? getAttrValue(selectedAttribute.category, selectedAttribute.code, selectedAttribute.value)
    : 0;

  const executeAttributeRoll = (die: DieType) => {
    setIsRolling(true);
    setAttributeResult(null);

    const sides = DIE_SIDES[die];
    let counter = 0;
    const maxIterations = 14;

    const interval = setInterval(() => {
      setAttributeResult(Math.floor(Math.random() * sides) + 1);
      counter++;
      if (counter >= maxIterations) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * sides) + 1;
        setAttributeResult(finalVal);
        setIsRolling(false);
        setLandedAnimationKey(Date.now());
      }
    }, 30);
  };

  const executeSkillRoll = (diceCount: number) => {
    setIsRolling(true);
    setSkillResults([]);

    let counter = 0;
    const maxIterations = 15;

    const interval = setInterval(() => {
      // Efeito Slot Reel: troca rápida de números no mesmo lugar
      const fakeDice: SkillDieRoll[] = Array.from({ length: diceCount }).map((_, i) => ({
        id: `slot-${i}`,
        val: Math.floor(Math.random() * 10) + 1,
        isExplosion: false,
        chainIndex: 0
      }));
      setSkillResults(fakeDice);
      counter++;

      if (counter >= maxIterations) {
        clearInterval(interval);

        const rolls: SkillDieRoll[] = [];
        const queue: { id: string; isExplosion: boolean; chainIndex: number }[] = [];

        for (let i = 0; i < diceCount; i++) {
          queue.push({ id: `base-${i}`, isExplosion: false, chainIndex: 0 });
        }

        let totalRolls = 0;
        const MAX_SAFETY = 50;

        while (queue.length > 0 && totalRolls < MAX_SAFETY) {
          const item = queue.shift()!;
          totalRolls++;
          const val = Math.floor(Math.random() * 10) + 1;
          rolls.push({
            id: item.id,
            val,
            isExplosion: item.isExplosion,
            chainIndex: item.chainIndex
          });

          // 10 Explodes ad infinitum!
          if (val === 10) {
            queue.push({
              id: `exp-${item.id}-${Math.random().toString(36).substring(7)}`,
              isExplosion: true,
              chainIndex: item.chainIndex + 1
            });
          }
        }

        setSkillResults(rolls);
        setIsRolling(false);
        setLandedAnimationKey(Date.now());
      }
    }, 30);
  };

  const executeDamageRoll = (formula: string) => {
    setIsRolling(true);
    setDamageResults([]);

    const match = formula.toLowerCase().match(/(\d+)?d(\d+)/);
    const count = match && match[1] ? parseInt(match[1], 10) : 1;
    const sides = match && match[2] ? parseInt(match[2], 10) : 6;

    let counter = 0;
    const maxIterations = 15;

    const interval = setInterval(() => {
      // Efeito Slot Reel para Dano
      const fakeRolls: DamageDieResult[] = [];
      for (let i = 0; i < count; i++) {
        fakeRolls.push({
          dieIndex: i,
          sides,
          val: Math.floor(Math.random() * sides) + 1
        });
      }
      setDamageResults(fakeRolls);
      counter++;

      if (counter >= maxIterations) {
        clearInterval(interval);

        const rolls: DamageDieResult[] = [];
        for (let i = 0; i < count; i++) {
          rolls.push({
            dieIndex: i,
            sides,
            val: Math.floor(Math.random() * sides) + 1
          });
        }
        setDamageResults(rolls);
        setIsRolling(false);
        setLandedAnimationKey(Date.now());
      }
    }, 30);
  };

  if (!request) return null;

  const currentTheme = request.theme || (request.type === 'damage' ? 'amber' : 'rose');

  const themeColors = {
    rose: {
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      bgGlow: 'bg-rose-500/10'
    },
    cyan: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/40',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
      bgGlow: 'bg-cyan-500/10'
    },
    emerald: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/40',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]',
      bgGlow: 'bg-emerald-500/10'
    },
    violet: {
      text: 'text-violet-400',
      border: 'border-violet-500/40',
      glow: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]',
      bgGlow: 'bg-violet-500/10'
    },
    amber: {
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      bgGlow: 'bg-amber-500/10'
    }
  }[currentTheme];

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-[#050508] border border-white/10 rounded-[2rem] w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative transition-all duration-200 animate-in fade-in zoom-in-95 duration-200 ease-out ${
          showAttributePicker ? 'min-h-[580px]' : 'min-h-[460px]'
        }`}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Pop-up Resumo dos Atributos */}
        {showAttributePicker && (
          <div className="absolute inset-0 z-40 bg-[#050508]/95 backdrop-blur-2xl p-6 flex flex-col justify-between overflow-y-auto min-h-[580px] animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
            <div className="flex flex-col gap-4">
              {/* Pop-up Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                    activeFocusStyle 
                      ? `${activeFocusStyle.dieCard} ${activeFocusStyle.plusIcon}` 
                      : 'bg-white/10 border-white/20 text-white/80'
                  }`}>
                    <Calculator size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">Somar Atributo</h4>
                    <p className="text-[11px] text-white/50">Selecione o atributo para somar a cada face rolada</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttributePicker(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Pop-up Attributes Grid (Igual aos atributos da ficha por foco) */}
              <div className="flex flex-col gap-3">
                {attributeGroups.map(group => {
                  const FocusIcon = group.icon;
                  return (
                    <div 
                      key={group.category} 
                      className={`p-3 rounded-2xl border bg-gradient-to-r ${group.containerStyle} flex flex-col gap-2 transition-all`}
                    >
                      {/* Focus Header with Aesthetic Branding */}
                      <div className="flex items-center justify-between px-0.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${group.badgeStyle}`}>
                            <FocusIcon size={12} />
                          </div>
                          <span className={`text-[11px] font-black uppercase tracking-wider ${group.titleColor}`}>
                            {group.focusName}
                          </span>
                        </div>
                        <span className={`text-[9px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full border ${group.tagStyle}`}>
                          {group.tag}
                        </span>
                      </div>

                      {/* Linha única com os 4 atributos do foco */}
                      <div className="grid grid-cols-4 gap-2">
                        {group.items.map(item => {
                          const isSelected = selectedAttribute?.code === item.code;
                          return (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setSelectedAttribute({
                                  code: item.code,
                                  name: item.name,
                                  value: item.value,
                                  category: group.category,
                                  theme: group.theme
                                });
                                setShowAttributePicker(false);
                              }}
                              className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                isSelected 
                                  ? group.activeBorder 
                                  : group.idleClass
                              }`}
                              title={`${item.name} (${item.code}): ${item.value}`}
                            >
                              <span className="text-[11px] font-black tracking-wider uppercase">
                                {item.code}
                              </span>
                              <span className="text-base font-extrabold font-mono leading-none">
                                {item.value}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pop-up Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 mt-4">
              {selectedAttribute ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAttribute(null);
                    setShowAttributePicker(false);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Remover Atributo
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setShowAttributePicker(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`p-6 border-b border-white/5 bg-gradient-to-r ${themeColors.bgGlow} to-transparent relative flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border ${themeColors.border} ${themeColors.bgGlow} flex items-center justify-center ${themeColors.glow}`}>
              <Dices size={20} className={themeColors.text} />
            </div>
            <div>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-white/50 block">
                {request.type === 'attribute' 
                  ? 'Rolagem de Atributo' 
                  : request.type === 'personality' 
                    ? 'Rolagem de Personalidade' 
                    : request.type === 'damage'
                      ? `Rolagem de Dano • ${request.actionName || 'Golpe'}`
                      : 'Rolagem de Perícia'}
              </span>
              <h3 className={`font-bold text-lg text-white flex items-center gap-2 ${themeColors.text} drop-shadow-[0_0_8px_currentColor]`}>
                {request.name}
              </h3>
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6">
          {request.type === 'attribute' ? (
            /* ATRIBUTO ROLL UI */
            <div className="flex flex-col gap-5">
              {/* Rules description */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs">
                <span className="text-white/60">Alvo (Valor do Atributo):</span>
                <span className={`text-base font-bold ${themeColors.text} px-2 py-0.5 rounded-lg bg-white/5`}>
                  {request.value}
                </span>
              </div>

              {/* Die difficulty selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  Dificuldade (Tamanho do Dado):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DieType[]).map((die) => (
                    <button
                      key={die}
                      type="button"
                      disabled={isRolling}
                      onClick={() => {
                        setSelectedDie(die);
                        if (attributeResult !== null) {
                          executeAttributeRoll(die);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                        selectedDie === die
                          ? `${themeColors.bgGlow} ${themeColors.border} ${themeColors.text} ${themeColors.glow}`
                          : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-sm uppercase">{die}</span>
                      <span className="text-[8px] text-white/40 tracking-tighter truncate max-w-full">
                        {DIE_LABELS[die]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Stage */}
              <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/[0.01] border border-white/5 rounded-2xl relative overflow-hidden">
                <span className="text-[10px] tracking-widest uppercase text-white/40 font-semibold mb-2">
                  Resultado no {selectedDie.toUpperCase()}
                </span>

                {attributeResult === null && !isRolling ? (
                  <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
                    <div className={`w-14 h-14 rounded-2xl border ${themeColors.border} ${themeColors.bgGlow} flex items-center justify-center mb-1`}>
                      <Dices size={28} className={themeColors.text} />
                    </div>
                    <span className="text-xs text-white/70 font-medium">Aguardando Rolagem</span>
                    <span className="text-[11px] text-white/40 max-w-xs">
                      Defina a dificuldade acima e clique no botão abaixo para girar o dado
                    </span>
                  </div>
                ) : (
                  <>
                    <div 
                      key={landedAnimationKey || 'attr-res'}
                      className={`relative flex items-center justify-center my-2 ${!isRolling && landedAnimationKey > 0 ? 'animate-shake-impact' : ''}`}
                    >
                      <div className={`text-6xl font-light tracking-tight transition-transform ${isRolling ? 'scale-110 opacity-70 blur-xs font-mono font-bold' : 'scale-100'} ${
                        attributeResult !== null && attributeResult <= request.value 
                          ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)] font-normal' 
                          : 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] font-normal'
                      }`}>
                        {attributeResult !== null ? attributeResult : '-'}
                      </div>
                    </div>

                    {!isRolling && attributeResult !== null && (
                      <div className="mt-3 flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-200">
                        {attributeResult <= request.value ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-sm bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            <CheckCircle2 size={16} />
                            Sucesso! ({attributeResult} ≤ {request.value})
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-widest text-sm bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                            <XCircle size={16} />
                            Falha ({attributeResult} &gt; {request.value})
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Button (Sem somar no teste de atributo) */}
              <button
                type="button"
                disabled={isRolling}
                onClick={() => executeAttributeRoll(selectedDie)}
                className={`w-full py-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isRolling 
                    ? 'opacity-50 cursor-not-allowed border-white/10 text-white/40' 
                    : attributeResult === null
                      ? `${themeColors.border} ${themeColors.bgGlow} ${themeColors.text} ${themeColors.glow} hover:brightness-125`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white hover:border-white/20'
                }`}
              >
                <RotateCcw size={15} className={isRolling ? 'animate-spin' : ''} />
                {attributeResult === null ? `Girar Dado (${selectedDie})` : `Rolar Novamente (${selectedDie})`}
              </button>
            </div>
          ) : request.type === 'damage' ? (
            /* DAMAGE ROLL UI */
            <div className="flex flex-col gap-5">
              {/* Formula and type badge */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs">
                <span className="text-white/60">Fórmula do Golpe:</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-amber-400 font-bold text-sm bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {request.formula}
                  </span>
                  <span className="text-white/50 uppercase text-[10px] font-semibold">
                    {request.damageType === 'cor' ? 'Cortante' : request.damageType === 'per' ? 'Perfurante' : request.damageType === 'esm' ? 'Esmagamento' : request.damageType}
                  </span>
                </div>
              </div>

              {/* Main Result Display */}
              <div className="bg-black/30 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                
                {damageResults.length === 0 ? (
                  <div className="text-center py-4">
                    <span className="text-xs uppercase tracking-widest text-white/40 block mb-1">Aguardando golpe</span>
                    <span className="text-xl font-mono text-white/60 font-bold">Rolar Dano</span>
                  </div>
                ) : (
                  <div 
                    key={landedAnimationKey || 'dmg-res'}
                    className={`flex flex-col items-center gap-3 relative z-10 ${!isRolling && landedAnimationKey > 0 ? 'animate-shake-impact' : ''}`}
                  >
                    <div className="flex items-center justify-center">
                      <span className={`text-6xl font-black tracking-tight font-mono ${isRolling ? 'scale-110 opacity-70 blur-xs' : 'scale-100'} text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]`}>
                        {damageResults.reduce((acc, d) => acc + d.val, 0)}
                      </span>
                    </div>

                    {/* Individual dice if more than 1 */}
                    {damageResults.length > 1 && (
                      <div className="flex items-center gap-2 text-xs font-mono text-white/60">
                        <span>Faces:</span>
                        {damageResults.map((d, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-bold">
                            {d.val}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Combat Properties Badges: AP & Precision */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex items-center gap-1.5 text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-full">
                        <span className="text-[10px] uppercase tracking-wider font-bold">AP:</span>
                        <span className="font-mono font-bold">{request.ap ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full">
                        <span className="text-[10px] uppercase tracking-wider font-bold">Precisão:</span>
                        <span className="font-mono font-bold">+{request.precision ?? 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isRolling}
                onClick={() => executeDamageRoll(request.formula)}
                className={`w-full py-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isRolling 
                    ? 'opacity-50 cursor-not-allowed border-white/10 text-white/40' 
                    : damageResults.length === 0
                      ? `${themeColors.border} ${themeColors.bgGlow} ${themeColors.text} ${themeColors.glow} hover:brightness-125`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white hover:border-white/20'
                }`}
              >
                <RotateCcw size={15} className={isRolling ? 'animate-spin' : ''} />
                {damageResults.length === 0 ? `Rolar Dano (${request.formula})` : `Rolar Novamente (${request.formula})`}
              </button>
            </div>
          ) : (
            /* PERÍCIA ROLL UI */
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs">
                <span className="text-white/60">Quantidade de Dados:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(1, skillDiceCount - 1);
                      setSkillDiceCount(next);
                      if (skillResults.length > 0) {
                        executeSkillRoll(next);
                      }
                    }}
                    className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 cursor-pointer"
                  >
                    -
                  </button>
                  <span className={`text-sm font-bold ${themeColors.text} px-2`}>
                    {skillDiceCount}d10
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = skillDiceCount + 1;
                      setSkillDiceCount(next);
                      if (skillResults.length > 0) {
                        executeSkillRoll(next);
                      }
                    }}
                    className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dice Grid Display */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                      {skillResults.length > 0 ? `Dados Rolados (${skillResults.length} no total):` : `Dados a Rolar (${skillDiceCount}d10):`}
                    </span>
                  </div>

                  {/* Botão para Somar Atributo */}
                  <button
                    type="button"
                    onClick={() => setShowAttributePicker(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedAttribute && activeFocusStyle
                        ? activeFocusStyle.btnActive
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Plus size={13} className={activeFocusStyle ? activeFocusStyle.plusIcon : 'text-white/60'} />
                    <span>{selectedAttribute ? `${selectedAttribute.name} (+${currentSelectedValue})` : 'Somar'}</span>
                  </button>
                </div>

                {/* Rolled Dice Faces or Empty Waiting State */}
                {skillResults.length === 0 && !isRolling ? (
                  <div className="p-8 bg-white/[0.01] border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 text-center">
                    <div className={`w-12 h-12 rounded-2xl border ${themeColors.border} ${themeColors.bgGlow} flex items-center justify-center ${themeColors.text}`}>
                      <Dices size={24} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white/70 block">Aguardando Rolagem</span>
                      <span className="text-[10px] text-white/40">
                        Ajuste os dados ({skillDiceCount}d10) e clique em "Girar Dados" abaixo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div 
                    key={landedAnimationKey || 'skill-res'}
                    className={`p-4 bg-white/[0.01] border border-white/5 rounded-2xl max-h-48 overflow-y-auto flex flex-wrap gap-2 items-center justify-start custom-scrollbar ${!isRolling && landedAnimationKey > 0 ? 'animate-shake-impact' : ''}`}
                  >
                    {isRolling ? (
                      <div className="w-full py-8 text-center text-white/40 text-xs tracking-widest uppercase animate-pulse">
                        Rolando dados com explosão...
                      </div>
                    ) : skillResults.map((die, idx) => (
                      <div
                        key={die.id + idx}
                        className={`relative px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          die.val === 10
                            ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)] font-bold'
                          : die.isExplosion
                            ? 'bg-white/10 border-white/20 text-white font-medium'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 font-light'
                        }`}
                      >
                        <span className="text-base">{die.val}</span>
                        {die.val === 10 && (
                          <Zap size={12} className="text-amber-400 animate-bounce" />
                        )}
                        {die.isExplosion && die.val !== 10 && (
                          <span className="text-[8px] uppercase tracking-tighter text-white/40">+d10</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Nova Linha: Resultado da soma de cada face separadamente + atributo com a cor do foco correspondente */}
                {selectedAttribute && activeFocusStyle && skillResults.length > 0 && !isRolling && (
                  <div className={`flex flex-col gap-2 p-3.5 border rounded-2xl animate-in fade-in-50 slide-in-from-top-1 duration-200 ${activeFocusStyle.sumBox}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 ${activeFocusStyle.sumTitle}`}>
                        <Plus size={12} />
                        Faces + {selectedAttribute.name} (+{currentSelectedValue}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedAttribute(null)}
                        className="text-[10px] text-white/40 hover:text-rose-300 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/5"
                        title="Remover soma"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="p-2.5 bg-black/20 border border-white/5 rounded-xl min-h-[56px] max-h-48 overflow-y-auto flex flex-wrap gap-2 items-center justify-start custom-scrollbar">
                      {skillResults.map((die, idx) => {
                        const sumVal = die.val + currentSelectedValue;
                        return (
                          <div
                            key={`sum-${die.id}-${idx}`}
                            className={`relative px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center min-w-[48px] transition-all ${
                              die.val === 10
                                ? 'bg-amber-500/20 border-amber-400/70 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                                : activeFocusStyle.dieCard
                            }`}
                          >
                            <span className="text-base font-bold leading-tight">
                              {sumVal}
                            </span>
                            <span className={`text-[8px] font-mono leading-none mt-0.5 ${die.val === 10 ? 'text-amber-200/60' : activeFocusStyle.dieSubtext}`}>
                              {die.val}+{currentSelectedValue}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Roll button */}
              <button
                type="button"
                disabled={isRolling}
                onClick={() => executeSkillRoll(skillDiceCount)}
                className={`w-full py-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isRolling 
                    ? 'opacity-50 cursor-not-allowed border-white/10 text-white/40' 
                    : skillResults.length === 0
                      ? `${themeColors.border} ${themeColors.bgGlow} ${themeColors.text} ${themeColors.glow} hover:brightness-125`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white hover:border-white/20'
                }`}
              >
                <RotateCcw size={15} className={isRolling ? 'animate-spin' : ''} />
                {skillResults.length === 0 
                  ? `Girar Dados (${skillDiceCount}d10)` 
                  : `Rolar Novamente (${skillDiceCount}d10)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
