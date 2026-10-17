import { CharacterData } from '../types';
import { safeJsonParse, normalizeCoinType } from './auroraTools';

export interface AuroraActionResult {
  success: boolean;
  message: string;
  category?: 'personality' | 'mana' | 'attribute' | 'skill' | 'currency' | 'health' | 'domain' | 'flow' | 'dice' | 'query' | 'identity' | 'help' | 'unknown';
  updatedData?: CharacterData;
  undoData?: CharacterData;
  description?: string;
  diceRoll?: {
    formula: string;
    rolls: number[];
    total: number;
    modifier?: number;
  };
}

// Convert common Portuguese number words to numbers
const NUMBER_WORDS: Record<string, number> = {
  'zero': 0,
  'um': 1,
  'uma': 1,
  'dois': 2,
  'duas': 2,
  'tres': 3,
  'três': 3,
  'quatro': 4,
  'cinco': 5,
  'seis': 6,
  'sete': 7,
  'oito': 8,
  'nove': 9,
  'dez': 10,
  'onze': 11,
  'doze': 12,
  'treze': 13,
  'quatorze': 14,
  'catorze': 14,
  'quinze': 15,
  'dezesseis': 16,
  'dezessete': 17,
  'dezoito': 18,
  'dezenove': 19,
  'vinte': 20,
  'trinta': 30,
  'quarenta': 40,
  'cinquenta': 50,
  'sessenta': 60,
  'setenta': 70,
  'oitenta': 80,
  'noventa': 90,
  'cem': 100,
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .trim();
}

function cleanCommand(input: string): string {
  let cleaned = input.trim();
  
  // Remove wake prefixes like "ei aurora,", "aurora,", "ola aurora", "oi aurora", "por favor"
  const prefixes = [
    /^ei[\s,]+aurora[\s,:]*/i,
    /^ola[\s,]+aurora[\s,:]*/i,
    /^oi[\s,]+aurora[\s,:]*/i,
    /^aurora[\s,:]*/i,
    /^por[\s]+favor[\s,:]*/i,
    /^por[\s]+gentileza[\s,:]*/i,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '').trim();
  }

  return cleaned;
}

function extractNumber(text: string, defaultNum = 1): number {
  // First check for direct digits
  const digitMatch = text.match(/-?\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }

  // Check for Portuguese words
  const words = text.toLowerCase().split(/\s+/);
  for (const w of words) {
    const cleanW = normalizeText(w);
    if (NUMBER_WORDS[cleanW] !== undefined) {
      return NUMBER_WORDS[cleanW];
    }
  }

  return defaultNum;
}

export function parseAndExecuteAurora(
  rawInput: string,
  currentData: CharacterData
): AuroraActionResult {
  const command = cleanCommand(rawInput);
  const norm = normalizeText(command);

  if (!norm) {
    return {
      success: false,
      message: 'Olá! Sou a Aurora. Diga o que deseja alterar, como: "aumente a coragem um ponto" ou "tire 6 pontos de mana física".',
      category: 'help'
    };
  }

  // --- 1. COMANDOS DE AJUDA ---
  if (
    norm === 'ajuda' ||
    norm === 'socorro' ||
    norm === 'help' ||
    norm.includes('o que voce pode fazer') ||
    norm.includes('o que voce faz') ||
    norm.includes('comandos') ||
    norm.includes('como funciona')
  ) {
    return {
      success: true,
      category: 'help',
      message: 
`✨ **Eu sou a Aurora!** Posso fazer alterações na sua ficha instantaneamente sem gastar IA:
• **Personalidade**: "aumente a coragem um ponto", "coloque convicção em 4"
• **Mana**: "tire 6 pontos de mana física", "gaste 3 de foco", "recupere toda a mana"
• **Atributos**: "aumente agilidade em 1", "tire 1 de força"
• **Perícias**: "aumente furtividade em 1", "coloque intuição em 3"
• **Moedas**: "adicione 50 peças de ouro", "gastei 12 de prata"
• **Vida**: "cure todos os ferimentos", "cure a cabeça"
• **Dados**: "role 1d20", "role 2d10+4"
• **Consultas**: "quanto de mana física eu tenho?", "qual minha coragem?"`
    };
  }

  // --- 2. COMANDOS DE DADOS (DICE ROLLER) ---
  const diceMatch = norm.match(/(?:role|rola|jogar|girar|rolar|jogue|dado|dados)?\s*(\d*)\s*d\s*(\d+)(?:\s*([+-])\s*(\d+))?/i);
  if (diceMatch && (norm.includes('d') || norm.includes('role') || norm.includes('dado'))) {
    const count = parseInt(diceMatch[1] || '1', 10);
    const sides = parseInt(diceMatch[2], 10);
    const sign = diceMatch[3];
    const mod = diceMatch[4] ? parseInt(diceMatch[4], 10) : 0;
    const modifier = sign === '-' ? -mod : mod;

    if (count > 0 && count <= 50 && sides > 1 && sides <= 1000) {
      const rolls: number[] = [];
      let sum = 0;
      for (let i = 0; i < count; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push(val);
        sum += val;
      }
      const total = sum + modifier;
      const modStr = modifier !== 0 ? ` ${sign} ${mod}` : '';
      const rollDetails = rolls.length > 1 ? ` [${rolls.join(', ')}]` : ` [${rolls[0]}]`;

      return {
        success: true,
        category: 'dice',
        diceRoll: { formula: `${count}d${sides}${modStr}`, rolls, total, modifier },
        message: `🎲 **Rolagem ${count}d${sides}${modStr}**: ${rollDetails}${modifier !== 0 ? ` ${sign} ${mod}` : ''} = **${total}**!`
      };
    }
  }

  // --- 3. CONSULTAS / QUERIES ("quanto...", "qual...", "mostrar...") ---
  if (norm.startsWith('quanto') || norm.startsWith('qual') || norm.startsWith('quais') || norm.startsWith('ver') || norm.startsWith('mostrar')) {
    // Mana física
    if (norm.includes('mana fisica') || norm.includes('vigor')) {
      const total = (Object.values(currentData.attributes.physical) as number[]).reduce((a, b) => a + b, 0);
      const spent = currentData.manaSpent.physical;
      const current = Math.max(0, total - spent);
      return {
        success: true,
        category: 'query',
        message: `🔮 **Mana Física (Vigor)**: Você possui **${current}/${total}** disponíveis (${spent} gastos).`
      };
    }
    // Mana mental / foco
    if (norm.includes('mana mental') || norm.includes('foco')) {
      const total = (Object.values(currentData.attributes.mental) as number[]).reduce((a, b) => a + b, 0);
      const spent = currentData.manaSpent.mental;
      const current = Math.max(0, total - spent);
      return {
        success: true,
        category: 'query',
        message: `🧠 **Mana Mental (Foco)**: Você possui **${current}/${total}** disponíveis (${spent} gastos).`
      };
    }
    // Mana social / graça
    if (norm.includes('mana social') || norm.includes('graca')) {
      const total = (Object.values(currentData.attributes.social) as number[]).reduce((a, b) => a + b, 0);
      const spent = currentData.manaSpent.social;
      const current = Math.max(0, total - spent);
      return {
        success: true,
        category: 'query',
        message: `✨ **Mana Social (Graça)**: Você possui **${current}/${total}** disponíveis (${spent} gastos).`
      };
    }
    // Coragem / Convicção / Serenidade
    if (norm.includes('coragem')) {
      return {
        success: true,
        category: 'query',
        message: `🦁 Sua **Coragem** atual é **${currentData.personality.courage}**.`
      };
    }
    if (norm.includes('conviccao')) {
      return {
        success: true,
        category: 'query',
        message: `⚖️ Sua **Convicção** atual é **${currentData.personality.conviction}**.`
      };
    }
    if (norm.includes('serenidade')) {
      return {
        success: true,
        category: 'query',
        message: `🕊️ Sua **Serenidade** atual é **${currentData.personality.serenity}**.`
      };
    }
    // Dinheiro
    if (norm.includes('ouro') || norm.includes('moeda') || norm.includes('dinheiro') || norm.includes('prata') || norm.includes('cobre')) {
      const { gold, silver, copper } = currentData.inventory.currency;
      return {
        success: true,
        category: 'query',
        message: `💰 **Suas Finanças**: **${gold}** PO (Ouro), **${silver}** PP (Prata), **${copper}** PC (Cobre).`
      };
    }
    // Idiomas
    if (norm.includes('idioma') || norm.includes('idiomas') || norm.includes('lingua') || norm.includes('linguas')) {
      const langs = currentData.identity?.languages || [];
      return {
        success: true,
        category: 'query',
        message: `🗣️ **Idiomas Conhecidos**: ${langs.length > 0 ? langs.join(', ') : 'Nenhum idioma registrado na ficha.'}`
      };
    }
    // Vantagens / Traços
    if (norm.includes('vantagem') || norm.includes('vantagens') || norm.includes('desvantagem') || norm.includes('traco') || norm.includes('tracos')) {
      const traits = currentData.traits || [];
      const list = traits.map(t => `• **${t.name}** (${t.type === 'advantage' ? 'Vantagem' : 'Desvantagem'}, ${t.value} pts)`).join('\n');
      return {
        success: true,
        category: 'query',
        message: `✨ **Vantagens & Desvantagens**:\n${list || 'Nenhum traço registrado.'}`
      };
    }
    // Habilidades
    if (norm.includes('habilidade') || norm.includes('habilidades')) {
      const abs = currentData.abilities || [];
      const list = abs.map(a => `• **${a.name}** (Custo: ${a.cost || '0'})${a.selected ? ' [Ativa]' : ''}`).join('\n');
      return {
        success: true,
        category: 'query',
        message: `🔮 **Habilidades**:\n${list || 'Nenhuma habilidade registrada.'}`
      };
    }
  }

  // Determina intenção: aumento (+), diminuição (-), definição (=), restauração total
  const isIncrease = 
    norm.includes('aumente') ||
    norm.includes('aumenta') ||
    norm.includes('adicione') ||
    norm.includes('adiciona') ||
    norm.includes('some') ||
    norm.includes('coloque mais') ||
    norm.includes('mais') ||
    norm.includes('suba') ||
    norm.includes('ganhei') ||
    norm.includes('acrescente') ||
    norm.includes('eleve');

  const isDecrease = 
    norm.includes('tire') ||
    norm.includes('tira') ||
    norm.includes('remova') ||
    norm.includes('diminua') ||
    norm.includes('gaste') ||
    norm.includes('gasta') ||
    norm.includes('consuma') ||
    norm.includes('perdi') ||
    norm.includes('menos') ||
    norm.includes('subtraia') ||
    norm.includes('baixe');

  const isSet = 
    norm.includes('coloque em') ||
    norm.includes('defina para') ||
    norm.includes('defina em') ||
    norm.includes('mude para') ||
    norm.includes('deixe em') ||
    norm.includes('ajuste para') ||
    norm.includes('bote em') ||
    norm.includes('agora e');

  const isReset = 
    norm.includes('restaure toda') ||
    norm.includes('recupere toda') ||
    norm.includes('restaurar toda') ||
    norm.includes('recuperar toda') ||
    norm.includes('recupere toda a mana') ||
    norm.includes('encher mana') ||
    norm.includes('reset') ||
    norm.includes('limpe todos os ferimentos') ||
    norm.includes('cure tudo');

  // --- 4. MANA TOTAL / RESTAURAÇÃO DE MANA ---
  if (isReset && (norm.includes('mana') || norm.includes('todas'))) {
    const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
    updated.manaSpent = { physical: 0, mental: 0, social: 0 };
    return {
      success: true,
      category: 'mana',
      updatedData: updated,
      undoData: currentData,
      message: `✨ **Todas as reservas de Mana foram totalmente restauradas!** Físico, Foco e Graça estão no máximo.`,
      description: 'Restaurar toda a mana'
    };
  }

  // --- 5. MANA (FÍSICA, MENTAL, SOCIAL) ---
  // Exemplo: "tire 6 pontos de mana física" ou "gaste 6 de foco" ou "recupere 3 de mana mental"
  const isPhysicalMana = norm.includes('mana fisica') || norm.includes('mana do vigor') || (norm.includes('vigor') && !norm.includes('forca'));
  const isMentalMana = norm.includes('mana mental') || norm.includes('foco') || norm.includes('mana do foco');
  const isSocialMana = norm.includes('mana social') || norm.includes('graca') || norm.includes('mana da graca');

  if (isPhysicalMana || isMentalMana || isSocialMana || (norm.includes('mana') && !isReset)) {
    const num = extractNumber(command, 1);
    const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);

    let target: 'physical' | 'mental' | 'social' = 'physical';
    let label = 'Mana Física (Vigor)';
    let total = (Object.values(currentData.attributes.physical) as number[]).reduce((a, b) => a + b, 0);

    if (isMentalMana) {
      target = 'mental';
      label = 'Mana Mental (Foco)';
      total = (Object.values(currentData.attributes.mental) as number[]).reduce((a, b) => a + b, 0);
    } else if (isSocialMana) {
      target = 'social';
      label = 'Mana Social (Graça)';
      total = (Object.values(currentData.attributes.social) as number[]).reduce((a, b) => a + b, 0);
    }

    const currentSpent = updated.manaSpent[target];
    const currentAvailable = Math.max(0, total - currentSpent);

    // "tire 6 de mana" / "gaste 6 de mana" significa que o pool DISPONÍVEL diminui em 6, ou seja, manaSpent aumenta em 6!
    // "recupere 6 de mana" / "adicione 6 de mana" significa que o pool DISPONÍVEL aumenta em 6, ou seja, manaSpent diminui em 6!
    const isSpending = isDecrease || norm.includes('gaste') || norm.includes('tire') || norm.includes('consuma');
    const isRecovering = isIncrease || norm.includes('recupere') || norm.includes('cure') || norm.includes('restaure') || norm.includes('adicione');

    if (isSpending) {
      const newSpent = Math.min(total, currentSpent + num);
      updated.manaSpent[target] = newSpent;
      const newAvailable = Math.max(0, total - newSpent);
      return {
        success: true,
        category: 'mana',
        updatedData: updated,
        undoData: currentData,
        message: `⚡ **${label}**: Consumiu **${num}** ponto(s). Restam **${newAvailable}/${total}** disponíveis.`,
        description: `Gastar ${num} de ${label}`
      };
    } else if (isRecovering) {
      const newSpent = Math.max(0, currentSpent - num);
      updated.manaSpent[target] = newSpent;
      const newAvailable = Math.max(0, total - newSpent);
      return {
        success: true,
        category: 'mana',
        updatedData: updated,
        undoData: currentData,
        message: `✨ **${label}**: Recuperou **${num}** ponto(s). Agora possui **${newAvailable}/${total}** disponíveis.`,
        description: `Recuperar ${num} de ${label}`
      };
    } else if (isSet) {
      const newAvailable = Math.max(0, Math.min(total, num));
      updated.manaSpent[target] = total - newAvailable;
      return {
        success: true,
        category: 'mana',
        updatedData: updated,
        undoData: currentData,
        message: `🔮 **${label}** definida para **${newAvailable}/${total}**.`,
        description: `Definir ${label} em ${newAvailable}`
      };
    }
  }

  // --- 6. PERSONALIDADE (CORAGEM, CONVICÇÃO, SERENIDADE) ---
  // Exemplo: "ei aurora, aumente a coragem um ponto" ou "tire 1 de serenidade"
  if (norm.includes('coragem') || norm.includes('conviccao') || norm.includes('serenidade')) {
    const num = extractNumber(command, 1);
    const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
    
    let key: keyof typeof currentData.personality = 'courage';
    let label = 'Coragem';

    if (norm.includes('conviccao')) {
      key = 'conviction';
      label = 'Convicção';
    } else if (norm.includes('serenidade')) {
      key = 'serenity';
      label = 'Serenidade';
    }

    const currentVal = updated.personality[key];
    let nextVal = currentVal;

    if (isSet) {
      nextVal = Math.max(1, Math.min(5, num));
    } else if (isDecrease) {
      nextVal = Math.max(1, Math.min(5, currentVal - num));
    } else {
      // Default to increase if stated or implied
      nextVal = Math.max(1, Math.min(5, currentVal + num));
    }

    updated.personality[key] = nextVal;
    const diff = nextVal - currentVal;
    const diffText = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '(inalterado)';

    return {
      success: true,
      category: 'personality',
      updatedData: updated,
      undoData: currentData,
      message: `🦁 **Personalidade**: ${label} alterada de **${currentVal}** para **${nextVal}** ${diffText}.`,
      description: `Alterar ${label} para ${nextVal}`
    };
  }

  // --- 7. ATRIBUTOS (FÍSICOS, MENTAIS, SOCIAIS) ---
  const attributeMap: Record<string, { group: 'physical' | 'mental' | 'social'; key: string; label: string }> = {
    'forca': { group: 'physical', key: 'strength', label: 'Força' },
    'destreza': { group: 'physical', key: 'dexterity', label: 'Destreza' },
    'agilidade': { group: 'physical', key: 'agility', label: 'Agilidade' },
    'constituicao': { group: 'physical', key: 'constitution', label: 'Constituição' },
    'inteligencia': { group: 'mental', key: 'intelligence', label: 'Inteligência' },
    'intelecto': { group: 'mental', key: 'intelligence', label: 'Inteligência' },
    'percepcao': { group: 'mental', key: 'perception', label: 'Percepção' },
    'raciocinio': { group: 'mental', key: 'reasoning', label: 'Raciocínio' },
    'sabedoria': { group: 'mental', key: 'wisdom', label: 'Sabedoria' },
    'empatia': { group: 'social', key: 'empathy', label: 'Empatia' },
    'manipulacao': { group: 'social', key: 'manipulation', label: 'Manipulação' },
    'expressao': { group: 'social', key: 'expression', label: 'Expressão' },
    'resiliencia': { group: 'social', key: 'resilience', label: 'Resiliência' },
  };

  for (const [attrName, info] of Object.entries(attributeMap)) {
    if (norm.includes(attrName)) {
      const num = extractNumber(command, 1);
      const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
      const groupObj = updated.attributes[info.group] as Record<string, number>;
      const currentVal = groupObj[info.key] || 0;
      let nextVal = currentVal;

      if (isSet) {
        nextVal = Math.max(0, num);
      } else if (isDecrease) {
        nextVal = Math.max(0, currentVal - num);
      } else {
        nextVal = Math.max(0, currentVal + num);
      }

      groupObj[info.key] = nextVal;
      const diff = nextVal - currentVal;
      const diffText = diff > 0 ? `(+${diff})` : `(${diff})`;

      return {
        success: true,
        category: 'attribute',
        updatedData: updated,
        undoData: currentData,
        message: `🛡️ **Atributo**: ${info.label} alterado de **${currentVal}** para **${nextVal}** ${diffText}.`,
        description: `Alterar ${info.label} para ${nextVal}`
      };
    }
  }

  // --- 8. PERÍCIAS (SKILLS) ---
  const skillMap: Record<string, { group: 'physical' | 'mental' | 'social'; key: string; label: string }> = {
    'armas brancas': { group: 'physical', key: 'melee', label: 'Armas Brancas' },
    'armas de fogo': { group: 'physical', key: 'firearms', label: 'Armas de Fogo' },
    'arquearia': { group: 'physical', key: 'archery', label: 'Arquearia' },
    'arremesso': { group: 'physical', key: 'throwing', label: 'Arremesso' },
    'briga': { group: 'physical', key: 'brawl', label: 'Briga' },
    'combate': { group: 'physical', key: 'combat', label: 'Combate' },
    'furtividade': { group: 'physical', key: 'stealth', label: 'Furtividade' },
    'prontidao': { group: 'physical', key: 'alertness', label: 'Prontidão' },
    'academicos': { group: 'mental', key: 'academics', label: 'Acadêmicos' },
    'armadilhas': { group: 'mental', key: 'traps', label: 'Armadilhas' },
    'intuicao': { group: 'mental', key: 'intuition', label: 'Intuição' },
    'investigacao': { group: 'mental', key: 'investigation', label: 'Investigação' },
    'medicina': { group: 'mental', key: 'medicine', label: 'Medicina' },
    'ocultismo': { group: 'mental', key: 'ocultism', label: 'Ocultismo' },
    'seguranca': { group: 'mental', key: 'security', label: 'Segurança' },
    'sobrevivencia': { group: 'mental', key: 'survival', label: 'Sobrevivência' },
    'barganha': { group: 'social', key: 'bargain', label: 'Barganha' },
    'adestramento': { group: 'social', key: 'taming', label: 'Adestramento' },
    'etiqueta': { group: 'social', key: 'etiquette', label: 'Etiqueta' },
    'intimidacao': { group: 'social', key: 'intimidation', label: 'Intimidação' },
    'labia': { group: 'social', key: 'smoothTalk', label: 'Lábia' },
    'lideranca': { group: 'social', key: 'leadership', label: 'Liderança' },
    'cavalgar': { group: 'social', key: 'riding', label: 'Cavalgar' },
    'seducao': { group: 'social', key: 'seduction', label: 'Sedução' },
  };

  for (const [skillName, info] of Object.entries(skillMap)) {
    if (norm.includes(skillName)) {
      const num = extractNumber(command, 1);
      const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
      const groupObj = updated.skills[info.group] as Record<string, number>;
      const currentVal = groupObj[info.key] || 0;
      let nextVal = currentVal;

      if (isSet) {
        nextVal = Math.max(0, Math.min(5, num));
      } else if (isDecrease) {
        nextVal = Math.max(0, Math.min(5, currentVal - num));
      } else {
        nextVal = Math.max(0, Math.min(5, currentVal + num));
      }

      groupObj[info.key] = nextVal;
      const diff = nextVal - currentVal;
      const diffText = diff > 0 ? `(+${diff})` : `(${diff})`;

      return {
        success: true,
        category: 'skill',
        updatedData: updated,
        undoData: currentData,
        message: `🎯 **Perícia**: ${info.label} alterada de **${currentVal}** para **${nextVal}** ${diffText}.`,
        description: `Alterar ${info.label} para ${nextVal}`
      };
    }
  }

  // --- 9. DINHEIRO & MOEDAS (CURRENCY) ---
  // Exemplo: "adicione 50 peças de ouro", "tire 10 moedas de prata", "gastei 5 de ouro"
  const isGold = norm.includes('ouro') || norm.includes('po ') || norm.includes('po');
  const isSilver = norm.includes('prata') || norm.includes('pp ') || norm.includes('pp');
  const isCopper = norm.includes('cobre') || norm.includes('pc ') || norm.includes('pc');

  // Strict check: if user mentions an invalid currency (like platina, diamante, rubi, etc.)
  if (norm.includes('platina') || norm.includes('diamante') || norm.includes('rubi') || norm.includes('esmeralda') || norm.includes('dolar') || norm.includes('real')) {
    return {
      success: false,
      category: 'currency',
      message: `❌ **Moeda Inválida**: O sistema Arcana aceita apenas **Ouro (PO)**, **Prata (PP)** e **Cobre (PC)**. Moedas como platina ou gemas brutas não são moedas correntes suportadas.`
    };
  }

  if (isGold || isSilver || isCopper) {
    const num = extractNumber(command, 1);
    const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
    let coin: 'gold' | 'silver' | 'copper' = 'gold';
    let coinLabel = 'Moedas de Ouro (PO)';

    if (isSilver) {
      coin = 'silver';
      coinLabel = 'Moedas de Prata (PP)';
    } else if (isCopper) {
      coin = 'copper';
      coinLabel = 'Moedas de Cobre (PC)';
    }

    const currentVal = updated.inventory.currency[coin] || 0;
    let nextVal = currentVal;

    if (isSet) {
      nextVal = Math.max(0, num);
    } else if (isDecrease) {
      nextVal = Math.max(0, currentVal - num);
    } else {
      nextVal = currentVal + num;
    }

    updated.inventory.currency[coin] = nextVal;
    const diff = nextVal - currentVal;
    const diffText = diff > 0 ? `(+${diff})` : `(${diff})`;

    return {
      success: true,
      category: 'currency',
      updatedData: updated,
      undoData: currentData,
      message: `💰 **Finanças**: ${coinLabel} atualizado de **${currentVal}** para **${nextVal}** ${diffText}.`,
      description: `Alterar ${coinLabel} para ${nextVal}`
    };
  }

  // --- 10. SAÚDE & FERIMENTOS (HEALTH) ---
  // Exemplo: "cure todos os ferimentos", "cure a cabeça", "dano no torso"
  if (norm.includes('cura') || norm.includes('cure') || norm.includes('ferimento') || norm.includes('ferimentos') || norm.includes('vida')) {
    const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
    
    // Curar tudo
    if (norm.includes('tudo') || norm.includes('todos') || norm.includes('toda a vida') || norm.includes('total')) {
      const parts: (keyof typeof updated.health)[] = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
      for (const p of parts) {
        updated.health[p] = updated.health[p].map(() => 'none');
      }
      return {
        success: true,
        category: 'health',
        updatedData: updated,
        undoData: currentData,
        message: `❤️ **Cura Completa**: Todos os ferimentos do corpo foram curados e limpos!`,
        description: 'Curar todos os ferimentos'
      };
    }

    // Curar parte específica
    const partMap: Record<string, keyof typeof updated.health> = {
      'cabeca': 'head',
      'torso': 'torso',
      'peitoral': 'torso',
      'braco esquerdo': 'leftArm',
      'braco direito': 'rightArm',
      'perna esquerda': 'leftLeg',
      'perna direita': 'rightLeg',
    };

    for (const [pName, pKey] of Object.entries(partMap)) {
      if (norm.includes(pName)) {
        updated.health[pKey] = updated.health[pKey].map(() => 'none');
        return {
          success: true,
          category: 'health',
          updatedData: updated,
          undoData: currentData,
          message: `❤️ **Cura**: Todos os ferimentos na região **${pName}** foram curados!`,
          description: `Curar ${pName}`
        };
      }
    }
  }

  // --- 11. SPIRITUS (FLUXO & PATRONO) ---
  if (norm.includes('fluxo') || norm.includes('patrono')) {
    const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
    if (!updated.spiritus) {
      updated.spiritus = {
        fluxo: 1,
        patrono: 1,
        rachadura: Array(10).fill(false)
      };
    }
    const isPatrono = norm.includes('patrono');
    const label = isPatrono ? 'Patrono' : 'Fluxo';
    const num = extractNumber(command, 1);
    const currentVal = isPatrono ? updated.spiritus.patrono : updated.spiritus.fluxo;
    const nextVal = isDecrease ? Math.max(0, currentVal - num) : currentVal + num;

    if (isPatrono) {
      updated.spiritus.patrono = nextVal;
    } else {
      updated.spiritus.fluxo = nextVal;
    }

    return {
      success: true,
      category: 'flow',
      updatedData: updated,
      undoData: currentData,
      message: `🔮 **${label}** ajustado de **${currentVal}** para **${nextVal}**.`,
      description: `Alterar ${label}`
    };
  }

  // --- 12. IDIOMAS (LANGUAGES) ---
  if (norm.includes('idioma') || norm.includes('lingua')) {
    const updated = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
    if (!updated.identity.languages) updated.identity.languages = [];

    const words = command.split(/\s+/);
    const cleanedWords = words.filter(w => {
      const nw = normalizeText(w);
      return nw !== 'idioma' && nw !== 'idiomas' && nw !== 'lingua' && nw !== 'linguas' &&
             nw !== 'adicione' && nw !== 'adiciona' && nw !== 'coloque' && nw !== 'aprendi' &&
             nw !== 'remova' && nw !== 'tire' && nw !== 'o' && nw !== 'a' && nw !== 'um' && nw !== 'novo' && nw !== 'de';
    });
    const langTarget = cleanedWords.join(' ').trim();

    if (langTarget) {
      if (isDecrease || norm.includes('remova') || norm.includes('tire')) {
        updated.identity.languages = updated.identity.languages.filter(l => normalizeText(l) !== normalizeText(langTarget));
        return {
          success: true,
          category: 'identity',
          updatedData: updated,
          undoData: currentData,
          message: `🗣️ **Idioma Removido**: "${langTarget}" foi removido da ficha.`,
          description: `Remover idioma ${langTarget}`
        };
      } else {
        const alreadyHas = updated.identity.languages.some(l => normalizeText(l) === normalizeText(langTarget));
        if (!alreadyHas) {
          updated.identity.languages.push(langTarget.charAt(0).toUpperCase() + langTarget.slice(1));
        }
        return {
          success: true,
          category: 'identity',
          updatedData: updated,
          undoData: currentData,
          message: `🗣️ **Novo Idioma**: O personagem agora fala **${langTarget}**! (Idiomas: ${updated.identity.languages.join(', ')})`,
          description: `Aprender idioma ${langTarget}`
        };
      }
    }
  }

  // --- 13. FALLBACK INTELIGENTE COM SUGESTÃO ---
  return {
    success: false,
    category: 'unknown',
    message: `🤔 Não compreendi com exatidão o comando: *"${rawInput}"*.\n\n**Tente frases como:**\n• "aumente a coragem um ponto"\n• "tire 6 pontos de mana física"\n• "recupere toda a mana"\n• "adicione 20 moedas de ouro"\n• "role 1d20"\n• Digite **ajuda** para ver todos os comandos.`
  };
}
