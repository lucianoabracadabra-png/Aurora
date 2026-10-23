import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Dices, RotateCcw, CheckCircle2, XCircle, Zap, Plus, Calculator, Shield, Brain, Crown } from 'lucide-react';
import { Attributes, SpiritusData, FocusConfig, FocusLevel } from '../types';

export type DiceRollRequest = 
  | {
      type: 'attribute';
      name: string;
      value: number;
      theme: 'rose' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'blue' | 'orange';
    }
  | {
      type: 'skill' | 'personality' | 'domain';
      name: string;
      dots: number;
      theme: 'rose' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'blue' | 'orange';
    }
  | {
      type: 'damage';
      name: string;
      actionName?: string;
      formula: string;
      damageType: string;
      ap?: number;
      precision?: number;
      theme?: 'rose' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'blue' | 'orange';
    };

type Props = {
  request: DiceRollRequest | null;
  onClose: () => void;
  attributes?: Attributes;
  spiritus?: SpiritusData;
  focusConfig?: FocusConfig;
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

export type RollModifier = 'normal' | 'vantagem' | 'desvantagem';

export const DiceRollerModal: React.FC<Props> = ({ request, onClose, attributes, spiritus, focusConfig }) => {
  const [selectedDie, setSelectedDie] = useState<DieType>('d8');
  const [rollModifier, setRollModifier] = useState<RollModifier>('normal');
  const [numericModifier, setNumericModifier] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [landedAnimationKey, setLandedAnimationKey] = useState<number>(0);
  
  // Attribute Roll State
  type AttributeDieRoll = {
    val: number;
    isDiscarded: boolean;
  };
  const [attributeResult, setAttributeResult] = useState<number | null>(null);
  const [attributeRolls, setAttributeRolls] = useState<AttributeDieRoll[]>([]);

  // Skill Roll State
  type SkillDieRoll = {
    id: string;
    val: number;
    isExplosion: boolean;
    chainIndex: number;
    isDiscarded?: boolean;
    discardReason?: string;
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
    theme: 'rose' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'blue' | 'orange';
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
    },
    violet: {
      btnActive: 'bg-violet-500/20 border-violet-400/60 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.35)]',
      plusIcon: 'text-violet-400',
      sumBox: 'border-violet-500/30 bg-violet-950/20',
      sumTitle: 'text-violet-400',
      dieCard: 'bg-violet-500/10 border-violet-500/30 text-violet-200 shadow-[0_0_8px_rgba(139,92,246,0.15)]',
      dieSubtext: 'text-violet-300/60',
    },
    amber: {
      btnActive: 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      plusIcon: 'text-amber-400',
      sumBox: 'border-amber-500/30 bg-amber-950/20',
      sumTitle: 'text-amber-400',
      dieCard: 'bg-amber-500/10 border-amber-500/30 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
      dieSubtext: 'text-amber-300/60',
    },
    blue: {
      btnActive: 'bg-blue-500/20 border-blue-400/60 text-blue-200 shadow-[0_0_12px_rgba(96,165,250,0.35)]',
      plusIcon: 'text-blue-400',
      sumBox: 'border-blue-500/30 bg-blue-950/20',
      sumTitle: 'text-blue-400',
      dieCard: 'bg-blue-500/10 border-blue-500/30 text-blue-200 shadow-[0_0_8px_rgba(96,165,250,0.15)]',
      dieSubtext: 'text-blue-300/60',
    },
    orange: {
      btnActive: 'bg-orange-500/20 border-orange-400/60 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
      plusIcon: 'text-orange-400',
      sumBox: 'border-orange-500/30 bg-orange-950/20',
      sumTitle: 'text-orange-400',
      dieCard: 'bg-orange-500/10 border-orange-500/30 text-orange-200 shadow-[0_0_8px_rgba(249,115,22,0.15)]',
      dieSubtext: 'text-orange-300/60',
    }
  };

  const activeFocusStyle = selectedAttribute ? focusColorStyles[selectedAttribute.theme] : null;

  // Initialize states when request changes (hidden/waiting state, prompt user to roll)
  useEffect(() => {
    if (!request) return;
    setSelectedAttribute(null);
    setShowAttributePicker(false);
    setAttributeResult(null);
    setAttributeRolls([]);
    setSkillResults([]);
    setNumericModifier(0);
    setIsRolling(false);

    // Caso a perícia seja = 0, o teste é automaticamente com desvantagem no pop-up
    if (request.type === 'skill' && request.dots === 0) {
      setRollModifier('desvantagem');
    } else {
      setRollModifier('normal');
    }

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
    if (!attributes && !spiritus) return defaultValue;
    if (category === 'Físico' && attributes) {
      if (code === 'FOR') return attributes.physical?.strength ?? 0;
      if (code === 'DES') return attributes.physical?.dexterity ?? 0;
      if (code === 'AGI') return attributes.physical?.agility ?? 0;
      if (code === 'CON') return attributes.physical?.constitution ?? 0;
    } else if (category === 'Mental' && attributes) {
      if (code === 'INT') return attributes.mental?.intelligence ?? 0;
      if (code === 'PER') return attributes.mental?.perception ?? 0;
      if (code === 'RAC') return attributes.mental?.reasoning ?? 0;
      if (code === 'SAB') return attributes.mental?.wisdom ?? 0;
    } else if (category === 'Social' && attributes) {
      if (code === 'EMP') return attributes.social?.empathy ?? 0;
      if (code === 'MAN') return attributes.social?.manipulation ?? 0;
      if (code === 'EXP') return attributes.social?.expression ?? 0;
      if (code === 'RES') return attributes.social?.resilience ?? 0;
    } else if (category === 'Spiritus') {
      if (code === 'FLUX') return spiritus?.fluxo ?? defaultValue;
      if (code === 'PATR') return spiritus?.patrono ?? defaultValue;
    }
    return defaultValue;
  };

  const attributeGroups = [
    {
      category: 'Físico',
      focusName: 'Físico',
      focusBadge: focusConfig?.physical || 'F1',
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
      focusName: 'Mental',
      focusBadge: focusConfig?.mental || 'F2',
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
      focusName: 'Social',
      focusBadge: focusConfig?.social || 'SF',
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
    {
      category: 'Spiritus',
      focusName: 'Spiritus / Fluxo',
      tag: 'Alma',
      theme: 'amber' as const,
      icon: Zap,
      containerStyle: 'from-amber-950/40 via-amber-900/10 to-transparent border-amber-500/25 shadow-[inset_0_1px_10px_rgba(245,158,11,0.08)]',
      badgeStyle: 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
      tagStyle: 'text-amber-400/80 bg-amber-500/10 border-amber-500/20',
      titleColor: 'text-amber-400',
      activeBorder: 'border-amber-400 bg-amber-500/25 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/60',
      idleClass: 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-400/60 hover:bg-amber-500/15 text-amber-200/90',
      items: [
        { code: 'FLUX', name: 'Fluxo', value: spiritus?.fluxo ?? 1 },
        { code: 'PATR', name: 'Patrono', value: spiritus?.patrono ?? 1 },
      ]
    },
  ];

  const currentSelectedValue = selectedAttribute 
    ? getAttrValue(selectedAttribute.category, selectedAttribute.code, selectedAttribute.value)
    : 0;

  const executeAttributeRoll = (die: DieType, modifier: RollModifier = rollModifier) => {
    setIsRolling(true);
    setAttributeResult(null);
    setAttributeRolls([]);

    const sides = DIE_SIDES[die];
    let counter = 0;
    const maxIterations = 14;

    const interval = setInterval(() => {
      setAttributeResult(Math.floor(Math.random() * sides) + 1);
      counter++;
      if (counter >= maxIterations) {
        clearInterval(interval);
        if (modifier === 'normal') {
          const finalVal = Math.floor(Math.random() * sides) + 1;
          setAttributeResult(finalVal);
          setAttributeRolls([{ val: finalVal, isDiscarded: false }]);
        } else {
          const val1 = Math.floor(Math.random() * sides) + 1;
          const val2 = Math.floor(Math.random() * sides) + 1;
          
          let keptVal: number;
          let discardedIndex: number;
          if (modifier === 'vantagem') {
            // Vantagem: descarta o menor, mantém o maior
            if (val1 < val2) {
              discardedIndex = 0;
              keptVal = val2;
            } else {
              discardedIndex = 1;
              keptVal = val1;
            }
          } else {
            // Desvantagem: descarta o maior, mantém o menor
            if (val1 > val2) {
              discardedIndex = 0;
              keptVal = val2;
            } else {
              discardedIndex = 1;
              keptVal = val1;
            }
          }
          setAttributeResult(keptVal);
          setAttributeRolls([
            { val: val1, isDiscarded: discardedIndex === 0 },
            { val: val2, isDiscarded: discardedIndex === 1 }
          ]);
        }
        setIsRolling(false);
        setLandedAnimationKey(Date.now());
      }
    }, 30);
  };

  const executeSkillRoll = (baseCount: number, modifier: RollModifier = rollModifier) => {
    setIsRolling(true);
    setSkillResults([]);

    const hasExtraDie = modifier !== 'normal';
    const initialDiceCount = baseCount + (hasExtraDie ? 1 : 0);

    let counter = 0;
    const maxIterations = 15;

    const interval = setInterval(() => {
      // Efeito Slot Reel: troca rápida de números no mesmo lugar
      const fakeDice: SkillDieRoll[] = Array.from({ length: initialDiceCount }).map((_, i) => ({
        id: `slot-${i}`,
        val: Math.floor(Math.random() * 10) + 1,
        isExplosion: false,
        chainIndex: 0
      }));
      setSkillResults(fakeDice);
      counter++;

      if (counter >= maxIterations) {
        clearInterval(interval);

        // 1. Rola dados base
        const baseRolls: SkillDieRoll[] = [];
        for (let i = 0; i < initialDiceCount; i++) {
          baseRolls.push({
            id: `base-${i}`,
            val: Math.floor(Math.random() * 10) + 1,
            isExplosion: false,
            chainIndex: 0
          });
        }

        // 2. Aplica descarte se houver Vantagem ou Desvantagem
        if (modifier === 'vantagem') {
          // Descarta o menor dado
          let minVal = 11;
          let minIdx = -1;
          baseRolls.forEach((r, idx) => {
            if (r.val < minVal) {
              minVal = r.val;
              minIdx = idx;
            }
          });
          if (minIdx !== -1) {
            baseRolls[minIdx].isDiscarded = true;
            baseRolls[minIdx].discardReason = 'Menor descartado (Vantagem)';
          }
        } else if (modifier === 'desvantagem') {
          // Descarta o maior dado
          let maxVal = -1;
          let maxIdx = -1;
          baseRolls.forEach((r, idx) => {
            if (r.val > maxVal) {
              maxVal = r.val;
              maxIdx = idx;
            }
          });
          if (maxIdx !== -1) {
            baseRolls[maxIdx].isDiscarded = true;
            baseRolls[maxIdx].discardReason = 'Maior descartado (Desvantagem)';
          }
        }

        // 3. Explosão de 10 apenas para dados válidos (não descartados)
        const finalRolls: SkillDieRoll[] = [...baseRolls];
        const queue: { id: string; chainIndex: number }[] = [];

        baseRolls.forEach((die) => {
          if (!die.isDiscarded && die.val === 10) {
            queue.push({
              id: `exp-${die.id}-${Math.random().toString(36).substring(7)}`,
              chainIndex: 1
            });
          }
        });

        let totalExplosions = 0;
        const MAX_SAFETY = 50;

        while (queue.length > 0 && totalExplosions < MAX_SAFETY) {
          const item = queue.shift()!;
          totalExplosions++;
          const val = Math.floor(Math.random() * 10) + 1;
          finalRolls.push({
            id: item.id,
            val,
            isExplosion: true,
            chainIndex: item.chainIndex,
            isDiscarded: false
          });

          // 10 Explodes ad infinitum!
          if (val === 10) {
            queue.push({
              id: `exp-${item.id}-${Math.random().toString(36).substring(7)}`,
              chainIndex: item.chainIndex + 1
            });
          }
        }

        setSkillResults(finalRolls);
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
    },
    blue: {
      text: 'text-blue-400',
      border: 'border-blue-500/40',
      glow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]',
      bgGlow: 'bg-blue-500/10'
    },
    orange: {
      text: 'text-orange-400',
      border: 'border-orange-500/40',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
      bgGlow: 'bg-orange-500/10'
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
                          {'focusBadge' in group && (
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                              {(group as any).focusBadge}
                            </span>
                          )}
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
                    : request.type === 'domain'
                      ? 'Rolagem de Domínio Elemental'
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
              {/* Seletor de Condição: Normal, Vantagem (+1d, descarta menor), Desvantagem (+1d, descarta maior) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  Condição do Teste:
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setRollModifier('normal');
                      if (attributeResult !== null) executeAttributeRoll(selectedDie, 'normal');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rollModifier === 'normal'
                        ? 'bg-white/15 text-white shadow-xs'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRollModifier('vantagem');
                      if (attributeResult !== null) executeAttributeRoll(selectedDie, 'vantagem');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      rollModifier === 'vantagem'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                        : 'text-white/50 hover:text-emerald-300 hover:bg-emerald-500/5'
                    }`}
                    title="Rola +1 dado e descarta o menor"
                  >
                    <span>Vantagem</span>
                    <span className="text-[9px] font-mono opacity-80">(+1d)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRollModifier('desvantagem');
                      if (attributeResult !== null) executeAttributeRoll(selectedDie, 'desvantagem');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      rollModifier === 'desvantagem'
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'text-white/50 hover:text-rose-300 hover:bg-rose-500/5'
                    }`}
                    title="Rola +1 dado e descarta o maior"
                  >
                    <span>Desvantagem</span>
                    <span className="text-[9px] font-mono opacity-80">(+1d)</span>
                  </button>
                </div>
              </div>

              {/* Modificador Numérico: 7 botões (-5, -3, -1, 0, +1, +3, +5) com soma cumulativa */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    Modificador:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      numericModifier === 0
                        ? 'bg-white/5 border-white/10 text-white/50'
                        : numericModifier > 0
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                    }`}>
                      {numericModifier > 0 ? `+${numericModifier}` : numericModifier}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
                  {[-5, -3, -1, 0, 1, 3, 5].map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setNumericModifier(prev => mod === 0 ? 0 : prev + mod)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 border ${
                        mod === 0
                          ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/15 hover:border-white/20'
                          : mod > 0
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/50 hover:text-white'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/25 hover:border-rose-500/50 hover:text-white'
                      }`}
                      title={mod === 0 ? 'Zerar modificador' : `Somar ${mod > 0 ? `+${mod}` : mod} ao modificador`}
                    >
                      {mod > 0 ? `+${mod}` : mod}
                    </button>
                  ))}
                </div>
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
              {(() => {
                const effectiveTarget = request.value + numericModifier;
                const isSuccess = attributeResult !== null && attributeResult <= effectiveTarget;
                return (
                  <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/[0.01] border border-white/5 rounded-2xl relative overflow-hidden">
                    <span className="text-[10px] tracking-widest uppercase text-white/40 font-semibold mb-2">
                      Resultado no {selectedDie.toUpperCase()} {rollModifier !== 'normal' ? `(${rollModifier === 'vantagem' ? 'Vantagem: 2 dados' : 'Desvantagem: 2 dados'})` : ''}
                    </span>

                    {attributeResult === null && !isRolling ? (
                      <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
                        <div className={`w-14 h-14 rounded-2xl border ${themeColors.border} ${themeColors.bgGlow} flex items-center justify-center mb-1`}>
                          <Dices size={28} className={themeColors.text} />
                        </div>
                        <span className="text-xs text-white/70 font-medium">Aguardando Rolagem</span>
                        <span className="text-[11px] text-white/40 max-w-xs">
                          {rollModifier !== 'normal' 
                            ? `Serão rolados 2${selectedDie} (${rollModifier === 'vantagem' ? 'menor será descartado' : 'maior será descartado'})`
                            : 'Defina a dificuldade acima e clique no botão abaixo para girar o dado'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Exibição dos dados rolados quando em vantagem ou desvantagem */}
                        {!isRolling && attributeRolls.length > 1 && (
                          <div className="flex items-center gap-2 mb-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-white/40">Faces:</span>
                            {attributeRolls.map((d, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 ${
                                  d.isDiscarded
                                    ? 'line-through opacity-40 bg-rose-950/40 border-rose-500/30 text-rose-300'
                                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                }`}
                                title={d.isDiscarded ? (rollModifier === 'vantagem' ? 'Menor descartado' : 'Maior descartado') : 'Mantido'}
                              >
                                <span>{d.val}</span>
                                <span className="text-[8px] no-underline uppercase tracking-tight">
                                  {d.isDiscarded ? (rollModifier === 'vantagem' ? 'menor desc.' : 'maior desc.') : 'mantido'}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div 
                          key={landedAnimationKey || 'attr-res'}
                          className={`relative flex items-center justify-center my-2 ${!isRolling && landedAnimationKey > 0 ? 'animate-shake-impact' : ''}`}
                        >
                          <div className={`text-6xl font-light tracking-tight transition-transform ${isRolling ? 'scale-110 opacity-70 blur-xs font-mono font-bold' : 'scale-100'} ${
                            isSuccess
                              ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)] font-normal' 
                              : 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] font-normal'
                          }`}>
                            {attributeResult !== null ? attributeResult : '-'}
                          </div>
                        </div>

                        {!isRolling && attributeResult !== null && (
                          <div className="mt-3 flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-200">
                            {isSuccess ? (
                              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-sm bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                                <CheckCircle2 size={16} />
                                Sucesso! ({attributeResult} ≤ {effectiveTarget})
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-widest text-sm bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                <XCircle size={16} />
                                Falha ({attributeResult} &gt; {effectiveTarget})
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Action Button */}
              {(() => {
                const numModLabel = numericModifier !== 0 ? ` [${numericModifier > 0 ? `+${numericModifier}` : numericModifier}]` : '';
                return (
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
                    {attributeResult === null 
                      ? `Girar Dado (${rollModifier !== 'normal' ? '2' : '1'}${selectedDie}${rollModifier !== 'normal' ? ` • ${rollModifier === 'vantagem' ? 'Vantagem' : 'Desvantagem'}` : ''}${numModLabel})` 
                      : `Rolar Novamente (${rollModifier !== 'normal' ? '2' : '1'}${selectedDie}${rollModifier !== 'normal' ? ` • ${rollModifier === 'vantagem' ? 'Vantagem' : 'Desvantagem'}` : ''}${numModLabel})`}
                  </button>
                );
              })()}
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
              {/* Seletor de Condição: Normal, Vantagem (+1d, descarta menor), Desvantagem (+1d, descarta maior) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    Condição do Teste:
                  </span>
                  {request.type === 'skill' && request.dots === 0 && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>Perícia 0</span>
                      <span className="text-rose-300/80 font-normal">➔ Auto Desvantagem</span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setRollModifier('normal');
                      if (skillResults.length > 0) executeSkillRoll(skillDiceCount, 'normal');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rollModifier === 'normal'
                        ? 'bg-white/15 text-white shadow-xs'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRollModifier('vantagem');
                      if (skillResults.length > 0) executeSkillRoll(skillDiceCount, 'vantagem');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      rollModifier === 'vantagem'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                        : 'text-white/50 hover:text-emerald-300 hover:bg-emerald-500/5'
                    }`}
                    title="Rola +1 dado e descarta o menor resultado"
                  >
                    <span>Vantagem</span>
                    <span className="text-[9px] font-mono opacity-80">(+1d)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRollModifier('desvantagem');
                      if (skillResults.length > 0) executeSkillRoll(skillDiceCount, 'desvantagem');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      rollModifier === 'desvantagem'
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'text-white/50 hover:text-rose-300 hover:bg-rose-500/5'
                    }`}
                    title="Rola +1 dado e descarta o maior resultado"
                  >
                    <span>Desvantagem</span>
                    <span className="text-[9px] font-mono opacity-80">(+1d)</span>
                  </button>
                </div>
              </div>

              {/* Modificador Numérico: 7 botões (-5, -3, -1, 0, +1, +3, +5) com soma cumulativa */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    Modificador:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      numericModifier === 0
                        ? 'bg-white/5 border-white/10 text-white/50'
                        : numericModifier > 0
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                    }`}>
                      {numericModifier > 0 ? `+${numericModifier}` : numericModifier}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
                  {[-5, -3, -1, 0, 1, 3, 5].map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setNumericModifier(prev => mod === 0 ? 0 : prev + mod)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 border ${
                        mod === 0
                          ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/15 hover:border-white/20'
                          : mod > 0
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/50 hover:text-white'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/25 hover:border-rose-500/50 hover:text-white'
                      }`}
                      title={mod === 0 ? 'Zerar modificador' : `Somar ${mod > 0 ? `+${mod}` : mod} ao modificador`}
                    >
                      {mod > 0 ? `+${mod}` : mod}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantidade de Dados Base */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs">
                <div className="flex flex-col">
                  <span className="text-white/70 font-medium">Quantidade de Dados Base:</span>
                  {rollModifier !== 'normal' && (
                    <span className="text-[10px] text-white/40">
                      Total a rolar: <strong className="text-white/80">{skillDiceCount + 1}d10</strong> ({skillDiceCount}d10 + 1d10 {rollModifier === 'vantagem' ? 'Vantagem' : 'Desvantagem'})
                    </span>
                  )}
                </div>
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
                      Resultado dos dados
                    </span>
                  </div>

                  {/* Botão para Somar Atributo (Fluxo e demais atributos disponíveis no modal completo) */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttributePicker(true)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedAttribute && activeFocusStyle
                          ? activeFocusStyle.btnActive
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white hover:border-white/20'
                      }`}
                      title={selectedAttribute ? `Atributo: ${selectedAttribute.name} (+${currentSelectedValue}). Clique para trocar` : 'Escolher um atributo para somar às faces'}
                    >
                      <Plus size={13} className={selectedAttribute && activeFocusStyle ? activeFocusStyle.plusIcon : 'text-white/60'} />
                      <span>{selectedAttribute ? `${selectedAttribute.name} (+${currentSelectedValue})` : '+ Somar'}</span>
                    </button>
                  </div>
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
                        Ajuste os dados ({skillDiceCount + (rollModifier !== 'normal' ? 1 : 0)}d10) e clique em "Girar Dados" abaixo
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
                        className={`relative px-3 py-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                          die.isDiscarded
                            ? 'opacity-40 border-dashed border-rose-500/50 bg-rose-950/20 text-rose-300'
                            : die.val === 10
                              ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)] font-bold'
                              : die.isExplosion
                                ? 'bg-white/10 border-white/20 text-white font-medium'
                                : 'bg-white/[0.03] border-white/10 text-slate-300 font-light'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`text-base ${die.isDiscarded ? 'line-through' : ''}`}>{die.val}</span>
                          {!die.isDiscarded && die.val === 10 && (
                            <Zap size={12} className="text-amber-400 animate-bounce" />
                          )}
                          {!die.isDiscarded && die.isExplosion && die.val !== 10 && (
                            <span className="text-[8px] uppercase tracking-tighter text-white/40">+d10</span>
                          )}
                        </div>
                        {die.isDiscarded && (
                          <span className="text-[8px] uppercase tracking-tight text-rose-400 font-semibold no-underline">
                            {rollModifier === 'vantagem' ? 'menor desc.' : 'maior desc.'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Nova Linha: Resultado da soma de cada face separadamente + atributo e/ou modificador (Apenas dados não descartados) */}
                {(selectedAttribute || numericModifier !== 0) && skillResults.length > 0 && !isRolling && (() => {
                  const totalModifier = currentSelectedValue + numericModifier;
                  // Mantém a cor da perícia testada no resultado
                  const skillThemeStyle = focusColorStyles[currentTheme] || focusColorStyles.violet;
                  const displayStyle = skillThemeStyle;

                  let labelText = '';
                  if (selectedAttribute && numericModifier !== 0) {
                    labelText = `Faces + ${selectedAttribute.name} (+${currentSelectedValue}) ${numericModifier > 0 ? `+ Mod (+${numericModifier})` : `- Mod (${Math.abs(numericModifier)})`} (= ${totalModifier >= 0 ? `+${totalModifier}` : totalModifier}):`;
                  } else if (selectedAttribute) {
                    labelText = `Faces + ${selectedAttribute.name} (+${currentSelectedValue}):`;
                  } else {
                    labelText = `Faces + Modificador (${numericModifier > 0 ? `+${numericModifier}` : numericModifier}):`;
                  }

                  return (
                    <div className={`flex flex-col gap-2 p-3.5 border rounded-2xl animate-in fade-in-50 slide-in-from-top-1 duration-200 ${displayStyle.sumBox}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 ${displayStyle.sumTitle}`}>
                          <Plus size={12} />
                          {labelText}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAttribute(null);
                            setNumericModifier(0);
                          }}
                          className="text-[10px] text-white/40 hover:text-rose-300 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/5"
                          title="Remover soma e modificador"
                        >
                          Limpar
                        </button>
                      </div>

                      <div className="p-2.5 bg-black/20 border border-white/5 rounded-xl min-h-[56px] max-h-48 overflow-y-auto flex flex-wrap gap-2 items-center justify-start custom-scrollbar">
                        {skillResults.filter(die => !die.isDiscarded).map((die, idx) => {
                          const sumVal = die.val + totalModifier;
                          return (
                            <div
                              key={`sum-${die.id}-${idx}`}
                              className={`relative px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center min-w-[48px] transition-all ${
                                die.val === 10
                                  ? 'bg-amber-500/20 border-amber-400/70 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                                  : displayStyle.dieCard
                              }`}
                            >
                              <span className="text-base font-bold leading-tight">
                                {sumVal}
                              </span>
                              <span className={`text-[8px] font-mono leading-none mt-0.5 ${die.val === 10 ? 'text-amber-200/60' : displayStyle.dieSubtext}`}>
                                {die.val}{totalModifier >= 0 ? `+${totalModifier}` : `${totalModifier}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Roll button */}
              {(() => {
                const totalRollDice = skillDiceCount + (rollModifier !== 'normal' ? 1 : 0);
                const modTag = rollModifier === 'vantagem' ? ' • Vantagem' : rollModifier === 'desvantagem' ? ' • Desvantagem' : '';
                const numModTag = numericModifier !== 0 ? ` [${numericModifier > 0 ? `+${numericModifier}` : numericModifier}]` : '';
                return (
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
                      ? `Girar Dados (${totalRollDice}d10${modTag}${numModTag})` 
                      : `Rolar Novamente (${totalRollDice}d10${modTag}${numModTag})`}
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
