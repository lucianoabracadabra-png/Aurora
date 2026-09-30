import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sword, 
  Shield, 
  ShieldCheck, 
  Target, 
  Sparkles, 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Dices, 
  Check, 
  Backpack, 
  Search, 
  X, 
  Coins, 
  FlaskConical, 
  Wrench, 
  Flame,
  Footprints,
  Shirt,
  Crown,
  Layers,
  ArrowRightLeft,
  Info,
  Scale,
  Edit3,
  ArrowUpDown,
  Grid,
  List,
  Sparkle,
  CircleDot,
  History
} from 'lucide-react';
import { 
  Inventory, 
  WeaponItem, 
  ArmorItem, 
  ProjectileItem, 
  AccessoryItem, 
  GeneralItem, 
  Currency,
  CurrencyTransaction,
  EquipmentSlot
} from '../types';

type Props = {
  inventory: Inventory;
  onUpdateInventory: (updater: (prev: Inventory) => Inventory) => void;
  readonly: boolean;
  onRollDamage: (
    name: string, 
    actionName: string, 
    formula: string, 
    damageType: string, 
    ap?: number, 
    precision?: number
  ) => void;
};

export type AnyItem = 
  | GeneralItem 
  | WeaponItem 
  | ArmorItem 
  | ProjectileItem 
  | AccessoryItem;

export type SlotGroup = 'armor' | 'non_armor' | 'weapons';

// Definição dos Espaços de Equipamento Oficiais (WoW Canonical)
export type SlotDefinition = {
  id: EquipmentSlot;
  group: SlotGroup;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
};

export const EQUIPMENT_SLOTS: SlotDefinition[] = [
  // Armaduras
  { id: 'head', group: 'armor', label: 'Cabeça', icon: Crown, description: 'Elmos, coifas, tiaras e capuzes' },
  { id: 'shoulders', group: 'armor', label: 'Ombros', icon: Shield, description: 'Ombreiras de placas, mantas de guarda e proteções de ombro' },
  { id: 'chest', group: 'armor', label: 'Peitoral', icon: Shirt, description: 'Couraças, cotas de malha, hauberks e peitorais' },
  { id: 'wrist', group: 'armor', label: 'Pulsos', icon: ShieldCheck, description: 'Braçadeiras de combate, guardas de antebraço e braceletes' },
  { id: 'hands', group: 'armor', label: 'Mãos', icon: Package, description: 'Manoplas de ferro, luvas de couro e empunhaduras' },
  { id: 'waist', group: 'armor', label: 'Cintura', icon: Layers, description: 'Cintos utilitários, faixas de suporte e fivelas reforçadas' },
  { id: 'legs', group: 'armor', label: 'Pernas', icon: Layers, description: 'Calças reforçadas, grevas e perneiras' },
  { id: 'feet', group: 'armor', label: 'Pés', icon: Footprints, description: 'Botas de viagem, sapatos de couro e coturnos' },

  // Não-Armaduras
  { id: 'neck', group: 'non_armor', label: 'Pescoço', icon: Sparkles, description: 'Amuletos sagrados, colares, gargantilhas e talismãs' },
  { id: 'back', group: 'non_armor', label: 'Costas', icon: Shield, description: 'Capas de viagem, mantos constelares e mantas de guarda' },
  { id: 'finger', group: 'non_armor', label: 'Dedo', icon: CircleDot, description: 'Anéis arcanos, alianças de clã e selos mágicos' },
  { id: 'trinket', group: 'non_armor', label: 'Berloque', icon: Sparkle, description: 'Relíquias místicas, instrumentos rituais e fetiches' },

  // Armas
  { id: 'main_hand', group: 'weapons', label: 'Mão Principal (1M/2M)', icon: Sword, description: 'Arma principal (Uma Mão / Duas Mãos: espadas, machados, lanças, arcos ou adagas)' },
  { id: 'off_hand', group: 'weapons', label: 'Mão Secundária (1M/2M)', icon: ShieldCheck, description: 'Mão secundária (Uma Mão / Duas Mãos: escudo, arma secundária, adaga ou projétil)' },
];

export type EquipmentCategoryKey =
  | 'arma_1m'
  | 'arma_2m'
  | 'arma_distancia'
  | 'escudo'
  | 'armadura_cabeca'
  | 'armadura_ombros'
  | 'armadura_peitoral'
  | 'armadura_pulsos'
  | 'armadura_maos'
  | 'armadura_cintura'
  | 'armadura_pernas'
  | 'armadura_pes'
  | 'acessorio_pescoco'
  | 'acessorio_costas'
  | 'acessorio_dedo'
  | 'acessorio_reliquia';

export interface EquipmentCategoryConfig {
  key: EquipmentCategoryKey;
  label: string;
  groupLabel: 'Armas' | 'Escudos' | 'Armaduras' | 'Acessórios';
  kind: 'weapon' | 'armor' | 'accessory';
  defaultSlot: EquipmentSlot;
  allowedSlots: EquipmentSlot[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultWeight: number;
  description: string;
  presetTemplates: {
    name: string;
    weight: number;
    thrustDmg?: string;
    thrustType?: string;
    thrustAP?: number;
    thrustPre?: number;
    swingDmg?: string;
    swingType?: string;
    swingAP?: number;
    swingPre?: number;
    slashing?: number;
    bludgeoning?: number;
    piercing?: number;
    coverage?: number;
    resistance?: number;
    durability?: number;
    effects?: string;
  }[];
}

export const EQUIPMENT_CATEGORIES: EquipmentCategoryConfig[] = [
  // 1. ARMAS
  {
    key: 'arma_1m',
    label: 'Arma de Uma Mão (1M)',
    groupLabel: 'Armas',
    kind: 'weapon',
    defaultSlot: 'main_hand',
    allowedSlots: ['main_hand', 'off_hand'],
    icon: Sword,
    defaultWeight: 1400,
    description: 'Espadas de uma mão, machados de corte, maças e adagas de duelo',
    presetTemplates: [
      { name: 'Espada Longa de Aço', weight: 1400, thrustDmg: '1d8', thrustType: 'per', thrustAP: 4, thrustPre: 3, swingDmg: '1d8', swingType: 'cor', swingAP: 4, swingPre: 2 },
      { name: 'Machado de Batalha de Uma Mão', weight: 1800, thrustDmg: '1d6', thrustType: 'esm', thrustAP: 3, thrustPre: 1, swingDmg: '1d8+1', swingType: 'cor', swingAP: 5, swingPre: 1 },
      { name: 'Adaga de Lâmina Fina', weight: 400, thrustDmg: '1d4+1', thrustType: 'per', thrustAP: 3, thrustPre: 4, swingDmg: '1d4', swingType: 'cor', swingAP: 2, swingPre: 3 },
      { name: 'Maça Ferrada Pesada', weight: 2000, thrustDmg: '1d6', thrustType: 'esm', thrustAP: 4, thrustPre: 1, swingDmg: '1d8', swingType: 'esm', swingAP: 6, swingPre: 1 }
    ]
  },
  {
    key: 'arma_2m',
    label: 'Arma de Duas Mãos (2M)',
    groupLabel: 'Armas',
    kind: 'weapon',
    defaultSlot: 'main_hand',
    allowedSlots: ['main_hand'],
    icon: Sword,
    defaultWeight: 3200,
    description: 'Montantes de guerra, machados pesados, alabardas e martelos',
    presetTemplates: [
      { name: 'Espadão Montante Nobre', weight: 3200, thrustDmg: '1d10', thrustType: 'per', thrustAP: 5, thrustPre: 2, swingDmg: '2d6', swingType: 'cor', swingAP: 6, swingPre: 2 },
      { name: 'Machado de Guerra de Duas Mãos', weight: 3800, thrustDmg: '1d8', thrustType: 'esm', thrustAP: 4, thrustPre: 1, swingDmg: '2d6+2', swingType: 'cor', swingAP: 7, swingPre: 1 },
      { name: 'Alabarda com Ponta Reforçada', weight: 2900, thrustDmg: '1d10+1', thrustType: 'per', thrustAP: 6, thrustPre: 3, swingDmg: '1d10', swingType: 'cor', swingAP: 5, swingPre: 2 },
      { name: 'Martelo de Guerra de Placas', weight: 3600, thrustDmg: '1d8', thrustType: 'esm', thrustAP: 5, thrustPre: 1, swingDmg: '2d6+1', swingType: 'esm', swingAP: 8, swingPre: 1 }
    ]
  },
  {
    key: 'arma_distancia',
    label: 'Arma à Distância / Disparo',
    groupLabel: 'Armas',
    kind: 'weapon',
    defaultSlot: 'main_hand',
    allowedSlots: ['main_hand', 'off_hand'],
    icon: Target,
    defaultWeight: 1400,
    description: 'Arcos curtos de caça, arcos longos e bestas de repetição',
    presetTemplates: [
      { name: 'Arco Curto de Caça', weight: 900, thrustDmg: '1d6', thrustType: 'per', thrustAP: 3, thrustPre: 3, swingDmg: '1d4', swingType: 'esm', swingAP: 1, swingPre: 1 },
      { name: 'Arco Longo Recurvo', weight: 1400, thrustDmg: '1d8+1', thrustType: 'per', thrustAP: 5, thrustPre: 4, swingDmg: '1d4', swingType: 'esm', swingAP: 1, swingPre: 1 },
      { name: 'Besta Leve de Repetição', weight: 2400, thrustDmg: '1d8', thrustType: 'per', thrustAP: 6, thrustPre: 4, swingDmg: '1d4', swingType: 'esm', swingAP: 1, swingPre: 1 }
    ]
  },

  // 2. ESCUDOS
  {
    key: 'escudo',
    label: 'Escudo (Defesa Secundária)',
    groupLabel: 'Escudos',
    kind: 'armor',
    defaultSlot: 'off_hand',
    allowedSlots: ['off_hand'],
    icon: ShieldCheck,
    defaultWeight: 3000,
    description: 'Broqueis de duelo, escudos de infantaria em aço e escudos torre',
    presetTemplates: [
      { name: 'Broquel Redondo Ágil', weight: 1200, slashing: 1, bludgeoning: 1, piercing: 1, coverage: 2, resistance: 2, durability: 6 },
      { name: 'Escudo de Infantaria de Aço', weight: 3000, slashing: 2, bludgeoning: 2, piercing: 2, coverage: 3, resistance: 3, durability: 8 },
      { name: 'Escudo Torre / Pavês Reforçado', weight: 6000, slashing: 3, bludgeoning: 3, piercing: 3, coverage: 5, resistance: 4, durability: 10 }
    ]
  },

  // 3. ARMADURAS CORPORAIS
  {
    key: 'armadura_cabeca',
    label: 'Cabeça (Elmo / Capuz)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'head',
    allowedSlots: ['head'],
    icon: Crown,
    defaultWeight: 1800,
    description: 'Elmos com visor de combate, coifas de malha e tiaras arcanas',
    presetTemplates: [
      { name: 'Elmo Fechado com Visor', weight: 2200, slashing: 2, bludgeoning: 2, piercing: 2, coverage: 3, resistance: 3, durability: 6 },
      { name: 'Coifa de Malha de Aço', weight: 1400, slashing: 1, bludgeoning: 1, piercing: 1, coverage: 2, resistance: 2, durability: 5 },
      { name: 'Capuz de Couro Reforçado', weight: 500, slashing: 1, bludgeoning: 0, piercing: 0, coverage: 1, resistance: 1, durability: 4 }
    ]
  },
  {
    key: 'armadura_ombros',
    label: 'Ombros (Hombreiras / Manto)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'shoulders',
    allowedSlots: ['shoulders'],
    icon: Shield,
    defaultWeight: 1500,
    description: 'Hombreiras de placas articuladas e mantos com proteção de ombro',
    presetTemplates: [
      { name: 'Hombreiras de Placas de Aço', weight: 1600, slashing: 2, bludgeoning: 1, piercing: 1, coverage: 2, resistance: 2, durability: 5 },
      { name: 'Manto de Guarda com Placas', weight: 900, slashing: 1, bludgeoning: 1, piercing: 0, coverage: 2, resistance: 1, durability: 4 }
    ]
  },
  {
    key: 'armadura_peitoral',
    label: 'Peitoral (Couraça / Cota / Túnica)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'chest',
    allowedSlots: ['chest'],
    icon: Shirt,
    defaultWeight: 6500,
    description: 'Couraças de placas de aço, cotas de malha nobre e gibões de couro',
    presetTemplates: [
      { name: 'Couraça de Placas Completa', weight: 9000, slashing: 4, bludgeoning: 3, piercing: 3, coverage: 5, resistance: 4, durability: 12 },
      { name: 'Cota de Malha de Aço Nobre', weight: 6500, slashing: 3, bludgeoning: 1, piercing: 2, coverage: 4, resistance: 3, durability: 10 },
      { name: 'Gibão de Couro Fervido', weight: 3000, slashing: 2, bludgeoning: 1, piercing: 1, coverage: 3, resistance: 2, durability: 8 },
      { name: 'Túnica Acolchoada Reforçada', weight: 1800, slashing: 1, bludgeoning: 2, piercing: 0, coverage: 3, resistance: 1, durability: 6 }
    ]
  },
  {
    key: 'armadura_pulsos',
    label: 'Pulsos (Braçadeiras)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'wrist',
    allowedSlots: ['wrist'],
    icon: ShieldCheck,
    defaultWeight: 600,
    description: 'Braçadeiras de combate em aço e braceletes reforçados',
    presetTemplates: [
      { name: 'Braçadeiras de Combate em Aço', weight: 800, slashing: 1, bludgeoning: 1, piercing: 1, coverage: 2, resistance: 2, durability: 4 },
      { name: 'Braceletes de Couro Batido', weight: 300, slashing: 1, bludgeoning: 0, piercing: 0, coverage: 1, resistance: 1, durability: 3 }
    ]
  },
  {
    key: 'armadura_maos',
    label: 'Mãos (Manoplas / Luvas)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'hands',
    allowedSlots: ['hands'],
    icon: Package,
    defaultWeight: 900,
    description: 'Manoplas de ferro articuladas e luvas de combate',
    presetTemplates: [
      { name: 'Manoplas de Ferro Articuladas', weight: 1100, slashing: 1, bludgeoning: 1, piercing: 1, coverage: 2, resistance: 2, durability: 4 },
      { name: 'Luvas de Couro com Rebites', weight: 350, slashing: 1, bludgeoning: 0, piercing: 0, coverage: 1, resistance: 1, durability: 3 }
    ]
  },
  {
    key: 'armadura_cintura',
    label: 'Cintura (Cinto Tático)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'waist',
    allowedSlots: ['waist'],
    icon: Layers,
    defaultWeight: 600,
    description: 'Cintos de suporte de combate e faixas blindadas',
    presetTemplates: [
      { name: 'Cinto Reforçado com Placas', weight: 600, slashing: 1, bludgeoning: 1, piercing: 0, coverage: 1, resistance: 1, durability: 4 }
    ]
  },
  {
    key: 'armadura_pernas',
    label: 'Pernas (Grevas / Perneiras)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'legs',
    allowedSlots: ['legs'],
    icon: Layers,
    defaultWeight: 3500,
    description: 'Grevas de placas articuladas e perneiras de malha',
    presetTemplates: [
      { name: 'Grevas de Placas Articuladas', weight: 4500, slashing: 3, bludgeoning: 2, piercing: 2, coverage: 4, resistance: 3, durability: 8 },
      { name: 'Perneiras de Malha de Aço', weight: 3000, slashing: 2, bludgeoning: 1, piercing: 1, coverage: 3, resistance: 2, durability: 6 },
      { name: 'Calças de Couro com Reforços', weight: 1500, slashing: 1, bludgeoning: 1, piercing: 0, coverage: 2, resistance: 1, durability: 5 }
    ]
  },
  {
    key: 'armadura_pes',
    label: 'Pés (Botas / Coturnos)',
    groupLabel: 'Armaduras',
    kind: 'armor',
    defaultSlot: 'feet',
    allowedSlots: ['feet'],
    icon: Footprints,
    defaultWeight: 1500,
    description: 'Botas de placa reforçadas e coturnos de marcha',
    presetTemplates: [
      { name: 'Botas de Placa Reforçada', weight: 2000, slashing: 2, bludgeoning: 1, piercing: 1, coverage: 2, resistance: 2, durability: 5 },
      { name: 'Coturnos de Marcha com Biqueira', weight: 1200, slashing: 1, bludgeoning: 1, piercing: 0, coverage: 1, resistance: 1, durability: 4 }
    ]
  },

  // 4. ACESSÓRIOS & MÁGICOS
  {
    key: 'acessorio_pescoco',
    label: 'Pescoço (Amuleto / Colar)',
    groupLabel: 'Acessórios',
    kind: 'accessory',
    defaultSlot: 'neck',
    allowedSlots: ['neck'],
    icon: Sparkles,
    defaultWeight: 50,
    description: 'Amuletos sagrados, colares e talismãs encantados',
    presetTemplates: [
      { name: 'Amuleto de Proteção Arcana', weight: 50, effects: '+1 em Resistência contra feitiços elementais' },
      { name: 'Colar da Coragem Ancestral', weight: 40, effects: '+1 no limiar de compostura e proteção contra pânico' }
    ]
  },
  {
    key: 'acessorio_costas',
    label: 'Costas (Capa / Manto)',
    groupLabel: 'Acessórios',
    kind: 'accessory',
    defaultSlot: 'back',
    allowedSlots: ['back'],
    icon: Shield,
    defaultWeight: 500,
    description: 'Capas de viagem, mantos constelares e mantas de guarda',
    presetTemplates: [
      { name: 'Capa de Veludo Noturno', weight: 600, effects: 'Camuflagem em sombras e proteção contra vento gélido' },
      { name: 'Manto de Seda Élfica', weight: 350, effects: 'Reduz ruídos em deslocamentos furtivos' }
    ]
  },
  {
    key: 'acessorio_dedo',
    label: 'Dedo (Anel / Aliança)',
    groupLabel: 'Acessórios',
    kind: 'accessory',
    defaultSlot: 'finger',
    allowedSlots: ['finger'],
    icon: CircleDot,
    defaultWeight: 30,
    description: 'Anéis arcanos, alianças de clã e selos mágicos',
    presetTemplates: [
      { name: 'Anel de Prata Encantado', weight: 30, effects: '+2 pontos na reserva máxima de Mana de Foco' },
      { name: 'Aliança de Sangue Guerreiro', weight: 25, effects: '+1 no dano de acertos críticos' }
    ]
  },
  {
    key: 'acessorio_reliquia',
    label: 'Berloque / Relíquia',
    groupLabel: 'Acessórios',
    kind: 'accessory',
    defaultSlot: 'trinket',
    allowedSlots: ['trinket'],
    icon: Sparkle,
    defaultWeight: 100,
    description: 'Relíquias sagradas, fetiches espirituais e instrumentos rituais',
    presetTemplates: [
      { name: 'Relíquia Sagrada da Alvorada', weight: 150, effects: 'Canaliza luz mística e afasta criaturas sombrias' },
      { name: 'Fetiche Rúnico de Ossos', weight: 80, effects: '+1 em testes de sintonia com Natureza Anima' }
    ]
  }
];

// Normalização para dados legados
export function normalizeSlot(slot?: EquipmentSlot): EquipmentSlot | undefined {
  if (!slot) return undefined;
  if (slot === 'torso') return 'chest';
  if (slot === 'arm_left' || slot === 'arm_right') return 'wrist';
  if (slot === 'hands_main') return 'main_hand';
  if (slot === 'hands_off') return 'off_hand';
  if (slot === 'hands_gloves') return 'hands';
  if (slot === 'leg_left') return 'legs';
  if (slot === 'leg_right') return 'feet';
  if (slot === 'neck_back') return 'neck';
  return slot;
}

// Dedução inteligente de slot caso o item não tenha um explicitamente configurado
export function inferItemSlot(item: AnyItem): EquipmentSlot {
  if (item.slot) return normalizeSlot(item.slot) || item.slot;
  const name = item.name.toLowerCase();
  const loc = (item.location || '').toLowerCase();

  // 1 Armaduras
  if (name.includes('coifa') || name.includes('elmo') || name.includes('capacete') || name.includes('máscara') || name.includes('tiara') || name.includes('chapéu')) {
    return 'head';
  }
  if (name.includes('ombro') || name.includes('ombreira')) {
    return 'shoulders';
  }
  if (name.includes('couraça') || name.includes('hauberk') || name.includes('peitoral') || name.includes('camisa') || name.includes('cota') || name.includes('túnica')) {
    return 'chest';
  }
  if (name.includes('braçadeira') || name.includes('pulso') || name.includes('bracelete')) {
    return 'wrist';
  }
  if (name.includes('luva') || name.includes('manopla')) {
    return 'hands';
  }
  if (name.includes('cinto') || name.includes('cintura') || name.includes('faixa')) {
    return 'waist';
  }
  if (name.includes('calça') || name.includes('perneira') || name.includes('greva')) {
    return 'legs';
  }
  if (name.includes('bota') || name.includes('sapato') || name.includes('calçado')) {
    return 'feet';
  }

  // 2 Não-Armaduras
  if (name.includes('colar') || name.includes('gargantilha') || (name.includes('amuleto') && loc.includes('pescoço')) || loc.includes('pescoço')) {
    return 'neck';
  }
  if (name.includes('manto') || name.includes('capa') || loc.includes('costas') || name.includes('mochila')) {
    return 'back';
  }
  if (name.includes('anel') || name.includes('aliança') || name.includes('dedo')) {
    return 'finger';
  }
  if (name.includes('berloque') || name.includes('relíquia') || name.includes('tambor') || name.includes('fetiche') || name.includes('amuleto')) {
    return 'trinket';
  }

  // 3 Armas
  if (name.includes('escudo') || name.includes('broquel') || name.includes('mambele') || name.includes('faca') || name.includes('dardo') || name.includes('flecha')) {
    return 'off_hand';
  }
  if (item.category === 'weapon') {
    return 'main_hand';
  }
  if (item.category === 'projectile') {
    return 'off_hand';
  }
  if (item.category === 'armor') {
    return 'chest';
  }
  if (item.category === 'accessory') {
    return 'trinket';
  }

  return 'chest';
}

// Qualidade / Raridade visual ao estilo WoW
export function getItemRarity(item: AnyItem): {
  color: string;
  border: string;
  glow: string;
  bgGlow: string;
  text: string;
  label: string;
} {
  const explicitRarity = ((item as any).rarity || '').toLowerCase();
  const name = item.name.toLowerCase();
  const extras = (('extras' in item ? item.extras : '') || '').toLowerCase();
  const desc = (('description' in item ? item.description : '') || '').toLowerCase();
  const allText = `${explicitRarity} ${name} ${extras} ${desc}`;

  // Artefato (Dourado Claro: #e6cc80)
  if (allText.includes('artefato') || allText.includes('artifact') || allText.includes('5*')) {
    return {
      color: '#e6cc80',
      border: 'border-[#e6cc80]',
      glow: 'shadow-[0_0_16px_rgba(230,204,128,0.5)]',
      bgGlow: 'bg-[#e6cc80]/15',
      text: 'text-[#e6cc80]',
      label: 'Artefato'
    };
  }

  // Lendário (Laranja WoW: #ff8000)
  if (allText.includes('lendári') || allText.includes('legendary') || allText.includes('alabarda') || allText.includes('4*') || allText.includes('dragão') || allText.includes('antigo') || allText.includes('sagrado')) {
    return {
      color: '#ff8000',
      border: 'border-[#ff8000]',
      glow: 'shadow-[0_0_16px_rgba(255,128,0,0.5)]',
      bgGlow: 'bg-[#ff8000]/15',
      text: 'text-[#ff8000]',
      label: 'Lendário'
    };
  }

  // Épico (Roxo WoW: #a335ee)
  if (allText.includes('épic') || allText.includes('epic') || allText.includes('iberi') || allText.includes('3*') || allText.includes('hauberk') || allText.includes('vitalidade') || allText.includes('mambele') || allText.includes('constelar')) {
    return {
      color: '#a335ee',
      border: 'border-[#a335ee]',
      glow: 'shadow-[0_0_14px_rgba(163,53,238,0.45)]',
      bgGlow: 'bg-[#a335ee]/15',
      text: 'text-[#a335ee]',
      label: 'Épico'
    };
  }

  // Raro (Azul WoW: #0070dd)
  if (allText.includes('raro') || allText.includes('rare') || allText.includes('ferro') || allText.includes('couraça') || allText.includes('coifa') || allText.includes('kit') || allText.includes('água') || allText.includes('2*')) {
    return {
      color: '#0070dd',
      border: 'border-[#0070dd]',
      glow: 'shadow-[0_0_12px_rgba(0,112,221,0.4)]',
      bgGlow: 'bg-[#0070dd]/15',
      text: 'text-[#0070dd]',
      label: 'Raro'
    };
  }

  // Incomum (Verde mate apagado e sem brilho)
  if (allText.includes('incomum') || allText.includes('uncommon') || allText.includes('couro') || allText.includes('adaga') || allText.includes('corda') || allText.includes('tambor') || allText.includes('1*')) {
    return {
      color: '#4ade80',
      border: 'border-emerald-500/30',
      glow: 'shadow-none',
      bgGlow: 'bg-emerald-500/5',
      text: 'text-emerald-300/80',
      label: 'Incomum'
    };
  }

  // Pobre (Cinza suave)
  if (allText.includes('pobre') || allText.includes('poor') || allText.includes('lixo') || allText.includes('quebrado') || allText.includes('cinza')) {
    return {
      color: '#94a3b8',
      border: 'border-slate-600/30',
      glow: 'shadow-none',
      bgGlow: 'bg-slate-500/5',
      text: 'text-slate-400',
      label: 'Pobre'
    };
  }

  // Comum (Cinza claro apagado, neutro e sem brilho)
  return {
    color: '#94a3b8',
    border: 'border-slate-500/30',
    glow: 'shadow-none',
    bgGlow: 'bg-white/[0.03]',
    text: 'text-slate-300',
    label: 'Comum'
  };
}

// Ícone visual representativo do item
export const ItemIcon: React.FC<{ item: AnyItem; size?: number; className?: string }> = ({ item, size = 18, className = '' }) => {
  const name = item.name.toLowerCase();

  if (item.category === 'weapon') {
    return <Sword size={size} className={className || 'text-amber-400'} />;
  }
  if (item.category === 'projectile') {
    return <Target size={size} className={className || 'text-emerald-400'} />;
  }
  if (item.category === 'armor') {
    if (name.includes('escudo')) return <ShieldCheck size={size} className={className || 'text-cyan-400'} />;
    if (name.includes('coifa') || name.includes('elmo')) return <Crown size={size} className={className || 'text-cyan-300'} />;
    if (name.includes('bota') || name.includes('calça')) return <Footprints size={size} className={className || 'text-amber-300'} />;
    return <Shirt size={size} className={className || 'text-cyan-400'} />;
  }
  if (item.category === 'accessory') {
    return <Sparkles size={size} className={className || 'text-violet-400'} />;
  }

  // Itens Gerais
  if (name.includes('poção') || name.includes('unguento') || name.includes('erva')) {
    return <FlaskConical size={size} className={className || 'text-pink-400'} />;
  }
  if (name.includes('tocha') || name.includes('pederneira') || name.includes('fogo')) {
    return <Flame size={size} className={className || 'text-orange-400'} />;
  }
  if (name.includes('ferramenta') || name.includes('corda') || name.includes('gancho')) {
    return <Wrench size={size} className={className || 'text-yellow-400'} />;
  }
  return <Package size={size} className={className || 'text-sky-400'} />;
};

// Tipo do Tooltip Flutuante
type HoveredTooltipState = 
  | { type: 'item'; item: AnyItem; x: number; y: number }
  | { type: 'slot'; slot: SlotDefinition; x: number; y: number }
  | null;

// Normalizador de moedas: 100 Cobre = 1 Prata (máx 99 Cobre), 100 Prata = 1 Ouro (máx 99 Prata)
export const normalizeCurrency = (gold: number = 0, silver: number = 0, copper: number = 0) => {
  const totalCopper = Math.max(0, (Math.floor(gold || 0) * 10000) + (Math.floor(silver || 0) * 100) + Math.floor(copper || 0));
  const g = Math.floor(totalCopper / 10000);
  const rem = totalCopper % 10000;
  const s = Math.floor(rem / 100);
  const c = rem % 100;
  return { gold: g, silver: s, copper: c, totalCopper };
};

export const InventoryManager: React.FC<Props> = ({
  inventory,
  onUpdateInventory,
  readonly,
  onRollDamage
}) => {
  // Estados de navegação e filtros
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'weapons' | 'armors' | 'projectiles' | 'accessories' | 'supplies'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bagViewMode, setBagViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'default' | 'name' | 'rarity' | 'weight'>('default');
  
  // Hover & Tooltip flutuante de alta precisão
  const [hoveredTooltip, setHoveredTooltip] = useState<HoveredTooltipState>(null);
  const [selectedItem, setSelectedItem] = useState<AnyItem | null>(null);

  // Modal para escolher item a equipar em um slot do Paperdoll
  const [slotPickerTarget, setSlotPickerTarget] = useState<EquipmentSlot | null>(null);

  // Modal de Adicionar Novo Item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<'general' | 'weapon' | 'armor' | 'projectile' | 'accessory'>('general');
  const [newItemName, setNewItemName] = useState('');
  const [newItemSlot, setNewItemSlot] = useState<EquipmentSlot>('chest');
  const [newItemWeight, setNewItemWeight] = useState(1000);
  const [newItemSize, setNewItemSize] = useState('m');
  const [newItemEquipped, setNewItemEquipped] = useState(false);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemExtras, setNewItemExtras] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Estados específicos de arma / armadura / projétil
  const [weaponThrustDmg, setWeaponThrustDmg] = useState('1d8');
  const [weaponThrustType, setWeaponThrustType] = useState('per');
  const [weaponThrustAP, setWeaponThrustAP] = useState(4);
  const [weaponThrustPre, setWeaponThrustPre] = useState(2);
  const [weaponSwingDmg, setWeaponSwingDmg] = useState('1d6');
  const [weaponSwingType, setWeaponSwingType] = useState('cor');
  const [weaponSwingAP, setWeaponSwingAP] = useState(5);
  const [weaponSwingPre, setWeaponSwingPre] = useState(1);

  const [armorSlashing, setArmorSlashing] = useState(2);
  const [armorBludgeoning, setArmorBludgeoning] = useState(2);
  const [armorPiercing, setArmorPiercing] = useState(2);
  const [armorCoverage, setArmorCoverage] = useState(8);
  const [armorResistance, setArmorResistance] = useState(15);
  const [armorDurability, setArmorDurability] = useState(8);

  const [projDmg, setProjDmg] = useState('1d8');
  const [projType, setProjType] = useState('cor');
  const [projAP, setProjAP] = useState(5);
  const [projPre, setProjPre] = useState(3);

  // Modal de Edição de Item Existente
  const [editingItem, setEditingItem] = useState<AnyItem | null>(null);

  // Sistema de Categorias Pré-configuradas de Equipamentos & Parsing
  const [selectedEquipCategoryKey, setSelectedEquipCategoryKey] = useState<EquipmentCategoryKey>('arma_1m');

  // Modal Simples de Movimentação de Moedas & Histórico
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [moveOpType, setMoveOpType] = useState<'income' | 'expense'>('income');
  const [moveGold, setMoveGold] = useState<number | ''>('');
  const [moveSilver, setMoveSilver] = useState<number | ''>('');
  const [moveCopper, setMoveCopper] = useState<number | ''>('');
  const [moveReason, setMoveReason] = useState<string>('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fallbacks de segurança e Moeda Normalizada (100 Cobre = 1 Prata, 100 Prata = 1 Ouro)
  const rawCurrency: Currency = inventory.currency || { gold: 0, silver: 0, copper: 0, gems: '' };
  const normalizedCurrency = useMemo(() => {
    const totalCopper = Math.max(0, (Math.floor(rawCurrency.gold || 0) * 10000) + (Math.floor(rawCurrency.silver || 0) * 100) + Math.floor(rawCurrency.copper || 0));
    const g = Math.floor(totalCopper / 10000);
    const rem = totalCopper % 10000;
    const s = Math.floor(rem / 100);
    const c = rem % 100;
    return { gold: g, silver: s, copper: c, totalCopper };
  }, [rawCurrency.gold, rawCurrency.silver, rawCurrency.copper]);

  const currency: Currency = {
    ...rawCurrency,
    gold: normalizedCurrency.gold,
    silver: normalizedCurrency.silver,
    copper: normalizedCurrency.copper
  };
  const generalItems: GeneralItem[] = inventory.generalItems || [];
  const weapons: WeaponItem[] = inventory.weapons || [];
  const armors: ArmorItem[] = inventory.armors || [];
  const projectiles: ProjectileItem[] = inventory.projectiles || [];
  const accessories: AccessoryItem[] = inventory.accessories || [];

  // Lista unificada de todos os itens
  const allItems: AnyItem[] = useMemo(() => {
    return [
      ...weapons,
      ...armors,
      ...projectiles,
      ...accessories,
      ...generalItems
    ];
  }, [weapons, armors, projectiles, accessories, generalItems]);

  // Mapa de itens atualmente equipados em cada Slot
  const equippedBySlot = useMemo(() => {
    const map = new Map<EquipmentSlot, AnyItem>();
    
    weapons.filter(w => w.equipped).forEach(w => {
      const slot = inferItemSlot(w);
      if (!map.has(slot)) map.set(slot, w);
    });

    armors.filter(a => a.equipped).forEach(a => {
      const slot = inferItemSlot(a);
      if (!map.has(slot)) map.set(slot, a);
    });

    projectiles.filter(p => p.equipped).forEach(p => {
      const slot = inferItemSlot(p);
      if (!map.has(slot)) map.set(slot, p);
    });

    accessories.filter(acc => acc.equipped).forEach(acc => {
      const slot = inferItemSlot(acc);
      if (!map.has(slot)) map.set(slot, acc);
    });

    generalItems.filter(g => g.equipped).forEach(g => {
      const slot = inferItemSlot(g);
      if (!map.has(slot)) map.set(slot, g);
    });

    return map;
  }, [weapons, armors, projectiles, accessories, generalItems]);

  // Resumo de carga e defesas ativas
  const { totalWeightG, equippedWeightG, storedWeightG, activeDefense } = useMemo(() => {
    let totalG = 0;
    let equippedG = 0;
    let sumSlashing = 0;
    let sumBludgeoning = 0;
    let sumPiercing = 0;
    let maxCoverage = 0;
    let maxResistance = 0;
    let equippedArmorCount = 0;

    allItems.forEach(item => {
      const qty = 'quantity' in item && typeof item.quantity === 'number' ? item.quantity : 1;
      const weight = (item.weight || 0) * qty;
      totalG += weight;

      if (item.equipped) {
        equippedG += weight;
        if (item.category === 'armor') {
          equippedArmorCount++;
          sumSlashing += item.slashing || 0;
          sumBludgeoning += item.bludgeoning || 0;
          sumPiercing += item.piercing || 0;
          maxCoverage = Math.max(maxCoverage, item.coverage || 0);
          maxResistance = Math.max(maxResistance, item.resistance || 0);
        }
      }
    });

    return {
      totalWeightG: totalG,
      equippedWeightG: equippedG,
      storedWeightG: Math.max(0, totalG - equippedG),
      activeDefense: {
        count: equippedArmorCount,
        sumSlashing,
        sumBludgeoning,
        sumPiercing,
        maxCoverage,
        maxResistance
      }
    };
  }, [allItems]);

  const formatWeight = (g: number) => {
    if (g >= 1000) {
      return `${(g / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`;
    }
    return `${g} g`;
  };

  // Filtragem e Ordenação da Mochila WoW
  const bagItems = useMemo(() => {
    let list = allItems.filter(item => {
      if (activeCategoryFilter === 'weapons' && item.category !== 'weapon') return false;
      if (activeCategoryFilter === 'armors' && item.category !== 'armor') return false;
      if (activeCategoryFilter === 'projectiles' && item.category !== 'projectile') return false;
      if (activeCategoryFilter === 'accessories' && item.category !== 'accessory') return false;
      if (activeCategoryFilter === 'supplies' && item.category !== 'general') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        const matchDesc = 'description' in item && typeof item.description === 'string' && item.description.toLowerCase().includes(q);
        const matchExtras = 'extras' in item && typeof item.extras === 'string' && item.extras.toLowerCase().includes(q);
        return matchName || matchLoc || matchDesc || matchExtras;
      }

      return true;
    });

    if (sortOption === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'weight') {
      list = [...list].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    } else if (sortOption === 'rarity') {
      const rarityRank = (it: AnyItem) => {
        const r = getItemRarity(it).label;
        if (r === 'Lendário') return 4;
        if (r === 'Épico') return 3;
        if (r === 'Raro') return 2;
        if (r === 'Incomum') return 1;
        return 0;
      };
      list = [...list].sort((a, b) => rarityRank(b) - rarityRank(a));
    }

    return list;
  }, [allItems, activeCategoryFilter, searchQuery, sortOption]);

  const totalBagSlots = Math.max(24, Math.ceil((bagItems.length + 4) / 4) * 4);
  const bagSlotsArray = Array.from({ length: totalBagSlots });

  // ---------------------------------------------------------------------------
  // AÇÕES: EQUIPAR / DESEQUIPAR / SWAP DE ITENS
  // ---------------------------------------------------------------------------
  const equipItemToSlot = (item: AnyItem, targetSlot: EquipmentSlot) => {
    onUpdateInventory(prev => {
      const desequipPrev = (list: any[]) => {
        return list.map(it => {
          if (it.equipped && (inferItemSlot(it) === targetSlot) && it.id !== item.id) {
            return { ...it, equipped: false, location: 'Mochila' };
          }
          if (it.id === item.id) {
            return { ...it, equipped: true, slot: targetSlot, location: 'Equipado' };
          }
          return it;
        });
      };

      return {
        ...prev,
        weapons: desequipPrev(prev.weapons || []),
        armors: desequipPrev(prev.armors || []),
        projectiles: desequipPrev(prev.projectiles || []),
        accessories: desequipPrev(prev.accessories || []),
        generalItems: desequipPrev(prev.generalItems || [])
      };
    });

    setSlotPickerTarget(null);
    if (selectedItem?.id === item.id) {
      setSelectedItem(prev => prev ? { ...prev, equipped: true, slot: targetSlot } : null);
    }
  };

  const unequipItem = (item: AnyItem) => {
    onUpdateInventory(prev => {
      const unequipFromList = (list: any[]) => {
        return list.map(it => {
          if (it.id === item.id) {
            return { ...it, equipped: false, location: 'Mochila' };
          }
          return it;
        });
      };

      return {
        ...prev,
        weapons: unequipFromList(prev.weapons || []),
        armors: unequipFromList(prev.armors || []),
        projectiles: unequipFromList(prev.projectiles || []),
        accessories: unequipFromList(prev.accessories || []),
        generalItems: unequipFromList(prev.generalItems || [])
      };
    });

    if (selectedItem?.id === item.id) {
      setSelectedItem(prev => prev ? { ...prev, equipped: false, location: 'Mochila' } : null);
    }
  };

  const toggleEquipAuto = (item: AnyItem) => {
    if (item.equipped) {
      unequipItem(item);
    } else {
      const slot = inferItemSlot(item);
      equipItemToSlot(item, slot);
    }
  };

  const deleteItem = (item: AnyItem) => {
    onUpdateInventory(prev => {
      const categoryKey = item.category === 'general' ? 'generalItems'
        : item.category === 'weapon' ? 'weapons'
        : item.category === 'armor' ? 'armors'
        : item.category === 'projectile' ? 'projectiles'
        : 'accessories';

      return {
        ...prev,
        [categoryKey]: ((prev[categoryKey] as any[]) || []).filter(it => it.id !== item.id)
      };
    });

    if (selectedItem?.id === item.id) setSelectedItem(null);
    if (hoveredTooltip?.type === 'item' && hoveredTooltip.item.id === item.id) {
      setHoveredTooltip(null);
    }
  };

  const adjustQuantity = (item: AnyItem, delta: number) => {
    onUpdateInventory(prev => {
      if (item.category === 'general') {
        return {
          ...prev,
          generalItems: (prev.generalItems || []).map(g => {
            if (g.id !== item.id) return g;
            return { ...g, quantity: Math.max(0, (g.quantity || 1) + delta) };
          })
        };
      }
      if (item.category === 'projectile') {
        return {
          ...prev,
          projectiles: (prev.projectiles || []).map(p => {
            if (p.id !== item.id) return p;
            return { ...p, quantity: Math.max(0, p.quantity + delta) };
          })
        };
      }
      return prev;
    });
  };

  const adjustArmorDurability = (armorId: string, delta: number) => {
    onUpdateInventory(prev => ({
      ...prev,
      armors: (prev.armors || []).map(a => {
        if (a.id !== armorId) return a;
        return {
          ...a,
          durabilityCurrent: Math.max(0, Math.min(a.durabilityMax, a.durabilityCurrent + delta))
        };
      })
    }));
  };

  const recordTransaction = (coin: 'gold' | 'silver' | 'copper', delta: number, reason?: string) => {
    onUpdateInventory(prev => {
      const cur = prev.currency || { gold: 0, silver: 0, copper: 0, gems: '', history: [] };
      const currentNorm = normalizeCurrency(cur.gold || 0, cur.silver || 0, cur.copper || 0);

      const deltaCopper = coin === 'gold' ? delta * 10000 : coin === 'silver' ? delta * 100 : delta;
      const nextTotalCopper = Math.max(0, currentNorm.totalCopper + deltaCopper);
      const nextNorm = normalizeCurrency(0, 0, nextTotalCopper);

      if (nextNorm.totalCopper === currentNorm.totalCopper) return prev;

      const isInc = delta > 0;
      const coinLabel = coin === 'gold' ? 'Ouro' : coin === 'silver' ? 'Prata' : 'Cobre';
      const newTx: CurrencyTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: isInc ? 'income' : 'expense',
        amount: Math.abs(delta),
        coin,
        reason: reason || (isInc ? `Incremento de ${coinLabel}` : `Decremento de ${coinLabel}`),
        timestamp: Date.now()
      };

      const updatedHistory = [newTx, ...(cur.history || [])].slice(0, 30);

      return {
        ...prev,
        currency: {
          ...cur,
          gold: nextNorm.gold,
          silver: nextNorm.silver,
          copper: nextNorm.copper,
          history: updatedHistory
        }
      };
    });
  };

  const updateCurrency = (coin: 'gold' | 'silver' | 'copper', delta: number) => {
    recordTransaction(coin, delta);
  };

  const handleConfirmCurrencyMovement = () => {
    const isInc = moveOpType === 'income';
    const g = typeof moveGold === 'number' ? moveGold : 0;
    const s = typeof moveSilver === 'number' ? moveSilver : 0;
    const c = typeof moveCopper === 'number' ? moveCopper : 0;

    if (g === 0 && s === 0 && c === 0) {
      setIsCurrencyModalOpen(false);
      return;
    }

    onUpdateInventory(prev => {
      const cur = prev.currency || { gold: 0, silver: 0, copper: 0, gems: '', history: [] };
      const currentNorm = normalizeCurrency(cur.gold || 0, cur.silver || 0, cur.copper || 0);

      const deltaCopper = (isInc ? 1 : -1) * ((g * 10000) + (s * 100) + c);
      const nextTotalCopper = Math.max(0, currentNorm.totalCopper + deltaCopper);
      const nextNorm = normalizeCurrency(0, 0, nextTotalCopper);

      if (nextNorm.totalCopper === currentNorm.totalCopper) {
        return prev;
      }

      const txs: CurrencyTransaction[] = [];
      const parts: string[] = [];
      if (g > 0) parts.push(`${g} O`);
      if (s > 0) parts.push(`${s} P`);
      if (c > 0) parts.push(`${c} C`);

      const summaryText = parts.join(', ');
      const txReason = moveReason.trim() || (isInc ? `Entrada: ${summaryText}` : `Saída: ${summaryText}`);

      txs.push({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: isInc ? 'income' : 'expense',
        amount: g > 0 ? g : s > 0 ? s : c,
        coin: g > 0 ? 'gold' : s > 0 ? 'silver' : 'copper',
        reason: txReason,
        timestamp: Date.now()
      });

      const updatedHistory = [...txs, ...(cur.history || [])].slice(0, 30);

      return {
        ...prev,
        currency: {
          ...cur,
          gold: nextNorm.gold,
          silver: nextNorm.silver,
          copper: nextNorm.copper,
          history: updatedHistory
        }
      };
    });

    setMoveGold('');
    setMoveSilver('');
    setMoveCopper('');
    setMoveReason('');
    setIsCurrencyModalOpen(false);
  };

  const recentTransactions = useMemo(() => {
    return (currency.history || []).slice(0, 3);
  }, [currency.history]);

  useEffect(() => {
    const handleTouch = () => {
      setHoveredTooltip(null);
    };
    window.addEventListener('touchstart', handleTouch, { passive: true });
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  const handleSelectEquipCategory = (catKey: EquipmentCategoryKey) => {
    setSelectedEquipCategoryKey(catKey);
    const cat = EQUIPMENT_CATEGORIES.find(c => c.key === catKey);
    if (!cat) return;
    setNewCategory(cat.kind);
    setNewItemSlot(cat.defaultSlot);
    setNewItemWeight(cat.defaultWeight);
    if (cat.presetTemplates.length > 0) {
      applyPresetTemplate(cat.presetTemplates[0]);
    }
  };

  const applyPresetTemplate = (preset: typeof EQUIPMENT_CATEGORIES[0]['presetTemplates'][0]) => {
    setNewItemName(preset.name);
    setNewItemWeight(preset.weight);
    if (preset.thrustDmg) setWeaponThrustDmg(preset.thrustDmg);
    if (preset.thrustType) setWeaponThrustType(preset.thrustType);
    if (preset.thrustAP !== undefined) setWeaponThrustAP(preset.thrustAP);
    if (preset.thrustPre !== undefined) setWeaponThrustPre(preset.thrustPre);
    if (preset.swingDmg) setWeaponSwingDmg(preset.swingDmg);
    if (preset.swingType) setWeaponSwingType(preset.swingType);
    if (preset.swingAP !== undefined) setWeaponSwingAP(preset.swingAP);
    if (preset.swingPre !== undefined) setWeaponSwingPre(preset.swingPre);
    if (preset.slashing !== undefined) setArmorSlashing(preset.slashing);
    if (preset.bludgeoning !== undefined) setArmorBludgeoning(preset.bludgeoning);
    if (preset.piercing !== undefined) setArmorPiercing(preset.piercing);
    if (preset.coverage !== undefined) setArmorCoverage(preset.coverage);
    if (preset.resistance !== undefined) setArmorResistance(preset.resistance);
    if (preset.durability !== undefined) setArmorDurability(preset.durability);
    if (preset.effects) setNewItemExtras(preset.effects);
  };

  // ---------------------------------------------------------------------------
  // HOVER & MOUSE MOVE DINÂMICO PARA O TOOLTIP FLUTUANTE
  // ---------------------------------------------------------------------------
  const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none), (pointer: coarse)').matches || window.innerWidth < 768;
  };

  const handleItemMouseMove = (item: AnyItem, e: React.MouseEvent) => {
    if (isTouchDevice() || selectedItem || slotPickerTarget || editingItem || isAddModalOpen || isCurrencyModalOpen || isHistoryModalOpen) {
      if (hoveredTooltip) setHoveredTooltip(null);
      return;
    }
    const tooltipWidth = 320;
    const tooltipHeight = 420;
    const padding = 16;
    
    let x = e.clientX + 16;
    let y = e.clientY + 14;

    if (x + tooltipWidth > window.innerWidth - padding) {
      x = e.clientX - tooltipWidth - 16;
    }

    if (y + tooltipHeight > window.innerHeight - padding) {
      y = Math.max(padding, window.innerHeight - tooltipHeight - padding);
    }

    x = Math.max(padding, x);
    y = Math.max(padding, y);

    setHoveredTooltip({ type: 'item', item, x, y });
  };

  const handleSlotMouseMove = (slotDef: SlotDefinition, e: React.MouseEvent) => {
    if (isTouchDevice() || selectedItem || slotPickerTarget || editingItem || isAddModalOpen || isCurrencyModalOpen || isHistoryModalOpen) {
      if (hoveredTooltip) setHoveredTooltip(null);
      return;
    }
    const tooltipWidth = 280;
    const tooltipHeight = 160;
    const padding = 16;

    let x = e.clientX + 16;
    let y = e.clientY + 14;

    if (x + tooltipWidth > window.innerWidth - padding) {
      x = e.clientX - tooltipWidth - 16;
    }
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = Math.max(padding, window.innerHeight - tooltipHeight - padding);
    }

    x = Math.max(padding, x);
    y = Math.max(padding, y);

    setHoveredTooltip({ type: 'slot', slot: slotDef, x, y });
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };

  // ---------------------------------------------------------------------------
  // ADICIONAR NOVO ITEM
  // ---------------------------------------------------------------------------
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const id = `${newCategory[0]}_${Math.random().toString(36).substring(7)}`;

    const unequipSlot = (list: any[]) => {
      if (!newItemEquipped) return list;
      return list.map(it => {
        if (it.equipped && inferItemSlot(it) === newItemSlot) {
          return { ...it, equipped: false, location: 'Mochila' };
        }
        return it;
      });
    };

    if (newCategory === 'weapon') {
      const w: WeaponItem = {
        id,
        name: newItemName.trim(),
        category: 'weapon',
        equipped: newItemEquipped,
        slot: newItemSlot,
        thrust: {
          damage: weaponThrustDmg.trim() || '1d8',
          type: weaponThrustType,
          ap: Number(weaponThrustAP) || 0,
          precision: Number(weaponThrustPre) || 0
        },
        swing: {
          damage: weaponSwingDmg.trim() || '1d6',
          type: weaponSwingType,
          ap: Number(weaponSwingAP) || 0,
          precision: Number(weaponSwingPre) || 0
        },
        size: newItemSize,
        weight: Number(newItemWeight) || 0,
        location: newItemEquipped ? 'Em Mãos' : 'Mochila',
        extras: newItemExtras.trim(),
        description: newItemDesc.trim() || undefined
      };
      onUpdateInventory(prev => ({
        ...prev,
        weapons: [...unequipSlot(prev.weapons || []), w],
        armors: unequipSlot(prev.armors || []),
        projectiles: unequipSlot(prev.projectiles || []),
        accessories: unequipSlot(prev.accessories || []),
        generalItems: unequipSlot(prev.generalItems || [])
      }));
    } else if (newCategory === 'armor') {
      const a: ArmorItem = {
        id,
        name: newItemName.trim(),
        category: 'armor',
        equipped: newItemEquipped,
        slot: newItemSlot,
        slashing: Number(armorSlashing) || 0,
        bludgeoning: Number(armorBludgeoning) || 0,
        piercing: Number(armorPiercing) || 0,
        coverage: Number(armorCoverage) || 0,
        resistance: Number(armorResistance) || 0,
        durabilityMax: Number(armorDurability) || 8,
        durabilityCurrent: Number(armorDurability) || 8,
        size: newItemSize,
        weight: Number(newItemWeight) || 0,
        location: newItemEquipped ? 'Equipado' : 'Mochila',
        extras: newItemExtras.trim(),
        description: newItemDesc.trim() || undefined
      };
      onUpdateInventory(prev => ({
        ...prev,
        weapons: unequipSlot(prev.weapons || []),
        armors: [...unequipSlot(prev.armors || []), a],
        projectiles: unequipSlot(prev.projectiles || []),
        accessories: unequipSlot(prev.accessories || []),
        generalItems: unequipSlot(prev.generalItems || [])
      }));
    } else if (newCategory === 'projectile') {
      const p: ProjectileItem = {
        id,
        name: newItemName.trim(),
        category: 'projectile',
        equipped: newItemEquipped,
        slot: newItemSlot,
        damage: projDmg.trim() || '1d8',
        type: projType,
        ap: Number(projAP) || 0,
        precision: Number(projPre) || 0,
        quantity: Math.max(1, Number(newItemQuantity) || 1),
        size: newItemSize,
        weight: Number(newItemWeight) || 0,
        location: newItemEquipped ? 'Coldre' : 'Mochila',
        extras: newItemExtras.trim(),
        description: newItemDesc.trim() || undefined
      };
      onUpdateInventory(prev => ({
        ...prev,
        weapons: unequipSlot(prev.weapons || []),
        armors: unequipSlot(prev.armors || []),
        projectiles: [...unequipSlot(prev.projectiles || []), p],
        accessories: unequipSlot(prev.accessories || []),
        generalItems: unequipSlot(prev.generalItems || [])
      }));
    } else if (newCategory === 'accessory') {
      const acc: AccessoryItem = {
        id,
        name: newItemName.trim(),
        category: 'accessory',
        equipped: newItemEquipped,
        slot: newItemSlot,
        typeAndDesc: 'Acessório Místico / Utilitário',
        effect: newItemExtras.trim(),
        description: newItemDesc.trim() || undefined,
        size: newItemSize,
        weight: Number(newItemWeight) || 0,
        location: newItemEquipped ? 'No Corpo' : 'Mochila'
      };
      onUpdateInventory(prev => ({
        ...prev,
        weapons: unequipSlot(prev.weapons || []),
        armors: unequipSlot(prev.armors || []),
        projectiles: unequipSlot(prev.projectiles || []),
        accessories: [...unequipSlot(prev.accessories || []), acc],
        generalItems: unequipSlot(prev.generalItems || [])
      }));
    } else {
      const gen: GeneralItem = {
        id,
        name: newItemName.trim(),
        category: 'general',
        itemType: 'supply',
        quantity: Math.max(1, Number(newItemQuantity) || 1),
        weight: Number(newItemWeight) || 0,
        equipped: newItemEquipped,
        slot: newItemSlot,
        location: newItemEquipped ? 'Cinto' : 'Mochila',
        description: newItemDesc.trim() || newItemExtras.trim()
      };
      onUpdateInventory(prev => ({
        ...prev,
        weapons: unequipSlot(prev.weapons || []),
        armors: unequipSlot(prev.armors || []),
        projectiles: unequipSlot(prev.projectiles || []),
        accessories: unequipSlot(prev.accessories || []),
        generalItems: [...unequipSlot(prev.generalItems || []), gen]
      }));
    }

    setNewItemName('');
    setNewItemExtras('');
    setNewItemDesc('');
    setIsAddModalOpen(false);
  };

  // ---------------------------------------------------------------------------
  // EDITAR ITEM EXISTENTE
  // ---------------------------------------------------------------------------
  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateInventory(prev => {
      const updateInList = (list: any[]) => {
        return list.map(it => (it.id === editingItem.id ? editingItem : it));
      };

      if (editingItem.category === 'weapon') {
        return { ...prev, weapons: updateInList(prev.weapons || []) };
      }
      if (editingItem.category === 'armor') {
        return { ...prev, armors: updateInList(prev.armors || []) };
      }
      if (editingItem.category === 'projectile') {
        return { ...prev, projectiles: updateInList(prev.projectiles || []) };
      }
      if (editingItem.category === 'accessory') {
        return { ...prev, accessories: updateInList(prev.accessories || []) };
      }
      return { ...prev, generalItems: updateInList(prev.generalItems || []) };
    });

    if (selectedItem?.id === editingItem.id) {
      setSelectedItem(editingItem);
    }
    setEditingItem(null);
  };

  // ---------------------------------------------------------------------------
  // COMPONENTE: CONTEÚDO DETALHADO DO CARD DO ITEM (TOOLTIP / INSPEÇÃO)
  // ---------------------------------------------------------------------------
  const renderItemDetailsCard = (item: AnyItem, isFloatingPreview = false) => {
    const rarity = getItemRarity(item);
    const assignedSlot = inferItemSlot(item);
    const slotDef = EQUIPMENT_SLOTS.find(s => s.id === assignedSlot);
    const qty = 'quantity' in item && typeof item.quantity === 'number' ? item.quantity : 1;
    const totalItemWeight = (item.weight || 0) * qty;

    return (
      <div className="flex flex-col gap-2.5 text-xs text-left">
        {/* Barra luminosa no topo acompanhando a cor da raridade do item */}
        <div 
          className="w-full h-1 rounded-full mb-1" 
          style={{ 
            backgroundColor: rarity.color, 
            boxShadow: (rarity.label === 'Comum' || rarity.label === 'Incomum' || rarity.label === 'Pobre') ? 'none' : `0 0 10px ${rarity.color}` 
          }} 
        />

        {/* Topo do Card: Qualidade, Status e Nome */}
        <div className="border-b border-white/10 pb-2.5">
          <div className="flex items-center justify-between gap-2">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                color: rarity.color,
                borderColor: `${rarity.color}80`,
                backgroundColor: `${rarity.color}15`,
                boxShadow: (rarity.label === 'Comum' || rarity.label === 'Incomum' || rarity.label === 'Pobre') ? 'none' : `0 0 8px ${rarity.color}30`
              }}
            >
              {rarity.label}
            </span>

            {item.equipped ? (
              <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                <Check size={11} className="text-amber-400" />
                <span>Equipado no Corpo</span>
              </span>
            ) : (
              <span className="text-[10px] text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                Guardado na Mochila
              </span>
            )}
          </div>

          <h3 
            className="text-base font-bold mt-1.5 leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{ color: rarity.color }}
          >
            {item.name}
          </h3>

          <div className="flex items-center justify-between text-[11px] text-white/60 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="text-white/40 uppercase text-[10px]">Espaço:</span>
              <strong className="text-amber-300 font-semibold">{slotDef ? slotDef.label : 'Corpo / Mochila'}</strong>
            </span>
            {'size' in item && item.size && (
              <span className="uppercase font-mono bg-white/5 px-1.5 py-0.2 rounded text-white/70 border border-white/10">
                Tam: {item.size}
              </span>
            )}
          </div>
        </div>

        {/* PESO EM DESTAQUE COM ÍCONE DEDICADO */}
        <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <Scale size={14} className="text-amber-400/80" />
            <span className="text-[11px] text-white/60">Peso:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white text-xs">
              {formatWeight(item.weight || 0)}
            </span>
            {qty > 1 && (
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/30">
                Total ({qty}x): {formatWeight(totalItemWeight)}
              </span>
            )}
          </div>
        </div>

        {/* ESTATÍSTICAS DE ARMAS */}
        {item.category === 'weapon' && (
          <div className="flex flex-col gap-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/25">
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <span className="text-amber-300 font-bold uppercase text-[10px] tracking-wider">Estocada: </span>
                <span className="font-mono font-bold text-white text-xs">{item.thrust.damage}</span>
                <span className="text-white/50 uppercase ml-1">({item.thrust.type})</span>
                <div className="text-[10px] text-white/60">AP {item.thrust.ap} • Prec. +{item.thrust.precision}</div>
              </div>
              {readonly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRollDamage(item.name, 'Estocada', item.thrust.damage, item.thrust.type, item.thrust.ap, item.thrust.precision);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Rolar dano de estocada"
                >
                  <Dices size={12} />
                  <span>Rolar</span>
                </button>
              )}
            </div>

            <div className="h-px bg-amber-500/20" />

            <div className="flex items-center justify-between text-[11px]">
              <div>
                <span className="text-amber-300 font-bold uppercase text-[10px] tracking-wider">Golpe: </span>
                <span className="font-mono font-bold text-white text-xs">{item.swing.damage}</span>
                <span className="text-white/50 uppercase ml-1">({item.swing.type})</span>
                <div className="text-[10px] text-white/60">AP {item.swing.ap} • Prec. +{item.swing.precision}</div>
              </div>
              {readonly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRollDamage(item.name, 'Golpe', item.swing.damage, item.swing.type, item.swing.ap, item.swing.precision);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Rolar dano de golpe"
                >
                  <Dices size={12} />
                  <span>Rolar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ESTATÍSTICAS DE ARMADURAS */}
        {item.category === 'armor' && (
          <div className="flex flex-col gap-2 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/25">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
                <div className="text-[9px] text-white/50 uppercase">Corte</div>
                <div className="font-mono font-bold text-cyan-300 text-xs">+{item.slashing}</div>
              </div>
              <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
                <div className="text-[9px] text-white/50 uppercase">Esmag.</div>
                <div className="font-mono font-bold text-cyan-300 text-xs">+{item.bludgeoning}</div>
              </div>
              <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
                <div className="text-[9px] text-white/50 uppercase">Perf.</div>
                <div className="font-mono font-bold text-cyan-300 text-xs">+{item.piercing}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-cyan-500/20">
              <span>Cobertura: <strong className="text-amber-300 font-mono">{item.coverage}</strong></span>
              <span>Resistência: <strong className="text-emerald-300 font-mono">{item.resistance}</strong></span>
            </div>

            {/* Durabilidade com Barra de Integridade */}
            <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/60">Durabilidade:</span>
                <span className="font-mono font-bold text-slate-200">
                  {item.durabilityCurrent} / {item.durabilityMax}
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div 
                  className={`h-full transition-all ${
                    item.durabilityCurrent <= 2 ? 'bg-rose-500' : item.durabilityCurrent <= 4 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (item.durabilityCurrent / item.durabilityMax) * 100))}%` }}
                />
              </div>

              {!readonly && (
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustArmorDurability(item.id, -1); }}
                    disabled={item.durabilityCurrent <= 0}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Diminuir Durabilidade"
                  >
                    <Minus size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); adjustArmorDurability(item.id, 1); }}
                    disabled={item.durabilityCurrent >= item.durabilityMax}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Reparar Durabilidade"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ESTATÍSTICAS DE PROJÉTEIS */}
        {item.category === 'projectile' && (
          <div className="flex items-center justify-between bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/25">
            <div>
              <span className="text-emerald-300 font-bold uppercase text-[10px]">Dano: </span>
              <span className="font-mono font-bold text-white text-xs">{item.damage}</span>
              <span className="text-white/50 uppercase ml-1">({item.type})</span>
              <div className="text-[10px] text-white/60">AP {item.ap} • Prec. +{item.precision}</div>
            </div>
            {readonly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRollDamage(item.name, 'Disparo', item.damage, item.type, item.ap, item.precision);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Disparar Projétil"
              >
                <Dices size={12} />
                <span>Disparar</span>
              </button>
            )}
          </div>
        )}

        {/* ESTATÍSTICAS DE ITENS GERAIS / CONSUMÍVEIS */}
        {item.category === 'general' && (
          <div className="flex flex-col gap-2 bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/25">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/60">Em estoque:</span>
              <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                <button
                  onClick={(e) => { e.stopPropagation(); adjustQuantity(item, -1); }}
                  disabled={item.quantity <= 0}
                  className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/20 text-white disabled:opacity-30"
                  title="Consumir 1 unidade"
                >
                  <Minus size={10} />
                </button>
                <span className="font-mono font-bold text-sky-400 px-1">{item.quantity}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); adjustQuantity(item, 1); }}
                  className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/20 text-white"
                  title="Adicionar 1 unidade"
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACESSÓRIOS */}
        {item.category === 'accessory' && (
          <div className="flex flex-col gap-1.5 bg-violet-500/10 p-2.5 rounded-xl border border-violet-500/25">
            {item.typeAndDesc && (
              <div className="text-[11px] font-semibold text-violet-300">{item.typeAndDesc}</div>
            )}
            {item.effect && (
              <p className="text-[11px] text-slate-300 italic bg-black/30 p-2 rounded-lg border border-white/5">
                {item.effect}
              </p>
            )}
          </div>
        )}

        {/* DESCRIÇÃO E HISTÓRIA DO ITEM */}
        {(('description' in item && item.description) || ('extras' in item && item.extras)) && (
          <div className="text-[11px] text-amber-200/80 italic bg-[#0f0a1c] p-2.5 rounded-xl border border-amber-500/20">
            &ldquo;{'description' in item && item.description ? item.description : ('extras' in item ? item.extras : '')}&rdquo;
          </div>
        )}

        {/* BARRA DE AÇÕES (EQUIPAR / DESEQUIPAR / EDITAR / EXCLUIR) */}
        {!isFloatingPreview && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleEquipAuto(item);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                item.equipped
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              {item.equipped ? (
                <>
                  <X size={13} />
                  <span>Desequipar para a Mochila</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>Equipar no Corpo</span>
                </>
              )}
            </button>

            {!readonly && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingItem(item);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition-all"
                  title="Editar Propriedades do Item"
                >
                  <Edit3 size={14} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item);
                  }}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all"
                  title="Excluir Item do Personagem"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {isFloatingPreview && (
          <div className="pt-1.5 border-t border-white/10 text-[10px] text-white/40 italic text-center">
            * Clique para inspecionar ou botão direito para equipar
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDERIZAÇÃO DE UM SLOT DE EQUIPAMENTO
  // ---------------------------------------------------------------------------
  const renderSlotCard = (slotDef: SlotDefinition) => {
    const equippedItem = equippedBySlot.get(slotDef.id);
    const SlotIcon = slotDef.icon;
    const rarity = equippedItem ? getItemRarity(equippedItem) : null;

    return (
      <div 
        key={slotDef.id}
        onDoubleClick={() => {
          if (equippedItem) unequipItem(equippedItem);
        }}
        className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#090616]/90 border border-white/5 hover:border-amber-500/30 transition-all group relative cursor-pointer"
      >
        {/* Caixa de Equipamento Estilo WoW */}
        <button
          onClick={() => {
            setHoveredTooltip(null);
            if (equippedItem) {
              setSelectedItem(equippedItem);
            } else {
              setSlotPickerTarget(slotDef.id);
            }
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (equippedItem) unequipItem(equippedItem);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (equippedItem) unequipItem(equippedItem);
          }}
          onMouseMove={(e) => {
            if (equippedItem) {
              handleItemMouseMove(equippedItem, e);
            } else {
              handleSlotMouseMove(slotDef, e);
            }
          }}
          onMouseLeave={handleMouseLeave}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden select-none cursor-pointer shrink-0 ${
            equippedItem && rarity
              ? `bg-[#0e0a1b]/95 ${rarity.glow} hover:scale-105`
              : 'bg-[#080511]/80 border-dashed border-white/20 hover:border-amber-500/60 hover:bg-amber-500/5'
          }`}
          style={{
            borderColor: equippedItem && rarity ? rarity.color : undefined
          }}
          title={`${slotDef.label}: ${equippedItem ? `${equippedItem.name} (Clique duplo para desequipar)` : 'Vazio (Clique para equipar)'}`}
        >
          {equippedItem ? (
            <>
              {/* Ícone e Brilho do Item */}
              <ItemIcon item={equippedItem} size={22} />

              {/* Indicador de Quantidade se for > 1 */}
              {'quantity' in equippedItem && typeof equippedItem.quantity === 'number' && equippedItem.quantity > 1 && (
                <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold text-sky-300 bg-black/80 px-1 rounded border border-sky-400/40 leading-none">
                  {equippedItem.quantity}
                </span>
              )}

              {/* Marcador de integridade se for armadura */}
              {equippedItem.category === 'armor' && (
                <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              )}
            </>
          ) : (
            <SlotIcon size={18} className="text-white/20 group-hover:text-amber-400/60 transition-colors" />
          )}
        </button>

        {/* Rótulo do Slot com Nome e Status (Apenas PT-BR) */}
        <div className="flex flex-col min-w-0 text-left flex-1 justify-center">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400/90 leading-tight">
            {slotDef.label}
          </span>
          
          <span 
            className="text-xs font-semibold truncate leading-snug mt-0.5"
            style={{ color: equippedItem && rarity ? rarity.color : undefined }}
          >
            {equippedItem ? equippedItem.name : <span className="text-white/30 italic text-[11px]">Vazio</span>}
          </span>

          {equippedItem && (
            <div className="flex items-center justify-between text-[10px] text-white/50 font-mono mt-0.5">
              <span className="text-amber-300 font-bold">
                {formatWeight(equippedItem.weight || 0)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Separação em dois pilares de slots (7 slots em cada coluna)
  const pillar1Slots = EQUIPMENT_SLOTS.slice(0, 7);
  const pillar2Slots = EQUIPMENT_SLOTS.slice(7, 14);

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {/* ========================================================================= */}
      {/* 1. SEÇÃO DE ESPAÇOS DE EQUIPAMENTO (DOIS PILARES DE SLOTS)                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-b from-[#0e091c] via-[#090514] to-[#04020a] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col gap-6 relative overflow-hidden">
        {/* Glows Místicos de Fundo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Topo do Painel de Equipamentos */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            {/* Ícone com altura de 2 linhas */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <ShieldCheck size={22} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
            </div>

            {/* Duas Linhas */}
            <div className="flex flex-col justify-center">
              {/* Linha de cima: SÓ o título */}
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-amber-400">
                Espaços de Equipamento
              </span>
              {/* Linha de baixo: resumo de slots e peso */}
              <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5 font-mono">
                <span>{EQUIPMENT_SLOTS.filter(s => equippedBySlot.has(s.id)).length} / 14 equipados</span>
                <span className="text-white/20">·</span>
                <span>Carga: <strong className="text-amber-300 font-semibold">{formatWeight(equippedWeightG)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* DOIS PILARES DE SLOTS DE EQUIPAMENTO (AGRUPAMENTO APENAS CONCEITUAL) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 relative z-10">
          {/* Pilar Esquerdo (7 slots) */}
          <div className="flex flex-col gap-2.5">
            {pillar1Slots.map(renderSlotCard)}
          </div>

          {/* Pilar Direito (7 slots) */}
          <div className="flex flex-col gap-2.5">
            {pillar2Slots.map(renderSlotCard)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOCHILA DE ITENS (GRID DE CAIXINHAS AO ESTILO WOW)                       */}
      {/* ========================================================================= */}
      <div className="bg-[#090614] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
        {/* Cabeçalho da Mochila */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Backpack size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Mochila do Aventureiro
              </h3>
            </div>
          </div>

          {/* Botão de Adicionar Novo Item & Peso da Mochila */}
          <div className="flex items-center gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 flex flex-col text-right">
              <span className="text-[9px] uppercase font-bold text-white/40">Carga na Mochila</span>
              <span className="text-xs font-mono font-bold text-sky-300">{formatWeight(storedWeightG)}</span>
            </div>

            {!readonly && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              >
                <Plus size={14} />
                <span>Novo Item</span>
              </button>
            )}
          </div>
        </div>

        {/* BOLSA DE RIQUEZAS NO TOPO (O, P, C) */}
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-600/10 border border-amber-500/20 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm w-full">
          {/* Lado Esquerdo: Ícone + Título (Em linha única sem quebras) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Coins size={20} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300 whitespace-nowrap select-none">
              Bolsa de Riquezas
            </span>
          </div>

          {/* Lado Direito: Caixinhas das moedas e botões de ação (+ e Lista) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-end shrink-0">
            {/* Ouro (O) */}
            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-inner select-none shrink-0" title="Ouro (O)">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] inline-block shrink-0" />
              <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">{normalizedCurrency.gold}</span>
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">O</span>
            </div>

            {/* Prata (P) - 0 a 99 (100 P = 1 O) */}
            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-slate-300/30 shadow-inner select-none shrink-0" title="Prata (P) - 0 a 99 (100 P vira 1 O)">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.8)] inline-block shrink-0" />
              <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm">{normalizedCurrency.silver}</span>
              <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">P</span>
            </div>

            {/* Cobre (C) - 0 a 99 (100 C = 1 P) */}
            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-orange-500/30 shadow-inner select-none shrink-0" title="Cobre (C) - 0 a 99 (100 C vira 1 P)">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] inline-block shrink-0" />
              <span className="font-mono font-bold text-orange-300 text-xs sm:text-sm">{normalizedCurrency.copper}</span>
              <span className="text-[11px] text-orange-400 font-bold uppercase tracking-wider">C</span>
            </div>

            {/* Botãozinho de + para abrir pop-up de movimentação de moedas */}
            {!readonly && (
              <button
                type="button"
                onClick={() => {
                  setMoveOpType('income');
                  setIsCurrencyModalOpen(true);
                }}
                className="w-8 h-8 sm:w-8 sm:h-8 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 active:scale-95 text-amber-300 hover:text-amber-100 border border-amber-500/50 hover:border-amber-400 flex items-center justify-center transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer shrink-0"
                title="Movimentar Moedas (Incrementar / Decrementar)"
              >
                <Plus size={16} className="stroke-[3]" />
              </button>
            )}

            {/* Botãozinho com ícone de lista para abrir o modal de histórico de transações */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="w-8 h-8 sm:w-8 sm:h-8 rounded-xl bg-black/60 hover:bg-black/90 active:scale-95 text-amber-300/80 hover:text-amber-300 border border-white/15 hover:border-amber-500/50 flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0"
              title="Histórico de Transações da Bolsa"
            >
              <List size={15} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Filtros, Ordenação e Barra de Busca da Mochila */}
        <div className="flex flex-col gap-3">
          {/* LINHA 1: Tags de Categorias Separadas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-white/5">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none flex items-center gap-1.5 shrink-0 ${
                activeCategoryFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Package size={13} />
              <span>Todos</span>
              <span className="text-[10px] font-mono opacity-60">({allItems.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('weapons')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none flex items-center gap-1.5 shrink-0 ${
                activeCategoryFilter === 'weapons'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Sword size={13} />
              <span>Armas</span>
              <span className="text-[10px] font-mono opacity-60">({weapons.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('armors')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none flex items-center gap-1.5 shrink-0 ${
                activeCategoryFilter === 'armors'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Shield size={13} />
              <span>Armaduras</span>
              <span className="text-[10px] font-mono opacity-60">({armors.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('projectiles')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none flex items-center gap-1.5 shrink-0 ${
                activeCategoryFilter === 'projectiles'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Target size={13} />
              <span>Projéteis</span>
              <span className="text-[10px] font-mono opacity-60">({projectiles.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('accessories')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none flex items-center gap-1.5 shrink-0 ${
                activeCategoryFilter === 'accessories'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Sparkles size={13} />
              <span>Acessórios</span>
              <span className="text-[10px] font-mono opacity-60">({accessories.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryFilter('supplies')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none flex items-center gap-1.5 shrink-0 ${
                activeCategoryFilter === 'supplies'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <FlaskConical size={13} />
              <span>Suprimentos</span>
              <span className="text-[10px] font-mono opacity-60">({generalItems.length})</span>
            </button>
          </div>

          {/* LINHA 2: Barra de Ferramentas (Busca, Ordenação e Grade/Lista) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Buscar item pelo nome, descrição ou notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-200 placeholder-white/30 focus:outline-none focus:border-amber-500/50"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Controles da Direita: Ordenação e Alternador Grade/Lista */}
            <div className="flex items-center gap-2 justify-end">
              {/* Seletor de Ordenação */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                <ArrowUpDown size={12} className="text-white/40" />
                <span className="text-[10px] text-white/40 uppercase font-semibold">Ordem:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-transparent border-none text-white/80 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="default">Padrão</option>
                  <option value="rarity">Raridade</option>
                  <option value="weight">Peso</option>
                  <option value="name">Nome (A-Z)</option>
                </select>
              </div>

              {/* Alternador de Modo de Visualização (Grade / Lista) */}
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setBagViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    bagViewMode === 'grid' ? 'bg-amber-500/20 text-amber-300' : 'text-white/40 hover:text-white'
                  }`}
                  title="Modo Grade (WoW Caixinhas)"
                >
                  <Grid size={15} />
                </button>
                <button
                  onClick={() => setBagViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    bagViewMode === 'list' ? 'bg-amber-500/20 text-amber-300' : 'text-white/40 hover:text-white'
                  }`}
                  title="Modo Lista Compacta"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* GRADE DE CAIXINHAS DE ITENS (GRID DE SLOTS WOW OU MODO LISTA) */}
        {bagViewMode === 'grid' ? (
          <div className="bg-[#05030c] border border-white/5 rounded-2xl p-4 sm:p-5">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3">
              {bagSlotsArray.map((_, index) => {
                const item = bagItems[index];

                if (!item) {
                  return (
                    <div
                      key={`empty_slot_${index}`}
                      className="aspect-square rounded-2xl bg-[#090714]/60 border border-white/5 flex items-center justify-center shadow-inner"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                    </div>
                  );
                }

                const rarity = getItemRarity(item);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <button
                    key={`${item.category}_${item.id}`}
                    onClick={() => {
                      setHoveredTooltip(null);
                      setSelectedItem(item);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      toggleEquipAuto(item);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleEquipAuto(item);
                    }}
                    onMouseMove={(e) => handleItemMouseMove(item, e)}
                    onMouseLeave={handleMouseLeave}
                    className={`aspect-square rounded-2xl border-2 transition-all duration-150 flex flex-col items-center justify-center relative p-1 select-none cursor-pointer group ${
                      rarity.glow
                    } ${
                      isSelected ? 'ring-2 ring-amber-400 scale-105' : 'hover:scale-105'
                    } bg-[#0c0819]`}
                    style={{
                      borderColor: rarity.color
                    }}
                    title={`${item.name} • Clique duplo para ${item.equipped ? 'desequipar' : 'equipar'}`}
                  >
                    {/* Ícone Expressivo */}
                    <ItemIcon item={item} size={22} />

                    {/* Tag Indicando se Está Equipado */}
                    {item.equipped && (
                      <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]" />
                    )}

                    {/* Contador de Quantidade (x7, x5) */}
                    {'quantity' in item && typeof item.quantity === 'number' && item.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 text-[10px] font-mono font-bold text-sky-300 bg-black/80 px-1 rounded border border-sky-400/40 leading-none">
                        {item.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* MODO LISTA COMPACTA */
          <div className="flex flex-col gap-2">
            {bagItems.length === 0 ? (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-8 text-center text-white/40 text-xs">
                Nenhum item encontrado nesta categoria.
              </div>
            ) : (
              bagItems.map(item => {
                const rarity = getItemRarity(item);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={`list_${item.category}_${item.id}`}
                    onClick={() => {
                      setHoveredTooltip(null);
                      setSelectedItem(item);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      toggleEquipAuto(item);
                    }}
                    onMouseMove={(e) => handleItemMouseMove(item, e)}
                    onMouseLeave={handleMouseLeave}
                    title={`${item.name} • Clique duplo para ${item.equipped ? 'desequipar' : 'equipar'}`}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-amber-500/15 border-amber-400 shadow-md' 
                        : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/60 border ${rarity.border} shrink-0`}>
                        <ItemIcon item={item} size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold truncate ${rarity.text}`}>{item.name}</span>
                          {item.equipped && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                              Equipado
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 font-mono">
                          {formatWeight(item.weight || 0)}
                          {'quantity' in item && typeof item.quantity === 'number' && item.quantity > 1 && ` • Qtd: ${item.quantity}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEquipAuto(item);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        item.equipped
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {item.equipped ? 'Desequipar' : 'Equipar'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL DE INSPEÇÃO / DETALHES DO ITEM SELECIONADO                       */}
      {/* ========================================================================= */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-[#0b0817] border-2 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto"
            style={{
              borderColor: getItemRarity(selectedItem).color,
              boxShadow: (getItemRarity(selectedItem).label === 'Comum' || getItemRarity(selectedItem).label === 'Incomum' || getItemRarity(selectedItem).label === 'Pobre')
                ? '0 20px 50px rgba(0,0,0,0.95)'
                : `0 20px 50px rgba(0,0,0,0.95), 0 0 30px ${getItemRarity(selectedItem).color}50`
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Info size={16} />
                <span>Detalhes do Item</span>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {renderItemDetailsCard(selectedItem, false)}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HOVER-BASED TOOLTIP FLUTUANTE (BORDA SEGUE A COR DA RARIDADE DO ITEM) */}
      {/* ========================================================================= */}
      {hoveredTooltip && !selectedItem && !slotPickerTarget && !editingItem && !isAddModalOpen && !isCurrencyModalOpen && !isHistoryModalOpen && (
        <div 
          className="fixed z-50 pointer-events-none p-4 rounded-2xl bg-[#080512]/98 backdrop-blur-md w-80 animate-in fade-in duration-100 transition-all select-none"
          style={{
            left: hoveredTooltip.x,
            top: hoveredTooltip.y,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: hoveredTooltip.type === 'item' 
              ? getItemRarity(hoveredTooltip.item).color 
              : 'rgba(245, 158, 11, 0.8)',
            boxShadow: hoveredTooltip.type === 'item'
              ? ((getItemRarity(hoveredTooltip.item).label === 'Comum' || getItemRarity(hoveredTooltip.item).label === 'Incomum' || getItemRarity(hoveredTooltip.item).label === 'Pobre')
                  ? '0 20px 48px rgba(0,0,0,0.95)'
                  : `0 20px 48px rgba(0,0,0,0.95), 0 0 24px ${getItemRarity(hoveredTooltip.item).color}70, inset 0 0 16px ${getItemRarity(hoveredTooltip.item).color}15`)
              : '0 20px 48px rgba(0,0,0,0.85), 0 0 16px rgba(245,158,11,0.3)'
          }}
        >
          {hoveredTooltip.type === 'item' ? (
            renderItemDetailsCard(hoveredTooltip.item, true)
          ) : (
            <div className="flex flex-col gap-2 text-xs text-left">
              <div 
                className="w-full h-1 rounded-full mb-1" 
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.8)', boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }} 
              />
              <div className="border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Espaço de Equipamento
                </span>
                <h4 className="text-base font-bold text-slate-100 mt-1">
                  {hoveredTooltip.slot.label}
                </h4>
              </div>
              <p className="text-[11px] text-white/70">
                {hoveredTooltip.slot.description}
              </p>
              <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-[11px] text-amber-300/80">
                Status: <strong className="text-white/40">Vazio</strong>
              </div>
              <div className="text-[10px] text-white/40 italic">
                * Clique neste espaço para equipar um item da sua mochila.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: ESCOLHER ITEM PARA EQUIPAR NO SLOT                               */}
      {/* ========================================================================= */}
      {slotPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0818] border border-amber-500/40 rounded-3xl max-w-md w-full p-5 max-h-[85vh] flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ease-out">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ArrowRightLeft size={16} />
                <span>
                  Equipar no Espaço: {EQUIPMENT_SLOTS.find(s => s.id === slotPickerTarget)?.label}
                </span>
              </div>
              <button onClick={() => setSlotPickerTarget(null)} className="text-white/40 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-white/60">
                Selecione um item da mochila para equipar:
              </p>
              {!readonly && (
                <button
                  type="button"
                  onClick={() => {
                    const matchingCat = EQUIPMENT_CATEGORIES.find(c => c.allowedSlots.includes(slotPickerTarget));
                    if (matchingCat) {
                      handleSelectEquipCategory(matchingCat.key);
                    }
                    setNewItemSlot(slotPickerTarget);
                    setNewItemEquipped(true);
                    setSlotPickerTarget(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl px-2.5 py-1 transition-all cursor-pointer shadow-sm shrink-0"
                  title="Criar e equipar um novo item sob medida para este espaço"
                >
                  <Plus size={13} className="stroke-[2.5]" />
                  <span>Criar Novo</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-80 pr-1">
              {allItems.map(it => {
                const isEquippedHere = it.equipped && (inferItemSlot(it) === slotPickerTarget);
                const rarity = getItemRarity(it);

                return (
                  <div
                    key={`picker_${it.category}_${it.id}`}
                    onClick={() => equipItemToSlot(it, slotPickerTarget)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isEquippedHere
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-white/5 border-white/10 hover:border-amber-500/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-black/50 border ${rarity.border}`}>
                        <ItemIcon item={it} size={18} />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${rarity.text}`}>{it.name}</div>
                        <div className="text-[10px] text-white/50">{formatWeight(it.weight || 0)}</div>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {isEquippedHere ? 'Equipado' : 'Equipar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: ADICIONAR NOVO EQUIPAMENTO / ITEM                                */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0816] border border-amber-500/30 rounded-3xl max-w-xl w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col gap-4 text-xs animate-in fade-in zoom-in-95 duration-200 ease-out">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <Plus size={18} className="stroke-[2.5]" />
                <span className="uppercase tracking-wider">Novo Equipamento / Item</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/40 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="flex flex-col gap-4">
              {/* SELEÇÃO DE CATEGORIA DE EQUIPAMENTO (SISTEMA DE PARSING PRÉ-CONFIGURADO) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    Categoria do Equipamento
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">
                    Limita slots e atributos automaticamente
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {EQUIPMENT_CATEGORIES.map(cat => {
                    const isSelected = selectedEquipCategoryKey === cat.key;
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleSelectEquipCategory(cat.key)}
                        className={`p-2 rounded-xl border flex flex-col items-start gap-1 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                            : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <CatIcon size={14} className={isSelected ? 'text-amber-400' : 'text-white/40'} />
                          <span className="text-[11px] font-bold truncate leading-tight">{cat.label}</span>
                        </div>
                        <span className="text-[9px] text-white/40 leading-none truncate w-full">{cat.groupLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODELOS PRÉ-CONFIGURADOS (PRESETS RÁPIDOS) */}
              {(() => {
                const currentCat = EQUIPMENT_CATEGORIES.find(c => c.key === selectedEquipCategoryKey);
                if (!currentCat || currentCat.presetTemplates.length === 0) return null;
                return (
                  <div className="flex flex-col gap-1.5 bg-black/40 border border-white/5 rounded-2xl p-2.5">
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                      Modelos Pré-Configurados (Clique para preencher):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCat.presetTemplates.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyPresetTemplate(p)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-all cursor-pointer"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* NOME E PESO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/60">Nome do Equipamento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Espada Longa de Aço, Couraça Nobre..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/60">Peso (gramas)</label>
                  <input
                    type="number"
                    value={newItemWeight}
                    onChange={(e) => setNewItemWeight(Number(e.target.value))}
                    className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none"
                  />
                  <div className="flex gap-1 mt-1">
                    {[500, 1500, 3000, 6000].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setNewItemWeight(w)}
                        className="text-[9px] font-mono text-white/40 hover:text-amber-300 bg-white/5 px-1 py-0.5 rounded cursor-pointer"
                      >
                        {w >= 1000 ? `${w/1000}kg` : `${w}g`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ESPAÇO NO CORPO (LIMITADO PELA CATEGORIA SELECIONADA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/60">Espaço no Corpo (Restrito)</label>
                  <select
                    value={newItemSlot}
                    onChange={(e) => setNewItemSlot(e.target.value as EquipmentSlot)}
                    className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {(() => {
                      const currentCat = EQUIPMENT_CATEGORIES.find(c => c.key === selectedEquipCategoryKey);
                      const allowed = currentCat ? currentCat.allowedSlots : EQUIPMENT_SLOTS.map(s => s.id);
                      return EQUIPMENT_SLOTS.filter(s => allowed.includes(s.id)).map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ));
                    })()}
                  </select>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 self-end">
                  <input
                    type="checkbox"
                    id="equipCheck"
                    checked={newItemEquipped}
                    onChange={(e) => setNewItemEquipped(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="equipCheck" className="text-xs text-slate-200 cursor-pointer select-none">
                    Equipar no corpo imediatamente
                  </label>
                </div>
              </div>

              {/* ATRIBUTOS ESPECÍFICOS DE ACORDO COM A CATEGORIA */}
              {(() => {
                const currentCat = EQUIPMENT_CATEGORIES.find(c => c.key === selectedEquipCategoryKey);
                const kind = currentCat ? currentCat.kind : newCategory;

                if (kind === 'weapon') {
                  return (
                    <div className="flex flex-col gap-2.5 bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        Atributos de Combate da Arma
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] font-bold text-white/70">Estocada / Perfuração</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-white/40">Dano</span>
                              <input
                                type="text"
                                value={weaponThrustDmg}
                                onChange={(e) => setWeaponThrustDmg(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-amber-300 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-white/40">Tipo</span>
                              <select
                                value={weaponThrustType}
                                onChange={(e) => setWeaponThrustType(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-xs text-white/80 cursor-pointer"
                              >
                                <option value="per">Perfurante</option>
                                <option value="cor">Cortante</option>
                                <option value="esm">Esmagamento</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-[9px] text-white/40">Penetração (AP)</span>
                              <input
                                type="number"
                                value={weaponThrustAP}
                                onChange={(e) => setWeaponThrustAP(Number(e.target.value))}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-cyan-300 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-white/40">Precisão</span>
                              <input
                                type="number"
                                value={weaponThrustPre}
                                onChange={(e) => setWeaponThrustPre(Number(e.target.value))}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-emerald-300 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] font-bold text-white/70">Balanço / Corte</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-white/40">Dano</span>
                              <input
                                type="text"
                                value={weaponSwingDmg}
                                onChange={(e) => setWeaponSwingDmg(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-amber-300 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-white/40">Tipo</span>
                              <select
                                value={weaponSwingType}
                                onChange={(e) => setWeaponSwingType(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-xs text-white/80 cursor-pointer"
                              >
                                <option value="cor">Cortante</option>
                                <option value="esm">Esmagamento</option>
                                <option value="per">Perfurante</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-[9px] text-white/40">Penetração (AP)</span>
                              <input
                                type="number"
                                value={weaponSwingAP}
                                onChange={(e) => setWeaponSwingAP(Number(e.target.value))}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-cyan-300 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-white/40">Precisão</span>
                              <input
                                type="number"
                                value={weaponSwingPre}
                                onChange={(e) => setWeaponSwingPre(Number(e.target.value))}
                                className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-emerald-300 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (kind === 'armor') {
                  return (
                    <div className="flex flex-col gap-2.5 bg-cyan-500/[0.04] border border-cyan-500/20 rounded-2xl p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        Defesas e Proteções (Armadura / Escudo)
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-white/40 uppercase">Corte</span>
                          <input
                            type="number"
                            value={armorSlashing}
                            onChange={(e) => setArmorSlashing(Number(e.target.value))}
                            className="bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-cyan-300 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-white/40 uppercase">Esmag.</span>
                          <input
                            type="number"
                            value={armorBludgeoning}
                            onChange={(e) => setArmorBludgeoning(Number(e.target.value))}
                            className="bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-cyan-300 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-white/40 uppercase">Perf.</span>
                          <input
                            type="number"
                            value={armorPiercing}
                            onChange={(e) => setArmorPiercing(Number(e.target.value))}
                            className="bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-cyan-300 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-white/40 uppercase">Cob.</span>
                          <input
                            type="number"
                            value={armorCoverage}
                            onChange={(e) => setArmorCoverage(Number(e.target.value))}
                            className="bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-amber-300 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-white/40 uppercase">Res.</span>
                          <input
                            type="number"
                            value={armorResistance}
                            onChange={(e) => setArmorResistance(Number(e.target.value))}
                            className="bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-emerald-300 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-white/40 uppercase">Durab.</span>
                          <input
                            type="number"
                            value={armorDurability}
                            onChange={(e) => setArmorDurability(Number(e.target.value))}
                            className="bg-black/60 border border-white/10 rounded-lg p-1.5 text-center font-mono text-slate-300 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-1.5 bg-violet-500/[0.04] border border-violet-500/20 rounded-2xl p-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
                      Efeito Místico / Propriedade Arcana
                    </span>
                    <input
                      type="text"
                      value={newItemExtras}
                      onChange={(e) => setNewItemExtras(e.target.value)}
                      placeholder="Ex: +1 em Resistência contra feitiços elementais, +2 em Mana de Foco..."
                      className="bg-black/60 border border-white/10 rounded-xl p-2 text-slate-200 focus:outline-none"
                    />
                  </div>
                );
              })()}

              {/* DESCRIÇÃO / NOTAS EXTRAS */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-white/60">Descrição / Histórico</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Propriedades especiais, marcas de forja, runas..."
                  className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: MOVIMENTAÇÃO DE MOEDAS (BOLSA DE RIQUEZAS)                      */}
      {/* ========================================================================= */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0816] border border-amber-500/35 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-xs animate-in fade-in zoom-in-95 duration-200 ease-out">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <Coins size={18} />
                <span className="uppercase tracking-wider">Movimentar Moedas</span>
              </div>
              <button 
                onClick={() => {
                  setMoveGold('');
                  setMoveSilver('');
                  setMoveCopper('');
                  setMoveReason('');
                  setIsCurrencyModalOpen(false);
                }} 
                className="text-white/40 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menção Única de Saldo Total Consolidado */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs shadow-inner">
              <span className="text-white/60 font-medium">Saldo Atual na Bolsa:</span>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-amber-300">{normalizedCurrency.gold} O</span>
                <span className="text-white/30">·</span>
                <span className="text-slate-200">{normalizedCurrency.silver} P</span>
                <span className="text-white/30">·</span>
                <span className="text-orange-400">{normalizedCurrency.copper} C</span>
              </div>
            </div>

            {/* Linha Principal de Slots: [ + / - ] [ QTD OURO ] [ QTD PRATA ] [ QTD COBRE ] */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 items-stretch">
              {/* Slot 1: Toggle [ + / - ] */}
              <button
                type="button"
                onClick={() => setMoveOpType(prev => prev === 'income' ? 'expense' : 'income')}
                className={`rounded-2xl border-2 flex flex-col items-center justify-center p-2.5 sm:p-3 transition-all cursor-pointer shadow-md active:scale-95 select-none ${
                  moveOpType === 'income'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.25)]'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                }`}
                title="Clique para alternar entre Adicionar (+) e Subtrair (-)"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-current">
                  {moveOpType === 'income' ? (
                    <Plus size={20} className="stroke-[3]" />
                  ) : (
                    <Minus size={20} className="stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider mt-1.5 leading-none">
                  {moveOpType === 'income' ? 'Adicionar' : 'Subtrair'}
                </span>
              </button>

              {/* Slot 2: [ QTD OURO ] */}
              <div className="bg-black/50 border border-amber-500/40 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 shadow-inner focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] shrink-0" />
                  <span>Ouro (O)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={moveGold}
                  onChange={(e) => setMoveGold(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-transparent text-center font-mono font-bold text-lg sm:text-xl text-amber-300 focus:outline-none placeholder:text-white/20"
                />
              </div>

              {/* Slot 3: [ QTD PRATA ] */}
              <div className="bg-black/50 border border-slate-300/40 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 shadow-inner focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.8)] shrink-0" />
                  <span>Prata (P)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={moveSilver}
                  onChange={(e) => setMoveSilver(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-transparent text-center font-mono font-bold text-lg sm:text-xl text-slate-200 focus:outline-none placeholder:text-white/20"
                />
              </div>

              {/* Slot 4: [ QTD COBRE ] */}
              <div className="bg-black/50 border border-orange-500/40 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 shadow-inner focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400">
                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.8)] shrink-0" />
                  <span>Cobre (C)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={moveCopper}
                  onChange={(e) => setMoveCopper(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-transparent text-center font-mono font-bold text-lg sm:text-xl text-orange-400 focus:outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Motivo Opcional */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Motivo / Descrição (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Pagamento de recompensa, Compra na taverna..."
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Ações: Cancelar / Confirmar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMoveGold('');
                  setMoveSilver('');
                  setMoveCopper('');
                  setMoveReason('');
                  setIsCurrencyModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCurrencyMovement}
                className={`px-5 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-md ${
                  moveOpType === 'income'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                }`}
              >
                Confirmar {moveOpType === 'income' ? 'Incremento' : 'Decremento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: HISTÓRICO DE TRANSAÇÕES DA BOLSA                                */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0816] border border-amber-500/35 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-xs animate-in fade-in zoom-in-95 duration-200 ease-out">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <History size={18} />
                <span className="uppercase tracking-wider">Histórico de Transações</span>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-white/40 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {(!currency.history || currency.history.length === 0) ? (
                <div className="text-center py-8 text-white/40 italic">
                  Nenhuma transação registrada na bolsa.
                </div>
              ) : (
                currency.history.map(tx => {
                  const isInc = tx.type === 'income';
                  const coinName = tx.coin === 'gold' ? 'Ouro (O)' : tx.coin === 'silver' ? 'Prata (P)' : 'Cobre (C)';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs border ${
                          isInc
                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                            : 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                        }`}>
                          {isInc ? '+' : '-'}{tx.amount}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white/90">{tx.reason || (isInc ? 'Incremento' : 'Decremento')}</span>
                          <span className="text-[10px] text-white/40 font-mono">{coinName}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/30 font-mono">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: EDITAR ITEM EXISTENTE                                           */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0816] border border-amber-500/40 rounded-3xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 ease-out">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Edit3 size={16} />
                <span>Editar Propriedades do Item</span>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-white/40 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-white/60">Nome do Item</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/60">Espaço no Corpo</label>
                  <select
                    value={editingItem.slot || inferItemSlot(editingItem)}
                    onChange={(e) => setEditingItem({ ...editingItem, slot: e.target.value as EquipmentSlot })}
                    className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                  >
                    {EQUIPMENT_SLOTS.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/60">Peso (em gramas)</label>
                  <input
                    type="number"
                    value={editingItem.weight || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, weight: Number(e.target.value) })}
                    className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {'quantity' in editingItem && typeof editingItem.quantity === 'number' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/60">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Math.max(1, Number(e.target.value)) } as any)}
                    className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              )}

              {/* Detalhes específicos de Arma */}
              {editingItem.category === 'weapon' && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="font-bold text-amber-400 text-xs">Ataques da Arma:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/60 font-semibold">Estocada: Dano</span>
                      <input
                        type="text"
                        value={editingItem.thrust.damage}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          thrust: { ...editingItem.thrust, damage: e.target.value }
                        })}
                        className="bg-black/60 border border-white/10 rounded p-1 text-white font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/60 font-semibold">Golpe: Dano</span>
                      <input
                        type="text"
                        value={editingItem.swing.damage}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          swing: { ...editingItem.swing, damage: e.target.value }
                        })}
                        className="bg-black/60 border border-white/10 rounded p-1 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhes de Armadura */}
              {editingItem.category === 'armor' && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="font-bold text-cyan-400 text-xs">Proteção da Armadura:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-white/60">Corte</span>
                      <input
                        type="number"
                        value={editingItem.slashing}
                        onChange={(e) => setEditingItem({ ...editingItem, slashing: Number(e.target.value) })}
                        className="w-full bg-black/60 border border-white/10 rounded p-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60">Esmag.</span>
                      <input
                        type="number"
                        value={editingItem.bludgeoning}
                        onChange={(e) => setEditingItem({ ...editingItem, bludgeoning: Number(e.target.value) })}
                        className="w-full bg-black/60 border border-white/10 rounded p-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60">Perf.</span>
                      <input
                        type="number"
                        value={editingItem.piercing}
                        onChange={(e) => setEditingItem({ ...editingItem, piercing: Number(e.target.value) })}
                        className="w-full bg-black/60 border border-white/10 rounded p-1 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-white/60">Descrição / Notas</label>
                <textarea
                  rows={2}
                  value={'description' in editingItem && editingItem.description ? editingItem.description : ('extras' in editingItem && editingItem.extras ? editingItem.extras : '')}
                  onChange={(e) => {
                    if (editingItem.category === 'general') {
                      setEditingItem({ ...editingItem, description: e.target.value });
                    } else {
                      setEditingItem({ ...editingItem, extras: e.target.value } as any);
                    }
                  }}
                  className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
