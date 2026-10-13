import { CharacterData, EquipmentSlot, DamageType } from '../types';

export type ValidCoin = 'gold' | 'silver' | 'copper';
export const VALID_COINS: readonly ValidCoin[] = ['gold', 'silver', 'copper'];

/**
 * Safely parse JSON with try/catch and fallback
 */
export function safeJsonParse<T>(jsonStr: any, fallback: T): T {
  if (jsonStr === undefined || jsonStr === null) return fallback;
  if (typeof jsonStr !== 'string') {
    try {
      // If it's already an object, return it
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
 * Generates a concise context prompt summarizing the character sheet for the LLM
 */
export function buildCharacterContext(data: CharacterData): string {
  try {
    const physAttrs = data.attributes.physical;
    const mentAttrs = data.attributes.mental;
    const socAttrs = data.attributes.social;

    const physManaTotal = Object.values(physAttrs).reduce((a, b) => a + b, 0);
    const mentManaTotal = Object.values(mentAttrs).reduce((a, b) => a + b, 0);
    const socManaTotal = Object.values(socAttrs).reduce((a, b) => a + b, 0);

    const physManaAvail = Math.max(0, physManaTotal - (data.manaSpent.physical || 0));
    const mentManaAvail = Math.max(0, mentManaTotal - (data.manaSpent.mental || 0));
    const socManaAvail = Math.max(0, socManaTotal - (data.manaSpent.social || 0));

    // Calculate current injuries
    const injuries: string[] = [];
    Object.entries(data.health).forEach(([part, slots]) => {
      const damages = slots.filter((s: string) => s !== 'none');
      if (damages.length > 0) {
        injuries.push(`${part}: ${damages.length}/${slots.length} ferido(s) (${damages.join(', ')})`);
      }
    });

    const equippedWeapons = (data.inventory.weapons || []).filter((w) => w.equipped).map((w) => w.name);
    const equippedArmors = (data.inventory.armors || []).filter((a) => a.equipped).map((a) => a.name);

    return `CONTEXTO ATUAL DA FICHA DO PERSONAGEM:
- Nome: ${data.identity.name || 'Sem Nome'} | Origem: ${data.identity.origin || 'Não definida'}
- Personalidade: Coragem ${data.personality.courage}/5, Convicção ${data.personality.conviction}/5, Serenidade ${data.personality.serenity}/5
- Alinhamento: Altruísmo ${data.alignment.altruism}%, Lógica ${data.alignment.logic}%, Integridade ${data.alignment.integrity}%
- Reservas de Mana:
  * Física (Vigor): ${physManaAvail}/${physManaTotal} disponíveis (${data.manaSpent.physical || 0} gastos)
  * Mental (Foco): ${mentManaAvail}/${mentManaTotal} disponíveis (${data.manaSpent.mental || 0} gastos)
  * Social (Graça): ${socManaAvail}/${socManaTotal} disponíveis (${data.manaSpent.social || 0} gastos)
- Finanças: ${data.inventory.currency.gold} PO (Ouro), ${data.inventory.currency.silver} PP (Prata), ${data.inventory.currency.copper} PC (Cobre)
- Domínios de Magia: Água: ${data.domains.water}, Ar: ${data.domains.air}, Ânima: ${data.domains.anima}, Fogo: ${data.domains.fire}, Terra: ${data.domains.earth}
- Atributos Físicos: Força: ${physAttrs.strength}, Destreza: ${physAttrs.dexterity}, Agilidade: ${physAttrs.agility}, Constituição: ${physAttrs.constitution}
- Atributos Mentais: Inteligência: ${mentAttrs.intelligence}, Percepção: ${mentAttrs.perception}, Raciocínio: ${mentAttrs.reasoning}, Sabedoria: ${mentAttrs.wisdom}
- Atributos Sociais: Empatia: ${socAttrs.empathy}, Manipulação: ${socAttrs.manipulation}, Expressão: ${socAttrs.expression}, Resiliência: ${socAttrs.resilience}
- Fluxo/Patrono: Fluxo Nível ${data.flowAndPatron?.fluxo?.level || 0} (${data.flowAndPatron?.fluxo?.hp || 10}/10 HP) | Patrono Nível ${data.flowAndPatron?.patrono?.level || 0} (${data.flowAndPatron?.patrono?.hp || 10}/10 HP)
- Ferimentos Ativos: ${injuries.length > 0 ? injuries.join(' | ') : 'Nenhum (Completamente Saudável)'}
- Itens Equipados: Armas: [${equippedWeapons.join(', ') || 'Nenhuma'}], Armaduras: [${equippedArmors.join(', ') || 'Nenhuma'}]`;
  } catch (err) {
    console.error('Failed to build character context:', err);
    return 'Ficha carregada.';
  }
}

/**
 * Universal Tool Declarations (Function declarations for Gemini and OpenAI/Groq)
 */
export const AURORA_TOOL_DEFINITIONS = [
  {
    name: 'manage_currency',
    description: 'Adiciona, remove ou altera a quantidade de moedas (ouro, prata, cobre) do inventário da ficha. OBRIGATÓRIO validar o tipo de moeda.',
    parameters: {
      type: 'object',
      properties: {
        coin: {
          type: 'string',
          enum: ['gold', 'silver', 'copper'],
          description: 'Tipo de moeda estrito: "gold" (ouro/PO), "silver" (prata/PP) ou "copper" (cobre/PC).'
        },
        action: {
          type: 'string',
          enum: ['add', 'spend', 'set'],
          description: '"add" para ganhar moedas, "spend" para gastar moedas, ou "set" para definir o valor exato.'
        },
        amount: {
          type: 'number',
          description: 'Quantidade de moedas (número inteiro positivo maior ou igual a 0).'
        },
        reason: {
          type: 'string',
          description: 'Motivo da transação para o histórico (ex: "Compra de espada de ferro", "Recompensa da guilda").'
        }
      },
      required: ['coin', 'action', 'amount']
    }
  },
  {
    name: 'manage_mana',
    description: 'Gerencia as reservas de mana (física/vigor, mental/foco, social/graça) gastando pontos, recuperando pontos ou restaurando tudo.',
    parameters: {
      type: 'object',
      properties: {
        pool: {
          type: 'string',
          enum: ['physical', 'mental', 'social', 'all'],
          description: 'Reserva de mana: "physical" (física/vigor), "mental" (mental/foco), "social" (social/graça) ou "all" (todas as reservas).'
        },
        action: {
          type: 'string',
          enum: ['spend', 'recover', 'restore_all', 'set_available'],
          description: '"spend" para gastar mana, "recover" para recuperar mana gasta, "restore_all" para encher totalmente, ou "set_available" para definir pontos disponíveis.'
        },
        amount: {
          type: 'number',
          description: 'Quantidade de pontos de mana a gastar/recuperar.'
        }
      },
      required: ['pool', 'action']
    }
  },
  {
    name: 'modify_attribute',
    description: 'Modifica um atributo físico, mental ou social do personagem.',
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
          description: 'Nome do atributo em português ou chave em inglês: forca/strength, destreza/dexterity, agilidade/agility, constituicao/constitution, inteligencia/intelligence, percepcao/perception, raciocinio/reasoning, sabedoria/wisdom, empatia/empathy, manipulacao/manipulation, expressao/expression, resiliencia/resilience.'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase" para somar, "decrease" para subtrair, ou "set" para fixar o valor.'
        },
        value: {
          type: 'number',
          description: 'Valor a alterar ou definir (número não-negativo).'
        }
      },
      required: ['group', 'name', 'action', 'value']
    }
  },
  {
    name: 'modify_skill',
    description: 'Modifica uma perícia física, mental ou social (nível de 0 a 5 pontos).',
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
          description: 'Nome da perícia (ex: armas brancas/melee, armas de fogo/firearms, arquearia/archery, arremesso/throwing, briga/brawl, combate/combat, furtividade/stealth, prontidao/alertness, academicos/academics, armadilhas/traps, intuicao/intuition, investigacao/investigation, medicina/medicine, ocultismo/occultism, seguranca/security, sobrevivencia/survival, barganha/bargain, adestramento/taming, etiqueta/etiquette, intimidacao/intimidation, labia/smoothTalk, lideranca/leadership, cavalgar/riding, seducao/seduction).'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase" para somar, "decrease" para subtrair, "set" para definir.'
        },
        value: {
          type: 'number',
          description: 'Valor (de 0 a 5 pontos).'
        }
      },
      required: ['group', 'name', 'action', 'value']
    }
  },
  {
    name: 'modify_personality',
    description: 'Altera os valores da tríade de Personalidade: Coragem, Convicção ou Serenidade (escala de 1 a 5).',
    parameters: {
      type: 'object',
      properties: {
        trait: {
          type: 'string',
          enum: ['courage', 'conviction', 'serenity'],
          description: 'Qual virtude alterar: "courage" (Coragem), "conviction" (Convicção) ou "serenity" (Serenidade).'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase" para somar, "decrease" para subtrair, "set" para definir.'
        },
        value: {
          type: 'number',
          description: 'Quantidade (escala 1 a 5).'
        }
      },
      required: ['trait', 'action', 'value']
    }
  },
  {
    name: 'modify_alignment',
    description: 'Ajusta as barras de Alinhamento: altruísmo vs individualismo, lógica vs emoção, integridade vs corrupção (0 a 100%).',
    parameters: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['altruism', 'logic', 'integrity'],
          description: '"altruism" (Altruísmo), "logic" (Lógica) ou "integrity" (Integridade).'
        },
        value: {
          type: 'number',
          description: 'Porcentagem de 0 a 100.'
        }
      },
      required: ['field', 'value']
    }
  },
  {
    name: 'modify_domain',
    description: 'Altera o nível de um Domínio Elemental de Magia (Água, Ar, Ânima, Fogo, Terra, de 0 a 5).',
    parameters: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: ['water', 'air', 'anima', 'fire', 'earth'],
          description: 'Elemento do Domínio: "water" (Água), "air" (Ar), "anima" (Ânima), "fire" (Fogo) ou "earth" (Terra).'
        },
        action: {
          type: 'string',
          enum: ['increase', 'decrease', 'set'],
          description: '"increase", "decrease" ou "set".'
        },
        value: {
          type: 'number',
          description: 'Nível (0 a 5).'
        }
      },
      required: ['domain', 'action', 'value']
    }
  },
  {
    name: 'manage_health',
    description: 'Aplica ferimentos ou cura partes do corpo (cabeça, torso, braço esquerdo, braço direito, perna esquerda, perna direita).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['heal_all', 'heal_part', 'apply_damage'],
          description: '"heal_all" para curar todos os ferimentos, "heal_part" para curar parte específica, "apply_damage" para causar ferimento.'
        },
        body_part: {
          type: 'string',
          enum: ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'],
          description: 'Parte do corpo.'
        },
        damage_type: {
          type: 'string',
          enum: ['none', 'simple', 'lethal', 'aggravated'],
          description: 'Tipo de ferimento: "simple" (simples), "lethal" (letal), "aggravated" (agravado) ou "none" (nenhum).'
        },
        slots_count: {
          type: 'number',
          description: 'Quantidade de caixas de ferimento afetadas (padrão 1).'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_inventory_item',
    description: 'Adiciona, remove ou equipa/desequipa um item no inventário (armas, armaduras, projéteis, acessórios ou itens gerais).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'remove', 'equip', 'unequip'],
          description: 'Ação com o item: "add" para colocar, "remove" para jogar fora, "equip" para vestir/empunhar, "unequip" para desequipar.'
        },
        category: {
          type: 'string',
          enum: ['weapon', 'armor', 'projectile', 'accessory', 'general'],
          description: 'Categoria do item.'
        },
        name: {
          type: 'string',
          description: 'Nome do item (ex: "Espada Longa", "Armadura de Couro", "Poção de Cura").'
        },
        quantity: {
          type: 'number',
          description: 'Quantidade do item (para projéteis e itens gerais).'
        },
        description: {
          type: 'string',
          description: 'Descrição ou detalhes adicionais do item.'
        },
        slot: {
          type: 'string',
          description: 'Slot de equipamento se aplicável (main_hand, off_hand, chest, head, etc).'
        }
      },
      required: ['action', 'name']
    }
  },
  {
    name: 'manage_flow_patron',
    description: 'Ajusta nível, pontos de vida (HP 0-10) ou notas do Fluxo e do Patrono.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['fluxo', 'patrono'],
          description: 'Alvo: "fluxo" ou "patrono".'
        },
        action: {
          type: 'string',
          enum: ['set_hp', 'adjust_hp', 'set_level', 'adjust_level', 'update_info'],
          description: 'Ação a executar.'
        },
        value: {
          type: 'number',
          description: 'Novo valor numérico ou delta.'
        },
        name: {
          type: 'string',
          description: 'Nome da entidade ou entidade invocada.'
        },
        notes: {
          type: 'string',
          description: 'Anotações sobre a entidade.'
        }
      },
      required: ['target', 'action']
    }
  },
  {
    name: 'manage_custom_skill',
    description: 'Adiciona, remove ou altera uma perícia customizada (Treinamentos, Ciências ou Artes).',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['treinamentos', 'ciencias', 'artes'],
          description: 'Categoria da perícia customizada.'
        },
        action: {
          type: 'string',
          enum: ['add', 'update', 'remove'],
          description: '"add", "update" ou "remove".'
        },
        name: {
          type: 'string',
          description: 'Nome da perícia (ex: "Alquimia Herbórea", "Dança das Lâminas").'
        },
        value: {
          type: 'number',
          description: 'Pontuação de 0 a 5.'
        }
      },
      required: ['category', 'action', 'name']
    }
  },
  {
    name: 'manage_identity',
    description: 'Atualiza informações cadastrais do personagem (nome, idade, altura, peso, cabelos, olhos, pele, ideais, origem).',
    parameters: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['name', 'age', 'height', 'weight', 'hair', 'eyes', 'skin', 'ideals', 'origin'],
          description: 'Campo da identidade.'
        },
        value: {
          type: 'string',
          description: 'Novo valor textual.'
        }
      },
      required: ['field', 'value']
    }
  },
  {
    name: 'roll_dice',
    description: 'Rola uma expressão de dados de RPG (ex: "1d20", "2d10+4", "3d6-1") e calcula o resultado detalhado com somatório.',
    parameters: {
      type: 'object',
      properties: {
        formula: {
          type: 'string',
          description: 'Fórmula de dados (ex: "1d20+5", "2d10", "4d6+2").'
        },
        reason: {
          type: 'string',
          description: 'Motivo ou contexto do teste (ex: "Ataque com arco", "Teste de Percepção").'
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
  // Always safely parse args using try/catch
  const args = typeof rawArgs === 'string' ? safeJsonParse(rawArgs, {}) : (rawArgs || {});
  const undoData = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);
  const updatedData = safeJsonParse<CharacterData>(JSON.stringify(currentData), currentData);

  try {
    switch (toolName) {
      // 1. MANAGE CURRENCY
      case 'manage_currency': {
        const { coin, action, amount, reason } = args;

        // Strict coin verification
        const normalizedCoin = normalizeCoinType(coin);
        if (!normalizedCoin) {
          return {
            success: false,
            message: `❌ Tipo de moeda inválido: "${coin}". O sistema Arcana aceita estritamente: Ouro (gold / PO), Prata (silver / PP) ou Cobre (copper / PC).`
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

        // Add history transaction
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

      // 2. MANAGE MANA
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

        return { success: false, message: `Ação de mana não reconhecida: ${action}` };
      }

      // 3. MODIFY ATTRIBUTE
      case 'modify_attribute': {
        const { group, name, action, value } = args;
        const validGroup: 'physical' | 'mental' | 'social' =
          group === 'mental' ? 'mental' : group === 'social' ? 'social' : 'physical';

        // Map Portuguese and English names to valid keys
        const attrMap: Record<string, string> = {
          forca: 'strength',
          strength: 'strength',
          destreza: 'dexterity',
          dexterity: 'dexterity',
          agilidade: 'agility',
          agility: 'agility',
          constituicao: 'constitution',
          constitution: 'constitution',
          inteligencia: 'intelligence',
          intelligence: 'intelligence',
          intelecto: 'intelligence',
          percepcao: 'perception',
          perception: 'perception',
          raciocinio: 'reasoning',
          reasoning: 'reasoning',
          sabedoria: 'wisdom',
          wisdom: 'wisdom',
          empatia: 'empathy',
          empathy: 'empathy',
          manipulacao: 'manipulation',
          manipulation: 'manipulation',
          expressao: 'expression',
          expression: 'expression',
          resiliencia: 'resilience',
          resilience: 'resilience'
        };

        const key = attrMap[String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
        if (!key) {
          return { success: false, message: `❌ Atributo "${name}" não foi encontrado no sistema.` };
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

      // 4. MODIFY SKILL
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
          ocultismo: 'ocultism', occultism: 'ocultism', ocultism: 'ocultism',
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

      // 5. MODIFY PERSONALITY
      case 'modify_personality': {
        const { trait, action, value } = args;
        const validTrait: 'courage' | 'conviction' | 'serenity' =
          trait === 'conviction' || trait === 'conviccao'
            ? 'conviction'
            : trait === 'serenity' || trait === 'serenidade'
            ? 'serenity'
            : 'courage';

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

      // 6. MODIFY ALIGNMENT
      case 'modify_alignment': {
        const { field, value } = args;
        const validField: 'altruism' | 'logic' | 'integrity' =
          field === 'logic' || field === 'logica'
            ? 'logic'
            : field === 'integrity' || field === 'integridade'
            ? 'integrity'
            : 'altruism';

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

      // 7. MODIFY DOMAIN
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

      // 8. MANAGE HEALTH
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
            damage_type === 'lethal' || damage_type === 'letal' ? 'lethal' :
            damage_type === 'simple' || damage_type === 'simples' ? 'simple' : 'simple';

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

        return { success: false, message: `Ação de vida não suportada: ${action}` };
      }

      // 9. MANAGE INVENTORY ITEM
      case 'manage_inventory_item': {
        const { action, category, name, quantity, description, slot } = args;
        const itemName = String(name || '').trim();
        if (!itemName) {
          return { success: false, message: 'Nome do item não fornecido.' };
        }

        if (action === 'add') {
          const newId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          if (category === 'weapon') {
            updatedData.inventory.weapons.push({
              id: newId,
              name: itemName,
              category: 'weapon',
              equipped: false,
              thrust: { damage: '1d6', type: 'per', ap: 0, precision: 0 },
              swing: { damage: '1d8', type: 'cor', ap: 0, precision: 0 },
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
              resistance: 10,
              durabilityMax: 20,
              durabilityCurrent: 20,
              size: 'm',
              weight: 4000,
              location: 'Mochila',
              description: description || ''
            });
          } else {
            // General item by default
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
        }

        return { success: false, message: `Ação de inventário não suportada: ${action}` };
      }

      // 10. MANAGE FLOW & PATRON
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

      // 11. MANAGE CUSTOM SKILL
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
              message: `🎯 **Perícia Customizada**: "${skillName}" agora está com **${skillVal}** pontos.`
            };
          }
        }

        return { success: false, message: `Perícia customizada "${skillName}" não encontrada.` };
      }

      // 12. MANAGE IDENTITY
      case 'manage_identity': {
        const { field, value } = args;
        const validFields: (keyof typeof updatedData.identity)[] = [
          'name', 'age', 'height', 'weight', 'hair', 'eyes', 'skin', 'ideals', 'origin'
        ];

        if (validFields.includes(field as any)) {
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
        return { success: false, message: `Campo de identidade inválido: ${field}` };
      }

      // 13. ROLL DICE
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
