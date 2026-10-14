import { CharacterData, EquipmentSlot, DamageType, Ability, Trait } from '../types';

export type ValidCoin = 'gold' | 'silver' | 'copper';
export const VALID_COINS: readonly ValidCoin[] = ['gold', 'silver', 'copper'];

/**
 * Safely parse JSON with try/catch and fallback
 */
export function safeJsonParse<T>(jsonStr: any, fallback: T): T {
  if (jsonStr === undefined || jsonStr === null) return fallback;
  if (typeof jsonStr !== 'string') {
    try {
      return jsonStr as T;
    } catch {
      return fallback;
    }
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.warn('[SafeJsonParse] Error parsing JSON string:', err);
    return fallback;
  }
}

/**
 * Validates and normalizes coin types for Arcana economy
 */
export function normalizeCoinType(raw: any): ValidCoin | null {
  if (!raw || typeof raw !== 'string') return null;
  const n = raw.toLowerCase().trim();
  if (n === 'gold' || n === 'ouro' || n === 'po' || n === 'moedas de ouro' || n === 'peças de ouro' || n === 'pecas de ouro') {
    return 'gold';
  }
  if (n === 'silver' || n === 'prata' || n === 'pp' || n === 'moedas de prata' || n === 'peças de prata' || n === 'pecas de prata') {
    return 'silver';
  }
  if (n === 'copper' || n === 'cobre' || n === 'pc' || n === 'moedas de cobre' || n === 'peças de cobre' || n === 'pecas de cobre') {
    return 'copper';
  }
  return null;
}

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  category?: string;
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

/**
 * Generates an exhaustive, high-fidelity context prompt with ALL fields of the character sheet
 */
export function buildCharacterContext(data: CharacterData): string {
  try {
    const ident = data.identity || ({} as any);
    const physAttrs = data.attributes?.physical || ({} as any);
    const mentAttrs = data.attributes?.mental || ({} as any);
    const socAttrs = data.attributes?.social || ({} as any);

    const physManaTotal = Object.values(physAttrs).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
    const mentManaTotal = Object.values(mentAttrs).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
    const socManaTotal = Object.values(socAttrs).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) as number;

    const physManaAvail = Math.max(0, physManaTotal - (data.manaSpent?.physical || 0));
    const mentManaAvail = Math.max(0, mentManaTotal - (data.manaSpent?.mental || 0));
    const socManaAvail = Math.max(0, socManaTotal - (data.manaSpent?.social || 0));

    // Languages list
    const languagesList = Array.isArray(ident.languages) && ident.languages.length > 0 
      ? ident.languages.join(', ') 
      : 'Nenhum idioma registrado (adicione via manage_language)';

    // Injuries list
    const injuries: string[] = [];
    if (data.health) {
      Object.entries(data.health).forEach(([part, slots]) => {
        if (Array.isArray(slots)) {
          const damages = slots.filter((s: string) => s !== 'none');
          if (damages.length > 0) {
            injuries.push(`${part}: ${damages.length}/${slots.length} (${damages.join(', ')})`);
          }
        }
      });
    }

    // Weapons list
    const weaponsList = (data.inventory?.weapons || []).map(w => 
      `${w.name}${w.equipped ? ' [EQUIPADA]' : ''} (Perf: ${w.thrust?.damage || '-'}, Corte: ${w.swing?.damage || '-'})`
    ).join('; ') || 'Nenhuma arma';

    // Armors list
    const armorsList = (data.inventory?.armors || []).map(a => 
      `${a.name}${a.equipped ? ' [EQUIPADA]' : ''} (Res: ${a.resistance || 0}, Cob: ${a.coverage || 0}%, Dur: ${a.durabilityCurrent}/${a.durabilityMax})`
    ).join('; ') || 'Nenhuma armadura';

    // General Items list
    const itemsList = (data.inventory?.generalItems || []).map(i => 
      `${i.name} (x${i.quantity || 1})`
    ).join(', ') || 'Nenhum item geral';

    // Projectiles
    const projList = (data.inventory?.projectiles || []).map(p => 
      `${p.name} (x${p.quantity || 1}, Dano: ${p.damage || '-'})`
    ).join(', ') || 'Nenhum projétil';

    // Accessories
    const accList = (data.inventory?.accessories || []).map(acc => 
      `${acc.name}${acc.equipped ? ' [EQUIPADO]' : ''}`
    ).join(', ') || 'Nenhum acessório';

    // Traits (Vantagens e Desvantagens)
    const traitsList = (data.traits || []).map(t => 
      `${t.name} [${t.type === 'advantage' ? 'Vantagem' : 'Desvantagem'}, ${t.value} pts]: ${t.description || ''}`
    ).join(' | ') || 'Nenhuma vantagem/desvantagem';

    // Abilities (Habilidades)
    const abilitiesList = (data.abilities || []).map(a => 
      `${a.name} (Custo: ${a.cost || '0'}, Mecânica: ${a.mechanic || '-'})${a.selected ? ' [Ativa]' : ''}: ${a.description || ''}`
    ).join(' | ') || 'Nenhuma habilidade';

    // Custom Skills (Treinamentos, Ciências, Artes)
    const customTreinamentos = (data.customSkills?.treinamentos || []).map(s => `${s.name} (${s.value})`).join(', ') || 'Nenhum';
    const customCiencias = (data.customSkills?.ciencias || []).map(s => `${s.name} (${s.value})`).join(', ') || 'Nenhuma';
    const customArtes = (data.customSkills?.artes || []).map(s => `${s.name} (${s.value})`).join(', ') || 'Nenhuma';

    return `FICHA COMPLETA DO PERSONAGEM (SISTEMA ARCANA):
=== IDENTIDADE ===
• Nome: ${ident.name || 'Sem Nome'}
• Origem: ${ident.origin || 'Não definida'}
• Ideais: ${ident.ideals || 'Não definidos'}
• Idade: ${ident.age || '-'} | Altura: ${ident.height || '-'} | Peso: ${ident.weight || '-'}
• Olhos: ${ident.eyes || '-'} | Cabelos: ${ident.hair || '-'} | Pele: ${ident.skin || '-'}
• IDIOMAS CONHECIDOS: ${languagesList}

=== PERSONALIDADE & ALINHAMENTO ===
• Coragem: ${data.personality?.courage || 1}/5 | Convicção: ${data.personality?.conviction || 1}/5 | Serenidade: ${data.personality?.serenity || 1}/5
• Alinhamento: Altruísmo ${data.alignment?.altruism || 0}% | Lógica ${data.alignment?.logic || 0}% | Integridade ${data.alignment?.integrity || 0}%

=== ATRIBUTOS ===
• Físicos: Força: ${physAttrs.strength || 0}, Destreza: ${physAttrs.dexterity || 0}, Agilidade: ${physAttrs.agility || 0}, Constituição: ${physAttrs.constitution || 0}
• Mentais: Inteligência: ${mentAttrs.intelligence || 0}, Percepção: ${mentAttrs.perception || 0}, Raciocínio: ${mentAttrs.reasoning || 0}, Sabedoria: ${mentAttrs.wisdom || 0}
• Sociais: Empatia: ${socAttrs.empathy || 0}, Manipulação: ${socAttrs.manipulation || 0}, Expressão: ${socAttrs.expression || 0}, Resiliência: ${socAttrs.resilience || 0}

=== PERÍCIAS (0 a 5) ===
• Físicas: Armas Brancas: ${data.skills?.physical?.melee || 0}, Armas de Fogo: ${data.skills?.physical?.firearms || 0}, Arquearia: ${data.skills?.physical?.archery || 0}, Arremesso: ${data.skills?.physical?.throwing || 0}, Briga: ${data.skills?.physical?.brawl || 0}, Combate: ${data.skills?.physical?.combat || 0}, Furtividade: ${data.skills?.physical?.stealth || 0}, Prontidão: ${data.skills?.physical?.alertness || 0}
• Mentais: Acadêmicos: ${data.skills?.mental?.academics || 0}, Armadilhas: ${data.skills?.mental?.traps || 0}, Intuição: ${data.skills?.mental?.intuition || 0}, Investigação: ${data.skills?.mental?.investigation || 0}, Medicina: ${data.skills?.mental?.medicine || 0}, Ocultismo: ${data.skills?.mental?.occultism || 0}, Segurança: ${data.skills?.mental?.security || 0}, Sobrevivência: ${data.skills?.mental?.survival || 0}
• Sociais: Barganha: ${data.skills?.social?.bargain || 0}, Adestramento: ${data.skills?.social?.taming || 0}, Etiqueta: ${data.skills?.social?.etiquette || 0}, Intimidação: ${data.skills?.social?.intimidation || 0}, Lábia: ${data.skills?.social?.smoothTalk || 0}, Liderança: ${data.skills?.social?.leadership || 0}, Cavalgar: ${data.skills?.social?.riding || 0}, Sedução: ${data.skills?.social?.seduction || 0}
• Customizadas: Treinamentos: [${customTreinamentos}] | Ciências: [${customCiencias}] | Artes: [${customArtes}]

=== VANTAGENS & HABILIDADES ===
• Vantagens/Desvantagens: ${traitsList}
• Habilidades Arcanas/Marciais: ${abilitiesList}

=== MANA & NATUREZA ===
• Mana Física (Vigor): ${physManaAvail}/${physManaTotal} disponíveis (${data.manaSpent?.physical || 0} gastos)
• Mana Mental (Foco): ${mentManaAvail}/${mentManaTotal} disponíveis (${data.manaSpent?.mental || 0} gastos)
• Mana Social (Graça): ${socManaAvail}/${socManaTotal} disponíveis (${data.manaSpent?.social || 0} gastos)
• Domínios de Magia: Água: ${data.domains?.water || 0}/5, Ar: ${data.domains?.air || 0}/5, Ânima: ${data.domains?.anima || 0}/5, Fogo: ${data.domains?.fire || 0}/5, Terra: ${data.domains?.earth || 0}/5
• Natureza Gasta: Água: ${data.naturezaSpent?.water || 0}, Ar: ${data.naturezaSpent?.air || 0}, Ânima: ${data.naturezaSpent?.anima || 0}, Fogo: ${data.naturezaSpent?.fire || 0}, Terra: ${data.naturezaSpent?.earth || 0}

=== SAÚDE CORPORAL ===
• Ferimentos Ativos: ${injuries.length > 0 ? injuries.join(' | ') : 'Nenhum (Totalmente Saudável)'}

=== INVENTÁRIO & FINANÇAS ===
• Moedas: ${data.inventory?.currency?.gold || 0} PO (Ouro), ${data.inventory?.currency?.silver || 0} PP (Prata), ${data.inventory?.currency?.copper || 0} PC (Cobre)${data.inventory?.currency?.gems ? ` | Gemas: ${data.inventory.currency.gems}` : ''}
• Armas: ${weaponsList}
• Armaduras: ${armorsList}
• Projéteis: ${projList}
• Acessórios: ${accList}
• Itens Gerais: ${itemsList}

=== FLUXO & PATRONO ===
• Fluxo: Nível ${data.flowAndPatron?.fluxo?.level || 0}, HP ${data.flowAndPatron?.fluxo?.hp || 10}/10${data.flowAndPatron?.fluxo?.name ? ` (${data.flowAndPatron.fluxo.name})` : ''}
• Patrono: Nível ${data.flowAndPatron?.patrono?.level || 0}, HP ${data.flowAndPatron?.patrono?.hp || 10}/10${data.flowAndPatron?.patrono?.name ? ` (${data.flowAndPatron.patrono.name})` : ''}`;
  } catch (err) {
    console.error('Failed to build character context:', err);
    return 'Ficha carregada com sucesso.';
  }
}

/**
 * Universal Tool Declarations (Function declarations for Gemini and OpenAI/Groq)
 * COBRE TODOS OS CAMPOS DA FICHA DE PERSONAGEM
 */
export const AURORA_TOOL_DEFINITIONS = [
  // 0. CONSULTAR DADOS DA FICHA (QUERY / READ ALL FIELDS)
  {
    name: 'query_character_sheet',
    description: 'Consulta e lê dados atuais da ficha do personagem por seção ou completa (ex: "languages" para ver idiomas conhecidos, "identity" para dados cadastrais, "currency" para moedas, "attributes", "skills", "inventory", "health", "mana", "natureza", "traits", "abilities", "flowAndPatron", "all"). Use quando o jogador perguntar informações sobre o que tem na ficha.',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: [
            'languages',
            'identity',
            'currency',
            'mana',
            'natureza',
            'attributes',
            'skills',
            'customSkills',
            'traits',
            'abilities',
            'personality',
            'alignment',
            'domains',
            'health',
            'inventory',
            'flowAndPatron',
            'all'
          ],
          description: 'Seção da ficha a ser consultada.'
        }
      },
      required: ['section']
    }
  },

  // 1. IDIOMAS (CRÍTICO)
  {
    name: 'manage_language',
    description: 'Adiciona, remove ou substitui idiomas conhecidos pelo personagem (ex: Comum, Élfico, Anão, Dracônico, Infernal, etc).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'remove', 'set_list'],
          description: '"add" para aprender um novo idioma, "remove" para remover, "set_list" para definir a lista completa.'
        },
        language: {
          type: 'string',
          description: 'Nome do idioma a adicionar ou remover (ex: "Élfico", "Dracônico", "Comum").'
        },
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de idiomas quando action for "set_list".'
        }
      },
      required: ['action']
    }
  },

  // 2. IDENTIDADE
  {
    name: 'manage_identity',
    description: 'Atualiza informações cadastrais do personagem: nome, idade, altura, peso, cabelos, olhos, pele, ideais, origem, avatarUrl.',
    parameters: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['name', 'age', 'height', 'weight', 'hair', 'eyes', 'skin', 'ideals', 'origin', 'avatarUrl'],
          description: 'Campo da identidade a alterar.'
        },
        value: {
          type: 'string',
          description: 'Novo valor textual.'
        }
      },
      required: ['field', 'value']
    }
  },

  // 3. MOEDAS (CURRENCY)
  {
    name: 'manage_currency',
    description: 'Adiciona, gasta ou define moedas (ouro, prata, cobre) ou gemas. OBRIGATÓRIO validar moeda: apenas gold, silver e copper são aceitos.',
    parameters: {
      type: 'object',
      properties: {
        coin: {
          type: 'string',
          enum: ['gold', 'silver', 'copper'],
          description: 'Tipo de moeda: "gold" (Ouro/PO), "silver" (Prata/PP) ou "copper" (Cobre/PC).'
        },
        action: {
          type: 'string',
          enum: ['add', 'spend', 'set'],
          description: '"add" para ganhar moedas, "spend" para gastar moedas, ou "set" para definir o total.'
        },
        amount: {
          type: 'number',
          description: 'Quantidade de moedas (número inteiro maior ou igual a 0).'
        },
        reason: {
          type: 'string',
          description: 'Motivo da transação para o histórico.'
        },
        gems: {
          type: 'string',
          description: 'Texto descritivo de gemas ou pedras preciosas guardadas.'
        }
      },
      required: ['action']
    }
  },

  // 4. MANA
  {
    name: 'manage_mana',
    description: 'Controla as reservas de mana (física/vigor, mental/foco, social/graça) gastando, recuperando ou restaurando tudo.',
    parameters: {
      type: 'object',
      properties: {
        pool: {
          type: 'string',
          enum: ['physical', 'mental', 'social', 'all'],
          description: 'Reserva de mana: "physical" (vigor), "mental" (foco), "social" (graça) ou "all" (todas).'
        },
        action: {
          type: 'string',
          enum: ['spend', 'recover', 'restore_all', 'set_available'],
          description: '"spend" para gastar mana, "recover" para recuperar mana gasta, "restore_all" para restaurar totalmente, "set_available" para fixar valor.'
        },
        amount: {
          type: 'number',
          description: 'Quantidade de pontos.'
        }
      },
      required: ['pool', 'action']
    }
  },

  // 5. NATUREZA ELEMENTAL
  {
    name: 'manage_natureza',
    description: 'Controla os pontos de Natureza Elemental gastos ou recuperados nos 5 domínios (água, ar, ânima, fogo, terra).',
    parameters: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: ['water', 'air', 'anima', 'fire', 'earth', 'all'],
          description: 'Elemento da natureza.'
        },
        action: {
          type: 'string',
          enum: ['spend', 'recover', 'restore_all'],
          description: '"spend" para gastar, "recover" para recuperar, "restore_all" para zerar gastos.'
        },
        amount: {
          type: 'number',
          description: 'Quantidade de pontos.'
        }
      },
      required: ['domain', 'action']
    }
  },

  // 6. ATRIBUTOS
  {
    name: 'modify_attribute',
    description: 'Altera um atributo físico, mental ou social do personagem.',
    parameters: {
      type: 'object',
      properties: {
        group: {
          type: 'string',
          enum: ['physical', 'mental', 'social'],
          description: 'Grupo do atributo.'
        },
        name: {
          type: 'string',
          description: 'Nome do atributo (forca/strength, destreza/dexterity, agilidade/agility, constituicao/constitution, inteligencia/intelligence, percepcao/perception, raciocinio/reasoning, sabedoria/wisdom, empatia/empathy, manipulacao/manipulation, expressao/expression, resiliencia/resilience).'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase", "decrease" ou "set".'
        },
        value: {
          type: 'number',
          description: 'Valor.'
        }
      },
      required: ['group', 'name', 'action', 'value']
    }
  },

  // 7. PERÍCIAS
  {
    name: 'modify_skill',
    description: 'Altera uma das 24 perícias padrão (nível de 0 a 5 pontos).',
    parameters: {
      type: 'object',
      properties: {
        group: {
          type: 'string',
          enum: ['physical', 'mental', 'social'],
          description: 'Grupo da perícia.'
        },
        name: {
          type: 'string',
          description: 'Nome da perícia (armas brancas, armas de fogo, arquearia, arremesso, briga, combate, furtividade, prontidao, academicos, armadilhas, intuicao, investigacao, medicina, ocultismo, seguranca, sobrevivencia, barganha, adestramento, etiqueta, intimidacao, labia, lideranca, cavalgar, seducao).'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase", "decrease" ou "set".'
        },
        value: {
          type: 'number',
          description: 'Pontos (0 a 5).'
        }
      },
      required: ['group', 'name', 'action', 'value']
    }
  },

  // 8. PERÍCIAS CUSTOMIZADAS
  {
    name: 'manage_custom_skill',
    description: 'Adiciona, atualiza ou remove perícias customizadas nas abas Treinamentos, Ciências ou Artes.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['treinamentos', 'ciencias', 'artes'],
          description: 'Categoria da perícia.'
        },
        action: {
          type: 'string',
          enum: ['add', 'update', 'remove'],
          description: '"add", "update" ou "remove".'
        },
        name: {
          type: 'string',
          description: 'Nome da perícia.'
        },
        value: {
          type: 'number',
          description: 'Pontuação de 0 a 5.'
        }
      },
      required: ['category', 'action', 'name']
    }
  },

  // 9. VANTAGENS & DESVANTAGENS (TRAITS)
  {
    name: 'manage_trait',
    description: 'Adiciona ou remove Vantagens ou Desvantagens na ficha.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'remove'],
          description: '"add" para criar vantagem/desvantagem, "remove" para excluir.'
        },
        name: {
          type: 'string',
          description: 'Nome do traço (ex: "Sentidos Aguçados", "Inimigo Jurado").'
        },
        trait_type: {
          type: 'string',
          enum: ['advantage', 'disadvantage'],
          description: '"advantage" (Vantagem) ou "disadvantage" (Desvantagem).'
        },
        value: {
          type: 'number',
          description: 'Custo ou valor em pontos do traço.'
        },
        description: {
          type: 'string',
          description: 'Descrição e efeitos do traço.'
        }
      },
      required: ['action', 'name']
    }
  },

  // 10. HABILIDADES (ABILITIES)
  {
    name: 'manage_ability',
    description: 'Adiciona, remove ou ativa/desativa Habilidades arcanas, de classe ou de combate.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'remove', 'toggle'],
          description: '"add" para criar, "remove" para excluir, "toggle" para alternar status selecionada/ativa.'
        },
        name: {
          type: 'string',
          description: 'Nome da habilidade (ex: "Golpe Arcano", "Escudo Etéreo").'
        },
        description: {
          type: 'string',
          description: 'Descrição narrativa da habilidade.'
        },
        mechanic: {
          type: 'string',
          description: 'Mecânica de jogo ou regra aplicada.'
        },
        cost: {
          type: 'string',
          description: 'Custo de mana ou recursos (ex: "2 Mana Mental", "1 Vigor").'
        }
      },
      required: ['action', 'name']
    }
  },

  // 11. PERSONALIDADE
  {
    name: 'modify_personality',
    description: 'Altera os valores da tríade de Personalidade: Coragem, Convicção ou Serenidade (escala 1 a 5).',
    parameters: {
      type: 'object',
      properties: {
        trait: {
          type: 'string',
          enum: ['courage', 'conviction', 'serenity'],
          description: '"courage" (Coragem), "conviction" (Convicção) ou "serenity" (Serenidade).'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase", "decrease" ou "set".'
        },
        value: {
          type: 'number',
          description: 'Valor.'
        }
      },
      required: ['trait', 'action', 'value']
    }
  },

  // 12. ALINHAMENTO
  {
    name: 'modify_alignment',
    description: 'Ajusta as barras de Alinhamento: altruísmo vs individualismo, lógica vs emoção, integridade vs corrupção (0 a 100%).',
    parameters: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['altruism', 'logic', 'integrity'],
          description: '"altruism", "logic" ou "integrity".'
        },
        value: {
          type: 'number',
          description: 'Porcentagem de 0 a 100.'
        }
      },
      required: ['field', 'value']
    }
  },

  // 13. DOMÍNIOS DE MAGIA
  {
    name: 'modify_domain',
    description: 'Altera o nível de um Domínio Elemental de Magia (Água, Ar, Ânima, Fogo, Terra, escala de 0 a 5).',
    parameters: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: ['water', 'air', 'anima', 'fire', 'earth'],
          description: 'Elemento do Domínio.'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase", "decrease" ou "set".'
        },
        value: {
          type: 'number',
          description: 'Nível de 0 a 5.'
        }
      },
      required: ['domain', 'action', 'value']
    }
  },

  // 14. SAÚDE & FERIMENTOS
  {
    name: 'manage_health',
    description: 'Aplica ferimentos ou cura partes do corpo (cabeça, torso, braço esquerdo, braço direito, perna esquerda, perna direita).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['heal_all', 'heal_part', 'apply_damage'],
          description: '"heal_all" para curar tudo, "heal_part" para curar parte específica, "apply_damage" para aplicar ferimento.'
        },
        body_part: {
          type: 'string',
          enum: ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'],
          description: 'Parte do corpo.'
        },
        damage_type: {
          type: 'string',
          enum: ['none', 'simple', 'lethal', 'aggravated'],
          description: 'Tipo de ferimento: "simple" (simples), "lethal" (letal), "aggravated" (agravado) ou "none".'
        },
        slots_count: {
          type: 'number',
          description: 'Quantidade de caixas afetadas.'
        }
      },
      required: ['action']
    }
  },

  // 15. INVENTÁRIO (ARMAS, ARMADURAS, ITENS)
  {
    name: 'manage_inventory_item',
    description: 'Adiciona, remove, equipa/desequipa ou ajusta a quantidade de armas, armaduras, projéteis, acessórios ou itens gerais.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'remove', 'equip', 'unequip', 'update_quantity'],
          description: 'Ação a executar.'
        },
        category: {
          type: 'string',
          enum: ['weapon', 'armor', 'projectile', 'accessory', 'general'],
          description: 'Categoria do item.'
        },
        name: {
          type: 'string',
          description: 'Nome do item.'
        },
        quantity: {
          type: 'number',
          description: 'Quantidade do item.'
        },
        description: {
          type: 'string',
          description: 'Descrição do item.'
        },
        slot: {
          type: 'string',
          description: 'Slot de equipamento (main_hand, off_hand, head, chest, wrist, hands, waist, legs, feet, neck, back, finger, trinket).'
        },
        damage: {
          type: 'string',
          description: 'Fórmula de dano para armas ou projéteis (ex: "1d8", "2d6").'
        },
        resistance: {
          type: 'number',
          description: 'Resistência de armadura.'
        }
      },
      required: ['action', 'name']
    }
  },

  // 16. FLUXO & PATRONO
  {
    name: 'manage_flow_patron',
    description: 'Ajusta nível, pontos de vida (HP 0-10), nome ou notas do Fluxo e do Patrono.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['fluxo', 'patrono'],
          description: '"fluxo" ou "patrono".'
        },
        action: {
          type: 'string',
          enum: ['set_hp', 'adjust_hp', 'set_level', 'adjust_level', 'update_info'],
          description: 'Ação a executar.'
        },
        value: {
          type: 'number',
          description: 'Valor numérico ou delta.'
        },
        name: {
          type: 'string',
          description: 'Nome da entidade invocada.'
        },
        notes: {
          type: 'string',
          description: 'Anotações sobre a entidade.'
        }
      },
      required: ['target', 'action']
    }
  },

  // 17. ROLAGEM DE DADOS
  {
    name: 'roll_dice',
    description: 'Rola uma expressão de dados de RPG (ex: "1d20+5", "2d10-2", "3d6+4") e calcula o resultado detalhado com somatório.',
    parameters: {
      type: 'object',
      properties: {
        formula: {
          type: 'string',
          description: 'Fórmula de dados (ex: "1d20+5", "2d10", "4d6+2").'
        },
        reason: {
          type: 'string',
          description: 'Motivo ou teste sendo realizado.'
        }
      },
      required: ['formula']
    }
  }
];

/**
 * Executes a tool called by an LLM with strict validation, error catching, and cloned immutability
 */
export function executeAuroraTool(
  toolName: string,
  rawArgs: any,
  currentData: CharacterData
): ToolExecutionResult {
  const args = typeof rawArgs === 'string' ? safeJsonParse(rawArgs, {}) : (rawArgs || {});
  const undoData = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
  const updatedData = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);

  try {
    switch (toolName) {
      // 0. QUERY / READ CHARACTER SHEET (CRÍTICO PARA LEITURA DE QUALQUER CAMPO)
      case 'query_character_sheet': {
        const { section } = args;
        const ident = updatedData.identity || ({} as any);
        const sec = String(section || 'all').toLowerCase();

        if (sec === 'languages' || sec === 'idiomas') {
          const list = ident.languages && Array.isArray(ident.languages) && ident.languages.length > 0
            ? ident.languages.join(', ')
            : 'Nenhum idioma registrado na ficha';
          return {
            success: true,
            category: 'identity',
            message: `🗣️ **Idiomas Conhecidos**: O personagem fala e compreende: **${list}**.`
          };
        }

        if (sec === 'identity' || sec === 'identidade') {
          return {
            success: true,
            category: 'identity',
            message: `👤 **Identidade**: Nome: **${ident.name || '-'}** | Origem: **${ident.origin || '-'}** | Ideais: **${ident.ideals || '-'}** | Idade: **${ident.age || '-'}** | Altura: **${ident.height || '-'}** | Peso: **${ident.weight || '-'}** | Cabelos: **${ident.hair || '-'}** | Olhos: **${ident.eyes || '-'}** | Pele: **${ident.skin || '-'}** | Idiomas: **${(ident.languages || []).join(', ') || 'Nenhum'}**.`
          };
        }

        if (sec === 'currency' || sec === 'moedas' || sec === 'dinheiro') {
          const cur = updatedData.inventory?.currency || { gold: 0, silver: 0, copper: 0 };
          return {
            success: true,
            category: 'currency',
            message: `💰 **Finanças**: **${cur.gold || 0}** PO (Ouro), **${cur.silver || 0}** PP (Prata), **${cur.copper || 0}** PC (Cobre)${cur.gems ? ` | Gemas: ${cur.gems}` : ''}.`
          };
        }

        if (sec === 'mana') {
          const physAttrs = updatedData.attributes?.physical || ({} as any);
          const mentAttrs = updatedData.attributes?.mental || ({} as any);
          const socAttrs = updatedData.attributes?.social || ({} as any);
          const pTot = Object.values(physAttrs).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
          const mTot = Object.values(mentAttrs).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
          const sTot = Object.values(socAttrs).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
          const pAvail = Math.max(0, pTot - (updatedData.manaSpent?.physical || 0));
          const mAvail = Math.max(0, mTot - (updatedData.manaSpent?.mental || 0));
          const sAvail = Math.max(0, sTot - (updatedData.manaSpent?.social || 0));
          return {
            success: true,
            category: 'mana',
            message: `⚡ **Mana**: Física (Vigor): ${pAvail}/${pTot} | Mental (Foco): ${mAvail}/${mTot} | Social (Graça): ${sAvail}/${sTot}.`
          };
        }

        if (sec === 'attributes' || sec === 'atributos') {
          const p = (updatedData.attributes?.physical || {}) as any;
          const m = (updatedData.attributes?.mental || {}) as any;
          const s = (updatedData.attributes?.social || {}) as any;
          return {
            success: true,
            category: 'attribute',
            message: `🛡️ **Atributos**: Físicos [Força: ${p.strength}, Destreza: ${p.dexterity}, Agilidade: ${p.agility}, Constituição: ${p.constitution}] | Mentais [Inteligência: ${m.intelligence}, Percepção: ${m.perception}, Raciocínio: ${m.reasoning}, Sabedoria: ${m.wisdom}] | Sociais [Empatia: ${s.empathy}, Manipulação: ${s.manipulation}, Expressão: ${s.expression}, Resiliência: ${s.resilience}].`
          };
        }

        if (sec === 'skills' || sec === 'pericias') {
          const p = (updatedData.skills?.physical || {}) as any;
          const m = (updatedData.skills?.mental || {}) as any;
          const s = (updatedData.skills?.social || {}) as any;
          return {
            success: true,
            category: 'skill',
            message: `🎯 **Perícias**: Físicas [Brancas: ${p.melee}, Fogo: ${p.firearms}, Arquearia: ${p.archery}, Arremesso: ${p.throwing}, Briga: ${p.brawl}, Combate: ${p.combat}, Furtividade: ${p.stealth}, Prontidão: ${p.alertness}] | Mentais [Acadêmicos: ${m.academics}, Armadilhas: ${m.traps}, Intuição: ${m.intuition}, Investigação: ${m.investigation}, Medicina: ${m.medicine}, Ocultismo: ${m.occultism}, Segurança: ${m.security}, Sobrevivência: ${m.survival}] | Sociais [Barganha: ${s.bargain}, Adestramento: ${s.taming}, Etiqueta: ${s.etiquette}, Intimidação: ${s.intimidation}, Lábia: ${s.smoothTalk}, Liderança: ${s.leadership}, Cavalgar: ${s.riding}, Sedução: ${s.seduction}].`
          };
        }

        if (sec === 'health' || sec === 'vida' || sec === 'saude') {
          const h = updatedData.health || {};
          const partsInfo = Object.entries(h).map(([part, slots]) => {
            const damaged = (slots as string[]).filter(x => x !== 'none');
            return `${part}: ${damaged.length > 0 ? damaged.join(', ') : 'Saudável'}`;
          }).join(' | ');
          return {
            success: true,
            category: 'health',
            message: `❤️ **Saúde Corporal**: ${partsInfo}.`
          };
        }

        if (sec === 'inventory' || sec === 'inventario') {
          const inv = (updatedData.inventory || {}) as any;
          const w = (inv.weapons || []).map((x: any) => `${x.name}${x.equipped ? ' [equipada]' : ''}`).join(', ') || 'Nenhuma';
          const a = (inv.armors || []).map((x: any) => `${x.name}${x.equipped ? ' [equipada]' : ''}`).join(', ') || 'Nenhuma';
          const g = (inv.generalItems || []).map((x: any) => `${x.name} (x${x.quantity})`).join(', ') || 'Nenhum';
          return {
            success: true,
            category: 'inventory',
            message: `🎒 **Inventário**: Armas: ${w} | Armaduras: ${a} | Itens Gerais: ${g}.`
          };
        }

        if (sec === 'flowandpatron' || sec === 'fluxo' || sec === 'patrono') {
          const fp = updatedData.flowAndPatron;
          return {
            success: true,
            category: 'flow',
            message: `🔮 **Fluxo & Patrono**: Fluxo [Nível: ${fp?.fluxo?.level || 0}, HP: ${fp?.fluxo?.hp || 10}/10, Nome: "${fp?.fluxo?.name || '-'}"], Patrono [Nível: ${fp?.patrono?.level || 0}, HP: ${fp?.patrono?.hp || 10}/10, Nome: "${fp?.patrono?.name || '-'}"]`
          };
        }

        // Caso geral (all)
        return {
          success: true,
          category: 'query',
          message: buildCharacterContext(updatedData)
        };
      }

      // 1. MANAGE LANGUAGE (NOVO & CRÍTICO)
      case 'manage_language': {
        const { action, language, languages } = args;
        if (!updatedData.identity.languages) {
          updatedData.identity.languages = [];
        }

        const langName = String(language || '').trim();

        if (action === 'add') {
          if (!langName) return { success: false, message: 'Nome do idioma não fornecido.' };
          const exists = updatedData.identity.languages.some(l => l.toLowerCase() === langName.toLowerCase());
          if (!exists) {
            updatedData.identity.languages.push(langName);
          }
          return {
            success: true,
            category: 'identity',
            updatedData,
            undoData,
            description: `Aprender idioma ${langName}`,
            message: `🗣️ **Idioma Adicionado**: O personagem agora fala e compreende **${langName}**! (Total: ${updatedData.identity.languages.join(', ')})`
          };
        } else if (action === 'remove') {
          if (!langName) return { success: false, message: 'Nome do idioma não fornecido.' };
          updatedData.identity.languages = updatedData.identity.languages.filter(l => l.toLowerCase() !== langName.toLowerCase());
          return {
            success: true,
            category: 'identity',
            updatedData,
            undoData,
            description: `Remover idioma ${langName}`,
            message: `🗣️ **Idioma Removido**: O idioma **${langName}** foi removido da ficha.`
          };
        } else if (action === 'set_list') {
          const list = Array.isArray(languages) ? languages.map((s: any) => String(s).trim()).filter(Boolean) : [];
          updatedData.identity.languages = list;
          return {
            success: true,
            category: 'identity',
            updatedData,
            undoData,
            description: `Atualizar lista de idiomas`,
            message: `🗣️ **Idiomas Atualizados**: Agora a ficha possui: **${list.join(', ') || 'Nenhum'}**.`
          };
        }

        return { success: false, message: `Ação de idioma desconhecida: "${action}".` };
      }

      // 2. MANAGE IDENTITY
      case 'manage_identity': {
        const { field, value } = args;
        const validFields = ['name', 'age', 'height', 'weight', 'hair', 'eyes', 'skin', 'ideals', 'origin', 'avatarUrl'];

        if (validFields.includes(field)) {
          (updatedData.identity as any)[field] = String(value || '').trim();
          return {
            success: true,
            category: 'identity',
            updatedData,
            undoData,
            description: `Identidade: ${field} atualizado`,
            message: `👤 **Identidade**: Campo **${field}** atualizado para *"${value}"*.`
          };
        }
        return { success: false, message: `Campo de identidade inválido: "${field}".` };
      }

      // 3. MANAGE CURRENCY
      case 'manage_currency': {
        const { coin, action, amount, reason, gems } = args;

        if (gems !== undefined && gems !== null) {
          updatedData.inventory.currency.gems = String(gems);
        }

        if (!coin && gems) {
          return {
            success: true,
            category: 'currency',
            updatedData,
            undoData,
            description: 'Atualizar gemas',
            message: `💎 **Gemas**: Anotação de gemas atualizada para *"${gems}"*.`
          };
        }

        const normalizedCoin = normalizeCoinType(coin);
        if (!normalizedCoin) {
          return {
            success: false,
            message: `❌ Tipo de moeda inválido: "${coin}". O sistema Arcana aceita estritamente: Ouro (gold / PO), Prata (silver / PP) e Cobre (copper / PC).`
          };
        }

        const validAmount = typeof amount === 'number' && !isNaN(amount) ? Math.max(0, Math.floor(amount)) : 0;
        const currentAmount = updatedData.inventory.currency[normalizedCoin] || 0;
        let newAmount = currentAmount;

        const coinLabel = normalizedCoin === 'gold' ? 'Ouro (PO)' : normalizedCoin === 'silver' ? 'Prata (PP)' : 'Cobre (PC)';

        if (action === 'add') {
          newAmount = currentAmount + validAmount;
        } else if (action === 'spend') {
          newAmount = Math.max(0, currentAmount - validAmount);
        } else if (action === 'set') {
          newAmount = validAmount;
        } else {
          return { success: false, message: `❌ Ação monetária desconhecida: "${action}". Use add, spend ou set.` };
        }

        updatedData.inventory.currency[normalizedCoin] = newAmount;

        if (!updatedData.inventory.currency.history) {
          updatedData.inventory.currency.history = [];
        }
        updatedData.inventory.currency.history.unshift({
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: action === 'spend' ? 'expense' : 'income',
          amount: validAmount,
          coin: normalizedCoin,
          reason: reason || (action === 'spend' ? 'Gasto via Aurora' : 'Recebimento via Aurora'),
          timestamp: Date.now()
        });

        const diff = newAmount - currentAmount;
        const diffText = diff > 0 ? `(+${diff})` : `(${diff})`;

        return {
          success: true,
          category: 'currency',
          updatedData,
          undoData,
          description: `Alteração de ${coinLabel}: ${newAmount} ${diffText}`,
          message: `💰 **Finanças**: Moedas de ${coinLabel} atualizadas de **${currentAmount}** para **${newAmount}** ${diffText}.${reason ? ` *(Motivo: ${reason})*` : ''}`
        };
      }

      // 4. MANAGE MANA
      case 'manage_mana': {
        const { pool, action, amount } = args;
        const num = typeof amount === 'number' && !isNaN(amount) ? Math.max(0, Math.floor(amount)) : 1;

        if (action === 'restore_all' || pool === 'all') {
          updatedData.manaSpent = { physical: 0, mental: 0, social: 0 };
          return {
            success: true,
            category: 'mana',
            updatedData,
            undoData,
            description: 'Restaurar toda a mana',
            message: `✨ **Todas as reservas de mana foram totalmente restauradas!** Físico (Vigor), Mental (Foco) e Social (Graça) estão no máximo.`
          };
        }

        const validPool: 'physical' | 'mental' | 'social' =
          pool === 'mental' || pool === 'foco' ? 'mental' : pool === 'social' || pool === 'graca' ? 'social' : 'physical';

        const poolName = validPool === 'physical' ? 'Mana Física (Vigor)' : validPool === 'mental' ? 'Mana Mental (Foco)' : 'Mana Social (Graça)';
        const total = (Object.values(updatedData.attributes[validPool]) as number[]).reduce((a, b) => a + b, 0);
        const currentSpent = updatedData.manaSpent[validPool] || 0;

        if (action === 'spend') {
          const newSpent = Math.min(total, currentSpent + num);
          updatedData.manaSpent[validPool] = newSpent;
          const available = Math.max(0, total - newSpent);
          return {
            success: true,
            category: 'mana',
            updatedData,
            undoData,
            description: `Gastar ${num} de ${poolName}`,
            message: `⚡ **${poolName}**: Consumiu **${num}** ponto(s). Restam **${available}/${total}** disponíveis.`
          };
        } else if (action === 'recover') {
          const newSpent = Math.max(0, currentSpent - num);
          updatedData.manaSpent[validPool] = newSpent;
          const available = Math.max(0, total - newSpent);
          return {
            success: true,
            category: 'mana',
            updatedData,
            undoData,
            description: `Recuperar ${num} de ${poolName}`,
            message: `✨ **${poolName}**: Recuperou **${num}** ponto(s). Agora possui **${available}/${total}** disponíveis.`
          };
        } else if (action === 'set_available') {
          const availableTarget = Math.max(0, Math.min(total, num));
          updatedData.manaSpent[validPool] = total - availableTarget;
          return {
            success: true,
            category: 'mana',
            updatedData,
            undoData,
            description: `Definir ${poolName} em ${availableTarget}`,
            message: `🔮 **${poolName}** definida para **${availableTarget}/${total}** disponíveis.`
          };
        }

        return { success: false, message: `Ação de mana não reconhecida: "${action}".` };
      }

      // 5. MANAGE NATUREZA
      case 'manage_natureza': {
        const { domain, action, amount } = args;
        if (!updatedData.naturezaSpent) {
          updatedData.naturezaSpent = { water: 0, air: 0, anima: 0, fire: 0, earth: 0 };
        }

        if (action === 'restore_all' || domain === 'all') {
          updatedData.naturezaSpent = { water: 0, air: 0, anima: 0, fire: 0, earth: 0 };
          return {
            success: true,
            category: 'mana',
            updatedData,
            undoData,
            description: 'Restaurar toda a Natureza Elemental',
            message: `🌿 **Natureza Elemental**: Todos os pontos gastos de Natureza foram totalmente recuperados!`
          };
        }

        const validDom: keyof typeof updatedData.naturezaSpent =
          domain === 'air' || domain === 'ar' ? 'air' :
          domain === 'anima' ? 'anima' :
          domain === 'fire' || domain === 'fogo' ? 'fire' :
          domain === 'earth' || domain === 'terra' ? 'earth' : 'water';

        const domNames: Record<string, string> = { water: 'Água', air: 'Ar', anima: 'Ânima', fire: 'Fogo', earth: 'Terra' };
        const num = typeof amount === 'number' && !isNaN(amount) ? Math.max(0, Math.floor(amount)) : 1;
        const curSpent = updatedData.naturezaSpent[validDom] || 0;

        if (action === 'spend') {
          updatedData.naturezaSpent[validDom] = curSpent + num;
          return {
            success: true,
            category: 'mana',
            updatedData,
            undoData,
            description: `Gastar ${num} de Natureza de ${domNames[validDom]}`,
            message: `🍃 **Natureza (${domNames[validDom]})**: Gastou **${num}** ponto(s). Total gasto: ${updatedData.naturezaSpent[validDom]}.`
          };
        } else if (action === 'recover') {
          updatedData.naturezaSpent[validDom] = Math.max(0, curSpent - num);
          return {
            success: true,
            category: 'mana',
            updatedData,
            undoData,
            description: `Recuperar ${num} de Natureza de ${domNames[validDom]}`,
            message: `🌿 **Natureza (${domNames[validDom]})**: Recuperou **${num}** ponto(s). Total gasto restante: ${updatedData.naturezaSpent[validDom]}.`
          };
        }

        return { success: false, message: `Ação de natureza não reconhecida: "${action}".` };
      }

      // 6. MODIFY ATTRIBUTE
      case 'modify_attribute': {
        const { group, name, action, value } = args;
        const validGroup: 'physical' | 'mental' | 'social' =
          group === 'mental' ? 'mental' : group === 'social' ? 'social' : 'physical';

        const attrMap: Record<string, string> = {
          forca: 'strength', strength: 'strength',
          destreza: 'dexterity', dexterity: 'dexterity',
          agilidade: 'agility', agility: 'agility',
          constituicao: 'constitution', constitution: 'constitution',
          inteligencia: 'intelligence', intelligence: 'intelligence', intelecto: 'intelligence',
          percepcao: 'perception', perception: 'perception',
          raciocinio: 'reasoning', reasoning: 'reasoning',
          sabedoria: 'wisdom', wisdom: 'wisdom',
          empatia: 'empathy', empathy: 'empathy',
          manipulacao: 'manipulation', manipulation: 'manipulation',
          expressao: 'expression', expression: 'expression',
          resiliencia: 'resilience', resilience: 'resilience'
        };

        const key = attrMap[String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
        if (!key) {
          return { success: false, message: `❌ Atributo "${name}" não foi encontrado no sistema Arcana.` };
        }

        const groupObj = updatedData.attributes[validGroup] as Record<string, number>;
        const currentVal = groupObj[key] || 0;
        const delta = typeof value === 'number' && !isNaN(value) ? Math.floor(value) : 1;
        let nextVal = currentVal;

        if (action === 'set') {
          nextVal = Math.max(0, delta);
        } else if (action === 'decrease') {
          nextVal = Math.max(0, currentVal - delta);
        } else {
          nextVal = Math.max(0, currentVal + delta);
        }

        groupObj[key] = nextVal;
        const diff = nextVal - currentVal;
        const diffText = diff > 0 ? `(+${diff})` : `(${diff})`;

        return {
          success: true,
          category: 'attribute',
          updatedData,
          undoData,
          description: `Atributo ${key} alterado para ${nextVal}`,
          message: `🛡️ **Atributo**: **${name}** alterado de **${currentVal}** para **${nextVal}** ${diffText}.`
        };
      }

      // 7. MODIFY SKILL
      case 'modify_skill': {
        const { group, name, action, value } = args;
        const validGroup: 'physical' | 'mental' | 'social' =
          group === 'mental' ? 'mental' : group === 'social' ? 'social' : 'physical';

        const skillMap: Record<string, string> = {
          'armas brancas': 'melee', melee: 'melee',
          'armas de fogo': 'firearms', firearms: 'firearms',
          arquearia: 'archery', archery: 'archery',
          arremesso: 'throwing', throwing: 'throwing',
          briga: 'brawl', brawl: 'brawl',
          combate: 'combat', combat: 'combat',
          furtividade: 'stealth', stealth: 'stealth',
          prontidao: 'alertness', alertness: 'alertness',
          academicos: 'academics', academics: 'academics',
          armadilhas: 'traps', traps: 'traps',
          intuicao: 'intuition', intuition: 'intuition',
          investigacao: 'investigation', investigation: 'investigation',
          medicina: 'medicine', medicine: 'medicine',
          ocultismo: 'occultism', occultism: 'occultism',
          seguranca: 'security', security: 'security',
          sobrevivencia: 'survival', survival: 'survival',
          barganha: 'bargain', bargain: 'bargain',
          adestramento: 'taming', taming: 'taming',
          etiqueta: 'etiquette', etiquette: 'etiquette',
          intimidacao: 'intimidation', intimidation: 'intimidation',
          labia: 'smoothTalk', smoothtalk: 'smoothTalk',
          lideranca: 'leadership', leadership: 'leadership',
          cavalgar: 'riding', riding: 'riding',
          seducao: 'seduction', seduction: 'seduction'
        };

        const cleanKey = String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const key = skillMap[cleanKey];
        if (!key) {
          return { success: false, message: `❌ Perícia "${name}" não foi encontrada no sistema.` };
        }

        const groupObj = updatedData.skills[validGroup] as Record<string, number>;
        const currentVal = groupObj[key] || 0;
        const delta = typeof value === 'number' && !isNaN(value) ? Math.floor(value) : 1;
        let nextVal = currentVal;

        if (action === 'set') {
          nextVal = Math.max(0, Math.min(5, delta));
        } else if (action === 'decrease') {
          nextVal = Math.max(0, Math.min(5, currentVal - delta));
        } else {
          nextVal = Math.max(0, Math.min(5, currentVal + delta));
        }

        groupObj[key] = nextVal;
        const diff = nextVal - currentVal;
        const diffText = diff > 0 ? `(+${diff})` : `(${diff})`;

        return {
          success: true,
          category: 'skill',
          updatedData,
          undoData,
          description: `Perícia ${name} alterada para ${nextVal}`,
          message: `🎯 **Perícia**: **${name}** alterada de **${currentVal}** para **${nextVal}** ${diffText}.`
        };
      }

      // 8. MANAGE CUSTOM SKILL
      case 'manage_custom_skill': {
        const { category, action, name, value } = args;
        const validCategory: 'treinamentos' | 'ciencias' | 'artes' =
          category === 'ciencias' ? 'ciencias' : category === 'artes' ? 'artes' : 'treinamentos';

        if (!updatedData.customSkills) {
          updatedData.customSkills = { treinamentos: [], ciencias: [], artes: [] };
        }

        const skillName = String(name || '').trim();
        const skillVal = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(5, Math.floor(value))) : 0;

        if (action === 'add') {
          updatedData.customSkills[validCategory].push({
            id: `cskill-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: skillName,
            value: skillVal
          });
          return {
            success: true,
            category: 'skill',
            updatedData,
            undoData,
            description: `Adicionar perícia ${skillName}`,
            message: `✨ **Perícia Customizada Adicionada**: "${skillName}" (${skillVal} pontos) em ${validCategory}.`
          };
        } else if (action === 'remove') {
          updatedData.customSkills[validCategory] = updatedData.customSkills[validCategory].filter(
            s => s.name.toLowerCase() !== skillName.toLowerCase()
          );
          return {
            success: true,
            category: 'skill',
            updatedData,
            undoData,
            description: `Remover perícia ${skillName}`,
            message: `🗑️ **Perícia Customizada Removida**: "${skillName}" foi removida.`
          };
        } else if (action === 'update') {
          const item = updatedData.customSkills[validCategory].find(s => s.name.toLowerCase() === skillName.toLowerCase());
          if (item) {
            item.value = skillVal;
            return {
              success: true,
              category: 'skill',
              updatedData,
              undoData,
              description: `Perícia ${skillName} em ${skillVal}`,
              message: `🎯 **Perícia Customizada**: "${skillName}" agora possui **${skillVal}** pontos.`
            };
          }
        }

        return { success: false, message: `Perícia customizada "${skillName}" não encontrada.` };
      }

      // 9. MANAGE TRAIT (VANTAGENS & DESVANTAGENS)
      case 'manage_trait': {
        const { action, name, trait_type, value, description } = args;
        if (!updatedData.traits) updatedData.traits = [];

        const traitName = String(name || '').trim();
        if (!traitName) return { success: false, message: 'Nome do traço não fornecido.' };

        if (action === 'add') {
          const newTrait: Trait = {
            id: `trait-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: traitName,
            type: trait_type === 'disadvantage' ? 'disadvantage' : 'advantage',
            value: typeof value === 'number' && !isNaN(value) ? Math.floor(value) : 1,
            description: description || ''
          };
          updatedData.traits.push(newTrait);
          return {
            success: true,
            category: 'trait',
            updatedData,
            undoData,
            description: `Adicionar ${newTrait.type === 'advantage' ? 'Vantagem' : 'Desvantagem'} ${traitName}`,
            message: `✨ **${newTrait.type === 'advantage' ? 'Vantagem' : 'Desvantagem'} Adicionada**: "${traitName}" (${newTrait.value} pts).`
          };
        } else if (action === 'remove') {
          updatedData.traits = updatedData.traits.filter(t => t.name.toLowerCase() !== traitName.toLowerCase());
          return {
            success: true,
            category: 'trait',
            updatedData,
            undoData,
            description: `Remover traço ${traitName}`,
            message: `🗑️ **Traço Removido**: "${traitName}" foi removido da ficha.`
          };
        }

        return { success: false, message: `Ação de traço inválida: "${action}".` };
      }

      // 10. MANAGE ABILITY (HABILIDADES)
      case 'manage_ability': {
        const { action, name, description, mechanic, cost } = args;
        if (!updatedData.abilities) updatedData.abilities = [];

        const abilityName = String(name || '').trim();
        if (!abilityName) return { success: false, message: 'Nome da habilidade não fornecido.' };

        if (action === 'add') {
          const newAbility: Ability = {
            id: `ability-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: abilityName,
            description: description || '',
            mechanic: mechanic || '',
            cost: cost || '0',
            selected: true
          };
          updatedData.abilities.push(newAbility);
          return {
            success: true,
            category: 'ability',
            updatedData,
            undoData,
            description: `Adicionar habilidade ${abilityName}`,
            message: `🔮 **Habilidade Adicionada**: "${abilityName}" (Custo: ${newAbility.cost}).`
          };
        } else if (action === 'remove') {
          updatedData.abilities = updatedData.abilities.filter(a => a.name.toLowerCase() !== abilityName.toLowerCase());
          return {
            success: true,
            category: 'ability',
            updatedData,
            undoData,
            description: `Remover habilidade ${abilityName}`,
            message: `🗑️ **Habilidade Removida**: "${abilityName}" foi removida da ficha.`
          };
        } else if (action === 'toggle') {
          const found = updatedData.abilities.find(a => a.name.toLowerCase() === abilityName.toLowerCase());
          if (found) {
            found.selected = !found.selected;
            return {
              success: true,
              category: 'ability',
              updatedData,
              undoData,
              description: `Alternar habilidade ${abilityName}`,
              message: `⚡ **Habilidade "${abilityName}"**: Agora está ${found.selected ? 'ATIVA' : 'INATIVA'}.`
            };
          }
        }

        return { success: false, message: `Habilidade "${abilityName}" não encontrada.` };
      }

      // 11. MODIFY PERSONALITY
      case 'modify_personality': {
        const { trait, action, value } = args;
        const validTrait: 'courage' | 'conviction' | 'serenity' =
          trait === 'conviction' || trait === 'conviccao' ? 'conviction' :
          trait === 'serenity' || trait === 'serenidade' ? 'serenity' : 'courage';

        const label = validTrait === 'courage' ? 'Coragem' : validTrait === 'conviction' ? 'Convicção' : 'Serenidade';
        const currentVal = updatedData.personality[validTrait] || 1;
        const delta = typeof value === 'number' && !isNaN(value) ? Math.floor(value) : 1;
        let nextVal = currentVal;

        if (action === 'set') {
          nextVal = Math.max(1, Math.min(5, delta));
        } else if (action === 'decrease') {
          nextVal = Math.max(1, Math.min(5, currentVal - delta));
        } else {
          nextVal = Math.max(1, Math.min(5, currentVal + delta));
        }

        updatedData.personality[validTrait] = nextVal;
        const diff = nextVal - currentVal;
        const diffText = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '(inalterado)';

        return {
          success: true,
          category: 'personality',
          updatedData,
          undoData,
          description: `Personalidade: ${label} em ${nextVal}`,
          message: `🦁 **Personalidade**: ${label} alterada de **${currentVal}** para **${nextVal}** ${diffText}.`
        };
      }

      // 12. MODIFY ALIGNMENT
      case 'modify_alignment': {
        const { field, value } = args;
        const validField: 'altruism' | 'logic' | 'integrity' =
          field === 'logic' || field === 'logica' ? 'logic' :
          field === 'integrity' || field === 'integridade' ? 'integrity' : 'altruism';

        const label = validField === 'altruism' ? 'Altruísmo' : validField === 'logic' ? 'Lógica' : 'Integridade';
        const nextVal = Math.max(0, Math.min(100, Math.floor(value || 0)));
        const prevVal = updatedData.alignment[validField] || 0;

        updatedData.alignment[validField] = nextVal;

        return {
          success: true,
          category: 'alignment',
          updatedData,
          undoData,
          description: `Alinhamento: ${label} em ${nextVal}%`,
          message: `⚖️ **Alinhamento**: ${label} ajustado de **${prevVal}%** para **${nextVal}%**.`
        };
      }

      // 13. MODIFY DOMAIN
      case 'modify_domain': {
        const { domain, action, value } = args;
        const validDomain: 'water' | 'air' | 'anima' | 'fire' | 'earth' =
          domain === 'air' || domain === 'ar' ? 'air' :
          domain === 'anima' ? 'anima' :
          domain === 'fire' || domain === 'fogo' ? 'fire' :
          domain === 'earth' || domain === 'terra' ? 'earth' : 'water';

        const domainNames: Record<string, string> = { water: 'Água', air: 'Ar', anima: 'Ânima', fire: 'Fogo', earth: 'Terra' };
        const label = domainNames[validDomain];
        const currentVal = updatedData.domains[validDomain] || 0;
        const delta = typeof value === 'number' && !isNaN(value) ? Math.floor(value) : 1;
        let nextVal = currentVal;

        if (action === 'set') {
          nextVal = Math.max(0, Math.min(5, delta));
        } else if (action === 'decrease') {
          nextVal = Math.max(0, Math.min(5, currentVal - delta));
        } else {
          nextVal = Math.max(0, Math.min(5, currentVal + delta));
        }

        updatedData.domains[validDomain] = nextVal;

        return {
          success: true,
          category: 'domain',
          updatedData,
          undoData,
          description: `Domínio de ${label} em ${nextVal}`,
          message: `🌊 **Domínio de ${label}**: Nível ajustado de **${currentVal}** para **${nextVal}**.`
        };
      }

      // 14. MANAGE HEALTH
      case 'manage_health': {
        const { action, body_part, damage_type, slots_count } = args;

        if (action === 'heal_all') {
          const parts: (keyof typeof updatedData.health)[] = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
          for (const p of parts) {
            updatedData.health[p] = updatedData.health[p].map(() => 'none');
          }
          return {
            success: true,
            category: 'health',
            updatedData,
            undoData,
            description: 'Cura total do corpo',
            message: `❤️ **Cura Completa**: Todos os ferimentos do corpo foram totalmente limpos e curados!`
          };
        }

        const validPart: keyof typeof updatedData.health =
          body_part === 'torso' || body_part === 'peito' ? 'torso' :
          body_part === 'leftArm' || body_part === 'bracoEsquerdo' ? 'leftArm' :
          body_part === 'rightArm' || body_part === 'bracoDireito' ? 'rightArm' :
          body_part === 'leftLeg' || body_part === 'pernaEsquerda' ? 'leftLeg' :
          body_part === 'rightLeg' || body_part === 'pernaDireita' ? 'rightLeg' : 'head';

        const count = typeof slots_count === 'number' && !isNaN(slots_count) ? Math.max(1, Math.floor(slots_count)) : 1;

        if (action === 'heal_part') {
          updatedData.health[validPart] = updatedData.health[validPart].map(() => 'none');
          return {
            success: true,
            category: 'health',
            updatedData,
            undoData,
            description: `Cura da região ${validPart}`,
            message: `❤️ **Cura**: Todos os ferimentos na região **${validPart}** foram curados.`
          };
        } else if (action === 'apply_damage') {
          const dmgType: DamageType =
            damage_type === 'aggravated' || damage_type === 'agravado' ? 'aggravated' :
            damage_type === 'lethal' || damage_type === 'letal' ? 'lethal' : 'simple';

          const partSlots = [...updatedData.health[validPart]];
          let applied = 0;
          for (let i = 0; i < partSlots.length && applied < count; i++) {
            if (partSlots[i] === 'none') {
              partSlots[i] = dmgType;
              applied++;
            }
          }
          updatedData.health[validPart] = partSlots;

          return {
            success: true,
            category: 'health',
            updatedData,
            undoData,
            description: `Dano ${dmgType} em ${validPart}`,
            message: `🩸 **Dano Aplicado**: ${applied} caixa(s) de dano **${dmgType}** sofridas na região **${validPart}**.`
          };
        }

        return { success: false, message: `Ação de vida não suportada: "${action}".` };
      }

      // 15. MANAGE INVENTORY ITEM
      case 'manage_inventory_item': {
        const { action, category, name, quantity, description, slot, damage, resistance } = args;
        const itemName = String(name || '').trim();
        if (!itemName) return { success: false, message: 'Nome do item não fornecido.' };

        if (action === 'add') {
          const newId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          if (category === 'weapon') {
            updatedData.inventory.weapons.push({
              id: newId,
              name: itemName,
              category: 'weapon',
              equipped: false,
              thrust: { damage: damage || '1d6', type: 'per', ap: 0, precision: 0 },
              swing: { damage: damage || '1d8', type: 'cor', ap: 0, precision: 0 },
              size: 'm',
              weight: 1500,
              location: 'Mochila',
              description: description || ''
            });
          } else if (category === 'armor') {
            updatedData.inventory.armors.push({
              id: newId,
              name: itemName,
              category: 'armor',
              equipped: false,
              slashing: 1,
              bludgeoning: 1,
              piercing: 1,
              coverage: 50,
              resistance: resistance || 10,
              durabilityMax: 20,
              durabilityCurrent: 20,
              size: 'm',
              weight: 4000,
              location: 'Mochila',
              description: description || ''
            });
          } else if (category === 'projectile') {
            updatedData.inventory.projectiles.push({
              id: newId,
              name: itemName,
              category: 'projectile',
              equipped: false,
              damage: damage || '1d6',
              type: 'per',
              ap: 0,
              precision: 0,
              quantity: quantity || 20,
              size: 'p',
              weight: 500,
              location: 'Mochila',
              description: description || ''
            });
          } else if (category === 'accessory') {
            updatedData.inventory.accessories.push({
              id: newId,
              name: itemName,
              category: 'accessory',
              equipped: false,
              weight: 100,
              location: 'Mochila',
              description: description || ''
            });
          } else {
            updatedData.inventory.generalItems.push({
              id: newId,
              name: itemName,
              category: 'general',
              itemType: 'misc',
              quantity: quantity || 1,
              weight: 200,
              equipped: false,
              location: 'Mochila',
              description: description || ''
            });
          }

          return {
            success: true,
            category: 'inventory',
            updatedData,
            undoData,
            description: `Adicionar ${itemName}`,
            message: `🎒 **Item Adicionado**: "${itemName}" foi guardado no inventário.`
          };
        } else if (action === 'remove') {
          const normName = itemName.toLowerCase();
          updatedData.inventory.generalItems = updatedData.inventory.generalItems.filter(i => !i.name.toLowerCase().includes(normName));
          updatedData.inventory.weapons = updatedData.inventory.weapons.filter(i => !i.name.toLowerCase().includes(normName));
          updatedData.inventory.armors = updatedData.inventory.armors.filter(i => !i.name.toLowerCase().includes(normName));
          updatedData.inventory.projectiles = updatedData.inventory.projectiles.filter(i => !i.name.toLowerCase().includes(normName));
          updatedData.inventory.accessories = updatedData.inventory.accessories.filter(i => !i.name.toLowerCase().includes(normName));

          return {
            success: true,
            category: 'inventory',
            updatedData,
            undoData,
            description: `Remover ${itemName}`,
            message: `🗑️ **Item Removido**: "${itemName}" foi removido do inventário.`
          };
        } else if (action === 'equip' || action === 'unequip') {
          const isEquip = action === 'equip';
          const normName = itemName.toLowerCase();
          let itemFound = false;

          updatedData.inventory.weapons.forEach(w => {
            if (w.name.toLowerCase().includes(normName)) {
              w.equipped = isEquip;
              itemFound = true;
            }
          });
          updatedData.inventory.armors.forEach(a => {
            if (a.name.toLowerCase().includes(normName)) {
              a.equipped = isEquip;
              itemFound = true;
            }
          });
          updatedData.inventory.accessories.forEach(acc => {
            if (acc.name.toLowerCase().includes(normName)) {
              acc.equipped = isEquip;
              itemFound = true;
            }
          });

          return {
            success: itemFound,
            category: 'inventory',
            updatedData,
            undoData,
            description: `${isEquip ? 'Equipar' : 'Desequipar'} ${itemName}`,
            message: itemFound
              ? `⚔️ **Item ${isEquip ? 'Equipado' : 'Desequipado'}**: "${itemName}" agora está ${isEquip ? 'em uso' : 'guardado'}.`
              : `Item "${itemName}" não encontrado no inventário.`
          };
        } else if (action === 'update_quantity') {
          const normName = itemName.toLowerCase();
          let found = false;
          updatedData.inventory.generalItems.forEach(i => {
            if (i.name.toLowerCase().includes(normName)) {
              i.quantity = Math.max(0, quantity || 0);
              found = true;
            }
          });
          updatedData.inventory.projectiles.forEach(p => {
            if (p.name.toLowerCase().includes(normName)) {
              p.quantity = Math.max(0, quantity || 0);
              found = true;
            }
          });

          return {
            success: found,
            category: 'inventory',
            updatedData,
            undoData,
            description: `Atualizar quantidade de ${itemName}`,
            message: found
              ? `📦 **Quantidade Atualizada**: "${itemName}" agora possui **${quantity}** unidades.`
              : `Item "${itemName}" não encontrado.`
          };
        }

        return { success: false, message: `Ação de inventário não suportada: "${action}".` };
      }

      // 16. MANAGE FLOW & PATRON
      case 'manage_flow_patron': {
        const { target, action, value, name, notes } = args;
        const validTarget: 'fluxo' | 'patrono' = target === 'patrono' ? 'patrono' : 'fluxo';
        const label = validTarget === 'patrono' ? 'Patrono' : 'Fluxo';

        if (!updatedData.flowAndPatron) {
          updatedData.flowAndPatron = {
            fluxo: { level: 0, hp: 10, name: '', notes: '' },
            patrono: { level: 0, hp: 10, name: '', notes: '' }
          };
        }

        const currentEntry = updatedData.flowAndPatron[validTarget];
        const num = typeof value === 'number' && !isNaN(value) ? Math.floor(value) : 1;

        if (action === 'set_hp') {
          currentEntry.hp = Math.max(0, Math.min(10, num));
        } else if (action === 'adjust_hp') {
          currentEntry.hp = Math.max(0, Math.min(10, currentEntry.hp + num));
        } else if (action === 'set_level') {
          currentEntry.level = Math.max(0, num);
        } else if (action === 'adjust_level') {
          currentEntry.level = Math.max(0, currentEntry.level + num);
        }

        if (name) currentEntry.name = name;
        if (notes) currentEntry.notes = notes;

        return {
          success: true,
          category: 'flow',
          updatedData,
          undoData,
          description: `Atualização de ${label}`,
          message: `🔮 **${label}**: Nível ${currentEntry.level}, HP ${currentEntry.hp}/10.${currentEntry.name ? ` (${currentEntry.name})` : ''}`
        };
      }

      // 17. ROLL DICE
      case 'roll_dice': {
        const { formula, reason } = args;
        const normFormula = String(formula || '').toLowerCase().replace(/\s+/g, '');
        const match = normFormula.match(/^(\d*)d(\d+)([+-]\d+)?$/);

        if (!match) {
          return {
            success: false,
            message: `Formato de dado inválido: "${formula}". Use ex: 1d20, 2d10+4, 3d6-1.`
          };
        }

        const count = parseInt(match[1] || '1', 10);
        const sides = parseInt(match[2], 10);
        const mod = match[3] ? parseInt(match[3], 10) : 0;

        if (count < 1 || count > 50 || sides < 2 || sides > 1000) {
          return { success: false, message: 'Quantidade ou lados dos dados fora do limite permitido (1-50 dados, 2-1000 lados).' };
        }

        const rolls: number[] = [];
        let sum = 0;
        for (let i = 0; i < count; i++) {
          const val = Math.floor(Math.random() * sides) + 1;
          rolls.push(val);
          sum += val;
        }

        const total = sum + mod;
        const modStr = mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`) : '';
        const rollList = rolls.length > 1 ? ` [${rolls.join(', ')}]` : ` [${rolls[0]}]`;

        return {
          success: true,
          category: 'dice',
          diceRoll: { formula: `${count}d${sides}${mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : ''}`, rolls, total, modifier: mod },
          message: `🎲 **Rolagem ${formula}**${reason ? ` (${reason})` : ''}: ${rollList}${modStr} = **${total}**!`
        };
      }

      default:
        return { success: false, message: `Ferramenta desconhecida: "${toolName}".` };
    }
  } catch (error: any) {
    console.error('Error executing tool:', toolName, error);
    return {
      success: false,
      message: `Erro ao executar ação da ferramenta ${toolName}: ${error?.message || 'Falha desconhecida.'}`
    };
  }
}
