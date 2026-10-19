import React, { useState, useEffect } from 'react';
import { Ability, CharacterData } from '../types';
import { 
  Plus, 
  X, 
  CheckCircle2, 
  EyeOff, 
  SlidersHorizontal, 
  Zap, 
  Trash2, 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Check, 
  Copy, 
  ArrowRight,
  Flame,
  Shield,
  Layers,
  Info,
  Sliders,
  Pencil,
  Loader2
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export interface ForgedVariant {
  name: string;
  cost: string;
  mechanic: string;
  description: string;
}

export interface ForgedAbilityResult {
  name: string;
  cost: string;
  mechanic: string;
  description: string;
  category?: string;
  powerLevel?: string;
  synergy?: string;
  variants?: ForgedVariant[];
}

type Props = {
  data: Ability[];
  add: (ability: Omit<Ability, 'id'>) => void;
  update?: (ability: Ability) => void;
  remove: (id: string) => void;
  toggleSelect: (id: string) => void;
  readonly?: boolean;
  characterData?: CharacterData;
  isGamemaster?: boolean;
};

const ARCHETYPE_CHIPS = [
  { label: 'Lâmina Espectral', prompt: 'Golpe mágico com lâmina de energia astral que ignora armadura e atinge a mente' },
  { label: 'Barreira Temporal', prompt: 'Cúpula protetora que desacelera projéteis e adiciona ticks aos atacantes' },
  { label: 'Fogo das Cinzas', prompt: 'Chamas escuras que causam queimadura contínua a cada tick e drenam vigor' },
  { label: 'Cura do Fluxo', prompt: 'Canalização de água espiritual que fecha ferimentos e restaura vitalidade' },
  { label: 'Vendaval & Salto', prompt: 'Rajada de ar nos pés para deslocamento instantâneo e esquiva reflexa' },
  { label: 'Pele de Rocha', prompt: 'Endurece a derme com minerais cristalinos concedendo armadura contra dano letal' },
  { label: 'Ilusão Hipnótica', prompt: 'Ondas mentais que confundem a percepção dos inimigos fazendo-os errar alvos' },
  { label: 'Dreno de Vida', prompt: 'Nigromancia que suga 1 ferimento do alvo e transfere vitalidade ao conjurador' },
  { label: 'Voz do Comando', prompt: 'Imposição de vontade com mana social que paralisa o inimigo por 1 ação' }
];

const ARCANE_MESSAGES = [
  'Tecendo a trama da mana ancestral...',
  'Consultando o equilíbrio de dados d6 e ticks...',
  'Harmonizando custos de mana física e mental...',
  'Invocando a tradição arcana dos patronos...',
  'Estruturando mecânicas de combate e lore...'
];

export const Abilities: React.FC<Props> = ({ 
  data, 
  add, 
  update,
  remove, 
  toggleSelect,
  readonly = false,
  characterData,
  isGamemaster = false
}) => {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [editingAbilityId, setEditingAbilityId] = useState<string | null>(null);
  const [newAbility, setNewAbility] = useState({ name: '', description: '', mechanic: '', cost: '' });
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuggestingFields, setIsSuggestingFields] = useState(false);

  // AI Forge States (Apenas para o Game Master)
  const [isAiForgeOpen, setIsAiForgeOpen] = useState(false);
  const [forgePrompt, setForgePrompt] = useState('');
  const [forgeCategory, setForgeCategory] = useState<string>('any');
  const [forgeCostPreference, setForgeCostPreference] = useState<string>('any');
  const [forgePowerLevel, setForgePowerLevel] = useState<string>('Equilibrado');
  const [isForging, setIsForging] = useState(false);
  const [arcaneMsgIndex, setArcaneMsgIndex] = useState(0);
  const [forgedResult, setForgedResult] = useState<ForgedAbilityResult | null>(null);
  const [activeVariantTab, setActiveVariantTab] = useState<'main' | 0 | 1>('main');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [refiningAbility, setRefiningAbility] = useState<Ability | null>(null);

  // Cycling arcane messages during AI call
  useEffect(() => {
    let timer: any;
    if (isForging) {
      timer = setInterval(() => {
        setArcaneMsgIndex((prev) => (prev + 1) % ARCANE_MESSAGES.length);
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isForging]);

  const handleSave = () => {
    if (!newAbility.name) return;
    if (editingAbilityId && update) {
      const existing = data.find(a => a.id === editingAbilityId);
      update({
        id: editingAbilityId,
        ...newAbility,
        selected: existing ? existing.selected : true
      });
      setEditingAbilityId(null);
    } else {
      add({
        ...newAbility,
        selected: true
      });
    }
    setNewAbility({ name: '', description: '', mechanic: '', cost: '' });
    setIsAddingOpen(false);
  };

  // Sugerir com IA: analisa os campos preenchidos e completa os faltantes diretamente nos inputs
  const handleSuggestFields = async () => {
    setIsSuggestingFields(true);
    try {
      const provider = localStorage.getItem('arcana_aurora_provider') || 'gemini';
      const geminiKey = localStorage.getItem('arcana_aurora_gemini_key') || '';
      const groqKey = localStorage.getItem('arcana_aurora_groq_key') || '';
      const effectiveKey = provider === 'groq' ? groqKey : geminiKey;

      const res = await fetch('/api/aurora/suggest-ability-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFields: newAbility,
          characterContext: getCharacterContextString(),
          provider,
          apiKey: effectiveKey
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.ability) {
          setNewAbility({
            name: json.ability.name || newAbility.name,
            cost: json.ability.cost || newAbility.cost,
            mechanic: json.ability.mechanic || newAbility.mechanic,
            description: json.ability.description || newAbility.description
          });
        }
      }
    } catch (err) {
      console.warn('[Abilities:SuggestError]', err);
    } finally {
      setIsSuggestingFields(false);
    }
  };

  const handleStartEdit = (ability: Ability, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAbilityId(ability.id);
    setNewAbility({
      name: ability.name,
      cost: ability.cost || '',
      mechanic: ability.mechanic || '',
      description: ability.description || ''
    });
    setIsAddingOpen(true);
  };

  // Build character context summary for the AI
  const getCharacterContextString = () => {
    if (!characterData) return '';
    const ident = characterData.identity || {};
    const domains = characterData.domains || ({} as any);
    const attrs = characterData.attributes || ({} as any);

    return `Personagem: ${ident.name || 'Aventureiro'} (${ident.origin || 'Arcana'})
Atributos Físicos: Força ${attrs.physical?.strength || 0}, Destreza ${attrs.physical?.dexterity || 0}, Agilidade ${attrs.physical?.agility || 0}, Constituição ${attrs.physical?.constitution || 0}
Atributos Mentais: Inteligência ${attrs.mental?.intelligence || 0}, Percepção ${attrs.mental?.perception || 0}, Raciocínio ${attrs.mental?.reasoning || 0}, Sabedoria ${attrs.mental?.wisdom || 0}
Atributos Sociais: Empatia ${attrs.social?.empathy || 0}, Manipulação ${attrs.social?.manipulation || 0}, Expressão ${attrs.social?.expression || 0}, Resiliência ${attrs.social?.resilience || 0}
Domínios Elementais: Fogo (${domains.fire || 0}), Água (${domains.water || 0}), Terra (${domains.earth || 0}), Ar (${domains.air || 0}), Ânima (${domains.anima || 0})
Fluxo: ${characterData.spiritus?.fluxo || 0}, Patrono: ${characterData.spiritus?.patrono || 0}`;
  };

  // Call AI Forge endpoint
  const handleForgeAbility = async (customPrompt?: string, actionOverride?: string) => {
    const finalPrompt = customPrompt !== undefined ? customPrompt : forgePrompt;
    const finalAction = actionOverride || (refiningAbility ? 'refine' : 'create');

    setIsForging(true);
    setArcaneMsgIndex(0);

    const provider = localStorage.getItem('arcana_aurora_provider') || 'gemini';
    const geminiKey = localStorage.getItem('arcana_aurora_gemini_key') || '';
    const groqKey = localStorage.getItem('arcana_aurora_groq_key') || '';
    const effectiveKey = provider === 'groq' ? groqKey : geminiKey;

    try {
      const res = await fetch('/api/aurora/forge-ability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt || (refiningAbility ? refiningAbility.name : 'Poder elemental balanceado'),
          action: finalAction,
          characterContext: getCharacterContextString(),
          currentAbility: refiningAbility,
          categoryPreference: forgeCategory,
          costPreference: forgeCostPreference,
          powerLevel: forgePowerLevel,
          provider,
          apiKey: effectiveKey
        })
      });

      if (!res.ok) {
        throw new Error(`Erro na forja arcana (${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.ability) {
        setForgedResult(json.ability);
        setActiveVariantTab('main');
      } else {
        throw new Error(json.error || 'Falha ao forjar habilidade');
      }
    } catch (err: any) {
      console.warn('[Abilities:ForgeError]', err);
    } finally {
      setIsForging(false);
    }
  };

  // Get active variant or main ability
  const currentDisplayedAbility = () => {
    if (!forgedResult) return null;
    if (activeVariantTab === 'main') {
      return {
        name: forgedResult.name,
        cost: forgedResult.cost,
        mechanic: forgedResult.mechanic,
        description: forgedResult.description
      };
    }
    const variant = forgedResult.variants?.[activeVariantTab];
    if (variant) {
      return {
        name: variant.name || `${forgedResult.name} (Variante)`,
        cost: variant.cost || forgedResult.cost,
        mechanic: variant.mechanic || forgedResult.mechanic,
        description: variant.description || forgedResult.description
      };
    }
    return {
      name: forgedResult.name,
      cost: forgedResult.cost,
      mechanic: forgedResult.mechanic,
      description: forgedResult.description
    };
  };

  // Apply forged ability directly to sheet
  const handleApplyForgedAbility = () => {
    const disp = currentDisplayedAbility();
    if (!disp) return;

    if (refiningAbility && update) {
      update({
        ...refiningAbility,
        name: disp.name,
        cost: disp.cost,
        mechanic: disp.mechanic,
        description: disp.description
      });
      setSelectedAbility({
        ...refiningAbility,
        name: disp.name,
        cost: disp.cost,
        mechanic: disp.mechanic,
        description: disp.description
      });
    } else {
      add({
        name: disp.name,
        cost: disp.cost,
        mechanic: disp.mechanic,
        description: disp.description,
        selected: true
      });
    }

    setIsAiForgeOpen(false);
    setRefiningAbility(null);
  };

  // Copy forged ability to manual form for manual fine-tuning
  const handleCopyToManualForm = () => {
    const disp = currentDisplayedAbility();
    if (!disp) return;
    setNewAbility({
      name: disp.name,
      cost: disp.cost,
      mechanic: disp.mechanic,
      description: disp.description
    });
    setIsAddingOpen(true);
    setIsAiForgeOpen(false);
    setIsManagerOpen(true);
    setRefiningAbility(null);
  };

  // Filter abilities that should appear on the profile card (selected !== false)
  const profileAbilities = data.filter(a => a.selected !== false);

  const filteredManagerAbilities = data.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      (a.mechanic && a.mechanic.toLowerCase().includes(term)) ||
      (a.cost && a.cost.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Control Bar: Summary and Manager / AI Forge Triggers */}
      <div className="flex flex-wrap items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-2.5 px-3.5 text-xs gap-2">
        <span className="text-white/60 font-medium">
          Exibindo <strong className="text-fuchsia-300 font-bold font-mono">{profileAbilities.length}</strong> de <span className="font-mono text-white/50">{data.length}</span> habilidades
        </span>

        <div className="flex items-center gap-2">
          {/* AI Ability Forge Button (Apenas para o Game Master) */}
          {!readonly && isGamemaster && (
            <button
              type="button"
              onClick={() => {
                setRefiningAbility(null);
                setForgePrompt('');
                setIsAiForgeOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600/40 via-fuchsia-600/40 to-pink-600/30 hover:from-violet-600/60 hover:to-pink-600/50 border border-fuchsia-400/50 hover:border-fuchsia-400 text-fuchsia-200 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(232,121,249,0.25)] hover:scale-[1.02] active:scale-95"
              title="Criar habilidades especiais personalizadas com IA inteligente (Game Master)"
            >
              <Sparkles size={12} className="text-fuchsia-300 animate-pulse" />
              <span>Forjar com IA</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsManagerOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 text-fuchsia-300 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(232,121,249,0.15)] active:scale-95"
          >
            <SlidersHorizontal size={12} />
            <span>Gerenciar</span>
          </button>
        </div>
      </div>

      {/* Main Profile View: Displays selected abilities */}
      {profileAbilities.length > 0 ? (
        <div className="flex flex-col gap-3">
          {profileAbilities.map((ability) => (
            <div 
              key={ability.id} 
              onClick={() => setSelectedAbility(ability)}
              className="relative bg-white/[0.015] border border-fuchsia-500/20 hover:border-fuchsia-500/50 rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-[0_0_15px_rgba(232,121,249,0.1)]"
            >
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    toggleSelect(ability.id); 
                  }}
                  className="absolute top-4 right-4 text-white/30 hover:text-rose-400 transition-colors cursor-pointer p-1"
                  title="Ocultar do perfil"
                >
                  <EyeOff size={14} />
                </button>
              )}
              <h4 className="text-fuchsia-400 font-medium text-sm pr-8 drop-shadow-[0_0_8px_rgba(232,121,249,0.4)] tracking-wide group-hover:text-fuchsia-300 transition-colors flex items-center gap-2">
                <span>{ability.name}</span>
              </h4>
              {ability.cost && (
                <span className="text-[10px] text-fuchsia-300/90 font-bold tracking-widest uppercase mt-0.5">
                  Custo: {ability.cost}
                </span>
              )}
              {ability.mechanic && (
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  <span className="text-white/40 uppercase tracking-widest text-[10px] mr-2 font-semibold">Mecânica:</span> 
                  {ability.mechanic}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div 
          onClick={() => setIsManagerOpen(true)}
          className="p-8 border border-white/10 border-dashed rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer hover:bg-white/[0.03] hover:border-fuchsia-500/30 transition-all group"
        >
          <Zap size={24} className="text-fuchsia-400/40 group-hover:text-fuchsia-400 transition-colors" />
          <p className="text-xs text-white/60 font-medium">
            Nenhuma habilidade selecionada para exibição no perfil.
          </p>
          <span className="text-[10px] uppercase font-bold tracking-wider text-fuchsia-300 bg-fuchsia-500/15 px-3 py-1 rounded-lg border border-fuchsia-500/30">
            Clique para selecionar ou forjar com IA
          </span>
        </div>
      )}

      {/* Special Ability Detail Modal */}
      {selectedAbility && (
        <Modal
          isOpen={!!selectedAbility}
          onClose={() => setSelectedAbility(null)}
          title={selectedAbility.name}
          subtitle={selectedAbility.cost ? `Custo: ${selectedAbility.cost}` : undefined}
          icon={<Zap size={20} />}
          theme="amber"
          maxWidth="md"
          footer={
            !readonly ? (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    setRefiningAbility(selectedAbility);
                    setForgePrompt(`Aprimorar e balancear: ${selectedAbility.name}`);
                    setIsAiForgeOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 border border-fuchsia-400/40 text-fuchsia-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Aprimorar formulação de regras e balancear custos com IA"
                >
                  <Sparkles size={13} className="text-fuchsia-300" />
                  <span>Aprimorar com IA</span>
                </button>
                <Button
                  theme="amber"
                  size="sm"
                  onClick={() => setSelectedAbility(null)}
                >
                  Fechar
                </Button>
              </div>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-4">
            {selectedAbility.mechanic && (
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-amber-400/80 uppercase tracking-widest font-bold">Mecânica de Jogo</span>
                <p className="text-sm text-white/90 leading-relaxed">{selectedAbility.mechanic}</p>
              </div>
            )}
            {selectedAbility.description && (
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Detalhes & Lore</span>
                <p className="text-sm text-white/70 font-light leading-relaxed whitespace-pre-wrap">{selectedAbility.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* FORJA ARCANA DE HABILIDADES COM IA MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAiForgeOpen}
        onClose={() => {
          setIsAiForgeOpen(false);
          setRefiningAbility(null);
        }}
        title={refiningAbility ? `Aprimorar: ${refiningAbility.name}` : "Forja Arcana de Habilidades (IA)"}
        subtitle="Crie poderes balanceados com custos em Mana ou Natureza, mecânica de dados e variantes táticas"
        icon={<Sparkles size={20} className="text-fuchsia-400" />}
        theme="violet"
        maxWidth="2xl"
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* Context Banner */}
          {characterData && (
            <div className="bg-fuchsia-950/20 border border-fuchsia-500/25 rounded-xl p-2.5 px-3 flex items-center justify-between text-[11px] text-fuchsia-200/80">
              <span className="flex items-center gap-1.5">
                <Wand2 size={13} className="text-fuchsia-400 shrink-0" />
                <span>Sintonizado com: <strong>{characterData.identity?.name || 'Aventureiro'}</strong> ({characterData.identity?.origin || 'Arcana'})</span>
              </span>
              <span className="text-[10px] text-white/40 font-mono">IA Grounded no Sistema Arcana</span>
            </div>
          )}

          {/* Quick Concept Archetype Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Inspirações Rápidas de Arquétipo:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {ARCHETYPE_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setForgePrompt(chip.prompt);
                    handleForgeAbility(chip.prompt);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 text-[11px] text-white/70 hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Concept Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/80 flex items-center justify-between">
              <span>Conceito, Tema ou Ideia da Habilidade:</span>
              <span className="text-[10px] text-white/40 font-normal">Ex: golpe psíquico, névoa congelante, escudo sônico...</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={forgePrompt}
                onChange={(e) => setForgePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleForgeAbility();
                  }
                }}
                placeholder="Descreva o poder desejado ou clique em um arquétipo acima..."
                className="flex-1 bg-black/60 border border-white/15 focus:border-fuchsia-400 rounded-xl px-3.5 py-2 text-white placeholder:text-white/25 text-xs outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                disabled={isForging}
                onClick={() => handleForgeAbility()}
                className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(232,121,249,0.35)] shrink-0 disabled:opacity-50 active:scale-95"
              >
                {isForging ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>{refiningAbility ? 'Aprimorar' : 'Forjar'}</span>
              </button>
            </div>
          </div>

          {/* Optional Filters / Tuning */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/5 text-[11px]">
            <div>
              <span className="text-white/40 block mb-1 uppercase text-[9px] font-bold">Categoria:</span>
              <select
                value={forgeCategory}
                onChange={(e) => setForgeCategory(e.target.value)}
                className="w-full bg-[#0a0618] border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-fuchsia-400 cursor-pointer"
              >
                <option value="any">Automático / Qualquer</option>
                <option value="Ofensiva">Ofensiva (Dano / Ataque)</option>
                <option value="Defensiva">Defensiva (Escudos / Bloqueio)</option>
                <option value="Suporte">Suporte & Buffs</option>
                <option value="Utilitária">Utilitária & Exploração</option>
                <option value="Elemental">Elemental (Domínios)</option>
                <option value="Espiritual">Espiritual (Fluxo/Patrono)</option>
              </select>
            </div>

            <div>
              <span className="text-white/40 block mb-1 uppercase text-[9px] font-bold">Tipo de Custo:</span>
              <select
                value={forgeCostPreference}
                onChange={(e) => setForgeCostPreference(e.target.value)}
                className="w-full bg-[#0a0618] border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-fuchsia-400 cursor-pointer"
              >
                <option value="any">Balanceado Automático</option>
                <option value="mana_mental">Mana Mental (Foco)</option>
                <option value="mana_fisica">Mana Físico (Vigor)</option>
                <option value="mana_social">Mana Social (Presença)</option>
                <option value="natureza">Natureza Elemental</option>
              </select>
            </div>

            <div>
              <span className="text-white/40 block mb-1 uppercase text-[9px] font-bold">Nível de Poder:</span>
              <select
                value={forgePowerLevel}
                onChange={(e) => setForgePowerLevel(e.target.value)}
                className="w-full bg-[#0a0618] border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-fuchsia-400 cursor-pointer"
              >
                <option value="Iniciante">Iniciante (Baixo Custo)</option>
                <option value="Equilibrado">Equilibrado (Padrão)</option>
                <option value="Heroico">Heroico (Alto Custo / Devastador)</option>
              </select>
            </div>
          </div>

          {/* Loading Arcane State */}
          {isForging && (
            <div className="py-8 px-4 flex flex-col items-center justify-center gap-3 bg-fuchsia-950/15 border border-fuchsia-500/20 rounded-2xl animate-pulse">
              <div className="relative">
                <Sparkles size={28} className="text-fuchsia-400 animate-spin" />
                <div className="absolute inset-0 blur-md bg-fuchsia-500/50 animate-ping" />
              </div>
              <p className="text-fuchsia-300 font-medium text-xs text-center">
                {ARCANE_MESSAGES[arcaneMsgIndex]}
              </p>
              <span className="text-[10px] text-white/40 font-mono">Grounding nas regras matemáticas do Arcana...</span>
            </div>
          )}

          {/* Forged Result Preview & Variant Tabs */}
          {!isForging && forgedResult && (
            <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Variant Switcher Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/10 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveVariantTab('main')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeVariantTab === 'main'
                      ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(232,121,249,0.4)]'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles size={11} />
                  <span>Versão Principal</span>
                </button>

                {forgedResult.variants?.[0] && (
                  <button
                    type="button"
                    onClick={() => setActiveVariantTab(0)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeVariantTab === 0
                        ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Zap size={11} />
                    <span>Variante Rápida</span>
                  </button>
                )}

                {forgedResult.variants?.[1] && (
                  <button
                    type="button"
                    onClick={() => setActiveVariantTab(1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeVariantTab === 1
                        ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Flame size={11} />
                    <span>Variante Potencializada</span>
                  </button>
                )}
              </div>

              {/* Displayed Ability Card */}
              {(() => {
                const disp = currentDisplayedAbility();
                if (!disp) return null;

                return (
                  <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-fuchsia-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_0_20px_rgba(232,121,249,0.15)] relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]">
                            {disp.name}
                          </h4>
                          {forgedResult.category && (
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 font-bold">
                              {forgedResult.category}
                            </span>
                          )}
                        </div>
                        {disp.cost && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded">
                              Custo: {disp.cost}
                            </span>
                            {forgedResult.powerLevel && (
                              <span className="text-[10px] text-white/50">
                                Nível: {forgedResult.powerLevel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy = `${disp.name}\nCusto: ${disp.cost}\nMecânica: ${disp.mechanic}\nDescrição: ${disp.description}`;
                          navigator.clipboard.writeText(textToCopy);
                          setCopiedSuccess(true);
                          setTimeout(() => setCopiedSuccess(false), 2000);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                        title="Copiar texto da habilidade"
                      >
                        {copiedSuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>

                    {/* Mechanics */}
                    <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-400/90 tracking-wider flex items-center gap-1">
                        <Zap size={11} />
                        Mecânica & Teste de Jogo
                      </span>
                      <p className="text-xs text-white/90 leading-relaxed font-sans">
                        {disp.mechanic}
                      </p>
                    </div>

                    {/* Description & Lore */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                        Manifestação & Narrativa
                      </span>
                      <p className="text-xs text-white/70 font-light leading-relaxed whitespace-pre-wrap">
                        {disp.description}
                      </p>
                    </div>

                    {/* Synergy Note */}
                    {forgedResult.synergy && (
                      <div className="p-2 px-3 rounded-lg bg-violet-950/30 border border-violet-500/20 text-[11px] text-violet-300 flex items-center gap-2">
                        <Info size={13} className="text-violet-400 shrink-0" />
                        <span><strong>Sinergia:</strong> {forgedResult.synergy}</span>
                      </div>
                    )}

                    {/* Action Buttons for applying or editing */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 mt-1">
                      <button
                        type="button"
                        onClick={handleCopyToManualForm}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        Ajustar Manualmente
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyForgedAbility}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Check size={14} />
                        <span>{refiningAbility ? 'Atualizar Habilidade' : 'Adicionar à Ficha'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </Modal>

      {/* Special Abilities Selector & Manager Panel Modal */}
      <Modal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        title="Painel de Habilidades Especiais"
        subtitle="Clique em uma habilidade para ativar (✓) ou ocultar (👁) sua aparição no perfil"
        icon={<Zap size={20} />}
        theme="violet"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-white/40">
              {profileAbilities.length} de {data.length} selecionadas para o perfil
            </span>
            <Button
              theme="violet"
              size="sm"
              onClick={() => setIsManagerOpen(false)}
            >
              Concluído
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Header Controls & Search */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5">
            <input
              type="text"
              placeholder="Buscar habilidade por nome, mecânica ou custo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-fuchsia-500/50"
            />

            {!readonly && (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {isGamemaster && (
                  <button
                    type="button"
                    onClick={() => {
                      setRefiningAbility(null);
                      setForgePrompt('');
                      setIsAiForgeOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40 hover:from-violet-600/60 hover:to-fuchsia-600/60 border border-fuchsia-400/40 text-fuchsia-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    title="Forjar habilidade completa com IA (Game Master)"
                  >
                    <Sparkles size={13} className="text-fuchsia-300" />
                    <span>Forjar com IA</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingAbilityId(null);
                    setNewAbility({ name: '', description: '', mechanic: '', cost: '' });
                    setIsAddingOpen(!isAddingOpen);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(232,121,249,0.3)] active:scale-95"
                >
                  <Plus size={14} />
                  <span>Nova Habilidade</span>
                </button>
              </div>
            )}
          </div>

          {/* Form to Create/Edit Ability with in-place AI suggestion */}
          {isAddingOpen && !readonly && (
            <div className="bg-fuchsia-950/20 border border-fuchsia-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_0_20px_rgba(232,121,249,0.15)] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                  {editingAbilityId ? 'Editar Habilidade' : 'Nova Habilidade'}
                </h4>
                <button
                  type="button"
                  disabled={isSuggestingFields}
                  onClick={handleSuggestFields}
                  className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-fuchsia-200 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Completar os campos faltantes automaticamente com a IA"
                >
                  {isSuggestingFields ? (
                    <Loader2 size={11} className="animate-spin text-fuchsia-300" />
                  ) : (
                    <Wand2 size={11} className="text-fuchsia-300" />
                  )}
                  <span>{isSuggestingFields ? 'Sugerindo...' : 'Sugerir com IA'}</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome"
                  value={newAbility.name}
                  onChange={(e) => setNewAbility({ ...newAbility, name: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20"
                />
                <input
                  type="text"
                  placeholder="Custo"
                  value={newAbility.cost}
                  onChange={(e) => setNewAbility({ ...newAbility, cost: e.target.value })}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20"
                />
              </div>

              <input
                type="text"
                placeholder="Mecânica"
                value={newAbility.mechanic}
                onChange={(e) => setNewAbility({ ...newAbility, mechanic: e.target.value })}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20"
              />

              <textarea
                placeholder="Descrição"
                value={newAbility.description}
                onChange={(e) => setNewAbility({ ...newAbility, description: e.target.value })}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-xs focus:outline-none focus:border-fuchsia-500 resize-none h-16 transition-colors placeholder:text-white/20 font-light"
              />

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingOpen(false);
                    setEditingAbilityId(null);
                    setNewAbility({ name: '', description: '', mechanic: '', cost: '' });
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_12px_rgba(232,121,249,0.3)]"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* List of ALL Abilities in Manager Panel with Toggle Click Selection */}
          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {filteredManagerAbilities.length > 0 ? (
              filteredManagerAbilities.map((ability) => {
                const isSelected = ability.selected !== false;

                return (
                  <div
                    key={ability.id}
                    onClick={() => toggleSelect(ability.id)}
                    className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-fuchsia-950/20 border-fuchsia-400/60 shadow-[0_0_15px_rgba(232,121,249,0.15)]'
                        : 'bg-white/[0.01] border-white/10 hover:border-white/25 text-white/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-col gap-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm tracking-wide ${
                          isSelected ? 'text-fuchsia-300 drop-shadow-[0_0_6px_rgba(232,121,249,0.4)]' : 'text-white/70'
                        }`}>
                          {ability.name}
                        </h4>
                        {ability.cost && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-fuchsia-300">
                            {ability.cost}
                          </span>
                        )}
                      </div>

                      {ability.mechanic && (
                        <p className="text-xs text-white/65 leading-relaxed">
                          <span className="text-white/30 uppercase text-[9px] mr-1 font-semibold">Mecânica:</span>
                          {ability.mechanic}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Selection Toggle Badge */}
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-fuchsia-500/25 border-fuchsia-400/60 text-fuchsia-200 shadow-[0_0_10px_rgba(232,121,249,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}>
                        {isSelected ? <CheckCircle2 size={14} className="text-fuchsia-400" /> : <EyeOff size={14} />}
                        <span className="text-[10px] uppercase tracking-wider">
                          {isSelected ? 'No Perfil' : 'Oculta'}
                        </span>
                      </div>

                      {/* Edit Button in Edit Mode */}
                      {!readonly && (
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(ability, e)}
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-fuchsia-500/20 text-white/40 hover:text-fuchsia-300 flex items-center justify-center transition-colors cursor-pointer"
                          title="Editar habilidade"
                        >
                          <Pencil size={13} />
                        </button>
                      )}

                      {/* Remove Button in Edit Mode */}
                      {!readonly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(ability.id);
                          }}
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Excluir habilidade definitivamente"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-white/40 text-xs">
                Nenhuma habilidade encontrada para "{searchTerm}".
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
