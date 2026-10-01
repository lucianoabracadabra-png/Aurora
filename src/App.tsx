import React, { useState, useEffect, useRef } from 'react';
import { initialCharacterData } from './initialState';
import { CharacterData, Identity as IdentityType, Alignment as AlignmentType, Personality as PersonalityType, Attributes as AttributesType, Skills as SkillsType, Domains as DomainsType, Ability, Trait, Inventory, FlowAndPatron as FlowAndPatronType, FlowPatronData } from './types';
import { User, ScrollText, Sparkles, Check, Lock, Unlock, X, Heart, Minus, Plus, RotateCcw, Swords, Backpack, HelpCircle } from 'lucide-react';

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
import { InventoryManager } from './components/InventoryManager';
import { GalaxyAuroraBackground } from './components/GalaxyAuroraBackground';
import { UserGuideModal } from './components/UserGuideModal';
import { FlowAndPatron } from './components/FlowAndPatron';
import { AttributeInput } from './components/AttributeInput';
import { CustomSkillsSection } from './components/CustomSkillsSection';
import { StatIntersectionBox } from './components/StatIntersectionBox';
import { CustomSkill } from './types';

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

        // Ensure inventory exists and is populated
        if (!parsed.inventory || !parsed.inventory.weapons || parsed.inventory.weapons.length === 0) {
          parsed.inventory = initialCharacterData.inventory;
        } else {
          if (!parsed.inventory.generalItems || parsed.inventory.generalItems.length === 0) {
            parsed.inventory.generalItems = initialCharacterData.inventory.generalItems;
          }
          if (!parsed.inventory.currency) {
            parsed.inventory.currency = initialCharacterData.inventory.currency;
          } else {
            if (parsed.inventory.currency.silver > 100) parsed.inventory.currency.silver = 100;
            if (parsed.inventory.currency.copper > 100) parsed.inventory.currency.copper = 100;
            if (parsed.inventory.currency.gems && parsed.inventory.currency.gems.includes('lápis')) {
              parsed.inventory.currency.gems = '';
            }
            if (!parsed.inventory.currency.history || parsed.inventory.currency.history.length === 0) {
              parsed.inventory.currency.history = initialCharacterData.inventory.currency.history;
            }
          }
        }

        if (!parsed.flowAndPatron) {
          parsed.flowAndPatron = initialCharacterData.flowAndPatron;
        }
        
        return parsed;
      } catch (e) {
        return initialCharacterData;
      }
    }
    return initialCharacterData;
  });
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'inventory' | 'magic'>('profile');
  const [diceRollRequest, setDiceRollRequest] = useState<DiceRollRequest | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const rollAttribute = (name: string, value: number, theme: 'rose' | 'cyan' | 'emerald') => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'attribute',
      name,
      value,
      theme,
    });
  };

  const rollSkill = (name: string, dots: number, theme: 'rose' | 'cyan' | 'emerald') => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'skill',
      name,
      dots,
      theme,
    });
  };

  const rollPersonality = (name: string, value: number) => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'personality',
      name,
      dots: value,
      theme: 'violet',
    });
  };

  const rollDamage = (name: string, actionName: string, formula: string, damageType: string, ap?: number, precision?: number) => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'damage',
      name,
      actionName,
      formula,
      damageType,
      ap,
      precision,
      theme: 'amber',
    });
  };

  const updateInventory = (updater: (prev: Inventory) => Inventory) => {
    setData((prev) => ({
      ...prev,
      inventory: updater(prev.inventory || initialCharacterData.inventory),
    }));
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

  const updateTrait = (updatedTrait: Trait) => {
    setData((prev) => ({
      ...prev,
      traits: prev.traits.map((t) => (t.id === updatedTrait.id ? updatedTrait : t))
    }));
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

  const updateFlowAndPatron = (type: 'fluxo' | 'patrono', field: keyof FlowPatronData, value: any) => {
    setData((prev) => {
      const cur = prev.flowAndPatron || initialCharacterData.flowAndPatron!;
      return {
        ...prev,
        flowAndPatron: {
          ...cur,
          [type]: {
            ...cur[type],
            [field]: value
          }
        }
      };
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const profile = document.getElementById('profile');
      const stats = document.getElementById('stats');
      const inventory = document.getElementById('inventory');
      const magic = document.getElementById('magic');

      if (!profile || !stats || !magic) return;

      const scrollPosition = window.scrollY + window.innerHeight / 3;

      if (scrollPosition < stats.offsetTop) {
        setActiveTab('profile');
      } else if (inventory && scrollPosition < inventory.offsetTop) {
        setActiveTab('stats');
      } else if (inventory && scrollPosition < magic.offsetTop) {
        setActiveTab('inventory');
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
    <div className="min-h-screen bg-[#02000c] text-slate-200 font-sans pb-24 selection:bg-violet-500/30 relative overflow-hidden">
      {/* Dynamic Galaxy Aurora Background with 3 Parallax Star Layers */}
      <GalaxyAuroraBackground />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#030014]/60 backdrop-blur-2xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <h1 className="text-sm tracking-[0.3em] font-light uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 drop-shadow-[0_0_12px_rgba(167,139,250,0.5)]">
          Arcana
        </h1>
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Botão de Ajuda & Guia de Ferramentas / Usabilidade (?) */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-cyan-500/15 active:scale-95 border border-cyan-400/30 hover:border-cyan-400/60 flex items-center justify-center text-cyan-300 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer"
            title="Guia de Ferramentas, Atalhos e Usabilidade (?)"
          >
            <HelpCircle size={15} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
          </button>

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
              className={`grid transition-all duration-500 ease-in-out alignment-container ${
                isIdentityExpanded ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-white/5' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden">
                <h3 className="text-[10px] tracking-widest text-violet-400/60 uppercase font-medium mb-4">Alinhamento</h3>
                <Alignment data={data.alignment} update={updateAlignment} readonly={!isEditing} expanded={isIdentityExpanded} />
              </div>
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
            <Traits data={data.traits} add={addTrait} update={updateTrait} remove={removeTrait} readonly={!isEditing} />
          </BentoBox>

          {/* FLUXO E PATRONO */}
          <FlowAndPatron 
            data={data.flowAndPatron || initialCharacterData.flowAndPatron!}
            update={updateFlowAndPatron}
            readonly={!isEditing}
          />

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

        {/* ARSENAL & INVENTÁRIO (MODO TÁTICO & COMPLETO) */}
        <section id="inventory" className="flex flex-col gap-6">
          <InventoryManager
            inventory={data.inventory || initialCharacterData.inventory}
            onUpdateInventory={updateInventory}
            readonly={false}
            onRollDamage={rollDamage}
          />
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
            title="Perfil & Saúde"
          >
            <User size={20} className={activeTab === 'profile' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
          </button>
          <button
            onClick={() => scrollToSection('stats')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              activeTab === 'stats' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
            title="Atributos & Perícias"
          >
            <ScrollText size={20} className={activeTab === 'stats' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
          </button>
          <button
            onClick={() => scrollToSection('inventory')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              activeTab === 'inventory' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
            title="Equipamento & Inventário"
          >
            <Backpack size={20} className={activeTab === 'inventory' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
          </button>
          <button
            onClick={() => scrollToSection('magic')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              activeTab === 'magic' ? 'bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
            title="Domínios & Magia"
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

      {/* Guia de Ferramentas & Usabilidade (?) */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
