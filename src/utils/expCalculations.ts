// Matrizes de Custo (Look-up Tables) e Regras de Focos de EXP
// Sistema Aurora RPG

import { FocusLevel, FocusDistributionType, FocusConfig, CharacterData } from '../types';

export function normalizeFocusLevel(val: any): FocusLevel {
  if (val === 'FE' || val === 'Fe') return 'FE';
  if (val === 'F1') return 'F1';
  if (val === 'F2') return 'F2';
  return 'SF';
}

/**
 * Atributos Valores (LVL 1 a 15)
 * LVL, FE, F1, F2, SF
 */
export const ATRIBUTOS_COST_TABLE: Record<FocusLevel, number[]> = {
  // index 0 = LVL 1 ... index 14 = LVL 15
  FE: [9, 11, 13, 16, 19, 24, 29, 35, 43, 53, 64, 79, 96, 117, 143],
  F1: [11, 13, 16, 20, 25, 31, 39, 48, 59, 74, 91, 113, 140, 174, 216],
  F2: [13, 16, 20, 25, 31, 39, 48, 60, 76, 95, 119, 149, 186, 233, 292],
  SF: [15, 19, 24, 30, 37, 47, 57, 72, 93, 116, 147, 185, 232, 292, 368],
};

/**
 * Perícias Valores (LVL 1 a 7)
 * LVL, FE, F1, F2, SF
 */
export const PERICIAS_COST_TABLE: Record<FocusLevel, number[]> = {
  // index 0 = LVL 1 ... index 6 = LVL 7
  FE: [11, 15, 21, 30, 43, 61, 86],
  F1: [13, 19, 27, 39, 56, 80, 113],
  F2: [15, 21, 31, 46, 67, 98, 139],
  SF: [17, 23, 35, 53, 78, 116, 165],
};

export const FOCUS_LABELS: Record<FocusLevel, { label: string; name: string; desc: string; color: string; badgeBg: string }> = {
  FE: { 
    label: 'FE', 
    name: 'Foco Exclusivo', 
    desc: 'Menor custo de evolução do jogo. Acelera drasticamente a maestria no eixo.', 
    color: 'text-amber-300', 
    badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
  },
  F1: { 
    label: 'F1', 
    name: 'Foco Primário', 
    desc: 'Custo baixo de evolução. Área de grande vocação e aptidão natural.', 
    color: 'text-emerald-300', 
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' 
  },
  F2: { 
    label: 'F2', 
    name: 'Foco Secundário', 
    desc: 'Custo médio padrão. Desenvolvimento sólido, consistente e equilibrado.', 
    color: 'text-cyan-300', 
    badgeBg: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' 
  },
  SF: { 
    label: 'SF', 
    name: 'Sem Foco', 
    desc: 'Maior custo de evolução. Área fora do foco principal do personagem.', 
    color: 'text-slate-300', 
    badgeBg: 'bg-slate-500/20 border-slate-400/40 text-slate-300' 
  },
};

export const FOCUS_PRESETS: {
  id: FocusDistributionType;
  title: string;
  subtitle: string;
  pattern: string;
  description: string;
  validConfigurations: { physical: FocusLevel; mental: FocusLevel; social: FocusLevel }[];
}[] = [
  {
    id: 'padrao',
    title: 'O Natural',
    subtitle: 'Aptidão Padrão',
    pattern: '[ F1 + F2 + SF ]',
    description: 'Um Foco Primário, um Secundário e um Sem Foco. Distribuição equilibrada e orgânica.',
    validConfigurations: [
      { physical: 'F1', mental: 'F2', social: 'SF' },
      { physical: 'F1', mental: 'SF', social: 'F2' },
      { physical: 'F2', mental: 'F1', social: 'SF' },
      { physical: 'F2', mental: 'SF', social: 'F1' },
      { physical: 'SF', mental: 'F1', social: 'F2' },
      { physical: 'SF', mental: 'F2', social: 'F1' },
    ],
  },
  {
    id: 'especializada',
    title: 'O Especialista',
    subtitle: 'Gênio Focado',
    pattern: '[ FE + SF + SF ]',
    description: 'Um Foco Exclusivo (FE) de altíssimo talento em uma área, e duas áreas Sem Foco (SF).',
    validConfigurations: [
      { physical: 'FE', mental: 'SF', social: 'SF' },
      { physical: 'SF', mental: 'FE', social: 'SF' },
      { physical: 'SF', mental: 'SF', social: 'FE' },
    ],
  },
  {
    id: 'generalista',
    title: 'O Generalista',
    subtitle: '"Sem Foco" Específico',
    pattern: '[ F2 + F2 + F2 ]',
    description: 'Três Focos Secundários (F2). Versatilidade constante em todas as três esferas da vida.',
    validConfigurations: [
      { physical: 'F2', mental: 'F2', social: 'F2' },
    ],
  },
];

/**
 * Retorna o custo de um Atributo (LVL 1 a 15) dado o seu Foco.
 */
export function getAttributeCost(lvl: number, focus: FocusLevel | string): number {
  if (lvl <= 0) return 0;
  const clampedLvl = Math.min(15, Math.max(1, lvl));
  const normFocus = normalizeFocusLevel(focus);
  const table = ATRIBUTOS_COST_TABLE[normFocus] || ATRIBUTOS_COST_TABLE.F2;
  return table[clampedLvl - 1] || 0;
}

/**
 * Retorna o custo de uma Perícia (LVL 1 a 7) dado o seu Foco.
 */
export function getSkillCost(lvl: number, focus: FocusLevel | string): number {
  if (lvl <= 0) return 0;
  const clampedLvl = Math.min(7, Math.max(1, lvl));
  const normFocus = normalizeFocusLevel(focus);
  const table = PERICIAS_COST_TABLE[normFocus] || PERICIAS_COST_TABLE.F2;
  return table[clampedLvl - 1] || 0;
}

export interface TreeItemLeaf {
  id: string;
  name: string;
  level: number;
  cost: number;
  focus: FocusLevel;
  type: 'attribute' | 'skill' | 'fixed';
  ruleNote?: string;
}

export interface TreeSubgroupNode {
  id: string;
  title: string;
  totalExp: number;
  items: TreeItemLeaf[];
}

export interface TreeSectionNode {
  id: string;
  title: string;
  theme: 'rose' | 'cyan' | 'emerald' | 'amber';
  focus: FocusLevel;
  totalExp: number;
  subgroups: TreeSubgroupNode[];
}

export interface DetailedTreeExpBreakdown {
  totalSpent: number;
  sections: TreeSectionNode[];
  summary: {
    physicalExp: number;
    mentalExp: number;
    socialExp: number;
    specialExp: number;
  };
}

const ATTRIBUTE_TRANSLATIONS: Record<string, string> = {
  strength: 'Força',
  dexterity: 'Destreza',
  agility: 'Agilidade',
  constitution: 'Constituição',
  intelligence: 'Inteligência',
  wits: 'Raciocínio',
  perception: 'Percepção',
  memory: 'Memória',
  charisma: 'Carisma',
  manipulation: 'Manipulação',
  empathy: 'Empatia',
  expression: 'Expressão',
  resilience: 'Resiliência',
};

const SKILL_TRANSLATIONS: Record<string, string> = {
  // Treinamentos (Físico)
  athletics: 'Atletismo',
  brawl: 'Luta',
  stealth: 'Furtividade',
  survival: 'Sobrevivência',
  driving: 'Condução',
  melee: 'Armas Brancas',
  archery: 'Pontaria',
  // Ciências (Mental)
  alchemy: 'Alquimia',
  medicine: 'Medicina',
  occult: 'Ocultismo',
  tactics: 'Tática',
  investigation: 'Investigação',
  technology: 'Tecnologia',
  // Artes (Social)
  diplomacy: 'Diplomacia',
  subterfuge: 'Enganação',
  intimidation: 'Intimidação',
  performance: 'Performance',
  persuasion: 'Persuasão',
};

const PERSONALITY_TRANSLATIONS: Record<string, string> = {
  courage: 'Coragem',
  conviction: 'Convicção',
  serenity: 'Serenidade',
};

const DOMAIN_TRANSLATIONS: Record<string, string> = {
  water: 'Domínio da Água',
  air: 'Domínio do Ar',
  anima: 'Domínio de Anima',
  fire: 'Domínio do Fogo',
  earth: 'Domínio da Terra',
};

/**
 * Monta a estrutura detalhada e hierárquica em Tree-View para o modal de EXP.
 */
export function getDetailedSheetExpBreakdown(data: CharacterData): DetailedTreeExpBreakdown {
  const focusConfig: FocusConfig = {
    distribution: data.focusConfig?.distribution || 'padrao',
    physical: normalizeFocusLevel(data.focusConfig?.physical || 'F1'),
    mental: normalizeFocusLevel(data.focusConfig?.mental || 'F2'),
    social: normalizeFocusLevel(data.focusConfig?.social || 'SF'),
  };

  // 1. Eixo Físico
  const physAttrItems: TreeItemLeaf[] = Object.entries(data.attributes?.physical || {}).map(([key, val]) => ({
    id: `phys_attr_${key}`,
    name: ATTRIBUTE_TRANSLATIONS[key] || key,
    level: val,
    cost: getAttributeCost(val, focusConfig.physical),
    focus: focusConfig.physical,
    type: 'attribute',
  }));

  const physSkillItems: TreeItemLeaf[] = Object.entries(data.skills?.physical || {}).map(([key, val]) => ({
    id: `phys_skill_${key}`,
    name: SKILL_TRANSLATIONS[key] || key,
    level: val,
    cost: getSkillCost(val, focusConfig.physical),
    focus: focusConfig.physical,
    type: 'skill',
  }));

  if (data.customSkills?.treinamentos) {
    data.customSkills.treinamentos.forEach((s) => {
      physSkillItems.push({
        id: `phys_custom_${s.id}`,
        name: s.name,
        level: s.value,
        cost: getSkillCost(s.value, focusConfig.physical),
        focus: focusConfig.physical,
        type: 'skill',
        ruleNote: 'Perícia Customizada',
      });
    });
  }

  const physAttrTotal = physAttrItems.reduce((acc, it) => acc + it.cost, 0);
  const physSkillTotal = physSkillItems.reduce((acc, it) => acc + it.cost, 0);
  const physSectionTotal = physAttrTotal + physSkillTotal;

  // 2. Eixo Mental
  const mentAttrItems: TreeItemLeaf[] = Object.entries(data.attributes?.mental || {}).map(([key, val]) => ({
    id: `ment_attr_${key}`,
    name: ATTRIBUTE_TRANSLATIONS[key] || key,
    level: val,
    cost: getAttributeCost(val, focusConfig.mental),
    focus: focusConfig.mental,
    type: 'attribute',
  }));

  const mentSkillItems: TreeItemLeaf[] = Object.entries(data.skills?.mental || {}).map(([key, val]) => ({
    id: `ment_skill_${key}`,
    name: SKILL_TRANSLATIONS[key] || key,
    level: val,
    cost: getSkillCost(val, focusConfig.mental),
    focus: focusConfig.mental,
    type: 'skill',
  }));

  if (data.customSkills?.ciencias) {
    data.customSkills.ciencias.forEach((s) => {
      mentSkillItems.push({
        id: `ment_custom_${s.id}`,
        name: s.name,
        level: s.value,
        cost: getSkillCost(s.value, focusConfig.mental),
        focus: focusConfig.mental,
        type: 'skill',
        ruleNote: 'Perícia Customizada',
      });
    });
  }

  const mentAttrTotal = mentAttrItems.reduce((acc, it) => acc + it.cost, 0);
  const mentSkillTotal = mentSkillItems.reduce((acc, it) => acc + it.cost, 0);
  const mentSectionTotal = mentAttrTotal + mentSkillTotal;

  // 3. Eixo Social
  const socAttrItems: TreeItemLeaf[] = Object.entries(data.attributes?.social || {}).map(([key, val]) => ({
    id: `soc_attr_${key}`,
    name: ATTRIBUTE_TRANSLATIONS[key] || key,
    level: val,
    cost: getAttributeCost(val, focusConfig.social),
    focus: focusConfig.social,
    type: 'attribute',
  }));

  const socSkillItems: TreeItemLeaf[] = Object.entries(data.skills?.social || {}).map(([key, val]) => ({
    id: `soc_skill_${key}`,
    name: SKILL_TRANSLATIONS[key] || key,
    level: val,
    cost: getSkillCost(val, focusConfig.social),
    focus: focusConfig.social,
    type: 'skill',
  }));

  if (data.customSkills?.artes) {
    data.customSkills.artes.forEach((s) => {
      socSkillItems.push({
        id: `soc_custom_${s.id}`,
        name: s.name,
        level: s.value,
        cost: getSkillCost(s.value, focusConfig.social),
        focus: focusConfig.social,
        type: 'skill',
        ruleNote: 'Perícia Customizada',
      });
    });
  }

  const socAttrTotal = socAttrItems.reduce((acc, it) => acc + it.cost, 0);
  const socSkillTotal = socSkillItems.reduce((acc, it) => acc + it.cost, 0);
  const socSectionTotal = socAttrTotal + socSkillTotal;

  // 4. Especial & Termos Fixos
  // - Domínios: Tabela de Perícias em F1
  const domainItems: TreeItemLeaf[] = Object.entries(data.domains || {}).map(([key, val]) => ({
    id: `domain_${key}`,
    name: DOMAIN_TRANSLATIONS[key] || key,
    level: val,
    cost: getSkillCost(val, 'F1'),
    focus: 'F1',
    type: 'fixed',
    ruleNote: 'Fixado em F1',
  }));
  const domainsTotal = domainItems.reduce((acc, it) => acc + it.cost, 0);

  // - Spiritus (Fluxo e Patrono): Tabela de Atributos em F1
  const spiritusItems: TreeItemLeaf[] = [
    {
      id: 'spiritus_fluxo',
      name: 'Fluxo Espiritual',
      level: data.spiritus?.fluxo || 1,
      cost: getAttributeCost(data.spiritus?.fluxo || 1, 'F1'),
      focus: 'F1',
      type: 'fixed',
      ruleNote: 'Atributo Fixado em F1',
    },
    {
      id: 'spiritus_patrono',
      name: 'Patrono Místico',
      level: data.spiritus?.patrono || 1,
      cost: getAttributeCost(data.spiritus?.patrono || 1, 'F1'),
      focus: 'F1',
      type: 'fixed',
      ruleNote: 'Atributo Fixado em F1',
    },
  ];
  const spiritusTotal = spiritusItems.reduce((acc, it) => acc + it.cost, 0);

  // - Personalidade: Tabela de Perícias em F2
  const personalityItems: TreeItemLeaf[] = Object.entries(data.personality || {}).map(([key, val]) => ({
    id: `personality_${key}`,
    name: PERSONALITY_TRANSLATIONS[key] || key,
    level: val,
    cost: getSkillCost(val, 'F2'),
    focus: 'F2',
    type: 'fixed',
    ruleNote: 'Fixado em F2',
  }));
  const personalityTotal = personalityItems.reduce((acc, it) => acc + it.cost, 0);

  const specialSectionTotal = domainsTotal + spiritusTotal + personalityTotal;
  const totalSpent = physSectionTotal + mentSectionTotal + socSectionTotal + specialSectionTotal;

  const sections: TreeSectionNode[] = [
    {
      id: 'sec_physical',
      title: 'Eixo Físico',
      theme: 'rose',
      focus: focusConfig.physical,
      totalExp: physSectionTotal,
      subgroups: [
        {
          id: 'sub_phys_attrs',
          title: 'Atributos Físicos',
          totalExp: physAttrTotal,
          items: physAttrItems,
        },
        {
          id: 'sub_phys_skills',
          title: 'Perícias Físicas (Treinamentos)',
          totalExp: physSkillTotal,
          items: physSkillItems,
        },
      ],
    },
    {
      id: 'sec_mental',
      title: 'Eixo Mental',
      theme: 'cyan',
      focus: focusConfig.mental,
      totalExp: mentSectionTotal,
      subgroups: [
        {
          id: 'sub_ment_attrs',
          title: 'Atributos Mentais',
          totalExp: mentAttrTotal,
          items: mentAttrItems,
        },
        {
          id: 'sub_ment_skills',
          title: 'Perícias Mentais (Ciências)',
          totalExp: mentSkillTotal,
          items: mentSkillItems,
        },
      ],
    },
    {
      id: 'sec_social',
      title: 'Eixo Social',
      theme: 'emerald',
      focus: focusConfig.social,
      totalExp: socSectionTotal,
      subgroups: [
        {
          id: 'sub_soc_attrs',
          title: 'Atributos Sociais',
          totalExp: socAttrTotal,
          items: socAttrItems,
        },
        {
          id: 'sub_soc_skills',
          title: 'Perícias Sociais (Artes)',
          totalExp: socSkillTotal,
          items: socSkillItems,
        },
      ],
    },
    {
      id: 'sec_special',
      title: 'Especial & Termos Fixos',
      theme: 'amber',
      focus: 'F1',
      totalExp: specialSectionTotal,
      subgroups: [
        {
          id: 'sub_special_domains',
          title: 'Domínios Elementais (Fixado F1)',
          totalExp: domainsTotal,
          items: domainItems,
        },
        {
          id: 'sub_special_spiritus',
          title: 'Spiritus: Fluxo & Patrono (Fixado F1)',
          totalExp: spiritusTotal,
          items: spiritusItems,
        },
        {
          id: 'sub_special_personality',
          title: 'Personalidade (Fixado F2)',
          totalExp: personalityTotal,
          items: personalityItems,
        },
      ],
    },
  ];

  return {
    totalSpent,
    sections,
    summary: {
      physicalExp: physSectionTotal,
      mentalExp: mentSectionTotal,
      socialExp: socSectionTotal,
      specialExp: specialSectionTotal,
    },
  };
}

/**
 * Calcula o custo total gasto (mantém compatibilidade direta com a assinatura anterior)
 */
export function calculateSheetTotalExp(data: CharacterData) {
  const tree = getDetailedSheetExpBreakdown(data);
  return {
    physicalExp: tree.summary.physicalExp,
    mentalExp: tree.summary.mentalExp,
    socialExp: tree.summary.socialExp,
    specialExp: tree.summary.specialExp,
    totalSpent: tree.totalSpent,
    breakdown: {
      physicalAttributes: tree.sections[0].subgroups[0].totalExp,
      physicalSkills: tree.sections[0].subgroups[1].totalExp,
      mentalAttributes: tree.sections[1].subgroups[0].totalExp,
      mentalSkills: tree.sections[1].subgroups[1].totalExp,
      socialAttributes: tree.sections[2].subgroups[0].totalExp,
      socialSkills: tree.sections[2].subgroups[1].totalExp,
      domainsExp: tree.sections[3].subgroups[0].totalExp,
      spiritusExp: tree.sections[3].subgroups[1].totalExp,
      personalityExp: tree.sections[3].subgroups[2].totalExp,
    },
    tree,
  };
}

/**
 * Cálculos das Mecânicas Vitais e Fórmulas Sugeridas:
 * - Regen de Mana = Domínio + Personalidade + Fluxo
 * - Regen de HP = Patrono + Constituição + Personalidade
 * - Margem Segura para Gasto de Magia = Domínio Usado + Fluxo
 */
export function calculateDerivedMechanics(data: CharacterData) {
  const domainValues = data.domains ? Object.values(data.domains) : [0];
  const maxDomain = Math.max(...domainValues, 0);
  const sumDomains = domainValues.reduce((a, b) => a + b, 0);

  const personalitySum = (data.personality?.courage || 0) + (data.personality?.conviction || 0) + (data.personality?.serenity || 0);
  const personalityAvg = Math.round(personalitySum / 3) || 1;

  const constitution = data.attributes?.physical?.constitution || 1;

  const fluxo = data.spiritus?.fluxo || 1;
  const patrono = data.spiritus?.patrono || 1;

  const manaRegen = maxDomain + personalityAvg + fluxo;
  const hpRegen = patrono + constitution + personalityAvg;
  const safeMagicMargin = maxDomain + fluxo;

  return {
    manaRegen,
    hpRegen,
    safeMagicMargin,
    maxDomain,
    personalityAvg,
    constitution,
    fluxo,
    patrono,
    sumDomains,
  };
}
