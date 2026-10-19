// Matrizes de Custo (Look-up Tables) e Regras de Focos de EXP
// Sistema Aurora RPG

import { FocusLevel, FocusDistributionType, FocusConfig, CharacterData } from '../types';

export const ATRIBUTOS_COST_TABLE: Record<FocusLevel, number[]> = {
  // LVL 1 to 15 (index 0 is LVL 1, index 14 is LVL 15)
  Fe: [9, 11, 13, 16, 19, 24, 29, 35, 43, 53, 64, 79, 96, 117, 143],
  F1: [11, 13, 16, 20, 25, 31, 39, 48, 59, 74, 91, 113, 140, 174, 216],
  F2: [13, 16, 20, 25, 31, 39, 48, 60, 76, 95, 119, 149, 186, 233, 292],
  F3: [15, 18, 23, 30, 38, 48, 61, 78, 99, 126, 160, 204, 259, 329, 418],
};

export const PERICIAS_COST_TABLE: Record<FocusLevel, number[]> = {
  // LVL 1 to 7 (index 0 is LVL 1, index 6 is LVL 7)
  Fe: [11, 15, 21, 30, 43, 61, 86],
  F1: [13, 19, 27, 39, 56, 80, 113],
  F2: [15, 21, 31, 46, 67, 98, 139],
  F3: [17, 26, 38, 57, 85, 127, 184],
};

export const FOCUS_LABELS: Record<FocusLevel, { label: string; desc: string; color: string; badgeBg: string }> = {
  Fe: { label: 'Fe (Exclusivo)', desc: 'Custo mais barato', color: 'text-amber-300', badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300' },
  F1: { label: 'F1 (Primário)', desc: 'Custo baixo', color: 'text-emerald-300', badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' },
  F2: { label: 'F2 (Secundário)', desc: 'Custo médio', color: 'text-cyan-300', badgeBg: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' },
  F3: { label: 'F3 (Sem Foco)', desc: 'Custo mais alto', color: 'text-slate-300', badgeBg: 'bg-slate-500/20 border-slate-400/40 text-slate-300' },
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
    pattern: '[ F1 + F2 + F3 ]',
    description: 'Um Foco Primário, um Secundário e um Sem Foco. Distribuição equilibrada e orgânica.',
    validConfigurations: [
      { physical: 'F1', mental: 'F2', social: 'F3' },
      { physical: 'F1', mental: 'F3', social: 'F2' },
      { physical: 'F2', mental: 'F1', social: 'F3' },
      { physical: 'F2', mental: 'F3', social: 'F1' },
      { physical: 'F3', mental: 'F1', social: 'F2' },
      { physical: 'F3', mental: 'F2', social: 'F1' },
    ],
  },
  {
    id: 'especializada',
    title: 'O Especialista',
    subtitle: 'Gênio Focado',
    pattern: '[ Fe + F3 + F3 ]',
    description: 'Um Foco Exclusivo (Fe) de altíssimo talento em uma área, e duas áreas Sem Foco (F3).',
    validConfigurations: [
      { physical: 'Fe', mental: 'F3', social: 'F3' },
      { physical: 'F3', mental: 'Fe', social: 'F3' },
      { physical: 'F3', mental: 'F3', social: 'Fe' },
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
export function getAttributeCost(lvl: number, focus: FocusLevel): number {
  if (lvl <= 0) return 0;
  const clampedLvl = Math.min(15, Math.max(1, lvl));
  const table = ATRIBUTOS_COST_TABLE[focus] || ATRIBUTOS_COST_TABLE.F2;
  return table[clampedLvl - 1] || 0;
}

/**
 * Retorna o custo de uma Perícia (LVL 1 a 7) dado o seu Foco.
 */
export function getSkillCost(lvl: number, focus: FocusLevel): number {
  if (lvl <= 0) return 0;
  const clampedLvl = Math.min(7, Math.max(1, lvl));
  const table = PERICIAS_COST_TABLE[focus] || PERICIAS_COST_TABLE.F2;
  return table[clampedLvl - 1] || 0;
}

/**
 * Calcula o custo total gasto em Atributos, Perícias e Termos Fixos de uma Ficha.
 * Regras Especiais (Termos Fixos):
 * - Alma: Usa tabela de Atributos na coluna Fe.
 * - Domínio: Usa tabela de Perícias na coluna F1.
 * - Personalidade: Usa tabela de Perícias na coluna F2.
 * - Fluxo e Patrono: Considerados Atributos F1.
 */
export function calculateSheetTotalExp(data: CharacterData): {
  physicalExp: number;
  mentalExp: number;
  socialExp: number;
  specialExp: number;
  totalSpent: number;
  breakdown: {
    physicalAttributes: number;
    physicalSkills: number;
    mentalAttributes: number;
    mentalSkills: number;
    socialAttributes: number;
    socialSkills: number;
    domainsExp: number;
    spiritusExp: number;
    personalityExp: number;
  };
} {
  const focusConfig: FocusConfig = data.focusConfig || {
    distribution: 'padrao',
    physical: 'F1',
    mental: 'F2',
    social: 'F3',
  };

  // 1. Físico
  let physicalAttributes = 0;
  if (data.attributes?.physical) {
    Object.values(data.attributes.physical).forEach((val) => {
      physicalAttributes += getAttributeCost(val, focusConfig.physical);
    });
  }

  let physicalSkills = 0;
  if (data.skills?.physical) {
    Object.values(data.skills.physical).forEach((val) => {
      physicalSkills += getSkillCost(val, focusConfig.physical);
    });
  }
  if (data.customSkills?.treinamentos) {
    data.customSkills.treinamentos.forEach((s) => {
      physicalSkills += getSkillCost(s.value, focusConfig.physical);
    });
  }

  // 2. Mental
  let mentalAttributes = 0;
  if (data.attributes?.mental) {
    Object.values(data.attributes.mental).forEach((val) => {
      mentalAttributes += getAttributeCost(val, focusConfig.mental);
    });
  }

  let mentalSkills = 0;
  if (data.skills?.mental) {
    Object.values(data.skills.mental).forEach((val) => {
      mentalSkills += getSkillCost(val, focusConfig.mental);
    });
  }
  if (data.customSkills?.ciencias) {
    data.customSkills.ciencias.forEach((s) => {
      mentalSkills += getSkillCost(s.value, focusConfig.mental);
    });
  }

  // 3. Social
  let socialAttributes = 0;
  if (data.attributes?.social) {
    Object.values(data.attributes.social).forEach((val) => {
      socialAttributes += getAttributeCost(val, focusConfig.social);
    });
  }

  let socialSkills = 0;
  if (data.skills?.social) {
    Object.values(data.skills.social).forEach((val) => {
      socialSkills += getSkillCost(val, focusConfig.social);
    });
  }
  if (data.customSkills?.artes) {
    data.customSkills.artes.forEach((s) => {
      socialSkills += getSkillCost(s.value, focusConfig.social);
    });
  }

  // 4. Termos Fixos / Especiais
  // - Domínio: Usa tabela de Perícias na coluna F1.
  let domainsExp = 0;
  if (data.domains) {
    Object.values(data.domains).forEach((val) => {
      domainsExp += getSkillCost(val, 'F1');
    });
  }

  // - Fluxo e Patrono são considerados atributos F1.
  let spiritusExp = 0;
  if (data.spiritus) {
    spiritusExp += getAttributeCost(data.spiritus.fluxo || 1, 'F1');
    spiritusExp += getAttributeCost(data.spiritus.patrono || 1, 'F1');
  }

  // - Personalidade: Usa tabela de Perícias na coluna F2.
  let personalityExp = 0;
  if (data.personality) {
    Object.values(data.personality).forEach((val) => {
      personalityExp += getSkillCost(val, 'F2');
    });
  }

  const physicalExp = physicalAttributes + physicalSkills;
  const mentalExp = mentalAttributes + mentalSkills;
  const socialExp = socialAttributes + socialSkills;
  const specialExp = domainsExp + spiritusExp + personalityExp;
  const totalSpent = physicalExp + mentalExp + socialExp + specialExp;

  return {
    physicalExp,
    mentalExp,
    socialExp,
    specialExp,
    totalSpent,
    breakdown: {
      physicalAttributes,
      physicalSkills,
      mentalAttributes,
      mentalSkills,
      socialAttributes,
      socialSkills,
      domainsExp,
      spiritusExp,
      personalityExp,
    },
  };
}

/**
 * Cálculos das Mecânicas Vitais e Fórmulas Sugeridas:
 * - Regen de Mana = Domínio + Personalidade + Fluxo
 * - Regen de HP = Patrono + Constituição + Personalidade
 * - Margem Segura para Gasto de Magia = Domínio Usado + Fluxo
 */
export function calculateDerivedMechanics(data: CharacterData) {
  // Maior Domínio ou Média de Domínios
  const domainValues = data.domains ? Object.values(data.domains) : [0];
  const maxDomain = Math.max(...domainValues, 0);
  const sumDomains = domainValues.reduce((a, b) => a + b, 0);

  // Personalidade (Soma ou maior atributo)
  const personalitySum = (data.personality?.courage || 0) + (data.personality?.conviction || 0) + (data.personality?.serenity || 0);
  const personalityAvg = Math.round(personalitySum / 3) || 1;

  // Constituição
  const constitution = data.attributes?.physical?.constitution || 1;

  // Fluxo e Patrono
  const fluxo = data.spiritus?.fluxo || 1;
  const patrono = data.spiritus?.patrono || 1;

  // Regen de Mana = Domínio + Personalidade + Fluxo
  const manaRegen = maxDomain + personalityAvg + fluxo;

  // Regen de HP = Patrono + Constituição + Personalidade
  const hpRegen = patrono + constitution + personalityAvg;

  // Margem segura pra gasto de magia = Domínio usado + Fluxo
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
