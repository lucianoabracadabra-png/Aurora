// Sistema Canônico de Raridade & Força de Itens - Aurora RPG
// Ranking oficial medido pela quantidade de estrelas (*):
// 1★ Comum – O padrão básico do dia a dia.
// 2★ Incomum – Qualidade superior, apresentando pequenas melhorias em relação ao padrão.
// 3★ Raro – Escasso e valioso, com características únicas e difíceis de encontrar.
// 4★ Épico – Excepcionalmente poderoso e forjado com maestria.
// 5★ Lendário – Itens de grande renome, geralmente únicos e com poder inestimável.
// 6★ Mítico – Tão absurdamente raros que sua existência é considerada um mito.
// 7★ Divino – Imbuído com a essência e o poder de deuses ou entidades superiores.
// 8★ Transcendente – Ultrapassa as leis físicas e a realidade conhecida do seu universo.
// 9★ Primordial – O ápice perfeito e insuperável, a raridade final do sistema.

export interface ItemRarityDefinition {
  stars: number; // 1 a 9
  starSymbol: string; // '1★' a '9★'
  name: string;
  description: string;
  color: string;
  border: string;
  glow: string;
  bgGlow: string;
  badgeBg: string;
  text: string;
}

export const ITEM_RARITIES: Record<number, ItemRarityDefinition> = {
  1: {
    stars: 1,
    starSymbol: '1★',
    name: 'Comum',
    description: 'O padrão básico do dia a dia.',
    color: '#94a3b8',
    border: 'border-slate-500/40',
    glow: 'shadow-none',
    bgGlow: 'bg-slate-500/10',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    text: 'text-slate-300',
  },
  2: {
    stars: 2,
    starSymbol: '2★',
    name: 'Incomum',
    description: 'Qualidade superior, apresentando pequenas melhorias em relação ao padrão.',
    color: '#22c55e',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
    bgGlow: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-400',
  },
  3: {
    stars: 3,
    starSymbol: '3★',
    name: 'Raro',
    description: 'Escasso e valioso, com características únicas e difíceis de encontrar.',
    color: '#0ea5e9',
    border: 'border-sky-500/50',
    glow: 'shadow-[0_0_12px_rgba(14,165,233,0.4)]',
    bgGlow: 'bg-sky-500/15',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    text: 'text-sky-400',
  },
  4: {
    stars: 4,
    starSymbol: '4★',
    name: 'Épico',
    description: 'Excepcionalmente poderoso e forjado com maestria.',
    color: '#a855f7',
    border: 'border-purple-500/50',
    glow: 'shadow-[0_0_14px_rgba(168,85,247,0.45)]',
    bgGlow: 'bg-purple-500/15',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    text: 'text-purple-400',
  },
  5: {
    stars: 5,
    starSymbol: '5★',
    name: 'Lendário',
    description: 'Itens de grande renome, geralmente únicos e com poder inestimável.',
    color: '#f97316',
    border: 'border-orange-500/60',
    glow: 'shadow-[0_0_16px_rgba(249,115,22,0.5)]',
    bgGlow: 'bg-orange-500/15',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    text: 'text-orange-400',
  },
  6: {
    stars: 6,
    starSymbol: '6★',
    name: 'Mítico',
    description: 'Tão absurdamente raros que sua existência é considerada um mito.',
    color: '#ef4444',
    border: 'border-red-500/60',
    glow: 'shadow-[0_0_18px_rgba(239,68,68,0.55)]',
    bgGlow: 'bg-red-500/15',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    text: 'text-red-400',
  },
  7: {
    stars: 7,
    starSymbol: '7★',
    name: 'Divino',
    description: 'Imbuído com a essência e o poder de deuses ou entidades superiores.',
    color: '#eab308',
    border: 'border-yellow-400/70',
    glow: 'shadow-[0_0_22px_rgba(234,179,8,0.65)] ring-1 ring-yellow-400/40',
    bgGlow: 'bg-yellow-500/20',
    badgeBg: 'bg-yellow-500/25 text-yellow-300 border-yellow-400/60',
    text: 'text-yellow-300',
  },
  8: {
    stars: 8,
    starSymbol: '8★',
    name: 'Transcendente',
    description: 'Ultrapassa as leis físicas e a realidade conhecida do seu universo.',
    color: '#06b6d4',
    border: 'border-cyan-400/80',
    glow: 'shadow-[0_0_24px_rgba(6,182,212,0.7)] ring-1 ring-cyan-300/50',
    bgGlow: 'bg-cyan-500/20',
    badgeBg: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60',
    text: 'text-cyan-300',
  },
  9: {
    stars: 9,
    starSymbol: '9★',
    name: 'Primordial',
    description: 'O ápice perfeito e insuperável, a raridade final do sistema.',
    color: '#ec4899',
    border: 'border-pink-500/90',
    glow: 'shadow-[0_0_28px_rgba(236,72,153,0.8)] ring-1 ring-pink-400/70',
    bgGlow: 'bg-pink-500/25',
    badgeBg: 'bg-pink-500/30 text-pink-200 border-pink-400/70',
    text: 'text-pink-300 font-extrabold',
  },
};

export const ITEM_RARITY_LIST: ItemRarityDefinition[] = [
  ITEM_RARITIES[1],
  ITEM_RARITIES[2],
  ITEM_RARITIES[3],
  ITEM_RARITIES[4],
  ITEM_RARITIES[5],
  ITEM_RARITIES[6],
  ITEM_RARITIES[7],
  ITEM_RARITIES[8],
  ITEM_RARITIES[9],
];

/**
 * Identifica a raridade canônica de um item a partir de estrelas ou menção textual.
 */
export function resolveItemRarity(item: any): ItemRarityDefinition {
  if (!item) return ITEM_RARITIES[1];

  // 1. Verificação explícita de estrelas numéricas (1 a 9)
  const explicitStars = Number(item.stars || item.rarityStars);
  if (!isNaN(explicitStars) && explicitStars >= 1 && explicitStars <= 9) {
    return ITEM_RARITIES[explicitStars];
  }

  // 2. Análise de texto
  const explicitRarity = String(item.rarity || '').toLowerCase();
  const name = String(item.name || '').toLowerCase();
  const extras = String(('extras' in item ? item.extras : '') || '').toLowerCase();
  const desc = String(('description' in item ? item.description : '') || '').toLowerCase();
  const fullText = `${explicitRarity} ${name} ${extras} ${desc}`;

  // 9★ Primordial
  if (fullText.includes('9*') || fullText.includes('9★') || fullText.includes('primordial')) {
    return ITEM_RARITIES[9];
  }
  // 8★ Transcendente
  if (fullText.includes('8*') || fullText.includes('8★') || fullText.includes('transcendente') || fullText.includes('transcendent')) {
    return ITEM_RARITIES[8];
  }
  // 7★ Divino
  if (fullText.includes('7*') || fullText.includes('7★') || fullText.includes('divino') || fullText.includes('divine') || fullText.includes('deus')) {
    return ITEM_RARITIES[7];
  }
  // 6★ Mítico
  if (fullText.includes('6*') || fullText.includes('6★') || fullText.includes('mítico') || fullText.includes('mitico') || fullText.includes('mythic')) {
    return ITEM_RARITIES[6];
  }
  // 5★ Lendário
  if (fullText.includes('5*') || fullText.includes('5★') || fullText.includes('lendári') || fullText.includes('legendary') || fullText.includes('sagrado')) {
    return ITEM_RARITIES[5];
  }
  // 4★ Épico
  if (fullText.includes('4*') || fullText.includes('4★') || fullText.includes('épic') || fullText.includes('epic') || fullText.includes('constelar')) {
    return ITEM_RARITIES[4];
  }
  // 3★ Raro
  if (fullText.includes('3*') || fullText.includes('3★') || fullText.includes('raro') || fullText.includes('rare') || fullText.includes('valioso')) {
    return ITEM_RARITIES[3];
  }
  // 2★ Incomum
  if (fullText.includes('2*') || fullText.includes('2★') || fullText.includes('incomum') || fullText.includes('uncommon') || fullText.includes('superior')) {
    return ITEM_RARITIES[2];
  }
  // 1★ Comum
  if (fullText.includes('1*') || fullText.includes('1★') || fullText.includes('comum') || fullText.includes('common') || fullText.includes('básico')) {
    return ITEM_RARITIES[1];
  }

  // Padrão canônico
  return ITEM_RARITIES[1];
}
