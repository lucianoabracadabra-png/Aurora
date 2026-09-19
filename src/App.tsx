import React, { useState, useEffect } from 'react';
import { initialCharacterData } from './initialState';
import { CharacterData, Identity as IdentityType, Alignment as AlignmentType, Personality as PersonalityType, Attributes as AttributesType, Skills as SkillsType, Domains as DomainsType, Ability, Trait } from './types';
import { User, ScrollText, Sparkles, Check, Lock, Unlock, X, Heart, Minus, Plus, RotateCcw } from 'lucide-react';

import { BentoBox } from './components/BentoBox';
import { Identity } from './components/Identity';
import { Alignment } from './components/Alignment';
import { Personality } from './components/Personality';
import { Domains } from './components/Domains';
import { NaturezaTracker } from './components/NaturezaTracker';
import { Abilities } from './components/Abilities';
import { Traits } from './components/Traits';
import { DotRating } from './components/DotRating';
import { HealthTracker } from './components/HealthTracker';
import { DiceRollerModal, DiceRollRequest } from './components/DiceRollerModal';
import { CustomSkill } from './types';

const AttributeInput = ({ label, value, onChange, theme, readonly, onRoll }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  theme: 'rose' | 'cyan' | 'emerald';
  readonly: boolean;
  onRoll?: () => void;
}) => {
  const themeColors = {
    rose: 'border-rose-500/20 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    cyan: 'border-cyan-500/20 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]',
    emerald: 'border-emerald-500/20 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
  };

  // Reduz automaticamente o nome do atributo para 5 letras para preservar o espaçamento e não vazar da caixa
  const displayLabel = label.length > 5 ? label.slice(0, 5) : label;

  return (
    <div 
      onClick={() => {
        if (readonly && onRoll) onRoll();
      }}
      title={readonly ? (onRoll ? `Clique para rolar teste de ${label} (${value})` : label) : label}
      className={`relative group/attr flex flex-col flex-1 items-center justify-center p-2 sm:p-3 rounded-2xl border bg-white/[0.015] transition-all select-none ${
        themeColors[theme].split(' ')[0]
      } ${readonly && onRoll ? 'cursor-pointer hover:bg-white/[0.05] hover:border-white/20 active:scale-[0.98]' : ''}`}
    >
      <span 
        title={label}
        className="text-[9px] uppercase tracking-widest text-white/50 mb-1.5 font-bold group-hover/attr:text-white/80 transition-colors text-center w-full truncate"
      >
        {displayLabel}
      </span>

      <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-auto">
        {!readonly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(Math.max(0, value - 1));
            }}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer shrink-0"
            title="Diminuir"
          >
            -
          </button>
        )}

        {readonly ? (
          <span className={`text-3xl sm:text-4xl font-light leading-none ${themeColors[theme].split(' ').slice(1).join(' ')}`}>
            {value}
          </span>
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange(value + 1);
            }}
            className={`text-2xl sm:text-3xl font-light leading-none cursor-pointer hover:scale-105 transition-transform ${themeColors[theme].split(' ').slice(1).join(' ')}`}
            title="Clique para aumentar (+1)"
          >
            {value}
          </span>
        )}

        {!readonly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(value + 1);
            }}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer shrink-0"
            title="Aumentar"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

const CustomSkillsSection = ({ 
  title, 
  skills, 
  add, 
  update, 
  remove, 
  readonly, 
  theme,
  onRoll
}: { 
  title: string, 
  skills: CustomSkill[], 
  add: (name: string) => void, 
  update: (id: string, v: number) => void, 
  remove: (id: string) => void, 
  readonly: boolean, 
  theme: 'rose'|'cyan'|'emerald',
  onRoll?: (name: string, value: number) => void
}) => {
  const [newSkill, setNewSkill] = React.useState('');
  const titleColors = {
    rose: 'text-rose-400/60',
    cyan: 'text-cyan-400/60',
    emerald: 'text-emerald-400/60'
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className={`text-[10px] tracking-widest uppercase font-medium ${titleColors[theme]}`}>{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {skills.map(s => (
          <div key={s.id} className="relative group">
            <DotRating 
              label={s.name} 
              value={s.value} 
              onChange={(v) => update(s.id, v)} 
              theme={theme} 
              readonly={readonly} 
              onRoll={onRoll ? () => onRoll(s.name, s.value) : undefined}
            />
            {!readonly && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(s.id);
                }} 
                className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30 z-10 cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!readonly && (
        <div className="flex gap-2 items-center">
          <input type="text" placeholder={`Adicionar ${title.toLowerCase()}...`} value={newSkill} onChange={e => setNewSkill(e.target.value)} className="bg-transparent border-b border-white/10 text-xs px-2 py-1.5 text-white flex-1 focus:outline-none focus:border-white/30" />
          <button onClick={() => { if(newSkill) { add(newSkill); setNewSkill(''); } }} className="text-[10px] uppercase font-bold tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-white/70">Add</button>
        </div>
      )}
    </div>
  );
};

const StatIntersectionBox = ({ title, theme, children, manaSpent, manaTotal, onManaChange, readonly }: any) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const themeGlows = {
    rose: 'border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.4)] text-rose-400',
    cyan: 'border-cyan-500/80 shadow-[0_0_25px_rgba(34,211,238,0.4)] text-cyan-400',
    emerald: 'border-emerald-500/80 shadow-[0_0_25px_rgba(52,211,153,0.4)] text-emerald-400'
  };

  const baseBorder = {
    rose: 'border-rose-500/20 shadow-[inset_0_0_30px_rgba(244,63,94,0.03)] text-rose-400/50',
    cyan: 'border-cyan-500/20 shadow-[inset_0_0_30px_rgba(34,211,238,0.03)] text-cyan-400/50',
    emerald: 'border-emerald-500/20 shadow-[inset_0_0_30px_rgba(52,211,153,0.03)] text-emerald-400/50'
  };

  const titleThemeColors = {
    rose: 'text-rose-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400'
  };

  const manaLabels = {
    rose: 'Vigor',
    cyan: 'Foco',
    emerald: 'Graça'
  };

  const currentMana = Math.max(0, manaTotal - manaSpent);
  const percent = manaTotal > 0 ? Math.min(100, Math.max(0, (currentMana / manaTotal) * 100)) : 0;

  const barGradients = {
    rose: 'from-rose-600 via-pink-500 to-rose-400',
    cyan: 'from-cyan-600 via-sky-500 to-cyan-300',
    emerald: 'from-emerald-600 via-green-500 to-emerald-300'
  };

  const barBgGlow = {
    rose: 'bg-rose-500/10',
    cyan: 'bg-cyan-500/10',
    emerald: 'bg-emerald-500/10'
  };

  const adjustMana = (delta: number) => {
    // Note: delta is applied to current mana. So +1 current mana means -1 manaSpent, and vice-versa.
    const newCurrent = Math.min(manaTotal, Math.max(0, currentMana + delta));
    onManaChange(manaTotal - newCurrent);
  };

  const resetMana = () => {
    onManaChange(0);
  };

  return (
    <BentoBox 
      ref={ref}
      title={title} 
      className={`transition-all duration-700 outline-none ${isInView ? themeGlows[theme] : baseBorder[theme]}`}
      titleClassName={`transition-colors duration-700 ${isInView ? titleThemeColors[theme] : baseBorder[theme]}`}
    >
      {/* SEÇÃO DE MANA DO EIXO COM BARRA DE ENERGIA E CONTROLADORES */}
      <div className="flex flex-col gap-2.5 bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-3.5 mb-6 shadow-inner relative overflow-hidden">
        {/* Top Header: Rótulo do Eixo & Valores */}
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-widest uppercase font-bold text-white/70">
              {manaLabels[theme as keyof typeof manaLabels]}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black font-mono tracking-tight drop-shadow-[0_0_12px_currentColor] ${titleThemeColors[theme as keyof typeof titleThemeColors]}`}>
              {currentMana}
            </span>
            <span className="text-[11px] font-mono text-white/40">/ {manaTotal}</span>
          </div>
        </div>

        {/* Barra de Energia Dinâmica (Cresce e Esvazia) */}
        <div className="relative w-full h-3.5 sm:h-4 rounded-full bg-black/60 border border-white/10 p-0.5 overflow-hidden shadow-inner flex items-center">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradients[theme as keyof typeof barGradients]} transition-all duration-300 ease-out relative shadow-[0_0_12px_rgba(255,255,255,0.3)]`}
            style={{ width: `${percent}%` }}
          >
            {/* Brilho da extremidade da barra quando tem mana */}
            {percent > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 rounded-full blur-[1px] shadow-[0_0_8px_white]" />
            )}
          </div>
        </div>

        {/* Escala Contínua de Controladores de Mana Neutros: -5 -3 -1 reset +1 +3 +5 */}
        <div className="grid grid-cols-7 gap-1 pt-1.5 border-t border-white/5 relative z-10 select-none">
          {/* -5 */}
          <button
            type="button"
            onClick={() => adjustMana(-5)}
            disabled={currentMana <= 0}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
            title="Gastar 5 pontos de mana (-5)"
          >
            -5
          </button>

          {/* -3 */}
          <button
            type="button"
            onClick={() => adjustMana(-3)}
            disabled={currentMana <= 0}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
            title="Gastar 3 pontos de mana (-3)"
          >
            -3
          </button>

          {/* -1 */}
          <button
            type="button"
            onClick={() => adjustMana(-1)}
            disabled={currentMana <= 0}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
            title="Gastar 1 ponto de mana (-1)"
          >
            -1
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={resetMana}
            disabled={manaSpent === 0}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer text-center"
            title="Resetar (Recuperar toda a mana)"
          >
            <RotateCcw size={12} className="text-white/60" />
          </button>

          {/* +1 */}
          <button
            type="button"
            onClick={() => adjustMana(1)}
            disabled={currentMana >= manaTotal}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
            title="Recuperar 1 ponto de mana (+1)"
          >
            +1
          </button>

          {/* +3 */}
          <button
            type="button"
            onClick={() => adjustMana(3)}
            disabled={currentMana >= manaTotal}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
            title="Recuperar 3 pontos de mana (+3)"
          >
            +3
          </button>

          {/* +5 */}
          <button
            type="button"
            onClick={() => adjustMana(5)}
            disabled={currentMana >= manaTotal}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
            title="Recuperar 5 pontos de mana (+5)"
          >
            +5
          </button>
        </div>
      </div>
      {children}
    </BentoBox>
  );
};

export default function App() {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<CharacterData>(() => {
    const saved = localStorage.getItem('arcana_character_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Fix missing customSkills for older saves
        if (!parsed.customSkills) {
          parsed.customSkills = { treinamentos: [], ciencias: [], artes: [] };
        } else {
          if (!parsed.customSkills.treinamentos) parsed.customSkills.treinamentos = [];
          if (!parsed.customSkills.ciencias) parsed.customSkills.ciencias = [];
          if (!parsed.customSkills.artes) parsed.customSkills.artes = [];
        }

        // Fix missing manaSpent for older saves
        if (!parsed.manaSpent) {
          parsed.manaSpent = { physical: 0, mental: 0, social: 0 };
        }

        if (!parsed.naturezaSpent) {
          parsed.naturezaSpent = { water: 0, air: 0, anima: 0, fire: 0, earth: 0 };
        }

        const fitHealth = (arr: any, count: number) => {
          const res = Array(count).fill('none');
          if (Array.isArray(arr)) {
            for (let i = 0; i < Math.min(arr.length, count); i++) {
              res[i] = arr[i];
            }
          }
          return res;
        };

        parsed.health = {
          head: fitHealth(parsed.health?.head, 8),
          torso: fitHealth(parsed.health?.torso, 20),
          leftArm: fitHealth(parsed.health?.leftArm, 12),
          rightArm: fitHealth(parsed.health?.rightArm, 12),
          leftLeg: fitHealth(parsed.health?.leftLeg, 16),
          rightLeg: fitHealth(parsed.health?.rightLeg, 16),
        };

        // Migrate to new traits and abilities if they still have the old default or empty ones
        if (parsed.traits && parsed.traits.length <= 2) {
          parsed.traits = initialCharacterData.traits;
          parsed.abilities = initialCharacterData.abilities;
        }
        
        return parsed;
      } catch (e) {
        return initialCharacterData;
      }
    }
    return initialCharacterData;
  });
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'magic'>('profile');
  const [diceRollRequest, setDiceRollRequest] = useState<DiceRollRequest | null>(null);

  const rollAttribute = (name: string, value: number, theme: 'rose' | 'cyan' | 'emerald') => {
    setDiceRollRequest({
      type: 'attribute',
      name,
      value,
      theme,
    });
  };

  const rollSkill = (name: string, dots: number, theme: 'rose' | 'cyan' | 'emerald') => {
    setDiceRollRequest({
      type: 'skill',
      name,
      dots,
      theme,
    });
  };

  const rollPersonality = (name: string, value: number) => {
    setDiceRollRequest({
      type: 'personality',
      name,
      dots: value,
      theme: 'violet',
    });
  };

  // Save to local storage whenever data changes
  useEffect(() => {
    localStorage.setItem('arcana_character_data', JSON.stringify(data));
  }, [data]);

  const updateIdentity = (field: keyof IdentityType, value: string | string[]) => {
    setData((prev) => ({ ...prev, identity: { ...prev.identity, [field]: value } }));
  };

  const updateAlignment = (field: keyof AlignmentType, value: number) => {
    setData((prev) => ({ ...prev, alignment: { ...prev.alignment, [field]: value } }));
  };

  const updatePersonality = (field: keyof PersonalityType, value: number) => {
    setData((prev) => ({ ...prev, personality: { ...prev.personality, [field]: value } }));
  };

  const updateAttributes = (category: keyof AttributesType, field: string, value: number) => {
    setData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [category]: {
          ...prev.attributes[category],
          [field]: value,
        },
      },
    }));
  };

  const updateSkills = (category: keyof SkillsType, field: string, value: number) => {
    setData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: {
          ...prev.skills[category],
          [field]: value,
        },
      },
    }));
  };

  const updateDomains = (field: keyof DomainsType, value: number) => {
    setData((prev) => ({ ...prev, domains: { ...prev.domains, [field]: value } }));
  };

  const addAbility = (ability: Omit<Ability, 'id'>) => {
    const newAbility = { ...ability, id: Math.random().toString(36).substring(7) };
    setData((prev) => ({ ...prev, abilities: [...prev.abilities, newAbility] }));
  };

  const removeAbility = (id: string) => {
    setData((prev) => ({ ...prev, abilities: prev.abilities.filter((a) => a.id !== id) }));
  };

  const addTrait = (trait: Omit<Trait, 'id'>) => {
    const newTrait = { ...trait, id: Math.random().toString(36).substring(7) };
    setData((prev) => ({ ...prev, traits: [...prev.traits, newTrait] }));
  };

  const removeTrait = (id: string) => {
    setData((prev) => ({ ...prev, traits: prev.traits.filter((t) => t.id !== id) }));
  };

  const addCustomSkill = (category: 'treinamentos' | 'ciencias' | 'artes', name: string) => {
    const newSkill = { id: Math.random().toString(36).substring(7), name, value: 0 };
    setData((prev) => ({
      ...prev,
      customSkills: {
        ...prev.customSkills,
        [category]: [...prev.customSkills[category], newSkill],
      }
    }));
  };

  const updateCustomSkill = (category: 'treinamentos' | 'ciencias' | 'artes', id: string, value: number) => {
    setData((prev) => ({
      ...prev,
      customSkills: {
        ...prev.customSkills,
        [category]: prev.customSkills[category].map(skill => skill.id === id ? { ...skill, value } : skill),
      }
    }));
  };

  const removeCustomSkill = (category: 'treinamentos' | 'ciencias' | 'artes', id: string) => {
    setData((prev) => ({
      ...prev,
      customSkills: {
        ...prev.customSkills,
        [category]: prev.customSkills[category].filter(skill => skill.id !== id),
      }
    }));
  };

  useEffect(() => {
    const handleScroll = () => {
      const profile = document.getElementById('profile');
      const stats = document.getElementById('stats');
      const magic = document.getElementById('magic');

      if (!profile || !stats || !magic) return;

      const scrollPosition = window.scrollY + window.innerHeight / 3;

      if (scrollPosition < stats.offsetTop) {
        setActiveTab('profile');
      } else if (scrollPosition >= stats.offsetTop && scrollPosition < magic.offsetTop) {
        setActiveTab('stats');
      } else {
        setActiveTab('magic');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial tab
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-slate-200 font-sans pb-24 selection:bg-violet-500/30 relative overflow-hidden">
      {/* Magical Background Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#030014]/60 backdrop-blur-2xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <h1 className="text-sm tracking-[0.3em] font-light uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 drop-shadow-[0_0_12px_rgba(167,139,250,0.5)]">
          Arcana
        </h1>
        <div className="flex items-center gap-3">
          <button 
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              isEditing 
                ? 'bg-rose-500/10 border-rose-400/30 text-rose-400 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
            }`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Travar Ficha' : 'Editar Ficha'}
          >
            {isEditing ? <Unlock size={14} /> : <Lock size={14} />}
          </button>
          <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-violet-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(167,139,250,0.2)]">
            <Sparkles size={14} className="text-violet-400 drop-shadow-[0_0_5px_currentColor]" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 flex flex-col gap-8 max-w-lg mx-auto relative z-0">
        <section id="profile" className="flex flex-col gap-6">
          <BentoBox 
            title="Identidade" 
            titleClassName="text-violet-400"
            className="cursor-pointer group"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest('input') || 
                target.closest('textarea') || 
                target.closest('button') || 
                target.closest('.language-selector-container') ||
                target.closest('.alignment-container') ||
                target.closest('.identity-image-container')
              ) {
                return;
              }
              setIsIdentityExpanded(!isIdentityExpanded);
            }}
            rightContent={
              <div className="flex gap-1 transition-all duration-300">
                {isIdentityExpanded ? (
                  <>
                    <div className="w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_currentColor]" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-60" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30" />
                  </>
                ) : (
                  <>
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30 group-hover:bg-violet-400 group-hover:opacity-50 transition-all duration-300" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30 group-hover:bg-violet-400 group-hover:opacity-50 transition-all duration-300" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30 group-hover:bg-violet-400 group-hover:opacity-50 transition-all duration-300" />
                  </>
                )}
              </div>
            }
          >
            <Identity data={data.identity} update={updateIdentity} readonly={!isEditing} expanded={isIdentityExpanded} />
            
            <div 
              className="mt-6 pt-6 border-t border-white/5 alignment-container"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[10px] tracking-widest text-violet-400/60 uppercase font-medium mb-4">Alinhamento</h3>
              <Alignment data={data.alignment} update={updateAlignment} readonly={!isEditing} expanded={isIdentityExpanded} />
            </div>
          </BentoBox>

          <BentoBox title="Personalidade" titleClassName="text-violet-400">
            <Personality 
              data={data.personality} 
              update={updatePersonality} 
              readonly={!isEditing} 
              onRoll={rollPersonality}
            />
          </BentoBox>

          <BentoBox title="Vantagens & Desvantagens" titleClassName="text-violet-400">
            <Traits data={data.traits} add={addTrait} remove={removeTrait} readonly={!isEditing} />
          </BentoBox>

          {/* PONTOS DE VIDA - Solto no fundo */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px] tracking-[0.25em] uppercase">
                <Heart size={15} className="fill-rose-500/20 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                <span>Pontos de Vida</span>
              </div>
              <div className="flex items-center gap-2.5 text-[9px] text-white/50 tracking-wider">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" /> Simples</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" /> Letal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.5)]" /> Agravado</span>
              </div>
            </div>

            <HealthTracker 
              data={data.health} 
              update={(part, idx, val) => setData(prev => {
                const newPart = [...prev.health[part]];
                newPart[idx] = val;
                return { ...prev, health: { ...prev.health, [part]: newPart } };
              })}
              readonly={false} 
            />
          </div>
        </section>

        <section id="stats" className="flex flex-col gap-6">
          {/* FÍSICO */}
          <StatIntersectionBox 
            title="Físico" 
            theme="rose"
            manaTotal={(Object.values(data.attributes.physical) as number[]).reduce((a, b) => a + b, 0)}
            manaSpent={data.manaSpent.physical}
            onManaChange={(v: number) => setData(prev => ({ ...prev, manaSpent: { ...prev.manaSpent, physical: v } }))}
            readonly={!isEditing}
          >
            <div className="flex flex-col gap-6" tabIndex={0}>
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] tracking-widest text-rose-400/60 uppercase font-medium mb-1 text-left">Atributos</h3>
                <div className="grid grid-cols-4 gap-3">
                  <AttributeInput label="Força" value={data.attributes.physical.strength} onChange={(v: number) => updateAttributes('physical', 'strength', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Força', data.attributes.physical.strength, 'rose')} />
                  <AttributeInput label="Destreza" value={data.attributes.physical.dexterity} onChange={(v: number) => updateAttributes('physical', 'dexterity', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Destreza', data.attributes.physical.dexterity, 'rose')} />
                  <AttributeInput label="Agilidade" value={data.attributes.physical.agility} onChange={(v: number) => updateAttributes('physical', 'agility', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Agilidade', data.attributes.physical.agility, 'rose')} />
                  <AttributeInput label="Constituição" value={data.attributes.physical.constitution} onChange={(v: number) => updateAttributes('physical', 'constitution', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Constituição', data.attributes.physical.constitution, 'rose')} />
                </div>
              </div>
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
              
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] tracking-widest text-rose-400/60 uppercase font-medium text-left">Perícias</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DotRating label="Armas Brancas" value={data.skills.physical.melee} onChange={(v) => updateSkills('physical', 'melee', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Armas Brancas', data.skills.physical.melee, 'rose')} />
                  <DotRating label="Armas de Fogo" value={data.skills.physical.firearms} onChange={(v) => updateSkills('physical', 'firearms', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Armas de Fogo', data.skills.physical.firearms, 'rose')} />
                  <DotRating label="Arquearia" value={data.skills.physical.archery} onChange={(v) => updateSkills('physical', 'archery', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Arquearia', data.skills.physical.archery, 'rose')} />
                  <DotRating label="Arremesso" value={data.skills.physical.throwing} onChange={(v) => updateSkills('physical', 'throwing', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Arremesso', data.skills.physical.throwing, 'rose')} />
                  <DotRating label="Briga" value={data.skills.physical.brawl} onChange={(v) => updateSkills('physical', 'brawl', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Briga', data.skills.physical.brawl, 'rose')} />
                  <DotRating label="Combate" value={data.skills.physical.combat} onChange={(v) => updateSkills('physical', 'combat', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Combate', data.skills.physical.combat, 'rose')} />
                  <DotRating label="Furtividade" value={data.skills.physical.stealth} onChange={(v) => updateSkills('physical', 'stealth', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Furtividade', data.skills.physical.stealth, 'rose')} />
                  <DotRating label="Prontidão" value={data.skills.physical.alertness} onChange={(v) => updateSkills('physical', 'alertness', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Prontidão', data.skills.physical.alertness, 'rose')} />
                </div>
              </div>
                
              <div className="h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent w-full" />
              
              <CustomSkillsSection 
                title="Treinamentos" 
                skills={data.customSkills.treinamentos} 
                add={(name) => addCustomSkill('treinamentos', name)} 
                update={(id, v) => updateCustomSkill('treinamentos', id, v)} 
                remove={(id) => removeCustomSkill('treinamentos', id)} 
                readonly={!isEditing} 
                theme="rose" 
                onRoll={(name, val) => rollSkill(name, val, 'rose')}
              />
            </div>
          </StatIntersectionBox>

          {/* MENTAL */}
          <StatIntersectionBox 
            title="Mental" 
            theme="cyan"
            manaTotal={(Object.values(data.attributes.mental) as number[]).reduce((a, b) => a + b, 0)}
            manaSpent={data.manaSpent.mental}
            onManaChange={(v: number) => setData(prev => ({ ...prev, manaSpent: { ...prev.manaSpent, mental: v } }))}
            readonly={!isEditing}
          >
            <div className="flex flex-col gap-6" tabIndex={0}>
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] tracking-widest text-cyan-400/60 uppercase font-medium mb-1 text-left">Atributos</h3>
                <div className="grid grid-cols-4 gap-3">
                  <AttributeInput label="Inteligência" value={data.attributes.mental.intelligence} onChange={(v: number) => updateAttributes('mental', 'intelligence', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Inteligência', data.attributes.mental.intelligence, 'cyan')} />
                  <AttributeInput label="Percepção" value={data.attributes.mental.perception} onChange={(v: number) => updateAttributes('mental', 'perception', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Percepção', data.attributes.mental.perception, 'cyan')} />
                  <AttributeInput label="Raciocínio" value={data.attributes.mental.reasoning} onChange={(v: number) => updateAttributes('mental', 'reasoning', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Raciocínio', data.attributes.mental.reasoning, 'cyan')} />
                  <AttributeInput label="Sabedoria" value={data.attributes.mental.wisdom} onChange={(v: number) => updateAttributes('mental', 'wisdom', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Sabedoria', data.attributes.mental.wisdom, 'cyan')} />
                </div>
              </div>
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] tracking-widest text-cyan-400/60 uppercase font-medium text-left">Perícias</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DotRating label="Acadêmicos" value={data.skills.mental.academics} onChange={(v) => updateSkills('mental', 'academics', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Acadêmicos', data.skills.mental.academics, 'cyan')} />
                  <DotRating label="Armadilhas" value={data.skills.mental.traps} onChange={(v) => updateSkills('mental', 'traps', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Armadilhas', data.skills.mental.traps, 'cyan')} />
                  <DotRating label="Intuição" value={data.skills.mental.intuition} onChange={(v) => updateSkills('mental', 'intuition', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Intuição', data.skills.mental.intuition, 'cyan')} />
                  <DotRating label="Investigação" value={data.skills.mental.investigation} onChange={(v) => updateSkills('mental', 'investigation', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Investigação', data.skills.mental.investigation, 'cyan')} />
                  <DotRating label="Medicina" value={data.skills.mental.medicine} onChange={(v) => updateSkills('mental', 'medicine', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Medicina', data.skills.mental.medicine, 'cyan')} />
                  <DotRating label="Ocultismo" value={data.skills.mental.occultism} onChange={(v) => updateSkills('mental', 'occultism', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Ocultismo', data.skills.mental.occultism, 'cyan')} />
                  <DotRating label="Segurança" value={data.skills.mental.security} onChange={(v) => updateSkills('mental', 'security', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Segurança', data.skills.mental.security, 'cyan')} />
                  <DotRating label="Sobrevivência" value={data.skills.mental.survival} onChange={(v) => updateSkills('mental', 'survival', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Sobrevivência', data.skills.mental.survival, 'cyan')} />
                </div>
              </div>
                
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent w-full" />
              
              <CustomSkillsSection 
                title="Ciências" 
                skills={data.customSkills.ciencias} 
                add={(name) => addCustomSkill('ciencias', name)} 
                update={(id, v) => updateCustomSkill('ciencias', id, v)} 
                remove={(id) => removeCustomSkill('ciencias', id)} 
                readonly={!isEditing} 
                theme="cyan" 
                onRoll={(name, val) => rollSkill(name, val, 'cyan')}
              />
            </div>
          </StatIntersectionBox>

          {/* SOCIAL */}
          <StatIntersectionBox 
            title="Social" 
            theme="emerald"
            manaTotal={(Object.values(data.attributes.social) as number[]).reduce((a, b) => a + b, 0)}
            manaSpent={data.manaSpent.social}
            onManaChange={(v: number) => setData(prev => ({ ...prev, manaSpent: { ...prev.manaSpent, social: v } }))}
            readonly={!isEditing}
          >
            <div className="flex flex-col gap-6" tabIndex={0}>
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] tracking-widest text-emerald-400/60 uppercase font-medium mb-1 text-left">Atributos</h3>
                <div className="grid grid-cols-4 gap-3">
                  <AttributeInput label="Empatia" value={data.attributes.social.empathy} onChange={(v: number) => updateAttributes('social', 'empathy', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Empatia', data.attributes.social.empathy, 'emerald')} />
                  <AttributeInput label="Manipulação" value={data.attributes.social.manipulation} onChange={(v: number) => updateAttributes('social', 'manipulation', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Manipulação', data.attributes.social.manipulation, 'emerald')} />
                  <AttributeInput label="Expressão" value={data.attributes.social.expression} onChange={(v: number) => updateAttributes('social', 'expression', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Expressão', data.attributes.social.expression, 'emerald')} />
                  <AttributeInput label="Resiliência" value={data.attributes.social.resilience} onChange={(v: number) => updateAttributes('social', 'resilience', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Resiliência', data.attributes.social.resilience, 'emerald')} />
                </div>
              </div>
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] tracking-widest text-emerald-400/60 uppercase font-medium text-left">Perícias</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DotRating label="Barganha" value={data.skills.social.bargain} onChange={(v) => updateSkills('social', 'bargain', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Barganha', data.skills.social.bargain, 'emerald')} />
                  <DotRating label="Adestramento" value={data.skills.social.taming} onChange={(v) => updateSkills('social', 'taming', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Adestramento', data.skills.social.taming, 'emerald')} />
                  <DotRating label="Etiqueta" value={data.skills.social.etiquette} onChange={(v) => updateSkills('social', 'etiquette', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Etiqueta', data.skills.social.etiquette, 'emerald')} />
                  <DotRating label="Intimidação" value={data.skills.social.intimidation} onChange={(v) => updateSkills('social', 'intimidation', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Intimidação', data.skills.social.intimidation, 'emerald')} />
                  <DotRating label="Lábia" value={data.skills.social.smoothTalk} onChange={(v) => updateSkills('social', 'smoothTalk', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Lábia', data.skills.social.smoothTalk, 'emerald')} />
                  <DotRating label="Liderança" value={data.skills.social.leadership} onChange={(v) => updateSkills('social', 'leadership', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Liderança', data.skills.social.leadership, 'emerald')} />
                  <DotRating label="Montaria" value={data.skills.social.riding} onChange={(v) => updateSkills('social', 'riding', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Montaria', data.skills.social.riding, 'emerald')} />
                  <DotRating label="Sedução" value={data.skills.social.seduction} onChange={(v) => updateSkills('social', 'seduction', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Sedução', data.skills.social.seduction, 'emerald')} />
                </div>
              </div>
                
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent w-full" />
              
              <CustomSkillsSection 
                title="Artes" 
                skills={data.customSkills.artes} 
                add={(name) => addCustomSkill('artes', name)} 
                update={(id, v) => updateCustomSkill('artes', id, v)} 
                remove={(id) => removeCustomSkill('artes', id)} 
                readonly={!isEditing} 
                theme="emerald" 
                onRoll={(name, val) => rollSkill(name, val, 'emerald')}
              />
            </div>
          </StatIntersectionBox>
        </section>

        <section id="magic" className="flex flex-col gap-6">
          {/* DOMÍNIOS ELEMENTAIS - Solto no fundo */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-[11px] tracking-[0.25em] uppercase">
                <Sparkles size={15} className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.4)]" />
                <span>Domínios Elementais</span>
              </div>
            </div>

            <Domains 
              data={data.domains} 
              update={updateDomains} 
              readonly={!isEditing} 
            />
          </div>

          {/* RESERVA DE NATUREZA - Separada */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-[11px] tracking-[0.25em] uppercase">
                <Sparkles size={15} className="text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]" />
                <span>Natureza Elemental</span>
              </div>
            </div>

            <NaturezaTracker 
              domains={data.domains} 
              personalityTotal={(Object.values(data.personality) as number[]).reduce((a, b) => a + b, 0)}
              naturezaSpent={data.naturezaSpent}
              onNaturezaChange={(domain, v) => setData(prev => ({ ...prev, naturezaSpent: { ...prev.naturezaSpent, [domain]: v } }))}
              readonly={false}
            />
          </div>

          <BentoBox title="Habilidades Especiais" titleClassName="text-fuchsia-400">
            <Abilities data={data.abilities} add={addAbility} remove={removeAbility} readonly={!isEditing} />
          </BentoBox>
        </section>
      </main>

      {/* Fixed Bottom Navigation - Neon Minimalist */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#030014]/80 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToSection('profile')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              activeTab === 'profile' ? 'bg-violet-500/20 text-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <User size={20} className={activeTab === 'profile' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
          </button>
          <button
            onClick={() => scrollToSection('stats')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              activeTab === 'stats' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <ScrollText size={20} className={activeTab === 'stats' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
          </button>
          <button
            onClick={() => scrollToSection('magic')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              activeTab === 'magic' ? 'bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <Sparkles size={20} className={activeTab === 'magic' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
          </button>
        </div>
      </nav>

      {/* Dice Roller Tool */}
      <DiceRollerModal 
        request={diceRollRequest} 
        onClose={() => setDiceRollRequest(null)} 
        attributes={data.attributes}
      />
    </div>
  );
}
